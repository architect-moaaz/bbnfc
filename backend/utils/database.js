const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Get native MongoDB database instance
async function getDatabase() {
  // If mongoose connection is not ready, wait
  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve, reject) => {
      mongoose.connection.once('connected', resolve);
      mongoose.connection.once('error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 30000);
    });
  }
  
  // Try to get the database instance
  const db = mongoose.connection.getClient()?.db(mongoose.connection.name || 'test');
  
  if (!db) {
    throw new Error('Could not get database instance');
  }
  
  return db;
}

// Execute any database operation with connection check
async function withDatabase(operation) {
  const db = await getDatabase();
  return await operation(db);
}

// Native operations for User model
const userOperations = {
  async findByEmail(email) {
    return await withDatabase(async (db) => {
      return await db.collection('users').findOne({ email });
    });
  },

  async create(userData) {
    return await withDatabase(async (db) => {
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
      
      const result = await db.collection('users').insertOne(userDoc);
      
      if (!result.acknowledged) {
        throw new Error('Failed to create user');
      }
      
      return userDoc;
    });
  },

  async updateById(userId, updates) {
    return await withDatabase(async (db) => {
      const result = await db.collection('users').updateOne(
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
    return await withDatabase(async (db) => {
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
      
      const result = await db.collection('subscriptions').insertOne(subDoc);
      
      if (!result.acknowledged) {
        throw new Error('Failed to create subscription');
      }
      
      return subDoc;
    });
  }
};

module.exports = { userOperations, subscriptionOperations };