# BBTap Database Models - Quick Reference

## Model Overview

| Model | Status | Purpose | Key Features |
|-------|--------|---------|--------------|
| **Organization** | ✅ New | Multi-tenant org management | Plans, limits, branding, settings |
| **User** | ✅ Enhanced | User accounts & auth | Multi-tenant, roles, social auth, 2FA |
| **Card** | ✅ Enhanced | NFC card lifecycle | Claiming, assignment, tracking |
| **Profile** | ⏳ Pending | Digital business card | Content & customization |
| **Analytics** | ⏳ Pending | Usage tracking | Views, taps, UTM tracking |
| **ClaimToken** | ✅ New | Card claiming system | Secure token generation |
| **AuditLog** | ✅ New | Compliance logging | Full audit trail |
| **Template** | Existing | Profile templates | Design templates |
| **Subscription** | Existing | Billing | Payment management |

---

## 1. Organization Model

**Path:** `backend/models/Organization.js`

### Schema
```javascript
{
  name: String,              // Organization name
  slug: String,              // URL slug (unique)
  subdomain: String,         // Subdomain for multi-tenant
  type: String,              // individual|business|enterprise|reseller
  status: String,            // active|suspended|trial|expired
  plan: String,              // free|pro|business|enterprise|custom

  contactInfo: {
    email, phone, website, address
  },

  branding: {
    logo, primaryColor, secondaryColor, fontFamily,
    customDomain, customDomainVerified
  },

  limits: {
    users: 5, cards: 10, profiles: 10, storage: 100MB
  },

  usage: {
    users: 0, cards: 0, profiles: 0, storage: 0
  },

  settings: {
    allowCustomBranding, requireApproval, lockTemplate,
    enforcePasswordPolicy, require2FA, enableAnalytics,
    enableDirectory, enableLeadCapture, defaultLanguage, ...
  },

  owner: ObjectId,           // User reference
  admins: [ObjectId]         // User references
}
```

### Key Methods
```javascript
org.canAddUsers(count)           // Check if can add N users
org.canAddCards(count)           // Check if can add N cards
org.incrementUsage('users', 1)   // Increment usage counter
org.isActive()                   // Check if org is active
org.getUrl()                     // Get org URL (subdomain or custom)
```

### Static Methods
```javascript
Organization.findByDomain(domain)  // Find by subdomain or custom domain
```

### Usage Example
```javascript
const org = new Organization({
  name: 'Acme Corp',
  slug: 'acme',
  subdomain: 'acme',
  type: 'business',
  plan: 'pro',
  contactInfo: { email: 'admin@acme.com' },
  owner: userId
});
await org.save();

// Check limits
if (org.canAddUsers(1)) {
  await org.incrementUsage('users', 1);
}

// Get URL
console.log(org.getUrl()); // https://acme.bbtap.me
```

---

## 2. User Model (Enhanced)

**Path:** `backend/models/User.js`

### New Fields
```javascript
{
  username: String,          // For cleaner URLs (unique)
  organization: ObjectId,    // Organization reference
  role: String,              // super_admin|org_admin|org_member|user
  organizationRole: String,  // owner|admin|manager|member
  department: String,
  position: String,
  status: String,            // active|inactive|suspended|pending

  // Claim & Onboarding
  claimToken: ObjectId,
  claimStatus: String,       // unclaimed|claimed|setup_incomplete|setup_complete
  onboardingCompleted: Boolean,
  onboardingStep: Number,

  // Security
  twoFactorBackupCodes: [String],
  failedLoginAttempts: Number,
  accountLockedUntil: Date,

  // Social Auth
  socialAuth: {
    google: { id, email, verified },
    apple: { id, email, verified },
    linkedin: { id, email, verified }
  },
  authProvider: String,      // local|google|apple|linkedin

  // Preferences
  preferences: {
    language, timezone,
    notifications: { email, push, profileViews, weeklyDigest },
    privacy: { showInDirectory, allowAnalytics }
  }
}
```

