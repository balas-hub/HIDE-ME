/**
 * Parse RIFF WAV buffer and locate format and data chunks
 * @param {Buffer} buffer
 * @returns {Object} WAV metadata and chunk offsets
 */
export function parseWav(buffer) {
  if (buffer.length < 44) {
    throw new Error('Invalid WAV file: buffer too small (less than 44 bytes)');
  }

  const riff = buffer.toString('ascii', 0, 4);
  if (riff !== 'RIFF') {
    throw new Error('Invalid WAV file: missing RIFF header');
  }

  const wave = buffer.toString('ascii', 8, 12);
  if (wave !== 'WAVE') {
    throw new Error('Invalid WAV file: missing WAVE format identifier');
  }

  let offset = 12;
  let fmtChunk = null;
  let dataChunk = null;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkDataOffset = offset + 8;

    if (chunkId === 'fmt ') {
      const audioFormat = buffer.readUInt16LE(chunkDataOffset);
      const numChannels = buffer.readUInt16LE(chunkDataOffset + 2);
      const sampleRate = buffer.readUInt32LE(chunkDataOffset + 4);
      const byteRate = buffer.readUInt32LE(chunkDataOffset + 8);
      const blockAlign = buffer.readUInt16LE(chunkDataOffset + 12);
      const bitsPerSample = buffer.readUInt16LE(chunkDataOffset + 14);

      fmtChunk = {
        audioFormat,
        numChannels,
        sampleRate,
        byteRate,
        blockAlign,
        bitsPerSample,
        offset: chunkDataOffset,
        size: chunkSize
      };
    } else if (chunkId === 'data') {
      dataChunk = {
        offset: chunkDataOffset,
        size: chunkSize
      };
      break; // Usually data chunk is what we need
    }

    // Move to next chunk (chunks are padded to even number of bytes)
    offset += 8 + chunkSize + (chunkSize % 2);
  }

  if (!fmtChunk) {
    throw new Error('Invalid WAV file: missing fmt chunk');
  }
  if (!dataChunk) {
    throw new Error('Invalid WAV file: missing data chunk');
  }

  if (fmtChunk.audioFormat !== 1) {
    throw new Error(`Unsupported WAV format (${fmtChunk.audioFormat}). Only PCM uncompressed WAV is supported.`);
  }

  const bytesPerSample = fmtChunk.bitsPerSample / 8;
  const totalSamples = Math.floor(dataChunk.size / bytesPerSample);
  const durationSeconds = fmtChunk.byteRate > 0 ? (dataChunk.size / fmtChunk.byteRate) : 0;
  
  // Capacity: using 1 LSB bit per sample.
  // 8 samples needed per 1 byte of payload.
  const maxPayloadBytes = Math.floor(totalSamples / 8);

  return {
    fmt: fmtChunk,
    data: dataChunk,
    totalSamples,
    durationSeconds,
    maxPayloadBytes
  };
}

/**
 * Generate a clean 16-bit PCM WAV buffer from sample data
 * @param {Int16Array} samples 
 * @param {number} sampleRate 
 * @param {number} numChannels 
 * @returns {Buffer}
 */
export function createWavBuffer(samples, sampleRate = 44100, numChannels = 1) {
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size
  buffer.writeUInt16LE(1, 20);  // AudioFormat (PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write samples
  for (let i = 0; i < samples.length; i++) {
    buffer.writeInt16LE(samples[i], 44 + i * 2);
  }

  return buffer;
}
