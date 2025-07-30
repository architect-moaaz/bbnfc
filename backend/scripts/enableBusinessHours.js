require('dotenv').config();
const mongoose = require('mongoose');
const Profile = require('../models/Profile');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nfc-business-card');

async function enableBusinessHours() {
  try {
    console.log('Enabling business hours display for all profiles...');
    
    // Update all profiles to set showHours to true
    const result = await Profile.updateMany(
      {}, // Update all profiles
      { 
        $set: { 
          'sections.showHours': true 
        } 
      }
    );

    console.log(`Updated ${result.modifiedCount} profiles to show business hours`);

    // Verification - check the profiles again
    const profiles = await Profile.find({}).select('personalInfo.firstName personalInfo.lastName sections.showHours businessHours');
    
    console.log('\nVerification:');
    for (const profile of profiles) {
      console.log(`${profile.personalInfo.firstName} ${profile.personalInfo.lastName}: showHours=${profile.sections.showHours}, businessHours=${profile.businessHours?.length || 0} items`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Update failed:', error);
    process.exit(1);
  }
}

enableBusinessHours();