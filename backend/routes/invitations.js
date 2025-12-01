const express = require('express');
const router = express.Router();
const ClaimToken = require('../models/ClaimToken');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');
const crypto = require('crypto');
const { sendInvitationEmail, sendWelcomeEmail, sendInvitationReminderEmail } = require('../services/emailService');

/**
 * @route   POST /api/invitations/send
 * @desc    Send organization invitation to user via email
 * @access  Org Admin, Admin, Super Admin
 */
router.post('/send',
  protect,
  async (req, res) => {
    try {
      const { email, name, role = 'member', expiresInDays = 7 } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }

      // Check if user has organization and proper role
      if (!req.user.organization) {
        return res.status(403).json({
          success: false,
          error: 'You must belong to an organization to send invitations'
        });
      }

      if (!['org_admin', 'admin', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Only organization admins can send invitations'
        });
      }

      // Get organization
      const organization = await Organization.findById(req.user.organization);

      if (!organization) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found'
        });
      }

      // Check if organization can add more users
      if (!organization.canAddUsers(1)) {
        return res.status(403).json({
          success: false,
          error: `Organization has reached user limit (${organization.limits.users})`
        });
      }

      // Check if user with this email already exists in the organization
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        organization: req.user.organization
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'User with this email is already a member of your organization'
        });
      }

      // Generate token and hash
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Calculate expiry
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      // Create claim token for organization invite
      const claimToken = await ClaimToken.create({
        token,
        tokenHash,
        type: 'organization_invite',
        organization: req.user.organization,
        assignedTo: { email, name },
        status: 'pending',
        expiresAt,
        requireEmailVerification: true,
        createdBy: req.user._id,
        metadata: {
          invitedRole: role
        }
      });

      // Generate invitation URL
      const inviteUrl = `${process.env.FRONTEND_URL}/accept-invite/${token}`;

      // Send invitation email
      try {
        await sendInvitationEmail({
          recipientEmail: email,
          recipientName: name,
          organizationName: organization.name,
          inviterName: req.user.name,
          inviteUrl,
          role,
          expiresAt
        });
        console.log(`Invitation email sent to ${email}`);
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Don't fail the request if email fails
        // Invitation was created and URL is still valid
      }

      res.status(201).json({
        success: true,
        message: 'Invitation sent successfully',
        data: {
          token,
          inviteUrl,
          expiresAt,
          organization: {
            id: organization._id,
            name: organization.name
          },
          recipient: {
            email,
            name
          }
        }
      });
    } catch (error) {
      console.error('Send invitation error:', error);
      res.status(500).json({
        success: false,
        error: 'Error sending invitation',
        details: error.message
      });
    }
  }
);

/**
 * @route   GET /api/invitations/:token
 * @desc    Get invitation details by token
 * @access  Public
 */
router.get('/:token', async (req, res) => {
  try {
    const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const claimToken = await ClaimToken.findOne({ tokenHash })
      .populate('organization', 'name branding subdomain');

    if (!claimToken) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found or expired'
      });
    }

    // Check if token is valid
    if (!claimToken.isValid()) {
      return res.status(400).json({
        success: false,
        error: 'Invitation is no longer valid',
        status: claimToken.status
      });
    }

    // Check token type
    if (claimToken.type !== 'organization_invite') {
      return res.status(400).json({
        success: false,
        error: 'Invalid invitation type'
      });
    }

    res.json({
      success: true,
      data: {
        organization: {
          id: claimToken.organization._id,
          name: claimToken.organization.name,
          branding: claimToken.organization.branding
        },
        assignedTo: claimToken.assignedTo,
        expiresAt: claimToken.expiresAt,
        role: claimToken.metadata?.invitedRole || 'member'
      }
    });
  } catch (error) {
    console.error('Get invitation error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching invitation'
    });
  }
});

/**
 * @route   POST /api/invitations/:token/accept
 * @desc    Accept organization invitation
 * @access  Authenticated
 */
router.post('/:token/accept',
  protect,
  async (req, res) => {
    try {
      const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');

      const claimToken = await ClaimToken.findOne({ tokenHash })
        .populate('organization');

      if (!claimToken || !claimToken.isValid()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired invitation'
        });
      }

      // Check token type
      if (claimToken.type !== 'organization_invite') {
        return res.status(400).json({
          success: false,
          error: 'Invalid invitation type'
        });
      }

      // Check if user email matches token
      if (req.user.email.toLowerCase() !== claimToken.assignedTo.email.toLowerCase()) {
        return res.status(403).json({
          success: false,
          error: 'This invitation was sent to a different email address'
        });
      }

      // Check if user already belongs to an organization
      if (req.user.organization) {
        return res.status(400).json({
          success: false,
          error: 'You already belong to an organization. Please leave your current organization first.'
        });
      }

      // Check if organization can add more users
      if (!claimToken.organization.canAddUsers(1)) {
        return res.status(403).json({
          success: false,
          error: 'Organization has reached user limit'
        });
      }

      // Update user with organization
      req.user.organization = claimToken.organization._id;
      req.user.role = 'org_admin'; // Default role for invited users
      req.user.organizationRole = claimToken.metadata?.invitedRole || 'member';
      await req.user.save();

      // Mark token as claimed
      claimToken.status = 'claimed';
      claimToken.claimedBy = req.user._id;
      claimToken.claimedAt = new Date();
      claimToken.usedCount += 1;
      await claimToken.save();

      // Increment organization user count
      await claimToken.organization.incrementUsage('users', 1);

      // Send welcome email
      try {
        await sendWelcomeEmail({
          recipientEmail: req.user.email,
          recipientName: req.user.name,
          organizationName: claimToken.organization.name,
          dashboardUrl: `${process.env.FRONTEND_URL}/organization`
        });
        console.log(`Welcome email sent to ${req.user.email}`);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the request if email fails
      }

      res.json({
        success: true,
        message: 'Invitation accepted successfully',
        data: {
          user: {
            id: req.user._id,
            email: req.user.email,
            name: req.user.name,
            organization: req.user.organization,
            role: req.user.role,
            organizationRole: req.user.organizationRole
          },
          organization: {
            id: claimToken.organization._id,
            name: claimToken.organization.name,
            slug: claimToken.organization.slug
          }
        }
      });
    } catch (error) {
      console.error('Accept invitation error:', error);
      res.status(500).json({
        success: false,
        error: 'Error accepting invitation',
        details: error.message
      });
    }
  }
);

