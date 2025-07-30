require('dotenv').config();
const mongoose = require('mongoose');
const Profile = require('../models/Profile');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nfc-business-card');

async function fixBusinessHoursDays() {
  try {
    console.log('Starting business hours days migration...');
    
    // Find all profiles with business hours
    const profiles = await Profile.find({
      businessHours: { $exists: true, $ne: [] }
    });

    console.log(`Found ${profiles.length} profiles with business hours`);

    let updatedCount = 0;

    for (const profile of profiles) {
      let needsUpdate = false;
      const updatedBusinessHours = profile.businessHours.map(hour => {
        if (hour.day && hour.day !== hour.day.toLowerCase()) {
          needsUpdate = true;
          return {
            ...hour.toObject(),
            day: hour.day.toLowerCase()
          };
        }
        return hour;
      });

      if (needsUpdate) {
        await Profile.findByIdAndUpdate(
          profile._id,
          { businessHours: updatedBusinessHours },
          { runValidators: true }
        );
        updatedCount++;
        console.log(`Updated profile ${profile._id}: ${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`);
      }
    }

    console.log(`Migration completed. Updated ${updatedCount} profiles.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

fixBusinessHoursDays();