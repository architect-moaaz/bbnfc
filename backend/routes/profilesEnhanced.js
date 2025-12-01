const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const User = require('../models/User');
const Card = require('../models/Card');
const Analytics = require('../models/Analytics');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');
const permission = require('../middleware/permission');
const tenant = require('../middleware/tenant');

/**
 * @route   GET /api/profiles-v2
 * @desc    List user's profiles
 * @access  Authenticated
 */
router.get('/',
  protect,
  async (req, res) => {
    try {
      const { page = 1, limit = 20, status, search } = req.query;

      const query = { user: req.user._id };
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { username: { $regex: search, $options: 'i' } },
          { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
          { 'personalInfo.lastName': { $regex: search, $options: 'i' } }
        ];
      }

      const total = await Profile.countDocuments(query);
      const profiles = await Profile.find(query)
        .populate('card', 'cardId serialNumber status')
        .sort('-updatedAt')
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
      console.error('List profiles error:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching profiles'
      });
    }
  }
);

/**
 * @route   GET /api/profiles-v2/username/:username
 * @desc    Get profile by username (public or private)
 * @access  Public/Authenticated
 */
router.get('/username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { subdomain, password, token } = req.query;

    let profile;

    // If subdomain is provided, search within that organization
    if (subdomain) {
      const org = await require('../models/Organization').findByDomain(subdomain);
      if (!org) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found'
        });
      }

      profile = await Profile.findByUsername(username, org._id);
    } else {
      // Search across all public profiles (no organization constraint)
      profile = await Profile.findOne({ username, status: 'published' })
        .populate('organization', 'name branding subdomain')
        .populate('user', 'name email username')
        .populate('card', 'cardId status');
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    // Check if profile is published
    if (profile.status !== 'published') {
      // Allow owner to view
      if (req.user && req.user._id.toString() === profile.user._id.toString()) {
        return res.json({
          success: true,
          data: profile,
          isPreview: true
        });
      }

      return res.status(403).json({
        success: false,
        error: 'Profile is not published'
      });
    }

    // Check privacy settings
    if (!profile.privacy.isPublic) {
      // Password protected
      if (profile.privacy.password) {
        if (!password || password !== profile.privacy.password) {
          return res.status(401).json({
            success: false,
            error: 'Password required',
            code: 'PASSWORD_REQUIRED'
          });
        }
      }

      // One-time link
      if (token) {
        const isValid = await profile.validateOneTimeLink(token);
        if (!isValid) {
          return res.status(403).json({
            success: false,
            error: 'Invalid or expired link'
          });
        }
        await profile.useOneTimeLink(token);
      } else if (!password && (!req.user || req.user._id.toString() !== profile.user._id.toString())) {
        return res.status(403).json({
          success: false,
          error: 'This profile is private'
        });
      }
    }

    // Record view analytics
    const isOwner = req.user && req.user._id.toString() === profile.user._id.toString();
    if (!isOwner) {
      await Analytics.createEvent({
        organization: profile.organization,
        profile: profile._id,
        user: profile.user,
        card: profile.card,
        eventType: 'view',
        visitor: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          referrer: req.get('referer')
        }
      }, profile.organization ? 90 : 30); // 90 days for org, 30 for individual

      await profile.recordView(true);
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Get profile by username error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching profile'
    });
  }
});

/**
 * @route   GET /api/profiles-v2/:id
 * @desc    Get profile by ID
 * @access  Owner or Org Admin
 */
router.get('/:id',
  protect,
  async (req, res) => {
    try {
      const profile = await Profile.findById(req.params.id)
        .populate('organization', 'name branding subdomain')
        .populate('user', 'name email username')
        .populate('card', 'cardId serialNumber status');

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'Profile not found'
        });
      }

      // Check access
      if (req.user._id.toString() !== profile.user._id.toString()) {
        if (req.user.role !== 'super_admin') {
          if (!req.user.organization || req.user.organization.toString() !== profile.organization?.toString()) {
            return res.status(403).json({
              success: false,
              error: 'Access denied'
            });
          }
          if (!req.user.isOrgAdmin()) {
            return res.status(403).json({
              success: false,
              error: 'Access denied'
            });
          }
        }
      }

      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching profile'
      });
    }
  }
);

