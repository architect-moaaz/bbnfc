const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null for unassigned inventory cards
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    default: null // null until the card is assigned to a profile
  },
  cardId: {
    type: String,
    unique: true,
    required: true
  },
  chipType: {
    type: String,
    enum: ['NTAG213', 'NTAG215', 'NTAG216', 'Other'],
    default: 'NTAG215'
  },
  serialNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isWriteProtected: {
    type: Boolean,
    default: false
  },
  tapCount: {
    type: Number,
    default: 0
  },
  lastTapped: Date,
  customUrl: String,
  qrCodeUrl: String,
  analytics: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    deviceType: String,
    location: {
      country: String,
      city: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    referrer: String,
    userAgent: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  activatedAt: Date,
  deactivatedAt: Date,

  // ---- Lifecycle / inventory management (card-lifecycle + claim routes) ----
  status: {
    type: String,
    enum: ['inventory', 'provisioned', 'assigned', 'active', 'inactive', 'suspended', 'revoked'],
    default: 'active'
  },
  lifecycleStage: {
    type: String,
    default: 'active'
  },
  sku: String,
  batchNumber: String,
  productLine: String,
  ndefUrl: String,
  physical: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  shipping: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Aggregate stats (used by lifecycle/analytics routes; keeps legacy tapCount in sync)
  stats: {
    tapCount: { type: Number, default: 0 },
    scanCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    vcardDownloads: { type: Number, default: 0 },
    lastTapped: { type: Date, default: null },
    firstTapped: { type: Date, default: null }
  },

  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    default: null
  },
  assignmentHistory: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
    assignedAt: Date,
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    unassignedAt: Date,
    reason: String
  }],

  // Claim
  claimToken: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClaimToken',
    default: null
  },
  claimStatus: {
    type: String,
    enum: ['unclaimed', 'pending', 'claimed'],
    default: 'unclaimed'
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  claimedAt: Date
});

// Generate unique card ID
cardSchema.pre('save', async function(next) {
  if (!this.cardId) {
    const generateCardId = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let cardId = '';
      for (let i = 0; i < 8; i++) {
        cardId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return cardId;
    };
    
    let cardId;
    let exists = true;
    
    while (exists) {
      cardId = generateCardId();
      exists = await this.constructor.findOne({ cardId });
    }
    
    this.cardId = cardId;
  }
  next();
});

// Keep updatedAt fresh
cardSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (!this.stats) this.stats = {};
  next();
});

// Ensure the stats sub-document exists (defensive for legacy/native-created docs)
cardSchema.methods._ensureStats = function() {
  if (!this.stats) this.stats = { tapCount: 0, scanCount: 0, viewCount: 0, vcardDownloads: 0 };
};

// Record a tap (keeps legacy tapCount and the stats sub-doc in sync)
cardSchema.methods.recordTap = async function(analytics) {
  this._ensureStats();
  this.tapCount = (this.tapCount || 0) + 1;
  this.lastTapped = new Date();
  this.stats.tapCount = (this.stats.tapCount || 0) + 1;
  this.stats.lastTapped = new Date();
  if (!this.stats.firstTapped) this.stats.firstTapped = new Date();

  if (analytics) {
    this.analytics.push(analytics);
    if (this.analytics.length > 1000) {
      this.analytics = this.analytics.slice(-1000);
    }
  }
  await this.save();
  return this;
};

// Record a view/scan
cardSchema.methods.recordView = async function() {
  this._ensureStats();
  this.stats.viewCount = (this.stats.viewCount || 0) + 1;
  await this.save();
  return this;
};

// Public URL for this card
cardSchema.methods.getUrl = function() {
  if (this.customUrl) return this.customUrl;
  const base = process.env.FRONTEND_URL || 'https://bbtap.me';
  return `${base}/c/${this.cardId}`;
};

// ---- Lifecycle transitions ----
cardSchema.methods.activate = async function() {
  this.status = 'active';
  this.isActive = true;
  this.activatedAt = new Date();
  await this.save();
  return this;
};

