const mongoose = require('mongoose');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const Depot = require('../models/Depot');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const migrateBusRoutes = async () => {
  try {
    console.log('🚌 Starting bus route migration...');

    // 1. Get all routes with assigned buses
    const routes = await Route.find({ 'assignedBuses.0': { $exists: true } });
    console.log(`\n📋 Found ${routes.length} routes with assigned buses`);

    // 2. Get all buses
    const buses = await Bus.find({});
    console.log(`📋 Found ${buses.length} total buses`);

    // 3. Check which buses already have currentRoute
    const busesWithRoutes = buses.filter(bus => bus.currentRoute && bus.currentRoute.routeId);
    console.log(`📋 Found ${busesWithRoutes.length} buses with currentRoute already set`);

    // 4. Migrate route assignments
    let migratedCount = 0;
    let skippedCount = 0;

    for (const route of routes) {
      console.log(`\n🔍 Processing route: ${route.routeNumber} - ${route.routeName}`);
      
      if (!route.assignedBuses || route.assignedBuses.length === 0) {
        console.log(`  ⚠️  No assigned buses found`);
        continue;
      }

      for (const assignedBus of route.assignedBuses) {
        if (!assignedBus.busId) {
          console.log(`  ⚠️  Assigned bus missing busId`);
          continue;
        }

        // Find the actual bus
        const bus = await Bus.findById(assignedBus.busId);
        if (!bus) {
          console.log(`  ❌ Bus not found: ${assignedBus.busId}`);
          continue;
        }

        // Check if bus already has currentRoute
        if (bus.currentRoute && bus.currentRoute.routeId) {
          console.log(`  ✓ Bus ${bus.busNumber} already has route assigned: ${bus.currentRoute.routeNumber}`);
          skippedCount++;
          continue;
        }

        // Update bus with currentRoute
        await Bus.findByIdAndUpdate(bus._id, {
          $set: {
            currentRoute: {
              routeId: route._id,
              routeName: route.routeName,
              routeNumber: route.routeNumber,
              assignedAt: new Date(),
              assignedBy: route.createdBy || new mongoose.Types.ObjectId()
            },
            lastUpdated: new Date()
          }
        });

        console.log(`  ✅ Migrated bus ${bus.busNumber} to route ${route.routeNumber}`);
        migratedCount++;
      }
    }

    // 5. Summary
    console.log(`\n🎉 Migration completed!`);
    console.log(`📊 Summary:`);
    console.log(`- Routes processed: ${routes.length}`);
    console.log(`- Buses migrated: ${migratedCount}`);
    console.log(`- Buses skipped (already had routes): ${skippedCount}`);
    console.log(`- Total buses: ${buses.length}`);

    // 6. Verify migration
    console.log(`\n🔍 Verifying migration...`);
    const busesAfterMigration = await Bus.find({ 'currentRoute.routeId': { $exists: true } });
    console.log(`✅ ${busesAfterMigration.length} buses now have currentRoute assigned`);

    busesAfterMigration.forEach(bus => {
      console.log(`  - ${bus.busNumber}: ${bus.currentRoute.routeNumber} - ${bus.currentRoute.routeName}`);
    });

  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the migration
migrateBusRoutes();
