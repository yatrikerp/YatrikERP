#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚌 Setting up YATRIK ERP...\n');

// Check if .env file exists in backend
const envPath = path.join(__dirname, 'backend', '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file in backend directory...');
  
  const envContent = `NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/yatrik-erp
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully');
  console.log('⚠️  Please update the JWT_SECRET and MONGODB_URI in backend/.env\n');
} else {
  console.log('✅ .env file already exists');
}

// Check if MongoDB is running
console.log('🔍 Checking MongoDB connection...');
try {
  execSync('mongosh --eval "db.runCommand(\'ping\')" --quiet', { stdio: 'ignore' });
  console.log('✅ MongoDB is running');
} catch (error) {
  console.log('❌ MongoDB is not running');
  console.log('💡 Please start MongoDB before running the application\n');
}

console.log('\n📦 Installing dependencies...');
try {
  execSync('npm run install-all', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.log('❌ Failed to install dependencies');
  console.log('💡 Try running "npm run install-all" manually');
}

console.log('\n🎉 Setup complete!');
console.log('\n🚀 To start the application:');
console.log('   npm run dev          # Start both frontend and backend');
console.log('   npm run server       # Start only backend');
console.log('   npm run client       # Start only frontend');
console.log('\n🌐 Frontend will be available at: http://localhost:3000');
console.log('🔧 Backend API will be available at: http://localhost:5000');
console.log('\n📚 Check README.md for more information');
