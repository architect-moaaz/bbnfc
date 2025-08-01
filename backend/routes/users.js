const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { userOperations } = require('../utils/dbOperations');

// Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    
    await userOperations.updateById(req.user._id, { name, avatar });
    const user = await userOperations.findById(req.user._id);
    
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
    const { getDatabase, ObjectId } = require('../utils/mongodb');
    const db = await getDatabase();
    
    // Delete user and related data
    await db.collection('users').deleteOne({ _id: new ObjectId(req.user._id) });
    await db.collection('profiles').deleteMany({ user: new ObjectId(req.user._id) });
    await db.collection('analytics').deleteMany({ user: new ObjectId(req.user._id) });
    await db.collection('subscriptions').deleteMany({ user: new ObjectId(req.user._id) });
    
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