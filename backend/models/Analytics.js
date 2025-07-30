const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventType: {
    type: String,
    enum: ['view', 'tap', 'click', 'download', 'share', 'form_submit'],
    required: true
  },
  eventData: {
    source: {
      type: String,
      enum: ['nfc', 'qr', 'direct', 'social', 'search', 'other']
    },
    elementClicked: String,
    downloadType: String,
    shareMethod: String,
    formType: String
  },
  visitor: {
    sessionId: String,
    ipAddress: String,
    userAgent: String,
    browser: String,
    browserVersion: String,
    os: String,
    osVersion: String,
    device: {
      type: {
        type: String,
        enum: ['mobile', 'tablet', 'desktop', 'other']
      },
      model: String,
      vendor: String
    },
    referrer: String,
    language: String
  },
  location: {
    country: String,
    countryCode: String,
    region: String,
    city: String,
    postalCode: String,
    timezone: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  duration: Number // for session tracking
});

// Indexes for efficient querying
analyticsSchema.index({ profile: 1, timestamp: -1 });
analyticsSchema.index({ user: 1, timestamp: -1 });
analyticsSchema.index({ 'visitor.sessionId': 1 });
analyticsSchema.index({ eventType: 1 });

// Static method to get aggregated analytics
analyticsSchema.statics.getAggregatedAnalytics = async function(profileId, timeRange) {
  const endDate = new Date();
  let startDate;
  
  switch (timeRange) {
    case 'day':
      startDate = new Date(endDate - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      startDate = new Date(endDate - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(endDate - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(endDate - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(0); // all time
  }
  
  const analytics = await this.aggregate([
    {
      $match: {
        profile: mongoose.Types.ObjectId(profileId),
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalViews: {
          $sum: { $cond: [{ $eq: ['$eventType', 'view'] }, 1, 0] }
        },
        uniqueVisitors: {
          $addToSet: '$visitor.sessionId'
        },
        totalTaps: {
          $sum: { $cond: [{ $eq: ['$eventType', 'tap'] }, 1, 0] }
        },
        totalClicks: {
          $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] }
        },
        totalDownloads: {
          $sum: { $cond: [{ $eq: ['$eventType', 'download'] }, 1, 0] }
        },
        deviceTypes: {
          $push: '$visitor.device.type'
        },
        sources: {
          $push: '$eventData.source'
        },
        countries: {
          $push: '$location.country'
        }
      }
    }
  ]);
  
  if (analytics.length === 0) {
    return {
      totalViews: 0,
      uniqueVisitors: 0,
      totalTaps: 0,
      totalClicks: 0,
      totalDownloads: 0,
      deviceBreakdown: {},
      sourceBreakdown: {},
      topCountries: []
    };
  }
  
  const result = analytics[0];
  
  // Calculate breakdowns
  const deviceBreakdown = result.deviceTypes.reduce((acc, device) => {
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {});
  
  const sourceBreakdown = result.sources.reduce((acc, source) => {
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});
  
  const countryCount = result.countries.reduce((acc, country) => {
    if (country) {
      acc[country] = (acc[country] || 0) + 1;
    }
    return acc;
  }, {});
  
  const topCountries = Object.entries(countryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([country, count]) => ({ country, count }));
  
  return {
    totalViews: result.totalViews,
    uniqueVisitors: result.uniqueVisitors.length,
    totalTaps: result.totalTaps,
    totalClicks: result.totalClicks,
    totalDownloads: result.totalDownloads,
    deviceBreakdown,
    sourceBreakdown,
    topCountries
  };
};

// Method to get time series data
analyticsSchema.statics.getTimeSeries = async function(profileId, timeRange, eventType) {
  const endDate = new Date();
  let startDate, groupBy;
  
  switch (timeRange) {
    case 'day':
      startDate = new Date(endDate - 24 * 60 * 60 * 1000);
      groupBy = { $hour: '$timestamp' };
      break;
    case 'week':
      startDate = new Date(endDate - 7 * 24 * 60 * 60 * 1000);
      groupBy = { $dayOfWeek: '$timestamp' };
      break;
    case 'month':
      startDate = new Date(endDate - 30 * 24 * 60 * 60 * 1000);
      groupBy = { $dayOfMonth: '$timestamp' };
      break;
    default:
      startDate = new Date(endDate - 365 * 24 * 60 * 60 * 1000);
      groupBy = { $month: '$timestamp' };
  }
  
  const match = {
    profile: mongoose.Types.ObjectId(profileId),
    timestamp: { $gte: startDate, $lte: endDate }
  };
  
  if (eventType) {
    match.eventType = eventType;
  }
  
  return await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: groupBy,
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

module.exports = mongoose.model('Analytics', analyticsSchema);