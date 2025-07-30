const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Trust proxy configuration for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting configuration
const createRateLimiter = () => {
  const baseConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  };

  // In development, disable X-Forwarded-For validation to avoid proxy issues
  if (process.env.NODE_ENV === 'development') {
    return rateLimit({
      ...baseConfig,
      validate: {
        xForwardedForHeader: false
      }
    });
  }

  // Production configuration with proper proxy handling
  return rateLimit(baseConfig);
};

const limiter = createRateLimiter();
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Export app without starting server or connecting to database
// This is for serverless environments
module.exports = app;