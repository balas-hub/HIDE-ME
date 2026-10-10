import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

// Set ffmpeg binary path from installer
if (ffmpegInstaller && ffmpegInstaller.path) {
  ffmpeg.setFfmpegPath(ffmpegInstaller.path);
}

/**
 * Convert any audio buffer (MP3, AAC, OGG, etc.) to 16-bit 44.1kHz PCM WAV
 * @param {Buffer} inputBuffer 
 * @param {string} originalName 
 * @returns {Promise<Buffer>}
 */
export async function convertToWav(inputBuffer, originalName = 'audio.mp3') {
  const ext = path.extname(originalName).toLowerCase();
  
  // If it's already a WAV file, check if it's PCM
  if (ext === '.wav') {
    try {
      // If it starts with RIFF and has WAVE, return as-is
      if (inputBuffer.length > 44 &&
          inputBuffer.toString('ascii', 0, 4) === 'RIFF' &&
          inputBuffer.toString('ascii', 8, 12) === 'WAVE') {
        return inputBuffer;
      }
    } catch {
      // Fall through to convert
    }
  }

  const tempId = crypto.randomBytes(8).toString('hex');
  const tempInPath = path.join(os.tmpdir(), `input_${tempId}${ext || '.mp3'}`);
  const tempOutPath = path.join(os.tmpdir(), `output_${tempId}.wav`);

  try {
    await fs.promises.writeFile(tempInPath, inputBuffer);

    await new Promise((resolve, reject) => {
      ffmpeg(tempInPath)
        .toFormat('wav')
        .audioCodec('pcm_s16le')
        .audioFrequency(44100)
        .on('error', (err) => {
          reject(new Error(`Audio conversion failed: ${err.message}`));
        })
        .on('end', () => {
          resolve();
        })
        .save(tempOutPath);
    });

    const wavBuffer = await fs.promises.readFile(tempOutPath);
    return wavBuffer;
  } finally {
    // Clean up temporary files
    try {
      if (fs.existsSync(tempInPath)) await fs.promises.unlink(tempInPath);
    } catch {}
    try {
      if (fs.existsSync(tempOutPath)) await fs.promises.unlink(tempOutPath);
    } catch {}
  }
}
