const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Card = require('../models/Card');
const Profile = require('../models/Profile');

// Get all user cards
router.get('/', protect, async (req, res) => {
  try {
    const cards = await Card.find({ user: req.user.id })
      .populate('profile')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: cards.length,
      data: cards
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Create new card
router.post('/', protect, async (req, res) => {
  try {
    const { profileId, chipType, serialNumber } = req.body;
    
    // Check if user can activate more cards (simplified for now)
    // TODO: Implement subscription check later
    // const userWithSubscription = await req.user.populate('subscription');
    // if (!userWithSubscription.subscription.canActivateCard()) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Card limit reached for your subscription plan'
    //   });
    // }
    
    // Verify profile exists and belongs to user
    const profile = await Profile.findOne({
      _id: profileId,
      user: req.user.id
    });
    
    if (!profile) {
      return res.status(400).json({
        success: false,
        error: 'Profile not found or unauthorized'
      });
    }
    
    const card = await Card.create({
      user: req.user.id,
      profile: profileId,
      chipType,
      serialNumber,
      customUrl: `${process.env.FRONTEND_URL}/p/${profile.slug}`,
      qrCodeUrl: profile.qrCode
    });
    
    // Update subscription usage (simplified for now)
    // TODO: Implement subscription usage tracking later
    // user.subscription.usage.cardsActivated += 1;
    // await user.subscription.save();
    
    await card.populate('profile');
    
    res.status(201).json({
      success: true,
      data: card
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Update card
router.put('/:id', protect, async (req, res) => {
  try {
    // First check if card exists and belongs to user
    const existingCard = await Card.findById(req.params.id);
    
    if (!existingCard) {
      return res.status(404).json({
        success: false,
        error: 'Card not found'
      });
    }
    
    if (existingCard.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this card'
      });
    }
    
    const { profileId, isActive, chipType, serialNumber } = req.body;
    
    const updateData = {
      isActive,
      chipType,
      serialNumber
    };
    
    // If changing profile, verify it belongs to user
    if (profileId) {
      const profile = await Profile.findOne({
        _id: profileId,
        user: req.user.id
      });
      
      if (!profile) {
        return res.status(400).json({
          success: false,
          error: 'Profile not found or unauthorized'
        });
      }
      
      updateData.profile = profileId;
      updateData.customUrl = `${process.env.FRONTEND_URL}/p/${profile.slug}`;
      updateData.qrCodeUrl = profile.qrCode;
    }
    
    const card = await Card.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('profile');
    
    res.status(200).json({
      success: true,
      data: card
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Delete card
router.delete('/:id', protect, async (req, res) => {
  try {
    // First check if card exists and belongs to user
    const card = await Card.findById(req.params.id);
    
    if (!card) {
      return res.status(404).json({
        success: false,
        error: 'Card not found'
      });
    }
    
    if (card.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this card'
      });
    }
    
    await Card.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      data: 'Card deleted'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get card analytics
router.get('/:id/analytics', protect, async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    
    if (!card) {
      return res.status(404).json({
        success: false,
        error: 'Card not found'
      });
    }
    
    if (card.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this card analytics'
      });
    }
    
    // Group analytics by time periods
    const dailyTaps = card.analytics.reduce((acc, tap) => {
      const date = tap.timestamp.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
    
    // Device type breakdown
    const deviceBreakdown = card.analytics.reduce((acc, tap) => {
      const device = tap.deviceType || 'unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {});
    
    // Location breakdown
    const locationBreakdown = card.analytics.reduce((acc, tap) => {
      const country = tap.location?.country || 'unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {});
    
    res.status(200).json({
      success: true,
      data: {
        totalTaps: card.tapCount,
        lastTapped: card.lastTapped,
        dailyTaps,
        deviceBreakdown,
        locationBreakdown,
        recentActivity: card.analytics.slice(-10).reverse()
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