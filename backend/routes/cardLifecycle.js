const express = require('express');
const router = express.Router();
const Card = require('../models/Card');
const Organization = require('../models/Organization');
const User = require('../models/User');
const Profile = require('../models/Profile');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');
const permission = require('../middleware/permission');
const tenant = require('../middleware/tenant');

/**
 * @route   POST /api/card-lifecycle
 * @desc    Create single card
 * @access  Org Admin or Super Admin
 */
router.post('/',
  protect,
  permission.canManageCards,
  tenant.detectTenant,
  tenant.requireTenant,
  tenant.checkLimit('cards', 1),
  async (req, res) => {
    try {
      const {
        serialNumber,
        sku,
        batchNumber,
        productLine,
        physical,
        ndefUrl
      } = req.body;

      const card = await Card.create({
        organization: req.organization._id,
        serialNumber,
        sku,
        batchNumber,
        productLine,
        physical,
        ndefUrl,
        status: 'inventory',
        lifecycleStage: 'manufactured',
        createdBy: req.user._id
      });

      // Increment usage
      await req.organization.incrementUsage('cards', 1);

      // Log action
      await AuditLog.log({
        organization: req.organization._id,
        actor: {
          userId: req.user._id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role
        },
        action: 'card.created',
        resource: {
          type: 'card',
          id: card._id,
          identifier: card.cardId
        },
        context: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        },
        severity: 'low'
      });

      res.status(201).json({
        success: true,
        data: card
      });
    } catch (error) {
      console.error('Create card error:', error);
      res.status(500).json({
        success: false,
        error: 'Error creating card',
        details: error.message
      });
    }
  }
);

/**
 * @route   POST /api/card-lifecycle/bulk
 * @desc    Bulk create cards
 * @access  Org Admin or Super Admin
 */
router.post('/bulk',
  protect,
  permission.canManageCards,
  tenant.detectTenant,
  tenant.requireTenant,
  async (req, res) => {
    try {
      const {
        count,
        sku,
        batchNumber,
        productLine,
        physical,
        ndefUrlTemplate
      } = req.body;

      if (!count || count < 1 || count > 1000) {
        return res.status(400).json({
          success: false,
          error: 'Count must be between 1 and 1000'
        });
      }

      // Check limit
      if (!req.organization.canAddCards(count)) {
        return res.status(403).json({
          success: false,
          error: `Organization cards limit reached`,
          code: 'LIMIT_EXCEEDED',
          limit: req.organization.limits.cards,
          current: req.organization.usage.cards
        });
      }

      const cards = await Card.bulkCreate(count, req.organization._id, {
        sku,
        batchNumber,
        productLine,
        physical,
        ndefUrlTemplate,
        createdBy: req.user._id
      });

      // Increment usage
      await req.organization.incrementUsage('cards', count);

      // Log action
      await AuditLog.log({
        organization: req.organization._id,
        actor: {
          userId: req.user._id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role
        },
        action: 'card.bulk_created',
        resource: {
          type: 'card',
          identifier: `Batch: ${batchNumber || 'N/A'}`
        },
        eventData: { count },
        context: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        },
        severity: 'medium'
      });

      res.status(201).json({
        success: true,
        data: {
          count: cards.length,
          cards: cards.slice(0, 10), // Return first 10
          batchNumber
        }
      });
    } catch (error) {
      console.error('Bulk create cards error:', error);
      res.status(500).json({
        success: false,
        error: 'Error creating cards',
        details: error.message
      });
    }
  }
);

/**
 * @route   GET /api/card-lifecycle
 * @desc    List cards (with filters)
 * @access  Org Admin or Super Admin
 */
router.get('/',
  protect,
  permission.canManageCards,
  tenant.detectTenant,
  tenant.requireTenant,
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 50,
        status,
        lifecycleStage,
        batchNumber,
        sku,
        assignedTo,
        search
      } = req.query;

      const query = { organization: req.organization._id };

      if (status) query.status = status;
      if (lifecycleStage) query.lifecycleStage = lifecycleStage;
      if (batchNumber) query.batchNumber = batchNumber;
      if (sku) query.sku = sku;
      if (assignedTo) query.assignedTo = assignedTo;

      if (search) {
        query.$or = [
          { cardId: { $regex: search, $options: 'i' } },
          { serialNumber: { $regex: search, $options: 'i' } }
        ];
      }

      const total = await Card.countDocuments(query);
      const cards = await Card.find(query)
        .populate('assignedTo', 'name email username')
        .populate('assignedProfile', 'username personalInfo.firstName personalInfo.lastName')
        .populate('claimToken', 'status expiresAt')
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
      console.error('List cards error:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching cards'
      });
    }
  }
);

