/**
 * Permission checking middleware for BBTap platform
 * Implements role-based and resource-based access control
 */

/**
 * Check if user has specific permission
 * @param {string|string[]} permissions - Permission(s) to check
 */
exports.hasPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const perms = Array.isArray(permissions) ? permissions : [permissions];
    const hasAnyPermission = perms.some(perm => req.user.hasPermission(perm));

    if (!hasAnyPermission) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: perms,
        code: 'PERMISSION_DENIED'
      });
    }

    next();
  };
};

/**
 * Check if user is organization admin
 */
exports.isOrgAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (!req.user.isOrgAdmin()) {
    return res.status(403).json({
      success: false,
      error: 'Organization admin access required',
      code: 'ORG_ADMIN_REQUIRED'
    });
  }

  next();
};

/**
 * Check if user is super admin
 */
exports.isSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Super admin access required',
      code: 'SUPER_ADMIN_REQUIRED'
    });
  }

  next();
};

/**
 * Check if user owns the resource or is admin
 * Works with req.params.id and checks user field in resource
 */
exports.isOwnerOrAdmin = (Model, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const resourceId = req.params[resourceIdParam];
      const resource = await Model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          error: 'Resource not found'
        });
      }

      // Super admin can access anything
      if (req.user.role === 'super_admin') {
        req.resource = resource;
        return next();
      }

      // Org admin can access resources in their org
      if (req.user.isOrgAdmin() && resource.organization) {
        if (resource.organization.toString() === req.user.organization.toString()) {
          req.resource = resource;
          return next();
        }
      }

      // Check if user owns the resource
      if (resource.user && resource.user.toString() === req.user._id.toString()) {
        req.resource = resource;
        return next();
      }

      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this resource',
        code: 'RESOURCE_ACCESS_DENIED'
      });
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Error checking resource ownership'
      });
    }
  };
};

/**
 * Check if user can manage cards (org admin or super admin)
 */
exports.canManageCards = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.role === 'super_admin' || req.user.isOrgAdmin()) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'Card management permission required',
    code: 'CARD_MANAGE_DENIED'
  });
};

/**
 * Check if user can manage users (org admin or super admin)
 */
exports.canManageUsers = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.role === 'super_admin' || req.user.isOrgAdmin()) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'User management permission required',
    code: 'USER_MANAGE_DENIED'
  });
};

/**
 * Check if resource belongs to user's organization
 */
exports.belongsToOrganization = (Model, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.organization) {
        return res.status(401).json({
          success: false,
          error: 'Organization membership required'
        });
      }

      const resourceId = req.params[resourceIdParam];
      const resource = await Model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          error: 'Resource not found'
        });
      }

      // Super admin bypass
      if (req.user.role === 'super_admin') {
        req.resource = resource;
        return next();
      }

      // Check if resource belongs to user's organization
      if (resource.organization && resource.organization.toString() === req.user.organization.toString()) {
        req.resource = resource;
        return next();
      }

      return res.status(403).json({
        success: false,
        error: 'Resource does not belong to your organization',
        code: 'ORG_MISMATCH'
      });
    } catch (error) {
      console.error('Organization check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Error checking organization ownership'
      });
    }
  };
};

/**
 * Check if user account is active
 */
exports.isActive = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.status !== 'active') {
    return res.status(403).json({
      success: false,
      error: 'Account is not active',
      status: req.user.status,
      code: 'ACCOUNT_INACTIVE'
    });
  }

  next();
};

/**
 * Check if user account is not locked
 */
exports.notLocked = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.isAccountLocked()) {
    return res.status(403).json({
      success: false,
      error: 'Account is temporarily locked',
      lockedUntil: req.user.accountLockedUntil,
      code: 'ACCOUNT_LOCKED'
    });
  }

  next();
};

/**
 * Combine multiple permission checks
 * All checks must pass
 */
exports.all = (...middlewares) => {
  return (req, res, next) => {
    const runMiddleware = (index) => {
      if (index >= middlewares.length) {
        return next();
      }

      middlewares[index](req, res, (err) => {
        if (err) return next(err);
        runMiddleware(index + 1);
      });
    };

    runMiddleware(0);
  };
};

/**
 * Combine multiple permission checks
 * At least one check must pass
 */
exports.any = (...middlewares) => {
  return (req, res, next) => {
    let lastError = null;
    let passedIndex = -1;

    const runMiddleware = (index) => {
      if (index >= middlewares.length) {
        if (passedIndex === -1) {
          return res.status(403).json({
            success: false,
            error: lastError || 'Insufficient permissions',
            code: 'PERMISSION_DENIED'
          });
        }
        return next();
      }

      middlewares[index](req, res, (err) => {
        if (!err) {
          passedIndex = index;
          return next();
        }
        lastError = err;
        runMiddleware(index + 1);
      });
    };

    runMiddleware(0);
  };
};
