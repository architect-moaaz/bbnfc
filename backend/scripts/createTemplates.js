require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('../models/Template');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nfc-business-card');

const newTemplates = [
  {
    name: 'Executive Premium',
    slug: 'executive-premium',
    description: 'Sophisticated design for C-level executives and senior professionals',
    category: 'corporate',
    thumbnail: '/templates/executive-premium-thumb.jpg',
    previewUrl: '/templates/executive-premium-preview.jpg',
    structure: {
      layout: 'split',
      sections: [
        { id: 'header', type: 'header', order: 1, config: { showTitle: true, showCompany: true } },
        { id: 'contact', type: 'contact', order: 2, config: { layout: 'horizontal' } },
        { id: 'about', type: 'about', order: 3, config: { maxLength: 200 } },
        { id: 'social', type: 'social', order: 4, config: { style: 'minimal' } },
        { id: 'hours', type: 'hours', order: 5, config: { display: 'compact' } }
      ]
    },
    defaultColors: {
      primary: '#1a1a1a',
      secondary: '#f8f9fa',
      text: '#333333',
      background: '#ffffff'
    },
    defaultFonts: {
      heading: 'Playfair Display',
      body: 'Inter'
    },
    features: ['hours', 'contact-form'],
    isPremium: true,
    isActive: true
  },
  {
    name: 'Tech Startup',
    slug: 'tech-startup',
    description: 'Modern, tech-focused design for startup founders and developers',
    category: 'technology',
    thumbnail: '/templates/tech-startup-thumb.jpg',
    previewUrl: '/templates/tech-startup-preview.jpg',
    structure: {
      layout: 'card',
      sections: [
        { id: 'header', type: 'header', order: 1, config: { showTitle: true, showCompany: true } },
        { id: 'contact', type: 'contact', order: 2, config: { layout: 'vertical' } },
        { id: 'about', type: 'about', order: 3, config: { maxLength: 250 } },
        { id: 'social', type: 'social', order: 4, config: { style: 'cards' } },
        { id: 'services', type: 'services', order: 5, config: { maxItems: 3 } }
      ]
    },
    defaultColors: {
      primary: '#0066ff',
      secondary: '#e3f2fd',
      text: '#212121',
      background: '#fafafa'
    },
    defaultFonts: {
      heading: 'Roboto',
      body: 'Source Sans Pro'
    },
    features: ['services', 'gallery'],
    isPremium: false,
    isActive: true
  },
  {
    name: 'Healthcare Professional',
    slug: 'healthcare-pro',
    description: 'Trustworthy design for doctors, nurses, and healthcare workers',
    category: 'healthcare',
    thumbnail: '/templates/healthcare-pro-thumb.jpg',
    previewUrl: '/templates/healthcare-pro-preview.jpg',
    structure: {
      layout: 'centered',
      sections: [
        { id: 'header', type: 'header', order: 1, config: { showTitle: true, showCompany: true } },
        { id: 'contact', type: 'contact', order: 2, config: { layout: 'vertical' } },
        { id: 'hours', type: 'hours', order: 3, config: { display: 'detailed' } },
        { id: 'about', type: 'about', order: 4, config: { maxLength: 300 } },
        { id: 'services', type: 'services', order: 5, config: { maxItems: 5 } },
        { id: 'social', type: 'social', order: 6, config: { style: 'minimal' } }
      ]
    },
    defaultColors: {
      primary: '#2e7d32',
      secondary: '#e8f5e8',
      text: '#1b5e20',
      background: '#ffffff'
    },
    defaultFonts: {
      heading: 'Merriweather',
      body: 'Open Sans'
    },
    features: ['hours', 'services', 'map'],
    isPremium: false,
    isActive: true
  },
  {
    name: 'Creative Portfolio',
    slug: 'creative-portfolio',
    description: 'Artistic design for designers, photographers, and creatives',
    category: 'creative',
    thumbnail: '/templates/creative-portfolio-thumb.jpg',
    previewUrl: '/templates/creative-portfolio-preview.jpg',
    structure: {
      layout: 'minimal',
      sections: [
        { id: 'header', type: 'header', order: 1, config: { showTitle: true, showCompany: false } },
        { id: 'gallery', type: 'gallery', order: 2, config: { layout: 'grid', maxItems: 6 } },
        { id: 'about', type: 'about', order: 3, config: { maxLength: 200 } },
        { id: 'contact', type: 'contact', order: 4, config: { layout: 'horizontal' } },
        { id: 'social', type: 'social', order: 5, config: { style: 'icons' } }
      ]
    },
    defaultColors: {
      primary: '#e91e63',
      secondary: '#fce4ec',
      text: '#424242',
      background: '#ffffff'
    },
    defaultFonts: {
      heading: 'Montserrat',
      body: 'Lato'
    },
    features: ['gallery', 'testimonials'],
    isPremium: true,
    isActive: true
  },
  {
    name: 'Restaurant & Food',
    slug: 'restaurant-food',
    description: 'Appetizing design for restaurants, chefs, and food businesses',
    category: 'hospitality',
    thumbnail: '/templates/restaurant-food-thumb.jpg',
    previewUrl: '/templates/restaurant-food-preview.jpg',
    structure: {
      layout: 'card',
      sections: [
        { id: 'header', type: 'header', order: 1, config: { showTitle: true, showCompany: true } },
        { id: 'hours', type: 'hours', order: 2, config: { display: 'featured' } },
        { id: 'contact', type: 'contact', order: 3, config: { layout: 'vertical' } },
        { id: 'about', type: 'about', order: 4, config: { maxLength: 250 } },
        { id: 'gallery', type: 'gallery', order: 5, config: { layout: 'carousel', maxItems: 8 } },
        { id: 'social', type: 'social', order: 6, config: { style: 'cards' } }
      ]
    },
    defaultColors: {
      primary: '#ff5722',
      secondary: '#fff3e0',
      text: '#3e2723',
      background: '#fafafa'
    },
    defaultFonts: {
      heading: 'Pacifico',
      body: 'Nunito'
    },
    features: ['hours', 'gallery', 'map'],
    isPremium: false,
    isActive: true
  },
  {
    name: 'Educational Institute',
    slug: 'educational-institute',
    description: 'Professional design for teachers, professors, and educational institutions',
    category: 'education',
    thumbnail: '/templates/educational-institute-thumb.jpg',
    previewUrl: '/templates/educational-institute-preview.jpg',
    structure: {
      layout: 'left-aligned',
      sections: [
        { id: 'header', type: 'header', order: 1, config: { showTitle: true, showCompany: true } },
        { id: 'about', type: 'about', order: 2, config: { maxLength: 300 } },
        { id: 'contact', type: 'contact', order: 3, config: { layout: 'horizontal' } },
        { id: 'hours', type: 'hours', order: 4, config: { display: 'detailed' } },
        { id: 'services', type: 'services', order: 5, config: { maxItems: 4 } },
        { id: 'social', type: 'social', order: 6, config: { style: 'minimal' } }
      ]
    },
    defaultColors: {
      primary: '#3f51b5',
      secondary: '#e8eaf6',
      text: '#1a237e',
      background: '#ffffff'
    },
    defaultFonts: {
      heading: 'Crimson Text',
      body: 'Source Sans Pro'
    },
    features: ['hours', 'services'],
    isPremium: false,
    isActive: true
  },
  {
    name: 'Retail & E-commerce',
    slug: 'retail-ecommerce',
    description: 'Commercial design for retail stores and online businesses',
    category: 'retail',
    thumbnail: '/templates/retail-ecommerce-thumb.jpg',
    previewUrl: '/templates/retail-ecommerce-preview.jpg',
    structure: {
      layout: 'split',
      sections: [
        { id: 'header', type: 'header', order: 1, config: { showTitle: true, showCompany: true } },
        { id: 'hours', type: 'hours', order: 2, config: { display: 'compact' } },
        { id: 'contact', type: 'contact', order: 3, config: { layout: 'vertical' } },
        { id: 'services', type: 'services', order: 4, config: { maxItems: 6 } },
        { id: 'gallery', type: 'gallery', order: 5, config: { layout: 'grid', maxItems: 4 } },
        { id: 'social', type: 'social', order: 6, config: { style: 'cards' } },
        { id: 'testimonials', type: 'testimonials', order: 7, config: { maxItems: 3 } }
      ]
    },
    defaultColors: {
      primary: '#ff9800',
      secondary: '#fff8e1',
      text: '#e65100',
      background: '#ffffff'
    },
    defaultFonts: {
      heading: 'Oswald',
      body: 'Roboto'
    },
    features: ['hours', 'gallery', 'services', 'testimonials', 'map'],
    isPremium: true,
    isActive: true
  }
];

async function createTemplates() {
  try {
    console.log('Creating new templates...');
    
    for (const templateData of newTemplates) {
      // Check if template already exists
      const existing = await Template.findOne({ slug: templateData.slug });
      
      if (existing) {
        console.log(`Template ${templateData.name} already exists, skipping...`);
        continue;
      }
      
      const template = await Template.create(templateData);
      console.log(`✅ Created template: ${template.name}`);
    }
    
    // Show final count
    const totalTemplates = await Template.countDocuments({ isActive: true });
    console.log(`\n🎉 Template creation completed! Total active templates: ${totalTemplates}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Template creation failed:', error);
    process.exit(1);
  }
}

createTemplates();