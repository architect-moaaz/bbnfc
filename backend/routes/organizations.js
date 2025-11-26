const express = require('express');
const router = express.Router();
const Organization = require('../models/Organization');
const User = require('../models/User');
const Card = require('../models/Card');
const Profile = require('../models/Profile');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');
const permission = require('../middleware/permission');
const tenant = require('../middleware/tenant');

/**
 * @route   GET /api/organizations/current
 * @desc    Get current user's organization
 * @access  Private
 */
router.get('/current', protect, async (req, res) => {
  try {
    if (!req.user.organization) {
      return res.status(404).json({
        success: false,
        error: 'User does not belong to any organization'
      });
    }

    const organization = await Organization.findById(req.user.organization)
      .populate('owner', 'name email')
      .populate('members.user', 'name email role');

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    res.json({
      success: true,
      data: organization
    });
  } catch (error) {
    console.error('Get current organization error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   POST /api/organizations
 * @desc    Create new organization
 * @access  Super Admin
 */
router.post('/',
  protect,
  permission.isSuperAdmin,
  async (req, res) => {
    try {
      const {
        name,
        slug,
        subdomain,
        type,
        plan,
        contactInfo,
        branding,
        limits,
        settings,
        ownerId
      } = req.body;

      // Check if subdomain/slug is available
      if (subdomain) {
        const existing = await Organization.findByDomain(subdomain);
        if (existing) {
          return res.status(400).json({
            success: false,
            error: 'Subdomain already taken'
          });
        }
      }

      // Create organization
      const organization = await Organization.create({
        name,
        slug,
        subdomain,
        type,
        plan: plan || 'free',
        contactInfo,
        branding,
        limits,
        settings,
        owner: ownerId || req.user._id,
        admins: [ownerId || req.user._id]
      });

      // Update owner user
      if (ownerId) {
        await User.findByIdAndUpdate(ownerId, {
          organization: organization._id,
          role: 'org_admin',
          organizationRole: 'owner'
        });
      }

      // Log action
      await AuditLog.log({
        organization: organization._id,
        actor: {
          userId: req.user._id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role
        },
        action: 'organization.created',
        resource: {
          type: 'organization',
          id: organization._id,
          name: organization.name
        },
        context: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        },
        severity: 'medium'
      });

      res.status(201).json({
        success: true,
        data: organization
      });
    } catch (error) {
      console.error('Create organization error:', error);
      res.status(500).json({
        success: false,
        error: 'Error creating organization',
        details: error.message
      });
    }
  }
);

/**
 * @route   GET /api/organizations
 * @desc    List all organizations (super admin) or user's organization
 * @access  Authenticated
 */
router.get('/',
  protect,
  async (req, res) => {
    try {
      let organizations;

      if (req.user.role === 'super_admin') {
        // Super admin can see all
        const { page = 1, limit = 20, status, type, plan, search } = req.query;

        const query = {};
        if (status) query.status = status;
        if (type) query.type = type;
        if (plan) query.plan = plan;
        if (search) {
          query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { subdomain: { $regex: search, $options: 'i' } }
          ];
        }

        const total = await Organization.countDocuments(query);
        organizations = await Organization.find(query)
          .populate('owner', 'name email')
          .sort('-createdAt')
          .skip((page - 1) * limit)
          .limit(parseInt(limit));

        return res.json({
          success: true,
          data: organizations,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        });
      } else {
        // Regular users see only their organization
        if (!req.user.organization) {
          return res.json({
            success: true,
            data: []
          });
        }

        const organization = await Organization.findById(req.user.organization)
          .populate('owner', 'name email')
          .populate('admins', 'name email');

        return res.json({
          success: true,
          data: organization
        });
      }
    } catch (error) {
      console.error('List organizations error:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching organizations'
      });
    }
  }
);

/**
 * @route   GET /api/organizations/:id
 * @desc    Get organization details
 * @access  Org Members or Super Admin
 */
router.get('/:id',
  protect,
  tenant.setTenantFromParam('id'),
  tenant.checkTenantAccess,
  async (req, res) => {
    try {
      const organization = await Organization.findById(req.params.id)
        .populate('owner', 'name email profilePhoto')
        .populate('admins', 'name email profilePhoto role');

      if (!organization) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found'
        });
      }

      res.json({
        success: true,
        data: organization
      });
    } catch (error) {
      console.error('Get organization error:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching organization'
      });
    }
  }
);

/**
 * @route   PUT /api/organizations/:id
 * @desc    Update organization
 * @access  Org Admin or Super Admin
 */
