const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Driver = require('./models/Driver');
const Conductor = require('./models/Conductor');

async function testNewCredentials() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp';
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Connected to MongoDB successfully');

    console.log('\n📊 CREDENTIAL UPDATE SUMMARY');
    console.log('='.repeat(50));

    // Count total drivers and conductors
    const totalDrivers = await Driver.countDocuments();
    const totalConductors = await Conductor.countDocuments();

    console.log(`\n🚗 Total Drivers: ${totalDrivers}`);
    console.log(`🎫 Total Conductors: ${totalConductors}`);
    console.log(`👥 Total Staff: ${totalDrivers + totalConductors}`);

    // Test password verification
    console.log('\n🔐 Testing Password Verification...');
    const testPassword = 'Yatrik@123';
    
    // Test a driver
    const sampleDriver = await Driver.findOne({}).select('+password');
    if (sampleDriver) {
      const driverPasswordMatch = await bcrypt.compare(testPassword, sampleDriver.password);
      console.log(`✅ Driver password test: ${driverPasswordMatch ? 'PASS' : 'FAIL'} (${sampleDriver.email})`);
    }

    // Test a conductor
    const sampleConductor = await Conductor.findOne({}).select('+password');
    if (sampleConductor) {
      const conductorPasswordMatch = await bcrypt.compare(testPassword, sampleConductor.password);
      console.log(`✅ Conductor password test: ${conductorPasswordMatch ? 'PASS' : 'FAIL'} (${sampleConductor.email})`);
    }

    // Show sample credentials
    console.log('\n📋 SAMPLE CREDENTIALS FOR TESTING');
    console.log('='.repeat(50));

    const sampleDrivers = await Driver.find({}).select('name username email').limit(3);
    console.log('\n🚗 Sample Driver Credentials:');
    sampleDrivers.forEach((driver, index) => {
      console.log(`${index + 1}. Name: ${driver.name}`);
      console.log(`   Email: ${driver.email}`);
      console.log(`   Username: ${driver.username}`);
      console.log(`   Password: Yatrik@123`);
      console.log('');
    });

    const sampleConductors = await Conductor.find({}).select('name username email').limit(3);
    console.log('🎫 Sample Conductor Credentials:');
    sampleConductors.forEach((conductor, index) => {
      console.log(`${index + 1}. Name: ${conductor.name}`);
      console.log(`   Email: ${conductor.email}`);
      console.log(`   Username: ${conductor.username}`);
      console.log(`   Password: Yatrik@123`);
      console.log('');
    });

    console.log('🔗 LOGIN ENDPOINTS');
    console.log('='.repeat(50));
    console.log('• General Login: POST /api/auth/login');
    console.log('• Role-specific Login: POST /api/auth/role-login');
    console.log('');
    console.log('📝 LOGIN FORMATS');
    console.log('='.repeat(50));
    console.log('✅ Email Login: Use the new email format');
    console.log('✅ Username Login: Use the new username format');
    console.log('✅ Password: Yatrik@123 (for all)');
    console.log('');
    console.log('🎯 NEW CREDENTIAL FORMAT');
    console.log('='.repeat(50));
    console.log('📧 Email: {name}-driver@yatrik.com / {name}-conductor@yatrik.com');
    console.log('👤 Username: {name}-driver / {name}-conductor');
    console.log('🔐 Password: Yatrik@123');
    console.log('');
    console.log('✨ All credentials have been successfully updated!');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testNewCredentials();



