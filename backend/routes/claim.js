const express = require('express');
const router = express.Router();
const ClaimToken = require('../models/ClaimToken');
const Card = require('../models/Card');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Organization = require('../models/Organization');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');
const permission = require('../middleware/permission');
const tenant = require('../middleware/tenant');

/**
 * @route   POST /api/claim/generate
 * @desc    Generate claim token for a card
 * @access  Org Admin or Super Admin
 */
router.post('/generate',
  protect,
  permission.canManageCards,
  tenant.detectTenant,
  tenant.requireTenant,
  async (req, res) => {
    try {
      const {
        cardId,
        email,
        name,
        phone,
        expiresInDays = 7,
        requireEmailVerification = true
      } = req.body;

      if (!cardId || !email) {
        return res.status(400).json({
          success: false,
          error: 'Card ID and email are required'
        });
      }

      // Find the card
      const card = await Card.findById(cardId);

      if (!card) {
        return res.status(404).json({
          success: false,
          error: 'Card not found'
        });
      }

      // Check if card is claimable
      if (!card.isClaimable()) {
        return res.status(400).json({
          success: false,
          error: 'Card is not in a claimable state',
          currentStatus: card.status
        });
      }

      // Check if card belongs to same organization
      if (card.organization.toString() !== req.organization._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Card does not belong to your organization'
        });
      }

      // Create claim token
      const claimToken = await ClaimToken.createClaimToken({
        type: 'card',
        organization: req.organization._id,
        card: cardId,
        assignedTo: { email, name, phone },
        expiresInDays,
        requireEmailVerification,
        createdBy: req.user._id
      });

      // Update card with claim token
      card.claimToken = claimToken._id;
      card.status = 'provisioned';
      card.lifecycleStage = 'encoded';
      await card.save();

      // Log action
      await AuditLog.log({
        organization: req.organization._id,
        actor: {
          userId: req.user._id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role
        },
        action: 'claim_token.created',
        resource: {
          type: 'claim_token',
          id: claimToken._id,
          identifier: claimToken.token
        },
        eventData: {
          cardId: card.cardId,
          recipientEmail: email
        },
        context: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        },
        severity: 'medium'
      });

      // TODO: Send claim invitation email

      res.status(201).json({
        success: true,
        data: {
          claimToken: claimToken.token,
          claimUrl: claimToken.getClaimUrl(),
          expiresAt: claimToken.expiresAt,
          card: {
            id: card._id,
            cardId: card.cardId,
            status: card.status
          }
        }
      });
    } catch (error) {
      console.error('Generate claim token error:', error);
      res.status(500).json({
        success: false,
        error: 'Error generating claim token',
        details: error.message
      });
    }
  }
);

/**
 * @route   GET /api/claim/:token
 * @desc    Get claim token details (public)
 * @access  Public
 */
router.get('/:token', async (req, res) => {
  try {
    const claimToken = await ClaimToken.findByToken(req.params.token);

    if (!claimToken) {
      return res.status(404).json({
        success: false,
        error: 'Claim token not found or expired'
      });
    }

    // Check if token is valid
    if (!claimToken.isValid()) {
      return res.status(400).json({
        success: false,
        error: 'Claim token is no longer valid',
        status: claimToken.status
      });
    }

    // Populate organization and card
    await claimToken.populate('organization', 'name branding subdomain');
    await claimToken.populate('card', 'cardId status physical');

    res.json({
      success: true,
      data: {
        organization: claimToken.organization,
        card: claimToken.card,
        assignedTo: claimToken.assignedTo,
        requireEmailVerification: claimToken.requireEmailVerification,
        expiresAt: claimToken.expiresAt
      }
    });
  } catch (error) {
    console.error('Get claim token error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching claim token'
    });
  }
});

/**
 * @route   POST /api/claim/:token/verify-email
 * @desc    Send email verification code
 * @access  Public
 */
router.post('/:token/verify-email', async (req, res) => {
  try {
    const claimToken = await ClaimToken.findByToken(req.params.token);

    if (!claimToken || !claimToken.isValid()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired claim token'
      });
    }

    if (!claimToken.requireEmailVerification) {
      return res.status(400).json({
        success: false,
        error: 'Email verification not required for this token'
      });
    }

    // Generate verification code
    await claimToken.generateVerificationCode();

    // TODO: Send verification code via email

    res.json({
      success: true,
      message: 'Verification code sent to email',
      email: claimToken.assignedTo.email
    });
  } catch (error) {
    console.error('Send verification email error:', error);
    res.status(500).json({
      success: false,
      error: 'Error sending verification email'
    });
  }
});