### Key Methods
```javascript
user.hasPermission('org:write')      // Check permission
user.canAccessOrganization(orgId)    // Check org access
user.isOrgAdmin()                    // Check if admin
user.recordLogin(ipAddress)          // Log successful login
user.recordFailedLogin()             // Log failed login
user.isAccountLocked()               // Check if locked
user.generate2FABackupCodes()        // Generate backup codes
user.verify2FABackupCode(code)       // Verify backup code
```

### Static Methods
```javascript
User.findByUsernameOrEmail(identifier)  // Find by either
User.findBySocialAuth('google', socialId) // Find by social auth
```

### Role Permissions
```javascript
super_admin: ['*']  // All permissions
org_admin: ['org:*', 'users:*', 'cards:*', 'profiles:*']
org_member: ['profile:own', 'card:own', 'analytics:own']
user: ['profile:own', 'analytics:own']
```

---

## 3. Card Model (Enhanced)

**Path:** `backend/models/Card.js`

### New Fields
```javascript
{
  organization: ObjectId,    // Required: Organization
  user: ObjectId,            // Optional: Current owner
  profile: ObjectId,         // Optional: Linked profile

  // Identification
  cardId: String,            // "BB-XXXXXXXX" (auto-generated)
  serialNumber: String,      // Physical serial
  sku: String,               // Product SKU
  batchNumber: String,
  productLine: String,       // classic|premium|metal|wood

  // URLs
  ndefUrl: String,           // Required: Deep link URL
  shortUrl: String,          // Shortened URL
  customUrl: String,         // Custom domain URL

  // Lifecycle
  status: String,            // inventory|provisioned|claimed|active|inactive|suspended
  lifecycleStage: String,    // manufactured|encoded|shipped|delivered|claimed|active

  // Claim Info
  claimToken: ObjectId,
  claimStatus: String,       // unclaimed|pending|claimed
  claimedAt: Date,
  claimMethod: String,       // link|qr|nfc|manual

  // Assignment History
  assignmentHistory: [{
    user, profile, assignedAt, assignedBy,
    unassignedAt, unassignedBy, reason
  }],

  // Physical Details
  physical: {
    material, color, finish, printedOn, design
  },

  // Shipping
  shipping: {
    orderId, trackingNumber, carrier,
    shippedAt, deliveredAt, address
  },

  // Statistics
  stats: {
    tapCount, scanCount, viewCount, shareCount,
    vcardDownloads, lastTapped, firstTapped
  }
}
```

### Key Methods
```javascript
// Recording Events
card.recordTap()                              // Record NFC tap
card.recordScan()                             // Record QR scan
card.recordView()                             // Record profile view

// Assignment
card.assignTo(userId, profileId, adminId)     // Assign to user
card.unassign(adminId, reason)                // Unassign from user
card.reassign(newUserId, profileId, adminId)  // Reassign to new user

// Status Management
card.activate()                               // Activate card
card.deactivate(reason)                       // Deactivate card
card.suspend(reason)                          // Suspend card
card.unsuspend()                              // Unsuspend card

// Claim
card.markClaimed(userId, method)              // Mark as claimed

// Utility
card.generateShortUrl()                       // Generate short URL
card.getUrl(organization)                     // Get appropriate URL
card.isClaimable()                            // Check if can be claimed
card.isReassignable()                         // Check if can be reassigned
```

### Static Methods
```javascript
Card.bulkCreate(count, orgId, options)       // Create N cards
Card.findAvailableForOrg(orgId, limit)       // Get available cards
Card.getOrgStats(orgId)                      // Get org statistics
```

### Usage Example
```javascript
// Bulk create cards for organization
const cards = await Card.bulkCreate(100, orgId, {
  sku: 'BB-CLASSIC-100',
  batchNumber: 'BATCH-2025-001',
  productLine: 'classic',
  chipType: 'NTAG215'
});

// Assign card to user
await card.assignTo(userId, profileId, adminId, 'initial_assignment');

// Record tap
await card.recordTap();

// Reassign to new user
await card.reassign(newUserId, newProfileId, adminId, 'employee_changed');
```

---

## 4. ClaimToken Model

**Path:** `backend/models/ClaimToken.js`

