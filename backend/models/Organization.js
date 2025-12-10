const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide an organization name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  subdomain: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens']
  },
  type: {
    type: String,
    enum: ['individual', 'business', 'enterprise', 'reseller'],
    default: 'business'
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'trial', 'expired'],
    default: 'active'
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'business', 'enterprise', 'custom'],
    default: 'free'
  },
  planStartDate: {
    type: Date,
    default: Date.now
  },
  planEndDate: Date,
  trialEndDate: Date,

  // Contact Information
  contactInfo: {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: String,
    website: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    }
  },

  // Branding & Customization
  branding: {
    logo: String,
    logoUrl: String,
    favicon: String,
    primaryColor: {
      type: String,
      default: '#0066cc'
    },
    secondaryColor: {
      type: String,
      default: '#f0f0f0'
    },
    accentColor: String,
    fontFamily: {
      type: String,
      default: 'Inter'
    },
    customCSS: String,
    customDomain: String,
    customDomainVerified: {
      type: Boolean,
      default: false
    }
  },

  // Limits & Quotas
  limits: {
    users: {
      type: Number,
      default: 5
    },
    cards: {
      type: Number,
      default: 10
    },
    profiles: {
      type: Number,
      default: 10
    },
    storage: {
      type: Number,
      default: 100 // MB
    },
    apiCallsPerMonth: {
      type: Number,
      default: 1000
    },
    customTemplates: {
      type: Number,
      default: 0
    }
  },

  // Current Usage
  usage: {
    users: {
      type: Number,
      default: 0
    },
    cards: {
      type: Number,
      default: 0
    },
    profiles: {
      type: Number,
      default: 0
    },
    storage: {
      type: Number,
      default: 0
    },
    apiCalls: {
      type: Number,
      default: 0
    }
  },

  // Settings
  settings: {
    // Profile Settings
    allowCustomBranding: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    lockTemplate: {
      type: Boolean,
      default: false
    },
    defaultTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template'
    },
    allowPrivateProfiles: {
      type: Boolean,
      default: true
    },

    // Security Settings
    enforcePasswordPolicy: {
      type: Boolean,
      default: false
    },
    require2FA: {
      type: Boolean,
      default: false
    },
    allowSocialLogin: {
      type: Boolean,
      default: true
    },
    ipWhitelist: [String],
    sessionTimeout: {
      type: Number,
      default: 30 // days
    },

    // Feature Toggles
    enableAnalytics: {
      type: Boolean,
      default: true
    },
    enableDirectory: {
      type: Boolean,
      default: false
    },
    directoryPublic: {
      type: Boolean,
      default: false
    },
    enableLeadCapture: {
      type: Boolean,
      default: false
    },
    enableFileAttachments: {
      type: Boolean,
      default: false
    },
    maxFileSize: {
      type: Number,
      default: 5 // MB
    },
    allowedFileTypes: {
      type: [String],
      default: ['pdf', 'jpg', 'png', 'doc', 'docx']
    },

    // Notification Settings
    notifyOnNewUser: {
      type: Boolean,
      default: true
    },
    notifyOnLowInventory: {
      type: Boolean,
      default: true
    },
    weeklyDigest: {
      type: Boolean,
      default: true
    },

    // Localization
    defaultLanguage: {
      type: String,
      enum: ['en', 'ar', 'es', 'fr', 'de'],
      default: 'en'
    },
    enableRTL: {
      type: Boolean,
      default: false
    },

    // SEO
    allowIndexing: {
      type: Boolean,
      default: true
    },
    metaTitle: String,
    metaDescription: String,

    // Data Retention
    dataRetentionDays: {
      type: Number,
      default: 365
    },
    analyticsRetentionDays: {
      type: Number,
      default: 90
    }
  },

  // Billing Information
  billing: {
    customerId: String, // Stripe customer ID
    subscriptionId: String, // Stripe subscription ID
    paymentMethod: String,
    billingCycle: {
      type: String,
      enum: ['monthly', 'annual', 'lifetime'],
      default: 'monthly'
    },
    nextBillingDate: Date,
    billingEmail: String,
    taxId: String,
    currency: {
      type: String,
      default: 'USD'
    }
  },

  // Owner & Admins
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Metadata
  metadata: {
    industry: String,
    companySize: String,
    useCase: String,
    referralSource: String,
    notes: String
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastActivityAt: Date,
  suspendedAt: Date,
  suspensionReason: String
});

// Indexes (slug and subdomain already have unique: true which creates an index)
organizationSchema.index({ owner: 1 });
organizationSchema.index({ status: 1 });
organizationSchema.index({ plan: 1 });

// Update timestamp on save
organizationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to check if organization can add more users
organizationSchema.methods.canAddUsers = function(count = 1) {
  return (this.usage.users + count) <= this.limits.users;
};

// Method to check if organization can add more cards
organizationSchema.methods.canAddCards = function(count = 1) {
  return (this.usage.cards + count) <= this.limits.cards;
};

// Method to check if organization can add more profiles
organizationSchema.methods.canAddProfiles = function(count = 1) {
  return (this.usage.profiles + count) <= this.limits.profiles;
};

// Method to check storage availability
organizationSchema.methods.hasStorageAvailable = function(sizeInMB) {
  return (this.usage.storage + sizeInMB) <= this.limits.storage;
};

// Method to increment usage
organizationSchema.methods.incrementUsage = async function(type, amount = 1) {
  if (this.usage[type] !== undefined) {
    this.usage[type] += amount;
    await this.save();
  }
};

// Method to decrement usage
organizationSchema.methods.decrementUsage = async function(type, amount = 1) {
  if (this.usage[type] !== undefined && this.usage[type] >= amount) {
    this.usage[type] -= amount;
    await this.save();
  }
};

// Method to check if organization is active
organizationSchema.methods.isActive = function() {
  if (this.status !== 'active') return false;

  // Check if trial has expired
  if (this.status === 'trial' && this.trialEndDate && this.trialEndDate < new Date()) {
    return false;
  }

  // Check if plan has expired
  if (this.planEndDate && this.planEndDate < new Date()) {
    return false;
  }

  return true;
};

// Method to get organization URL
organizationSchema.methods.getUrl = function() {
  if (this.branding.customDomain && this.branding.customDomainVerified) {
    return `https://${this.branding.customDomain}`;
  }
  if (this.subdomain) {
    return `https://${this.subdomain}.bbtap.me`;
  }
  return `https://bbtap.me/${this.slug}`;
};

// Static method to find by subdomain or custom domain
organizationSchema.statics.findByDomain = async function(domain) {
  // Try subdomain match
  let org = await this.findOne({ subdomain: domain, status: 'active' });
  if (org) return org;

  // Try custom domain match
  org = await this.findOne({
    'branding.customDomain': domain,
    'branding.customDomainVerified': true,
    status: 'active'
  });

  return org;
};

module.exports = mongoose.model('Organization', organizationSchema);
