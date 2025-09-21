const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./backend/models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test user creation and login
const testLogin = async () => {
  try {
    await connectDB();
    
    // Check if test user exists
    let testUser = await User.findOne({ email: 'test@example.com' });
    
    if (!testUser) {
      console.log('📝 Creating test user...');
      testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        phone: '9876543210',
        password: 'password123', // Will be hashed by the model
        role: 'passenger',
        authProvider: 'local'
      });
      await testUser.save();
      console.log('✅ Test user created successfully');
    } else {
      console.log('👤 Test user already exists');
    }
    
    // Test password comparison
    console.log('🔐 Testing password comparison...');
    const isMatch = await testUser.comparePassword('password123');
    console.log('Password match result:', isMatch);
    
    // Test with wrong password
    const isWrongMatch = await testUser.comparePassword('wrongpassword');
    console.log('Wrong password match result:', isWrongMatch);
    
    // Show user details
    console.log('\n📋 User Details:');
    console.log('Name:', testUser.name);
    console.log('Email:', testUser.email);
    console.log('Role:', testUser.role);
    console.log('Status:', testUser.status);
    console.log('Auth Provider:', testUser.authProvider);
    console.log('Created:', testUser.createdAt);
    
    console.log('\n✅ Login test completed successfully!');
    console.log('\nYou can now test login with:');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the test
testLogin();
