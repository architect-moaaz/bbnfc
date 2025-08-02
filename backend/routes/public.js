const express = require('express');
const router = express.Router();
const { profileOperations, templateOperations, analyticsOperations } = require('../utils/dbOperations');

// Helper function to detect device type
const detectDevice = (userAgent) => {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    return 'mobile';
  } else if (/tablet|ipad/i.test(ua)) {
    return 'tablet';
  } else {
    return 'desktop';
  }
};

// Helper function to parse user agent
const parseUserAgent = (userAgent) => {
  const ua = userAgent || '';
  let browser = 'unknown', browserVersion = '', os = 'unknown', osVersion = '';
  
  // Basic browser detection
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  
  // Basic OS detection
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS')) os = 'iOS';
  
  return { browser, browserVersion, os, osVersion };
};

// Get public profile by slug or ID
router.get('/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;
    const { source = 'direct', ref } = req.query;
    
    // Try to find by slug first, then by ID
    let profile = await profileOperations.findBySlug(profileId);
    
    if (!profile) {
      profile = await profileOperations.findById(profileId);
    }
    
    // Populate template data if it exists
    if (profile && profile.template) {
      const template = await templateOperations.findById(profile.template);
      profile = { ...profile, template };
    }
    
    if (!profile || !profile.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    // Generate session ID based on IP address and user agent (more stable)
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    const sessionId = `${ipAddress}_${Buffer.from(userAgent).toString('base64').substring(0, 20)}`;
    
    // Parse user agent
    const deviceInfo = parseUserAgent(userAgent);
    
    // Check if this session has already viewed this profile recently (within 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const { getDatabase, ObjectId } = require('../utils/mongodb');
    const db = await getDatabase();
    const existingView = await db.collection('analytics').findOne({
      profile: new ObjectId(profile._id),
      eventType: 'view',
      'visitor.sessionId': sessionId,
      timestamp: { $gte: oneHourAgo }
    });
    
    // Only track view if not already viewed in this session within the last hour
    if (!existingView) {
      // Create analytics entry for profile view
      try {
        await analyticsOperations.create({
          profile: profile._id,
          user: profile.user,
          eventType: 'view',
          eventData: {
            source: source, // nfc, qr, direct, social, etc.
            referrer: ref
          },
          visitor: {
            sessionId: sessionId,
            ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            userAgent: userAgent,
            browser: deviceInfo.browser,
            browserVersion: deviceInfo.browserVersion,
            os: deviceInfo.os,
            osVersion: deviceInfo.osVersion,
            device: {
              type: detectDevice(userAgent)
            },
            referrer: req.headers.referer || '',
            language: req.headers['accept-language'] ? req.headers['accept-language'].split(',')[0] : 'en'
          }
        });
        
        // Also increment legacy view count on profile only for new sessions
        const updatedAnalytics = {
          ...profile.analytics,
          views: (profile.analytics?.views || 0) + 1
        };
        await profileOperations.updateById(profile._id, { analytics: updatedAnalytics });
      } catch (analyticsError) {
        console.error('Analytics tracking failed:', analyticsError);
        // Don't fail the request if analytics fails
      }
    }
    
    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Track analytics events (taps, clicks, shares, etc.)
router.post('/:profileId/analytics', async (req, res) => {
  try {
    const { profileId } = req.params;
    const { eventType, eventData, visitor } = req.body;
    
    // Find profile by slug or ID
    let profile = await profileOperations.findBySlug(profileId);
    if (!profile) {
      profile = await profileOperations.findById(profileId);
    }
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    // Generate session ID if not provided (consistent with profile view)
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    const sessionId = visitor?.sessionId || `${ipAddress}_${Buffer.from(userAgent).toString('base64').substring(0, 20)}`;
    
    // Parse user agent if not provided
    const deviceInfo = parseUserAgent(userAgent);
    
    // Create analytics entry
    const analyticsEntry = await analyticsOperations.create({
      profile: profile._id,
      user: profile.user,
      eventType: eventType,
      eventData: eventData || {},
      visitor: {
        sessionId: sessionId,
        ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: userAgent,
        browser: deviceInfo.browser,
        browserVersion: deviceInfo.browserVersion,
        os: deviceInfo.os,
        osVersion: deviceInfo.osVersion,
        device: {
          type: detectDevice(userAgent)
        },
        referrer: req.headers.referer || '',
        language: req.headers['accept-language'] ? req.headers['accept-language'].split(',')[0] : 'en',
        ...visitor
      }
    });

    // Update legacy counters on profile
    const updatedAnalytics = { ...profile.analytics };
    switch (eventType) {
      case 'tap':
        updatedAnalytics.cardTaps = (updatedAnalytics.cardTaps || 0) + 1;
        break;
      case 'download':
        updatedAnalytics.contactDownloads = (updatedAnalytics.contactDownloads || 0) + 1;
        break;
      case 'click':
        const element = eventData?.elementClicked || 'unknown';
        if (!updatedAnalytics.linkClicks) {
          updatedAnalytics.linkClicks = {};
        }
        updatedAnalytics.linkClicks[element] = (updatedAnalytics.linkClicks[element] || 0) + 1;
        break;
    }
    
    await profileOperations.updateById(profile._id, { analytics: updatedAnalytics });
    
    res.status(200).json({
      success: true,
      data: {
        id: analyticsEntry._id,
        message: 'Analytics tracked successfully'
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

// Download vCard with tracking
router.get('/:profileId/vcard', async (req, res) => {
  try {
    const { profileId } = req.params;
    
    // Find profile by slug or ID
    let profile = await profileOperations.findBySlug(profileId);
    if (!profile) {
      profile = await profileOperations.findById(profileId);
    }
    
    if (!profile || !profile.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    // Track download analytics
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    const sessionId = `${ipAddress}_${Buffer.from(userAgent).toString('base64').substring(0, 20)}`;
    const deviceInfo = parseUserAgent(userAgent);
    
    try {
      await analyticsOperations.create({
        profile: profile._id,
        user: profile.user,
        eventType: 'download',
        eventData: {
          downloadType: 'vcard'
        },
        visitor: {
          sessionId: sessionId,
          ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: userAgent,
          browser: deviceInfo.browser,
          browserVersion: deviceInfo.browserVersion,
          os: deviceInfo.os,
          osVersion: deviceInfo.osVersion,
          device: {
            type: detectDevice(userAgent)
          },
          referrer: req.headers.referer || '',
          language: req.headers['accept-language'] ? req.headers['accept-language'].split(',')[0] : 'en'
        }
      });
      
      // Also increment the profile's contact download counter
      const updatedAnalytics = {
        ...profile.analytics,
        contactDownloads: (profile.analytics?.contactDownloads || 0) + 1
      };
      await profileOperations.updateById(profile._id, { analytics: updatedAnalytics });
      
    } catch (analyticsError) {
      console.error('Analytics tracking failed:', analyticsError);
    }

    // Helper function to escape vCard special characters
    const escapeVCardValue = (value) => {
      if (!value) return '';
      return value.toString()
        .replace(/\\/g, '\\\\')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '');
    };
    
    // Generate vCard content
    const vcardLines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${escapeVCardValue(profile.personalInfo.firstName)} ${escapeVCardValue(profile.personalInfo.lastName)}`,
      `N:${escapeVCardValue(profile.personalInfo.lastName)};${escapeVCardValue(profile.personalInfo.firstName)};;;`
    ];
    
    // Add optional fields only if they exist
    if (profile.personalInfo.title) {
      vcardLines.push(`TITLE:${escapeVCardValue(profile.personalInfo.title)}`);
    }
    
    if (profile.personalInfo.company) {
      vcardLines.push(`ORG:${escapeVCardValue(profile.personalInfo.company)}`);
    }
    
    if (profile.contactInfo?.email) {
      vcardLines.push(`EMAIL;TYPE=WORK:${escapeVCardValue(profile.contactInfo.email)}`);
      vcardLines.push(`EMAIL;TYPE=INTERNET:${escapeVCardValue(profile.contactInfo.email)}`);
    }
    
    if (profile.contactInfo?.phone) {
      const cleanPhone = profile.contactInfo.phone.replace(/[^\d+()-\s]/g, '');
      vcardLines.push(`TEL;TYPE=CELL:${cleanPhone}`);
      vcardLines.push(`TEL;TYPE=WORK:${cleanPhone}`);
    }
    
    if (profile.contactInfo?.website) {
      const website = profile.contactInfo.website.startsWith('http') ? 
        profile.contactInfo.website : 
        `https://${profile.contactInfo.website}`;
      vcardLines.push(`URL:${website}`);
    }
    
    // Add address if available
    if (profile.contactInfo?.address) {
      const addr = profile.contactInfo.address;
      if (addr.street || addr.city || addr.state || addr.country) {
        const addressParts = [
          '', // Post office box
          '', // Extended address
          addr.street || '',
          addr.city || '',
          addr.state || '',
          addr.postalCode || '',
          addr.country || ''
        ];
        vcardLines.push(`ADR;TYPE=WORK:${addressParts.join(';')}`);
      }
    }
    
    // Add bio and business hours to NOTE field
    let noteContent = profile.personalInfo.bio || '';
    
    // Add business hours if available and section is enabled
    if (profile.sections?.showHours && profile.businessHours && profile.businessHours.length > 0) {
      const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const hoursText = profile.businessHours
        .sort((a, b) => daysOrder.indexOf(a.day) - daysOrder.indexOf(b.day))
        .map(hour => {
          const dayDisplay = hour.day.charAt(0).toUpperCase() + hour.day.slice(1);
          if (!hour.isOpen) {
            return `${dayDisplay}: Closed`;
          }
          if (hour.openTime && hour.closeTime) {
            return `${dayDisplay}: ${hour.openTime} - ${hour.closeTime}`;
          }
          return `${dayDisplay}: Open`;
        })
        .join('\n');
      
      if (hoursText) {
        noteContent = noteContent ? 
          `${noteContent}\n\nBusiness Hours:\n${hoursText}` : 
          `Business Hours:\n${hoursText}`;
      }
    }
    
    if (noteContent) {
      vcardLines.push(`NOTE:${escapeVCardValue(noteContent)}`);
    }
    
    // Add photo if available (base64)
    if (profile.personalInfo.profilePhoto && profile.personalInfo.profilePhoto.startsWith('data:image')) {
      const photoData = profile.personalInfo.profilePhoto.split(',')[1];
      const mimeType = profile.personalInfo.profilePhoto.split(';')[0].split(':')[1];
      vcardLines.push(`PHOTO;ENCODING=BASE64;TYPE=${mimeType}:${photoData}`);
    }
    
    // Add revision timestamp
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    vcardLines.push(`REV:${now}`);
    
    vcardLines.push('END:VCARD');
    
    const vcard = vcardLines.join('\r\n');

    res.set({
      'Content-Type': 'text/vcard;charset=utf-8',
      'Content-Disposition': `attachment; filename="${profile.personalInfo.firstName}_${profile.personalInfo.lastName}.vcf"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.send(vcard);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;