const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Driver = require('./models/Driver');
const Conductor = require('./models/Conductor');
const Depot = require('./models/Depot');
const bcrypt = require('bcryptjs');

async function setupAllDriversAndConductors() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://yatrikerp:Yatrik123@cluster0.3qt2hfg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoUri, {
      dbName: 'yatrik-erp'
    });
    console.log('✅ Connected to MongoDB\n');

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
      
      // Create 5 drivers for each depot
      for (let i = 1; i <= 5; i++) {
        // Generate unique driver number (3 digits)
        let driverNumber = String(i).padStart(3, '0');
        
        // Generate driver email in format: driver001.driver@yatrik.com
        let driverName = `driver${driverNumber}`;
        let driverEmail = `${driverName}.driver@yatrik.com`;
        
        // Check if driver already exists
        let existingDriver = await Driver.findOne({ email: driverEmail });
        let counter = i;
        while (existingDriver) {
          counter++;
          driverNumber = String(counter).padStart(3, '0');
          const newName = `driver${driverNumber}`;
          const newEmail = `${newName}.driver@yatrik.com`;
          existingDriver = await Driver.findOne({ email: newEmail });
          driverName = newName;
          driverEmail = newEmail;
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

      // Create conductors for each depot
      console.log(`\n🎫 Setting up conductors for depot: ${depot.depotName || depot.name}`);
      
      // Check existing conductors for this depot
      const existingConductors = await Conductor.find({ depotId: depot._id });
      console.log(`   Found ${existingConductors.length} existing conductors`);
      
      // Create 5 conductors for each depot
      for (let i = 1; i <= 5; i++) {
        // Generate unique conductor number (3 digits)
        let conductorNumber = String(i).padStart(3, '0');
        
        // Generate conductor email in format: conductor001.conductor@yatrik.com
        let conductorName = `conductor${conductorNumber}`;
        let conductorEmail = `${conductorName}.conductor@yatrik.com`;
        
        // Check if conductor already exists
        let existingConductor = await Conductor.findOne({ email: conductorEmail });
        let counter = i;
        while (existingConductor) {
          counter++;
          conductorNumber = String(counter).padStart(3, '0');
          const newName = `conductor${conductorNumber}`;
          const newEmail = `${newName}.conductor@yatrik.com`;
          existingConductor = await Conductor.findOne({ email: newEmail });
          conductorName = newName;
          conductorEmail = newEmail;
        }
        
        // Check if conductorId already exists and find unique one
        let conductorId = `COND${conductorNumber}`;
        let existingConductorId = await Conductor.findOne({ conductorId });
        while (existingConductorId) {
          counter++;
          conductorNumber = String(counter).padStart(3, '0');
          conductorId = `COND${conductorNumber}`;
          existingConductorId = await Conductor.findOne({ conductorId });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash('Yatrik123', 12);
        
        // Create conductor data
        const conductorData = {
          conductorId: conductorId,
          name: `Conductor ${conductorNumber}`,
          email: conductorEmail,
          phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`, // Random 10-digit number
          depotId: depot._id,
          employeeCode: `EMP-COND-${conductorNumber}`,
          username: `conductor${conductorNumber}`,
          password: hashedPassword,
          status: 'active',
          createdBy: new mongoose.Types.ObjectId() // Dummy admin ID
        };
        
        // Create conductor
        const conductor = new Conductor(conductorData);
        await conductor.save();
        
        console.log(`   ✅ Created conductor: ${conductorEmail} (Password: Yatrik123)`);
      }
    }

    // Display all created credentials
    console.log('\n📋 Driver Login Credentials:');
    console.log('=' .repeat(100));
    
    const allDrivers = await Driver.find({ status: 'active' }).populate('depotId', 'depotName depotCode');
    
    allDrivers.forEach((driver, index) => {
      console.log(`${index + 1}. Email: ${driver.email}`);
      console.log(`   Password: Yatrik123`);
      console.log(`   Name: ${driver.name}`);
      console.log(`   Username: ${driver.username}`);
      console.log(`   Depot: ${driver.depotId?.depotName || driver.depotId?.name} (${driver.depotId?.depotCode || driver.depotId?.code})`);
      console.log('');
    });

    console.log('\n📋 Conductor Login Credentials:');
    console.log('=' .repeat(100));
    
    const allConductors = await Conductor.find({ status: 'active' }).populate('depotId', 'depotName depotCode');
    
    allConductors.forEach((conductor, index) => {
      console.log(`${index + 1}. Email: ${conductor.email}`);
      console.log(`   Password: Yatrik123`);
      console.log(`   Name: ${conductor.name}`);
      console.log(`   Username: ${conductor.username}`);
      console.log(`   Depot: ${conductor.depotId?.depotName || conductor.depotId?.name} (${conductor.depotId?.depotCode || conductor.depotId?.code})`);
      console.log('');
    });

    console.log('🎉 All drivers and conductors setup completed!');
    console.log('\n📝 Instructions:');
    console.log('1. Use any of the email addresses above with password "Yatrik123"');
    console.log('2. Drivers login at: http://localhost:3000/login');
    console.log('3. Conductors login at: http://localhost:3000/login');
    console.log('4. You will be redirected to respective dashboards');
    console.log(`\n📊 Summary:`);
    console.log(`   - Total Drivers: ${allDrivers.length}`);
    console.log(`   - Total Conductors: ${allConductors.length}`);
    console.log(`   - Total Accounts: ${allDrivers.length + allConductors.length}`);

  } catch (error) {
    console.error('❌ Error setting up credentials:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the setup
setupAllDriversAndConductors();
