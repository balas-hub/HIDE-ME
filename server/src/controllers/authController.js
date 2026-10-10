import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'hideme_secure_jwt_token_key_secret_2026!', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

export function getClearanceDetails(operationsCount = 0) {
  if (operationsCount >= 15) {
    return {
      levelNumber: 5,
      clearanceLevel: 'LEVEL 5 - SOVEREIGN APEX OPERATIVE',
      badge: 'LVL 5',
      unlockedFrames: ['shield_reticle', 'phantom_matrix', 'recon_hud', 'cipher_ring', 'apex_enforcer'],
      nextLevelAt: null,
      opsToNext: 0
    };
  }
  if (operationsCount >= 9) {
    return {
      levelNumber: 4,
      clearanceLevel: 'LEVEL 4 - BLACK OPS ENFORCER',
      badge: 'LVL 4',
      unlockedFrames: ['shield_reticle', 'phantom_matrix', 'recon_hud', 'cipher_ring'],
      nextLevelAt: 15,
      opsToNext: 15 - operationsCount
    };
  }
  if (operationsCount >= 5) {
    return {
      levelNumber: 3,
      clearanceLevel: 'LEVEL 3 - SHADOW ANALYST',
      badge: 'LVL 3',
      unlockedFrames: ['shield_reticle', 'phantom_matrix', 'recon_hud'],
      nextLevelAt: 9,
      opsToNext: 9 - operationsCount
    };
  }
  if (operationsCount >= 2) {
    return {
      levelNumber: 2,
      clearanceLevel: 'LEVEL 2 - CIPHER SPECIALIST',
      badge: 'LVL 2',
      unlockedFrames: ['shield_reticle', 'phantom_matrix'],
      nextLevelAt: 5,
      opsToNext: 5 - operationsCount
    };
  }
  return {
    levelNumber: 1,
    clearanceLevel: 'LEVEL 1 - ROOKIE INFILTRATOR',
    badge: 'LVL 1',
    unlockedFrames: ['shield_reticle'],
    nextLevelAt: 2,
    opsToNext: 2 - operationsCount
  };
}

export function formatAgentUser(user) {
  const ops = user.operationsCount || 0;
  const clearance = getClearanceDetails(ops);
  
  // Safe frame fallback if user's stored frame requires higher clearance than currently earned
  let activeFrame = user.frameStyle || 'shield_reticle';
  if (!clearance.unlockedFrames.includes(activeFrame)) {
    activeFrame = 'shield_reticle';
  }

  return {
    id: user._id,
    username: user.username,
    email: user.email,
    callsign: user.callsign || user.username,
    bio: user.bio || '',
    avatar: user.avatar || '',
    frameStyle: activeFrame,
    clearanceLevel: clearance.clearanceLevel,
    levelNumber: clearance.levelNumber,
    badge: clearance.badge,
    operationsCount: ops,
    xp: user.xp || 0,
    unlockedFrames: clearance.unlockedFrames,
    nextLevelAt: clearance.nextLevelAt,
    opsToNext: clearance.opsToNext,
    createdAt: user.createdAt
  };
}

// Register user
export async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ success: false, message: 'Username must be between 3 and 30 characters.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      callsign: username.trim(),
      operationsCount: 0,
      xp: 0
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: formatAgentUser(user)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Login user
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: formatAgentUser(user)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get current user profile
export async function getMe(req, res) {
  res.json({
    success: true,
    user: formatAgentUser(req.user)
  });
}

// Update agent profile and secret agent frame
export async function updateProfile(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Agent dossier not found.' });
    }

    const { username, callsign, bio, avatar, frameStyle } = req.body;

    if (username) {
      if (username.length < 3 || username.length > 30) {
        return res.status(400).json({ success: false, message: 'Agent callsign/username must be 3-30 characters.' });
      }
      user.username = username.trim();
    }

    if (callsign !== undefined) user.callsign = callsign.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (avatar !== undefined) user.avatar = avatar;

    if (frameStyle !== undefined) {
      const allowedFrames = ['shield_reticle', 'phantom_matrix', 'cipher_ring', 'apex_enforcer', 'recon_hud'];
      if (!allowedFrames.includes(frameStyle)) {
        return res.status(400).json({ success: false, message: 'Invalid secret agent frame specification.' });
      }

      // Enforce level unlocking on frames
      const clearance = getClearanceDetails(user.operationsCount || 0);
      if (!clearance.unlockedFrames.includes(frameStyle)) {
        // Auto-sanitize to highest unlocked frame instead of crashing profile photo upload
        user.frameStyle = clearance.unlockedFrames[clearance.unlockedFrames.length - 1] || 'shield_reticle';
      } else {
        user.frameStyle = frameStyle;
      }
    }

    // Always update clearance level dynamically based on operations
    const clearance = getClearanceDetails(user.operationsCount || 0);
    user.clearanceLevel = clearance.clearanceLevel;

    await user.save();

    res.json({
      success: true,
      message: 'Agent biometric dossier and tactical frame updated successfully.',
      user: formatAgentUser(user)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
