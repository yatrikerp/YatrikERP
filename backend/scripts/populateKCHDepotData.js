const mongoose = require('mongoose');
const Depot = require('../models/Depot');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const Driver = require('../models/Driver');
const Conductor = require('../models/Conductor');
const Duty = require('../models/Duty');
require('dotenv').config();

async function populateKCHDepotData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrikerp_final', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Find or create KCH depot
    let kchDepot = await Depot.findOne({ $or: [{ depotCode: 'KCH' }, { code: 'KCH' }] });
    if (!kchDepot) {
      kchDepot = new Depot({
        depotName: 'Kochi Central Depot',
        depotCode: 'KCH',
        code: 'KCH',
        location: 'Kochi, Kerala',
        address: 'Kochi Central Bus Station, Ernakulam',
        contact: '+91-484-1234567',
        email: 'kch-depot@yatrik.com',
        manager: 'Kochi Depot Manager',
        capacity: 150,
        operationalHours: {
          start: '05:00',
          end: '23:00'
        },
        established: new Date('2020-01-01'),
        status: 'active'
      });
      await kchDepot.save();
      console.log('✅ Created KCH Depot');
    }
    console.log(`📋 Using KCH Depot: ${kchDepot.depotName} (${kchDepot._id})\n`);

    // 1. Get or create buses
    console.log('🚌 Assigning buses...');
    let buses = await Bus.find({ depotId: kchDepot._id }).limit(50);
    
    if (buses.length === 0) {
      // Get any buses without depot
      buses = await Bus.find({ 
        $or: [{ depotId: null }, { depotId: { $exists: false } }] 
      }).limit(30);
      
      if (buses.length === 0) {
        // Get any buses
        buses = await Bus.find({}).limit(30);
      }
      
      if (buses.length > 0) {
        await Bus.updateMany(
          { _id: { $in: buses.map(b => b._id) } },
          { $set: { depotId: kchDepot._id } }
        );
        console.log(`✅ Assigned ${buses.length} buses to KCH depot`);
      }
    } else {
      console.log(`✅ Found ${buses.length} buses already assigned`);
    }

    // 2. Get or create routes
    console.log('\n🛣️  Assigning routes...');
    let routes = await Route.find({
      $or: [
        { 'depot.depotId': kchDepot._id },
        { depotId: kchDepot._id }
      ]
    }).limit(50);

    if (routes.length === 0) {
      // Get routes without depot
      routes = await Route.find({
        $or: [
          { 'depot.depotId': { $exists: false } },
          { 'depot.depotId': null },
          { depotId: { $exists: false } },
          { depotId: null }
        ]
      }).limit(30);

      if (routes.length === 0) {
        routes = await Route.find({}).limit(30);
      }

      if (routes.length > 0) {
        for (const route of routes) {
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
        console.log(`✅ Assigned ${routes.length} routes to KCH depot`);
      }
    } else {
      console.log(`✅ Found ${routes.length} routes already assigned`);
    }

    // 3. Get or create drivers
    console.log('\n👨‍✈️  Assigning drivers...');
    let drivers = await Driver.find({ depotId: kchDepot._id }).limit(30);
    
    if (drivers.length === 0) {
      drivers = await Driver.find({
        $or: [{ depotId: null }, { depotId: { $exists: false } }]
      }).limit(20);

      if (drivers.length === 0) {
        drivers = await Driver.find({}).limit(20);
      }

      if (drivers.length > 0) {
        await Driver.updateMany(
          { _id: { $in: drivers.map(d => d._id) } },
          { $set: { depotId: kchDepot._id } }
        );
        console.log(`✅ Assigned ${drivers.length} drivers to KCH depot`);
      }
    } else {
      console.log(`✅ Found ${drivers.length} drivers already assigned`);
    }

    // 4. Get or create conductors
    console.log('\n👨‍💼 Assigning conductors...');
    let conductors = await Conductor.find({ depotId: kchDepot._id }).limit(30);
    
    if (conductors.length === 0) {
      conductors = await Conductor.find({
        $or: [{ depotId: null }, { depotId: { $exists: false } }]
      }).limit(20);

      if (conductors.length === 0) {
        conductors = await Conductor.find({}).limit(20);
      }

      if (conductors.length > 0) {
        await Conductor.updateMany(
          { _id: { $in: conductors.map(c => c._id) } },
          { $set: { depotId: kchDepot._id } }
        );
        console.log(`✅ Assigned ${conductors.length} conductors to KCH depot`);
      }
    } else {
      console.log(`✅ Found ${conductors.length} conductors already assigned`);
    }

    // 5. Create trips if none exist
    console.log('\n🚍 Creating trips...');
    const routeIds = routes.map(r => r._id);
    const busIds = buses.map(b => b._id);
    const driverIds = drivers.map(d => d._id);
    const conductorIds = conductors.map(c => c._id);

    const existingTrips = await Trip.countDocuments({ depotId: kchDepot._id });
    
    if (existingTrips === 0 && routeIds.length > 0 && busIds.length > 0 && driverIds.length > 0 && conductorIds.length > 0) {
      const today = new Date();
      const sampleTrips = [];

      for (let i = 0; i < Math.min(15, routeIds.length); i++) {
        const route = routes[i % routes.length];
        const bus = buses[i % buses.length];
        const driver = drivers[i % driverIds.length];
        const conductor = conductors[i % conductorIds.length];

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
            startTime: `${8 + (i % 8)}:00`,
            endTime: `${12 + (i % 8)}:00`,
            fare: 500 + (i * 50),
            capacity: bus.capacity?.total || bus.capacity || 50,
            status: i < 5 ? 'scheduled' : i < 10 ? 'pending' : 'approved',
            tripNumber: `KCH-${String(i + 1).padStart(4, '0')}`,
            createdAt: new Date()
          });
        }
      }

      if (sampleTrips.length > 0) {
        await Trip.insertMany(sampleTrips);
        console.log(`✅ Created ${sampleTrips.length} trips for KCH depot`);
      }
    } else {
      console.log(`✅ Found ${existingTrips} trips already assigned`);
    }

    // 6. Create duty assignments
    console.log('\n📋 Creating duty assignments...');
    const trips = await Trip.find({
      depotId: kchDepot._id,
      serviceDate: { $gte: new Date() }
    }).limit(10);

    const existingDuties = await Duty.countDocuments({ depotId: kchDepot._id });
    
    if (existingDuties === 0 && trips.length > 0) {
      const duties = trips.map(trip => ({
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
    } else {
      console.log(`✅ Found ${existingDuties} duty assignments already created`);
    }

    // Final summary
    console.log('\n📊 Final Data Summary:');
    const finalBusCount = await Bus.countDocuments({ depotId: kchDepot._id });
    const finalRouteCount = await Route.countDocuments({
      $or: [
        { 'depot.depotId': kchDepot._id },
        { depotId: kchDepot._id }
      ]
    });
    const finalTripCount = await Trip.countDocuments({ depotId: kchDepot._id });
    const finalDriverCount = await Driver.countDocuments({ depotId: kchDepot._id });
    const finalConductorCount = await Conductor.countDocuments({ depotId: kchDepot._id });
    const finalDutyCount = await Duty.countDocuments({ depotId: kchDepot._id });

    console.log(`   ✅ Buses: ${finalBusCount}`);
    console.log(`   ✅ Routes: ${finalRouteCount}`);
    console.log(`   ✅ Trips: ${finalTripCount}`);
    console.log(`   ✅ Drivers: ${finalDriverCount}`);
    console.log(`   ✅ Conductors: ${finalConductorCount}`);
    console.log(`   ✅ Duty Assignments: ${finalDutyCount}`);

    console.log('\n✅ Data population complete!');
    console.log('\n📋 Login Credentials:');
    console.log('   Email: kch-depot@yatrik.com');
    console.log('   Password: KCH@2024');
    console.log('   Dashboard: http://localhost:3000/depot\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

populateKCHDepotData();
