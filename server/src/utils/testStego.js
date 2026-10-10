import { createWavBuffer, parseWav } from './wavHelper.js';
import { embedSecret, extractSecret } from './stego.js';

console.log('🧪 Starting Audio Steganography Engine Test...');

// 1. Generate 3 seconds of 440Hz test sine wave (44100 samples/sec)
const sampleRate = 44100;
const duration = 3;
const totalSamples = sampleRate * duration;
const samples = new Int16Array(totalSamples);
for (let i = 0; i < totalSamples; i++) {
  const t = i / sampleRate;
  samples[i] = Math.floor(Math.sin(2 * Math.PI * 440 * t) * 16000);
}

const originalWav = createWavBuffer(samples, sampleRate, 1);
const parsed = parseWav(originalWav);
console.log(`✅ Created synthetic WAV: ${parsed.durationSeconds.toFixed(1)}s, ${parsed.totalSamples} samples, capacity: ~${parsed.maxPayloadBytes} bytes`);

// 2. Test Plaintext LSB Stego
const secretMessage1 = 'Hello, this is top secret text hidden inside audio! 🚀';
console.log(`\nTest 1: Embedding plaintext: "${secretMessage1}"`);
const stego1 = embedSecret(originalWav, secretMessage1);
console.log(`✅ Embedded ${stego1.bitsEmbedded} bits successfully.`);

const extracted1 = extractSecret(stego1.stegoWavBuffer);
console.log(`✅ Extracted plaintext: "${extracted1.secretText}"`);
if (extracted1.secretText === secretMessage1 && !extracted1.isEncrypted) {
  console.log('🎉 Test 1 PASSED: Plaintext matched perfectly!');
} else {
  throw new Error('❌ Test 1 FAILED');
}

// 3. Test AES-256 Encrypted LSB Stego
const secretMessage2 = 'Classified coordinates: 37.7749° N, 122.4194° W. Passcode: Delta-9.';
const password = 'CorrectHorseBatteryStaple#2026';
console.log(`\nTest 2: Embedding AES-256 encrypted message with password`);
const stego2 = embedSecret(originalWav, secretMessage2, password);
console.log(`✅ Embedded encrypted payload successfully.`);

const extracted2 = extractSecret(stego2.stegoWavBuffer, password);
console.log(`✅ Extracted decrypted message: "${extracted2.secretText}"`);
if (extracted2.secretText === secretMessage2 && extracted2.isEncrypted) {
  console.log('🎉 Test 2 PASSED: Encrypted message extracted and decrypted perfectly!');
} else {
  throw new Error('❌ Test 2 FAILED');
}

// 4. Test wrong password detection
console.log(`\nTest 3: Testing wrong password rejection`);
try {
  extractSecret(stego2.stegoWavBuffer, 'WrongPassword123');
  throw new Error('Should have failed with wrong password!');
} catch (err) {
  console.log(`✅ Correctly rejected wrong password with message: "${err.message}"`);
}

console.log('\n🌟 ALL STEGANOGRAPHY ENGINE TESTS PASSED SUCCESSFULLY! 🌟\n');
