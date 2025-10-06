const mongoose = require('mongoose');
const Driver = require('./models/Driver');
const Conductor = require('./models/Conductor');
const Depot = require('./models/Depot');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://yatrik:yatrik123@cluster0.3qt2hfg.mongodb.net/yatrik-erp?retryWrites=true&w=majority&appName=Cluster0');

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
          drivers.push({
            name: `${depot.depotCode} Driver ${driverNumber}`,
            employeeId: `${depot.depotCode}-DRV-${driverNumber}`,
            licenseNumber: `DL${depot.depotCode}${driverNumber}${Date.now()}`,
            phone: `9${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            email: `driver${driverNumber}@${depot.depotCode.toLowerCase()}-depot.com`,
            depotId: depot._id,
            status: 'active',
            experience: Math.floor(Math.random() * 15) + 1,
            salary: 25000 + Math.floor(Math.random() * 10000),
            address: `${depot.location.address}, ${depot.location.city}`,
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
          conductors.push({
            name: `${depot.depotCode} Conductor ${conductorNumber}`,
            employeeId: `${depot.depotCode}-CON-${conductorNumber}`,
            phone: `9${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            email: `conductor${conductorNumber}@${depot.depotCode.toLowerCase()}-depot.com`,
            depotId: depot._id,
            status: 'active',
            experience: Math.floor(Math.random() * 10) + 1,
            salary: 20000 + Math.floor(Math.random() * 8000),
            address: `${depot.location.address}, ${depot.location.city}`,
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