router.put('/:id',
  protect,
  tenant.setTenantFromParam('id'),
  permission.any(permission.isSuperAdmin, permission.isOrgAdmin),
  async (req, res) => {
    try {
      const {
        name,
        contactInfo,
        branding,
        settings,
        limits,
        plan,
        status
      } = req.body;

      const organization = await Organization.findById(req.params.id);

      if (!organization) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found'
        });
      }

      const oldData = organization.toObject();

      // Only super admin can change limits, plan, status
      if (req.user.role === 'super_admin') {
        if (limits) organization.limits = { ...organization.limits, ...limits };
        if (plan) organization.plan = plan;
        if (status) organization.status = status;
      }

      // Update allowed fields
      if (name) organization.name = name;
      if (contactInfo) organization.contactInfo = { ...organization.contactInfo, ...contactInfo };
      if (branding) organization.branding = { ...organization.branding, ...branding };
      if (settings) organization.settings = { ...organization.settings, ...settings };

      await organization.save();

      // Log action
      await AuditLog.log({
        organization: organization._id,
        actor: {
          userId: req.user._id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role
        },
        action: 'organization.updated',
        resource: {
          type: 'organization',
          id: organization._id,
          name: organization.name
        },
        changes: {
          before: oldData,
          after: organization.toObject()
        },
        context: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        },
        severity: 'medium'
      });

      res.json({
        success: true,
        data: organization
      });
    } catch (error) {
      console.error('Update organization error:', error);
      res.status(500).json({
        success: false,
        error: 'Error updating organization'
      });
    }
  }
);

/**
 * @route   DELETE /api/organizations/:id
 * @desc    Delete organization
 * @access  Super Admin only
 */
router.delete('/:id',
  protect,
  permission.isSuperAdmin,
  async (req, res) => {
    try {
      const organization = await Organization.findById(req.params.id);

      if (!organization) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found'
        });
      }

      // Soft delete by setting status
      organization.status = 'deleted';
      organization.deletedAt = new Date();
      await organization.save();

      // Log action
      await AuditLog.log({
        organization: organization._id,
        actor: {
          userId: req.user._id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role
        },
        action: 'organization.deleted',
        resource: {
          type: 'organization',
          id: organization._id,
          name: organization.name
        },
        context: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        },
        severity: 'high'
      });

      res.json({
        success: true,
        message: 'Organization deleted successfully'
      });
    } catch (error) {
      console.error('Delete organization error:', error);
      res.status(500).json({
        success: false,
        error: 'Error deleting organization'
      });
    }
  }
);

/**
 * @route   GET /api/organizations/:id/users
 * @desc    Get organization users
 * @access  Org Members or Super Admin
 */
router.get('/:id/users',
  protect,
  tenant.setTenantFromParam('id'),
  tenant.checkTenantAccess,
  async (req, res) => {
    try {
      const { page = 1, limit = 20, role, status, search } = req.query;

      const query = { organization: req.params.id };
      if (role) query.role = role;
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } }
        ];
      }

      const total = await User.countDocuments(query);
      const users = await User.find(query)
        .select('-password -twoFactorSecret -twoFactorBackupCodes')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      res.json({
        success: true,
        data: users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get organization users error:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching users'
      });
    }
  }
);

/**
 * @route   GET /api/organizations/:id/cards
 * @desc    Get organization cards
 * @access  Org Admin or Super Admin
 */
router.get('/:id/cards',
  protect,
  tenant.setTenantFromParam('id'),
  permission.any(permission.isSuperAdmin, permission.isOrgAdmin),
  async (req, res) => {
    try {
      const { page = 1, limit = 50, status, lifecycleStage, search } = req.query;

      const query = { organization: req.params.id };
      if (status) query.status = status;
      if (lifecycleStage) query.lifecycleStage = lifecycleStage;
      if (search) {
        query.$or = [
          { cardId: { $regex: search, $options: 'i' } },
          { serialNumber: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } }
        ];
      }

      const total = await Card.countDocuments(query);
      const cards = await Card.find(query)
        .populate('assignedTo', 'name email username')
        .populate('assignedProfile', 'username personalInfo.firstName personalInfo.lastName')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      res.json({
        success: true,
        data: cards,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get organization cards error:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching cards'
      });
    }
  }
);

/**
 * @route   GET /api/organizations/:id/profiles
 * @desc    Get organization profiles
 * @access  Org Members or Super Admin
 */
router.get('/:id/profiles',
  protect,
  tenant.setTenantFromParam('id'),
  tenant.checkTenantAccess,
  async (req, res) => {
    try {
      const { page = 1, limit = 20, status, search } = req.query;

      const query = { organization: req.params.id };
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { username: { $regex: search, $options: 'i' } },
          { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
          { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
          { 'personalInfo.company': { $regex: search, $options: 'i' } }
        ];
      }

      const total = await Profile.countDocuments(query);
      const profiles = await Profile.find(query)
        .populate('user', 'name email username')
        .populate('card', 'cardId serialNumber')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      res.json({
        success: true,
        data: profiles,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get organization profiles error:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching profiles'
      });
    }
  }
);

/**
 * @route   GET /api/organizations/:id/stats
 * @desc    Get organization statistics
 * @access  Org Admin or Super Admin
 */
