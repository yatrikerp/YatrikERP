const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function createVendorUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');
    console.log('✅ Connected to MongoDB');

    // Check if vendor already exists
    const existingVendor = await User.findOne({ 
      $or: [
        { email: 'vendor@yatrik.com' },
        { role: 'vendor' }
      ]
    });
    
    if (existingVendor) {
      console.log('⚠️ Vendor user already exists:', {
        email: existingVendor.email,
        role: existingVendor.role,
        status: existingVendor.status,
        id: existingVendor._id
      });
      
      // Update role to vendor if it's not already
      if (existingVendor.role !== 'vendor') {
        existingVendor.role = 'vendor';
        existingVendor.status = 'active';
        await existingVendor.save();
        console.log('✅ Updated existing user to vendor role');
      }
      
      return;
    }

    // Create vendor user
    const vendorUser = new User({
      name: 'Vendor Account',
      email: 'vendor@yatrik.com',
      phone: '9876543210',
      password: 'vendor123', // Will be hashed by pre-save middleware
      role: 'vendor',
      status: 'active',
      authProvider: 'local'
    });

    await vendorUser.save();
    console.log('✅ Vendor user created successfully!');
    console.log('📧 Email: vendor@yatrik.com');
    console.log('🔑 Password: vendor123');
    console.log('👤 Role: vendor');
    console.log('🆔 User ID:', vendorUser._id);
    console.log('📊 Status:', vendorUser.status);

    // Verify the user was created with correct role
    const verifyVendor = await User.findById(vendorUser._id);
    console.log('🔍 Verification - Created user:', {
      id: verifyVendor._id,
      name: verifyVendor.name,
      email: verifyVendor.email,
      role: verifyVendor.role,
      status: verifyVendor.status
    });

  } catch (error) {
    console.error('❌ Error creating vendor user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
createVendorUser();

