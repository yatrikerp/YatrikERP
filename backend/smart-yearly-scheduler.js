#!/usr/bin/env node
/**
 * SMART YEARLY SCHEDULER
 * 
 * This script intelligently schedules trips only for routes
 * that have buses available in their assigned depots
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Trip = require('./models/Trip');
const Route = require('./models/Route');
const Bus = require('./models/Bus');
const User = require('./models/User');
const Depot = require('./models/Depot');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik';

// Time slots
const WEEKDAY_TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00'
];

const WEEKEND_TIME_SLOTS = [
  '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00',
  '17:00', '18:00', '19:00'
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

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

async function smartYearlyScheduling() {
  try {
    console.log('\n🚀 SMART YEARLY SCHEDULING');
    console.log('📅 Scheduling trips for next 30 days (smart approach)\n');

    // Fetch all resources
    console.log('📊 Fetching resources...');
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

    // Group buses by depot name
    const busesByDepotName = {};
    buses.forEach(bus => {
      const depotName = bus.depotId?.depotName || 'unknown';
      if (!busesByDepotName[depotName]) busesByDepotName[depotName] = [];
      busesByDepotName[depotName].push(bus);
    });

    console.log(`📊 Buses grouped by depot:`);
    Object.entries(busesByDepotName).forEach(([depotName, depotBuses]) => {
      console.log(`   ${depotName}: ${depotBuses.length} buses`);
    });

    // Find routes that have buses available
    console.log('\n🔍 Finding routes with available buses...');
    const validRoutes = [];
    const routesWithoutBuses = [];

    for (const route of routes) {
      let routeDepotName = null;
      
      // Extract depot name from route
      if (route.depot?.depotId?.depotName) {
        routeDepotName = route.depot.depotId.depotName;
      } else if (route.depot?.depotName) {
        routeDepotName = route.depot.depotName;
      } else if (route.depotId) {
        const depot = depots.find(d => d._id.toString() === route.depotId.toString());
        routeDepotName = depot?.depotName || depot?.name;
      }
      
      if (!routeDepotName) {
        routesWithoutBuses.push({
          route: route.routeNumber || route._id,
          reason: 'No depot assigned'
        });
        continue;
      }

      const depotBuses = busesByDepotName[routeDepotName];
      if (!depotBuses || depotBuses.length === 0) {
        routesWithoutBuses.push({
          route: route.routeNumber || route._id,
          reason: `No buses in depot ${routeDepotName}`
        });
        continue;
      }

      validRoutes.push({
        ...route,
        depotName: routeDepotName,
        availableBuses: depotBuses
      });
    }

    console.log(`✅ Valid routes with buses: ${validRoutes.length}`);
    console.log(`⚠️ Routes without buses: ${routesWithoutBuses.length}`);

    if (validRoutes.length === 0) {
      console.error('❌ No routes with available buses found!');
      return;
    }

    // Show summary of valid routes
    console.log('\n📋 VALID ROUTES SUMMARY:');
    const depotRouteCount = {};
    validRoutes.forEach(route => {
      depotRouteCount[route.depotName] = (depotRouteCount[route.depotName] || 0) + 1;
    });

    Object.entries(depotRouteCount).forEach(([depotName, count]) => {
      const busCount = busesByDepotName[depotName]?.length || 0;
      console.log(`   ${depotName}: ${count} routes, ${busCount} buses`);
    });

    // Generate trips for 30 days (test)
    const tripsToCreate = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysToSchedule = 30;

    console.log('\n🔄 Generating smart trip schedule...\n');

    for (let dayOffset = 0; dayOffset < daysToSchedule; dayOffset++) {
      const serviceDate = new Date(today);
      serviceDate.setDate(serviceDate.getDate() + dayOffset);
      
      if (dayOffset % 7 === 0) {
        console.log(`📅 Week ${Math.floor(dayOffset / 7) + 1}: ${serviceDate.toDateString()}`);
      }

      const timeSlots = isWeekend(serviceDate) ? WEEKEND_TIME_SLOTS : WEEKDAY_TIME_SLOTS;
      let dayTrips = 0;

      for (const route of validRoutes) {
        const availableBuses = route.availableBuses;
        const maxTrips = Math.min(availableBuses.length, timeSlots.length, 5); // Max 5 trips per route per day

        for (let tripIndex = 0; tripIndex < maxTrips; tripIndex++) {
          const bus = availableBuses[tripIndex % availableBuses.length];
          const driver = drivers[tripIndex % drivers.length];
          const conductor = conductors[tripIndex % conductors.length];
          const startTime = timeSlots[tripIndex % timeSlots.length];
          const durationMinutes = route.estimatedDuration || 180;
          const endTime = calculateEndTime(startTime, durationMinutes);

          const trip = {
            routeId: route._id,
            busId: bus._id,
            driverId: driver?._id,
            conductorId: conductor?._id,
            depotId: route.depotId || bus.depotId?._id,
            serviceDate: serviceDate,
            startTime: startTime,
            endTime: endTime,
            status: 'scheduled',
            fare: route.baseFare || 100,
            capacity: bus.capacity?.total || 45,
            availableSeats: bus.capacity?.total || 45,
            bookedSeats: 0,
            bookingOpen: true,
            notes: `Smart scheduled trip - ${route.routeName} (${route.depotName})`,
            createdAt: new Date(),
            updatedAt: new Date(),
            schedulingMetadata: {
              type: 'smart_yearly',
              depotName: route.depotName,
              dayOfWeek: serviceDate.toLocaleDateString('en-US', { weekday: 'long' }),
              isWeekend: isWeekend(serviceDate)
            }
          };

          tripsToCreate.push(trip);
          dayTrips++;
        }
      }

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

    // Insert new trips
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

    console.log('\n\n✅ SMART YEARLY SCHEDULING COMPLETE!');
    console.log(`📊 Successfully created ${insertedCount} trips`);
    console.log(`📅 Coverage: ${daysToSchedule} days`);
    console.log(`🔄 Valid routes: ${validRoutes.length} routes with available buses`);
    console.log(`🚌 Depots used: ${Object.keys(depotRouteCount).length} depots`);

    // Show final statistics
    console.log('\n📈 SMART SCHEDULING STATISTICS:');
    console.log(`   Total trips created: ${insertedCount}`);
    console.log(`   Valid routes used: ${validRoutes.length}`);
    console.log(`   Routes skipped: ${routesWithoutBuses.length}`);
    console.log(`   Average trips per day: ${Math.round(insertedCount / daysToSchedule)}`);
    console.log(`   Weekday trips: ${WEEKDAY_TIME_SLOTS.length} slots per route`);
    console.log(`   Weekend trips: ${WEEKEND_TIME_SLOTS.length} slots per route`);

    console.log('\n🎉 Smart scheduling successful! Only routes with available buses were scheduled.');
    console.log('📱 View trips at: http://localhost:5173/admin/streamlined-trips');

  } catch (error) {
    console.error('\n❌ Error during smart yearly scheduling:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the smart scheduler
connect().then(() => {
  smartYearlyScheduling().then(() => {
    console.log('\n✅ Smart yearly scheduling completed successfully!');
    process.exit(0);
  }).catch((error) => {
    console.error('\n❌ Smart yearly scheduling failed:', error);
    process.exit(1);
  });
});