/**
 * @route   POST /api/profiles-v2
 * @desc    Create new profile
 * @access  Authenticated
 */
router.post('/',
  protect,
  tenant.detectTenant,
  async (req, res) => {
    try {
      const {
        username,
        personalInfo,
        contactInfo,
        socialLinks,
        customButtons,
        attachments,
        contactForm,
        privacy,
        walletPass,
        language,
        rtl
      } = req.body;

      // Check username availability
      if (username) {
        const existing = await Profile.findOne({
          username,
          organization: req.organization?._id || null
        });

        if (existing) {
          return res.status(400).json({
            success: false,
            error: 'Username already taken'
          });
        }
      }

      // Check organization limits
      if (req.organization) {
        if (!req.organization.canAddProfiles(1)) {
          return res.status(403).json({
            success: false,
            error: 'Profile limit reached',
            code: 'LIMIT_EXCEEDED'
          });
        }
      }

      const profile = await Profile.create({
        user: req.user._id,
        organization: req.organization?._id,
        username,
        personalInfo,
        contactInfo,
        socialLinks,
        customButtons,
        attachments,
        contactForm,
        privacy,
        walletPass,
        language: language || 'en',
        rtl: rtl || false,
        status: 'draft'
      });

      // Increment usage
      if (req.organization) {
        await req.organization.incrementUsage('profiles', 1);
      }

      // Log action
      if (req.organization) {
        await AuditLog.log({
          organization: req.organization._id,
          actor: {
            userId: req.user._id,
            email: req.user.email,
            name: req.user.name,
            role: req.user.role
          },
          action: 'profile.created',
          resource: {
            type: 'profile',
            id: profile._id,
            identifier: profile.username
          },
          context: {
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
          },
          severity: 'low'
        });
      }

      res.status(201).json({
        success: true,
        data: profile
      });
    } catch (error) {
      console.error('Create profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Error creating profile',
        details: error.message
      });
    }
  }
);

/**
 * @route   PUT /api/profiles-v2/:id
 * @desc    Update profile
 * @access  Owner or Org Admin
 */
router.put('/:id',
  protect,
  async (req, res) => {
    try {
      const profile = await Profile.findById(req.params.id);

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'Profile not found'
        });
      }

      // Check ownership
      if (req.user._id.toString() !== profile.user.toString()) {
        if (req.user.role !== 'super_admin' && !req.user.isOrgAdmin()) {
          return res.status(403).json({
            success: false,
            error: 'Access denied'
          });
        }
      }

      const oldData = profile.toObject();

      // Update fields
      const updateFields = [
        'username', 'personalInfo', 'contactInfo', 'socialLinks',
        'customButtons', 'attachments', 'contactForm', 'privacy',
        'walletPass', 'language', 'rtl'
      ];

      updateFields.forEach(field => {
        if (req.body[field] !== undefined) {
          profile[field] = req.body[field];
        }
      });

      await profile.save();

      // Log action
      if (profile.organization) {
        await AuditLog.log({
          organization: profile.organization,
          actor: {
            userId: req.user._id,
            email: req.user.email,
            name: req.user.name,
            role: req.user.role
          },
          action: 'profile.updated',
          resource: {
            type: 'profile',
            id: profile._id,
            identifier: profile.username
          },
          changes: {
            before: oldData,
            after: profile.toObject()
          },
          context: {
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
          },
          severity: 'low'
        });
      }

      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Error updating profile'
      });
    }
  }
);

/**
 * @route   POST /api/profiles-v2/:id/publish
 * @desc    Publish profile
 * @access  Owner
 */
router.post('/:id/publish',
  protect,
  async (req, res) => {
    try {
      const profile = await Profile.findById(req.params.id);

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'Profile not found'
        });
      }

      if (req.user._id.toString() !== profile.user.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      await profile.publish();

      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      console.error('Publish profile error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error publishing profile'
      });
    }
  }
);

/**
 * @route   POST /api/profiles-v2/:id/unpublish
 * @desc    Unpublish profile
 * @access  Owner
 */
