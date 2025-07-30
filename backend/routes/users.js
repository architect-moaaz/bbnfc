const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, avatar },
      { new: true, runValidators: true }
    );
    
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

// Delete user account
router.delete('/account', protect, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    
    res.status(200).json({
      success: true,
      data: 'User account deleted'
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