router.get('/:id/stats',
  protect,
  tenant.setTenantFromParam('id'),
  permission.any(permission.isSuperAdmin, permission.isOrgAdmin),
  async (req, res) => {
    try {
      const organization = await Organization.findById(req.params.id);

      if (!organization) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found'
        });
      }

      // Get card stats
      const cardStats = await Card.getOrgStats(req.params.id);

      // Get user stats
      const userStats = await User.aggregate([
        { $match: { organization: organization._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Get profile stats
      const profileStats = await Profile.aggregate([
        { $match: { organization: organization._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          organization: {
            plan: organization.plan,
            status: organization.status,
            limits: organization.limits,
            usage: organization.usage
          },
          cards: cardStats,
          users: userStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            acc.total = (acc.total || 0) + stat.count;
            return acc;
          }, {}),
          profiles: profileStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            acc.total = (acc.total || 0) + stat.count;
            return acc;
          }, {})
        }
      });
    } catch (error) {
      console.error('Get organization stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching statistics'
      });
    }
  }
);

/**
 * @route   POST /api/organizations/:id/invite
 * @desc    Invite user to organization
 * @access  Org Admin or Super Admin
 */
router.post('/:id/invite',
  protect,
  tenant.setTenantFromParam('id'),
  permission.any(permission.isSuperAdmin, permission.isOrgAdmin),
  tenant.checkLimit('users', 1),
  async (req, res) => {
    try {
      const { email, name, role, sendEmail } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }

      const organization = await Organization.findById(req.params.id);

      // Check if user already exists
      let user = await User.findOne({ email });

      if (user && user.organization) {
        return res.status(400).json({
          success: false,
          error: 'User already belongs to an organization'
        });
      }

      if (!user) {
        // Create new user
        user = await User.create({
          email,
          name: name || email.split('@')[0],
          organization: organization._id,
          role: role || 'org_member',
          organizationRole: 'member',
          status: 'pending',
          onboardingCompleted: false
        });
      } else {
        // Update existing user
        user.organization = organization._id;
        user.role = role || 'org_member';
        user.organizationRole = 'member';
        user.status = 'pending';
        await user.save();
      }

      // Increment usage
      await organization.incrementUsage('users', 1);

      // TODO: Send invitation email if sendEmail is true

      // Log action
      await AuditLog.log({
        organization: organization._id,
        actor: {
          userId: req.user._id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role
        },
        action: 'user.invited',
        resource: {
          type: 'user',
          id: user._id,
          identifier: user.email
        },
        context: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        },
        severity: 'low'
      });

      res.status(201).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Invite user error:', error);
      res.status(500).json({
        success: false,
        error: 'Error inviting user'
      });
    }
  }
);

/**
 * @route   PUT /api/organizations/:id/branding
 * @desc    Update organization branding
 * @access  Org Admin or Super Admin
 */
router.put('/:id/branding',
  protect,
  tenant.setTenantFromParam('id'),
  permission.any(permission.isSuperAdmin, permission.isOrgAdmin),
  async (req, res) => {
    try {
      const { logo, primaryColor, secondaryColor, customDomain } = req.body;

      const organization = await Organization.findById(req.params.id);

      if (!organization) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found'
        });
      }

      // Check if custom branding is allowed
      if (!organization.settings.allowCustomBranding && req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          error: 'Custom branding not available in current plan'
        });
      }

      if (logo) organization.branding.logo = logo;
      if (primaryColor) organization.branding.primaryColor = primaryColor;
      if (secondaryColor) organization.branding.secondaryColor = secondaryColor;
      if (customDomain !== undefined) {
        organization.branding.customDomain = customDomain;
        organization.branding.customDomainVerified = false; // Reset verification
      }

      await organization.save();

      // Log action
      await AuditLog.log({
        organization: organization._id,
        actor: {
          userId: req.user._id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role
        },
        action: 'organization.branding_updated',
        resource: {
          type: 'organization',
          id: organization._id,
          name: organization.name
        },
        context: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        },
        severity: 'low'
      });

      res.json({
        success: true,
        data: organization
      });
    } catch (error) {
      console.error('Update branding error:', error);
      res.status(500).json({
        success: false,
        error: 'Error updating branding'
      });
    }
  }
);

/**
 * @route   GET /api/organizations/:id/audit-logs
 * @desc    Get organization audit logs
 * @access  Org Admin or Super Admin
 */
router.get('/:id/audit-logs',
  protect,
  tenant.setTenantFromParam('id'),
  permission.any(permission.isSuperAdmin, permission.isOrgAdmin),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 50,
        action,
        severity,
        startDate,
        endDate,
        userId,
        resourceType
      } = req.query;

      const query = { organization: req.params.id };

      if (action) query.action = action;
      if (severity) query.severity = severity;
      if (userId) query['actor.userId'] = userId;
      if (resourceType) query['resource.type'] = resourceType;

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      const total = await AuditLog.countDocuments(query);
      const logs = await AuditLog.find(query)
        .sort('-timestamp')
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      res.json({
        success: true,
        data: logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching audit logs'
      });
    }
  }
);

module.exports = router;
