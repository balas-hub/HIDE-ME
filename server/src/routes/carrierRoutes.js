import express from 'express';
import {
  analyzeCarrier,
  encodeCarrier,
  decodeCarrier,
  getMyVault,
  getStegoRecord,
  streamCarrier,
  downloadCarrier,
  updateStegoRecord,
  deleteStegoRecord
} from '../controllers/stegoController.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { uploadCarrier } from '../middleware/upload.js';

const router = express.Router();

// Public / Authenticated Analysis
router.post('/analyze', uploadCarrier.single('carrier'), analyzeCarrier);
router.post('/analyze-audio', uploadCarrier.single('audio'), analyzeCarrier);

// Create Carrier Record (GridFS + MongoDB)
router.post('/encode', optionalAuth, uploadCarrier.fields([{ name: 'carrier', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), (req, res, next) => {
  if (!req.file) {
    req.file = req.files?.carrier?.[0] || req.files?.audio?.[0];
  }
  encodeCarrier(req, res, next);
});

// Decode Secret from uploaded file or stored GridFS fileId
router.post('/decode', optionalAuth, uploadCarrier.fields([{ name: 'carrier', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), (req, res, next) => {
  if (!req.file) {
    req.file = req.files?.carrier?.[0] || req.files?.audio?.[0];
  }
  decodeCarrier(req, res, next);
});

// Streaming & Download from GridFS
router.get('/stream/:fileId', streamCarrier);
router.get('/download/:fileId', downloadCarrier);

// Authenticated CRUD Operations
router.get('/my-vault', protect, getMyVault);
router.get('/:id', protect, getStegoRecord);
router.put('/:id', protect, updateStegoRecord);
router.delete('/:id', protect, deleteStegoRecord);

export default router;
