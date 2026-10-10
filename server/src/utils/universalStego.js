import JSZip from 'jszip';
import path from 'path';
import { crc32, encryptText, decryptText } from './crypto.js';
import { embedSecret as embedAudioSecret, extractSecret as extractAudioSecret } from './stego.js';
import { convertToWav } from './ffmpeg.js';
import { parseWav } from './wavHelper.js';

const MAGIC_HEADER = 'HIDEME__'; // 8 bytes
const MAGIC_FOOTER = 'ENDHIDEME'; // 9 bytes
const LEGACY_HEADER = 'ANTIGRAV';

export const CARRIER_TYPES = {
  AUDIO: 'audio',
  VIDEO: 'video',
  PDF: 'pdf',
  DOCX: 'docx',
  PPTX: 'pptx',
  IMAGE: 'image',
  GENERIC: 'generic'
};

/**
 * Determine carrier category from filename or mimetype
 */
export function detectCarrierType(filename = '', mimetype = '') {
  const ext = path.extname(filename).toLowerCase();
  
  if (['.wav', '.mp3', '.ogg', '.aac', '.flac', '.m4a'].includes(ext) || mimetype.startsWith('audio/')) {
    return CARRIER_TYPES.AUDIO;
  }
  if (['.mp4', '.mkv', '.avi', '.mov', '.webm', '.flv', '.wmv'].includes(ext) || mimetype.startsWith('video/')) {
    return CARRIER_TYPES.VIDEO;
  }
  if (ext === '.pdf' || mimetype === 'application/pdf') {
    return CARRIER_TYPES.PDF;
  }
  if (['.docx', '.doc'].includes(ext) || mimetype.includes('wordprocessingml') || mimetype.includes('msword')) {
    return CARRIER_TYPES.DOCX;
  }
  if (['.pptx', '.ppt'].includes(ext) || mimetype.includes('presentationml') || mimetype.includes('powerpoint')) {
    return CARRIER_TYPES.PPTX;
  }
  if (['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif'].includes(ext) || mimetype.startsWith('image/')) {
    return CARRIER_TYPES.IMAGE;
  }
  return CARRIER_TYPES.GENERIC;
}

/**
 * Build serialized steganographic packet
 */
function createStegoPacket(secretText, passphrase = null, carrierType = 'generic') {
  let payloadBuffer;
  let isEncrypted = false;
  let salt = Buffer.alloc(0);
  let iv = Buffer.alloc(0);

  if (passphrase && passphrase.trim().length > 0) {
    isEncrypted = true;
    const enc = encryptText(secretText, passphrase.trim());
    payloadBuffer = enc.ciphertext;
    salt = enc.salt;
    iv = enc.iv;
  } else {
    payloadBuffer = Buffer.from(secretText, 'utf8');
  }

  const checksum = crc32(payloadBuffer);

  const magicBuf = Buffer.from(MAGIC_HEADER, 'ascii');
  const flagBuf = Buffer.from([isEncrypted ? 0x01 : 0x00]);
  
  const lengthBuf = Buffer.alloc(4);
  lengthBuf.writeUInt32BE(payloadBuffer.length, 0);

  const checksumBuf = Buffer.alloc(4);
  checksumBuf.writeUInt32BE(checksum, 0);

  const carrierBuf = Buffer.alloc(8);
  carrierBuf.write(carrierType.slice(0, 8), 0, 'ascii');

  const headerParts = [magicBuf, carrierBuf, flagBuf, lengthBuf, checksumBuf];
  if (isEncrypted) {
    headerParts.push(salt, iv);
  }

  const footerBuf = Buffer.from(MAGIC_FOOTER, 'ascii');
  return Buffer.concat([...headerParts, payloadBuffer, footerBuf]);
}

/**
 * Parse and unpack packet
 */
function unpackStegoPacket(packetBuffer, passphrase = null) {
  const magic = packetBuffer.toString('ascii', 0, 8);
  if (magic !== MAGIC_HEADER && magic !== LEGACY_HEADER) {
    throw new Error('No hidden text found in this file.');
  }

  const carrier = packetBuffer.toString('ascii', 8, 16).replace(/\0/g, '').trim();
  const flag = packetBuffer[16];
  const isEncrypted = (flag & 0x01) === 0x01;
  const payloadLength = packetBuffer.readUInt32BE(17);
  const expectedChecksum = packetBuffer.readUInt32BE(21);

  let currentOffset = 25;
  let salt = null;
  let iv = null;

  if (isEncrypted) {
    salt = packetBuffer.subarray(currentOffset, currentOffset + 16);
    iv = packetBuffer.subarray(currentOffset + 16, currentOffset + 32);
    currentOffset += 32;
  }

  const payloadBuffer = packetBuffer.subarray(currentOffset, currentOffset + payloadLength);
  const actualChecksum = crc32(payloadBuffer);

  if (actualChecksum !== expectedChecksum) {
    throw new Error('Verification failed: Data checksum does not match.');
  }

  let secretText;
  if (isEncrypted) {
    if (!passphrase || passphrase.trim().length === 0) {
      throw new Error('This file is password-protected. Please enter the password.');
    }
    try {
      secretText = decryptText(payloadBuffer, passphrase.trim(), salt, iv);
    } catch {
      throw new Error('Incorrect password.');
    }
  } else {
    secretText = payloadBuffer.toString('utf8');
  }

  return {
    secretText,
    isEncrypted,
    carrierType: carrier,
    payloadSize: payloadLength
  };
}

