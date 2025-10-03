#!/usr/bin/env node
/**
 * FETCH REAL DATA AND SCHEDULE TRIPS
 * 
 * This script fetches real data from your existing system
 * and creates intelligent trip schedules
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Trip = require('./models/Trip');
const Route = require('./models/Route');
const Bus = require('./models/Bus');
const User = require('./models/User');
const Depot = require('./models/Depot');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik';

// Time slots for scheduling
const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00'
];

async function connect() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

function calculateEndTime(startTime, durationMinutes) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

async function fetchAndSchedule() {
  try {
    console.log('\n🚀 FETCHING REAL DATA AND SCHEDULING TRIPS');
    console.log('📅 Creating comprehensive trip schedule\n');

    // Fetch all active resources
    console.log('📊 Fetching all active resources...');
    const [routes, buses, drivers, conductors, depots] = await Promise.all([
      Route.find({ status: 'active', isActive: true }).lean(),
      Bus.find({ status: { $in: ['active', 'idle', 'assigned'] } }).populate('depotId').lean(),
      User.find({ role: 'driver', status: 'active' }).lean(),
      User.find({ role: 'conductor', status: 'active' }).lean(),
      Depot.find({ status: 'active', isActive: true }).lean()
    ]);

    console.log(`✅ Found ${routes.length} routes`);
    console.log(`✅ Found ${buses.length} buses`);
    console.log(`✅ Found ${drivers.length} drivers`);
    console.log(`✅ Found ${conductors.length} conductors`);
    console.log(`✅ Found ${depots.length} depots\n`);

    // Create depot lookup map
    const depotMap = {};
    depots.forEach(depot => {
      depotMap[depot._id.toString()] = depot;
      depotMap[depot.depotName] = depot;
    });

    // Group buses by depot
    const busesByDepot = {};
    buses.forEach(bus => {
      const depotId = bus.depotId?._id?.toString();
      const depotName = bus.depotId?.depotName;
      
      if (depotId && depotName) {
        if (!busesByDepot[depotId]) {
          busesByDepot[depotId] = {
            depot: bus.depotId,
            buses: []
          };
        }
        busesByDepot[depotId].buses.push(bus);
      }
    });

    console.log(`📊 Buses grouped by depot:`);
    Object.entries(busesByDepot).forEach(([depotId, data]) => {
      console.log(`   ${data.depot.depotName}: ${data.buses.length} buses`);
    });

    // Analyze routes and match with available buses
    console.log('\n🔍 Analyzing routes and matching with buses...');
    const validRoutes = [];
    const routesWithoutBuses = [];

    routes.forEach(route => {
      let routeDepotId = null;
      let routeDepotName = null;

      // Try different ways to get depot info from route
      if (route.depot?.depotId?._id) {
        routeDepotId = route.depot.depotId._id.toString();
        routeDepotName = route.depot.depotId.depotName;
      } else if (route.depot?.depotId) {
        routeDepotId = route.depot.depotId.toString();
        const depot = depotMap[routeDepotId];
        routeDepotName = depot?.depotName;
      } else if (route.depot?._id) {
        routeDepotId = route.depot._id.toString();
        routeDepotName = route.depot.depotName;
      } else if (route.depotId) {
        routeDepotId = route.depotId.toString();
        const depot = depotMap[routeDepotId];
        routeDepotName = depot?.depotName;
      }

      if (!routeDepotId || !routeDepotName) {
        routesWithoutBuses.push({
          route: route.routeNumber || route._id,
          reason: 'No depot assigned'
        });
        return;
      }

      const depotBuses = busesByDepot[routeDepotId];
      if (!depotBuses || depotBuses.buses.length === 0) {
        routesWithoutBuses.push({
          route: route.routeNumber || route._id,
          reason: `No buses in depot ${routeDepotName}`
        });
        return;
      }

      validRoutes.push({
        ...route,
        depotId: routeDepotId,
        depotName: routeDepotName,
        availableBuses: depotBuses.buses,
        depot: depotBuses.depot
      });
    });

    console.log(`✅ Valid routes with buses: ${validRoutes.length}`);
    console.log(`⚠️ Routes without buses: ${routesWithoutBuses.length}\n`);

    if (validRoutes.length === 0) {
      console.error('❌ No valid routes found!');
      return;
    }

    // Show summary of valid routes by depot
    console.log('📋 VALID ROUTES BY DEPOT:');
    const depotStats = {};
    validRoutes.forEach(route => {
      if (!depotStats[route.depotName]) {
        depotStats[route.depotName] = {
          routes: 0,
          buses: route.availableBuses.length
        };
      }
      depotStats[route.depotName].routes++;
    });

    Object.entries(depotStats).forEach(([depotName, stats]) => {
      console.log(`   ${depotName}: ${stats.routes} routes, ${stats.buses} buses`);
    });

    // Generate trips for next 30 days
    const tripsToCreate = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysToSchedule = 30;

    console.log(`\n🔄 Generating trips for next ${daysToSchedule} days...\n`);

    for (let dayOffset = 0; dayOffset < daysToSchedule; dayOffset++) {
      const serviceDate = new Date(today);
      serviceDate.setDate(serviceDate.getDate() + dayOffset);
      
      if (dayOffset % 7 === 0) {
        const weekNumber = Math.floor(dayOffset / 7) + 1;
        console.log(`📅 Week ${weekNumber}: ${serviceDate.toDateString()}`);
      }

      let dayTrips = 0;

      validRoutes.forEach((route, routeIndex) => {
        // Create 3-5 trips per route per day
        const tripsPerRoute = Math.min(route.availableBuses.length, 5, TIME_SLOTS.length);
        
        for (let tripIndex = 0; tripIndex < tripsPerRoute; tripIndex++) {
          const bus = route.availableBuses[tripIndex % route.availableBuses.length];
          const driver = drivers[tripIndex % drivers.length];
          const conductor = conductors[tripIndex % conductors.length];
          const startTime = TIME_SLOTS[tripIndex % TIME_SLOTS.length];
          const durationMinutes = route.estimatedDuration || 180;
          const endTime = calculateEndTime(startTime, durationMinutes);

          const trip = {
            routeId: route._id,
            busId: bus._id,
            driverId: driver?._id,
            conductorId: conductor?._id,
            depotId: route.depotId,
            serviceDate: serviceDate,
            startTime: startTime,
            endTime: endTime,
            status: 'scheduled',
            fare: route.baseFare || 100,
            capacity: bus.capacity?.total || 45,
            availableSeats: bus.capacity?.total || 45,
            bookedSeats: 0,
            bookingOpen: true,
            notes: `Auto-scheduled trip - ${route.routeName} (${route.depotName})`,
            createdAt: new Date(),
            updatedAt: new Date(),
            schedulingMetadata: {
              type: 'real_data_schedule',
              depotName: route.depotName,
              routeNumber: route.routeNumber,
              busNumber: bus.busNumber,
              dayOfWeek: serviceDate.toLocaleDateString('en-US', { weekday: 'long' })
            }
          };

          tripsToCreate.push(trip);
          dayTrips++;
        }
      });

      if (dayOffset % 7 === 6) { // End of week
        console.log(`   ✅ Week completed: ${dayTrips} trips scheduled`);
      }
    }

    console.log(`\n📊 Total trips to create: ${tripsToCreate.length}`);
    console.log(`📈 Average trips per day: ${Math.round(tripsToCreate.length / daysToSchedule)}`);
    
    // Clear existing scheduled trips for the period
    console.log('\n🗑️ Clearing existing scheduled trips...');
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + daysToSchedule);
    
    const deleteResult = await Trip.deleteMany({
      serviceDate: { $gte: today, $lt: endDate },
      status: 'scheduled'
    });
    console.log(`✅ Cleared ${deleteResult.deletedCount} existing scheduled trips`);

    // Insert new trips in batches
    console.log('\n💾 Inserting trips into database...');
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < tripsToCreate.length; i += batchSize) {
      const batch = tripsToCreate.slice(i, i + batchSize);
      try {
        await Trip.insertMany(batch, { ordered: false });
        insertedCount += batch.length;
        const progress = Math.round((insertedCount / tripsToCreate.length) * 100);
        process.stdout.write(`\r   Progress: ${progress}% (${insertedCount}/${tripsToCreate.length} trips)`);
      } catch (error) {
        console.error(`\n   ⚠️ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      }
    }

    console.log('\n\n✅ REAL DATA SCHEDULING COMPLETE!');
    console.log(`📊 Successfully created ${insertedCount} trips`);
    console.log(`📅 Coverage: ${daysToSchedule} days`);
    console.log(`🔄 Valid routes: ${validRoutes.length} routes with available buses`);
    console.log(`🚌 Depots used: ${Object.keys(depotStats).length} depots`);

    // Final statistics
    console.log('\n📈 SCHEDULING STATISTICS:');
    console.log(`   Total trips created: ${insertedCount}`);
    console.log(`   Routes with buses: ${validRoutes.length}`);
    console.log(`   Routes without buses: ${routesWithoutBuses.length}`);
    console.log(`   Average trips per day: ${Math.round(insertedCount / daysToSchedule)}`);
    console.log(`   Time slots used: ${TIME_SLOTS.length} per day`);

    console.log('\n🎉 Successfully scheduled trips using your real data!');
    console.log('📱 View trips at: http://localhost:5173/admin/streamlined-trips');
    console.log('🚌 View buses at: http://localhost:5173/admin/streamlined-buses');
    console.log('🛣️ View routes at: http://localhost:5173/admin/streamlined-routes');

  } catch (error) {
    console.error('\n❌ Error during scheduling:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the fetcher and scheduler
connect().then(() => {
  fetchAndSchedule().then(() => {
    console.log('\n✅ Real data scheduling completed successfully!');
    process.exit(0);
  }).catch((error) => {
    console.error('\n❌ Real data scheduling failed:', error);
    process.exit(1);
  });
});

