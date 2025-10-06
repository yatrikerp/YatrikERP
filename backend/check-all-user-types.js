const mongoose = require('mongoose');
require('dotenv').config();

async function checkAllUserTypes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const User = require('./backend/models/User');
    const DepotUser = require('./backend/models/DepotUser');
    const Driver = require('./backend/models/Driver');
    const Conductor = require('./backend/models/Conductor');
    
    console.log('\n🔍 CHECKING ALL USER TYPES IN DATABASE...\n');
    
    // Check regular users
    const users = await User.find({}).select('email role status');
    console.log(`👥 Regular Users: ${users.length}`);
    if (users.length > 0) {
      const roleCounts = {};
      users.forEach(user => {
        const role = user.role || 'unknown';
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      });
      console.log('   Role distribution:', roleCounts);
      
      // Show sample users
      users.slice(0, 5).forEach(user => {
        console.log(`   - ${user.email} (${user.role || 'no role'}) - ${user.status || 'active'}`);
      });
    }
    
    // Check depot users
    const depotUsers = await DepotUser.find({}).select('email role status');
    console.log(`\n🏢 Depot Users: ${depotUsers.length}`);
    if (depotUsers.length > 0) {
      const depotRoleCounts = {};
      depotUsers.forEach(user => {
        const role = user.role || 'unknown';
        depotRoleCounts[role] = (depotRoleCounts[role] || 0) + 1;
      });
      console.log('   Role distribution:', depotRoleCounts);
    }
    
    // Check drivers
    try {
      const drivers = await Driver.find({}).select('email role status');
      console.log(`\n🚗 Drivers: ${drivers.length}`);
      if (drivers.length > 0) {
        const driverRoleCounts = {};
        drivers.forEach(user => {
          const role = user.role || 'unknown';
          driverRoleCounts[role] = (driverRoleCounts[role] || 0) + 1;
        });
        console.log('   Role distribution:', driverRoleCounts);
        
        // Show sample drivers
        drivers.slice(0, 3).forEach(user => {
          console.log(`   - ${user.email || 'no email'} (${user.role || 'driver'}) - ${user.status || 'active'}`);
        });
      }
    } catch (error) {
      console.log(`\n🚗 Drivers: Error - ${error.message}`);
    }
    
    // Check conductors
    try {
      const conductors = await Conductor.find({}).select('email role status');
      console.log(`\n🎫 Conductors: ${conductors.length}`);
      if (conductors.length > 0) {
        const conductorRoleCounts = {};
        conductors.forEach(user => {
          const role = user.role || 'unknown';
          conductorRoleCounts[role] = (conductorRoleCounts[role] || 0) + 1;
        });
        console.log('   Role distribution:', conductorRoleCounts);
        
        // Show sample conductors
        conductors.slice(0, 3).forEach(user => {
          console.log(`   - ${user.email || 'no email'} (${user.role || 'conductor'}) - ${user.status || 'active'}`);
        });
      }
    } catch (error) {
      console.log(`\n🎫 Conductors: Error - ${error.message}`);
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Total Users: ${users.length + depotUsers.length}`);
    console.log(`- Regular Users: ${users.length}`);
    console.log(`- Depot Users: ${depotUsers.length}`);
    
    console.log('\n🎯 AUTHENTICATION ENDPOINTS NEEDED:');
    console.log('='.repeat(50));
    console.log('✅ /api/auth/login - For regular users (admin, passenger)');
    console.log('✅ /api/depot-auth/login - For depot users');
    console.log('❓ /api/driver/login - For drivers (if separate model)');
    console.log('❓ /api/conductor/login - For conductors (if separate model)');
    
    console.log('\n💡 RECOMMENDATION:');
    console.log('='.repeat(50));
    console.log('1. All users should use /api/auth/login endpoint');
    console.log('2. Depot users can use /api/depot-auth/login as alternative');
    console.log('3. Ensure all user types have proper email and role fields');
    console.log('4. Update Auth.js to handle all user types correctly');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkAllUserTypes();
