const mongoose = require('mongoose');
require('dotenv').config();

const Depot = require('../models/Depot');
const Bus = require('../models/Bus');
const Route = require('../models/Route');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik';

async function verifyKochiDepotData() {
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

    console.log(`✅ Depot: ${kochiDepot.depotName} (${kochiDepot.depotCode || kochiDepot.code})`);
    console.log(`   Depot ID: ${kochiDepot._id}\n`);

    // Count buses
    const totalBuses = await Bus.countDocuments({ depotId: kochiDepot._id });
    const activeBuses = await Bus.countDocuments({ depotId: kochiDepot._id, status: { $in: ['active', 'available', 'idle'] } });
    const maintenanceBuses = await Bus.countDocuments({ depotId: kochiDepot._id, status: 'maintenance' });
    
    console.log('🚌 Bus Statistics:');
    console.log(`   Total Buses: ${totalBuses}`);
    console.log(`   Active/Available: ${activeBuses}`);
    console.log(`   Maintenance: ${maintenanceBuses}\n`);

    // Count buses with routes
    const busesWithRoutes = await Bus.countDocuments({ 
      depotId: kochiDepot._id,
      'currentRoute.routeId': { $exists: true, $ne: null }
    });
    console.log(`   Buses with Routes: ${busesWithRoutes}\n`);

    // Count routes
    const routes = await Route.countDocuments({
      $or: [
        { 'depot.depotId': kochiDepot._id },
        { depotId: kochiDepot._id }
      ],
      status: 'active'
    });
    console.log(`🛣️  Active Routes: ${routes}\n`);

    // Show sample buses
    const sampleBuses = await Bus.find({ depotId: kochiDepot._id })
      .select('busNumber registrationNumber status currentRoute.routeName')
      .limit(5)
      .lean();
    
    console.log('📋 Sample Buses:');
    sampleBuses.forEach((bus, index) => {
      console.log(`   ${index + 1}. ${bus.busNumber || bus.registrationNumber} - Status: ${bus.status} - Route: ${bus.currentRoute?.routeName || 'None'}`);
    });

    console.log('\n✅ Data verification complete!');
    console.log('\n📝 To see updates in dashboard:');
    console.log('   1. Restart the backend server (if not already restarted)');
    console.log('   2. Refresh the browser page (Ctrl+F5 for hard refresh)');
    console.log('   3. Check browser console for API responses');
    console.log(`   4. Verify depot ID matches: ${kochiDepot._id}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

verifyKochiDepotData();
