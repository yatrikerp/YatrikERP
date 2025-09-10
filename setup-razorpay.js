#!/usr/bin/env node

/**
 * Quick Razorpay Setup Script for YATRIK ERP
 * 
 * This script helps you set up Razorpay test keys quickly.
 * 
 * Steps:
 * 1. Go to https://razorpay.com/
 * 2. Sign up for a free account
 * 3. Go to Settings > API Keys
 * 4. Generate Test API Keys
 * 5. Copy the Key ID and Key Secret
 * 6. Run this script with your keys
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 YATRIK ERP - Razorpay Setup');
console.log('================================\n');

// Check if keys are provided as arguments
const keyId = process.argv[2];
const keySecret = process.argv[3];

if (!keyId || !keySecret) {
  console.log('❌ Please provide your Razorpay test keys:');
  console.log('   node setup-razorpay.js YOUR_KEY_ID YOUR_KEY_SECRET\n');
  console.log('📝 To get your test keys:');
  console.log('   1. Go to https://razorpay.com/');
  console.log('   2. Sign up for a free account');
  console.log('   3. Go to Settings > API Keys');
  console.log('   4. Generate Test API Keys');
  console.log('   5. Copy the Key ID and Key Secret\n');
  console.log('💡 Example:');
  console.log('   node setup-razorpay.js rzp_test_1234567890abcdef 1234567890abcdef1234567890abcdef');
  process.exit(1);
}

// Validate key format
if (!keyId.startsWith('rzp_test_')) {
  console.log('❌ Invalid Key ID format. Should start with "rzp_test_"');
  process.exit(1);
}

if (keySecret.length < 20) {
  console.log('❌ Invalid Key Secret format. Should be at least 20 characters');
  process.exit(1);
}

console.log('✅ Valid Razorpay test keys provided');
console.log(`   Key ID: ${keyId}`);
console.log(`   Key Secret: ${keySecret.substring(0, 10)}...`);

// Create environment files
const backendEnv = `# YATRIK ERP Backend Environment Configuration

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/yatrik_erp

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Session Configuration
SESSION_SECRET=your-session-secret-key-change-this-in-production

# Frontend Configuration
FRONTEND_URL=http://localhost:5173

# Razorpay Configuration - Your Test Keys
RAZORPAY_KEY_ID=${keyId}
RAZORPAY_KEY_SECRET=${keySecret}
`;

const frontendEnv = `# YATRIK ERP Frontend Environment Configuration

# API Configuration
VITE_API_URL=http://localhost:5000

# Razorpay Configuration
VITE_RAZORPAY_KEY_ID=${keyId}

# Development Configuration
PORT=5173
`;

// Write backend .env
const backendEnvPath = path.join(__dirname, 'backend', '.env');
fs.writeFileSync(backendEnvPath, backendEnv);
console.log(`✅ Created backend/.env`);

// Write frontend .env
const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
fs.writeFileSync(frontendEnvPath, frontendEnv);
console.log(`✅ Created frontend/.env`);

console.log('\n🎉 Setup complete!');
console.log('\n📋 Next steps:');
console.log('   1. Start the backend: cd backend && npm run dev');
console.log('   2. Start the frontend: cd frontend && npm run dev');
console.log('   3. Test the payment flow in your application');
console.log('\n💡 Note: These are test keys. For production, use live keys from Razorpay dashboard.');
