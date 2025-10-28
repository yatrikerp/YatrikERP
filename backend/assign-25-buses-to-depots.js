require('dotenv').config();
const mongoose = require('mongoose');
const Bus = require('./models/Bus');
const Depot = require('./models/Depot');
const User = require('./models/User');

async function assign25BusesToDepots() {
  try {
    console.log('🚀 Starting bus assignment for all depots...\n');
    
    // Try different environment variable names
    const mongoUri = process.env.MONGODB_URI || 
                     process.env.DATABASE_URL || 
                     process.env.MONGO_URI ||
                     'mongodb://localhost:27017/yatrik-erp';
    
    console.log('📡 Attempting to connect to MongoDB...');
    console.log('🔗 URI format check:', mongoUri ? 'Found' : 'Not found');
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Get all active depots
    const depots = await Depot.find({ status: 'active' });
    console.log(`📋 Found ${depots.length} active depots\n`);

    if (depots.length === 0) {
      console.log('❌ No active depots found. Please create depots first.');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Get admin user for assignment
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('⚠️  No admin user found, creating one...');
      adminUser = await User.create({
        name: 'System Admin',
        email: 'admin@yatrik.com',
        password: 'admin123',
        role: 'admin'
      });
    }

    let totalBusesAdded = 0;

    for (const depot of depots) {
      console.log(`\n📦 Processing Depot: ${depot.depotName} (${depot.depotCode})`);
      
      // Count existing buses for this depot
      const existingBuses = await Bus.countDocuments({ depotId: depot._id });
      console.log(`   Current buses: ${existingBuses}`);
      
      const neededBuses = Math.max(0, 25 - existingBuses);
      console.log(`   Buses needed: ${neededBuses}`);
      
      if (neededBuses === 0) {
        console.log(`   ✅ Depot already has 25 buses`);
        continue;
      }
      
      // Create new buses
      console.log(`   Creating ${neededBuses} new buses...`);
      const newBuses = [];
      
      for (let i = 0; i < neededBuses; i++) {
        const busNumber = `${depot.depotCode}-BUS-${String(existingBuses + i + 1).padStart(3, '0')}`;
        const registrationNumber = `KL${Math.floor(Math.random() * 100)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${Math.floor(Math.random() * 10000)}`;
        
        const busData = {
          busNumber,
          registrationNumber,
          depotId: depot._id,
          busType: 'ordinary',
          capacity: { total: 45, sleeper: 0, seater: 45 },
          amenities: ['wifi', 'charging'],
          specifications: { 
            manufacturer: 'Tata', 
            model: 'Starbus', 
            year: 2022, 
            fuelType: 'diesel',
            mileage: 12,
            maxSpeed: 60,
            length: 11,
            width: 2.5,
            height: 3.2
          },
          status: 'active',
          fuel: {
            currentLevel: Math.floor(Math.random() * 40) + 60,
            lastRefuel: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            averageConsumption: 12,
            tankCapacity: 200
          },
          assignedBy: adminUser._id,
          notes: `Auto-assigned to ${depot.depotName}`
        };
        
        newBuses.push(busData);
      }
      
      // Insert buses
      const insertedBuses = await Bus.insertMany(newBuses);
      totalBusesAdded += insertedBuses.length;
      
      console.log(`   ✅ Created ${insertedBuses.length} buses for ${depot.depotName}`);
    }
    
    console.log(`\n✅ Bus assignment completed!`);
    console.log(`   Total buses created: ${totalBusesAdded}`);
    
    // Verify assignment
    console.log(`\n📊 Verification:`);
    for (const depot of depots) {
      const count = await Bus.countDocuments({ depotId: depot._id });
      console.log(`   ${depot.depotName} (${depot.depotCode}): ${count} buses`);
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error(err.stack);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

assign25BusesToDepots();
