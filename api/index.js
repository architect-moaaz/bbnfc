const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { connectToDatabase } = require('../backend/utils/mongodb');
require('dotenv').config();

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

// Native MongoDB driver - no need for complex connection handling

// Don't connect immediately - let routes handle it
// This prevents connection timeouts during cold starts

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongoUri: process.env.MONGODB_URI ? 'configured' : 'missing',
    mongoDriver: 'native',
    nodeVersion: process.version
  });
});

// Test DB connection route
app.get('/api/test-db', async (req, res) => {
  try {
    const db = await connectToDatabase();
    
    // Test with a simple operation
    const userCount = await db.collection('users').countDocuments({});
    const collections = await db.listCollections().toArray();
    
    res.json({
      status: 'success',
      message: 'Native MongoDB driver connected successfully',
      userCount: userCount,
      databaseName: db.databaseName,
      collections: collections.map(c => c.name),
      driver: 'native-mongodb'
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

// No middleware needed with native driver - connections are handled per request

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