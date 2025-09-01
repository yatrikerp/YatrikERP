const mongoose = require('mongoose');
const DepotUser = require('../models/DepotUser');
const Depot = require('../models/Depot');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  try {
    await testDepotAuth();
    console.log('✅ Depot authentication test completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Depot authentication test failed:', error);
    process.exit(1);
  }
});

async function testDepotAuth() {
  console.log('🔍 Testing depot authentication...');
  
  // Test 1: Check if depot user exists
  const depotUser = await DepotUser.findOne({ email: 'depot-plk@yatrik.com' });
  if (!depotUser) {
    throw new Error('Depot user not found. Please run: npm run create-depot-user');
  }
  console.log('✅ Depot user found:', depotUser.email);
  
  // Test 2: Check if depot exists
  const depot = await Depot.findById(depotUser.depotId);
  if (!depot) {
    throw new Error('Depot not found for user');
  }
  console.log('✅ Depot found:', depot.depotName);
  
  // Test 3: Test password authentication
  const testPassword = 'depot123';
  const isPasswordValid = await bcrypt.compare(testPassword, depotUser.password);
  if (!isPasswordValid) {
    throw new Error('Password authentication failed');
  }
  console.log('✅ Password authentication successful');
  
  // Test 4: Check user status
  if (depotUser.status !== 'active') {
    throw new Error(`User status is ${depotUser.status}, expected 'active'`);
  }
  console.log('✅ User status is active');
  
  // Test 5: Check required fields
  const requiredFields = ['_id', 'username', 'email', 'role', 'depotId', 'depotCode', 'depotName'];
  for (const field of requiredFields) {
    if (!depotUser[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  console.log('✅ All required fields present');
  
  console.log('\n📋 Login credentials for testing:');
  console.log('   Email: depot-plk@yatrik.com');
  console.log('   Password: depot123');
  console.log('   Expected role: depot_manager');
  console.log('   Expected redirect: /depot');
  
  console.log('\n🚀 Depot authentication is ready for testing!');
}