/**
 * Embed Secret into File
 */
export async function universalEmbed(fileBuffer, originalName, secretText, passphrase = null) {
  const carrierType = detectCarrierType(originalName);

  // 1. Audio: PCM WAV LSB
  if (carrierType === CARRIER_TYPES.AUDIO) {
    const ext = path.extname(originalName).toLowerCase();
    let pcmBuffer = fileBuffer;
    if (ext !== '.wav') {
      pcmBuffer = await convertToWav(fileBuffer, originalName);
    }
    const result = embedAudioSecret(pcmBuffer, secretText, passphrase);
    return {
      outputBuffer: result.stegoWavBuffer,
      outputName: `${path.basename(originalName, ext)}_hideme.wav`,
      carrierType: CARRIER_TYPES.AUDIO,
      mimeType: 'audio/wav',
      isEncrypted: result.isEncrypted,
      payloadSize: result.payloadSize
    };
  }

  // 2. Office Documents: DOCX, PPTX, XLSX
  if (carrierType === CARRIER_TYPES.DOCX || carrierType === CARRIER_TYPES.PPTX) {
    try {
      const zip = await JSZip.loadAsync(fileBuffer);
      const packet = createStegoPacket(secretText, passphrase, carrierType);

      const storagePath = carrierType === CARRIER_TYPES.DOCX
        ? 'word/customData/hideme_data.dat'
        : 'ppt/customData/hideme_data.dat';

      zip.file(storagePath, packet);

      const outputBuffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      const ext = path.extname(originalName);
      return {
        outputBuffer,
        outputName: `${path.basename(originalName, ext)}_hideme${ext}`,
        carrierType,
        mimeType: carrierType === CARRIER_TYPES.DOCX
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        isEncrypted: Boolean(passphrase && passphrase.trim().length > 0),
        payloadSize: Buffer.byteLength(secretText)
      };
    } catch (err) {
      throw new Error(`Failed to process ${carrierType.toUpperCase()} file: ${err.message}`);
    }
  }

  // 3. Video, PDF, Images
  const packet = createStegoPacket(secretText, passphrase, carrierType);
  const delimiter = Buffer.from('\n%%HIDEME_DATA_BLOCK%%\n', 'ascii');
  const outputBuffer = Buffer.concat([fileBuffer, delimiter, packet]);

  const ext = path.extname(originalName);
  return {
    outputBuffer,
    outputName: `${path.basename(originalName, ext)}_hideme${ext}`,
    carrierType,
    mimeType: carrierType === CARRIER_TYPES.PDF
      ? 'application/pdf'
      : carrierType === CARRIER_TYPES.VIDEO
      ? 'video/mp4'
      : 'application/octet-stream',
    isEncrypted: Boolean(passphrase && passphrase.trim().length > 0),
    payloadSize: Buffer.byteLength(secretText)
  };
}

/**
 * Extract Secret from File
 */
export async function universalExtract(fileBuffer, originalName = '', passphrase = null) {
  // 1. Check Office Documents
  try {
    const zip = await JSZip.loadAsync(fileBuffer);
    const possiblePaths = [
      'word/customData/hideme_data.dat',
      'ppt/customData/hideme_data.dat',
      'customData/hideme_data.dat',
      'word/customData/antigravity_stream.dat',
      'ppt/customData/antigravity_stream.dat'
    ];

    for (const p of possiblePaths) {
      const fileEntry = zip.file(p);
      if (fileEntry) {
        const packetBuf = await fileEntry.async('nodebuffer');
        return unpackStegoPacket(packetBuf, passphrase);
      }
    }
  } catch {}

  // 2. Check Delimiters (current and legacy)
  const delimiters = [
    Buffer.from('\n%%HIDEME_DATA_BLOCK%%\n', 'ascii'),
    Buffer.from('\n%%ANTIGRAVITY_SECURE_CARRIER%%\n', 'ascii')
  ];

  for (const delimiter of delimiters) {
    const delimIdx = fileBuffer.lastIndexOf(delimiter);
    if (delimIdx !== -1) {
      const packetBuf = fileBuffer.subarray(delimIdx + delimiter.length);
      if (packetBuf.length >= 25) {
        const magic = packetBuf.toString('ascii', 0, 8);
        if (magic === MAGIC_HEADER || magic === LEGACY_HEADER) {
          return unpackStegoPacket(packetBuf, passphrase);
        }
      }
    }
  }

  // 3. Check for Magic Header anywhere in file
  for (const mHeader of [MAGIC_HEADER, LEGACY_HEADER]) {
    const magicBuf = Buffer.from(mHeader, 'ascii');
    const magicIdx = fileBuffer.lastIndexOf(magicBuf);
    if (magicIdx !== -1) {
      const packetCandidate = fileBuffer.subarray(magicIdx);
      if (packetCandidate.length >= 25) {
        try {
          return unpackStegoPacket(packetCandidate, passphrase);
        } catch {}
      }
    }
  }

  // 4. Check for Audio LSB
  try {
    const audioResult = extractAudioSecret(fileBuffer, passphrase);
    return {
      secretText: audioResult.secretText,
      isEncrypted: audioResult.isEncrypted,
      carrierType: CARRIER_TYPES.AUDIO,
      payloadSize: audioResult.payloadSize
    };
  } catch (audioErr) {
    if (audioErr.message.includes('password-protected') || audioErr.message.includes('Incorrect passphrase') || audioErr.message.includes('password')) {
      throw audioErr;
    }
  }

  throw new Error('No hidden text found in this file.');
}
