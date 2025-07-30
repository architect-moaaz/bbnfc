const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const QRCode = require('qrcode');
const { protect } = require('../middleware/auth');
const Profile = require('../models/Profile');
const Template = require('../models/Template');
const Analytics = require('../models/Analytics');

// Get all user profiles
router.get('/', protect, async (req, res) => {
  try {
    const profiles = await Profile.find({ user: req.user.id })
      .populate('template')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: profiles.length,
      data: profiles
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
    const profile = await Profile.findById(req.params.id)
      .populate('template')
      .populate('user', 'name email');
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    // Check if user owns the profile or is admin (allow preview for owners)
    if (profile.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this profile'
      });
    }
    
    res.status(200).json({
      success: true,
      data: profile
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
router.post('/', protect, async (req, res) => {
  try {
    console.log('Creating profile with data:', JSON.stringify(req.body, null, 2));
    const {
      personalInfo,
      contactInfo,
      socialLinks,
      businessHours,
      template,
      customization,
      sections
    } = req.body;
    
    // Check if user can create more profiles (simplified for now)
    const user = req.user;
    // TODO: Implement subscription check later
    // const userWithSubscription = await user.populate('subscription');
    // if (!userWithSubscription.subscription.canCreateProfile()) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Profile limit reached for your subscription plan'
    //   });
    // }
    
    // Verify template exists if provided, otherwise use default
    let templateId = template;
    if (!templateId) {
      // Find the default template or first available template
      const defaultTemplate = await Template.findOne({ slug: 'default-professional' });
      if (!defaultTemplate) {
        const firstTemplate = await Template.findOne();
        if (!firstTemplate) {
          return res.status(400).json({
            success: false,
            error: 'No templates available. Please contact administrator.'
          });
        }
        templateId = firstTemplate._id;
      } else {
        templateId = defaultTemplate._id;
      }
    } else {
      // Verify the provided template exists
      const templateDoc = await Template.findById(templateId);
      if (!templateDoc) {
        return res.status(400).json({
          success: false,
          error: 'Invalid template'
        });
      }
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
      while (await Profile.findOne({ slug })) {
        count++;
        slug = `${baseSlug}-${count}`;
      }
    } else {
      // Fallback slug generation
      slug = `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    const profile = await Profile.create({
      user: req.user.id,
      slug,
      personalInfo,
      contactInfo,
      socialLinks,
      businessHours: normalizedBusinessHours,
      template: templateId,
      customization,
      sections,
      ...req.body // Include any additional fields like callToAction, analytics, isActive
    });
    
    // Generate QR code after slug is created
    if (profile.slug) {
      const profileUrl = `${process.env.FRONTEND_URL}/p/${profile.slug}`;
      const qrCodeDataUrl = await QRCode.toDataURL(profileUrl);
      profile.qrCode = qrCodeDataUrl;
      await profile.save();
    }
    
    // Update subscription usage (simplified for now)
    // TODO: Implement subscription usage tracking later
    // user.subscription.usage.profilesCreated += 1;
    // await user.subscription.save();
    
    await profile.populate('template');
    
    res.status(201).json({
      success: true,
      data: profile
    });
  } catch (err) {
    console.error('Profile creation error:', err);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors,
        validationError: err.errors
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
    const existingProfile = await Profile.findById(req.params.id);
    
    if (!existingProfile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    // Check ownership
    if (existingProfile.user.toString() !== req.user.id && req.user.role !== 'admin') {
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
      const templateDoc = await Template.findById(updateData.template);
      if (!templateDoc) {
        return res.status(400).json({
          success: false,
          error: 'Invalid template'
        });
      }
    }
    
    const profile = await Profile.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('template');
    
    // Regenerate QR code if slug changed
    if (req.body.slug || req.body.personalInfo) {
      const profileUrl = `${process.env.FRONTEND_URL}/p/${profile.slug}`;
      const qrCodeDataUrl = await QRCode.toDataURL(profileUrl);
      profile.qrCode = qrCodeDataUrl;
      await profile.save();
    }
    
    res.status(200).json({
      success: true,
      data: profile
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
    const profile = await Profile.findById(req.params.id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    // Check ownership
    if (profile.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this profile'
      });
    }
    
    await Profile.findByIdAndDelete(req.params.id);
    
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
    const profile = await Profile.findById(req.params.id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    // Check ownership
    if (profile.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this profile analytics'
      });
    }
    
    const { timeRange = 'month' } = req.query;
    
    const analytics = await Analytics.getAggregatedAnalytics(req.params.id, timeRange);
    const timeSeries = await Analytics.getTimeSeries(req.params.id, timeRange);
    
    res.status(200).json({
      success: true,
      data: {
        ...analytics,
        timeSeries
      }
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