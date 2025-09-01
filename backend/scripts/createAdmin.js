const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists:', {
        email: existingAdmin.email,
        role: existingAdmin.role,
        status: existingAdmin.status,
        id: existingAdmin._id
      });
      return;
    }

    // Create admin user with proper role
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const adminUser = new User({
      name: 'System Administrator',
      email: 'admin@yatrik.com',
      phone: '+91-9876543210',
      password: hashedPassword,
      role: 'admin', // Ensure this matches the enum in User model
      status: 'active',
      authProvider: 'local'
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@yatrik.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: admin');
    console.log('🆔 User ID:', adminUser._id);
    console.log('📊 Status:', adminUser.status);

    // Verify the user was created with correct role
    const verifyAdmin = await User.findById(adminUser._id);
    console.log('🔍 Verification - Created user:', {
      id: verifyAdmin._id,
      name: verifyAdmin.name,
      email: verifyAdmin.email,
      role: verifyAdmin.role,
      status: verifyAdmin.status
    });

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
createAdminUser();