/**
 * @route   GET /api/invitations/organization/list
 * @desc    List all invitations for the user's organization
 * @access  Org Admin, Admin, Super Admin
 */
router.get('/organization/list',
  protect,
  async (req, res) => {
    try {
      // Check if user has organization and proper role
      if (!req.user.organization) {
        return res.status(403).json({
          success: false,
          error: 'You must belong to an organization'
        });
      }

      if (!['org_admin', 'admin', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Only organization admins can view invitations'
        });
      }

      const { status, page = 1, limit = 20 } = req.query;

      const query = {
        organization: req.user.organization,
        type: 'organization_invite'
      };

      if (status) {
        query.status = status;
      }

      const total = await ClaimToken.countDocuments(query);
      const invitations = await ClaimToken.find(query)
        .populate('createdBy', 'name email')
        .populate('claimedBy', 'name email')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      res.json({
        success: true,
        data: invitations.map(inv => ({
          id: inv._id,
          email: inv.assignedTo.email,
          name: inv.assignedTo.name,
          status: inv.status,
          role: inv.metadata?.invitedRole || 'member',
          expiresAt: inv.expiresAt,
          claimedAt: inv.claimedAt,
          claimedBy: inv.claimedBy,
          createdBy: inv.createdBy,
          createdAt: inv.createdAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('List invitations error:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching invitations'
      });
    }
  }
);

/**
 * @route   DELETE /api/invitations/:token
 * @desc    Revoke/delete an invitation
 * @access  Org Admin, Admin, Super Admin
 */
router.delete('/:token',
  protect,
  async (req, res) => {
    try {
      const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');

      const claimToken = await ClaimToken.findOne({ tokenHash });

      if (!claimToken) {
        return res.status(404).json({
          success: false,
          error: 'Invitation not found'
        });
      }

      // Check if user has permission
      if (!req.user.organization ||
          req.user.organization.toString() !== claimToken.organization.toString()) {
        if (!['admin', 'super_admin'].includes(req.user.role)) {
          return res.status(403).json({
            success: false,
            error: 'Access denied'
          });
        }
      }

      // Revoke the token
      claimToken.status = 'revoked';
      claimToken.revokedAt = new Date();
      claimToken.revokedBy = req.user._id;
      claimToken.revocationReason = 'Revoked by admin';
      await claimToken.save();

      res.json({
        success: true,
        message: 'Invitation revoked successfully'
      });
    } catch (error) {
      console.error('Revoke invitation error:', error);
      res.status(500).json({
        success: false,
        error: 'Error revoking invitation'
      });
    }
  }
);

/**
 * @route   POST /api/invitations/:token/resend
 * @desc    Resend invitation email
 * @access  Org Admin, Admin, Super Admin
 */
router.post('/:token/resend',
  protect,
  async (req, res) => {
    try {
      const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');

      const claimToken = await ClaimToken.findOne({ tokenHash })
        .populate('organization', 'name');

      if (!claimToken) {
        return res.status(404).json({
          success: false,
          error: 'Invitation not found'
        });
      }

      // Check if user has permission
      if (!req.user.organization ||
          req.user.organization.toString() !== claimToken.organization._id.toString()) {
        if (!['admin', 'super_admin'].includes(req.user.role)) {
          return res.status(403).json({
            success: false,
            error: 'Access denied'
          });
        }
      }

      // Check if token is still pending
      if (claimToken.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Can only resend pending invitations'
        });
      }

      const inviteUrl = `${process.env.FRONTEND_URL}/accept-invite/${req.params.token}`;

      // Send invitation reminder email
      try {
        await sendInvitationReminderEmail({
          recipientEmail: claimToken.assignedTo.email,
          recipientName: claimToken.assignedTo.name,
          organizationName: claimToken.organization.name,
          inviteUrl,
          expiresAt: claimToken.expiresAt
        });
        console.log(`Invitation reminder email sent to ${claimToken.assignedTo.email}`);
      } catch (emailError) {
        console.error('Failed to send invitation reminder email:', emailError);
        // Don't fail the request if email fails
      }

      res.json({
        success: true,
        message: 'Invitation resent successfully'
      });
    } catch (error) {
      console.error('Resend invitation error:', error);
      res.status(500).json({
        success: false,
        error: 'Error resending invitation'
      });
    }
  }
);

module.exports = router;
