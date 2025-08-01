const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { cardOperations, profileOperations } = require('../utils/dbOperations');

// Get all user cards
router.get('/', protect, async (req, res) => {
  try {
    const cards = await cardOperations.findByUserId(req.user._id);
    
    // Populate profile data for each card
    const cardsWithProfiles = await Promise.all(
      cards.map(async (card) => {
        if (card.profile) {
          const profile = await profileOperations.findById(card.profile);
          return { ...card, profile };
        }
        return card;
      })
    );
    
    res.status(200).json({
      success: true,
      count: cardsWithProfiles.length,
      data: cardsWithProfiles
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
    const profile = await profileOperations.findById(profileId);
    
    if (!profile || profile.user.toString() !== req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Profile not found or unauthorized'
      });
    }
    
    const card = await cardOperations.create({
      user: req.user._id,
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
    
    // Add profile data to response
    const cardWithProfile = { ...card, profile };
    
    res.status(201).json({
      success: true,
      data: cardWithProfile
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
    const existingCard = await cardOperations.findById(req.params.id);
    
    if (!existingCard) {
      return res.status(404).json({
        success: false,
        error: 'Card not found'
      });
    }
    
    if (existingCard.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
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
      const profile = await profileOperations.findById(profileId);
      
      if (!profile || profile.user.toString() !== req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          error: 'Profile not found or unauthorized'
        });
      }
      
      updateData.profile = profileId;
      updateData.customUrl = `${process.env.FRONTEND_URL}/p/${profile.slug}`;
      updateData.qrCodeUrl = profile.qrCode;
    }
    
    await cardOperations.updateById(req.params.id, updateData);
    const card = await cardOperations.findById(req.params.id);
    
    // Populate profile data
    let cardWithProfile = card;
    if (card.profile) {
      const profile = await profileOperations.findById(card.profile);
      cardWithProfile = { ...card, profile };
    }
    
    res.status(200).json({
      success: true,
      data: cardWithProfile
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
    const card = await cardOperations.findById(req.params.id);
    
    if (!card) {
      return res.status(404).json({
        success: false,
        error: 'Card not found'
      });
    }
    
    if (card.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this card'
      });
    }
    
    await cardOperations.deleteById(req.params.id);
    
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
    const card = await cardOperations.findById(req.params.id);
    
    if (!card) {
      return res.status(404).json({
        success: false,
        error: 'Card not found'
      });
    }
    
    if (card.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
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