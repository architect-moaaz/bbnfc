const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { subscriptionOperations } = require('../utils/dbOperations');

// Get subscription plans
router.get('/plans', async (req, res) => {
  try {
    const plans = {
      free: subscriptionOperations.getPlanDetails('free'),
      basic: subscriptionOperations.getPlanDetails('basic'),
      pro: subscriptionOperations.getPlanDetails('pro'),
      enterprise: subscriptionOperations.getPlanDetails('enterprise')
    };
    
    res.status(200).json({
      success: true,
      data: plans
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get user subscription
router.get('/current', protect, async (req, res) => {
  try {
    const subscription = await subscriptionOperations.findByUserId(req.user._id);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Upgrade subscription
router.post('/upgrade', protect, async (req, res) => {
  try {
    const { plan } = req.body;
    
    const validPlans = ['basic', 'pro', 'enterprise'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan'
      });
    }
    
    const planDetails = subscriptionOperations.getPlanDetails(plan);
    
    const updates = {
      plan: plan,
      features: planDetails.features,
      status: 'active'
    };
    
    await subscriptionOperations.updateByUserId(req.user._id, updates);
    const subscription = await subscriptionOperations.findByUserId(req.user._id);
    
    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Cancel subscription
router.post('/cancel', protect, async (req, res) => {
  try {
    await subscriptionOperations.updateByUserId(req.user._id, { cancelAtPeriodEnd: true });
    
    res.status(200).json({
      success: true,
      data: 'Subscription will be cancelled at the end of the current period'
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