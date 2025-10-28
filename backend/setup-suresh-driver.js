const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Driver = require('./models/Driver');
const Depot = require('./models/Depot');
const bcrypt = require('bcryptjs');

async function setupSureshDriver() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('✅ Connected to MongoDB\n');

    // Get all depots to show available options
    const depots = await Depot.find({ status: 'active' });
    console.log('📋 Available Depots:');
    depots.forEach((depot, index) => {
      console.log(`${index + 1}. ${depot.depotName || depot.name} (${depot.depotCode || depot.code}) - ID: ${depot._id}`);
    });

    if (depots.length === 0) {
      console.log('❌ No depots found. Please create depots first.');
      return;
    }

    // Use the first depot (or you can specify which depot to use)
    const selectedDepot = depots[0];
    console.log(`\n🏢 Using depot: ${selectedDepot.depotName} (${selectedDepot.depotCode})\n`);

    // Driver credentials
    const driverEmail = 'suresh.driver@yatrik.com';
    const driverPassword = 'Yatrik@123';

    // Check if driver already exists
    const existingDriver = await Driver.findOne({ email: driverEmail });
    
    if (existingDriver) {
      console.log(`⚠️  Driver with email ${driverEmail} already exists.`);
      console.log('🔄 Updating existing driver...\n');
      
      // Update existing driver
      const hashedPassword = await bcrypt.hash(driverPassword, 12);
      
      existingDriver.name = 'Suresh Driver';
      existingDriver.password = hashedPassword;
      existingDriver.depotId = selectedDepot._id;
      existingDriver.status = 'active';
      existingDriver.lastLogin = null; // Reset last login
      existingDriver.loginAttempts = 0; // Reset login attempts
      
      if (!existingDriver.drivingLicense) {
        existingDriver.drivingLicense = {
          licenseNumber: `DLSU${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          licenseType: 'LMV',
          issueDate: new Date(),
          expiryDate: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
          issuingAuthority: 'RTO',
          status: 'valid'
        };
      }
      
      await existingDriver.save();
      console.log('✅ Driver credentials updated successfully!');
    } else {
      console.log(`🆕 Creating new driver: ${driverEmail}\n`);
      
      // Hash password
      const hashedPassword = await bcrypt.hash(driverPassword, 12);
      
      // Generate unique driver ID
      let driverId = 'DRV001';
      let counter = 1;
      while (await Driver.findOne({ driverId })) {
        counter++;
        driverId = `DRV${String(counter).padStart(3, '0')}`;
      }
      
      // Create driver data
      const driverData = {
        driverId: driverId,
        name: 'Suresh Driver',
        email: driverEmail,
        phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        depotId: selectedDepot._id,
        employeeCode: `EMP${String(counter).padStart(3, '0')}`,
        username: 'suresh.driver',
        password: hashedPassword,
        drivingLicense: {
          licenseNumber: `DLSU${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
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
      const driver = new Driver(driverData);
      await driver.save();
      
      console.log('✅ Driver created successfully!');
    }

    // Display driver credentials
    console.log('\n📋 Suresh Driver Login Credentials:');
    console.log('=' .repeat(80));
    console.log(`Email: ${driverEmail}`);
    console.log(`Password: ${driverPassword}`);
    console.log(`Name: Suresh Driver`);
    console.log(`Depot: ${selectedDepot.depotName} (${selectedDepot.depotCode})`);
    console.log(`Dashboard: http://localhost:3000/driver`);
    console.log('');

    console.log('🎉 Driver credentials setup completed!');
    console.log('\n📝 Login Instructions:');
    console.log('1. Use the email and password above to login');
    console.log('2. Login at: http://localhost:3000/login');
    console.log('3. You will be redirected to the driver dashboard');
    console.log('4. The driver will see trips assigned to their depot: ' + selectedDepot.depotCode);

  } catch (error) {
    console.error('❌ Error setting up driver credentials:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the setup
setupSureshDriver();
