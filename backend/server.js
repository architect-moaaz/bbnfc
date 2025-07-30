const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Trust proxy configuration for rate limiting
// In development, disable trust proxy to avoid X-Forwarded-For header issues
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
} else {
  app.set('trust proxy', false);
}

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

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nfc-business-cards')
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/cards', require('./routes/cards'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));

// Public profile access routes
app.use('/p', require('./routes/public'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});