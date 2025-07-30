const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Subscription = require('../models/Subscription');

// Get subscription plans
router.get('/plans', async (req, res) => {
  try {
    const plans = {
      free: Subscription.getPlanDetails('free'),
      basic: Subscription.getPlanDetails('basic'),
      pro: Subscription.getPlanDetails('pro'),
      enterprise: Subscription.getPlanDetails('enterprise')
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
    const subscription = await Subscription.findOne({ user: req.user.id });
    
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
    
    const subscription = await Subscription.findOne({ user: req.user.id });
    const planDetails = Subscription.getPlanDetails(plan);
    
    subscription.plan = plan;
    subscription.features = planDetails.features;
    subscription.billing.amount = planDetails.price;
    subscription.status = 'active';
    
    await subscription.save();
    
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
    const subscription = await Subscription.findOne({ user: req.user.id });
    
    subscription.cancelAtPeriodEnd = true;
    await subscription.save();
    
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