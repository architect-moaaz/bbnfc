require('dotenv').config();
const mongoose = require('mongoose');
const Profile = require('../models/Profile');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nfc-business-card');

async function checkBusinessHours() {
  try {
    console.log('Checking business hours in database...');
    
    // Find all profiles
    const profiles = await Profile.find({}).select('personalInfo.firstName personalInfo.lastName businessHours sections');

    console.log(`Found ${profiles.length} profiles total`);

    for (const profile of profiles) {
      console.log('\n-------------------');
      console.log(`Profile: ${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`);
      console.log('Sections:', JSON.stringify(profile.sections, null, 2));
      console.log('Business Hours:', JSON.stringify(profile.businessHours, null, 2));
      console.log('Business Hours Length:', profile.businessHours?.length || 0);
    }

    process.exit(0);
  } catch (error) {
    console.error('Check failed:', error);
    process.exit(1);
  }
}

checkBusinessHours();