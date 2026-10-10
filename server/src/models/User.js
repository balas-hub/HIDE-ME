import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      minlength: [3, 'Username must be at least 3 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    avatar: {
      type: String,
      default: ''
    },
    frameStyle: {
      type: String,
      default: 'shield_reticle',
      enum: ['shield_reticle', 'phantom_matrix', 'cipher_ring', 'apex_enforcer', 'recon_hud']
    },
    callsign: {
      type: String,
      default: '',
      trim: true
    },
    clearanceLevel: {
      type: String,
      default: 'LEVEL 1 - ROOKIE INFILTRATOR',
      trim: true
    },
    bio: {
      type: String,
      default: '',
      maxlength: [280, 'Bio cannot exceed 280 characters']
    },
    operationsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    xp: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
