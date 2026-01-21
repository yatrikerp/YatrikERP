const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function checkVendorUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');
    console.log('✅ Connected to MongoDB');

    // Find vendor user
    const vendor = await User.findOne({ email: 'vendor@yatrik.com' }).select('+password');
    
    if (!vendor) {
      console.log('❌ Vendor user not found!');
      return;
    }

    console.log('✅ Vendor user found:');
    console.log({
      id: vendor._id,
      name: vendor.name,
      email: vendor.email,
      role: vendor.role,
      status: vendor.status,
      hasPassword: !!vendor.password,
      passwordLength: vendor.password?.length
    });

    // Test password
    const testPassword = 'vendor123';
    const isMatch = await bcrypt.compare(testPassword, vendor.password);
    console.log(`\n🔐 Password test for "vendor123": ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);

    // If password doesn't match, update it
    if (!isMatch) {
      console.log('\n🔄 Updating vendor password...');
      vendor.password = 'vendor123'; // Will be hashed by pre-save middleware
      await vendor.save();
      console.log('✅ Password updated!');
      
      // Verify again
      const updatedVendor = await User.findOne({ email: 'vendor@yatrik.com' }).select('+password');
      const newMatch = await bcrypt.compare(testPassword, updatedVendor.password);
      console.log(`🔐 New password test: ${newMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkVendorUser();

