require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('../models/Template');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nfc-business-card');

async function checkTemplates() {
  try {
    console.log('Checking existing templates...');
    
    const templates = await Template.find({}).select('name slug category description isPremium isActive usageCount');
    
    console.log(`Found ${templates.length} templates:`);
    
    if (templates.length === 0) {
      console.log('No templates found in database');
    } else {
      templates.forEach(template => {
        console.log(`- ${template.name} (${template.slug}) - ${template.category} - Premium: ${template.isPremium} - Active: ${template.isActive}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Check failed:', error);
    process.exit(1);
  }
}

checkTemplates();