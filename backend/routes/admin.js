const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { adminOperations, userOperations, settingsOperations } = require('../utils/dbOperations');

// Get admin dashboard stats
router.get('/dashboard', protect, authorize('admin'), async (req, res) => {
  try {
    const [
      totalUsers,
      totalProfiles,
      totalCards,
      totalAnalytics,
      recentUsers,
      activeProfiles
    ] = await Promise.all([
      adminOperations.getUserCount(),
      adminOperations.getProfileCount(),
      adminOperations.getCardCount(),
      adminOperations.getAnalyticsCount(),
      adminOperations.getRecentUserCount(30),
      adminOperations.getActiveProfileCount(30)
    ]);
    
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
    
    const result = await adminOperations.getUsersWithPagination(page, limit);
    
    res.status(200).json({
      success: true,
      data: result.users,
      pagination: result.pagination
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
    
    const result = await adminOperations.getProfilesWithPagination(page, limit);
    
    res.status(200).json({
      success: true,
      data: result.profiles,
      pagination: result.pagination
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
    
    await userOperations.updateById(req.params.id, { role, isEmailVerified });
    const user = await userOperations.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    res.status(200).json({
      success: true,
      data: userWithoutPassword
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
    const user = await userOperations.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Delete user and all associated data
    await adminOperations.deleteUserAndData(req.params.id);
    
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

// Get payment settings (Fatoora, bank details, etc.)
router.get('/settings/payment', protect, authorize('admin'), async (req, res) => {
  try {
    const settings = await settingsOperations.getPaymentSettings();

    res.status(200).json({
      success: true,
      data: {
        fatoora: settings.fatoora || {
          apiKey: '',
          enabled: false,
          testMode: true
        },
        bankDetails: settings.bankDetails || {
          bankName: '',
          accountName: '',
          iban: '',
          swiftCode: ''
        },
        paymentMethods: settings.paymentMethods || {
          fatoora: false,
          bankTransfer: true,
          stripe: false
        }
      }
    });
  } catch (err) {
    console.error('Get payment settings error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Update payment settings
router.put('/settings/payment', protect, authorize('admin'), async (req, res) => {
  try {
    const { fatoora, bankDetails, paymentMethods } = req.body;

    const updates = {};

    if (fatoora !== undefined) {
      updates.fatoora = {
        apiKey: fatoora.apiKey || '',
        enabled: !!fatoora.enabled,
        testMode: fatoora.testMode !== false // Default to true
      };
    }

    if (bankDetails !== undefined) {
      updates.bankDetails = {
        bankName: bankDetails.bankName || '',
        accountName: bankDetails.accountName || '',
        iban: bankDetails.iban || '',
        swiftCode: bankDetails.swiftCode || ''
      };
    }

    if (paymentMethods !== undefined) {
      updates.paymentMethods = {
        fatoora: !!paymentMethods.fatoora,
        bankTransfer: paymentMethods.bankTransfer !== false, // Default to true
        stripe: !!paymentMethods.stripe
      };
    }

    const result = await settingsOperations.setPaymentSettings(updates, req.user._id);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('Update payment settings error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get all settings
router.get('/settings', protect, authorize('admin'), async (req, res) => {
  try {
    const settings = await settingsOperations.getAll();

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (err) {
    console.error('Get all settings error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;