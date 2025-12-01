const Organization = require('../models/Organization');

/**
 * Middleware to detect and set tenant/organization context
 * Supports: subdomain, custom domain, and organization ID in headers
 */
exports.detectTenant = async (req, res, next) => {
  try {
    let organization = null;
    const host = req.get('host');

    // 1. Check for organization ID in header (for API clients)
    if (req.headers['x-organization-id']) {
      organization = await Organization.findById(req.headers['x-organization-id']);
    }

    // 2. Check for subdomain or custom domain
    if (!organization && host) {
      // Remove port if present
      const hostname = host.split(':')[0];

      // Check if it's a subdomain (e.g., acme.bbtap.me)
      const parts = hostname.split('.');

      // Custom domain check (e.g., cards.company.com)
      if (!hostname.includes('bbtap.me') && !hostname.includes('localhost')) {
        organization = await Organization.findByDomain(hostname);
      }
      // Subdomain check (e.g., acme.bbtap.me)
      else if (parts.length >= 3 && parts[parts.length - 2] === 'bbtap') {
        const subdomain = parts[0];
        if (subdomain !== 'www' && subdomain !== 'api') {
          organization = await Organization.findByDomain(subdomain);
        }
      }
    }

    // 3. Set organization context
    if (organization) {
      // Check if organization is active
      if (!organization.isActive()) {
        return res.status(403).json({
          success: false,
          error: 'Organization is not active',
          code: 'ORG_INACTIVE'
        });
      }

      req.organization = organization;
      req.organizationId = organization._id;
    }

    next();
  } catch (error) {
    console.error('Tenant detection error:', error);
    next(); // Continue without organization context
  }
};

/**
 * Middleware to require tenant context
 * Use this after detectTenant to ensure organization is present
 */
exports.requireTenant = (req, res, next) => {
  if (!req.organization) {
    return res.status(400).json({
      success: false,
      error: 'Organization context required',
      code: 'ORG_REQUIRED'
    });
  }
  next();
};

/**
 * Middleware to check if user belongs to the tenant organization
 */
exports.checkTenantAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (!req.organization) {
    return res.status(400).json({
      success: false,
      error: 'Organization context required'
    });
  }

  // Super admins can access any organization
  if (req.user.role === 'super_admin') {
    return next();
  }

  // Check if user belongs to this organization
  if (!req.user.organization || req.user.organization.toString() !== req.organization._id.toString()) {
    return res.status(403).json({
      success: false,
      error: 'You do not have access to this organization',
      code: 'ORG_ACCESS_DENIED'
    });
  }

  next();
};

/**
 * Middleware to check organization limits
 * @param {string} limitType - Type of limit to check (users, cards, profiles, storage)
 * @param {number} count - Number to add (default: 1)
 */
exports.checkLimit = (limitType, count = 1) => {
  return async (req, res, next) => {
    if (!req.organization) {
      return res.status(400).json({
        success: false,
        error: 'Organization context required'
      });
    }

    // Super admins bypass limits
    if (req.user && req.user.role === 'super_admin') {
      return next();
    }

    let canAdd = false;

    switch (limitType) {
      case 'users':
        canAdd = req.organization.canAddUsers(count);
        break;
      case 'cards':
        canAdd = req.organization.canAddCards(count);
        break;
      case 'profiles':
        canAdd = req.organization.canAddProfiles(count);
        break;
      case 'storage':
        canAdd = req.organization.hasStorageAvailable(count);
        break;
      default:
        return next();
    }

    if (!canAdd) {
      return res.status(403).json({
        success: false,
        error: `Organization ${limitType} limit reached`,
        code: 'LIMIT_EXCEEDED',
        limit: req.organization.limits[limitType],
        current: req.organization.usage[limitType]
      });
    }

    next();
  };
};

/**
 * Middleware to extract subdomain from hostname
 */
exports.extractSubdomain = (req, res, next) => {
  const host = req.get('host');

  if (host) {
    const hostname = host.split(':')[0];
    const parts = hostname.split('.');

    // If subdomain exists (e.g., acme.bbtap.me)
    if (parts.length >= 3 && parts[parts.length - 2] === 'bbtap') {
      req.subdomain = parts[0];
    } else if (!hostname.includes('bbtap.me') && !hostname.includes('localhost')) {
      // Custom domain
      req.customDomain = hostname;
    }
  }

  next();
};

/**
 * Middleware to set tenant context from URL parameter
 * Useful for routes like /api/organizations/:orgId/...
 */
exports.setTenantFromParam = (paramName = 'orgId') => {
  return async (req, res, next) => {
    try {
      const orgId = req.params[paramName];

      if (!orgId) {
        return next();
      }

      const organization = await Organization.findById(orgId);

      if (!organization) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found'
        });
      }

      if (!organization.isActive()) {
        return res.status(403).json({
          success: false,
          error: 'Organization is not active'
        });
      }

      req.organization = organization;
      req.organizationId = organization._id;

      next();
    } catch (error) {
      console.error('Set tenant from param error:', error);
      return res.status(500).json({
        success: false,
        error: 'Error loading organization'
      });
    }
  };
};
