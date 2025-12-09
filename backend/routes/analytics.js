const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { profileOperations, analyticsOperations } = require('../utils/dbOperations');

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

// Record analytics event (public endpoint for tracking profile views)
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
    const profile = await profileOperations.findById(profileId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    // Create analytics event
    await analyticsOperations.create({
      profile: profileId,
      user: profile.user,
      eventType,
      eventData,
      visitor,
      location
    });
    
    // Update profile analytics counters
    const currentAnalytics = profile.analytics || {
      views: 0,
      uniqueViews: 0,
      clicks: 0,
      shares: 0,
      cardTaps: 0,
      contactDownloads: 0
    };
    
    if (eventType === 'view') {
      currentAnalytics.views += 1;
      // Simple unique visitor check
      if (visitor.sessionId) {
        currentAnalytics.uniqueViews += 1;
      }
    } else if (eventType === 'tap') {
      currentAnalytics.cardTaps += 1;
    } else if (eventType === 'download') {
      currentAnalytics.contactDownloads += 1;
    } else if (eventType === 'click') {
      currentAnalytics.clicks += 1;
    }
    
    await profileOperations.updateById(profileId, { analytics: currentAnalytics });
    
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
    const profiles = await profileOperations.findByUserId(req.user._id);
    
    const profileIds = profiles.map(p => p._id.toString());
    
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
    const recentActivity = await analyticsOperations.findByProfileIds(profileIds, 10);

    // Format recent profiles with actual data
    const recentProfiles = profiles.slice(0, 5).map(profile => ({
      id: profile._id,
      name: `${profile.personalInfo?.firstName || ''} ${profile.personalInfo?.lastName || ''}${profile.personalInfo?.title ? ' - ' + profile.personalInfo.title : ''}`.trim(),
      views: profile.analytics?.views || 0,
      taps: profile.analytics?.cardTaps || 0,
      status: profile.isActive ? 'active' : 'draft',
      lastUpdated: formatTimeAgo(profile.updatedAt),
      slug: profile.slug
    }));

    // Format recent activity with readable messages
    const formattedActivity = recentActivity.map(activity => {
      // Find the profile for this activity
      const activityProfile = profiles.find(p => p._id.toString() === activity.profile.toString());
      const profileName = activityProfile ? 
        `${activityProfile.personalInfo?.firstName || ''} ${activityProfile.personalInfo?.lastName || ''}${activityProfile.personalInfo?.title ? ' - ' + activityProfile.personalInfo.title : ''}`.trim() : 
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
      totalShares: profiles.reduce((sum, p) => sum + (p.analytics?.shares || 0), 0)
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

// Get dashboard widget data (for charts)
router.get('/widgets', protect, async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    const days = parseInt(timeRange) || 7;

    // Get all user profiles
    const profiles = await profileOperations.findByUserId(req.user._id);
    const profileIds = profiles.map(p => p._id.toString());

    if (profileIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          viewsTrend: {
            labels: [],
            views: [],
            taps: []
          },
          deviceBreakdown: {
            mobile: 0,
            desktop: 0,
            tablet: 0
          },
          profilePerformance: [],
          engagementMetrics: {
            clickThroughRate: 0,
            contactSaves: 0,
            socialClicks: 0,
            qrScans: 0
          }
        }
      });
    }

    // Calculate date labels for the last N days
    const labels = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      labels.push(dayNames[date.getDay()]);
    }

    // Get analytics events for the time range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analyticsEvents = await analyticsOperations.findByProfileIdsWithDateRange(profileIds, startDate);

    // Calculate views and taps per day
    const viewsPerDay = new Array(days).fill(0);
    const tapsPerDay = new Array(days).fill(0);

    // Device breakdown
    const deviceCounts = { mobile: 0, desktop: 0, tablet: 0 };

    // Click tracking
    let totalClicks = 0;
    let socialClicks = 0;
    let contactDownloads = 0;
    let qrScans = 0;
    let totalViews = 0;

    analyticsEvents.forEach(event => {
      const eventDate = new Date(event.timestamp);
      const dayIndex = days - 1 - Math.floor((today - eventDate) / (1000 * 60 * 60 * 24));

      if (dayIndex >= 0 && dayIndex < days) {
        if (event.eventType === 'view') {
          viewsPerDay[dayIndex]++;
          totalViews++;
        } else if (event.eventType === 'tap') {
          tapsPerDay[dayIndex]++;
        } else if (event.eventType === 'scan') {
          qrScans++;
        }
      }

      // Count by event type
      if (event.eventType === 'click') {
        totalClicks++;
        if (event.eventData?.linkType === 'social') {
          socialClicks++;
        }
      } else if (event.eventType === 'download') {
        contactDownloads++;
      }

      // Device breakdown from visitor data
      const userAgent = event.visitor?.userAgent?.toLowerCase() || '';
      if (userAgent.includes('mobile') || userAgent.includes('iphone') || userAgent.includes('android')) {
        if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
          deviceCounts.tablet++;
        } else {
          deviceCounts.mobile++;
        }
      } else {
        deviceCounts.desktop++;
      }
    });

    // Calculate profile performance from stored analytics
    const profilePerformance = profiles.map(p => ({
      name: `${p.personalInfo?.firstName || ''} ${p.personalInfo?.lastName || ''}`.trim() || p.slug || 'Untitled',
      views: p.analytics?.views || 0
    })).sort((a, b) => b.views - a.views).slice(0, 5);

    // Calculate engagement metrics as percentages
    const totalProfileViews = profiles.reduce((sum, p) => sum + (p.analytics?.views || 0), 0) || 1;
    const clickThroughRate = Math.min(((totalClicks / totalProfileViews) * 100), 100).toFixed(1);
    const contactSaveRate = Math.min(((contactDownloads / totalProfileViews) * 100), 100).toFixed(1);
    const socialClickRate = Math.min(((socialClicks / totalProfileViews) * 100), 100).toFixed(1);
    const qrScanRate = Math.min(((qrScans / totalProfileViews) * 100), 100).toFixed(1);

    res.status(200).json({
      success: true,
      data: {
        viewsTrend: {
          labels,
          views: viewsPerDay,
          taps: tapsPerDay
        },
        deviceBreakdown: deviceCounts,
        profilePerformance,
        engagementMetrics: {
          clickThroughRate: parseFloat(clickThroughRate),
          contactSaves: parseFloat(contactSaveRate),
          socialClicks: parseFloat(socialClickRate),
          qrScans: parseFloat(qrScanRate)
        }
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