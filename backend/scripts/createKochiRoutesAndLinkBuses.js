const mongoose = require('mongoose');
require('dotenv').config();

const Depot = require('../models/Depot');
const Route = require('../models/Route');
const Bus = require('../models/Bus');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik';

async function createKochiRoutesAndLinkBuses() {
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

    // Find existing routes or create minimal routes
    const User = require('../models/User');
    const adminUser = await User.findOne({ role: 'admin' }) || await User.findOne();
    
    // Try to find existing routes first
    let existingRoutes = await Route.find({
      $or: [
        { routeName: /kochi/i },
        { origin: /kochi/i },
        { startingPoint: { $regex: /kochi/i } },
        { 'depot.depotId': kochiDepot._id }
      ]
    }).limit(5).lean();

    // If no routes found, find any active routes
    if (existingRoutes.length === 0) {
      existingRoutes = await Route.find({ status: 'active' }).limit(5).lean();
    }

    console.log(`📋 Found ${existingRoutes.length} existing routes\n`);

    // Update existing routes to link to Kochi depot
    const createdRoutes = [];
    for (const route of existingRoutes) {
      const routeObj = await Route.findById(route._id);
      if (routeObj) {
        routeObj.depot = {
          depotId: kochiDepot._id,
          depotName: kochiDepot.depotName,
          depotLocation: kochiDepot.location?.city || kochiDepot.location?.address || 'Kochi'
        };
        routeObj.depotId = kochiDepot._id;
        routeObj.status = 'active';
        await routeObj.save();
        createdRoutes.push(routeObj);
        console.log(`  ✅ Updated route: ${routeObj.routeName || routeObj.routeNumber}`);
      }
    }

    // If still no routes, create minimal routes with all required fields
    if (createdRoutes.length === 0 && adminUser) {
      console.log('📋 Creating new routes for Kochi depot...\n');
      
      const routes = [
        {
          routeNumber: 'KCH-TVM-001',
          routeName: 'Kochi - Trivandrum',
          startingPoint: {
            city: 'Kochi',
            location: 'Kochi Bus Stand'
          },
          endingPoint: {
            city: 'Trivandrum',
            location: 'Trivandrum Central'
          },
          totalDistance: 220,
          estimatedDuration: 240,
          depot: {
            depotId: kochiDepot._id,
            depotName: kochiDepot.depotName,
            depotLocation: kochiDepot.location?.city || 'Kochi'
          },
          baseFare: 350,
          farePerKm: 1.5,
          status: 'active',
          createdBy: adminUser._id,
          stops: [],
          intermediateStops: []
        },
      {
        routeName: 'Kochi - Bangalore',
        routeNumber: 'KCH-BLR-001',
        origin: 'Kochi',
        destination: 'Bangalore',
        startingPoint: 'Kochi Bus Stand',
        endingPoint: 'Bangalore Central',
        distance: 560,
        duration: 600,
        depot: { depotId: kochiDepot._id, depotName: kochiDepot.depotName },
        depotId: kochiDepot._id,
        status: 'active',
        fare: { base: 800, ac: 1200, sleeper: 1500 }
      },
      {
        routeName: 'Kochi - Chennai',
        routeNumber: 'KCH-MAA-001',
        origin: 'Kochi',
        destination: 'Chennai',
        startingPoint: 'Kochi Bus Stand',
        endingPoint: 'Chennai Central',
        distance: 690,
        duration: 720,
        depot: { depotId: kochiDepot._id, depotName: kochiDepot.depotName },
        depotId: kochiDepot._id,
        status: 'active',
        fare: { base: 1000, ac: 1500, sleeper: 1800 }
      },
      {
        routeName: 'Kochi - Calicut',
        routeNumber: 'KCH-CLT-001',
        origin: 'Kochi',
        destination: 'Calicut',
        startingPoint: 'Kochi Bus Stand',
        endingPoint: 'Calicut Bus Stand',
        distance: 180,
        duration: 210,
        depot: { depotId: kochiDepot._id, depotName: kochiDepot.depotName },
        depotId: kochiDepot._id,
        status: 'active',
        fare: { base: 250, ac: 400, sleeper: 500 }
      },
      {
        routeName: 'Kochi - Mysore',
        routeNumber: 'KCH-MYS-001',
        origin: 'Kochi',
        destination: 'Mysore',
        startingPoint: 'Kochi Bus Stand',
        endingPoint: 'Mysore Bus Stand',
        distance: 480,
        duration: 540,
        depot: { depotId: kochiDepot._id, depotName: kochiDepot.depotName },
        depotId: kochiDepot._id,
        status: 'active',
        fare: { base: 650, ac: 950, sleeper: 1200 }
      }
    ];

    console.log('📋 Creating/updating routes...\n');
    const createdRoutes = [];
    
    for (const routeData of routes) {
      const existing = await Route.findOne({ routeNumber: routeData.routeNumber });
      if (!existing) {
        const route = await Route.create(routeData);
        createdRoutes.push(route);
        console.log(`  ✅ Created route: ${route.routeName}`);
      } else {
        // Update existing route
        existing.depot = { depotId: kochiDepot._id, depotName: kochiDepot.depotName };
        existing.depotId = kochiDepot._id;
        existing.status = 'active';
        await existing.save();
        createdRoutes.push(existing);
        console.log(`  ✅ Updated route: ${existing.routeName}`);
      }
    }

    // Get all buses for Kochi depot
    const kochiBuses = await Bus.find({ depotId: kochiDepot._id }).lean();
    console.log(`\n🚌 Found ${kochiBuses.length} buses for Kochi depot\n`);

    // Assign routes to buses
    console.log('🔗 Linking buses to routes...\n');
    let linkedCount = 0;
    
    for (let i = 0; i < kochiBuses.length; i++) {
      const bus = await Bus.findById(kochiBuses[i]._id);
      if (bus && createdRoutes.length > 0) {
        // Distribute buses across routes
        const routeIndex = i % createdRoutes.length;
        bus.routeId = createdRoutes[routeIndex]._id;
        
        // Ensure bus has proper status
        if (!bus.status || bus.status === 'undefined') {
          bus.status = 'active';
        }
        
        await bus.save();
        linkedCount++;
        
        if (i < 10) { // Show first 10
          console.log(`  ✅ Linked bus ${bus.busNumber || bus.registrationNumber || bus._id} to route ${createdRoutes[routeIndex].routeName}`);
        }
      }
    }

    if (linkedCount > 10) {
      console.log(`  ... and ${linkedCount - 10} more buses`);
    }

    console.log('\n✅ Route creation and bus linking completed!');
    console.log('\n📊 Summary:');
    console.log(`   - Routes created/updated: ${createdRoutes.length}`);
    console.log(`   - Buses linked to routes: ${linkedCount}`);
    console.log(`   - Total buses in depot: ${kochiBuses.length}`);

    // Show route details
    console.log('\n🛣️  Route Details:');
    createdRoutes.forEach((route, index) => {
      const routeBuses = kochiBuses.filter(b => b.routeId?.toString() === route._id.toString()).length;
      console.log(`   ${index + 1}. ${route.routeName} (${route.routeNumber}) - ${route.distance}km - ${routeBuses} buses assigned`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

createKochiRoutesAndLinkBuses();
