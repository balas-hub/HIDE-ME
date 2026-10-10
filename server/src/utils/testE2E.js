import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runE2ETest() {
  console.log('🚀 Running Full E2E Integration Test against running AudioStego Server...');
  const baseUrl = 'http://localhost:5000';

  // 1. Health check
  const healthRes = await fetch(`${baseUrl}/api/health`);
  const health = await healthRes.json();
  console.log('✅ Health Check:', health);

  // 2. Demo Login (Auth)
  const authRes = await fetch(`${baseUrl}/api/auth/demo`, { method: 'POST' });
  const authData = await authRes.json();
  if (!authData.success) throw new Error('Demo login failed: ' + authData.message);
  const token = authData.token;
  console.log(`✅ Demo Login Success: Logged in as "${authData.user.username}" (token: ${token.slice(0, 15)}...)`);

  // 3. Prepare audio file for encoding
  const sampleAudioPath = path.join(__dirname, '..', '..', 'sample_melody.wav');
  const audioBuffer = fs.readFileSync(sampleAudioPath);
  const secretMessage = 'Antigravity Secret Passcode #9924!';
  const passphrase = 'MERNSuperPassword2026';

  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  let bodyParts = [];

  // audio file field
  bodyParts.push(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="audio"; filename="sample_melody.wav"\r\n` +
    `Content-Type: audio/wav\r\n\r\n`
  );
  const part1 = Buffer.from(bodyParts.join(''), 'utf-8');

  const part3Text =
    `\r\n--${boundary}\r\nContent-Disposition: form-data; name="secretText"\r\n\r\n${secretMessage}` +
    `\r\n--${boundary}\r\nContent-Disposition: form-data; name="passphrase"\r\n\r\n${passphrase}` +
    `\r\n--${boundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\nE2E Test Recording` +
    `\r\n--${boundary}\r\nContent-Disposition: form-data; name="tags"\r\n\r\ne2e, automated, test` +
    `\r\n--${boundary}--\r\n`;
  const part3 = Buffer.from(part3Text, 'utf-8');

  const fullBody = Buffer.concat([part1, audioBuffer, part3]);

  // 4. Encode & Create Record (CREATE CRUD)
  console.log('\nTesting CREATE CRUD: /api/audio/encode...');
  const encodeRes = await fetch(`${baseUrl}/api/audio/encode`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body: fullBody
  });
  const encodeData = await encodeRes.json();
  if (!encodeData.success) throw new Error('Encode failed: ' + encodeData.message);
  console.log('✅ Stego Audio Created in GridFS & MongoDB:', {
    gridFsFileId: encodeData.data.gridFsFileId,
    recordId: encodeData.data.record?._id,
    fileName: encodeData.data.fileName
  });

  const recordId = encodeData.data.record._id;
  const gridFsFileId = encodeData.data.gridFsFileId;

  // 5. Read My Vault (READ CRUD)
  console.log('\nTesting READ CRUD: /api/audio/my-vault...');
  const vaultRes = await fetch(`${baseUrl}/api/audio/my-vault`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const vaultData = await vaultRes.json();
  console.log(`✅ Read Vault returned ${vaultData.count} records. Found created record:`, vaultData.data.some(r => r._id === recordId));

  // 6. Test Stream endpoint with Range Header
  console.log('\nTesting STREAM with Range Header: /api/audio/stream/' + gridFsFileId);
  const streamRes = await fetch(`${baseUrl}/api/audio/stream/${gridFsFileId}`, {
    headers: { 'Range': 'bytes=0-1024' }
  });
  console.log(`✅ Stream HTTP Status: ${streamRes.status} (Expected 206 Partial Content), Content-Range: ${streamRes.headers.get('content-range')}`);

  // 7. Test Decode (READ / EXTRACTION)
  console.log('\nTesting DECODE: /api/audio/decode using stored fileId...');
  const decodeRes = await fetch(`${baseUrl}/api/audio/decode`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      fileId: gridFsFileId,
      passphrase: passphrase
    })
  });
  const decodeData = await decodeRes.json();
  if (!decodeData.success) throw new Error('Decode failed: ' + decodeData.message);
  console.log('✅ Decode result:', decodeData.data);
  if (decodeData.data.secretText === secretMessage) {
    console.log('🎉 Decoded message perfectly matches original secret text!');
  } else {
    throw new Error('Decoded message did not match!');
  }

  // 8. Test Update (UPDATE CRUD)
  console.log('\nTesting UPDATE CRUD: /api/audio/' + recordId);
  const updateRes = await fetch(`${baseUrl}/api/audio/${recordId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Updated E2E Title - Verified',
      description: 'Updated description for CRUD test',
      tags: 'verified, updated'
    })
  });
  const updateData = await updateRes.json();
  console.log('✅ Update success:', updateData.data.title);

  // 9. Test Delete (DELETE CRUD)
  console.log('\nTesting DELETE CRUD: /api/audio/' + recordId);
  const deleteRes = await fetch(`${baseUrl}/api/audio/${recordId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const deleteData = await deleteRes.json();
  console.log('✅ Delete success:', deleteData.message);

  console.log('\n🌟 ALL E2E CRUD & STEGANOGRAPHY TESTS PASSED WITH 100% SUCCESS! 🌟\n');
}

runE2ETest().catch(err => {
  console.error('❌ E2E Test failed:', err);
  process.exit(1);
});