/**
 * @route   GET /api/card-lifecycle/available
 * @desc    Get available cards for assignment
 * @access  Org Admin or Super Admin
 */
router.get('/available',
  protect,
  permission.canManageCards,
  tenant.detectTenant,
  tenant.requireTenant,
  async (req, res) => {
    try {
      const { limit = 50 } = req.query;

      const cards = await Card.findAvailableForOrg(
        req.organization._id,
        parseInt(limit)
      );

      res.json({
        success: true,
        data: cards
      });
    } catch (error) {
      console.error('Get available cards error:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching available cards'
      });
    }
  }
);

/**
 * @route   GET /api/card-lifecycle/stats
 * @desc    Get card statistics
 * @access  Org Admin or Super Admin
 */
router.get('/stats',
  protect,
  permission.canManageCards,
  tenant.detectTenant,
  tenant.requireTenant,
  async (req, res) => {
    try {
      const stats = await Card.getOrgStats(req.organization._id);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get card stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching statistics'
      });
    }
  }
);

/**
 * @route   GET /api/card-lifecycle/:id
 * @desc    Get single card
 * @access  Org Admin or card owner
 */
router.get('/:id',
  protect,
  async (req, res) => {
    try {
      const card = await Card.findById(req.params.id)
        .populate('organization', 'name subdomain branding')
        .populate('assignedTo', 'name email username profilePhoto')
        .populate('assignedProfile', 'username personalInfo contactInfo')
        .populate('claimToken', 'status expiresAt assignedTo')
        .populate('assignmentHistory.user', 'name email')
        .populate('assignmentHistory.profile', 'username personalInfo.firstName personalInfo.lastName');

      if (!card) {
        return res.status(404).json({
          success: false,
          error: 'Card not found'
        });
      }

      // Check access: super admin, org admin, or card owner
      if (req.user.role !== 'super_admin') {
        if (!req.user.organization || req.user.organization.toString() !== card.organization._id.toString()) {
          if (!card.assignedTo || card.assignedTo._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
              success: false,
              error: 'Access denied'
            });
          }
        } else if (!req.user.isOrgAdmin()) {
          // Org members can only see their own cards
          if (!card.assignedTo || card.assignedTo._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
              success: false,
              error: 'Access denied'
            });
          }
        }
      }

      res.json({
        success: true,
        data: card
      });
    } catch (error) {
      console.error('Get card error:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching card'
      });
    }
  }
);

/**
 * @route   PUT /api/card-lifecycle/:id
 * @desc    Update card
 * @access  Org Admin or Super Admin
 */
router.put('/:id',
  protect,
  permission.canManageCards,
  async (req, res) => {
    try {
      const {
        serialNumber,
        sku,
        batchNumber,
        physical,
        ndefUrl,
        shipping
      } = req.body;

      const card = await Card.findById(req.params.id);

      if (!card) {
        return res.status(404).json({
          success: false,
          error: 'Card not found'
        });
      }

      // Check organization access
      if (req.user.role !== 'super_admin') {
        if (!req.user.organization || req.user.organization.toString() !== card.organization.toString()) {
          return res.status(403).json({
            success: false,
            error: 'Access denied'
          });
        }
      }

      const oldData = card.toObject();

      // Update fields
      if (serialNumber) card.serialNumber = serialNumber;
      if (sku) card.sku = sku;
      if (batchNumber) card.batchNumber = batchNumber;
      if (physical) card.physical = { ...card.physical, ...physical };
      if (ndefUrl) card.ndefUrl = ndefUrl;
      if (shipping) card.shipping = { ...card.shipping, ...shipping };

      await card.save();

      // Log action
      await AuditLog.log({
        organization: card.organization,
        actor: {
          userId: req.user._id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role
        },
        action: 'card.updated',
        resource: {
          type: 'card',
          id: card._id,
          identifier: card.cardId
        },
        changes: {
          before: oldData,
          after: card.toObject()
        },
        context: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        },
        severity: 'low'
      });

      res.json({
        success: true,
        data: card
      });
    } catch (error) {
      console.error('Update card error:', error);
      res.status(500).json({
        success: false,
        error: 'Error updating card'
      });
    }
  }
);

/**
 * @route   POST /api/card-lifecycle/:id/assign
 * @desc    Assign card to user
 * @access  Org Admin or Super Admin
 */
