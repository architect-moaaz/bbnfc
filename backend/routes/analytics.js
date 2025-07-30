const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Analytics = require('../models/Analytics');
const Profile = require('../models/Profile');

// Helper function to format time ago
const formatTimeAgo = (date) => {
  const now = new Date();
  const diffInMs = now - new Date(date);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    const months = Math.floor(diffInDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
};

// Record analytics event
router.post('/event', async (req, res) => {
  try {
    const {
      profileId,
      eventType,
      eventData,
      visitor,
      location
    } = req.body;
    
    // Verify profile exists
    const profile = await Profile.findById(profileId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    // Create analytics event
    await Analytics.create({
      profile: profileId,
      user: profile.user,
      eventType,
      eventData,
      visitor,
      location
    });
    
    // Update profile analytics counters
    if (eventType === 'view') {
      profile.analytics.views += 1;
      // Check if unique visitor (simple session-based check)
      if (visitor.sessionId && !profile.analytics.uniqueViews) {
        profile.analytics.uniqueViews = 1;
      }
    } else if (eventType === 'tap') {
      profile.analytics.cardTaps += 1;
    } else if (eventType === 'download') {
      profile.analytics.contactDownloads += 1;
    } else if (eventType === 'click' && eventData.elementClicked) {
      const clicks = profile.analytics.linkClicks || new Map();
      const currentCount = clicks.get(eventData.elementClicked) || 0;
      clicks.set(eventData.elementClicked, currentCount + 1);
      profile.analytics.linkClicks = clicks;
    }
    
    await profile.save();
    
    res.status(201).json({
      success: true,
      data: 'Event recorded'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get user dashboard data
router.get('/dashboard', protect, async (req, res) => {
  try {
    const { timeRange = 'month' } = req.query;
    
    // Get all user profiles with full data
    const profiles = await Profile.find({ user: req.user.id })
      .select('personalInfo analytics createdAt updatedAt isActive slug')
      .sort({ updatedAt: -1 });
    
    const profileIds = profiles.map(p => p._id);
    
    // Calculate profile totals from legacy counters
    const totalProfiles = profiles.length;
    const totalViews = profiles.reduce((sum, p) => sum + (p.analytics?.views || 0), 0);
    const totalTaps = profiles.reduce((sum, p) => sum + (p.analytics?.cardTaps || 0), 0);
    const totalDownloads = profiles.reduce((sum, p) => sum + (p.analytics?.contactDownloads || 0), 0);
    
    if (profileIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalProfiles: 0,
          totalViews: 0,
          totalTaps: 0,
          totalShares: 0,
          recentProfiles: [],
          recentActivity: [],
          profileBreakdown: [],
          deviceBreakdown: {},
          topCountries: []
        }
      });
    }
    
    // Get recent activity for the time range
    const recentActivity = await Analytics.find({
      profile: { $in: profileIds }
    })
    .sort({ timestamp: -1 })
    .limit(10)
    .populate('profile', 'personalInfo slug')
    .lean();

    // Format recent profiles with actual data
    const recentProfiles = profiles.slice(0, 5).map(profile => ({
      id: profile._id,
      name: `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}${profile.personalInfo.title ? ' - ' + profile.personalInfo.title : ''}`,
      views: profile.analytics?.views || 0,
      taps: profile.analytics?.cardTaps || 0,
      status: profile.isActive ? 'active' : 'draft',
      lastUpdated: formatTimeAgo(profile.updatedAt),
      slug: profile.slug
    }));

    // Format recent activity with readable messages
    const formattedActivity = recentActivity.map(activity => {
      const profileName = activity.profile ? 
        `${activity.profile.personalInfo.firstName} ${activity.profile.personalInfo.lastName}${activity.profile.personalInfo.title ? ' - ' + activity.profile.personalInfo.title : ''}` : 
        'Unknown Profile';
      
      let message = '';
      switch (activity.eventType) {
        case 'view':
          message = `Someone viewed your "${profileName}" profile`;
          break;
        case 'tap':
          message = `NFC tap on "${profileName}" card`;
          break;
        case 'download':
          message = `Contact downloaded from "${profileName}"`;
          break;
        case 'click':
          const element = activity.eventData?.elementClicked || 'link';
          message = `${element} clicked on "${profileName}"`;
          break;
        case 'share':
          message = `"${profileName}" profile shared`;
          break;
        default:
          message = `Activity on "${profileName}"`;
      }
      
      return {
        id: activity._id,
        type: activity.eventType,
        message,
        time: formatTimeAgo(activity.timestamp),
        profileName
      };
    });

    // Calculate aggregated stats from profile data (more reliable than analytics collection)
    const stats = {
      totalProfiles,
      totalViews,
      totalTaps,
      totalShares: profiles.reduce((sum, p) => sum + (p.analytics?.linkClicks?.size || 0), 0)
    };

    res.status(200).json({
      success: true,
      data: {
        ...stats,
        recentProfiles,
        recentActivity: formattedActivity
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;