/**
 * @route   POST /api/claim/:token/verify-code
 * @desc    Verify email code
 * @access  Public
 */
router.post('/:token/verify-code', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Verification code is required'
      });
    }

    const claimToken = await ClaimToken.findByToken(req.params.token);

    if (!claimToken || !claimToken.isValid()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired claim token'
      });
    }

    const isValid = await claimToken.verifyCode(code);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification code'
      });
    }

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({
      success: false,
      error: 'Error verifying code'
    });
  }
});

/**
 * @route   POST /api/claim/:token/claim
 * @desc    Claim card with token
 * @access  Authenticated
 */
router.post('/:token/claim',
  protect,
  async (req, res) => {
    try {
      const { profileData } = req.body;

      const claimToken = await ClaimToken.findByToken(req.params.token)
        .populate('card')
        .populate('organization');

      if (!claimToken || !claimToken.isValid()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired claim token'
        });
      }

      // Check if email verification is required and completed
      if (claimToken.requireEmailVerification && !claimToken.emailVerified) {
        return res.status(400).json({
          success: false,
          error: 'Email verification required',
          code: 'EMAIL_NOT_VERIFIED'
        });
      }

      // Check if user email matches token
      if (req.user.email !== claimToken.assignedTo.email) {
        return res.status(403).json({
          success: false,
          error: 'User email does not match claim token'
        });
      }

      // Update user organization if not set
      if (!req.user.organization) {
        req.user.organization = claimToken.organization._id;
        req.user.role = 'org_member';
        req.user.organizationRole = 'member';
        await req.user.save();

        // Increment organization usage
        await claimToken.organization.incrementUsage('users', 1);
      }

      // Create or use existing profile
      let profile;
      if (profileData) {
        profile = await Profile.create({
          user: req.user._id,
          organization: claimToken.organization._id,
          ...profileData,
          status: 'draft'
        });

        // Increment profile usage
        await claimToken.organization.incrementUsage('profiles', 1);
      }

      // Claim the token
      await claimToken.claim(req.user._id);

      // Mark card as claimed and assign to user
      const card = claimToken.card;
      await card.markClaimed(req.user._id, 'token');

      if (profile) {
        await card.assignTo(req.user._id, profile._id, req.user._id, 'Card claimed via token');
      }

      // Update user claim status
      req.user.claimStatus = 'completed';
      req.user.claimToken = claimToken._id;
      await req.user.save();

      // Log action
      await AuditLog.log({
        organization: claimToken.organization._id,
        actor: {
          userId: req.user._id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role
        },
        action: 'card.claimed',
        resource: {
          type: 'card',
          id: card._id,
          identifier: card.cardId
        },
        eventData: {
          claimToken: claimToken._id,
          method: 'token'
        },
        context: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        },
        severity: 'medium'
      });

      res.json({
        success: true,
        message: 'Card claimed successfully',
        data: {
          card: {
            id: card._id,
            cardId: card.cardId,
            status: card.status
          },
          profile: profile ? {
            id: profile._id,
            username: profile.username
          } : null,
          user: {
            id: req.user._id,
            email: req.user.email,
            organization: req.user.organization
          }
        }
      });
    } catch (error) {
      console.error('Claim card error:', error);
      res.status(500).json({
        success: false,
        error: 'Error claiming card',
        details: error.message
      });
    }
  }
);

/**
 * @route   POST /api/claim/:token/revoke
 * @desc    Revoke claim token
 * @access  Org Admin or Super Admin
 */
