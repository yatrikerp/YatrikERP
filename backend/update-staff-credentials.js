const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Driver = require('./models/Driver');
const Conductor = require('./models/Conductor');

async function updateStaffCredentials() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp';
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Connected to MongoDB successfully');

    const newPassword = 'Yatrik@123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    console.log('\n🔄 Starting credential update process...');
    console.log('📋 New format: {name}-conductor@yatrik.com / {name}-driver@yatrik.com');
    console.log('🔐 New password: Yatrik@123');

    // Update Drivers
    console.log('\n🚗 Updating Drivers...');
    const drivers = await Driver.find({}).select('_id name username email');
    console.log(`Found ${drivers.length} drivers to update`);

    let driverUpdateCount = 0;
    for (const driver of drivers) {
      try {
        // Create new email format: {name}-driver@yatrik.com
        const cleanName = driver.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const newEmail = `${cleanName}-driver@yatrik.com`;
        
        // Create new username format: {name}-driver
        const newUsername = `${cleanName}-driver`;

        await Driver.findByIdAndUpdate(driver._id, {
          email: newEmail,
          username: newUsername,
          password: hashedPassword,
          loginAttempts: 0,
          lockUntil: null
        });

        console.log(`✅ Updated driver: ${driver.name} -> ${newEmail} (${newUsername})`);
        driverUpdateCount++;
      } catch (error) {
        console.error(`❌ Error updating driver ${driver.name}:`, error.message);
      }
    }

    // Update Conductors
    console.log('\n🎫 Updating Conductors...');
    const conductors = await Conductor.find({}).select('_id name username email');
    console.log(`Found ${conductors.length} conductors to update`);

    let conductorUpdateCount = 0;
    for (const conductor of conductors) {
      try {
        // Create new email format: {name}-conductor@yatrik.com
        const cleanName = conductor.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const newEmail = `${cleanName}-conductor@yatrik.com`;
        
        // Create new username format: {name}-conductor
        const newUsername = `${cleanName}-conductor`;

        await Conductor.findByIdAndUpdate(conductor._id, {
          email: newEmail,
          username: newUsername,
          password: hashedPassword,
          loginAttempts: 0,
          lockUntil: null
        });

        console.log(`✅ Updated conductor: ${conductor.name} -> ${newEmail} (${newUsername})`);
        conductorUpdateCount++;
      } catch (error) {
        console.error(`❌ Error updating conductor ${conductor.name}:`, error.message);
      }
    }

    console.log('\n📊 Update Summary:');
    console.log(`✅ Drivers updated: ${driverUpdateCount}/${drivers.length}`);
    console.log(`✅ Conductors updated: ${conductorUpdateCount}/${conductors.length}`);
    console.log(`🔐 All passwords set to: Yatrik@123`);

    // Verify the updates
    console.log('\n🔍 Verifying updates...');
    
    const updatedDrivers = await Driver.find({}).select('name username email').limit(5);
    console.log('\n📋 Sample Updated Drivers:');
    updatedDrivers.forEach((driver, index) => {
      console.log(`${index + 1}. ${driver.name} -> ${driver.email} (${driver.username})`);
    });

    const updatedConductors = await Conductor.find({}).select('name username email').limit(5);
    console.log('\n📋 Sample Updated Conductors:');
    updatedConductors.forEach((conductor, index) => {
      console.log(`${index + 1}. ${conductor.name} -> ${conductor.email} (${conductor.username})`);
    });

    console.log('\n🎉 Credential update completed successfully!');
    console.log('\n📝 Login Instructions:');
    console.log('• Use the new email format: {name}-driver@yatrik.com or {name}-conductor@yatrik.com');
    console.log('• Use the new username format: {name}-driver or {name}-conductor');
    console.log('• Password for all: Yatrik@123');
    console.log('• Login via: /api/auth/login or /api/auth/role-login');

  } catch (error) {
    console.error('❌ Error during credential update:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the update
updateStaffCredentials();




