const { getDatabase, ObjectId, createObjectId } = require('./mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// User operations
const userOperations = {
  async findByEmail(email) {
    const db = await getDatabase();
    return await db.collection('users').findOne({ email: email.toLowerCase() });
  },

  async findById(userId) {
    const db = await getDatabase();
    return await db.collection('users').findOne({ _id: new ObjectId(userId) });
  },

  async findByResetToken(token) {
    const db = await getDatabase();
    return await db.collection('users').findOne({
      passwordResetToken: token,
      passwordResetExpire: { $gt: new Date() }
    });
  },

  async findByVerificationToken(token) {
    const db = await getDatabase();
    return await db.collection('users').findOne({
      emailVerificationToken: token,
      emailVerificationExpire: { $gt: new Date() }
    });
  },

  async create(userData) {
    const db = await getDatabase();
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const userDoc = {
      _id: createObjectId(),
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      avatar: null,
      isEmailVerified: false,
      emailVerificationToken: null,
      emailVerificationExpire: null,
      passwordResetToken: null,
      passwordResetExpire: null,
      role: 'user',
      subscription: null,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      lastLogin: null,
      createdAt: new Date(),
    };

    const result = await db.collection('users').insertOne(userDoc);
    
    if (!result.acknowledged) {
      throw new Error('Failed to create user');
    }

    return userDoc;
  },

  async updateById(userId, updates) {
    const db = await getDatabase();
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: updates }
    );
    return result;
  },

  async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },

  generateJwtToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secret', {
      expiresIn: process.env.JWT_EXPIRE || '30d'
    });
  },

  generateVerificationToken() {
    const token = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    return { token, hashedToken };
  },

  async updatePassword(userId, newPassword) {
    const db = await getDatabase();
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          password: hashedPassword 
        },
        $unset: {
          passwordResetToken: "",
          passwordResetExpire: ""
        }
      }
    );
    return result;
  }
};

// Subscription operations
const subscriptionOperations = {
  async create(subscriptionData) {
    const db = await getDatabase();

    const subDoc = {
      _id: createObjectId(),
      user: new ObjectId(subscriptionData.user),
      plan: subscriptionData.plan || 'free',
      features: subscriptionData.features || {
        maxProfiles: 1,
        maxCardsPerProfile: 1,
        analytics: false,
        customDomain: false,
        teamMembers: 0,
        apiAccess: false,
        premiumTemplates: false,
        removeWatermark: false
      },
      status: 'active',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      createdAt: new Date(),
    };

    const result = await db.collection('subscriptions').insertOne(subDoc);
    
    if (!result.acknowledged) {
      throw new Error('Failed to create subscription');
    }

    return subDoc;
  },

  async findByUserId(userId) {
    const db = await getDatabase();
    return await db.collection('subscriptions').findOne({ user: new ObjectId(userId) });
  },

  async updateById(subscriptionId, updates) {
    const db = await getDatabase();
    const updateDoc = { 
      ...updates,
      updatedAt: new Date()
    };
    
    const result = await db.collection('subscriptions').updateOne(
      { _id: new ObjectId(subscriptionId) },
      { $set: updateDoc }
    );
    return result;
  },

  async updateByUserId(userId, updates) {
    const db = await getDatabase();
    const updateDoc = { 
      ...updates,
      updatedAt: new Date()
    };
    
    const result = await db.collection('subscriptions').updateOne(
      { user: new ObjectId(userId) },
      { $set: updateDoc }
    );
    return result;
  },

  getPlanDetails(plan) {
    const plans = {
      free: {
        price: 0,
        features: {
          maxProfiles: 1,
          maxCardsPerProfile: 1,
          analytics: false,
          customDomain: false,
          teamMembers: 0,
          apiAccess: false,
          premiumTemplates: false,
          removeWatermark: false
        }
      },
      basic: {
        price: 9.99,
        features: {
          maxProfiles: 3,
          maxCardsPerProfile: 5,
          analytics: true,
          customDomain: false,
          teamMembers: 0,
          apiAccess: false,
          premiumTemplates: true,
          removeWatermark: true
        }
      },
      pro: {
        price: 19.99,
        features: {
          maxProfiles: 5,
          maxCardsPerProfile: 10,
          analytics: true,
          customDomain: true,
          teamMembers: 5,
          apiAccess: true,
          premiumTemplates: true,
          removeWatermark: true
        }
      },
      enterprise: {
        price: 49.99,
        features: {
          maxProfiles: -1, // unlimited
          maxCardsPerProfile: -1, // unlimited
          analytics: true,
          customDomain: true,
          teamMembers: -1, // unlimited
          apiAccess: true,
          premiumTemplates: true,
          removeWatermark: true
        }
      }
    };

    return plans[plan] || plans.free;
  }
};

