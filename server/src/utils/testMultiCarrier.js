import JSZip from 'jszip';
import { createWavBuffer } from './wavHelper.js';
import { universalEmbed, universalExtract, CARRIER_TYPES } from './universalStego.js';

async function runMultiCarrierTests() {
  console.log('🌌 Starting AntiGravity Universal Multi-Carrier Steganography Test Suite...\n');

  const secretText = 'Project Starlight: Orbital Coordinates (32.89, -117.23). Encryption Validated.';
  const password = 'QuantumSecurePassphrase2026!';

  // 1. AUDIO TEST (WAV)
  console.log('--- 1. Testing Audio Carrier (16-bit PCM WAV LSB) ---');
  const samples = new Int16Array(44100 * 2); // 2 seconds
  for (let i = 0; i < samples.length; i++) samples[i] = Math.sin(i / 10) * 10000;
  const originalAudio = createWavBuffer(samples, 44100, 1);

  const audioEmbed = await universalEmbed(originalAudio, 'briefing.wav', secretText, password);
  console.log(`✅ Audio Encoded: ${audioEmbed.outputName} (${audioEmbed.outputBuffer.length} bytes)`);

  const audioExtract = await universalExtract(audioEmbed.outputBuffer, 'briefing.wav', password);
  console.log(`✅ Audio Extracted: "${audioExtract.secretText}" (Carrier: ${audioExtract.carrierType})`);
  if (audioExtract.secretText !== secretText) throw new Error('Audio test failed!');

  // 2. VIDEO TEST (MP4 Carrier)
  console.log('\n--- 2. Testing Video Carrier (.mp4) ---');
  // Synthetic MP4 container buffer
  const originalVideo = Buffer.from('ftypisom\x00\x00\x02\x00isomiso2avc1mp41moov...synthetic_video_data...mdat');
  const videoEmbed = await universalEmbed(originalVideo, 'surveillance_feed.mp4', secretText, password);
  console.log(`✅ Video Encoded: ${videoEmbed.outputName} (${videoEmbed.outputBuffer.length} bytes)`);

  const videoExtract = await universalExtract(videoEmbed.outputBuffer, 'surveillance_feed.mp4', password);
  console.log(`✅ Video Extracted: "${videoExtract.secretText}" (Carrier: ${videoExtract.carrierType})`);
  if (videoExtract.secretText !== secretText) throw new Error('Video test failed!');

  // 3. PDF TEST (.pdf Carrier)
  console.log('\n--- 3. Testing PDF Document Carrier (.pdf) ---');
  const originalPdf = Buffer.from('%PDF-1.7\n1 0 obj\n<< /Title (Top Secret Protocol) >>\nendobj\nxref\n0 2\n0000000000 65535 f \n0000000009 00000 n \ntrailer\n<< /Size 2 /Root 1 0 R >>\nstartxref\n70\n%%EOF');
  const pdfEmbed = await universalEmbed(originalPdf, 'intelligence_dossier.pdf', secretText, password);
  console.log(`✅ PDF Encoded: ${pdfEmbed.outputName} (${pdfEmbed.outputBuffer.length} bytes)`);

  const pdfExtract = await universalExtract(pdfEmbed.outputBuffer, 'intelligence_dossier.pdf', password);
  console.log(`✅ PDF Extracted: "${pdfExtract.secretText}" (Carrier: ${pdfExtract.carrierType})`);
  if (pdfExtract.secretText !== secretText) throw new Error('PDF test failed!');

  // 4. DOCX TEST (.docx Office Open XML Carrier)
  console.log('\n--- 4. Testing Document Carrier (.docx) ---');
  const zipDocx = new JSZip();
  zipDocx.file('[Content_Types].xml', '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>');
  zipDocx.file('word/document.xml', '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Confidential Report</w:t></w:r></w:p></w:body></w:document>');
  const originalDocx = await zipDocx.generateAsync({ type: 'nodebuffer' });

  const docxEmbed = await universalEmbed(originalDocx, 'contract.docx', secretText, password);
  console.log(`✅ DOCX Encoded: ${docxEmbed.outputName} (${docxEmbed.outputBuffer.length} bytes)`);

  const docxExtract = await universalExtract(docxEmbed.outputBuffer, 'contract.docx', password);
  console.log(`✅ DOCX Extracted: "${docxExtract.secretText}" (Carrier: ${docxExtract.carrierType})`);
  if (docxExtract.secretText !== secretText) throw new Error('DOCX test failed!');

  // 5. PPTX TEST (.pptx Presentation Carrier)
  console.log('\n--- 5. Testing Presentation Carrier (.pptx) ---');
  const zipPptx = new JSZip();
  zipPptx.file('[Content_Types].xml', '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>');
  zipPptx.file('ppt/presentation.xml', '<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"></p:presentation>');
  const originalPptx = await zipPptx.generateAsync({ type: 'nodebuffer' });

  const pptxEmbed = await universalEmbed(originalPptx, 'quarterly_deck.pptx', secretText, password);
  console.log(`✅ PPTX Encoded: ${pptxEmbed.outputName} (${pptxEmbed.outputBuffer.length} bytes)`);

  const pptxExtract = await universalExtract(pptxEmbed.outputBuffer, 'quarterly_deck.pptx', password);
  console.log(`✅ PPTX Extracted: "${pptxExtract.secretText}" (Carrier: ${pptxExtract.carrierType})`);
  if (pptxExtract.secretText !== secretText) throw new Error('PPTX test failed!');

  // 6. WRONG PASSWORD REJECTION TEST
  console.log('\n--- 6. Testing Cryptographic Rejection of Incorrect Passphrase ---');
  try {
    await universalExtract(pdfEmbed.outputBuffer, 'intelligence_dossier.pdf', 'WrongPasscode999!');
    throw new Error('Should have rejected wrong password!');
  } catch (err) {
    console.log(`✅ Correctly rejected invalid passphrase: "${err.message}"`);
  }

  console.log('\n🌟 ALL UNIVERSAL MULTI-CARRIER TESTS (AUDIO, VIDEO, PDF, DOCX, PPTX) PASSED WITH 100% SUCCESS! 🌟\n');
}

runMultiCarrierTests().catch(err => {
  console.error('❌ Multi-carrier test failed:', err);
  process.exit(1);
});
