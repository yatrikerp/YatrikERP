const mongoose = require('mongoose');
require('dotenv').config();

const Depot = require('../models/Depot');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const Trip = require('../models/Trip');
const Driver = require('../models/Driver');
const Conductor = require('../models/Conductor');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik';

async function seedTripsAndSchedules() {
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

    // Get routes for this depot (try multiple ways)
    let routes = await Route.find({
      $or: [
        { 'depot.depotId': kochiDepot._id },
        { depotId: kochiDepot._id }
      ],
      status: 'active'
    }).limit(10).lean();

    // If no routes found, get any active routes and link them
    if (routes.length === 0) {
      routes = await Route.find({ status: 'active' }).limit(10).lean();
      console.log(`📋 Found ${routes.length} active routes (linking to depot)...\n`);
      
      // Link routes to depot
      for (const route of routes) {
        const routeObj = await Route.findById(route._id);
        if (routeObj) {
          routeObj.depot = {
            depotId: kochiDepot._id,
            depotName: kochiDepot.depotName,
            depotLocation: kochiDepot.location?.city || kochiDepot.location?.address || 'Kochi'
          };
          routeObj.depotId = kochiDepot._id;
          await routeObj.save();
          console.log(`  ✅ Linked route: ${routeObj.routeName || routeObj.routeNumber}`);
        }
      }
    }
    
    if (routes.length === 0) {
      console.log('⚠️ No routes found. Please create routes first.');
      process.exit(1);
    }

    console.log(`📋 Found ${routes.length} routes\n`);

    // Get buses for this depot
    const buses = await Bus.find({ depotId: kochiDepot._id, status: { $in: ['active', 'available', 'idle'] } }).limit(20).lean();

    if (buses.length === 0) {
      console.log('⚠️ No buses found. Please assign buses first.');
      process.exit(1);
    }

    console.log(`🚌 Found ${buses.length} buses\n`);

    // Get drivers and conductors (optional)
    const drivers = await Driver.find({ depotId: kochiDepot._id, status: 'active' }).limit(10).lean();
    const conductors = await Conductor.find({ depotId: kochiDepot._id, status: 'active' }).limit(10).lean();
    
    // Also check User model
    const userDrivers = await User.find({ role: 'driver', depotId: kochiDepot._id, status: 'active' }).limit(10).lean();
    const userConductors = await User.find({ role: 'conductor', depotId: kochiDepot._id, status: 'active' }).limit(10).lean();
    
    const allDrivers = [...drivers, ...userDrivers];
    const allConductors = [...conductors, ...userConductors];

    console.log(`👥 Found ${allDrivers.length} drivers and ${allConductors.length} conductors\n`);

    // Generate trips for today and next 7 days
    const today = new Date('2026-01-21');
    today.setHours(0, 0, 0, 0);
    
    const trips = [];
    const statuses = ['pending', 'approved', 'scheduled', 'running', 'completed'];
    const timeSlots = [
      { start: '06:00', end: '10:00' },
      { start: '10:30', end: '14:30' },
      { start: '15:00', end: '19:00' },
      { start: '20:00', end: '02:00' }, // Overnight
    ];

    console.log('📅 Creating trips for today and next 7 days...\n');

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const tripDate = new Date(today);
      tripDate.setDate(tripDate.getDate() + dayOffset);
      
      // Create 2-4 trips per day
      const tripsPerDay = dayOffset === 0 ? 4 : (dayOffset < 3 ? 3 : 2);
      
      for (let tripIndex = 0; tripIndex < tripsPerDay; tripIndex++) {
        const route = routes[tripIndex % routes.length];
        const bus = buses[tripIndex % buses.length];
        const timeSlot = timeSlots[tripIndex % timeSlots.length];
        
        // Determine status based on date (valid values: scheduled, boarding, running, completed, cancelled, delayed)
        let status;
        if (dayOffset === 0) {
          // Today - mix of statuses
          if (tripIndex === 0) status = 'running';
          else if (tripIndex === 1) status = 'boarding';
          else if (tripIndex === 2) status = 'scheduled';
          else status = 'scheduled';
        } else if (dayOffset < 3) {
          // Next 2 days - mostly scheduled
          status = 'scheduled';
        } else {
          // Future days - all scheduled
          status = 'scheduled';
        }

        // Assign crew if available
        const driver = allDrivers.length > 0 ? allDrivers[tripIndex % allDrivers.length] : null;
        const conductor = allConductors.length > 0 ? allConductors[tripIndex % allConductors.length] : null;

        // Calculate fare based on route distance
        const distance = route.totalDistance || route.distance || 200;
        const baseFare = route.baseFare || 100;
        const fare = baseFare + (distance * (route.farePerKm || 2));

        const tripData = {
          routeId: route._id,
          busId: bus._id,
          depotId: kochiDepot._id,
          serviceDate: tripDate,
          startTime: timeSlot.start,
          endTime: timeSlot.end,
          fare: fare,
          capacity: bus.capacity?.total || bus.capacity || 45,
          status: status,
          driverId: driver?._id || null,
          conductorId: conductor?._id || null,
          notes: `Trip on ${tripDate.toLocaleDateString('en-IN')} - ${route.routeName || route.routeNumber}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        trips.push(tripData);
      }
    }

    // Create trips in database
    console.log(`📦 Creating ${trips.length} trips...\n`);
    let createdCount = 0;
    let skippedCount = 0;

    for (const tripData of trips) {
      // Check if trip already exists (same bus, date, and time)
      const existing = await Trip.findOne({
        busId: tripData.busId,
        serviceDate: tripData.serviceDate,
        startTime: tripData.startTime,
        status: { $ne: 'cancelled' }
      });

      if (!existing) {
        try {
          await Trip.create(tripData);
          createdCount++;
          if (createdCount <= 10) {
            const routeName = routes.find(r => r._id.toString() === tripData.routeId.toString())?.routeName || 'Route';
            const busNumber = buses.find(b => b._id.toString() === tripData.busId.toString())?.busNumber || 'Bus';
            console.log(`  ✅ Created: ${routeName} - ${busNumber} - ${tripData.serviceDate.toLocaleDateString('en-IN')} ${tripData.startTime} (${tripData.status})`);
          }
        } catch (error) {
          console.error(`  ❌ Error creating trip:`, error.message);
          skippedCount++;
        }
      } else {
        skippedCount++;
      }
    }

    if (createdCount > 10) {
      console.log(`  ... and ${createdCount - 10} more trips`);
    }

    // Get summary statistics
    const todayTrips = await Trip.countDocuments({
      depotId: kochiDepot._id,
      serviceDate: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    const statusCounts = await Trip.aggregate([
      { $match: { depotId: kochiDepot._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    console.log('\n✅ Trip seeding completed!');
    console.log('\n📊 Summary:');
    console.log(`   - Total trips created: ${createdCount}`);
    console.log(`   - Trips skipped (already exist): ${skippedCount}`);
    console.log(`   - Trips for today (${today.toLocaleDateString('en-IN')}): ${todayTrips}`);
    console.log('\n📈 Status Breakdown:');
    statusCounts.forEach(stat => {
      console.log(`   - ${stat._id}: ${stat.count}`);
    });

    // Show today's trips
    const todayTripsList = await Trip.find({
      depotId: kochiDepot._id,
      serviceDate: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    })
      .populate('routeId', 'routeName routeNumber')
      .populate('busId', 'busNumber')
      .sort({ startTime: 1 })
      .limit(10)
      .lean();

    if (todayTripsList.length > 0) {
      console.log('\n📅 Today\'s Trips:');
      todayTripsList.forEach((trip, index) => {
        console.log(`   ${index + 1}. ${trip.routeId?.routeName || 'Route'} - ${trip.busId?.busNumber || 'Bus'} - ${trip.startTime} (${trip.status})`);
      });
    }

  } catch (error) {
    console.error('❌ Error seeding trips:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

seedTripsAndSchedules();
