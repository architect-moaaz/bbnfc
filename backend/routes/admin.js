const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Card = require('../models/Card');
const Analytics = require('../models/Analytics');

// Get admin dashboard stats
router.get('/dashboard', protect, authorize('admin'), async (req, res) => {
  try {
    const [
      totalUsers,
      totalProfiles,
      totalCards,
      totalAnalytics
    ] = await Promise.all([
      User.countDocuments(),
      Profile.countDocuments(),
      Card.countDocuments(),
      Analytics.countDocuments()
    ]);
    
    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Get active profiles (viewed in last 30 days)
    const activeProfiles = await Analytics.distinct('profile', {
      eventType: 'view',
      timestamp: { $gte: thirtyDaysAgo }
    }).countDocuments();
    
    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalProfiles,
        totalCards,
        totalAnalytics,
        recentUsers,
        activeProfiles
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

// Get all users (with pagination)
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const users = await User.find()
      .populate('subscription')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments();
    
    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
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

// Get all profiles (with pagination)
router.get('/profiles', protect, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const profiles = await Profile.find()
      .populate('user', 'name email')
      .populate('template', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Profile.countDocuments();
    
    res.status(200).json({
      success: true,
      data: profiles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
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

// Update user (admin only)
router.put('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, isEmailVerified } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, isEmailVerified },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Delete user (admin only)
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Delete user's profiles and cards
    await Profile.deleteMany({ user: req.params.id });
    await Card.deleteMany({ user: req.params.id });
    
    res.status(200).json({
      success: true,
      data: 'User and associated data deleted'
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