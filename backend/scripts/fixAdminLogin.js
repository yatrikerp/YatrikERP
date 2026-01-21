const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

async function fixAdminLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    let adminUser = await User.findOne({ 
      $or: [
        { email: 'admin@yatrik.com' },
        { role: 'admin' }
      ]
    }).select('+password');

    if (adminUser) {
      console.log('📋 Existing admin user found:', {
        email: adminUser.email,
        role: adminUser.role,
        status: adminUser.status,
        id: adminUser._id
      });

      // Update admin user to ensure correct settings
      adminUser.name = 'SystemAdministrator';
      adminUser.email = 'admin@yatrik.com';
      adminUser.role = 'admin';
      adminUser.roleType = 'internal';
      adminUser.status = 'active';
      adminUser.authProvider = 'local';
      adminUser.isActive = true;
      adminUser.profileCompleted = true;

      // Update password to Yatrik123 if needed
      let passwordNeedsUpdate = true;
      if (adminUser.password) {
        try {
          const passwordMatch = await bcrypt.compare('Yatrik123', adminUser.password);
          if (passwordMatch) {
            passwordNeedsUpdate = false;
          }
        } catch (compareError) {
          console.log('⚠️  Password comparison failed, will update password');
        }
      }
      
      if (passwordNeedsUpdate) {
        console.log('🔑 Updating admin password to Yatrik123...');
        adminUser.password = await bcrypt.hash('Yatrik123', 12);
      }

      await adminUser.save();
      console.log('✅ Admin user updated successfully!');
    } else {
      console.log('📋 Creating new admin user...');
      
      // Create admin user with proper role
      const hashedPassword = await bcrypt.hash('Yatrik123', 12);
      adminUser = new User({
        name: 'SystemAdministrator',
        email: 'admin@yatrik.com',
        phone: '+91-9876543210',
        password: hashedPassword,
        role: 'admin',
        roleType: 'internal',
        status: 'active',
        authProvider: 'local',
        isActive: true,
        profileCompleted: true
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully!');
    }

    // Verify the user was created/updated correctly (with password)
    const verifyAdmin = await User.findById(adminUser._id).select('+password');
    console.log('\n🔍 Verification - Admin User Details:');
    console.log({
      id: verifyAdmin._id,
      name: verifyAdmin.name,
      email: verifyAdmin.email,
      role: verifyAdmin.role,
      roleType: verifyAdmin.roleType,
      status: verifyAdmin.status,
      isActive: verifyAdmin.isActive,
      profileCompleted: verifyAdmin.profileCompleted,
      hasPassword: !!verifyAdmin.password
    });

    // Test password verification (only if password exists)
    if (verifyAdmin.password) {
      try {
        const testPassword = await bcrypt.compare('Yatrik123', verifyAdmin.password);
        console.log('\n🔑 Password Verification Test:');
        console.log('Password "Yatrik123" matches:', testPassword ? '✅ YES' : '❌ NO');
      } catch (pwdError) {
        console.log('\n⚠️  Password verification error:', pwdError.message);
      }
    } else {
      console.log('\n⚠️  Password not found - password needs to be set');
    }

    console.log('\n✅ Admin login setup complete!');
    console.log('\n📋 Login Credentials:');
    console.log('Email: admin@yatrik.com');
    console.log('Password: Yatrik123');
    console.log('Role: admin');
    console.log('Redirect: /admin');

  } catch (error) {
    console.error('❌ Error fixing admin login:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  fixAdminLogin();
}

module.exports = fixAdminLogin;
