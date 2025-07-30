const mongoose = require('mongoose');
const Template = require('./models/Template');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

const defaultTemplates = [
  {
    name: 'Default Professional',
    slug: 'default-professional',
    description: 'A clean, professional template suitable for business cards',
    category: 'corporate',
    thumbnail: 'https://via.placeholder.com/300x200?text=Default+Professional',
    structure: {
      layout: 'centered',
      sections: [
        {
          id: 'header',
          type: 'header',
          order: 1,
          config: { showAvatar: true, showTitle: true }
        },
        {
          id: 'contact',
          type: 'contact',
          order: 2,
          config: { showEmail: true, showPhone: true }
        },
        {
          id: 'social',
          type: 'social',
          order: 3,
          config: { style: 'icons' }
        }
      ]
    },
    defaultColors: {
      primary: '#53565A',
      secondary: '#00A3B5',
      text: '#333333',
      background: '#ffffff'
    },
    defaultFonts: {
      heading: 'Inter',
      body: 'Inter'
    },
    isPremium: false,
    isActive: true
  },
  {
    name: 'Modern Creative',
    slug: 'modern-creative',
    description: 'A modern, creative template with vibrant colors',
    category: 'creative',
    thumbnail: 'https://via.placeholder.com/300x200?text=Modern+Creative',
    structure: {
      layout: 'split',
      sections: [
        {
          id: 'header',
          type: 'header',
          order: 1,
          config: { showAvatar: true, showTitle: true }
        },
        {
          id: 'about',
          type: 'about',
          order: 2,
          config: { showBio: true }
        },
        {
          id: 'contact',
          type: 'contact',
          order: 3,
          config: { showEmail: true, showPhone: true, showWebsite: true }
        },
        {
          id: 'social',
          type: 'social',
          order: 4,
          config: { style: 'buttons' }
        }
      ]
    },
    defaultColors: {
      primary: '#6366F1',
      secondary: '#EC4899',
      text: '#1F2937',
      background: '#F9FAFB'
    },
    defaultFonts: {
      heading: 'Poppins',
      body: 'Inter'
    },
    isPremium: false,
    isActive: true
  },
  {
    name: 'Minimal Clean',
    slug: 'minimal-clean',
    description: 'A minimalist template focusing on essential information',
    category: 'other',
    thumbnail: 'https://via.placeholder.com/300x200?text=Minimal+Clean',
    structure: {
      layout: 'minimal',
      sections: [
        {
          id: 'header',
          type: 'header',
          order: 1,
          config: { showAvatar: false, showTitle: true }
        },
        {
          id: 'contact',
          type: 'contact',
          order: 2,
          config: { showEmail: true, showPhone: false }
        }
      ]
    },
    defaultColors: {
      primary: '#000000',
      secondary: '#FFFFFF',
      text: '#374151',
      background: '#FFFFFF'
    },
    defaultFonts: {
      heading: 'Inter',
      body: 'Inter'
    },
    isPremium: false,
    isActive: true
  }
];

const seedTemplates = async () => {
  try {
    await connectDB();
    
    // Check if templates already exist
    const existingTemplates = await Template.countDocuments();
    
    if (existingTemplates === 0) {
      console.log('No templates found. Creating default templates...');
      
      await Template.insertMany(defaultTemplates);
      console.log(`✅ Successfully created ${defaultTemplates.length} default templates`);
    } else {
      console.log(`📋 ${existingTemplates} templates already exist in database`);
    }
    
    const templates = await Template.find().select('name slug');
    console.log('Available templates:');
    templates.forEach(template => {
      console.log(`  - ${template.name} (${template.slug})`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the seeder
seedTemplates();