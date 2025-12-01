const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // Core Info
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },

  // Actor (who performed the action)
  actor: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    email: String,
    name: String,
    role: String,
    type: {
      type: String,
      enum: ['user', 'admin', 'system', 'api'],
      default: 'user'
    }
  },

  // Action Details
  action: {
    type: String,
    required: true,
    enum: [
      // User actions
      'user.created', 'user.updated', 'user.deleted', 'user.suspended', 'user.activated',
      'user.login', 'user.logout', 'user.password_changed', 'user.2fa_enabled', 'user.2fa_disabled',

      // Organization actions
      'org.created', 'org.updated', 'org.deleted', 'org.suspended', 'org.activated',
      'org.plan_changed', 'org.settings_changed', 'org.branding_changed',

      // Card actions
      'card.created', 'card.assigned', 'card.unassigned', 'card.reassigned',
      'card.activated', 'card.deactivated', 'card.deleted',
      'card.claimed', 'card.bulk_created',

      // Profile actions
      'profile.created', 'profile.updated', 'profile.deleted', 'profile.published',
      'profile.unpublished', 'profile.template_changed',

      // Template actions
      'template.created', 'template.updated', 'template.deleted', 'template.approved',

      // Claim token actions
      'claim_token.created', 'claim_token.used', 'claim_token.revoked', 'claim_token.expired',

      // Security actions
      'security.failed_login', 'security.password_reset', 'security.2fa_bypass_attempt',
      'security.suspicious_activity', 'security.ip_blocked',

      // Data actions
      'data.exported', 'data.imported', 'data.deleted', 'data.backup_created',

      // Billing actions
      'billing.subscription_created', 'billing.subscription_updated', 'billing.subscription_cancelled',
      'billing.payment_succeeded', 'billing.payment_failed', 'billing.invoice_generated',

      // API actions
      'api.key_created', 'api.key_revoked', 'api.rate_limit_exceeded',

      // Admin actions
      'admin.access_granted', 'admin.access_revoked', 'admin.settings_changed'
    ],
    index: true
  },

  // Resource being acted upon
  resource: {
    type: {
      type: String,
      enum: ['user', 'organization', 'card', 'profile', 'template', 'claim_token', 'subscription', 'api_key'],
      index: true
    },
    id: mongoose.Schema.Types.ObjectId,
    name: String,
    identifier: String // e.g., email, card ID, slug
  },

  // Change Details
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
    fields: [String] // List of changed fields
  },

  // Request Context
  context: {
    ipAddress: String,
    userAgent: String,
    method: String, // HTTP method
    endpoint: String, // API endpoint
    requestId: String,
    sessionId: String,
    location: {
      country: String,
      city: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    }
  },

  // Result
  result: {
    status: {
      type: String,
      enum: ['success', 'failure', 'partial'],
      default: 'success'
    },
    message: String,
    errorCode: String,
    errorDetails: mongoose.Schema.Types.Mixed
  },

  // Severity
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
    index: true
  },

  // Category
  category: {
    type: String,
    enum: ['security', 'data', 'configuration', 'user_activity', 'billing', 'system'],
    default: 'user_activity',
    index: true
  },

  // Additional metadata
  metadata: mongoose.Schema.Types.Mixed,

  // Compliance flags
  compliance: {
    gdprRelevant: {
      type: Boolean,
      default: false
    },
    dataSubject: String, // Email or ID of data subject
    legalBasis: String,
    retainUntil: Date
  },

  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: Date // For automatic deletion (TTL index)
});

// Compound Indexes
auditLogSchema.index({ organization: 1, timestamp: -1 });
auditLogSchema.index({ 'actor.userId': 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ 'resource.type': 1, 'resource.id': 1, timestamp: -1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });
auditLogSchema.index({ category: 1, timestamp: -1 });
auditLogSchema.index({ 'result.status': 1, timestamp: -1 });

// TTL Index for automatic deletion
auditLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to log an action
auditLogSchema.statics.log = async function(data) {
  try {
    const log = await this.create(data);
    return log;
  } catch (error) {
    // Don't throw error for audit log failures - just log to console
    console.error('Failed to create audit log:', error);
    return null;
  }
};

// Static method to log with automatic expiry
auditLogSchema.statics.logWithRetention = async function(data, retentionDays = 365) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + retentionDays);

  return await this.log({
    ...data,
    expiresAt
  });
};

// Static method to get audit trail for a resource
auditLogSchema.statics.getAuditTrail = async function(resourceType, resourceId, options = {}) {
  const query = {
    'resource.type': resourceType,
    'resource.id': resourceId
  };

  if (options.startDate) {
    query.timestamp = { $gte: options.startDate };
  }

  if (options.endDate) {
    query.timestamp = { ...query.timestamp, $lte: options.endDate };
  }

  if (options.action) {
    query.action = options.action;
  }

  const limit = options.limit || 100;
  const skip = options.skip || 0;

  const logs = await this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .populate('actor.userId', 'name email')
    .lean();

  return logs;
};

// Static method to get user activity
auditLogSchema.statics.getUserActivity = async function(userId, options = {}) {
  const query = { 'actor.userId': userId };

  if (options.startDate) {
    query.timestamp = { $gte: options.startDate };
  }

  if (options.endDate) {
    query.timestamp = { ...query.timestamp, $lte: options.endDate };
  }

  const limit = options.limit || 100;

  return await this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

// Static method to get security events
auditLogSchema.statics.getSecurityEvents = async function(organizationId, options = {}) {
  const query = {
    organization: organizationId,
    category: 'security'
  };

  if (options.severity) {
    query.severity = options.severity;
  }

  if (options.startDate) {
    query.timestamp = { $gte: options.startDate };
  }

  const limit = options.limit || 100;

  return await this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('actor.userId', 'name email')
    .lean();
};

// Static method to export logs for compliance
auditLogSchema.statics.exportForCompliance = async function(organizationId, options = {}) {
  const query = {
    organization: organizationId
  };

  if (options.dataSubject) {
    query['compliance.dataSubject'] = options.dataSubject;
  }

  if (options.startDate) {
    query.timestamp = { $gte: options.startDate };
  }

  if (options.endDate) {
    query.timestamp = { ...query.timestamp, $lte: options.endDate };
  }

  const logs = await this.find(query)
    .sort({ timestamp: 1 })
    .lean();

  return logs;
};

// Static method to get suspicious activities
auditLogSchema.statics.getSuspiciousActivities = async function(organizationId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const suspiciousActions = [
    'security.failed_login',
    'security.2fa_bypass_attempt',
    'security.suspicious_activity',
    'api.rate_limit_exceeded'
  ];

  return await this.find({
    organization: organizationId,
    action: { $in: suspiciousActions },
    timestamp: { $gte: startDate }
  })
    .sort({ timestamp: -1 })
    .populate('actor.userId', 'name email')
    .lean();
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
