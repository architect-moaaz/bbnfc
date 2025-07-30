// Simple test endpoint to verify Vercel functions work
module.exports = (req, res) => {
  res.status(200).json({
    message: 'Test endpoint working!',
    method: req.method,
    timestamp: new Date().toISOString(),
    env: {
      hasMongoUri: !!process.env.MONGODB_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV
    }
  });
};