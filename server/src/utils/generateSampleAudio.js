import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWavBuffer } from './wavHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate a 5-second acoustic melody sine wave at 44.1kHz
const sampleRate = 44100;
const durationSeconds = 5;
const totalSamples = sampleRate * durationSeconds;
const samples = new Int16Array(totalSamples);

// Notes in Hz (C4, E4, G4, B4, C5)
const notes = [261.63, 329.63, 392.0, 493.88, 523.25];

for (let i = 0; i < totalSamples; i++) {
  const t = i / sampleRate;
  const noteIdx = Math.floor(t) % notes.length;
  const freq = notes[noteIdx];
  // Soft harmonic decay
  const envelope = Math.max(0.1, 1 - (t % 1) * 0.7);
  const sampleVal = Math.sin(2 * Math.PI * freq * t) * 14000 * envelope;
  samples[i] = Math.floor(sampleVal);
}

const wavBuffer = createWavBuffer(samples, sampleRate, 1);
const outPath = path.join(__dirname, '..', '..', 'sample_melody.wav');
fs.writeFileSync(outPath, wavBuffer);

console.log(`🎵 Generated demo audio file: ${outPath} (${(wavBuffer.length / 1024).toFixed(1)} KB, 5.0 seconds)`);
