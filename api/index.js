const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
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

// Supabase connection test
const { supabase } = require('../backend/utils/supabase');

// Don't connect immediately - let routes handle it
// This prevents connection timeouts during cold starts

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    supabaseUrl: process.env.SUPABASE_URL ? 'configured' : 'missing',
    nodeVersion: process.version,
    database: 'supabase'
  });
});

// Test Supabase connection route
app.get('/api/test-db', async (req, res) => {
  try {
    // Test Supabase connection by counting users
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      throw error;
    }
    
    res.json({
      status: 'success',
      message: 'Supabase connected successfully',
      userCount: count,
      database: 'supabase-postgresql'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Supabase connection failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// No database middleware needed for Supabase - it's serverless!

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