const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Set mongoose timeout globally for serverless
mongoose.set('bufferCommands', false);

const app = express();

// Trust proxy configuration for Vercel
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for Vercel
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection with connection reuse for serverless
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log('Using cached database connection');
    return cachedDb;
  }

  try {
    console.log('Creating new database connection...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://m:to7kXzNixG4y78CB@cluster0.dbmqmws.mongodb.net/?retryWrites=true&w=majority&appName=cluster0';
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined');
    }

    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      connectTimeoutMS: 30000,
      family: 4
    });
    
    cachedDb = connection;
    console.log('MongoDB connected successfully');
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Don't connect immediately - let routes handle it
// This prevents connection timeouts during cold starts

// Health check route (no DB required)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongoUri: process.env.MONGODB_URI ? 'configured' : 'missing',
    mongooseVersion: require('mongoose').version,
    nodeVersion: process.version
  });
});

// Test DB connection route
app.get('/api/test-db', async (req, res) => {
  try {
    await connectToDatabase();
    res.json({
      status: 'success',
      message: 'Database connected successfully',
      mongooseConnectionState: require('mongoose').connection.readyState
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Middleware to ensure database connection for other routes
app.use(async (req, res, next) => {
  // Skip database connection for health check
  if (req.path === '/api/health') {
    return next();
  }
  
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Database connection failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Routes
app.use('/api/auth', require('../backend/routes/auth'));
app.use('/api/users', require('../backend/routes/users'));
app.use('/api/profiles', require('../backend/routes/profiles'));
app.use('/api/cards', require('../backend/routes/cards'));
app.use('/api/analytics', require('../backend/routes/analytics'));
app.use('/api/templates', require('../backend/routes/templates'));
app.use('/api/subscriptions', require('../backend/routes/subscriptions'));
app.use('/api/admin', require('../backend/routes/admin'));
app.use('/api/upload', require('../backend/routes/upload'));

// Public profile access routes
app.use('/p', require('../backend/routes/public'));


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'API endpoint not found' 
  });
});

module.exports = app;