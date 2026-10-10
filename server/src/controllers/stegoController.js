import mongoose from 'mongoose';
import { getGridFsBucket } from '../config/db.js';
import StegoRecord from '../models/StegoRecord.js';
import { universalEmbed, universalExtract, detectCarrierType } from '../utils/universalStego.js';
import { parseWav } from '../utils/wavHelper.js';
import { convertToWav } from '../utils/ffmpeg.js';
import { Readable } from 'stream';

/**
 * Upload a Buffer to MongoDB GridFSBucket
 */
function uploadBufferToGridFS(buffer, filename, contentType = 'application/octet-stream') {
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
 * Download a file from MongoDB GridFSBucket as a Buffer
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

// @desc    Analyze carrier capacity & metadata
// @route   POST /api/carrier/analyze
export async function analyzeCarrier(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a carrier file to analyze.' });
    }

    const carrierType = detectCarrierType(req.file.originalname, req.file.mimetype);
    let extraData = {};

    if (carrierType === 'audio') {
      try {
        const wavBuffer = await convertToWav(req.file.buffer, req.file.originalname);
        const parsed = parseWav(wavBuffer);
        extraData = {
          durationSeconds: Number(parsed.durationSeconds.toFixed(2)),
          sampleRate: parsed.fmt.sampleRate,
          channels: parsed.fmt.numChannels,
          maxPlaintextChars: Math.max(0, parsed.maxPayloadBytes - 13),
          maxEncryptedChars: Math.max(0, parsed.maxPayloadBytes - 45)
        };
      } catch {
        // Fallback for non-pcm audio
      }
    } else {
      // For video, documents, and images: capacity depends on file overhead
      extraData = {
        maxPlaintextChars: 500000,
        maxEncryptedChars: 500000
      };
    }

    res.json({
      success: true,
      data: {
        originalName: req.file.originalname,
        originalSizeBytes: req.file.size,
        carrierType,
        ...extraData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// @desc    Universal Encode: Hide secret in Audio, Video, PDF, DOCX, PPTX, Image (CREATE CRUD)
// @route   POST /api/carrier/encode
export async function encodeCarrier(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Carrier file is required.' });
    }

    const { secretText, passphrase, title, description, tags } = req.body;

    if (!secretText || secretText.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Secret text is required.' });
    }

    // Embed using Universal Stego Engine
    const embedResult = await universalEmbed(
      req.file.buffer,
      req.file.originalname,
      secretText,
      passphrase
    );

    // Save to GridFSBucket
    const gridFsFileId = await uploadBufferToGridFS(
      embedResult.outputBuffer,
      embedResult.outputName,
      embedResult.mimeType
    );

    let savedRecord = null;
    let userStats = null;
    // Save to MongoDB if authenticated
    if (req.user) {
      const parsedTags = Array.isArray(tags)
        ? tags
        : typeof tags === 'string'
        ? tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      savedRecord = await StegoRecord.create({
        userId: req.user._id,
        title: title && title.trim().length > 0 ? title.trim() : `Secured: ${req.file.originalname}`,
        description: description || '',
        tags: parsedTags,
        carrierType: embedResult.carrierType,
        originalName: req.file.originalname,
        mimeType: embedResult.mimeType,
        fileSizeBytes: embedResult.outputBuffer.length,
        isPasswordProtected: embedResult.isEncrypted,
        payloadSizeBytes: embedResult.payloadSize,
        gridFsFileId
      });

      // Increment operations and XP
      req.user.operationsCount = (req.user.operationsCount || 0) + 1;
      req.user.xp = (req.user.xp || 0) + 50;
      await req.user.save();
      userStats = {
        operationsCount: req.user.operationsCount,
        xp: req.user.xp
      };
    }

    res.status(201).json({
      success: true,
      message: 'Secret successfully embedded into carrier file!',
      data: {
        gridFsFileId,
        fileName: embedResult.outputName,
        carrierType: embedResult.carrierType,
        fileSizeBytes: embedResult.outputBuffer.length,
        isPasswordProtected: embedResult.isEncrypted,
        payloadSizeBytes: embedResult.payloadSize,
        record: savedRecord,
        userStats,
        downloadUrl: `/api/carrier/download/${gridFsFileId}`,
        streamUrl: `/api/carrier/stream/${gridFsFileId}`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// @desc    Universal Decode: Extract secret from any carrier file (READ CRUD)
// @route   POST /api/carrier/decode
export async function decodeCarrier(req, res) {
  try {
    let fileBuffer;
    let fileName = '';
    const { passphrase, fileId } = req.body;

    if (req.file) {
      fileBuffer = req.file.buffer;
      fileName = req.file.originalname;
    } else if (fileId) {
      fileBuffer = await downloadBufferFromGridFS(fileId);
      const bucket = getGridFsBucket();
      const files = await bucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
      fileName = files[0]?.filename || 'carrier_file';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please upload a carrier file or provide a stored fileId to extract.'
      });
    }

    const extractResult = await universalExtract(fileBuffer, fileName, passphrase);

    let userStats = null;
    if (req.user) {
      req.user.operationsCount = (req.user.operationsCount || 0) + 1;
      req.user.xp = (req.user.xp || 0) + 30;
      await req.user.save();
      userStats = {
        operationsCount: req.user.operationsCount,
        xp: req.user.xp
      };
    }

    res.json({
      success: true,
      message: 'Secret extracted successfully!',
      data: {
        ...extractResult,
        userStats
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

// @desc    Get user's stored vault records (READ CRUD)
// @route   GET /api/carrier/my-vault
export async function getMyVault(req, res) {
  try {
    const { search, tag, carrierType } = req.query;
    const query = { userId: req.user._id };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { originalName: { $regex: search, $options: 'i' } }
      ];
    }

    if (tag) query.tags = tag;
    if (carrierType) query.carrierType = carrierType;

    const records = await StegoRecord.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// @desc    Get single record metadata (READ CRUD)
// @route   GET /api/carrier/:id
export async function getStegoRecord(req, res) {
  try {
    const record = await StegoRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }
    if (record.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// @desc    Stream audio/video directly from GridFS with Range header support
// @route   GET /api/carrier/stream/:fileId
export async function streamCarrier(req, res) {
  try {
    const bucket = getGridFsBucket();
    if (!bucket) {
      return res.status(500).json({ success: false, message: 'GridFSBucket unavailable.' });
    }

    const fileObjectId = new mongoose.Types.ObjectId(req.params.fileId);
    const files = await bucket.find({ _id: fileObjectId }).toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found.' });
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
        'Content-Type': file.contentType || 'application/octet-stream'
      });

      const downloadStream = bucket.openDownloadStream(fileObjectId, { start, end: end + 1 });
      downloadStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': totalSize,
        'Content-Type': file.contentType || 'application/octet-stream',
        'Accept-Ranges': 'bytes'
      });
      const downloadStream = bucket.openDownloadStream(fileObjectId);
      downloadStream.pipe(res);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// @desc    Download carrier file from GridFS
// @route   GET /api/carrier/download/:fileId
export async function downloadCarrier(req, res) {
  try {
    const bucket = getGridFsBucket();
    const fileObjectId = new mongoose.Types.ObjectId(req.params.fileId);
    const files = await bucket.find({ _id: fileObjectId }).toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const file = files[0];
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename || 'secured_carrier'}"`);
    res.setHeader('Content-Type', file.contentType || 'application/octet-stream');

    const downloadStream = bucket.openDownloadStream(fileObjectId);
    downloadStream.pipe(res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// @desc    Update record metadata (UPDATE CRUD)
// @route   PUT /api/carrier/:id
export async function updateStegoRecord(req, res) {
  try {
    const record = await StegoRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }
    if (record.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
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
      message: 'Record metadata updated successfully.',
      data: record
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// @desc    Delete record & purge binary from GridFS (DELETE CRUD)
// @route   DELETE /api/carrier/:id
export async function deleteStegoRecord(req, res) {
  try {
    const record = await StegoRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }
    if (record.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Delete from GridFS bucket
    const bucket = getGridFsBucket();
    if (bucket && record.gridFsFileId) {
      try {
        await bucket.delete(new mongoose.Types.ObjectId(record.gridFsFileId));
      } catch (err) {
        console.warn('GridFS purge warning:', err.message);
      }
    }

    await record.deleteOne();

    res.json({
      success: true,
      message: 'Record and binary payload permanently purged from GridFS and database.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
