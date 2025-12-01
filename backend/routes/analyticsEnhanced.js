const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');
const Profile = require('../models/Profile');
const Card = require('../models/Card');
const { protect } = require('../middleware/auth');
const permission = require('../middleware/permission');
const tenant = require('../middleware/tenant');

/**
 * @route   GET /api/analytics-v2/profile/:profileId
 * @desc    Get profile analytics
 * @access  Owner or Org Admin
 */
router.get('/profile/:profileId',
  protect,
  async (req, res) => {
    try {
      const { startDate, endDate, timeRange = '30d' } = req.query;

      const profile = await Profile.findById(req.params.profileId);

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'Profile not found'
        });
      }

      // Check access
      if (req.user._id.toString() !== profile.user.toString()) {
        if (req.user.role !== 'super_admin' && !req.user.isOrgAdmin()) {
          return res.status(403).json({
            success: false,
            error: 'Access denied'
          });
        }
      }

      // Calculate date range
      let start, end;
      end = endDate ? new Date(endDate) : new Date();

      if (startDate) {
        start = new Date(startDate);
      } else {
        // Parse timeRange (e.g., "7d", "30d", "90d")
        const days = parseInt(timeRange);
        start = new Date();
        start.setDate(start.getDate() - days);
      }

      // Get analytics summary
      const summary = await Analytics.aggregate([
        {
          $match: {
            profile: profile._id,
            timestamp: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: null,
            totalViews: {
              $sum: { $cond: [{ $eq: ['$eventType', 'view'] }, 1, 0] }
            },
            totalTaps: {
              $sum: { $cond: [{ $eq: ['$eventType', 'tap'] }, 1, 0] }
            },
            totalScans: {
              $sum: { $cond: [{ $eq: ['$eventType', 'scan'] }, 1, 0] }
            },
            totalClicks: {
              $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] }
            },
            totalDownloads: {
              $sum: { $cond: [{ $eq: ['$eventType', 'download'] }, 1, 0] }
            },
            uniqueVisitors: { $addToSet: '$visitor.ipHash' }
          }
        },
        {
          $project: {
            totalViews: 1,
            totalTaps: 1,
            totalScans: 1,
            totalClicks: 1,
            totalDownloads: 1,
            uniqueVisitors: { $size: '$uniqueVisitors' }
          }
        }
      ]);

      // Get daily breakdown
      const dailyStats = await Analytics.aggregate([
        {
          $match: {
            profile: profile._id,
            timestamp: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: {
              date: '$date',
              eventType: '$eventType'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            events: {
              $push: {
                type: '$_id.eventType',
                count: '$count'
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Get link analytics
      const linkStats = await Analytics.getLinkAnalytics(req.params.profileId, { start, end });

      // Get geographic analytics
      const geoStats = await Analytics.getGeographicAnalytics(req.params.profileId);

      // Get device analytics
      const deviceStats = await Analytics.getDeviceAnalytics(req.params.profileId);

      // Get time-based analytics
      const timeStats = await Analytics.getTimeAnalytics(req.params.profileId);

      res.json({
        success: true,
        data: {
          summary: summary[0] || {
            totalViews: 0,
            totalTaps: 0,
            totalScans: 0,
            totalClicks: 0,
            totalDownloads: 0,
            uniqueVisitors: 0
          },
          dailyStats,
          linkStats,
          geoStats,
          deviceStats,
          timeStats,
          dateRange: { start, end }
        }
      });
    } catch (error) {
      console.error('Get profile analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching analytics'
      });
    }
  }
);

/**
 * @route   GET /api/analytics-v2/card/:cardId
 * @desc    Get card analytics
 * @access  Owner or Org Admin
 */
router.get('/card/:cardId',
  protect,
  async (req, res) => {
    try {
      const { startDate, endDate, timeRange = '30d' } = req.query;

      const card = await Card.findById(req.params.cardId);

      if (!card) {
        return res.status(404).json({
          success: false,
          error: 'Card not found'
        });
      }

      // Check access
      if (req.user.role !== 'super_admin') {
        if (!req.user.organization || req.user.organization.toString() !== card.organization.toString()) {
          if (!card.assignedTo || card.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({
              success: false,
              error: 'Access denied'
            });
          }
        } else if (!req.user.isOrgAdmin()) {
          if (!card.assignedTo || card.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({
              success: false,
              error: 'Access denied'
            });
          }
        }
      }

      // Calculate date range
      let start, end;
      end = endDate ? new Date(endDate) : new Date();

      if (startDate) {
        start = new Date(startDate);
      } else {
        const days = parseInt(timeRange);
        start = new Date();
        start.setDate(start.getDate() - days);
      }

      // Get analytics
      const analytics = await Analytics.find({
        card: card._id,
        timestamp: { $gte: start, $lte: end }
      }).sort('-timestamp').limit(100);

      res.json({
        success: true,
        data: {
          cardId: card.cardId,
          stats: {
            tapCount: card.stats.tapCount,
            scanCount: card.stats.scanCount,
            viewCount: card.stats.viewCount,
            vcardDownloads: card.stats.vcardDownloads,
            lastTapped: card.stats.lastTapped,
            firstTapped: card.stats.firstTapped
          },
          recentActivity: analytics
        }
      });
    } catch (error) {
      console.error('Get card analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching analytics'
      });
    }
  }
);

/**
 * @route   GET /api/analytics-v2/organization/:orgId
 * @desc    Get organization-wide analytics
 * @access  Org Admin or Super Admin
 */
router.get('/organization/:orgId',
  protect,
  tenant.setTenantFromParam('orgId'),
  permission.any(permission.isSuperAdmin, permission.isOrgAdmin),
  async (req, res) => {
    try {
      const { startDate, endDate, timeRange = '30d' } = req.query;

      // Calculate date range
      let start, end;
      end = endDate ? new Date(endDate) : new Date();

      if (startDate) {
        start = new Date(startDate);
      } else {
        const days = parseInt(timeRange);
        start = new Date();
        start.setDate(start.getDate() - days);
      }

      const analytics = await Analytics.getOrgAnalytics(req.params.orgId, {
        startDate: start,
        endDate: end
      });

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Get organization analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching analytics'
      });
    }
  }
);

