const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const QRCode = require('qrcode');
const { protect } = require('../middleware/auth');
const { detectTenant } = require('../middleware/tenant');
const { checkProfileLimit, incrementProfileUsage, decrementProfileUsage } = require('../middleware/subscription');
const { profileOperations, templateOperations } = require('../utils/dbOperations');

// Get all user profiles
router.get('/', protect, detectTenant, async (req, res) => {
  try {
    // If user is in an organization and org_admin/admin, show all org profiles
    // Otherwise show only user's own profiles
    let profiles;
    if (req.user.organization && (req.user.role === 'org_admin' || req.user.role === 'admin' || req.user.role === 'super_admin')) {
      // Get all profiles in the organization
      profiles = await profileOperations.findByOrganization(req.user.organization);
    } else {
      // Get only user's own profiles
      profiles = await profileOperations.findByUserId(req.user._id);
    }
    
    // Populate template data for each profile
    const profilesWithTemplates = await Promise.all(
      profiles.map(async (profile) => {
        if (profile.template) {
          const template = await templateOperations.findById(profile.template);
          return { ...profile, template };
        }
        return profile;
      })
    );
    
    res.status(200).json({
      success: true,
      count: profilesWithTemplates.length,
      data: profilesWithTemplates
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get single profile (with preview support)
router.get('/:id', protect, async (req, res) => {
  try {
    const profile = await profileOperations.findById(req.params.id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    // Check if user owns the profile or is admin (allow preview for owners)
    if (profile.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this profile'
      });
    }
    
    // Populate template data
    let profileWithTemplate = profile;
    if (profile.template) {
      const template = await templateOperations.findById(profile.template);
      profileWithTemplate = { ...profile, template };
    }
    
    res.status(200).json({
      success: true,
      data: profileWithTemplate
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Create new profile
router.post('/', protect, checkProfileLimit, async (req, res) => {
  try {
    const {
      personalInfo,
      contactInfo,
      socialLinks,
      businessHours,
      template,
      customization,
      sections
    } = req.body;
    
    // Verify template exists if provided, otherwise use default
    let templateId = template;
    // TODO: Re-enable template validation after fixing template operations
    // For now, set templateId to null to avoid template-related issues
    if (!templateId) {
      templateId = null; // Use null instead of trying to find templates
    }
    
    // Transform business hours day names to lowercase to match schema enum
    const normalizedBusinessHours = businessHours && Array.isArray(businessHours) 
      ? businessHours.map(hour => ({
          ...hour,
          day: hour.day ? hour.day.toLowerCase() : hour.day
        }))
      : businessHours;
    
    // Generate unique slug
    let slug = '';
    if (personalInfo && personalInfo.firstName && personalInfo.lastName) {
      const baseSlug = `${personalInfo.firstName}-${personalInfo.lastName}`.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      slug = baseSlug;
      let count = 0;
      
      // Check for existing slug and increment if necessary
      while (await profileOperations.findBySlug(slug)) {
        count++;
        slug = `${baseSlug}-${count}`;
      }
    } else {
      // Fallback slug generation
      slug = `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    const profile = await profileOperations.create({
      user: req.user._id,
      organization: req.user.organization || null,
      slug,
      personalInfo,
      contactInfo,
      socialLinks,
      businessHours: normalizedBusinessHours,
      template: templateId,
      customization,
      sections,
      callToAction: req.body.callToAction,
      analytics: req.body.analytics,
      isActive: req.body.isActive
    });
    
    // Generate QR code after slug is created
    if (profile.slug) {
      const profileUrl = `${process.env.FRONTEND_URL}/p/${profile.slug}`;
      const qrCodeDataUrl = await QRCode.toDataURL(profileUrl);
      await profileOperations.updateById(profile._id, { qrCode: qrCodeDataUrl });
      profile.qrCode = qrCodeDataUrl;
    }
    
    // Increment organization usage if applicable
    if (req.organization) {
      await req.organization.incrementUsage('profiles', 1);
    }

    // Populate template data
    let profileWithTemplate = profile;
    if (profile.template) {
      const template = await templateOperations.findById(profile.template);
      profileWithTemplate = { ...profile, template };
    }

    res.status(201).json({
      success: true,
      data: profileWithTemplate
    });
  } catch (err) {
    console.error('Profile creation error:', err);
    
    // Handle validation errors (simplified for native driver)
    if (err.message && err.message.includes('validation')) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: [err.message]
      });
    }
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Profile with this slug already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Update profile
router.put('/:id', protect, async (req, res) => {
  try {
    // First get the profile to check ownership
    const existingProfile = await profileOperations.findById(req.params.id);
    
    if (!existingProfile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    // Check ownership
    if (existingProfile.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this profile'
      });
    }
    
    // Clean up the request body to handle empty string values for ObjectId fields
    const updateData = { ...req.body };
    
    // Transform business hours day names to lowercase to match schema enum
    if (updateData.businessHours && Array.isArray(updateData.businessHours)) {
      updateData.businessHours = updateData.businessHours.map(hour => ({
        ...hour,
        day: hour.day ? hour.day.toLowerCase() : hour.day
      }));
    }
    
    // Handle template field - remove from update if empty string (keep existing template)
    if (updateData.template === '' || updateData.template === null || updateData.template === undefined) {
      delete updateData.template;
    } else if (updateData.template) {
      // Verify template exists if provided
      const templateDoc = await templateOperations.findById(updateData.template);
      if (!templateDoc) {
        return res.status(400).json({
          success: false,
          error: 'Invalid template'
        });
      }
    }
    
    await profileOperations.updateById(req.params.id, updateData);
    const profile = await profileOperations.findById(req.params.id);
    
    // Regenerate QR code if slug changed
    if (req.body.slug || req.body.personalInfo) {
      const profileUrl = `${process.env.FRONTEND_URL}/p/${profile.slug}`;
      const qrCodeDataUrl = await QRCode.toDataURL(profileUrl);
      await profileOperations.updateById(profile._id, { qrCode: qrCodeDataUrl });
      profile.qrCode = qrCodeDataUrl;
    }
    
    // Populate template data
    let profileWithTemplate = profile;
    if (profile.template) {
      const template = await templateOperations.findById(profile.template);
      profileWithTemplate = { ...profile, template };
    }
    
    res.status(200).json({
      success: true,
      data: profileWithTemplate
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Delete profile
router.delete('/:id', protect, async (req, res) => {
  try {
    // First get the profile to check ownership
    const profile = await profileOperations.findById(req.params.id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    // Check ownership
    if (profile.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this profile'
      });
    }
    
    await profileOperations.deleteById(req.params.id);
    
    res.status(200).json({
      success: true,
      data: 'Profile deleted'
    });
  } catch (err) {
    console.error('Delete profile error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get profile analytics
router.get('/:id/analytics', protect, async (req, res) => {
  try {
    // First get the profile to check ownership
    const profile = await profileOperations.findById(req.params.id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    // Check ownership
    if (profile.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this profile analytics'
      });
    }
    
    const { timeRange = 'month' } = req.query;
    
    // TODO: Implement analytics with native MongoDB aggregation
    // For now, return basic analytics from the profile document
    const analytics = {
      views: profile.analytics?.views || 0,
      uniqueViews: profile.analytics?.uniqueViews || 0,
      clicks: profile.analytics?.clicks || 0,
      shares: profile.analytics?.shares || 0,
      timeSeries: [] // Empty for now
    };
    
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;