const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

// Role-based email patterns
const ROLE_EMAIL_PATTERNS = {
  ADMIN: 'admin@yatrik.com',
  CONDUCTOR: '{Cname}-{depot}@yatrik.com',
  DRIVER: '{Dname}-{depot}@yatrik.com',
  DEPOT_MANAGER: '{place}-depot@yatrik.com',
  PASSENGER: '{name}@gmail.com'
};

// Sample users for each role
const SAMPLE_USERS = [
  // Admin
  {
    name: 'Admin Yatrik',
    email: 'admin@yatrik.com',
    password: 'Yatrik123',
    role: 'admin',
    phone: '9876543210'
  },
  
  // Depot Managers
  {
    name: 'Mumbai Depot Manager',
    email: 'mumbai-depot@yatrik.com',
    password: 'Depot123',
    role: 'depot_manager',
    phone: '9876543211',
    depot: 'Mumbai Central'
  },
  {
    name: 'Delhi Depot Manager',
    email: 'delhi-depot@yatrik.com',
    password: 'Depot123',
    role: 'depot_manager',
    phone: '9876543212',
    depot: 'Delhi Central'
  },
  
  // Conductors
  {
    name: 'Rajesh Kumar',
    email: 'rajesh-mumbai@yatrik.com',
    password: 'Conductor123',
    role: 'conductor',
    phone: '9876543213',
    depot: 'Mumbai Central'
  },
  {
    name: 'Amit Singh',
    email: 'amit-delhi@yatrik.com',
    password: 'Conductor123',
    role: 'conductor',
    phone: '9876543214',
    depot: 'Delhi Central'
  },
  
  // Drivers
  {
    name: 'Suresh Patel',
    email: 'suresh-mumbai@yatrik.com',
    password: 'Driver123',
    role: 'driver',
    phone: '9876543215',
    depot: 'Mumbai Central'
  },
  {
    name: 'Ramesh Kumar',
    email: 'ramesh-delhi@yatrik.com',
    password: 'Driver123',
    role: 'driver',
    phone: '9876543216',
    depot: 'Delhi Central'
  },
  
  // Passengers (Gmail pattern)
  {
    name: 'John Doe',
    email: 'john.doe@gmail.com',
    password: 'Passenger123',
    role: 'passenger',
    phone: '9876543217'
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@gmail.com',
    password: 'Passenger123',
    role: 'passenger',
    phone: '9876543218'
  }
];

async function setupRoleBasedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing users (optional - comment out if you want to keep existing users)
    // await User.deleteMany({});
    // console.log('🗑️  Cleared existing users');
    
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const userData of SAMPLE_USERS) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        
        if (existingUser) {
          // Update existing user
          const hashedPassword = await bcrypt.hash(userData.password, 12);
          await User.updateOne(
            { email: userData.email },
            { 
              $set: {
                name: userData.name,
                password: hashedPassword,
                role: userData.role,
                phone: userData.phone,
                ...(userData.depot && { depot: userData.depot })
              }
            }
          );
          updatedCount++;
          console.log(`🔄 Updated user: ${userData.email} (${userData.role})`);
        } else {
          // Create new user
          const hashedPassword = await bcrypt.hash(userData.password, 12);
          const newUser = new User({
            ...userData,
            password: hashedPassword
          });
          await newUser.save();
          createdCount++;
          console.log(`✅ Created user: ${userData.email} (${userData.role})`);
        }
      } catch (error) {
        console.error(`❌ Error processing user ${userData.email}:`, error.message);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Created: ${createdCount} users`);
    console.log(`🔄 Updated: ${updatedCount} users`);
    
    // Display all users with their roles
    console.log('\n👥 Current Users:');
    const allUsers = await User.find({}, 'name email role depot');
    allUsers.forEach(user => {
      console.log(`  ${user.role.padEnd(15)} | ${user.email.padEnd(30)} | ${user.name}`);
    });
    
    console.log('\n🎯 Role-Based Email Patterns:');
    Object.entries(ROLE_EMAIL_PATTERNS).forEach(([role, pattern]) => {
      console.log(`  ${role.padEnd(15)} | ${pattern}`);
    });
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the setup
setupRoleBasedUsers();
