const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function fixAndTestVendorLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');
    console.log('✅ Connected to MongoDB\n');

    const email = 'vendor@yatrik.com';
    const password = 'vendor123';

    // Step 1: Check if vendor exists
    console.log('📋 Step 1: Checking vendor user...');
    let vendor = await User.findOne({ email: email }).select('+password');
    
    if (!vendor) {
      console.log('❌ Vendor user not found. Creating...');
      vendor = new User({
        name: 'Vendor Account',
        email: email,
        phone: '9876543210',
        password: password,
        role: 'vendor',
        status: 'active',
        authProvider: 'local'
      });
      await vendor.save();
      console.log('✅ Vendor user created');
    } else {
      console.log('✅ Vendor user exists');
      console.log('   ID:', vendor._id);
      console.log('   Email:', vendor.email);
      console.log('   Role:', vendor.role);
      console.log('   Status:', vendor.status);
      
      // Ensure role is vendor
      if (vendor.role !== 'vendor') {
        console.log('⚠️  Role is not "vendor", updating...');
        vendor.role = 'vendor';
        await vendor.save();
        console.log('✅ Role updated to "vendor"');
      }
      
      // Ensure status is active
      if (vendor.status !== 'active') {
        console.log('⚠️  Status is not "active", updating...');
        vendor.status = 'active';
        await vendor.save();
        console.log('✅ Status updated to "active"');
      }
      
      // Reset password to ensure it's correct
      console.log('\n🔐 Step 2: Verifying password...');
      const isMatch = await bcrypt.compare(password, vendor.password);
      if (!isMatch) {
        console.log('⚠️  Password doesn\'t match, resetting...');
        vendor.password = password; // Will be hashed by pre-save middleware
        await vendor.save();
        console.log('✅ Password reset');
        
        // Verify new password
        const updatedVendor = await User.findOne({ email: email }).select('+password');
        const newMatch = await bcrypt.compare(password, updatedVendor.password);
        console.log('   Password verification:', newMatch ? '✅ MATCH' : '❌ NO MATCH');
      } else {
        console.log('✅ Password is correct');
      }
    }

    // Step 3: Test login flow
    console.log('\n🧪 Step 3: Testing login flow...');
    const normalizedEmail = email.toLowerCase();
    const testUser = await User.findOne({ email: normalizedEmail }).select('+password').lean();
    
    if (!testUser) {
      console.log('❌ User lookup failed!');
      return;
    }
    
    console.log('✅ User found:', {
      email: testUser.email,
      role: testUser.role,
      status: testUser.status,
      hasPassword: !!testUser.password
    });
    
    // Test password
    const passwordMatch = await bcrypt.compare(password, testUser.password);
    console.log('   Password check:', passwordMatch ? '✅ MATCH' : '❌ NO MATCH');
    
    if (!passwordMatch) {
      console.log('❌ Password verification failed!');
      return;
    }
    
    // Generate token
    const token = jwt.sign(
      { 
        userId: testUser._id, 
        role: 'VENDOR', 
        name: testUser.name, 
        email: testUser.email 
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    
    console.log('✅ Token generated');
    console.log('\n📝 Login Credentials:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('   Role:', testUser.role);
    console.log('   Status:', testUser.status);
    console.log('   Redirect Path: /vendor');
    console.log('\n✅ Vendor login should work!');
    console.log('\n⚠️  IMPORTANT: Make sure the backend server is running and has been restarted!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixAndTestVendorLogin();

