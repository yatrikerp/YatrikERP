const mongoose = require('mongoose');
const Depot = require('../models/Depot');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const Driver = require('../models/Driver');
const Conductor = require('../models/Conductor');
const Duty = require('../models/Duty');
require('dotenv').config();

async function assignDataToKCHDepot() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrikerp_final', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Find KCH depot
    const kchDepot = await Depot.findOne({ $or: [{ depotCode: 'KCH' }, { code: 'KCH' }] });
    if (!kchDepot) {
      console.log('❌ KCH Depot not found. Please run createKCHDepot.js first.');
      process.exit(1);
    }
    console.log(`✅ Found KCH Depot: ${kchDepot.depotName} (${kchDepot._id})`);

    // 1. Assign buses to KCH depot
    console.log('\n🚌 Assigning buses to KCH depot...');
    const busesWithoutDepot = await Bus.find({ 
      $or: [{ depotId: null }, { depotId: { $exists: false } }] 
    }).limit(50);
    
    if (busesWithoutDepot.length > 0) {
      await Bus.updateMany(
        { _id: { $in: busesWithoutDepot.map(b => b._id) } },
        { $set: { depotId: kchDepot._id } }
      );
      console.log(`✅ Assigned ${busesWithoutDepot.length} buses to KCH depot`);
    } else {
      // Assign some existing buses to KCH
      const allBuses = await Bus.find({}).limit(30);
      if (allBuses.length > 0) {
        await Bus.updateMany(
          { _id: { $in: allBuses.map(b => b._id) } },
          { $set: { depotId: kchDepot._id } }
        );
        console.log(`✅ Assigned ${allBuses.length} buses to KCH depot`);
      }
    }

    // 2. Assign routes to KCH depot
    console.log('\n🛣️  Assigning routes to KCH depot...');
    const routesWithoutDepot = await Route.find({
      $or: [
        { 'depot.depotId': { $exists: false } },
        { 'depot.depotId': null },
        { depotId: { $exists: false } },
        { depotId: null }
      ]
    }).limit(50);

    if (routesWithoutDepot.length > 0) {
      for (const route of routesWithoutDepot) {
        if (route.depot) {
          route.depot.depotId = kchDepot._id;
          route.depot.depotName = kchDepot.depotName;
          route.depot.depotCode = kchDepot.depotCode;
        } else {
          route.depot = {
            depotId: kchDepot._id,
            depotName: kchDepot.depotName,
            depotCode: kchDepot.depotCode
          };
        }
        await route.save();
      }
      console.log(`✅ Assigned ${routesWithoutDepot.length} routes to KCH depot`);
    } else {
      // Assign some existing routes
      const allRoutes = await Route.find({}).limit(30);
      for (const route of allRoutes) {
        if (route.depot) {
          route.depot.depotId = kchDepot._id;
          route.depot.depotName = kchDepot.depotName;
          route.depot.depotCode = kchDepot.depotCode;
        } else {
          route.depot = {
            depotId: kchDepot._id,
            depotName: kchDepot.depotName,
            depotCode: kchDepot.depotCode
          };
        }
        await route.save();
      }
      console.log(`✅ Assigned ${allRoutes.length} routes to KCH depot`);
    }

    // 3. Assign drivers to KCH depot
    console.log('\n👨‍✈️  Assigning drivers to KCH depot...');
    const driversWithoutDepot = await Driver.find({
      $or: [{ depotId: null }, { depotId: { $exists: false } }]
    }).limit(30);

    if (driversWithoutDepot.length > 0) {
      await Driver.updateMany(
        { _id: { $in: driversWithoutDepot.map(d => d._id) } },
        { $set: { depotId: kchDepot._id } }
      );
      console.log(`✅ Assigned ${driversWithoutDepot.length} drivers to KCH depot`);
    } else {
      const allDrivers = await Driver.find({}).limit(20);
      if (allDrivers.length > 0) {
        await Driver.updateMany(
          { _id: { $in: allDrivers.map(d => d._id) } },
          { $set: { depotId: kchDepot._id } }
        );
        console.log(`✅ Assigned ${allDrivers.length} drivers to KCH depot`);
      }
    }

    // 4. Assign conductors to KCH depot
    console.log('\n👨‍💼 Assigning conductors to KCH depot...');
    const conductorsWithoutDepot = await Conductor.find({
      $or: [{ depotId: null }, { depotId: { $exists: false } }]
    }).limit(30);

    if (conductorsWithoutDepot.length > 0) {
      await Conductor.updateMany(
        { _id: { $in: conductorsWithoutDepot.map(c => c._id) } },
        { $set: { depotId: kchDepot._id } }
      );
      console.log(`✅ Assigned ${conductorsWithoutDepot.length} conductors to KCH depot`);
    } else {
      const allConductors = await Conductor.find({}).limit(20);
      if (allConductors.length > 0) {
        await Conductor.updateMany(
          { _id: { $in: allConductors.map(c => c._id) } },
          { $set: { depotId: kchDepot._id } }
        );
        console.log(`✅ Assigned ${allConductors.length} conductors to KCH depot`);
      }
    }

    // 5. Update trips to use KCH routes and buses
    console.log('\n🚍 Updating trips for KCH depot...');
    const kchRoutes = await Route.find({
      $or: [
        { 'depot.depotId': kchDepot._id },
        { depotId: kchDepot._id }
      ]
    });
    const kchRouteIds = kchRoutes.map(r => r._id);
    const kchBuses = await Bus.find({ depotId: kchDepot._id });
    const kchBusIds = kchBuses.map(b => b._id);

    if (kchRouteIds.length > 0) {
      // Update trips that use KCH routes
      const tripsUpdate = await Trip.updateMany(
        { routeId: { $in: kchRouteIds } },
        { $set: { depotId: kchDepot._id } }
      );
      console.log(`✅ Updated ${tripsUpdate.modifiedCount} trips to use KCH depot`);
    }

    // 6. Create some sample trips if none exist
    console.log('\n📅 Creating sample trips for KCH depot...');
    const existingTrips = await Trip.countDocuments({
      routeId: { $in: kchRouteIds }
    });

    if (existingTrips === 0 && kchRouteIds.length > 0 && kchBusIds.length > 0) {
      const kchDrivers = await Driver.find({ depotId: kchDepot._id }).limit(5);
      const kchConductors = await Conductor.find({ depotId: kchDepot._id }).limit(5);

      const today = new Date();
      const sampleTrips = [];

      for (let i = 0; i < Math.min(10, kchRouteIds.length); i++) {
        const route = kchRoutes[i];
        const bus = kchBuses[i % kchBuses.length];
        const driver = kchDrivers[i % kchDrivers.length];
        const conductor = kchConductors[i % kchConductors.length];

        if (route && bus && driver && conductor) {
          const tripDate = new Date(today);
          tripDate.setDate(tripDate.getDate() + i);

          sampleTrips.push({
            routeId: route._id,
            busId: bus._id,
            driverId: driver._id,
            conductorId: conductor._id,
            depotId: kchDepot._id,
            serviceDate: tripDate,
            startTime: '08:00',
            endTime: '12:00',
            fare: 500,
            capacity: bus.capacity?.total || 50,
            status: i < 3 ? 'scheduled' : 'pending',
            tripNumber: `KCH-${String(i + 1).padStart(4, '0')}`,
            createdAt: new Date()
          });
        }
      }

      if (sampleTrips.length > 0) {
        await Trip.insertMany(sampleTrips);
        console.log(`✅ Created ${sampleTrips.length} sample trips for KCH depot`);
      }
    }

    // 7. Create duty assignments
    console.log('\n📋 Creating duty assignments...');
    const kchTrips = await Trip.find({
      depotId: kchDepot._id,
      serviceDate: { $gte: new Date() }
    }).limit(10);

    const kchDuties = await Duty.find({ depotId: kchDepot._id }).countDocuments();
    
    if (kchDuties === 0 && kchTrips.length > 0) {
      const duties = kchTrips.map(trip => ({
        tripId: trip._id,
        driverId: trip.driverId,
        conductorId: trip.conductorId,
        busId: trip.busId,
        depotId: kchDepot._id,
        date: trip.serviceDate,
        status: 'assigned',
        assignedBy: null
      }));

      await Duty.insertMany(duties);
      console.log(`✅ Created ${duties.length} duty assignments`);
    }

    // Summary
    console.log('\n📊 KCH Depot Data Summary:');
    const busCount = await Bus.countDocuments({ depotId: kchDepot._id });
    const routeCount = await Route.countDocuments({
      $or: [
        { 'depot.depotId': kchDepot._id },
        { depotId: kchDepot._id }
      ]
    });
    const tripCount = await Trip.countDocuments({ depotId: kchDepot._id });
    const driverCount = await Driver.countDocuments({ depotId: kchDepot._id });
    const conductorCount = await Conductor.countDocuments({ depotId: kchDepot._id });
    const dutyCount = await Duty.countDocuments({ depotId: kchDepot._id });

    console.log(`   Buses: ${busCount}`);
    console.log(`   Routes: ${routeCount}`);
    console.log(`   Trips: ${tripCount}`);
    console.log(`   Drivers: ${driverCount}`);
    console.log(`   Conductors: ${conductorCount}`);
    console.log(`   Duty Assignments: ${dutyCount}`);

    console.log('\n✅ Data assignment complete!');
    console.log('\n📋 Login Credentials:');
    console.log('   Email: kch-depot@yatrik.com');
    console.log('   Password: KCH@2024');
    console.log('   Dashboard: http://localhost:3000/depot');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

assignDataToKCHDepot();
