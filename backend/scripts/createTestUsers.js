const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

const testUsers = [
  {
    name: 'Regular User',
    email: 'user@test.com',
    password: 'password123',
    role: 'user',
    isEmailVerified: true
  },
  {
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin',
    isEmailVerified: true
  },
  {
    name: 'Organization Admin',
    email: 'orgadmin@test.com',
    password: 'password123',
    role: 'org_admin',
    organizationRole: 'admin',
    isEmailVerified: true
  },
  {
    name: 'Super Admin',
    email: 'superadmin@test.com',
    password: 'password123',
    role: 'super_admin',
    isEmailVerified: true
  }
];

async function createTestUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nfc-business-cards');
    console.log('MongoDB connected');

    // Delete existing test users
    await User.deleteMany({
      email: {
        $in: testUsers.map(u => u.email)
      }
    });
    console.log('Deleted existing test users');

    // Create test users
    for (const userData of testUsers) {
      const user = await User.create(userData);
      console.log(`✓ Created ${userData.role} user: ${userData.email}`);
    }

    console.log('\n=================================');
    console.log('Test Users Created Successfully!');
    console.log('=================================\n');
    console.log('Login Credentials:');
    console.log('------------------\n');

    testUsers.forEach(user => {
      console.log(`${user.role.toUpperCase()}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error creating test users:', error);
    process.exit(1);
  }
}

createTestUsers();
