const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
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
  activatedAt: Date,
  deactivatedAt: Date
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

// Method to record tap
cardSchema.methods.recordTap = async function(analytics) {
  this.tapCount += 1;
  this.lastTapped = new Date();
  
  if (analytics) {
    this.analytics.push(analytics);
    
    // Keep only last 1000 analytics entries
    if (this.analytics.length > 1000) {
      this.analytics = this.analytics.slice(-1000);
    }
  }
  
  await this.save();
};

module.exports = mongoose.model('Card', cardSchema);