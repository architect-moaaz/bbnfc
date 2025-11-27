const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  slug: {
    type: String,
    unique: true,
    required: false,
    lowercase: true
  },
  personalInfo: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    title: {
      type: String,
      trim: true
    },
    company: {
      type: String,
      trim: true
    },
    bio: {
      type: String,
      maxlength: 500
    },
    profilePhoto: String
  },
  contactInfo: {
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    website: {
      type: String,
      trim: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    }
  },
  socialLinks: {
    linkedin: String,
    twitter: String,
    facebook: String,
    instagram: String,
    youtube: String,
    github: String,
    tiktok: String,
    custom: [{
      platform: String,
      url: String,
      icon: String
    }]
  },
  businessHours: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    isOpen: {
      type: Boolean,
      default: true
    },
    openTime: String,
    closeTime: String
  }],
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    required: false,
    default: null
  },
  customization: {
    primaryColor: {
      type: String,
      default: '#0066cc'
    },
    secondaryColor: {
      type: String,
      default: '#f0f0f0'
    },
    fontFamily: {
      type: String,
      default: 'Inter'
    },
    logo: String,
    backgroundImage: String,
    customCSS: String
  },
  sections: {
    showContact: { type: Boolean, default: true },
    showSocial: { type: Boolean, default: true },
    showHours: { type: Boolean, default: true },
    showGallery: { type: Boolean, default: false },
    showServices: { type: Boolean, default: false },
    showTestimonials: { type: Boolean, default: false }
  },
  gallery: [{
    url: String,
    caption: String,
    order: Number
  }],
  services: [{
    title: String,
    description: String,
    price: String,
    order: Number
  }],
  testimonials: [{
    name: String,
    company: String,
    content: String,
    rating: Number,
    date: Date
  }],
  callToAction: {
    enabled: { type: Boolean, default: true },
    text: { type: String, default: 'Save Contact' },
    action: {
      type: String,
      enum: ['vcard', 'email', 'phone', 'website', 'custom'],
      default: 'vcard'
    },
    customUrl: String
  },
  analytics: {
    views: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 },
    cardTaps: { type: Number, default: 0 },
    contactDownloads: { type: Number, default: 0 },
    linkClicks: { type: Map, of: Number }
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  qrCode: String,
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
profileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Note: Slug generation is now handled in the route before creating the profile

module.exports = mongoose.model('Profile', profileSchema);