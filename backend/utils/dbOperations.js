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

  getPlanDetails(plan) {
    const plans = {
      free: {
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
      pro: {
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

module.exports = {
  userOperations,
  subscriptionOperations
};