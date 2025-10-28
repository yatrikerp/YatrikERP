require('dotenv').config();
const mongoose = require('mongoose');
const Driver = require('./models/Driver');
const Conductor = require('./models/Conductor');
const Bus = require('./models/Bus');
const Depot = require('./models/Depot');

const MONGODB_URI = process.env.MONGODB_URI;

async function assignCrewToAllDepots() {
  try {
    console.log('🚀 Starting crew assignment for all depots...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all active depots
    const depots = await Depot.find({ status: 'active' });
    console.log(`📋 Found ${depots.length} active depots\n`);

    let totalBusesAssigned = 0;
    let totalDepotsProcessed = 0;

    for (const depot of depots) {
      console.log(`\n📦 Processing Depot: ${depot.depotName} (${depot.depotCode})`);
      console.log(`   Depot ID: ${depot._id}`);
      
      try {
        // Get all buses for this depot
        const buses = await Bus.find({ 
          depotId: depot._id, 
          status: { $in: ['active', 'idle', 'assigned'] } 
        });
        
        // Get drivers for this depot
        const drivers = await Driver.find({ 
          depotId: depot._id, 
          status: 'active'
        });
        
        // Get conductors for this depot
        const conductors = await Conductor.find({ 
          depotId: depot._id, 
          status: 'active'
        });
        
        console.log(`   📊 Found: ${buses.length} buses, ${drivers.length} drivers, ${conductors.length} conductors`);
        
        if (buses.length === 0) {
          console.log(`   ⚠️  No buses found for this depot`);
          continue;
        }
        
        if (drivers.length === 0 || conductors.length === 0) {
          console.log(`   ⚠️  Insufficient crew members (need at least 1 driver and 1 conductor)`);
          continue;
        }
        
        let depotBusesAssigned = 0;
        let driverIndex = 0;
        let conductorIndex = 0;
        
        for (const bus of buses) {
          try {
            // Check if bus already has crew assigned
            let needsDriver = !bus.assignedDriver;
            let needsConductor = !bus.assignedConductor;
            
            if (!needsDriver && !needsConductor) {
              console.log(`   ✓ Bus ${bus.busNumber} already has crew assigned`);
              continue;
            }
            
            // Assign driver if needed
            if (needsDriver && drivers.length > 0) {
              const driver = drivers[driverIndex % drivers.length];
              bus.assignedDriver = driver._id;
              driverIndex++;
            }
            
            // Assign conductor if needed
            if (needsConductor && conductors.length > 0) {
              const conductor = conductors[conductorIndex % conductors.length];
              bus.assignedConductor = conductor._id;
              conductorIndex++;
            }
            
            // Update bus status to assigned if it has both crew members
            if (bus.assignedDriver && bus.assignedConductor) {
              bus.status = 'assigned';
            }
            
            bus.lastUpdated = new Date();
            await bus.save();
            
            depotBusesAssigned++;
            totalBusesAssigned++;
            
          } catch (busError) {
            console.error(`   ❌ Error assigning crew to bus ${bus.busNumber}:`, busError.message);
          }
        }
        
        console.log(`   ✅ Assigned crew to ${depotBusesAssigned} buses in ${depot.depotName}`);
        totalDepotsProcessed++;
        
      } catch (depotError) {
        console.error(`   ❌ Error processing depot ${depot.depotName}:`, depotError.message);
      }
    }
    
    console.log(`\n✅ Crew assignment completed!`);
    console.log(`   Depots processed: ${totalDepotsProcessed}/${depots.length}`);
    console.log(`   Total buses assigned: ${totalBusesAssigned}`);
    
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

assignCrewToAllDepots();