/**
 * @route   GET /api/analytics-v2/utm/:orgId
 * @desc    Get UTM campaign analytics
 * @access  Org Admin or Super Admin
 */
router.get('/utm/:orgId',
  protect,
  tenant.setTenantFromParam('orgId'),
  permission.any(permission.isSuperAdmin, permission.isOrgAdmin),
  async (req, res) => {
    try {
      const { startDate, endDate, timeRange = '30d' } = req.query;

      // Calculate date range
      let start, end;
      end = endDate ? new Date(endDate) : new Date();

      if (startDate) {
        start = new Date(startDate);
      } else {
        const days = parseInt(timeRange);
        start = new Date();
        start.setDate(start.getDate() - days);
      }

      const utmAnalytics = await Analytics.getUTMAnalytics(req.params.orgId, {
        start,
        end
      });

      res.json({
        success: true,
        data: utmAnalytics
      });
    } catch (error) {
      console.error('Get UTM analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching UTM analytics'
      });
    }
  }
);

/**
 * @route   GET /api/analytics-v2/export/:orgId
 * @desc    Export analytics data to CSV
 * @access  Org Admin or Super Admin
 */
router.get('/export/:orgId',
  protect,
  tenant.setTenantFromParam('orgId'),
  permission.any(permission.isSuperAdmin, permission.isOrgAdmin),
  async (req, res) => {
    try {
      const { startDate, endDate, format = 'csv' } = req.query;

      // Calculate date range
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const csv = await Analytics.exportToCSV(req.params.orgId, {
        startDate: start,
        endDate: end
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${req.params.orgId}-${Date.now()}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error('Export analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Error exporting analytics'
      });
    }
  }
);

/**
 * @route   POST /api/analytics-v2/event
 * @desc    Create analytics event (public endpoint for tracking)
 * @access  Public
 */
router.post('/event', async (req, res) => {
  try {
    const {
      profileId,
      cardId,
      eventType,
      eventData,
      utm,
      sessionId
    } = req.body;

    if (!profileId && !cardId) {
      return res.status(400).json({
        success: false,
        error: 'Profile ID or Card ID is required'
      });
    }

    let profile, card, organization, user;

    if (profileId) {
      profile = await Profile.findById(profileId);
      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'Profile not found'
        });
      }
      organization = profile.organization;
      user = profile.user;
      card = profile.card;
    }

    if (cardId && !card) {
      card = await Card.findById(cardId);
      if (!card) {
        return res.status(404).json({
          success: false,
          error: 'Card not found'
        });
      }
      organization = card.organization;
      user = card.assignedTo;
      if (!profile && card.assignedProfile) {
        profile = card.assignedProfile;
      }
    }

    // Create analytics event
    const event = await Analytics.createEvent({
      organization,
      profile: profile?._id,
      user,
      card: card?._id,
      eventType,
      eventData,
      utm,
      visitor: {
        sessionId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        referrer: req.get('referer')
      },
      session: {
        id: sessionId
      }
    }, organization ? 90 : 30);

    res.json({
      success: true,
      data: { eventId: event._id }
    });
  } catch (error) {
    console.error('Create analytics event error:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating event'
    });
  }
});

