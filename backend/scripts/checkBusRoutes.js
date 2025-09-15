const mongoose = require('mongoose');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const checkBusRoutes = async () => {
  try {
    console.log('🔍 Checking bus route assignments...');

    // 1. Get all buses
    const buses = await Bus.find({});
    console.log(`\n📋 Total buses: ${buses.length}`);

    // 2. Check buses with currentRoute
    const busesWithRoutes = buses.filter(bus => bus.currentRoute && bus.currentRoute.routeId);
    console.log(`📋 Buses with currentRoute: ${busesWithRoutes.length}`);

    // 3. Check buses without currentRoute
    const busesWithoutRoutes = buses.filter(bus => !bus.currentRoute || !bus.currentRoute.routeId);
    console.log(`📋 Buses without currentRoute: ${busesWithoutRoutes.length}`);

    // 4. Get all routes with assigned buses
    const routes = await Route.find({ 'assignedBuses.0': { $exists: true } });
    console.log(`\n📋 Routes with assigned buses: ${routes.length}`);

    // 5. Show detailed information
    console.log(`\n🚌 Buses with currentRoute:`);
    busesWithRoutes.forEach(bus => {
      console.log(`  - ${bus.busNumber}: ${bus.currentRoute.routeNumber} - ${bus.currentRoute.routeName}`);
    });

    console.log(`\n🚌 Buses without currentRoute:`);
    busesWithoutRoutes.forEach(bus => {
      console.log(`  - ${bus.busNumber}: No route assigned`);
    });

    console.log(`\n🛣️  Routes with assigned buses:`);
    routes.forEach(route => {
      console.log(`  - ${route.routeNumber}: ${route.routeName}`);
      console.log(`    Assigned buses: ${route.assignedBuses.length}`);
      route.assignedBuses.forEach(assignedBus => {
        console.log(`      * ${assignedBus.busNumber || 'Unknown'} (${assignedBus.busId})`);
      });
    });

    // 6. Check for mismatches
    console.log(`\n🔍 Checking for mismatches...`);
    let mismatchCount = 0;

    for (const route of routes) {
      for (const assignedBus of route.assignedBuses) {
        if (!assignedBus.busId) continue;
        
        const bus = await Bus.findById(assignedBus.busId);
        if (!bus) {
          console.log(`  ❌ Route ${route.routeNumber} references non-existent bus: ${assignedBus.busId}`);
          mismatchCount++;
          continue;
        }

        if (!bus.currentRoute || bus.currentRoute.routeId.toString() !== route._id.toString()) {
          console.log(`  ⚠️  Bus ${bus.busNumber} is assigned to route ${route.routeNumber} but currentRoute is: ${bus.currentRoute?.routeNumber || 'None'}`);
          mismatchCount++;
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`- Total buses: ${buses.length}`);
    console.log(`- Buses with currentRoute: ${busesWithRoutes.length}`);
    console.log(`- Buses without currentRoute: ${busesWithoutRoutes.length}`);
    console.log(`- Routes with assigned buses: ${routes.length}`);
    console.log(`- Mismatches found: ${mismatchCount}`);

    if (mismatchCount > 0) {
      console.log(`\n💡 Recommendation: Run the migration script to fix mismatches`);
    }

  } catch (error) {
    console.error('❌ Error checking bus routes:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the check
checkBusRoutes();
