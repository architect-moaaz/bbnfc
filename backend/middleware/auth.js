const jwt = require('jsonwebtoken');
const { userOperations } = require('../utils/dbOperations');

// Attach schema-style permission helpers to a plain native-driver user document
// so routes/middleware can call req.user.isOrgAdmin()/hasPermission()/etc.
// WITHOUT depending on Mongoose — which is not reliably connected in the Vercel
// serverless runtime, so using it in the auth path 401s every request (instant
// logout). The rest of the app uses the native driver, which connects reliably.
const attachUserMethods = (user) => {
  if (!user) return user;
  user.isOrgAdmin = () =>
    user.role === 'org_admin' || user.role === 'admin' || user.role === 'super_admin' ||
    user.organizationRole === 'admin' || user.organizationRole === 'owner';
  user.hasPermission = (permission) => {
    if (user.role === 'super_admin' || user.role === 'admin') return true;
    const orgAdminPermissions = ['manage_cards', 'view_cards', 'manage_profiles', 'view_profiles', 'manage_users', 'view_users', 'view_analytics', 'manage_organization', 'manage_templates', 'manage_invitations'];
    if (user.isOrgAdmin() && orgAdminPermissions.includes(permission)) return true;
    return ['view_profiles', 'view_cards', 'view_analytics'].includes(permission);
  };
  user.isAccountLocked = () => !!(user.accountLockedUntil && user.accountLockedUntil > Date.now());
  return user;
};

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
    // Load via the native driver (reliable in serverless); attach permission helpers.
    req.user = attachUserMethods(await userOperations.findById(decoded.id));

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // User authenticated successfully
    
    next();
  } catch (err) {
    console.error('Auth protect error:', err && err.message);
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