const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    required: true,
    lowercase: true
  },
  description: {
    type: String,
    maxlength: 200
  },
  category: {
    type: String,
    enum: ['corporate', 'creative', 'healthcare', 'education', 'technology', 'retail', 'hospitality', 'other'],
    default: 'other'
  },
  thumbnail: {
    type: String,
    required: true
  },
  previewUrl: String,
  structure: {
    layout: {
      type: String,
      enum: ['centered', 'left-aligned', 'split', 'card', 'minimal'],
      default: 'centered'
    },
    sections: [{
      id: String,
      type: {
        type: String,
        enum: ['header', 'contact', 'social', 'about', 'services', 'gallery', 'testimonials', 'hours', 'cta']
      },
      order: Number,
      config: mongoose.Schema.Types.Mixed
    }]
  },
  defaultColors: {
    primary: {
      type: String,
      default: '#0066cc'
    },
    secondary: {
      type: String,
      default: '#f0f0f0'
    },
    text: {
      type: String,
      default: '#333333'
    },
    background: {
      type: String,
      default: '#ffffff'
    }
  },
  defaultFonts: {
    heading: {
      type: String,
      default: 'Poppins'
    },
    body: {
      type: String,
      default: 'Inter'
    }
  },
  customCSS: String,
  features: [{
    type: String,
    enum: ['gallery', 'services', 'testimonials', 'hours', 'map', 'contact-form']
  }],
  isPremium: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp and generate slug
templateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  
  next();
});

module.exports = mongoose.model('Template', templateSchema);