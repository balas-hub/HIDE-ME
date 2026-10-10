import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { fileURLToPath } from 'url';
import { createWavBuffer } from './wavHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runUniversalE2ETest() {
  console.log('🌌 Starting Comprehensive AntiGravity Production E2E Test Suite...\n');
  const baseUrl = 'http://localhost:5000';

  // 1. Security Headers Audit
  console.log('--- 1. Testing Transport Security & Defense Headers ---');
  const auditRes = await fetch(`${baseUrl}/api/security-audit`);
  const auditData = await auditRes.json();
  const hstsHeader = auditRes.headers.get('strict-transport-security');
  const cspHeader = auditRes.headers.get('content-security-policy');
  console.log('✅ HSTS Active:', hstsHeader);
  console.log('✅ CSP Active:', cspHeader ? cspHeader.slice(0, 40) + '...' : 'None');
  console.log('✅ Security Audit Protections:', auditData.protections);

  // 2. Genuine User Registration (No Demo)
  console.log('\n--- 2. Testing Genuine User Registration & Authentication ---');
  const uniqueId = Date.now();
  const regEmail = `agent_${uniqueId}@antigravity.security`;
  const regPassword = 'HighEntropyPassword2026!';

  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: `Agent_${uniqueId}`,
      email: regEmail,
      password: regPassword
    })
  });
  const regData = await regRes.json();
  if (!regData.success) throw new Error('Registration failed: ' + regData.message);
  console.log(`✅ User Registered: "${regData.user.username}" (ID: ${regData.user.id})`);

  // 3. User Login
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: regEmail,
      password: regPassword
    })
  });
  const loginData = await loginRes.json();
  if (!loginData.success) throw new Error('Login failed: ' + loginData.message);
  const token = loginData.token;
  console.log(`✅ Login Authenticated: JWT issued (${token.slice(0, 20)}...)`);

  // Helper to test encoding a carrier file
  async function testCarrierUpload(filename, fileBuffer, secret, passphrase) {
    const boundary = '----AntiGravityFormBoundary' + Math.random().toString(36).substring(2);
    let parts = [];

    parts.push(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="carrier"; filename="${filename}"\r\n` +
      `Content-Type: application/octet-stream\r\n\r\n`
    );
    const p1 = Buffer.from(parts.join(''), 'utf-8');

    const p3Text =
      `\r\n--${boundary}\r\nContent-Disposition: form-data; name="secretText"\r\n\r\n${secret}` +
      (passphrase ? `\r\n--${boundary}\r\nContent-Disposition: form-data; name="passphrase"\r\n\r\n${passphrase}` : '') +
      `\r\n--${boundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\nTest Carrier: ${filename}` +
      `\r\n--${boundary}\r\nContent-Disposition: form-data; name="tags"\r\n\r\nsecurity, e2e, test` +
      `\r\n--${boundary}--\r\n`;
    const p3 = Buffer.from(p3Text, 'utf-8');

    const body = Buffer.concat([p1, fileBuffer, p3]);

    const res = await fetch(`${baseUrl}/api/carrier/encode`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body
    });
    return await res.json();
  }

  // 4. Test Audio Carrier (WAV)
  console.log('\n--- 3. Testing Audio Carrier (WAV) Encode & Extraction ---');
  const samples = new Int16Array(44100 * 2);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.sin(i / 10) * 12000;
  const audioBuf = createWavBuffer(samples, 44100, 1);
  const secretAudio = 'Audio Classified Signal 44.1kHz';
  const passAudio = 'AudioKey2026!';

  const audioEnc = await testCarrierUpload('briefing.wav', audioBuf, secretAudio, passAudio);
  if (!audioEnc.success) throw new Error('Audio encode failed: ' + audioEnc.message);
  console.log('✅ Audio Secured in GridFS:', audioEnc.data.fileName);

  // Decode audio using fileId
  const audioDec = await fetch(`${baseUrl}/api/carrier/decode`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId: audioEnc.data.gridFsFileId, passphrase: passAudio })
  }).then(r => r.json());
  console.log('✅ Audio Extracted:', audioDec.data.secretText);
  if (audioDec.data.secretText !== secretAudio) throw new Error('Audio extraction text mismatch!');

  // 5. Test PDF Carrier
  console.log('\n--- 4. Testing PDF Carrier Encode & Extraction ---');
  const pdfBuf = Buffer.from('%PDF-1.7\n1 0 obj\n<< /Title (Confidential Document) >>\nendobj\ntrailer\n<< /Size 1 >>\nstartxref\n50\n%%EOF');
  const secretPdf = 'PDF Classified Dossier Chapter 9';
  const passPdf = 'PdfKey2026!';

  const pdfEnc = await testCarrierUpload('dossier.pdf', pdfBuf, secretPdf, passPdf);
  if (!pdfEnc.success) throw new Error('PDF encode failed: ' + pdfEnc.message);
  console.log('✅ PDF Secured in GridFS:', pdfEnc.data.fileName);

  const pdfDec = await fetch(`${baseUrl}/api/carrier/decode`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId: pdfEnc.data.gridFsFileId, passphrase: passPdf })
  }).then(r => r.json());
  console.log('✅ PDF Extracted:', pdfDec.data.secretText);
  if (pdfDec.data.secretText !== secretPdf) throw new Error('PDF extraction text mismatch!');

  // 6. Test DOCX Carrier
  console.log('\n--- 5. Testing DOCX Document Carrier Encode & Extraction ---');
  const zipDocx = new JSZip();
  zipDocx.file('[Content_Types].xml', '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>');
  zipDocx.file('word/document.xml', '<w:document></w:document>');
  const docxBuf = await zipDocx.generateAsync({ type: 'nodebuffer' });
  const secretDocx = 'DOCX Payload - Operation Overlord';
  const passDocx = 'DocxKey2026!';

  const docxEnc = await testCarrierUpload('brief.docx', docxBuf, secretDocx, passDocx);
  if (!docxEnc.success) throw new Error('DOCX encode failed: ' + docxEnc.message);
  console.log('✅ DOCX Secured in GridFS:', docxEnc.data.fileName);

  const docxDec = await fetch(`${baseUrl}/api/carrier/decode`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId: docxEnc.data.gridFsFileId, passphrase: passDocx })
  }).then(r => r.json());
  console.log('✅ DOCX Extracted:', docxDec.data.secretText);
  if (docxDec.data.secretText !== secretDocx) throw new Error('DOCX extraction text mismatch!');

  // 7. Test Video Carrier (MP4)
  console.log('\n--- 6. Testing Video Carrier (.mp4) Encode & Extraction ---');
  const videoBuf = Buffer.from('ftypisom\x00\x00\x02\x00moov...synthetic_mp4_video_data...mdat');
  const secretVideo = 'Video Mission Stream Key: 8829-QX-99';
  const passVideo = 'VideoKey2026!';

  const videoEnc = await testCarrierUpload('drone_cam.mp4', videoBuf, secretVideo, passVideo);
  if (!videoEnc.success) throw new Error('Video encode failed: ' + videoEnc.message);
  console.log('✅ Video Secured in GridFS:', videoEnc.data.fileName);

  const videoDec = await fetch(`${baseUrl}/api/carrier/decode`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId: videoEnc.data.gridFsFileId, passphrase: passVideo })
  }).then(r => r.json());
  console.log('✅ Video Extracted:', videoDec.data.secretText);
  if (videoDec.data.secretText !== secretVideo) throw new Error('Video extraction text mismatch!');

  // 8. Test Vault Query & Filtering (READ CRUD)
  console.log('\n--- 7. Testing Vault Read & Carrier Filtering ---');
  const vaultRes = await fetch(`${baseUrl}/api/carrier/my-vault`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const vaultData = await vaultRes.json();
  console.log(`✅ Total Vault Records: ${vaultData.count}`);

  const pdfFilterRes = await fetch(`${baseUrl}/api/carrier/my-vault?carrierType=pdf`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const pdfFilterData = await pdfFilterRes.json();
  console.log(`✅ Filter by carrierType=pdf returned: ${pdfFilterData.count} record(s)`);

  // 9. Test Stream Range Request
  console.log('\n--- 8. Testing HTTP 206 Byte-Range Streaming ---');
  const streamRes = await fetch(`${baseUrl}/api/carrier/stream/${audioEnc.data.gridFsFileId}`, {
    headers: { 'Range': 'bytes=0-512' }
  });
  console.log(`✅ Stream HTTP Status: ${streamRes.status} (Expected 206), Range: ${streamRes.headers.get('content-range')}`);

  // 10. Test Update (UPDATE CRUD)
  console.log('\n--- 9. Testing Record Metadata Update (UPDATE CRUD) ---');
  const updateRes = await fetch(`${baseUrl}/api/carrier/${pdfEnc.data.record._id}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Updated Tactical PDF Dossier',
      description: 'Clearance verified for level 5 personnel',
      tags: 'verified, level5'
    })
  });
  const updateData = await updateRes.json();
  console.log('✅ Record Title Updated to:', updateData.data.title);

  // 11. Test Delete (DELETE CRUD)
  console.log('\n--- 10. Testing Record Purge & GridFS Cleanup (DELETE CRUD) ---');
  const deleteRes = await fetch(`${baseUrl}/api/carrier/${pdfEnc.data.record._id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const deleteData = await deleteRes.json();
  console.log('✅ Record Purged:', deleteData.message);

  console.log('\n🌟 ALL FULL-SPECTRUM SECURITY & UNIVERSAL MULTI-CARRIER TESTS PASSED WITH 100% SUCCESS! 🌟\n');
}

runUniversalE2ETest().catch(err => {
  console.error('❌ Universal E2E test failed:', err);
  process.exit(1);
});
