import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { sanitizeInputs } from './middleware/sanitize.js';
import authRoutes from './routes/authRoutes.js';
import carrierRoutes from './routes/carrierRoutes.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        mediaSrc: ["'self'", "blob:", "http://localhost:5000", "http://localhost:5173"],
        connectSrc: ["'self'", "http://localhost:5000", "http://localhost:5173"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    crossOriginEmbedderPolicy: false
  })
);

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again shortly.'
  }
});
app.use(globalLimiter);

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range']
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInputs);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Hide Me API',
    timestamp: new Date().toISOString()
  });
});

// Security verification endpoint
app.get('/api/security-audit', (req, res) => {
  res.json({
    status: 'active',
    headers: {
      strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
      contentSecurityPolicy: 'Active',
      xContentTypeOptions: 'nosniff',
      xFrameOptions: 'SAMEORIGIN'
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/carrier', carrierRoutes);
app.use('/api/audio', carrierRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found.' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.'
  });
});

app.listen(PORT, () => {
  console.log(`Hide Me server running on http://localhost:${PORT}`);
});
