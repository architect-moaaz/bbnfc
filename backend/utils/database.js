const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Get native MongoDB database instance
async function getDatabase() {
  // Wait for connection with retries
  let retries = 0;
  const maxRetries = 30; // 15 seconds total
  
  while (retries < maxRetries) {
    if (mongoose.connection.readyState === 1) {
      // Connection is ready, try to get database
      const client = mongoose.connection.getClient();
      if (client) {
        const db = client.db(mongoose.connection.name || 'test');
        if (db) {
          return db;
        }
      }
    }
    
    // Wait 500ms before next retry
    await new Promise(resolve => setTimeout(resolve, 500));
    retries++;
  }
  
  throw new Error('Database connection not available after retries');
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