### Schema
```javascript
{
  token: String,             // Plain token (hashed in DB)
  tokenHash: String,         // SHA-256 hash
  type: String,              // card|bulk_invite|organization_invite

  organization: ObjectId,    // Required
  card: ObjectId,            // Optional: linked card

  assignedTo: {
    email, name, phone       // Pre-assigned user info
  },

  status: String,            // pending|claimed|expired|revoked
  claimedBy: ObjectId,       // User who claimed
  claimedAt: Date,

  expiresAt: Date,           // Required: expiration
  maxUses: Number,           // Default: 1
  usedCount: Number,

  requireEmailVerification: Boolean,
  verificationCode: String,  // Hashed 6-digit code

  claimAttempts: [{
    timestamp, ipAddress, email, success, failureReason
  }],

  qrCodeUrl: String          // URL to QR code image
}
```

### Key Methods
```javascript
claimToken.getClaimUrl()              // Get claim URL
claimToken.isValid()                  // Check if valid
claimToken.claim(userId, data)        // Claim token
claimToken.recordAttempt(data)        // Record claim attempt
claimToken.revoke(userId, reason)     // Revoke token
claimToken.generateVerificationCode() // Generate 6-digit code
claimToken.verifyCode(code)           // Verify code
```

### Static Methods
```javascript
ClaimToken.generateToken()            // Generate secure token
ClaimToken.createClaimToken(data)     // Create token record
ClaimToken.findByToken(token)         // Find by plain token
ClaimToken.expireOldTokens()          // Expire expired tokens (cron)
```

### Usage Example
```javascript
// Create claim token for card
const { claimToken, plainToken } = await ClaimToken.createClaimToken({
  type: 'card',
  organization: orgId,
  card: cardId,
  assignedTo: {
    email: 'john@example.com',
    name: 'John Doe'
  },
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  requireEmailVerification: true,
  createdBy: adminId
});

// Generate verification code and send email
const code = claimToken.generateVerificationCode();
await claimToken.save();
await sendEmail(email, `Your verification code is: ${code}`);

// User claims token
const token = await ClaimToken.findByToken(plainToken);
if (token.isValid() && token.verifyCode(userEnteredCode)) {
  await token.claim(userId, { emailVerified: true });
}
```

---

## 5. AuditLog Model

**Path:** `backend/models/AuditLog.js`

### Schema
```javascript
{
  organization: ObjectId,    // Required

  actor: {
    userId, email, name, role,
    type: 'user|admin|system|api'
  },

  action: String,            // e.g., 'user.created', 'card.assigned'

  resource: {
    type: 'user|organization|card|profile',
    id: ObjectId,
    name: String,
    identifier: String
  },

  changes: {
    before: Object,          // State before
    after: Object,           // State after
    fields: [String]         // Changed fields
  },

  context: {
    ipAddress, userAgent, method, endpoint,
    requestId, sessionId, location
  },

  result: {
    status: 'success|failure|partial',
    message, errorCode, errorDetails
  },

  severity: String,          // low|medium|high|critical
  category: String,          // security|data|configuration|user_activity

  compliance: {
    gdprRelevant, dataSubject, legalBasis, retainUntil
  },

  timestamp: Date,
  expiresAt: Date           // For TTL
}
```

### Action Types (50+)
```javascript
// User actions
'user.created', 'user.updated', 'user.deleted', 'user.suspended',
'user.login', 'user.logout', 'user.password_changed', 'user.2fa_enabled'

// Organization actions
'org.created', 'org.updated', 'org.plan_changed', 'org.settings_changed'

// Card actions
'card.created', 'card.assigned', 'card.reassigned', 'card.claimed',
'card.activated', 'card.suspended', 'card.bulk_created'

// Security actions
'security.failed_login', 'security.2fa_bypass_attempt',
'security.suspicious_activity', 'security.ip_blocked'

// Billing actions
'billing.subscription_created', 'billing.payment_succeeded'
```