cardSchema.methods.deactivate = async function() {
  this.status = 'inactive';
  this.isActive = false;
  this.deactivatedAt = new Date();
  await this.save();
  return this;
};

cardSchema.methods.suspend = async function() {
  this.status = 'suspended';
  this.isActive = false;
  await this.save();
  return this;
};

cardSchema.methods.unsuspend = async function() {
  this.status = 'active';
  this.isActive = true;
  await this.save();
  return this;
};

// ---- Assignment ----
cardSchema.methods.assignTo = async function(userId, profileId, assignedByUserId, reason) {
  this.assignedTo = userId;
  this.user = userId; // keep legacy owner field aligned
  if (profileId) {
    this.assignedProfile = profileId;
    this.profile = profileId;
  }
  if (this.status === 'inventory' || this.status === 'provisioned') {
    this.status = 'assigned';
  }
  this.assignmentHistory.push({
    user: userId,
    profile: profileId || null,
    assignedAt: new Date(),
    assignedBy: assignedByUserId || null,
    reason: reason || null
  });
  await this.save();
  return this;
};

cardSchema.methods.unassign = async function(unassignedByUserId, reason) {
  // close the latest open assignment history entry
  const last = this.assignmentHistory[this.assignmentHistory.length - 1];
  if (last && !last.unassignedAt) {
    last.unassignedAt = new Date();
    if (reason) last.reason = reason;
  }
  this.assignedTo = null;
  this.assignedProfile = null;
  this.status = 'inventory';
  await this.save();
  return this;
};

cardSchema.methods.isReassignable = function() {
  return ['assigned', 'active', 'inactive', 'suspended'].includes(this.status);
};

cardSchema.methods.reassign = async function(newUserId, profileId, reassignedByUserId, reason) {
  await this.unassign(reassignedByUserId, reason);
  return this.assignTo(newUserId, profileId, reassignedByUserId, reason);
};

// ---- Claim ----
cardSchema.methods.isClaimable = function() {
  return (
    ['inventory', 'provisioned'].includes(this.status) &&
    this.claimStatus !== 'claimed' &&
    !this.assignedTo
  );
};

cardSchema.methods.markClaimed = async function(userId, method = 'token') {
  this.claimStatus = 'claimed';
  this.claimedBy = userId;
  this.claimedAt = new Date();
  this.claimMethod = method;
  if (this.status === 'inventory' || this.status === 'provisioned') {
    this.status = 'assigned';
  }
  await this.save();
  return this;
};

// ---- Statics ----
cardSchema.statics.bulkCreate = async function(count, orgId, data = {}) {
  const { ndefUrlTemplate, ...rest } = data;
  const cards = [];
  for (let i = 0; i < count; i++) {
    const card = new this({
      organization: orgId,
      status: 'inventory',
      lifecycleStage: 'manufactured',
      ...rest
    });
    await card.save(); // pre-save hook assigns a unique cardId
    if (ndefUrlTemplate) {
      card.ndefUrl = ndefUrlTemplate.replace(/\{cardId\}/g, card.cardId);
      await card.save();
    }
    cards.push(card);
  }
  return cards;
};

cardSchema.statics.findAvailableForOrg = function(orgId, limit = 50) {
  return this.find({
    organization: orgId,
    status: { $in: ['inventory', 'provisioned'] },
    assignedTo: null
  }).limit(limit);
};

cardSchema.statics.getOrgStats = async function(orgId) {
  const cards = await this.find({ organization: orgId });
  const byStatus = {};
  let totalTaps = 0;
  let assignedCards = 0;
  let activeCards = 0;
  for (const c of cards) {
    const s = c.status || 'unknown';
    byStatus[s] = (byStatus[s] || 0) + 1;
    totalTaps += (c.stats && c.stats.tapCount) || c.tapCount || 0;
    if (c.assignedTo) assignedCards += 1;
    if (c.status === 'active') activeCards += 1;
  }
  return {
    totalCards: cards.length,
    byStatus,
    totalTaps,
    assignedCards,
    activeCards,
    availableCards: (byStatus.inventory || 0) + (byStatus.provisioned || 0)
  };
};

module.exports = mongoose.model('Card', cardSchema);