/**
 * @route   GET /api/analytics-v2/realtime/:profileId
 * @desc    Get real-time analytics (last hour)
 * @access  Owner or Org Admin
 */
router.get('/realtime/:profileId',
  protect,
  async (req, res) => {
    try {
      const profile = await Profile.findById(req.params.profileId);

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'Profile not found'
        });
      }

      // Check access
      if (req.user._id.toString() !== profile.user.toString()) {
        if (req.user.role !== 'super_admin' && !req.user.isOrgAdmin()) {
          return res.status(403).json({
            success: false,
            error: 'Access denied'
          });
        }
      }

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      // Get recent events
      const recentEvents = await Analytics.find({
        profile: profile._id,
        timestamp: { $gte: oneHourAgo }
      }).sort('-timestamp').limit(50);

      // Get active sessions (last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const activeSessions = await Analytics.aggregate([
        {
          $match: {
            profile: profile._id,
            timestamp: { $gte: fiveMinutesAgo }
          }
        },
        {
          $group: {
            _id: '$session.id',
            lastActivity: { $max: '$timestamp' },
            events: { $sum: 1 }
          }
        }
      ]);

      // Event counts by type
      const eventCounts = await Analytics.aggregate([
        {
          $match: {
            profile: profile._id,
            timestamp: { $gte: oneHourAgo }
          }
        },
        {
          $group: {
            _id: '$eventType',
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          activeSessions: activeSessions.length,
          recentEvents,
          eventCounts: eventCounts.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          timeRange: {
            start: oneHourAgo,
            end: new Date()
          }
        }
      });
    } catch (error) {
      console.error('Get realtime analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching realtime analytics'
      });
    }
  }
);

/**
 * @route   GET /api/analytics-v2/leaderboard/:orgId
 * @desc    Get top performing profiles
 * @access  Org Admin or Super Admin
 */
router.get('/leaderboard/:orgId',
  protect,
  tenant.setTenantFromParam('orgId'),
  permission.any(permission.isSuperAdmin, permission.isOrgAdmin),
  async (req, res) => {
    try {
      const { metric = 'views', limit = 10, timeRange = '30d' } = req.query;

      const days = parseInt(timeRange);
      const start = new Date();
      start.setDate(start.getDate() - days);

      // Map metric to event type
      const eventTypeMap = {
        views: 'view',
        taps: 'tap',
        scans: 'scan',
        clicks: 'click',
        downloads: 'download'
      };

      const eventType = eventTypeMap[metric] || 'view';

      const leaderboard = await Analytics.aggregate([
        {
          $match: {
            organization: require('mongodb').ObjectId(req.params.orgId),
            eventType,
            timestamp: { $gte: start }
          }
        },
        {
          $group: {
            _id: '$profile',
            count: { $sum: 1 },
            uniqueVisitors: { $addToSet: '$visitor.ipHash' }
          }
        },
        {
          $project: {
            profile: '$_id',
            count: 1,
            uniqueVisitors: { $size: '$uniqueVisitors' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: parseInt(limit) }
      ]);

      // Populate profile data
      const populatedLeaderboard = await Profile.populate(leaderboard, {
        path: 'profile',
        select: 'username personalInfo.firstName personalInfo.lastName personalInfo.profilePhoto'
      });

      res.json({
        success: true,
        data: populatedLeaderboard,
        metric,
        timeRange
      });
    } catch (error) {
      console.error('Get leaderboard error:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching leaderboard'
      });
    }
  }
);

module.exports = router;
