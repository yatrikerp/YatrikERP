const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const createTestUsers = async () => {
  try {
    console.log('Creating test users...');

    // Test users with different roles
    const testUsers = [
      {
        name: 'Admin User',
        email: 'admin@yatrik.com',
        phone: '1234567890',
        password: 'admin123',
        role: 'admin',
        status: 'active'
      },
      {
        name: 'Depot Manager',
        email: 'depot@yatrik.com',
        phone: '1234567891',
        password: 'depot123',
        role: 'depot_manager',
        status: 'active'
      },
      {
        name: 'Driver User',
        email: 'driver@yatrik.com',
        phone: '1234567892',
        password: 'driver123',
        role: 'driver',
        status: 'active'
      },
      {
        name: 'Conductor User',
        email: 'conductor@yatrik.com',
        phone: '1234567893',
        password: 'conductor123',
        role: 'conductor',
        status: 'active'
      },
      {
        name: 'Passenger User',
        email: 'passenger@yatrik.com',
        phone: '1234567894',
        password: 'passenger123',
        role: 'passenger',
        status: 'active'
      }
    ];

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`User ${userData.email} already exists, updating...`);
        existingUser.name = userData.name;
        existingUser.phone = userData.phone;
        existingUser.role = userData.role;
        existingUser.status = userData.status;
        existingUser.password = userData.password;
        await existingUser.save();
        console.log(`Updated user: ${userData.email} (${userData.role})`);
      } else {
        // Create new user
        const user = new User(userData);
        await user.save();
        console.log(`Created user: ${userData.email} (${userData.role})`);
      }
    }

    console.log('\nTest users created successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@yatrik.com / admin123');
    console.log('Depot Manager: depot@yatrik.com / depot123');
    console.log('Driver: driver@yatrik.com / driver123');
    console.log('Conductor: conductor@yatrik.com / conductor123');
    console.log('Passenger: passenger@yatrik.com / passenger123');

  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
createTestUsers();