router.post('/:token/revoke',
  protect,
  permission.canManageCards,
  async (req, res) => {
    try {
      const { reason } = req.body;

      const claimToken = await ClaimToken.findByToken(req.params.token)
        .populate('organization')
        .populate('card');

      if (!claimToken) {
        return res.status(404).json({
          success: false,
          error: 'Claim token not found'
        });
      }

      // Check organization access
      if (req.user.role !== 'super_admin') {
        if (!req.user.organization || req.user.organization.toString() !== claimToken.organization._id.toString()) {
          return res.status(403).json({
            success: false,
            error: 'Access denied'
          });
        }
      }

      await claimToken.revoke(req.user._id, reason);

      // Update card if still associated
      if (claimToken.card && claimToken.card.claimToken?.toString() === claimToken._id.toString()) {
        claimToken.card.claimToken = null;
        claimToken.card.status = 'inventory';
        await claimToken.card.save();
      }

      // Log action
      await AuditLog.log({
        organization: claimToken.organization._id,
        actor: {
          userId: req.user._id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role
        },
        action: 'claim_token.revoked',
        resource: {
          type: 'claim_token',
          id: claimToken._id,
          identifier: claimToken.token
        },
        eventData: { reason },
        context: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        },
        severity: 'medium'
      });

      res.json({
        success: true,
        message: 'Claim token revoked successfully'
      });
    } catch (error) {
      console.error('Revoke claim token error:', error);
      res.status(500).json({
        success: false,
        error: 'Error revoking claim token'
      });
    }
  }
);

/**
 * @route   GET /api/claim/organization/:orgId
 * @desc    List claim tokens for organization
 * @access  Org Admin or Super Admin
 */
router.get('/organization/:orgId',
  protect,
  permission.canManageCards,
  tenant.setTenantFromParam('orgId'),
  tenant.checkTenantAccess,
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 50,
        status,
        type,
        search
      } = req.query;

      const query = { organization: req.params.orgId };

      if (status) query.status = status;
      if (type) query.type = type;
      if (search) {
        query.$or = [
          { 'assignedTo.email': { $regex: search, $options: 'i' } },
          { 'assignedTo.name': { $regex: search, $options: 'i' } }
        ];
      }

      const total = await ClaimToken.countDocuments(query);
      const claimTokens = await ClaimToken.find(query)
        .populate('card', 'cardId serialNumber status')
        .populate('claimedBy', 'name email username')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      res.json({
        success: true,
        data: claimTokens,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('List claim tokens error:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching claim tokens'
      });
    }
  }
);

/**
 * @route   POST /api/claim/bulk-generate
 * @desc    Generate bulk claim tokens
 * @access  Org Admin or Super Admin
 */
router.post('/bulk-generate',
  protect,
  permission.canManageCards,
  tenant.detectTenant,
  tenant.requireTenant,
  async (req, res) => {
    try {
      const {
        invitations, // Array of { email, name, cardId }
        expiresInDays = 7,
        requireEmailVerification = true
      } = req.body;

      if (!Array.isArray(invitations) || invitations.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invitations array is required'
        });
      }

      if (invitations.length > 100) {
        return res.status(400).json({
          success: false,
          error: 'Maximum 100 invitations per batch'
        });
      }

      const results = [];
      const errors = [];

      for (const invitation of invitations) {
        try {
          const { email, name, cardId } = invitation;

          const card = await Card.findById(cardId);
          if (!card || card.organization.toString() !== req.organization._id.toString()) {
            errors.push({ email, error: 'Card not found or invalid' });
            continue;
          }

          if (!card.isClaimable()) {
            errors.push({ email, error: 'Card not claimable', cardId: card.cardId });
            continue;
          }

          const claimToken = await ClaimToken.createClaimToken({
            type: 'card',
            organization: req.organization._id,
            card: cardId,
            assignedTo: { email, name },
            expiresInDays,
            requireEmailVerification,
            createdBy: req.user._id
          });

          card.claimToken = claimToken._id;
          card.status = 'provisioned';
          await card.save();

          results.push({
            email,
            cardId: card.cardId,
            claimToken: claimToken.token,
            claimUrl: claimToken.getClaimUrl()
          });

          // TODO: Send invitation email
        } catch (error) {
          errors.push({ email: invitation.email, error: error.message });
        }
      }

      // Log action
      await AuditLog.log({
        organization: req.organization._id,
        actor: {
          userId: req.user._id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role
        },
        action: 'claim_token.bulk_created',
        resource: {
          type: 'claim_token',
          identifier: `Bulk creation: ${results.length} tokens`
        },
        eventData: {
          totalInvitations: invitations.length,
          successful: results.length,
          failed: errors.length
        },
        context: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        },
        severity: 'medium'
      });

      res.status(201).json({
        success: true,
        data: {
          successful: results,
          failed: errors,
          summary: {
            total: invitations.length,
            successful: results.length,
            failed: errors.length
          }
        }
      });
    } catch (error) {
      console.error('Bulk generate claim tokens error:', error);
      res.status(500).json({
        success: false,
        error: 'Error generating claim tokens',
        details: error.message
      });
    }
  }
);

module.exports = router;