// Profile operations
const profileOperations = {
  async create(profileData) {
    const db = await getDatabase();
    
    const profileDoc = {
      _id: createObjectId(),
      user: new ObjectId(profileData.user),
      slug: profileData.slug,
      personalInfo: profileData.personalInfo || {},
      contactInfo: profileData.contactInfo || {},
      socialLinks: profileData.socialLinks || {},
      businessHours: profileData.businessHours || [],
      template: profileData.template ? new ObjectId(profileData.template) : null,
      customization: profileData.customization || {},
      sections: profileData.sections || {},
      callToAction: profileData.callToAction || null,
      analytics: profileData.analytics || {
        views: 0,
        uniqueViews: 0,
        clicks: 0,
        shares: 0
      },
      isActive: profileData.isActive !== undefined ? profileData.isActive : true,
      qrCode: profileData.qrCode || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('profiles').insertOne(profileDoc);
    
    if (!result.acknowledged) {
      throw new Error('Failed to create profile');
    }

    return profileDoc;
  },

  async findById(profileId) {
    const db = await getDatabase();
    return await db.collection('profiles').findOne({ _id: new ObjectId(profileId) });
  },

  async findBySlug(slug) {
    const db = await getDatabase();
    return await db.collection('profiles').findOne({ slug: slug });
  },

  async findByUserId(userId) {
    const db = await getDatabase();
    return await db.collection('profiles').find({ user: new ObjectId(userId) }).sort({ createdAt: -1 }).toArray();
  },

  async updateById(profileId, updates) {
    const db = await getDatabase();
    const updateDoc = { 
      ...updates,
      updatedAt: new Date()
    };
    
    // Handle ObjectId fields
    if (updates.template) {
      updateDoc.template = new ObjectId(updates.template);
    }
    
    const result = await db.collection('profiles').updateOne(
      { _id: new ObjectId(profileId) },
      { $set: updateDoc }
    );
    return result;
  },

  async deleteById(profileId) {
    const db = await getDatabase();
    const result = await db.collection('profiles').deleteOne({ _id: new ObjectId(profileId) });
    return result;
  }
};

// Template operations
const templateOperations = {
  async findById(templateId) {
    const db = await getDatabase();
    return await db.collection('templates').findOne({ _id: new ObjectId(templateId) });
  },

  async findBySlug(slug) {
    const db = await getDatabase();
    return await db.collection('templates').findOne({ slug: slug });
  },

  async findOne(query = {}) {
    const db = await getDatabase();
    return await db.collection('templates').findOne(query);
  },

  async find(filter = {}, sort = {}) {
    const db = await getDatabase();
    return await db.collection('templates').find(filter).sort(sort).toArray();
  },

  async create(templateData) {
    const db = await getDatabase();
    
    const templateDoc = {
      _id: createObjectId(),
      name: templateData.name,
      description: templateData.description,
      category: templateData.category || 'business',
      slug: templateData.slug,
      isPremium: templateData.isPremium || false,
      isActive: templateData.isActive !== undefined ? templateData.isActive : true,
      usageCount: 0,
      preview: templateData.preview || {},
      config: templateData.config || {},
      createdBy: templateData.createdBy ? new ObjectId(templateData.createdBy) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('templates').insertOne(templateDoc);
    
    if (!result.acknowledged) {
      throw new Error('Failed to create template');
    }

    return templateDoc;
  },

  async updateById(templateId, updates) {
    const db = await getDatabase();
    const updateDoc = { 
      ...updates,
      updatedAt: new Date()
    };
    
    // Handle ObjectId fields
    if (updates.createdBy) {
      updateDoc.createdBy = new ObjectId(updates.createdBy);
    }
    
    const result = await db.collection('templates').updateOne(
      { _id: new ObjectId(templateId) },
      { $set: updateDoc }
    );
    return result;
  },

  async deleteById(templateId) {
    const db = await getDatabase();
    const result = await db.collection('templates').deleteOne({ _id: new ObjectId(templateId) });
    return result;
  }
};

// Analytics operations
const analyticsOperations = {
  async create(analyticsData) {
    const db = await getDatabase();
    
    const analyticsDoc = {
      _id: createObjectId(),
      profile: new ObjectId(analyticsData.profile),
      user: new ObjectId(analyticsData.user),
      eventType: analyticsData.eventType,
      eventData: analyticsData.eventData || {},
      visitor: analyticsData.visitor || {},
      location: analyticsData.location || {},
      timestamp: new Date(),
      createdAt: new Date()
    };

    const result = await db.collection('analytics').insertOne(analyticsDoc);
    
    if (!result.acknowledged) {
      throw new Error('Failed to create analytics event');
    }

    return analyticsDoc;
  },

  async findByProfileIds(profileIds, limit = 10) {
    const db = await getDatabase();
    const objectIds = profileIds.map(id => new ObjectId(id));
    
    return await db.collection('analytics')
      .find({ profile: { $in: objectIds } })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  },

  async getAggregatedStats(profileIds, timeRange = 'month') {
    const db = await getDatabase();
    const objectIds = profileIds.map(id => new ObjectId(id));
    
    // Calculate date range
    const now = new Date();
    let startDate;
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const pipeline = [
      {
        $match: {
          profile: { $in: objectIds },
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 }
        }
      }
    ];

    return await db.collection('analytics').aggregate(pipeline).toArray();
  }
};

// Card operations
const cardOperations = {
  async create(cardData) {
    const db = await getDatabase();
    
    const cardDoc = {
      _id: createObjectId(),
      user: new ObjectId(cardData.user),
      profile: new ObjectId(cardData.profile),
      chipType: cardData.chipType || 'NTAG213',
      serialNumber: cardData.serialNumber,
      customUrl: cardData.customUrl,
      qrCodeUrl: cardData.qrCodeUrl,
      isActive: cardData.isActive !== undefined ? cardData.isActive : true,
      tapCount: 0,
      lastTapped: null,
      analytics: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('cards').insertOne(cardDoc);
    
    if (!result.acknowledged) {
      throw new Error('Failed to create card');
    }

    return cardDoc;
  },

  async findById(cardId) {
    const db = await getDatabase();
    return await db.collection('cards').findOne({ _id: new ObjectId(cardId) });
  },

  async findByUserId(userId) {
    const db = await getDatabase();
    return await db.collection('cards').find({ user: new ObjectId(userId) }).sort({ createdAt: -1 }).toArray();
  },

  async updateById(cardId, updates) {
    const db = await getDatabase();
    const updateDoc = { 
      ...updates,
      updatedAt: new Date()
    };
    
    // Handle ObjectId fields
    if (updates.profile) {
      updateDoc.profile = new ObjectId(updates.profile);
    }
    
    const result = await db.collection('cards').updateOne(
      { _id: new ObjectId(cardId) },
      { $set: updateDoc }
    );
    return result;
  },

  async deleteById(cardId) {
    const db = await getDatabase();
    const result = await db.collection('cards').deleteOne({ _id: new ObjectId(cardId) });
    return result;
  },

  async recordTap(cardId, tapData) {
    const db = await getDatabase();
    const result = await db.collection('cards').updateOne(
      { _id: new ObjectId(cardId) },
      { 
        $inc: { tapCount: 1 },
        $set: { lastTapped: new Date() },
        $push: { analytics: { ...tapData, timestamp: new Date() } }
      }
    );
    return result;
  }
};

// Admin operations (aggregated stats, counts, etc.)
const adminOperations = {
  async getUserCount() {
    const db = await getDatabase();
    return await db.collection('users').countDocuments();
  },

  async getProfileCount() {
    const db = await getDatabase();
    return await db.collection('profiles').countDocuments();
  },

  async getCardCount() {
    const db = await getDatabase();
    return await db.collection('cards').countDocuments();
  },

  async getAnalyticsCount() {
    const db = await getDatabase();
    return await db.collection('analytics').countDocuments();
  },

  async getRecentUserCount(daysAgo = 30) {
    const db = await getDatabase();
    const dateThreshold = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    return await db.collection('users').countDocuments({
      createdAt: { $gte: dateThreshold }
    });
  },

  async getActiveProfileCount(daysAgo = 30) {
    const db = await getDatabase();
    const dateThreshold = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const distinctProfiles = await db.collection('analytics').distinct('profile', {
      eventType: 'view',
      timestamp: { $gte: dateThreshold }
    });
    return distinctProfiles.length;
  },

  async getUsersWithPagination(page = 1, limit = 20) {
    const db = await getDatabase();
    const skip = (page - 1) * limit;
    
    const users = await db.collection('users')
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get subscription data for each user
    const usersWithSubscriptions = await Promise.all(
      users.map(async (user) => {
        const subscription = await subscriptionOperations.findByUserId(user._id);
        return { ...user, subscription };
      })
    );

    const total = await db.collection('users').countDocuments();
    
    return {
      users: usersWithSubscriptions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  async getProfilesWithPagination(page = 1, limit = 20) {
    const db = await getDatabase();
    const skip = (page - 1) * limit;
    
    const profiles = await db.collection('profiles')
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Populate user and template data
    const profilesWithPopulated = await Promise.all(
      profiles.map(async (profile) => {
        const user = await userOperations.findById(profile.user);
        const template = profile.template ? await templateOperations.findById(profile.template) : null;
        
        return {
          ...profile,
          user: user ? { name: user.name, email: user.email } : null,
          template: template ? { name: template.name } : null
        };
      })
    );

    const total = await db.collection('profiles').countDocuments();
    
    return {
      profiles: profilesWithPopulated,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  async deleteUserAndData(userId) {
    const db = await getDatabase();
    
    // Delete user and all related data
    const results = await Promise.all([
      db.collection('users').deleteOne({ _id: new ObjectId(userId) }),
      db.collection('profiles').deleteMany({ user: new ObjectId(userId) }),
      db.collection('cards').deleteMany({ user: new ObjectId(userId) }),
      db.collection('analytics').deleteMany({ user: new ObjectId(userId) }),
      db.collection('subscriptions').deleteMany({ user: new ObjectId(userId) })
    ]);
    
    return results[0]; // Return user deletion result
  }
};

module.exports = {
  userOperations,
  subscriptionOperations,
  profileOperations,
  templateOperations,
  analyticsOperations,
  cardOperations,
  adminOperations
};