const mongoose = require('mongoose');
const Driver = require('./models/Driver');
const Conductor = require('./models/Conductor');
const Depot = require('./models/Depot');

// Load environment variables
require('dotenv').config();

// Connect to MongoDB
const connectionUri = process.env.MONGODB_URI;

if (!connectionUri) {
  console.error('❌ MONGODB_URI environment variable is required. Please set it in your .env file.');
  process.exit(1);
}

console.log('📡 Connecting to Atlas MongoDB...');
console.log('🔗 Connection URI:', connectionUri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials

mongoose.connect(connectionUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

async function createDriversAndConductors() {
  try {
    console.log('🚀 Creating drivers and conductors for all depots...');
    
    // Get all active depots
    const depots = await Depot.find({ isActive: true });
    console.log(`📋 Found ${depots.length} active depots`);
    
    let totalDriversCreated = 0;
    let totalConductorsCreated = 0;
    
    for (const depot of depots) {
      console.log(`\n🏢 Processing depot: ${depot.depotName} (${depot.depotCode})`);
      
      // Check existing drivers and conductors for this depot
      const existingDrivers = await Driver.countDocuments({ depotId: depot._id });
      const existingConductors = await Conductor.countDocuments({ depotId: depot._id });
      
      console.log(`   📊 Existing: ${existingDrivers} drivers, ${existingConductors} conductors`);
      
      // Create drivers if needed (need at least 20 per depot)
      const driversNeeded = Math.max(0, 20 - existingDrivers);
      if (driversNeeded > 0) {
        console.log(`   👨‍✈️ Creating ${driversNeeded} drivers...`);
        
        const drivers = [];
        for (let i = 1; i <= driversNeeded; i++) {
          const driverNumber = String(existingDrivers + i).padStart(3, '0');
          const driverId = `${depot.depotCode}-DRV-${driverNumber}`;
          const employeeCode = `${depot.depotCode}${driverNumber}`;
          const username = `driver_${depot.depotCode.toLowerCase()}_${driverNumber}`;
          const phone = `9${Math.floor(Math.random() * 9000000000) + 1000000000}`;
          const email = `driver${driverNumber}@${depot.depotCode.toLowerCase()}-depot.com`;
          const licenseNumber = `DL${depot.depotCode}${driverNumber}${Date.now()}`;
          
          drivers.push({
            driverId: driverId,
            name: `${depot.depotCode} Driver ${driverNumber}`,
            phone: phone,
            email: email,
            employeeCode: employeeCode,
            depotId: depot._id,
            status: 'active',
            username: username,
            password: 'driver123', // Default password
            drivingLicense: {
              licenseNumber: licenseNumber,
              licenseType: 'HMV', // Heavy Motor Vehicle
              issueDate: new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000), // Random date within last 5 years
              expiryDate: new Date(Date.now() + Math.random() * 5 * 365 * 24 * 60 * 60 * 1000), // Random date within next 5 years
              issuingAuthority: 'RTO Kerala',
              status: 'valid'
            },
            experience: Math.floor(Math.random() * 15) + 1,
            salary: 25000 + Math.floor(Math.random() * 10000),
            address: {
              street: depot.location.address,
              city: depot.location.city,
              state: depot.location.state,
              pincode: depot.location.pincode
            },
            joiningDate: new Date(Date.now() - Math.random() * 2 * 365 * 24 * 60 * 60 * 1000), // Random date within last 2 years
            createdBy: depot.createdBy._id
          });
        }
        
        await Driver.insertMany(drivers);
        totalDriversCreated += driversNeeded;
        console.log(`   ✅ Created ${driversNeeded} drivers`);
      }
      
      // Create conductors if needed (need at least 20 per depot)
      const conductorsNeeded = Math.max(0, 20 - existingConductors);
      if (conductorsNeeded > 0) {
        console.log(`   🎫 Creating ${conductorsNeeded} conductors...`);
        
        const conductors = [];
        for (let i = 1; i <= conductorsNeeded; i++) {
          const conductorNumber = String(existingConductors + i).padStart(3, '0');
          const conductorId = `${depot.depotCode}-CON-${conductorNumber}`;
          const employeeCode = `${depot.depotCode}${conductorNumber}`;
          const username = `conductor_${depot.depotCode.toLowerCase()}_${conductorNumber}`;
          const phone = `9${Math.floor(Math.random() * 9000000000) + 1000000000}`;
          const email = `conductor${conductorNumber}@${depot.depotCode.toLowerCase()}-depot.com`;
          
          conductors.push({
            conductorId: conductorId,
            name: `${depot.depotCode} Conductor ${conductorNumber}`,
            phone: phone,
            email: email,
            employeeCode: employeeCode,
            depotId: depot._id,
            status: 'active',
            username: username,
            password: 'conductor123', // Default password
            experience: Math.floor(Math.random() * 10) + 1,
            salary: 20000 + Math.floor(Math.random() * 8000),
            address: {
              street: depot.location.address,
              city: depot.location.city,
              state: depot.location.state,
              pincode: depot.location.pincode
            },
            joiningDate: new Date(Date.now() - Math.random() * 2 * 365 * 24 * 60 * 60 * 1000), // Random date within last 2 years
            createdBy: depot.createdBy._id
          });
        }
        
        await Conductor.insertMany(conductors);
        totalConductorsCreated += conductorsNeeded;
        console.log(`   ✅ Created ${conductorsNeeded} conductors`);
      }
      
      if (driversNeeded === 0 && conductorsNeeded === 0) {
        console.log(`   ✅ Depot already has sufficient crew`);
      }
    }
    
    console.log(`\n🎉 Summary:`);
    console.log(`   👨‍✈️ Total drivers created: ${totalDriversCreated}`);
    console.log(`   🎫 Total conductors created: ${totalConductorsCreated}`);
    console.log(`   🏢 Depots processed: ${depots.length}`);
    
    console.log(`\n✅ All drivers and conductors created successfully!`);
    console.log(`🚀 You can now use the Bulk Trip Scheduler to generate trips.`);
    
  } catch (error) {
    console.error('❌ Error creating drivers and conductors:', error);
  } finally {
    mongoose.disconnect();
  }
}

createDriversAndConductors();
