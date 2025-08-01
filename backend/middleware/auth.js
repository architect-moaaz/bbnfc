const jwt = require('jsonwebtoken');
const { userOperations } = require('../utils/dbOperations');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await userOperations.findById(decoded.id);
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }
    
    console.log('Auth middleware - user object:', req.user);
    console.log('Auth middleware - user _id:', req.user._id);
    console.log('Auth middleware - user constructor:', req.user.constructor.name);
    
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if user owns the resource - updated for native MongoDB
exports.checkOwnership = (collectionName) => {
  return async (req, res, next) => {
    try {
      const { getDatabase, ObjectId } = require('../utils/mongodb');
      const db = await getDatabase();
      const resource = await db.collection(collectionName).findOne({ _id: new ObjectId(req.params.id) });
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          error: 'Resource not found'
        });
      }
      
      // Check if user owns the resource or is admin
      if (resource.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this resource'
        });
      }
      
      req.resource = resource;
      next();
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  };
};