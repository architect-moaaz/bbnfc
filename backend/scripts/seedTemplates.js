const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Template = require('../models/Template');

const templates = [
  {
    name: 'Modern Professional',
    slug: 'modern-professional',
    description: 'Clean and professional design perfect for corporate environments',
    category: 'corporate',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzJlNTBlNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk1vZGVybiBQcm8mbmJzcDs8L3RleHQ+PC9zdmc+',
    structure: {
      layout: 'centered',
      sections: [
        { id: 'header', type: 'header', order: 1, config: { showCover: true, showLogo: true } },
        { id: 'contact', type: 'contact', order: 2, config: { style: 'buttons' } },
        { id: 'about', type: 'about', order: 3, config: {} },
        { id: 'social', type: 'social', order: 4, config: { style: 'icons' } }
      ]
    },
    defaultColors: {
      primary: '#2e50e7',
      secondary: '#f8f9fa',
      text: '#1a202c',
      background: '#ffffff'
    },
    defaultFonts: {
      heading: 'Inter',
      body: 'Inter'
    },
    features: ['contact-form', 'map'],
    isPremium: false,
    isActive: true
  },
  {
    name: 'Creative Bold',
    slug: 'creative-bold',
    description: 'Eye-catching design for creative professionals and artists',
    category: 'creative',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmZjAwOGEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNmZjYwMGYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0idXJsKCNhKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNyZWF0aXZlIEJvbGQ8L3RleHQ+PC9zdmc+',
    structure: {
      layout: 'split',
      sections: [
        { id: 'header', type: 'header', order: 1, config: { showCover: true, coverStyle: 'gradient' } },
        { id: 'about', type: 'about', order: 2, config: {} },
        { id: 'gallery', type: 'gallery', order: 3, config: { columns: 3 } },
        { id: 'contact', type: 'contact', order: 4, config: { style: 'cards' } },
        { id: 'social', type: 'social', order: 5, config: { style: 'buttons' } }
      ]
    },
    defaultColors: {
      primary: '#ff008a',
      secondary: '#ff600f',
      text: '#2d3748',
      background: '#ffffff'
    },
    defaultFonts: {
      heading: 'Poppins',
      body: 'Open Sans'
    },
    features: ['gallery', 'testimonials'],
    isPremium: false,
    isActive: true
  },
  {
    name: 'Minimalist',
    slug: 'minimalist',
    description: 'Simple and elegant design with focus on content',
    category: 'other',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y3ZmFmYyIvPjxyZWN0IHg9IjUwIiB5PSI1MCIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMxYTIwMmMiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5NaW5pbWFsaXN0PC90ZXh0Pjwvc3ZnPg==',
    structure: {
      layout: 'minimal',
      sections: [
        { id: 'header', type: 'header', order: 1, config: { showCover: false } },
        { id: 'contact', type: 'contact', order: 2, config: { style: 'list' } },
        { id: 'about', type: 'about', order: 3, config: {} },
        { id: 'social', type: 'social', order: 4, config: { style: 'minimal' } }
      ]
    },
    defaultColors: {
      primary: '#1a202c',
      secondary: '#e2e8f0',
      text: '#2d3748',
      background: '#f7fafc'
    },
    defaultFonts: {
      heading: 'Roboto',
      body: 'Roboto'
    },
    features: [],
    isPremium: false,
    isActive: true
  },
  {
    name: 'Tech Gradient',
    slug: 'tech-gradient',
    description: 'Modern tech-focused design with vibrant gradients',
    category: 'technology',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImIiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMwMGQ0ZmYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMwOTAwZmYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0idXJsKCNiKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPnRlY2ggR3JhZGllbnQ8L3RleHQ+PC9zdmc+',
    structure: {
      layout: 'card',
      sections: [
        { id: 'header', type: 'header', order: 1, config: { showCover: true, coverStyle: 'gradient' } },
        { id: 'contact', type: 'contact', order: 2, config: { style: 'buttons' } },
        { id: 'services', type: 'services', order: 3, config: {} },
        { id: 'social', type: 'social', order: 4, config: { style: 'icons' } },
        { id: 'about', type: 'about', order: 5, config: {} }
      ]
    },
    defaultColors: {
      primary: '#00d4ff',
      secondary: '#0900ff',
      text: '#1a202c',
      background: '#0f172a'
    },
    defaultFonts: {
      heading: 'Montserrat',
      body: 'Inter'
    },
    features: ['services', 'map'],
    isPremium: false,
    isActive: true
  },
  {
    name: 'Healthcare Clean',
    slug: 'healthcare-clean',
    description: 'Professional medical and healthcare template',
    category: 'healthcare',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzEwYjk4MSIvPjx0ZXh0IHg9IjUwJSIgeT9IjUwJSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5IZWFsdGhjYXJlIENsZWFuPC90ZXh0Pjwvc3ZnPg==',
    structure: {
      layout: 'left-aligned',
      sections: [
        { id: 'header', type: 'header', order: 1, config: { showCover: true } },
        { id: 'contact', type: 'contact', order: 2, config: { style: 'cards' } },
        { id: 'about', type: 'about', order: 3, config: {} },
        { id: 'hours', type: 'hours', order: 4, config: {} },
        { id: 'services', type: 'services', order: 5, config: {} },
        { id: 'social', type: 'social', order: 6, config: { style: 'icons' } }
      ]
    },
    defaultColors: {
      primary: '#10b981',
      secondary: '#d1fae5',
      text: '#1f2937',
      background: '#ffffff'
    },
    defaultFonts: {
      heading: 'Lato',
      body: 'Lato'
    },
    features: ['hours', 'services', 'contact-form'],
    isPremium: false,
    isActive: true
  },
  {
    name: 'Elegant Corporate',
    slug: 'elegant-corporate',
    description: 'Sophisticated design for executive professionals',
    category: 'corporate',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzFhMzY1ZCIvPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjYzQ5YTZjIi8+PHRleHQgeD0iNjAlIiB5PSI1MCUiIGZpbGw9IiNjNDlhNmMiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5FbGVnYW50IENvcnA8L3RleHQ+PC9zdmc+',
    structure: {
      layout: 'split',
      sections: [
        { id: 'header', type: 'header', order: 1, config: { showCover: true, showLogo: true } },
        { id: 'about', type: 'about', order: 2, config: {} },
        { id: 'contact', type: 'contact', order: 3, config: { style: 'elegant' } },
        { id: 'services', type: 'services', order: 4, config: {} },
        { id: 'testimonials', type: 'testimonials', order: 5, config: {} },
        { id: 'social', type: 'social', order: 6, config: { style: 'minimal' } }
      ]
    },
    defaultColors: {
      primary: '#c49a6c',
      secondary: '#1a365d',
      text: '#2d3748',
      background: '#f7fafc'
    },
    defaultFonts: {
      heading: 'Playfair Display',
      body: 'Source Sans Pro'
    },
    features: ['testimonials', 'services'],
    isPremium: true,
    isActive: true
  }
];

async function seedTemplates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    // Clear existing templates
    await Template.deleteMany({});
    console.log('🗑️  Cleared existing templates');

    // Insert new templates
    const result = await Template.insertMany(templates);
    console.log(`✅ Inserted ${result.length} templates:`);

    result.forEach(template => {
      console.log(`   - ${template.name} (${template.category}) - ${template.isPremium ? '⭐ Premium' : 'Free'}`);
    });

    console.log('\n📊 Template Summary:');
    console.log(`   Total: ${result.length}`);
    console.log(`   Free: ${result.filter(t => !t.isPremium).length}`);
    console.log(`   Premium: ${result.filter(t => t.isPremium).length}`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    process.exit(1);
  }
}

// Run the seed function
seedTemplates();
