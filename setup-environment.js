#!/usr/bin/env node

/**
 * Environment Setup Script for YATRIK ERP
 * This script helps set up the required environment files and test connections
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 YATRIK ERP Environment Setup');
console.log('================================\n');

// Environment configurations
const envConfigs = {
  root: {
    path: '.env',
    content: `# YATRIK ERP - Main Environment Configuration

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/yatrik_erp

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-${Date.now()}

# Session Configuration
SESSION_SECRET=your-session-secret-key-change-this-in-production-${Date.now()}

# Frontend Configuration
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# Email Configuration (Optional - for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Razorpay Configuration (Optional - for payments)
RAZORPAY_KEY_ID=rzp_test_your_razorpay_key_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_here

# Google OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Microsoft OAuth Configuration (Optional)
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret`
  },
  frontend: {
    path: 'frontend/.env',
    content: `# YATRIK ERP Frontend Environment Configuration

# API Configuration
REACT_APP_API_URL=http://localhost:5000

# Razorpay Configuration
REACT_APP_RAZORPAY_KEY=rzp_test_your_razorpay_key_here

# Backend URL for Vite proxy
BACKEND_URL=http://localhost:5000

# Development Configuration
PORT=5173`
  },
  backend: {
    path: 'backend/.env',
    content: `# YATRIK ERP Backend Environment Configuration

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/yatrik_erp

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-${Date.now()}

# Session Configuration
SESSION_SECRET=your-session-secret-key-change-this-in-production-${Date.now()}

# Frontend Configuration
FRONTEND_URL=http://localhost:5173

# Email Configuration (Optional - for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Razorpay Configuration (Optional - for payments)
RAZORPAY_KEY_ID=rzp_test_your_razorpay_key_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_here

# Google OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Microsoft OAuth Configuration (Optional)
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret`
  }
};

// Create environment files
function createEnvFiles() {
  console.log('📝 Creating environment files...\n');
  
  Object.entries(envConfigs).forEach(([name, config]) => {
    try {
      // Check if file already exists
      if (fs.existsSync(config.path)) {
        console.log(`⚠️  ${config.path} already exists. Skipping...`);
        return;
      }
      
      // Create directory if it doesn't exist
      const dir = path.dirname(config.path);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write the file
      fs.writeFileSync(config.path, config.content);
      console.log(`✅ Created ${config.path}`);
    } catch (error) {
      console.error(`❌ Failed to create ${config.path}:`, error.message);
    }
  });
  
  console.log('\n');
}

// Test MongoDB connection
async function testMongoConnection() {
  console.log('🔍 Testing MongoDB connection...');
  
  try {
    const mongoose = require('mongoose');
    const uri = 'mongodb://localhost:27017/yatrik_erp';
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ MongoDB connection successful');
    await mongoose.disconnect();
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
    console.log('💡 Make sure MongoDB is running on your system');
    console.log('   - Windows: net start MongoDB');
    console.log('   - macOS: brew services start mongodb-community');
    console.log('   - Linux: sudo systemctl start mongod');
  }
  
  console.log('\n');
}

// Test backend server
async function testBackendServer() {
  console.log('🔍 Testing backend server...');
  
  try {
    const http = require('http');
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET',
      timeout: 5000
    };
    
    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Backend server is running');
      } else {
        console.log(`⚠️  Backend server responded with status ${res.statusCode}`);
      }
    });
    
    req.on('error', (error) => {
      console.log('❌ Backend server is not running:', error.message);
      console.log('💡 Start the backend server with: cd backend && npm run dev');
    });
    
    req.on('timeout', () => {
      console.log('❌ Backend server connection timeout');
      req.destroy();
    });
    
    req.end();
  } catch (error) {
    console.log('❌ Failed to test backend server:', error.message);
  }
  
  console.log('\n');
}

// Main setup function
async function setup() {
  try {
    createEnvFiles();
    await testMongoConnection();
    await testBackendServer();
    
    console.log('🎉 Environment setup completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Make sure MongoDB is running');
    console.log('2. Start the backend server: cd backend && npm run dev');
    console.log('3. Start the frontend: cd frontend && npm start');
    console.log('4. Test the login functionality');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  setup();
}

module.exports = { setup, createEnvFiles, testMongoConnection, testBackendServer };

