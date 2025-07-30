const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'pro', 'enterprise'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'trialing'],
    default: 'active'
  },
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  stripePriceId: String,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  features: {
    maxProfiles: {
      type: Number,
      default: 1
    },
    maxCards: {
      type: Number,
      default: 1
    },
    customDomain: {
      type: Boolean,
      default: false
    },
    analytics: {
      type: Boolean,
      default: false
    },
    premiumTemplates: {
      type: Boolean,
      default: false
    },
    removeWatermark: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    },
    apiAccess: {
      type: Boolean,
      default: false
    },
    teamMembers: {
      type: Number,
      default: 0
    }
  },
  usage: {
    profilesCreated: {
      type: Number,
      default: 0
    },
    cardsActivated: {
      type: Number,
      default: 0
    },
    monthlyViews: {
      type: Number,
      default: 0
    },
    storageUsed: {
      type: Number,
      default: 0 // in MB
    }
  },
  billing: {
    amount: Number,
    currency: {
      type: String,
      default: 'usd'
    },
    interval: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    },
    nextBillingDate: Date,
    lastPaymentDate: Date,
    lastPaymentAmount: Number
  },
  trial: {
    isActive: {
      type: Boolean,
      default: false
    },
    startDate: Date,
    endDate: Date
  },
  invoices: [{
    invoiceId: String,
    date: Date,
    amount: Number,
    status: String,
    pdfUrl: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
subscriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Check if user can create more profiles
subscriptionSchema.methods.canCreateProfile = function() {
  return this.usage.profilesCreated < this.features.maxProfiles;
};

// Check if user can activate more cards
subscriptionSchema.methods.canActivateCard = function() {
  return this.usage.cardsActivated < this.features.maxCards;
};

// Get plan details
subscriptionSchema.statics.getPlanDetails = function(plan) {
  const plans = {
    free: {
      name: 'Free',
      price: 0,
      features: {
        maxProfiles: 1,
        maxCards: 1,
        customDomain: false,
        analytics: false,
        premiumTemplates: false,
        removeWatermark: false,
        prioritySupport: false,
        apiAccess: false,
        teamMembers: 0
      }
    },
    basic: {
      name: 'Basic',
      price: 9.99,
      features: {
        maxProfiles: 3,
        maxCards: 3,
        customDomain: false,
        analytics: true,
        premiumTemplates: false,
        removeWatermark: true,
        prioritySupport: false,
        apiAccess: false,
        teamMembers: 0
      }
    },
    pro: {
      name: 'Professional',
      price: 29.99,
      features: {
        maxProfiles: 10,
        maxCards: 10,
        customDomain: true,
        analytics: true,
        premiumTemplates: true,
        removeWatermark: true,
        prioritySupport: true,
        apiAccess: true,
        teamMembers: 3
      }
    },
    enterprise: {
      name: 'Enterprise',
      price: 99.99,
      features: {
        maxProfiles: -1, // unlimited
        maxCards: -1, // unlimited
        customDomain: true,
        analytics: true,
        premiumTemplates: true,
        removeWatermark: true,
        prioritySupport: true,
        apiAccess: true,
        teamMembers: -1 // unlimited
      }
    }
  };
  
  return plans[plan] || plans.free;
};

module.exports = mongoose.model('Subscription', subscriptionSchema);