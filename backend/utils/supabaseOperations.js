const { supabase } = require('./supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// User operations
const userOperations = {
  async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error;
    }

    return data;
  },

  async create(userData) {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const userDoc = {
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      is_email_verified: false,
      role: 'user',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('users')
      .insert(userDoc)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async updateById(userId, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async findById(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }
};

// Subscription operations
const subscriptionOperations = {
  async create(subscriptionData) {
    const subDoc = {
      user_id: subscriptionData.user,
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
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subDoc)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async findByUserId(userId) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }
};

// Helper functions
const authHelpers = {
  generateJWT(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secret', {
      expiresIn: process.env.JWT_EXPIRE || '30d'
    });
  },

  async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
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

module.exports = { userOperations, subscriptionOperations, authHelpers };