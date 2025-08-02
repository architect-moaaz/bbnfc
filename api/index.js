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

// Routes - all updated to native MongoDB driver
app.use('/api/auth', require('../backend/routes/auth'));
app.use('/api/users', require('../backend/routes/users')); // ✅ Updated to native driver
app.use('/api/profiles', require('../backend/routes/profiles'));
app.use('/api/cards', require('../backend/routes/cards')); // ✅ Updated to native driver
app.use('/api/analytics', require('../backend/routes/analytics')); // ✅ Updated to native driver
app.use('/api/templates', require('../backend/routes/templates')); // ✅ Updated to native driver
app.use('/api/subscriptions', require('../backend/routes/subscriptions')); // ✅ Updated to native driver
app.use('/api/admin', require('../backend/routes/admin')); // ✅ Updated to native driver
app.use('/api/upload', require('../backend/routes/upload')); // ✅ Compatible with native driver

// Public profile access routes - Moved to API endpoints
// The /p/* routes are now handled by the frontend React app
// API endpoints for public profile data:
app.use('/api/public', require('../backend/routes/public')); // ✅ Updated to native driver


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

// Start server if this file is run directly (not imported)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} with native MongoDB driver`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`MongoDB URI: ${process.env.MONGODB_URI ? 'configured' : 'missing'}`);
  });
}

module.exports = app;