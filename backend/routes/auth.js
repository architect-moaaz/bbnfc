const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const { sendEmail } = require('../utils/email');
const { protect } = require('../middleware/auth');
const { userOperations, subscriptionOperations, authHelpers } = require('../utils/supabaseOperations');

// Validation middleware
const validateRegistration = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Register user
router.post('/register', validateRegistration, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { name, email, password } = req.body;
  
  try {
    // Check if user exists using native driver
    const userExists = await userOperations.findByEmail(email);
    
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }
    
    // Create user using Supabase
    const user = await userOperations.create({
      name,
      email,
      password
    });
    
    // Create free subscription using Supabase
    const subscription = await subscriptionOperations.create({
      user: user.id,
      plan: 'free'
    });
    
    // Generate email verification token
    const { token: verifyToken, hashedToken: emailVerificationToken } = authHelpers.generateVerificationToken();
    const emailVerificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    
    // Update user with verification token
    await userOperations.updateById(user.id, {
      email_verification_token: emailVerificationToken,
      email_verification_expire: emailVerificationExpire
    });
    
    // Send verification email
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verifyToken}`;
    await sendEmail({
      email: user.email,
      subject: 'Verify Your Email - NFC Business Card',
      message: `Welcome to NFC Business Card! Please verify your email by clicking: ${verifyUrl}`
    });
    
    // Create token
    const token = authHelpers.generateJWT(user.id);
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
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

// Login user
router.post('/login', validateLogin, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { email, password } = req.body;
  
  try {
    // Check for user using Supabase
    const userData = await userOperations.findByEmail(email);
    
    if (!userData) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Check if password matches
    const isMatch = await authHelpers.comparePassword(password, userData.password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Update last login
    await userOperations.updateById(userData.id, {
      last_login: new Date().toISOString()
    });
    
    // Create token
    const token = authHelpers.generateJWT(userData.id);
    
    res.status(200).json({
      success: true,
      token,
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        isEmailVerified: userData.is_email_verified
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

// Get current logged in user
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('subscription');
    
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

// Forgot password
router.post('/forgotpassword', async (req, res) => {
  const { email } = req.body;
  
  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No user found with that email'
      });
    }
    
    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });
    
    // Create reset url
    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;
    
    const message = `You requested a password reset. Please visit: ${resetUrl}`;
    
    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset - NFC Business Card',
        message
      });
      
      res.status(200).json({
        success: true,
        data: 'Email sent'
      });
    } catch (err) {
      console.error(err);
      user.passwordResetToken = undefined;
      user.passwordResetExpire = undefined;
      
      await user.save({ validateBeforeSave: false });
      
      return res.status(500).json({
        success: false,
        error: 'Email could not be sent'
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Reset password
router.put('/resetpassword/:resettoken', async (req, res) => {
  // Get hashed token
  const passwordResetToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');
  
  try {
    const user = await User.findOne({
      passwordResetToken,
      passwordResetExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    
    // Set new password
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save();
    
    const token = user.getSignedJwtToken();
    
    res.status(200).json({
      success: true,
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Verify email
router.get('/verifyemail/:token', async (req, res) => {
  const emailVerificationToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  
  try {
    const user = await User.findOne({
      emailVerificationToken,
      emailVerificationExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();
    
    res.status(200).json({
      success: true,
      data: 'Email verified successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Update password
router.put('/updatepassword', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    
    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }
    
    user.password = req.body.newPassword;
    await user.save();
    
    const token = user.getSignedJwtToken();
    
    res.status(200).json({
      success: true,
      token
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