const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createStateAuthorityUser() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ 
      email: 'stateadmin@yatrik.com'
    });

    if (existingUser) {
      // Update existing user
      existingUser.password = 'Yatrik123';
      existingUser.role = 'state_transport_authority';
      existingUser.status = 'active';
      existingUser.emailVerified = true;
      existingUser.phoneVerified = true;
      existingUser.profileCompleted = true;
      await existingUser.save();
      console.log('✅ Updated existing user with State Transport Authority role');
    } else {
      // Create State Transport Authority user
      const stateUser = new User({
        name: 'State Transport Authority',
        email: 'stateadmin@yatrik.com',
        phone: '9876543210',
        password: 'Yatrik123',
        role: 'state_transport_authority',
        status: 'active',
        emailVerified: true,
        phoneVerified: true,
        profileCompleted: true
      });
      await stateUser.save();
      console.log('✅ State Transport Authority user created successfully!');
    }

    console.log('\n📋 CREDENTIALS FOR STATE COMMAND DASHBOARD:');
    console.log('═'.repeat(50));
    console.log('Email:    stateadmin@yatrik.com');
    console.log('Password: Yatrik123');
    console.log('Role:     state_transport_authority');
    console.log('URL:      http://localhost:3000/state-command');
    console.log('═'.repeat(50));
    console.log('\n⚠️  IMPORTANT: Change password after first login!');
    console.log('💡 You can also create additional users via Admin Dashboard');
    console.log('   with role: state_transport_authority\n');

    // Also create a Super Admin user if it doesn't exist
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    if (!existingSuperAdmin) {
      const superAdmin = new User({
        name: 'System Super Admin',
        email: 'superadmin@yatrik.com',
        phone: '9876543211',
        password: 'SuperAdmin2024!',
        role: 'super_admin',
        status: 'active',
        emailVerified: true,
        phoneVerified: true,
        profileCompleted: true
      });
      await superAdmin.save();
      console.log('✅ Super Admin user also created:');
      console.log('   Email:    superadmin@yatrik.com');
      console.log('   Password: SuperAdmin2024!\n');
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error creating user:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createStateAuthorityUser();
