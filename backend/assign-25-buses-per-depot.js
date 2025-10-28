require('dotenv').config();
const mongoose = require('mongoose');
const Bus = require('./models/Bus');
const Depot = require('./models/Depot');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp';

async function assign25BusesPerDepot() {
  try {
    console.log('🚀 Starting bus assignment for all depots...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all active depots
    const depots = await Depot.find({ status: 'active' });
    console.log(`📋 Found ${depots.length} active depots\n`);

    // Get all unassigned buses
    const unassignedBuses = await Bus.find({ 
      depotId: { $exists: false } 
    });
    console.log(`🚌 Found ${unassignedBuses.length} unassigned buses\n`);

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

    let totalAssigned = 0;
    let busIndex = 0;

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
      
      let assignedThisDepot = 0;
      
      // Create new buses if needed
      for (let i = 0; i < neededBuses && busIndex < unassignedBuses.length; i++) {
        const bus = unassignedBuses[busIndex];
        
        try {
          // Assign bus to depot
          bus.depotId = depot._id;
          bus.status = 'active';
          bus.assignedBy = adminUser._id;
          bus.lastUpdated = new Date();
          
          await bus.save();
          
          assignedThisDepot++;
          totalAssigned++;
          busIndex++;
          
        } catch (busError) {
          console.error(`   ❌ Error assigning bus ${bus.busNumber}:`, busError.message);
        }
      }
      
      // If we still need buses and ran out of unassigned buses, create new ones
      const remainingNeeded = neededBuses - assignedThisDepot;
      if (remainingNeeded > 0) {
        console.log(`   Creating ${remainingNeeded} new buses...`);
        
        for (let i = 0; i < remainingNeeded; i++) {
          const busNumber = `${depot.depotCode}-BUS-${String(existingBuses + assignedThisDepot + i + 1).padStart(3, '0')}`;
          const registrationNumber = `KL${Math.floor(Math.random() * 100)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${Math.floor(Math.random() * 10000)}`;
          
          const newBus = new Bus({
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
              fuelType: 'diesel' 
            },
            status: 'active',
            assignedBy: adminUser._id,
            notes: `Auto-assigned to ${depot.depotName}`
          });
          
          await newBus.save();
          assignedThisDepot++;
          totalAssigned++;
          
          console.log(`   ✅ Created bus: ${busNumber}`);
        }
      }
      
      console.log(`   ✅ Assigned ${assignedThisDepot} buses to ${depot.depotName}`);
    }
    
    console.log(`\n✅ Bus assignment completed!`);
    console.log(`   Total buses assigned/created: ${totalAssigned}`);
    
    // Verify assignment
    console.log(`\n📊 Verification:`);
    for (const depot of depots) {
      const count = await Bus.countDocuments({ depotId: depot._id });
      console.log(`   ${depot.depotName}: ${count} buses`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

assign25BusesPerDepot();
