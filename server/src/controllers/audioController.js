import mongoose from 'mongoose';
import { getGridFsBucket } from '../config/db.js';
import AudioRecord from '../models/AudioRecord.js';
import { parseWav } from '../utils/wavHelper.js';
import { embedSecret, extractSecret } from '../utils/stego.js';
import { convertToWav } from '../utils/ffmpeg.js';
import { Readable } from 'stream';

/**
 * Helper: upload a Buffer to GridFSBucket
 */
function uploadBufferToGridFS(buffer, filename, contentType = 'audio/wav') {
  return new Promise((resolve, reject) => {
    const bucket = getGridFsBucket();
    if (!bucket) {
      return reject(new Error('GridFSBucket is not initialized'));
    }

    const uploadStream = bucket.openUploadStream(filename, {
      contentType,
      metadata: { uploadedAt: new Date() }
    });

    const readable = Readable.from(buffer);
    readable.pipe(uploadStream)
      .on('error', (err) => reject(err))
      .on('finish', () => resolve(uploadStream.id));
  });
}

/**
 * Helper: download a file from GridFSBucket as a Buffer
 */
function downloadBufferFromGridFS(fileId) {
  return new Promise((resolve, reject) => {
    const bucket = getGridFsBucket();
    if (!bucket) {
      return reject(new Error('GridFSBucket is not initialized'));
    }

    const chunks = [];
    const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));

    downloadStream.on('data', (chunk) => chunks.push(chunk));
    downloadStream.on('error', (err) => reject(err));
    downloadStream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

// @desc    Analyze uploaded audio capacity & duration
// @route   POST /api/audio/analyze
export async function analyzeAudio(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an audio file to analyze' });
    }

    // Convert to PCM WAV if needed
    const wavBuffer = await convertToWav(req.file.buffer, req.file.originalname);
    const parsed = parseWav(wavBuffer);

    res.json({
      success: true,
      data: {
        originalName: req.file.originalname,
        originalSizeBytes: req.file.size,
        durationSeconds: Number(parsed.durationSeconds.toFixed(2)),
        sampleRate: parsed.fmt.sampleRate,
        channels: parsed.fmt.numChannels,
        bitsPerSample: parsed.fmt.bitsPerSample,
        totalSamples: parsed.totalSamples,
        // Approximate capacity (subtract 45 bytes for encrypted header)
        maxPlaintextChars: Math.max(0, parsed.maxPayloadBytes - 13),
        maxEncryptedChars: Math.max(0, parsed.maxPayloadBytes - 45)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// @desc    Encode secret text into audio & save to GridFS/Vault (CREATE)
// @route   POST /api/audio/encode
export async function encodeAudio(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Audio file is required' });
    }

    const { secretText, passphrase, title, description, tags } = req.body;

    if (!secretText || secretText.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Secret text is required' });
    }

    // Convert input audio to 16-bit PCM WAV if needed
    const pcmWavBuffer = await convertToWav(req.file.buffer, req.file.originalname);
    const parsed = parseWav(pcmWavBuffer);

    // Embed secret text into LSB
    const isEncrypted = Boolean(passphrase && passphrase.trim().length > 0);
    const { stegoWavBuffer, payloadSize } = embedSecret(pcmWavBuffer, secretText, passphrase);

    // Generate output file name
    const baseName = req.file.originalname.replace(/\.[^/.]+$/, '');
    const stegoFileName = `stego_${baseName}.wav`;

    // Save stego audio to GridFS
    const gridFsFileId = await uploadBufferToGridFS(stegoWavBuffer, stegoFileName, 'audio/wav');

    let savedRecord = null;
    // If user is authenticated, create AudioRecord in MongoDB
    if (req.user) {
      const parsedTags = Array.isArray(tags)
        ? tags
        : typeof tags === 'string'
        ? tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      savedRecord = await AudioRecord.create({
        userId: req.user._id,
        title: title && title.trim().length > 0 ? title.trim() : `Stego: ${baseName}`,
        description: description || '',
        tags: parsedTags,
        originalName: req.file.originalname,
        fileSizeBytes: stegoWavBuffer.length,
        durationSeconds: Number(parsed.durationSeconds.toFixed(2)),
        sampleRate: parsed.fmt.sampleRate,
        channels: parsed.fmt.numChannels,
        isPasswordProtected: isEncrypted,
        capacityChars: parsed.maxPayloadBytes - (isEncrypted ? 45 : 13),
        payloadSizeBytes: payloadSize,
        gridFsFileId
      });
    }

    res.status(201).json({
      success: true,
      message: 'Secret message embedded successfully!',
      data: {
        gridFsFileId,
        fileName: stegoFileName,
        fileSizeBytes: stegoWavBuffer.length,
        durationSeconds: Number(parsed.durationSeconds.toFixed(2)),
        isPasswordProtected: isEncrypted,
        payloadSizeBytes: payloadSize,
        record: savedRecord,
        downloadUrl: `/api/audio/download/${gridFsFileId}`,
        streamUrl: `/api/audio/stream/${gridFsFileId}`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// @desc    Extract secret text from audio (READ / DECODE)
// @route   POST /api/audio/decode
export async function decodeAudio(req, res) {
  try {
    let wavBuffer;
    const { passphrase, fileId } = req.body;

    if (req.file) {
      // Decode from uploaded file
      wavBuffer = await convertToWav(req.file.buffer, req.file.originalname);
    } else if (fileId) {
      // Decode from stored GridFS file
      wavBuffer = await downloadBufferFromGridFS(fileId);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please upload an audio file or provide a stored fileId to decode.'
      });
    }

    const { secretText, isEncrypted, payloadSize } = extractSecret(wavBuffer, passphrase);

    res.json({
      success: true,
      message: 'Secret message extracted successfully!',
      data: {
        secretText,
        isEncrypted,
        payloadSize
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

// @desc    Get user's vault items (READ)
// @route   GET /api/audio/my-vault
export async function getMyVault(req, res) {
  try {
    const { search, tag } = req.query;
    const query = { userId: req.user._id };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { originalName: { $regex: search, $options: 'i' } }
      ];
    }

    if (tag) {
      query.tags = tag;
    }

    const records = await AudioRecord.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// @desc    Get single audio record (READ)
// @route   GET /api/audio/:id
export async function getAudioRecord(req, res) {
  try {
    const record = await AudioRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ success: false, message: 'Audio record not found' });
    }

    // Verify ownership
    if (record.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this record' });
    }

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// @desc    Stream audio with HTTP Range support for Wavesurfer.js
// @route   GET /api/audio/stream/:fileId
export async function streamAudio(req, res) {
  try {
    const bucket = getGridFsBucket();
    if (!bucket) {
      return res.status(500).json({ success: false, message: 'GridFSBucket not available' });
    }

    const fileObjectId = new mongoose.Types.ObjectId(req.params.fileId);
    const files = await bucket.find({ _id: fileObjectId }).toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({ success: false, message: 'Audio file not found in GridFS' });
    }

    const file = files[0];
    const totalSize = file.length;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
      const chunksize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': file.contentType || 'audio/wav'
      });

      const downloadStream = bucket.openDownloadStream(fileObjectId, { start, end: end + 1 });
      downloadStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': totalSize,
        'Content-Type': file.contentType || 'audio/wav',
        'Accept-Ranges': 'bytes'
      });
      const downloadStream = bucket.openDownloadStream(fileObjectId);
      downloadStream.pipe(res);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// @desc    Download audio file from GridFS
// @route   GET /api/audio/download/:fileId
export async function downloadAudio(req, res) {
  try {
    const bucket = getGridFsBucket();
    const fileObjectId = new mongoose.Types.ObjectId(req.params.fileId);
    const files = await bucket.find({ _id: fileObjectId }).toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const file = files[0];
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename || 'stego_audio.wav'}"`);
    res.setHeader('Content-Type', file.contentType || 'audio/wav');

    const downloadStream = bucket.openDownloadStream(fileObjectId);
    downloadStream.pipe(res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// @desc    Update audio record metadata (UPDATE)
// @route   PUT /api/audio/:id
export async function updateAudioRecord(req, res) {
  try {
    const record = await AudioRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ success: false, message: 'Audio record not found' });
    }

    if (record.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this record' });
    }

    const { title, description, tags } = req.body;

    if (title) record.title = title.trim();
    if (description !== undefined) record.description = description.trim();
    if (tags !== undefined) {
      record.tags = Array.isArray(tags)
        ? tags
        : tags.split(',').map((t) => t.trim()).filter(Boolean);
    }

    await record.save();

    res.json({
      success: true,
      message: 'Audio metadata updated successfully',
      data: record
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// @desc    Delete audio record and remove binary from GridFS (DELETE)
// @route   DELETE /api/audio/:id
export async function deleteAudioRecord(req, res) {
  try {
    const record = await AudioRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ success: false, message: 'Audio record not found' });
    }

    if (record.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this record' });
    }

    // Delete from GridFS bucket
    const bucket = getGridFsBucket();
    if (bucket && record.gridFsFileId) {
      try {
        await bucket.delete(new mongoose.Types.ObjectId(record.gridFsFileId));
      } catch (err) {
        console.warn('GridFS file delete warning:', err.message);
      }
    }

    // Delete record from MongoDB
    await record.deleteOne();

    res.json({
      success: true,
      message: 'Audio record and GridFS binary file deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
