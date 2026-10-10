import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function protect(req, res, next) {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please sign in.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hideme_secure_jwt_token_key_secret_2026!');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Account not found.'
      });
    }
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Session expired or invalid. Please sign in again.'
    });
  }
}

export async function optionalAuth(req, res, next) {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hideme_secure_jwt_token_key_secret_2026!');
      req.user = await User.findById(decoded.id).select('-password');
    } catch {
      // Ignore token verification errors for optional auth
    }
  }
  next();
}
