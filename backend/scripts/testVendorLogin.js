/**
 * Test Vendor Login
 * Run this to verify vendor login works
 */

const mongoose = require('mongoose');
const Vendor = require('../models/Vendor');
require('dotenv').config();

async function testVendorLogin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if vendor exists
    const vendor = await Vendor.findOne({ email: 'vendor@yatrik.com' }).select('+password');
    
    if (!vendor) {
      console.log('❌ Vendor not found!');
      console.log('💡 Run: node backend/scripts/createDemoUsers.js to create demo vendor\n');
      process.exit(1);
    }

    console.log('✅ Vendor found:');
    console.log('   Email:', vendor.email);
    console.log('   Company:', vendor.companyName);
    console.log('   Status:', vendor.status);
    console.log('   Has Password:', !!vendor.password);
    console.log('   Locked:', vendor.lockUntil && vendor.lockUntil > Date.now() ? 'YES' : 'NO');
    console.log('   Login Attempts:', vendor.loginAttempts || 0);
    console.log('');

    // Test password comparison
    console.log('🔐 Testing password comparison...');
    const testPassword = 'Vendor123';
    const isMatch = await vendor.comparePassword(testPassword);
    console.log('   Password Match:', isMatch ? '✅ YES' : '❌ NO');
    console.log('');

    if (isMatch && (vendor.status === 'approved' || vendor.status === 'active')) {
      console.log('✅ Vendor login should work!');
      console.log('   Email: vendor@yatrik.com');
      console.log('   Password: Vendor123');
      console.log('   Status:', vendor.status);
    } else {
      if (!isMatch) {
        console.log('❌ Password mismatch!');
      }
      if (vendor.status !== 'approved' && vendor.status !== 'active') {
        console.log('❌ Vendor status is:', vendor.status);
        console.log('   Status must be "approved" or "active"');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testVendorLogin();