router.post('/:id/assign',
  protect,
  permission.canManageCards,
  async (req, res) => {
    try {
      const { userId, profileId, reason } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const card = await Card.findById(req.params.id);

      if (!card) {
        return res.status(404).json({
          success: false,
          error: 'Card not found'
        });
      }

      // Check organization access
      if (req.user.role !== 'super_admin') {
        if (!req.user.organization || req.user.organization.toString() !== card.organization.toString()) {
          return res.status(403).json({
            success: false,
            error: 'Access denied'
          });
        }
      }

      // Verify user exists and belongs to same organization
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (user.organization.toString() !== card.organization.toString()) {
        return res.status(400).json({
          success: false,
          error: 'User does not belong to the same organization'
        });
      }

      // Verify profile if provided
      if (profileId) {
        const profile = await Profile.findById(profileId);
        if (!profile || profile.user.toString() !== userId) {
          return res.status(400).json({
            success: false,
            error: 'Invalid profile for this user'
          });
        }
      }

      await card.assignTo(userId, profileId, req.user._id, reason);

      // Log action
      await AuditLog.log({
        organization: card.organization,
        actor: {
          userId: req.user._id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role
        },
        action: 'card.assigned',
        resource: {
          type: 'card',
          id: card._id,
          identifier: card.cardId
        },
        eventData: {
          assignedTo: userId,
          profile: profileId,
          reason
        },
        context: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        },
        severity: 'medium'
      });

      const populatedCard = await Card.findById(card._id)
        .populate('assignedTo', 'name email username')
        .populate('assignedProfile', 'username personalInfo');

      res.json({
        success: true,
        data: populatedCard
      });
    } catch (error) {
      console.error('Assign card error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error assigning card'
      });
    }
  }
);

/**
 * @route   POST /api/card-lifecycle/:id/unassign
 * @desc    Unassign card from user
 * @access  Org Admin or Super Admin
 */
router.post('/:id/unassign',
  protect,
  permission.canManageCards,
  async (req, res) => {
    try {
      const { reason } = req.body;

      const card = await Card.findById(req.params.id);

      if (!card) {
        return res.status(404).json({
          success: false,
          error: 'Card not found'
        });
      }

      // Check organization access
      if (req.user.role !== 'super_admin') {
        if (!req.user.organization || req.user.organization.toString() !== card.organization.toString()) {
          return res.status(403).json({
            success: false,
            error: 'Access denied'
          });
        }
      }

      const oldAssignedTo = card.assignedTo;

      await card.unassign(req.user._id, reason);

      // Log action
      await AuditLog.log({
        organization: card.organization,
        actor: {
          userId: req.user._id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role
        },
        action: 'card.unassigned',
        resource: {
          type: 'card',
          id: card._id,
          identifier: card.cardId
        },
        eventData: {
          previousUser: oldAssignedTo,
          reason
        },
        context: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        },
        severity: 'medium'
      });

      res.json({
        success: true,
        data: card
      });
    } catch (error) {
      console.error('Unassign card error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error unassigning card'
      });
    }
  }
);

/**
 * @route   POST /api/card-lifecycle/:id/reassign
 * @desc    Reassign card to different user
 * @access  Org Admin or Super Admin
 */
router.post('/:id/reassign',
  protect,
  permission.canManageCards,
  async (req, res) => {
    try {
      const { newUserId, profileId, reason } = req.body;

      if (!newUserId) {
        return res.status(400).json({
          success: false,
          error: 'New user ID is required'
        });
      }

      const card = await Card.findById(req.params.id);

      if (!card) {
        return res.status(404).json({
          success: false,
          error: 'Card not found'
        });
      }

      // Check if card is reassignable
      if (!card.isReassignable()) {
        return res.status(400).json({
          success: false,
          error: 'Card cannot be reassigned in current state'
        });
      }

      // Verify new user
      const newUser = await User.findById(newUserId);
      if (!newUser || newUser.organization.toString() !== card.organization.toString()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user'
        });
      }

      const oldUserId = card.assignedTo;

      await card.reassign(newUserId, profileId, req.user._id, reason);

      // Log action
      await AuditLog.log({
        organization: card.organization,
        actor: {
          userId: req.user._id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role
        },
        action: 'card.reassigned',
        resource: {
          type: 'card',
          id: card._id,
          identifier: card.cardId
        },
        eventData: {
          previousUser: oldUserId,
          newUser: newUserId,
          reason
        },
        context: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        },
        severity: 'medium'
      });

      const populatedCard = await Card.findById(card._id)
        .populate('assignedTo', 'name email username')
        .populate('assignedProfile', 'username personalInfo');

      res.json({
        success: true,
        data: populatedCard
      });
    } catch (error) {
      console.error('Reassign card error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error reassigning card'
      });
    }
  }
);

/**
 * @route   POST /api/card-lifecycle/:id/activate
 * @desc    Activate card
 * @access  Org Admin or Super Admin
 */
