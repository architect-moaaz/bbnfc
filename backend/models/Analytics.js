const mongoose = require('mongoose');
const crypto = require('crypto');

const analyticsSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null,
    index: true
  },
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    default: null // optional: card-only events have no profile
  },
  card: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
    default: null
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  eventType: {
    type: String,
    enum: ['view', 'tap', 'scan', 'click', 'link_click', 'download', 'share', 'form_submit'],
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
    ipHash: String, // hashed IP for privacy-preserving unique-visitor counts
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
  duration: Number, // for session tracking
  date: { type: String, index: true }, // YYYY-MM-DD for daily grouping
  utm: {
    source: String,
    medium: String,
    campaign: String,
    content: String,
    term: String
  },
  session: {
    id: String,
    duration: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: { type: Date, default: null } // TTL: auto-purge per retention policy
});

// TTL index: documents are removed once expiresAt passes (retention policy)
analyticsSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
analyticsSchema.index({ organization: 1, timestamp: -1 });

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

const toId = (id) => (id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(id));

// Create an analytics event (hashes IP, stamps date, applies retention TTL).
analyticsSchema.statics.createEvent = async function(data, retentionDays = 90) {
  const doc = { ...data };
  if (data.visitor && data.visitor.ipAddress) {
    doc.visitor = {
      ...data.visitor,
      ipHash: crypto.createHash('sha256').update(String(data.visitor.ipAddress)).digest('hex')
    };
  }
  const now = new Date();
  doc.date = now.toISOString().split('T')[0];
  doc.createdAt = now;
  doc.expiresAt = new Date(now.getTime() + retentionDays * 24 * 60 * 60 * 1000);
  return this.create(doc);
};

// Link/click breakdown for a profile.
analyticsSchema.statics.getLinkAnalytics = async function(profileId, { start, end } = {}) {
  const match = { profile: toId(profileId), eventType: { $in: ['click', 'link_click'] } };
  if (start || end) match.timestamp = { ...(start && { $gte: start }), ...(end && { $lte: end }) };
  const rows = await this.aggregate([
    { $match: match },
    { $group: { _id: { $ifNull: ['$eventData.elementClicked', 'unknown'] }, count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  return rows.map((r) => ({ link: r._id, count: r.count }));
};

// Geographic breakdown for a profile.
analyticsSchema.statics.getGeographicAnalytics = async function(profileId) {
  const rows = await this.aggregate([
    { $match: { profile: toId(profileId) } },
    { $group: { _id: { $ifNull: ['$location.country', 'Unknown'] }, count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  return rows.map((r) => ({ country: r._id, count: r.count }));
};

// Device breakdown for a profile.
analyticsSchema.statics.getDeviceAnalytics = async function(profileId) {
  const rows = await this.aggregate([
    { $match: { profile: toId(profileId) } },
    { $group: { _id: { $ifNull: ['$visitor.device.type', 'unknown'] }, count: { $sum: 1 } } }
  ]);
  const result = { mobile: 0, tablet: 0, desktop: 0, other: 0, unknown: 0 };
  rows.forEach((r) => { result[r._id] = (result[r._id] || 0) + r.count; });
  return result;
};

// Time-of-day / day-of-week breakdown for a profile.
analyticsSchema.statics.getTimeAnalytics = async function(profileId) {
  const byHour = await this.aggregate([
    { $match: { profile: toId(profileId) } },
    { $group: { _id: { $hour: '$timestamp' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  const byDayOfWeek = await this.aggregate([
    { $match: { profile: toId(profileId) } },
    { $group: { _id: { $dayOfWeek: '$timestamp' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  return {
    byHour: byHour.map((r) => ({ hour: r._id, count: r.count })),
    byDayOfWeek: byDayOfWeek.map((r) => ({ day: r._id, count: r.count }))
  };
};

// Organization-wide analytics summary.
analyticsSchema.statics.getOrgAnalytics = async function(orgId, { startDate, endDate } = {}) {
  const match = { organization: toId(orgId) };
  if (startDate || endDate) match.timestamp = { ...(startDate && { $gte: startDate }), ...(endDate && { $lte: endDate }) };
  const rows = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        visitors: { $addToSet: '$visitor.ipHash' }
      }
    }
  ]);
  const eventBreakdown = {};
  const uniqueSet = new Set();
  let totalEvents = 0;
  rows.forEach((r) => {
    eventBreakdown[r._id] = r.count;
    totalEvents += r.count;
    (r.visitors || []).forEach((v) => v && uniqueSet.add(v));
  });
  return { totalEvents, eventBreakdown, uniqueVisitors: uniqueSet.size };
};

// UTM campaign breakdown for an organization.
analyticsSchema.statics.getUTMAnalytics = async function(orgId, { start, end } = {}) {
  const match = { organization: toId(orgId), 'utm.source': { $ne: null } };
  if (start || end) match.timestamp = { ...(start && { $gte: start }), ...(end && { $lte: end }) };
  const rows = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: { source: '$utm.source', medium: '$utm.medium', campaign: '$utm.campaign' },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
  return rows.map((r) => ({
    source: r._id.source, medium: r._id.medium, campaign: r._id.campaign, count: r.count
  }));
};

// CSV export of raw events for an organization.
analyticsSchema.statics.exportToCSV = async function(orgId, { startDate, endDate } = {}) {
  const query = { organization: toId(orgId) };
  if (startDate || endDate) query.timestamp = { ...(startDate && { $gte: startDate }), ...(endDate && { $lte: endDate }) };
  const events = await this.find(query).sort('-timestamp').limit(50000).lean();
  const headers = ['timestamp', 'eventType', 'profile', 'card', 'country', 'city', 'device', 'utmSource', 'utmCampaign'];
  const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
  const lines = [headers.join(',')];
  for (const e of events) {
    lines.push([
      e.timestamp && e.timestamp.toISOString(),
      e.eventType,
      e.profile,
      e.card,
      e.location && e.location.country,
      e.location && e.location.city,
      e.visitor && e.visitor.device && e.visitor.device.type,
      e.utm && e.utm.source,
      e.utm && e.utm.campaign
    ].map(esc).join(','));
  }
  return lines.join('\n');
};

module.exports = mongoose.model('Analytics', analyticsSchema);