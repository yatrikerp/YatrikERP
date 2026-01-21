const mongoose = require('mongoose');
require('dotenv').config();

const Depot = require('../models/Depot');
const Route = require('../models/Route');
const Bus = require('../models/Bus');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik';

async function linkKochiBusesToRoutes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find Kochi depot
    const kochiDepot = await Depot.findOne({ 
      $or: [
        { depotCode: 'KCH' },
        { depotCode: 'KOCHI' },
        { depotName: /kochi/i },
        { 'location.city': /kochi/i }
      ]
    }) || await Depot.findOne({ depotCode: 'DEP001' }) || await Depot.findOne({ status: 'active' });

    if (!kochiDepot) {
      console.log('❌ No depot found!');
      process.exit(1);
    }

    console.log(`✅ Using depot: ${kochiDepot.depotName} (${kochiDepot.depotCode || kochiDepot.code})\n`);

    // Get all active routes (use existing routes from admin)
    const allRoutes = await Route.find({ status: 'active' }).limit(10).lean();
    console.log(`📋 Found ${allRoutes.length} active routes in system\n`);

    // Update routes to link to Kochi depot
    const kochiRoutes = [];
    for (const route of allRoutes) {
      const routeObj = await Route.findById(route._id);
      if (routeObj) {
        // Update depot info if not set
        if (!routeObj.depot || !routeObj.depot.depotId) {
          routeObj.depot = {
            depotId: kochiDepot._id,
            depotName: kochiDepot.depotName,
            depotLocation: kochiDepot.location?.city || kochiDepot.location?.address || 'Kochi'
          };
          routeObj.depotId = kochiDepot._id;
          await routeObj.save();
        }
        kochiRoutes.push(routeObj);
        console.log(`  ✅ Route: ${routeObj.routeName || routeObj.routeNumber}`);
      }
    }

    // Get all buses for Kochi depot
    const kochiBuses = await Bus.find({ depotId: kochiDepot._id }).lean();
    console.log(`\n🚌 Found ${kochiBuses.length} buses for Kochi depot\n`);

    // Link buses to routes
    console.log('🔗 Linking buses to routes...\n');
    let linkedCount = 0;
    
    for (let i = 0; i < kochiBuses.length && kochiRoutes.length > 0; i++) {
      const bus = await Bus.findById(kochiBuses[i]._id);
      if (bus) {
        // Distribute buses across available routes
        const routeIndex = i % kochiRoutes.length;
        bus.currentRoute = {
          routeId: kochiRoutes[routeIndex]._id,
          routeName: kochiRoutes[routeIndex].routeName || kochiRoutes[routeIndex].routeNumber,
          routeNumber: kochiRoutes[routeIndex].routeNumber,
          assignedAt: new Date()
        };
        
        // Ensure bus has proper status
        if (!bus.status || bus.status === 'undefined') {
          bus.status = 'active';
        }
        
        await bus.save();
        linkedCount++;
        
        if (i < 10) { // Show first 10
          console.log(`  ✅ Linked bus ${bus.busNumber || bus.registrationNumber || bus._id} to route ${kochiRoutes[routeIndex].routeName || kochiRoutes[routeIndex].routeNumber}`);
        }
      }
    }

    if (linkedCount > 10) {
      console.log(`  ... and ${linkedCount - 10} more buses`);
    }

    // Verify final state (don't populate routeId if it doesn't exist in schema)
    const finalBuses = await Bus.find({ depotId: kochiDepot._id }).lean();
    
    const busesWithRoutes = finalBuses.filter(b => b.routeId).length;
    const activeBuses = finalBuses.filter(b => b.status === 'active' || b.status === 'available').length;

    console.log('\n✅ Bus-Route linking completed!');
    console.log('\n📊 Summary:');
    console.log(`   - Routes linked to depot: ${kochiRoutes.length}`);
    console.log(`   - Buses linked to routes: ${busesWithRoutes}`);
    console.log(`   - Total buses in depot: ${finalBuses.length}`);
    console.log(`   - Active buses: ${activeBuses}`);

    // Show route distribution
    if (kochiRoutes.length > 0) {
      console.log('\n🛣️  Route-Bus Distribution:');
      kochiRoutes.forEach((route, index) => {
        const routeBuses = finalBuses.filter(b => 
          b.currentRoute && b.currentRoute.routeId && 
          (b.currentRoute.routeId?.toString() === route._id.toString() || b.currentRoute.routeId === route._id.toString())
        ).length;
        console.log(`   ${index + 1}. ${route.routeName || route.routeNumber}: ${routeBuses} buses`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

linkKochiBusesToRoutes();