### Static Methods
```javascript
AuditLog.log(data)                           // Create log entry
AuditLog.logWithRetention(data, days)        // Log with auto-expiry
AuditLog.getAuditTrail(type, id, options)    // Get resource history
AuditLog.getUserActivity(userId, options)     // Get user activity
AuditLog.getSecurityEvents(orgId, options)    // Get security events
AuditLog.exportForCompliance(orgId, options)  // Export for GDPR
AuditLog.getSuspiciousActivities(orgId, days) // Get suspicious activity
```

### Usage Example
```javascript
// Log card assignment
await AuditLog.log({
  organization: orgId,
  actor: {
    userId: adminId,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    type: 'user'
  },
  action: 'card.assigned',
  resource: {
    type: 'card',
    id: cardId,
    identifier: card.cardId
  },
  changes: {
    before: { user: null },
    after: { user: userId },
    fields: ['user', 'status']
  },
  context: {
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    method: 'POST',
    endpoint: '/api/cards/:id/assign'
  },
  result: {
    status: 'success'
  },
  severity: 'low',
  category: 'user_activity'
});

// Get user activity
const activity = await AuditLog.getUserActivity(userId, {
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  limit: 100
});
```

---

## Common Usage Patterns

### 1. Creating an Organization
```javascript
const organization = new Organization({
  name: 'Acme Corp',
  slug: 'acme',
  subdomain: 'acme',
  type: 'business',
  plan: 'pro',
  contactInfo: {
    email: 'admin@acme.com',
    phone: '+1234567890'
  },
  branding: {
    primaryColor: '#0066cc',
    logo: 'https://...'
  },
  owner: userId
});
await organization.save();
```

### 2. Provisioning Cards for Bulk Claim
```javascript
// Create cards
const cards = await Card.bulkCreate(50, organizationId, {
  sku: 'BB-PRO-2025',
  batchNumber: 'BATCH-001',
  productLine: 'premium'
});

// Generate claim tokens
for (const card of cards) {
  const { claimToken, plainToken } = await ClaimToken.createClaimToken({
    type: 'card',
    organization: organizationId,
    card: card._id,
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    createdBy: adminId
  });

  card.claimToken = claimToken._id;
  card.status = 'provisioned';
  await card.save();

  console.log(`Claim URL: ${claimToken.getClaimUrl()}`);
}
```

### 3. User Claiming a Card
```javascript
// Validate token
const claimToken = await ClaimToken.findByToken(token)
  .populate('card')
  .populate('organization');

if (!claimToken || !claimToken.isValid()) {
  throw new Error('Invalid or expired token');
}

// Send verification code
const code = claimToken.generateVerificationCode();
await claimToken.save();
await sendEmail(claimToken.assignedTo.email, `Code: ${code}`);

// User verifies
if (claimToken.verifyCode(userCode)) {
  // Create user account
  const user = new User({
    name: claimToken.assignedTo.name,
    email: claimToken.assignedTo.email,
    organization: claimToken.organization,
    role: 'org_member',
    claimToken: claimToken._id,
    claimStatus: 'claimed',
    status: 'active'
  });
  await user.save();

  // Claim token and assign card
  await claimToken.claim(user._id, { emailVerified: true });
  await card.markClaimed(user._id, 'link');
  await card.assignTo(user._id, null, adminId, 'claimed_via_token');

  // Log
  await AuditLog.log({
    organization: claimToken.organization,
    actor: { userId: user._id, type: 'user' },
    action: 'card.claimed',
    resource: { type: 'card', id: card._id },
    severity: 'low',
    category: 'user_activity'
  });
}
```

### 4. Multi-Tenant Query Pattern
```javascript
// Always filter by organization
const cards = await Card.find({
  organization: req.user.organization,
  status: 'active'
});

const users = await User.find({
  organization: req.user.organization,
  status: { $ne: 'suspended' }
});
```

---

## Migration Checklist

When migrating existing data:

1. ✅ Create default organization
2. ✅ Update all existing users with organization reference
3. ✅ Generate usernames for users (from email)
4. ✅ Update all existing cards with organization reference
5. ✅ Update all existing profiles with organization reference
6. ✅ Update all existing analytics with organization reference
7. ✅ Set default roles for existing users
8. ✅ Create audit log entries for migration

---

*Last Updated: 2025-11-25*