router.post('/:id/activate',
  protect,
  permission.canManageCards,
  async (req, res) => {
    try {
      const card = await Card.findById(req.params.id);

      if (!card) {
        return res.status(404).json({
          success: false,
          error: 'Card not found'
        });
      }

      await card.activate();

      // Log action
      await AuditLog.log({
        organization: card.organization,
        actor: {
          userId: req.user._id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role
        },
        action: 'card.activated',
        resource: {
          type: 'card',
          id: card._id,
          identifier: card.cardId
        },
        context: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        },
        severity: 'low'
      });

      res.json({
        success: true,
        data: card
      });
    } catch (error) {
      console.error('Activate card error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error activating card'
      });
    }
  }
);

/**
 * @route   POST /api/card-lifecycle/:id/deactivate
 * @desc    Deactivate card
 * @access  Org Admin or Super Admin
 */
router.post('/:id/deactivate',
  protect,
  permission.canManageCards,
  async (req, res) => {
    try {
      const card = await Card.findById(req.params.id);

      if (!card) {
        return res.status(404).json({
          success: false,
          error: 'Card not found'
        });
      }

      await card.deactivate();

      // Log action
      await AuditLog.log({
        organization: card.organization,
        actor: {
          userId: req.user._id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role
        },
        action: 'card.deactivated',
        resource: {
          type: 'card',
          id: card._id,
          identifier: card.cardId
        },
        context: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        },
        severity: 'medium'
      });

      res.json({
        success: true,
        data: card
      });
    } catch (error) {
      console.error('Deactivate card error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error deactivating card'
      });
    }
  }
);

/**
 * @route   POST /api/card-lifecycle/:id/suspend
 * @desc    Suspend card
 * @access  Org Admin or Super Admin
 */
router.post('/:id/suspend',
  protect,
  permission.canManageCards,
  async (req, res) => {
    try {
      const { reason } = req.body;

      const card = await Card.findById(req.params.id);

      if (!card) {
        return res.status(404).json({
          success: false,
          error: 'Card not found'
        });
      }

      await card.suspend();

      // Log action
      await AuditLog.log({
        organization: card.organization,
        actor: {
          userId: req.user._id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role
        },
        action: 'card.suspended',
        resource: {
          type: 'card',
          id: card._id,
          identifier: card.cardId
        },
        eventData: { reason },
        context: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        },
        severity: 'high'
      });

      res.json({
        success: true,
        data: card
      });
    } catch (error) {
      console.error('Suspend card error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error suspending card'
      });
    }
  }
);

/**
 * @route   POST /api/card-lifecycle/:id/unsuspend
 * @desc    Unsuspend card
 * @access  Org Admin or Super Admin
 */
router.post('/:id/unsuspend',
  protect,
  permission.canManageCards,
  async (req, res) => {
    try {
      const card = await Card.findById(req.params.id);

      if (!card) {
        return res.status(404).json({
          success: false,
          error: 'Card not found'
        });
      }

      await card.unsuspend();

      // Log action
      await AuditLog.log({
        organization: card.organization,
        actor: {
          userId: req.user._id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role
        },
        action: 'card.unsuspended',
        resource: {
          type: 'card',
          id: card._id,
          identifier: card.cardId
        },
        context: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        },
        severity: 'medium'
      });

      res.json({
        success: true,
        data: card
      });
    } catch (error) {
      console.error('Unsuspend card error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error unsuspending card'
      });
    }
  }
);

/**
 * @route   POST /api/card-lifecycle/:id/tap
 * @desc    Record card tap (public endpoint)
 * @access  Public
 */
router.post('/:id/tap', async (req, res) => {
  try {
    const { location, metadata } = req.body;

    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({
        success: false,
        error: 'Card not found'
      });
    }

    await card.recordTap();

    res.json({
      success: true,
      message: 'Tap recorded',
      redirectUrl: card.getUrl()
    });
  } catch (error) {
    console.error('Record tap error:', error);
    res.status(500).json({
      success: false,
      error: 'Error recording tap'
    });
  }
});

/**
 * @route   GET /api/card-lifecycle/:cardId/public
 * @desc    Get public card info (for redirect)
 * @access  Public
 */
router.get('/:cardId/public', async (req, res) => {
  try {
    const card = await Card.findOne({ cardId: req.params.cardId })
      .populate('organization', 'name subdomain branding')
      .populate('assignedProfile', 'username status');

    if (!card) {
      return res.status(404).json({
        success: false,
        error: 'Card not found'
      });
    }

    if (card.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Card is not active',
        status: card.status
      });
    }

    // Record view
    await card.recordView();

    res.json({
      success: true,
      data: {
        cardId: card.cardId,
        status: card.status,
        url: card.getUrl(),
        organization: card.organization
      }
    });
  } catch (error) {
    console.error('Get public card error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching card'
    });
  }
});

module.exports = router;
