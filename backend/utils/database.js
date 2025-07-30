const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Wait for database connection to be ready
async function waitForConnection(maxRetries = 20) {
  let retries = 0;
  while (retries < maxRetries) {
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    retries++;
  }
  throw new Error('Database connection not ready after waiting');
}

// Execute any database operation with connection check
async function withDatabase(operation) {
  await waitForConnection();
  return await operation();
}

// Native operations for User model
const userOperations = {
  async findByEmail(email) {
    return await withDatabase(async () => {
      return await mongoose.connection.db.collection('users').findOne({ email });
    });
  },

  async create(userData) {
    return await withDatabase(async () => {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create user document
      const userDoc = {
        _id: new mongoose.Types.ObjectId(),
        name: userData.name,
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        isEmailVerified: false,
        role: 'user',
        createdAt: new Date(),
        __v: 0
      };
      
      const result = await mongoose.connection.db.collection('users').insertOne(userDoc);
      
      if (!result.acknowledged) {
        throw new Error('Failed to create user');
      }
      
      return userDoc;
    });
  },

  async updateById(userId, updates) {
    return await withDatabase(async () => {
      const result = await mongoose.connection.db.collection('users').updateOne(
        { _id: userId },
        { $set: updates }
      );
      return result;
    });
  }
};

// Native operations for Subscription model  
const subscriptionOperations = {
  async create(subscriptionData) {
    return await withDatabase(async () => {
      const subDoc = {
        _id: new mongoose.Types.ObjectId(),
        user: subscriptionData.user,
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
        createdAt: new Date(),
        __v: 0
      };
      
      const result = await mongoose.connection.db.collection('subscriptions').insertOne(subDoc);
      
      if (!result.acknowledged) {
        throw new Error('Failed to create subscription');
      }
      
      return subDoc;
    });
  }
};

module.exports = { userOperations, subscriptionOperations };