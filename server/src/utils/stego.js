import { parseWav } from './wavHelper.js';
import { crc32, encryptText, decryptText } from './crypto.js';

const MAGIC_HEADER = 'STEG'; // 4 bytes

/**
 * Embed secret text into a WAV buffer using LSB steganography
 * @param {Buffer} wavBuffer Original WAV file buffer
 * @param {string} secretText The text to hide
 * @param {string|null} passphrase Optional passphrase for AES-256 encryption
 * @returns {{ stegoWavBuffer: Buffer, isEncrypted: boolean, payloadSize: number }}
 */
export function embedSecret(wavBuffer, secretText, passphrase = null) {
  if (!secretText || secretText.trim().length === 0) {
    throw new Error('Secret text cannot be empty.');
  }

  const { fmt, data, totalSamples, maxPayloadBytes } = parseWav(wavBuffer);
  const bytesPerSample = fmt.bitsPerSample / 8;

  let payloadBuffer;
  let isEncrypted = false;
  let salt = Buffer.alloc(0);
  let iv = Buffer.alloc(0);

  if (passphrase && passphrase.trim().length > 0) {
    isEncrypted = true;
    const encrypted = encryptText(secretText, passphrase.trim());
    payloadBuffer = encrypted.ciphertext;
    salt = encrypted.salt;
    iv = encrypted.iv;
  } else {
    payloadBuffer = Buffer.from(secretText, 'utf8');
  }

  // Calculate CRC32 of payload for integrity verification
  const checksum = crc32(payloadBuffer);

  // Construct packet:
  // [4B Magic: 'STEG'] [1B Flags] [4B Length] [4B Checksum] [Optional 16B Salt + 16B IV] [Payload]
  const magicBuf = Buffer.from(MAGIC_HEADER, 'ascii');
  const flagBuf = Buffer.from([isEncrypted ? 0x01 : 0x00]);
  
  const lengthBuf = Buffer.alloc(4);
  lengthBuf.writeUInt32BE(payloadBuffer.length, 0);

  const checksumBuf = Buffer.alloc(4);
  checksumBuf.writeUInt32BE(checksum, 0);

  const headerParts = [magicBuf, flagBuf, lengthBuf, checksumBuf];
  if (isEncrypted) {
    headerParts.push(salt, iv);
  }

  const packet = Buffer.concat([...headerParts, payloadBuffer]);
  const requiredSamples = packet.length * 8;

  if (requiredSamples > totalSamples) {
    const maxChars = Math.max(0, Math.floor(maxPayloadBytes - (isEncrypted ? 45 : 13)));
    throw new Error(
      `Audio capacity exceeded! Audio can hold up to ~${maxChars} characters, but payload requires ${packet.length} bytes (${requiredSamples} samples).`
    );
  }

  // Clone buffer so we do not mutate original
  const stegoWavBuffer = Buffer.from(wavBuffer);

  // Embed bit by bit into sample LSBs
  let sampleCounter = 0;
  for (let byteIdx = 0; byteIdx < packet.length; byteIdx++) {
    const currentByte = packet[byteIdx];
    for (let bitIdx = 7; bitIdx >= 0; bitIdx--) {
      const bit = (currentByte >> bitIdx) & 1;
      const sampleOffset = data.offset + sampleCounter * bytesPerSample;
      // Modify LSB of byte containing the sample's lowest bits
      stegoWavBuffer[sampleOffset] = (stegoWavBuffer[sampleOffset] & ~1) | bit;
      sampleCounter++;
    }
  }

  return {
    stegoWavBuffer,
    isEncrypted,
    payloadSize: payloadBuffer.length,
    bitsEmbedded: requiredSamples
  };
}

/**
 * Extract secret text from a WAV buffer using LSB steganography
 * @param {Buffer} wavBuffer WAV file buffer
 * @param {string|null} passphrase Optional passphrase for AES-256 decryption
 * @returns {{ secretText: string, isEncrypted: boolean, payloadSize: number }}
 */
export function extractSecret(wavBuffer, passphrase = null) {
  const { fmt, data, totalSamples } = parseWav(wavBuffer);
  const bytesPerSample = fmt.bitsPerSample / 8;

  // Helper to read N bytes from sample LSBs starting at given sample index
  function readBytes(startSampleIdx, numBytes) {
    const result = Buffer.alloc(numBytes);
    let sampleIdx = startSampleIdx;

    for (let byteIdx = 0; byteIdx < numBytes; byteIdx++) {
      let byteVal = 0;
      for (let bitIdx = 7; bitIdx >= 0; bitIdx--) {
        if (sampleIdx >= totalSamples) {
          throw new Error('Unexpected end of audio samples while reading hidden data.');
        }
        const sampleOffset = data.offset + sampleIdx * bytesPerSample;
        const bit = wavBuffer[sampleOffset] & 1;
        byteVal = (byteVal << 1) | bit;
        sampleIdx++;
      }
      result[byteIdx] = byteVal;
    }

    return { buffer: result, nextSampleIdx: sampleIdx };
  }

  // 1. Read base header: Magic(4) + Flag(1) + Length(4) + Checksum(4) = 13 bytes (104 samples)
  if (totalSamples < 13 * 8) {
    throw new Error('Audio file is too short to contain an AudioStego secret message.');
  }

  const baseHeader = readBytes(0, 13);
  const magic = baseHeader.buffer.toString('ascii', 0, 4);

  if (magic !== MAGIC_HEADER) {
    throw new Error('No hidden message found. (Magic header "STEG" not detected).');
  }

  const flag = baseHeader.buffer[4];
  const isEncrypted = (flag & 0x01) === 0x01;
  const payloadLength = baseHeader.buffer.readUInt32BE(5);
  const expectedChecksum = baseHeader.buffer.readUInt32BE(9);

  // Sanity check length
  if (payloadLength <= 0 || payloadLength > totalSamples / 8) {
    throw new Error('Invalid or corrupted payload length in audio file.');
  }

  let currentSampleIdx = baseHeader.nextSampleIdx;
  let salt = null;
  let iv = null;

  if (isEncrypted) {
    // Read 16B Salt + 16B IV = 32 bytes (256 samples)
    const cryptoHeader = readBytes(currentSampleIdx, 32);
    salt = cryptoHeader.buffer.subarray(0, 16);
    iv = cryptoHeader.buffer.subarray(16, 32);
    currentSampleIdx = cryptoHeader.nextSampleIdx;
  }

  // Read payload bytes
  const payloadResult = readBytes(currentSampleIdx, payloadLength);
  const payloadBuffer = payloadResult.buffer;

  // Verify CRC32
  const actualChecksum = crc32(payloadBuffer);
  if (actualChecksum !== expectedChecksum) {
    throw new Error('Checksum mismatch! Audio data may be corrupted or modified.');
  }

  let secretText;
  if (isEncrypted) {
    if (!passphrase || passphrase.trim().length === 0) {
      throw new Error('This audio message is password-protected. Please provide the secret passphrase.');
    }
    try {
      secretText = decryptText(payloadBuffer, passphrase.trim(), salt, iv);
    } catch {
      throw new Error('Incorrect passphrase or corrupted secret payload.');
    }
  } else {
    secretText = payloadBuffer.toString('utf8');
  }

  return {
    secretText,
    isEncrypted,
    payloadSize: payloadLength
  };
}
