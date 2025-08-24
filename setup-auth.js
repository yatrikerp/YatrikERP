#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Setting up Yatrik ERP Authentication System...\n');

try {
  // Check if we're in the right directory
  if (!require('fs').existsSync('backend/package.json')) {
    console.error('❌ Please run this script from the project root directory');
    process.exit(1);
  }

  console.log('📦 Installing backend dependencies...');
  execSync('npm install', { cwd: 'backend', stdio: 'inherit' });

  console.log('\n📦 Installing frontend dependencies...');
  execSync('npm install', { cwd: 'frontend', stdio: 'inherit' });

  console.log('\n🗄️  Creating test users...');
  execSync('node scripts/createTestUsers.js', { cwd: 'backend', stdio: 'inherit' });

  console.log('\n✅ Setup completed successfully!');
  console.log('\n🔑 Test User Credentials:');
  console.log('   Admin: admin@yatrik.com / admin123');
  console.log('   Depot Manager: depot@yatrik.com / depot123');
  console.log('   Driver: driver@yatrik.com / driver123');
  console.log('   Conductor: conductor@yatrik.com / conductor123');
  console.log('   Passenger: passenger@yatrik.com / passenger123');
  
  console.log('\n🚀 To start the system:');
  console.log('   1. Start MongoDB');
  console.log('   2. Backend: cd backend && npm start');
  console.log('   3. Frontend: cd frontend && npm run dev');
  
  console.log('\n🌐 The system will be available at:');
  console.log('   Frontend: http://localhost:5173');
  console.log('   Backend: http://localhost:3001');

} catch (error) {
  console.error('\n❌ Setup failed:', error.message);
  process.exit(1);
}
