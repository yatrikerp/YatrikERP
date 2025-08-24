const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const fixTestUsersDirect = async () => {
  try {
    console.log('Fixing test users with direct password updates...');

    // Test users with different roles
    const testUsers = [
      {
        email: 'admin@yatrik.com',
        password: 'admin123',
        role: 'admin'
      },
      {
        email: 'depot@yatrik.com',
        password: 'depot123',
        role: 'depot_manager'
      },
      {
        email: 'driver@yatrik.com',
        password: 'driver123',
        role: 'driver'
      },
      {
        email: 'conductor@yatrik.com',
        password: 'conductor123',
        role: 'conductor'
      },
      {
        email: 'passenger@yatrik.com',
        password: 'passenger123',
        role: 'passenger'
      }
    ];

    for (const userData of testUsers) {
      console.log(`Processing user ${userData.email}...`);
      
      // Hash password manually
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Update user directly in database
      const result = await User.updateOne(
        { email: userData.email },
        { 
          $set: { 
            password: hashedPassword,
            role: userData.role,
            status: 'active'
          }
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`Updated user: ${userData.email} (${userData.role})`);
      } else {
        console.log(`User not found or not modified: ${userData.email}`);
      }
    }

    // Verify passwords were set
    console.log('\nVerifying user passwords...');
    const users = await User.find({}).select('+password');
    for (const user of users) {
      const hasPassword = user.password && user.password.length > 0;
      console.log(`${user.email} (${user.role}): ${hasPassword ? 'HAS_PASSWORD' : 'NO_PASSWORD'}`);
      
      // Test password comparison
      if (hasPassword) {
        const testPassword = userData.password || 'test123';
        const isMatch = await bcrypt.compare(testPassword, user.password);
        console.log(`  Password test: ${isMatch ? 'MATCH' : 'NO_MATCH'}`);
      }
    }

    console.log('\nTest users fixed successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@yatrik.com / admin123');
    console.log('Depot Manager: depot@yatrik.com / depot123');
    console.log('Driver: driver@yatrik.com / driver123');
    console.log('Conductor: conductor@yatrik.com / conductor123');
    console.log('Passenger: passenger@yatrik.com / passenger123');

  } catch (error) {
    console.error('Error fixing test users:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
fixTestUsersDirect();
