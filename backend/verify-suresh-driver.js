const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Driver = require('./models/Driver');
const Depot = require('./models/Depot');
const bcrypt = require('bcryptjs');

async function verifySureshDriver() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('✅ Connected to MongoDB\n');

    // Get all depots
    const depots = await Depot.find({ status: 'active' });
    console.log(`📋 Found ${depots.length} active depots`);

    if (depots.length === 0) {
      console.log('❌ No depots found. Cannot create driver.');
      return;
    }

    const sureshDepot = depots[0];
    console.log(`🏢 Using depot: ${sureshDepot.depotName} (${sureshDepot.depotCode})\n`);

    // Driver credentials
    const driverEmail = 'suresh.driver@yatrik.com';
    const driverPassword = 'Yatrik@123';

    // Check if driver exists
    console.log(`🔍 Checking for driver with email: ${driverEmail}`);
    let driver = await Driver.findOne({ email: driverEmail });

    if (driver) {
      console.log(`✅ Driver found: ${driver.name}`);
      console.log(`   Email: ${driver.email}`);
      console.log(`   Username: ${driver.username}`);
      console.log(`   Status: ${driver.status}`);
      console.log(`   Depot: ${driver.depotId}`);
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(driverPassword, driver.password);
      console.log(`   Password valid: ${isPasswordValid}`);
      
      if (!isPasswordValid) {
        console.log('\n🔄 Updating password...');
        const hashedPassword = await bcrypt.hash(driverPassword, 12);
        driver.password = hashedPassword;
        await driver.save();
        console.log('✅ Password updated');
      }
    } else {
      console.log('❌ Driver not found. Creating new driver...\n');
      
      // Hash password
      const hashedPassword = await bcrypt.hash(driverPassword, 12);
      
      // Generate unique driver ID
      let driverId = 'DRVSURE';
      let counter = 1;
      while (await Driver.findOne({ driverId })) {
        counter++;
        driverId = `DRVSURE${String(counter).padStart(2, '0')}`;
      }
      
      // Create driver data
      const driverData = {
        driverId: driverId,
        name: 'Suresh Driver',
        email: driverEmail,
        phone: '+919876543210',
        depotId: sureshDepot._id,
        employeeCode: 'EMPSURE',
        username: 'suresh.driver',
        password: hashedPassword,
        drivingLicense: {
          licenseNumber: 'DL-KL-1234567890',
          licenseType: 'LMV',
          issueDate: new Date(),
          expiryDate: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
          issuingAuthority: 'RTO',
          status: 'valid'
        },
        status: 'active',
        createdBy: new mongoose.Types.ObjectId()
      };
      
      // Create driver
      driver = new Driver(driverData);
      await driver.save();
      
      console.log('✅ Driver created successfully!');
    }

    // Display credentials
    console.log('\n📋 Suresh Driver Login Credentials:');
    console.log('=' .repeat(80));
    console.log(`Email: ${driverEmail}`);
    console.log(`Password: ${driverPassword}`);
    console.log(`Username: ${driver.username}`);
    console.log(`Driver ID: ${driver.driverId}`);
    console.log(`Name: ${driver.name}`);
    console.log(`Depot: ${sureshDepot.depotName} (${sureshDepot.depotCode})`);
    console.log(`Status: ${driver.status}`);
    console.log('');

    console.log('🎉 Verification completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the verification
verifySureshDriver();
