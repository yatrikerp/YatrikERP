const mongoose = require('mongoose');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const fixTestUsers = async () => {
  try {
    console.log('Fixing test users with proper passwords...');

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
      // Find existing user
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`Fixing user ${userData.email}...`);
        
        // Update password and role
        existingUser.password = userData.password;
        existingUser.role = userData.role;
        existingUser.status = 'active';
        
        // Save to trigger password hashing middleware
        await existingUser.save();
        
        console.log(`Fixed user: ${userData.email} (${userData.role})`);
      } else {
        console.log(`User ${userData.email} not found, creating new...`);
        
        // Create new user with all required fields
        const user = new User({
          name: `${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)} User`,
          email: userData.email,
          phone: `123456789${Math.floor(Math.random() * 10)}`,
          password: userData.password,
          role: userData.role,
          status: 'active',
          authProvider: 'local'
        });
        
        await user.save();
        console.log(`Created user: ${userData.email} (${userData.role})`);
      }
    }

    // Verify passwords were set
    console.log('\nVerifying user passwords...');
    const users = await User.find({});
    for (const user of users) {
      const hasPassword = user.password && user.password.length > 0;
      console.log(`${user.email} (${user.role}): ${hasPassword ? 'HAS_PASSWORD' : 'NO_PASSWORD'}`);
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
fixTestUsers();
