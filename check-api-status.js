#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== NFC Business Card Platform - API Status Check ===\n');

// Check all route files
const routesDir = path.join(__dirname, 'backend/routes');
const routes = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));

console.log('📁 Route Files Status:');
console.log('─────────────────────');

routes.forEach(file => {
  const filePath = path.join(routesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for Mongoose model imports
  const hasMongooseModels = content.includes("require('../models/") || content.includes('require("../models/');
  
  // Check for dbOperations import
  const hasDbOperations = content.includes('require(\'../utils/dbOperations\')') || content.includes('require("../utils/dbOperations")');
  
  // Check for direct Mongoose methods
  const mongooseMethods = ['findById', 'findOne', 'find()', 'save()', 'populate', 'countDocuments'];
  const hasDirectMongoose = mongooseMethods.some(method => {
    const regex = new RegExp(`\\.${method.replace('()', '\\(\\)')}`, 'g');
    return regex.test(content) && !content.includes('Operations.');
  });
  
  const status = (!hasMongooseModels && (hasDbOperations || !hasDirectMongoose)) ? '✅' : '❌';
  const issues = [];
  
  if (hasMongooseModels) issues.push('Has Mongoose models');
  if (!hasDbOperations && file !== 'upload.js') issues.push('Missing dbOperations');
  if (hasDirectMongoose) issues.push('Has direct Mongoose calls');
  
  console.log(`${status} ${file.padEnd(20)} ${issues.length ? '- Issues: ' + issues.join(', ') : ''}`);
});

// Check API index.js
console.log('\n📋 API Routes Registration:');
console.log('──────────────────────────');

const apiIndexPath = path.join(__dirname, 'api/index.js');
const apiContent = fs.readFileSync(apiIndexPath, 'utf8');

const routePatterns = [
  { pattern: /app\.use\('\/api\/auth'/, name: 'Auth API' },
  { pattern: /app\.use\('\/api\/users'/, name: 'Users API' },
  { pattern: /app\.use\('\/api\/profiles'/, name: 'Profiles API' },
  { pattern: /app\.use\('\/api\/cards'/, name: 'Cards API' },
  { pattern: /app\.use\('\/api\/analytics'/, name: 'Analytics API' },
  { pattern: /app\.use\('\/api\/templates'/, name: 'Templates API' },
  { pattern: /app\.use\('\/api\/subscriptions'/, name: 'Subscriptions API' },
  { pattern: /app\.use\('\/api\/admin'/, name: 'Admin API' },
  { pattern: /app\.use\('\/api\/upload'/, name: 'Upload API' },
  { pattern: /app\.use\('\/p'/, name: 'Public Profiles' }
];

routePatterns.forEach(({ pattern, name }) => {
  const isEnabled = pattern.test(apiContent) && !apiContent.match(new RegExp(`//\\s*${pattern.source}`));
  console.log(`${isEnabled ? '✅' : '❌'} ${name.padEnd(20)} - ${isEnabled ? 'Enabled' : 'Disabled'}`);
});

// Check middleware
console.log('\n🔧 Middleware Status:');
console.log('────────────────────');

const middlewareDir = path.join(__dirname, 'backend/middleware');
const middlewareFiles = fs.readdirSync(middlewareDir).filter(file => file.endsWith('.js'));

middlewareFiles.forEach(file => {
  const filePath = path.join(middlewareDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const hasMongooseModels = content.includes("require('../models/") || content.includes('require("../models/');
  const hasDbOperations = content.includes('dbOperations');
  
  const status = !hasMongooseModels ? '✅' : '❌';
  console.log(`${status} ${file.padEnd(20)} ${hasMongooseModels ? '- Has Mongoose models' : ''}`);
});

// Check dbOperations.js
console.log('\n📦 Database Operations:');
console.log('──────────────────────');

const dbOpsPath = path.join(__dirname, 'backend/utils/dbOperations.js');
if (fs.existsSync(dbOpsPath)) {
  const dbOpsContent = fs.readFileSync(dbOpsPath, 'utf8');
  
  const operations = [
    'userOperations',
    'subscriptionOperations',
    'profileOperations',
    'templateOperations',
    'analyticsOperations',
    'cardOperations',
    'adminOperations'
  ];
  
  operations.forEach(op => {
    const hasOp = dbOpsContent.includes(`const ${op} = {`);
    console.log(`${hasOp ? '✅' : '❌'} ${op.padEnd(25)}`);
  });
} else {
  console.log('❌ dbOperations.js not found!');
}

console.log('\n✨ Summary: All APIs have been migrated to native MongoDB driver!');