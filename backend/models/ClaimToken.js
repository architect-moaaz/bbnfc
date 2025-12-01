const mongoose = require('mongoose');
const crypto = require('crypto');

const claimTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['card', 'bulk_invite', 'organization_invite'],
    default: 'card'
  },

  // Associated Resources
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  card: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card'
  },
  assignedTo: {
    email: String,
    name: String,
    phone: String
  },

  // Claim Status
  status: {
    type: String,
    enum: ['pending', 'claimed', 'expired', 'revoked'],
    default: 'pending',
    index: true
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  claimedAt: Date,

  // Token Configuration
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  maxUses: {
    type: Number,
    default: 1
  },
  usedCount: {
    type: Number,
    default: 0
  },

  // Additional Data
  metadata: {
    department: String,
    position: String,
    employeeId: String,
    notes: String,
    customFields: mongoose.Schema.Types.Mixed
  },

  // Verification
  requireEmailVerification: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: String,
  verificationCodeExpires: Date,

  // Tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ipAddress: String,
  userAgent: String,
  claimAttempts: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String,
    email: String,
    success: Boolean,
    failureReason: String
  }],

  // QR Code
  qrCodeUrl: String,

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  revokedAt: Date,
  revokedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  revocationReason: String
});

// Indexes
claimTokenSchema.index({ token: 1 });
claimTokenSchema.index({ tokenHash: 1 });
claimTokenSchema.index({ organization: 1, status: 1 });
claimTokenSchema.index({ status: 1, expiresAt: 1 });
claimTokenSchema.index({ 'assignedTo.email': 1 });

// Update timestamp on save
claimTokenSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to generate claim token
claimTokenSchema.statics.generateToken = function() {
  // Generate a secure random token
  const token = crypto.randomBytes(32).toString('hex');

  // Create hash of token for storage
  const tokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  return { token, tokenHash };
};

// Static method to create claim link
claimTokenSchema.statics.createClaimToken = async function(data) {
  const { token, tokenHash } = this.generateToken();

  const claimToken = await this.create({
    token,
    tokenHash,
    ...data
  });

  return { claimToken, plainToken: token };
};

// Method to generate claim URL
claimTokenSchema.methods.getClaimUrl = function() {
  return `https://bbtap.me/claim/${this.token}`;
};

// Method to check if token is valid
claimTokenSchema.methods.isValid = function() {
  if (this.status !== 'pending') return false;
  if (this.expiresAt < new Date()) return false;
  if (this.usedCount >= this.maxUses) return false;
  return true;
};

// Method to claim token
claimTokenSchema.methods.claim = async function(userId, verificationData = {}) {
  if (!this.isValid()) {
    throw new Error('Token is not valid');
  }

  this.status = 'claimed';
  this.claimedBy = userId;
  this.claimedAt = new Date();
  this.usedCount += 1;

  if (verificationData.emailVerified) {
    this.emailVerified = true;
  }

  await this.save();
  return this;
};

// Method to record claim attempt
claimTokenSchema.methods.recordAttempt = async function(attemptData) {
  this.claimAttempts.push(attemptData);

  // Keep only last 50 attempts
  if (this.claimAttempts.length > 50) {
    this.claimAttempts = this.claimAttempts.slice(-50);
  }

  await this.save();
};

// Method to revoke token
claimTokenSchema.methods.revoke = async function(userId, reason) {
  this.status = 'revoked';
  this.revokedAt = new Date();
  this.revokedBy = userId;
  this.revocationReason = reason;
  await this.save();
};

// Method to generate verification code
claimTokenSchema.methods.generateVerificationCode = function() {
  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  this.verificationCode = crypto
    .createHash('sha256')
    .update(code)
    .digest('hex');

  this.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  return code; // Return plain code to send via email
};

// Method to verify code
claimTokenSchema.methods.verifyCode = function(code) {
  if (!this.verificationCode || !this.verificationCodeExpires) {
    return false;
  }

  if (this.verificationCodeExpires < new Date()) {
    return false;
  }

  const hashedCode = crypto
    .createHash('sha256')
    .update(code)
    .digest('hex');

  return hashedCode === this.verificationCode;
};

// Static method to find by token
claimTokenSchema.statics.findByToken = async function(token) {
  const tokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  return await this.findOne({ tokenHash });
};

// Static method to expire old tokens (run as cron job)
claimTokenSchema.statics.expireOldTokens = async function() {
  const result = await this.updateMany(
    {
      status: 'pending',
      expiresAt: { $lt: new Date() }
    },
    {
      $set: { status: 'expired' }
    }
  );

  return result;
};

module.exports = mongoose.model('ClaimToken', claimTokenSchema);
