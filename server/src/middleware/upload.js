import multer from 'multer';

// Memory storage keeps file buffer in memory for instant steganographic processing
const storage = multer.memoryStorage();

const allowedExtensions = /\.(wav|mp3|ogg|aac|flac|m4a|mp4|mkv|avi|mov|webm|pdf|docx|doc|pptx|ppt|xlsx|png|jpg|jpeg|webp|bmp)$/i;

const fileFilter = (req, file, cb) => {
  if (file.originalname.match(allowedExtensions)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported carrier format (${file.originalname}). Supported: Audio (WAV/MP3), Video (MP4/MKV/AVI), Documents (PDF/DOCX/PPTX), Images (PNG/JPG).`));
  }
};

export const uploadCarrier = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB max carrier file size
  },
  fileFilter
});

// Alias for backwards compatibility
export const uploadAudio = uploadCarrier;
