const mongoose = require('mongoose');
const crypto = require('crypto');

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

  // ---- Publication / lifecycle (profiles-v2 route) ----
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'paused'],
    default: 'published'
  },
  username: {
    type: String,
    lowercase: true,
    trim: true,
    default: null
  },
  publishedAt: Date,
  archivedAt: Date,
  card: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
    default: null
  },
  privacy: {
    isPublic: { type: Boolean, default: true },
    password: { type: String, default: null }
  },
  oneTimeLinks: [{
    token: String,
    maxViews: { type: Number, default: 1 },
    viewsUsed: { type: Number, default: 0 },
    expiresAt: Date,
    createdAt: { type: Date, default: Date.now }
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

// username unique per-organization (sparse so nulls are allowed)
profileSchema.index({ username: 1, organization: 1 }, { unique: true, sparse: true });
profileSchema.index({ status: 1 });

// Update timestamp on save
profileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Note: Slug generation is now handled in the route before creating the profile

// Ensure the analytics sub-doc exists (defensive for legacy/native docs)
profileSchema.methods._ensureAnalytics = function() {
  if (!this.analytics) this.analytics = {};
  if (this.analytics.views == null) this.analytics.views = 0;
  if (this.analytics.uniqueViews == null) this.analytics.uniqueViews = 0;
  if (this.analytics.cardTaps == null) this.analytics.cardTaps = 0;
  if (this.analytics.contactDownloads == null) this.analytics.contactDownloads = 0;
  if (!this.analytics.linkClicks) this.analytics.linkClicks = new Map();
};

// ---- Publication ----
profileSchema.methods.publish = async function() {
  this.status = 'published';
  if (!this.publishedAt) this.publishedAt = new Date();
  this.isActive = true;
  await this.save();
  return this;
};

profileSchema.methods.unpublish = async function() {
  this.status = 'draft';
  await this.save();
  return this;
};

profileSchema.methods.archive = async function() {
  this.status = 'archived';
  this.archivedAt = new Date();
  this.isActive = false;
  await this.save();
  return this;
};

// ---- Analytics tracking ----
profileSchema.methods.recordView = async function(isUnique) {
  this._ensureAnalytics();
  this.analytics.views += 1;
  if (isUnique) this.analytics.uniqueViews += 1;
  await this.save();
  return this;
};

profileSchema.methods.recordContactDownload = async function() {
  this._ensureAnalytics();
  this.analytics.contactDownloads += 1;
  await this.save();
  return this;
};

profileSchema.methods.recordLinkClick = async function(linkId) {
  this._ensureAnalytics();
  const key = String(linkId || 'unknown');
  const current = this.analytics.linkClicks.get(key) || 0;
  this.analytics.linkClicks.set(key, current + 1);
  this.markModified('analytics.linkClicks');
  await this.save();
  return this;
};

// ---- Public URL ----
profileSchema.methods.getUrl = function() {
  const base = process.env.FRONTEND_URL || 'https://bbtap.me';
  return `${base}/p/${this.username || this.slug}`;
};

// ---- vCard export ----
profileSchema.methods.generateVCard = function() {
  const p = this.personalInfo || {};
  const c = this.contactInfo || {};
  const s = this.socialLinks || {};
  const esc = (v) => String(v || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
  lines.push(`N:${esc(p.lastName)};${esc(p.firstName)};;;`);
  lines.push(`FN:${esc([p.firstName, p.lastName].filter(Boolean).join(' '))}`);
  if (p.company) lines.push(`ORG:${esc(p.company)}`);
  if (p.title) lines.push(`TITLE:${esc(p.title)}`);
  if (c.phone) lines.push(`TEL;TYPE=CELL:${esc(c.phone)}`);
  if (c.email) lines.push(`EMAIL;TYPE=INTERNET:${esc(c.email)}`);
  if (c.website) lines.push(`URL:${esc(c.website)}`);
  if (s.linkedin) lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${esc(s.linkedin)}`);
  if (c.address && (c.address.street || c.address.city)) {
    const a = c.address;
    lines.push(`ADR;TYPE=WORK:;;${esc(a.street)};${esc(a.city)};${esc(a.state)};${esc(a.postalCode)};${esc(a.country)}`);
  }
  if (p.bio) lines.push(`NOTE:${esc(p.bio)}`);
  lines.push('END:VCARD');
  return lines.join('\r\n');
};

// ---- One-time share links ----
profileSchema.methods.createOneTimeLink = async function(maxViews = 1, expiresInDays = 7) {
  const token = crypto.randomBytes(24).toString('hex');
  const link = {
    token,
    maxViews,
    viewsUsed: 0,
    expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
    createdAt: new Date()
  };
  this.oneTimeLinks.push(link);
  await this.save();
  return link;
};

profileSchema.methods.validateOneTimeLink = function(token) {
  const link = (this.oneTimeLinks || []).find((l) => l.token === token);
  if (!link) return false;
  if (link.expiresAt && link.expiresAt < new Date()) return false;
  if (link.viewsUsed >= link.maxViews) return false;
  return true;
};

profileSchema.methods.useOneTimeLink = async function(token) {
  const link = (this.oneTimeLinks || []).find((l) => l.token === token);
  if (!link) return false;
  link.viewsUsed += 1;
  await this.save();
  return true;
};

// ---- Statics ----
profileSchema.statics.findByUsername = function(username, organizationId) {
  const query = { username: String(username || '').toLowerCase() };
  if (organizationId) query.organization = organizationId;
  return this.findOne(query);
};

module.exports = mongoose.model('Profile', profileSchema);