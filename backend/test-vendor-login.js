const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testVendorLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');
    console.log('✅ Connected to MongoDB');

    const email = 'vendor@yatrik.com';
    const password = 'vendor123';
    
    // Simulate login flow
    const normalizedIdentifier = email.toLowerCase();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier);
    
    console.log('🔍 Testing login for:', email);
    console.log('Is email:', isEmail);
    
    // Find user
    let user = null;
    if (isEmail) {
      user = await User.findOne({ email: normalizedIdentifier }).select('+password').lean();
      console.log('User found:', user ? 'YES' : 'NO');
    }
    
    if (!user) {
      console.log('❌ User not found!');
      return;
    }
    
    console.log('✅ User found:', {
      id: user._id,
      email: user.email,
      role: user.role,
      status: user.status,
      hasPassword: !!user.password
    });
    
    // Check status
    if (user.status && user.status !== 'active') {
      console.log(`❌ Account is ${user.status}`);
      return;
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch ? '✅ YES' : '❌ NO');
    
    if (!isMatch) {
      console.log('❌ Invalid password');
      return;
    }
    
    console.log('✅ Login would succeed!');
    console.log('User role:', user.role);
    console.log('User status:', user.status);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testVendorLogin();

