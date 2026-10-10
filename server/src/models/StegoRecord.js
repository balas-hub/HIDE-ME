import mongoose from 'mongoose';

const stegoRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Carrier record title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [30, 'Tag cannot exceed 30 characters']
      }
    ],
    carrierType: {
      type: String,
      enum: ['audio', 'video', 'pdf', 'docx', 'pptx', 'image', 'generic'],
      default: 'audio',
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      default: 'application/octet-stream'
    },
    fileSizeBytes: {
      type: Number,
      required: true
    },
    durationSeconds: {
      type: Number,
      default: 0
    },
    sampleRate: {
      type: Number,
      default: 44100
    },
    isPasswordProtected: {
      type: Boolean,
      default: false
    },
    payloadSizeBytes: {
      type: Number,
      default: 0
    },
    gridFsFileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Indexing for performant vault searches
stegoRecordSchema.index({ userId: 1, createdAt: -1 });
stegoRecordSchema.index({ userId: 1, carrierType: 1 });
stegoRecordSchema.index({ userId: 1, tags: 1 });

const StegoRecord = mongoose.model('StegoRecord', stegoRecordSchema);
export default StegoRecord;
