const mongoose = require('mongoose');
const User = require('../models/User');

console.log('🔍 Testing backend database connection...');

// Test the same connection string the server uses
const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp';
console.log(`📡 Connection string: ${connectionString}`);

mongoose.connect(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('✅ Connected to MongoDB');
  console.log(`🗄️  Database: ${mongoose.connection.name}`);
  
  // Test finding users
  console.log('\n🔍 Testing user queries...');
  
  try {
    // Test 1: Find all users
    const allUsers = await User.find({});
    console.log(`📊 Found ${allUsers.length} users total`);
    
    // Test 2: Find admin user
    const adminUser = await User.findOne({ email: 'admin@yatrik.com' });
    console.log(`👤 Admin user found: ${adminUser ? 'YES' : 'NO'}`);
    
    if (adminUser) {
      console.log(`   - ID: ${adminUser._id}`);
      console.log(`   - Email: ${adminUser.email}`);
      console.log(`   - Role: ${adminUser.role}`);
    }
    
    // Test 3: Find admin user with password
    const adminUserWithPassword = await User.findOne({ email: 'admin@yatrik.com' }).select('+password');
    console.log(`🔑 Admin user with password: ${adminUserWithPassword ? 'YES' : 'NO'}`);
    
    if (adminUserWithPassword && adminUserWithPassword.password) {
      console.log(`   - Password length: ${adminUserWithPassword.password.length}`);
      console.log(`   - Password hash: ${adminUserWithPassword.password.substring(0, 20)}...`);
    }
    
  } catch (error) {
    console.error('❌ Error during user queries:', error);
  }
  
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
})
.finally(() => {
  mongoose.connection.close();
  console.log('\n🔌 Connection closed');
});
