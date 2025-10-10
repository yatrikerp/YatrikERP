const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Driver = require('./models/Driver');
const Depot = require('./models/Depot');
const bcrypt = require('bcryptjs');

async function setupDriverCredentials() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('✅ Connected to MongoDB');

    // Get all depots
    const depots = await Depot.find({ status: 'active' });
    console.log(`📋 Found ${depots.length} active depots`);

    if (depots.length === 0) {
      console.log('❌ No depots found. Please create depots first.');
      return;
    }

    // Display depot information
    console.log('\n📋 Available Depots:');
    depots.forEach((depot, index) => {
      console.log(`${index + 1}. ${depot.depotName || depot.name} (${depot.depotCode || depot.code}) - ID: ${depot._id}`);
    });

    // Create drivers for each depot
    for (const depot of depots) {
      const depotName = (depot.depotName || depot.name || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, '');
      
      console.log(`\n🚗 Setting up drivers for depot: ${depot.depotName || depot.name}`);
      
      // Check existing drivers for this depot
      const existingDrivers = await Driver.find({ depotId: depot._id });
      console.log(`   Found ${existingDrivers.length} existing drivers`);
      
      // Create 3 drivers for each depot
      for (let i = 1; i <= 3; i++) {
        // Generate unique driver number (3 digits)
        let driverNumber = String(i).padStart(3, '0');
        let driverEmail = `driver${driverNumber}@${depotName}-depot.com`;
        
        // Check if driver already exists and find unique number
        let existingDriver = await Driver.findOne({ email: driverEmail });
        let counter = i;
        while (existingDriver) {
          counter++;
          driverNumber = String(counter).padStart(3, '0');
          driverEmail = `driver${driverNumber}@${depotName}-depot.com`;
          existingDriver = await Driver.findOne({ email: driverEmail });
        }
        
        // Check if driverId already exists and find unique one
        let driverId = `DRV${driverNumber}`;
        let existingDriverId = await Driver.findOne({ driverId });
        while (existingDriverId) {
          counter++;
          driverNumber = String(counter).padStart(3, '0');
          driverId = `DRV${driverNumber}`;
          existingDriverId = await Driver.findOne({ driverId });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash('Yatrik123', 12);
        
        // Create driver data
        const driverData = {
          driverId: driverId,
          name: `Driver ${driverNumber}`,
          email: driverEmail,
          phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`, // Random 10-digit number
          depotId: depot._id,
          employeeCode: `EMP${driverNumber}`,
          username: `driver${driverNumber}`,
          password: hashedPassword,
          drivingLicense: {
            licenseNumber: `DL${driverNumber}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
            licenseType: 'LMV',
            issueDate: new Date(),
            expiryDate: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000), // 5 years from now
            issuingAuthority: 'RTO',
            status: 'valid'
          },
          status: 'active',
          createdBy: new mongoose.Types.ObjectId() // Dummy admin ID
        };
        
        // Create driver
        const driver = new Driver(driverData);
        await driver.save();
        
        console.log(`   ✅ Created driver: ${driverEmail} (Password: Yatrik123)`);
      }
    }

    // Display all created driver credentials
    console.log('\n📋 Driver Login Credentials:');
    console.log('=' .repeat(80));
    
    const allDrivers = await Driver.find({ status: 'active' }).populate('depotId', 'depotName depotCode');
    
    allDrivers.forEach((driver, index) => {
      console.log(`${index + 1}. Email: ${driver.email}`);
      console.log(`   Password: Yatrik123`);
      console.log(`   Name: ${driver.name}`);
      console.log(`   Depot: ${driver.depotId?.depotName || driver.depotId?.name} (${driver.depotId?.depotCode || driver.depotId?.code})`);
      console.log(`   Dashboard: http://localhost:5173/driver`);
      console.log('');
    });

    console.log('🎉 Driver credentials setup completed!');
    console.log('\n📝 Instructions:');
    console.log('1. Use any of the email addresses above with password "Yatrik123"');
    console.log('2. Login at: http://localhost:5173/login');
    console.log('3. You will be redirected to: http://localhost:5173/driver');
    console.log('4. The driver dashboard will show trip management and GPS tracking');

  } catch (error) {
    console.error('❌ Error setting up driver credentials:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the setup
setupDriverCredentials();
