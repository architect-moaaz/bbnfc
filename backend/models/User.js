const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  avatar: {
    type: String,
    default: null
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  passwordResetToken: String,
  passwordResetExpire: Date,
  role: {
    type: String,
    enum: ['user', 'admin', 'org_admin', 'super_admin'],
    default: 'user'
  },
  // Organization/Tenant Association
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  organizationRole: {
    type: String,
    enum: ['member', 'admin', 'owner'],
    default: 'member'
  },
  // Department/Team within organization
  department: {
    type: String,
    default: null
  },
  jobTitle: {
    type: String,
    default: null
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: String,
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// True if the user administers an organization (or is a platform admin).
userSchema.methods.isOrgAdmin = function() {
  return (
    this.role === 'org_admin' ||
    this.role === 'admin' ||
    this.role === 'super_admin' ||
    this.organizationRole === 'admin' ||
    this.organizationRole === 'owner'
  );
};

// Coarse role-based permission check used by the permission middleware.
userSchema.methods.hasPermission = function(permission) {
  if (this.role === 'super_admin' || this.role === 'admin') return true;
  const orgAdminPermissions = [
    'manage_cards', 'view_cards', 'manage_profiles', 'view_profiles',
    'manage_users', 'view_users', 'view_analytics', 'manage_organization',
    'manage_templates', 'manage_invitations'
  ];
  if (this.isOrgAdmin() && orgAdminPermissions.includes(permission)) return true;
  // Members can act on their own resources
  const memberPermissions = ['view_profiles', 'view_cards', 'view_analytics'];
  return memberPermissions.includes(permission);
};

// Account lock check (optional accountLockedUntil field).
userSchema.methods.isAccountLocked = function() {
  return !!(this.accountLockedUntil && this.accountLockedUntil > Date.now());
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);