router.post('/:id/unpublish',
  protect,
  async (req, res) => {
    try {
      const profile = await Profile.findById(req.params.id);

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'Profile not found'
        });
      }

      if (req.user._id.toString() !== profile.user.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      await profile.unpublish();

      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      console.error('Unpublish profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Error unpublishing profile'
      });
    }
  }
);

/**
 * @route   GET /api/profiles-v2/:id/vcard
 * @desc    Generate and download vCard
 * @access  Public (for published profiles)
 */
router.get('/:id/vcard', async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);

    if (!profile || profile.status !== 'published') {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    const vCard = profile.generateVCard();

    // Record download analytics
    await Analytics.createEvent({
      organization: profile.organization,
      profile: profile._id,
      user: profile.user,
      card: profile.card,
      eventType: 'download',
      eventData: { type: 'vcard' },
      visitor: {
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    await profile.recordContactDownload();

    res.setHeader('Content-Type', 'text/vcard');
    res.setHeader('Content-Disposition', `attachment; filename="${profile.username || 'contact'}.vcf"`);
    res.send(vCard);
  } catch (error) {
    console.error('Generate vCard error:', error);
    res.status(500).json({
      success: false,
      error: 'Error generating vCard'
    });
  }
});

/**
 * @route   POST /api/profiles-v2/:id/link-click
 * @desc    Record link click
 * @access  Public
 */
router.post('/:id/link-click', async (req, res) => {
  try {
    const { linkId, linkType } = req.body;

    const profile = await Profile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    await profile.recordLinkClick(linkId);

    // Record analytics
    await Analytics.createEvent({
      organization: profile.organization,
      profile: profile._id,
      user: profile.user,
      card: profile.card,
      eventType: 'link_click',
      eventData: { linkId, linkType },
      visitor: {
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    res.json({
      success: true,
      message: 'Click recorded'
    });
  } catch (error) {
    console.error('Record link click error:', error);
    res.status(500).json({
      success: false,
      error: 'Error recording click'
    });
  }
});

/**
 * @route   POST /api/profiles-v2/:id/one-time-link
 * @desc    Create one-time share link
 * @access  Owner
 */
router.post('/:id/one-time-link',
  protect,
  async (req, res) => {
    try {
      const { maxViews = 1, expiresInDays = 7 } = req.body;

      const profile = await Profile.findById(req.params.id);

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'Profile not found'
        });
      }

      if (req.user._id.toString() !== profile.user.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const link = await profile.createOneTimeLink(maxViews, expiresInDays);

      const fullUrl = `${profile.getUrl()}?token=${link.token}`;

      res.json({
        success: true,
        data: {
          token: link.token,
          url: fullUrl,
          expiresAt: link.expiresAt,
          maxViews
        }
      });
    } catch (error) {
      console.error('Create one-time link error:', error);
      res.status(500).json({
        success: false,
        error: 'Error creating link'
      });
    }
  }
);

/**
 * @route   DELETE /api/profiles-v2/:id
 * @desc    Delete profile
 * @access  Owner or Org Admin
 */
router.delete('/:id',
  protect,
  async (req, res) => {
    try {
      const profile = await Profile.findById(req.params.id);

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'Profile not found'
        });
      }

      // Check ownership
      if (req.user._id.toString() !== profile.user.toString()) {
        if (req.user.role !== 'super_admin' && !req.user.isOrgAdmin()) {
          return res.status(403).json({
            success: false,
            error: 'Access denied'
          });
        }
      }

      await profile.archive();

      // Log action
      if (profile.organization) {
        await AuditLog.log({
          organization: profile.organization,
          actor: {
            userId: req.user._id,
            email: req.user.email,
            name: req.user.name,
            role: req.user.role
          },
          action: 'profile.deleted',
          resource: {
            type: 'profile',
            id: profile._id,
            identifier: profile.username
          },
          context: {
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
          },
          severity: 'medium'
        });
      }

      res.json({
        success: true,
        message: 'Profile deleted successfully'
      });
    } catch (error) {
      console.error('Delete profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Error deleting profile'
      });
    }
  }
);

module.exports = router;
