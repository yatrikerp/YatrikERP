#!/usr/bin/env node
/**
 * AUTO-SCHEDULE TRIPS FOR 30 DAYS
 * 
 * This script automatically schedules trips for all routes
 * for the next 30 days with continuous all-day service
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Trip = require('./models/Trip');
const Route = require('./models/Route');
const Bus = require('./models/Bus');
const User = require('./models/User');
const Depot = require('./models/Depot');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik';
const DAYS_TO_SCHEDULE = 30;
const TRIPS_PER_ROUTE_PER_DAY = 8; // 8 trips per route per day (all day coverage)
const TIME_SLOTS = [
  '06:00', '08:00', '10:00', '12:00', 
  '14:00', '16:00', '18:00', '20:00'
]; // All day from 6 AM to 8 PM

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

async function autoScheduleTrips() {
  try {
    console.log('\n🚀 STARTING AUTOMATIC TRIP SCHEDULING');
    console.log(`📅 Scheduling trips for next ${DAYS_TO_SCHEDULE} days`);
    console.log(`🕐 ${TRIPS_PER_ROUTE_PER_DAY} trips per route per day\n`);

    // Fetch all active resources
    console.log('📊 Fetching resources...');
    const [routes, buses, drivers, conductors, depots] = await Promise.all([
      Route.find({ status: 'active', isActive: true }).lean(),
      Bus.find({ status: { $in: ['active', 'idle'] } }).populate('depotId').lean(),
      User.find({ role: 'driver', status: 'active' }).lean(),
      User.find({ role: 'conductor', status: 'active' }).lean(),
      Depot.find({ status: 'active', isActive: true }).lean()
    ]);

    console.log(`✅ Found ${routes.length} routes`);
    console.log(`✅ Found ${buses.length} buses`);
    console.log(`✅ Found ${drivers.length} drivers`);
    console.log(`✅ Found ${conductors.length} conductors`);
    console.log(`✅ Found ${depots.length} depots\n`);

    if (routes.length === 0 || buses.length === 0) {
      console.error('❌ No routes or buses found. Cannot schedule trips.');
      return;
    }

    // Group buses by depot
    const busesByDepot = {};
    buses.forEach(bus => {
      const depotId = bus.depotId?._id?.toString() || 'unknown';
      if (!busesByDepot[depotId]) busesByDepot[depotId] = [];
      busesByDepot[depotId].push(bus);
    });

    // Group crew by depot
    const driversByDepot = {};
    const conductorsByDepot = {};
    
    drivers.forEach(driver => {
      const depotId = driver.depotId?.toString() || 'all';
      if (!driversByDepot[depotId]) driversByDepot[depotId] = [];
      driversByDepot[depotId].push(driver);
    });

    conductors.forEach(conductor => {
      const depotId = conductor.depotId?.toString() || 'all';
      if (!conductorsByDepot[depotId]) conductorsByDepot[depotId] = [];
      conductorsByDepot[depotId].push(conductor);
    });

    // Generate trips for next 30 days
    const tripsToCreate = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('🔄 Generating trips...\n');

    for (let dayOffset = 0; dayOffset < DAYS_TO_SCHEDULE; dayOffset++) {
      const serviceDate = new Date(today);
      serviceDate.setDate(serviceDate.getDate() + dayOffset);
      
      console.log(`📅 Day ${dayOffset + 1}/${DAYS_TO_SCHEDULE}: ${serviceDate.toDateString()}`);

      for (const route of routes) {
        // Get route's depot
        const routeDepotId = route.depot?.depotId?.toString() || route.depotId?.toString();
        const routeBuses = busesByDepot[routeDepotId] || buses;
        const routeDrivers = driversByDepot[routeDepotId] || drivers;
        const routeConductors = conductorsByDepot[routeDepotId] || conductors;

        if (routeBuses.length === 0) continue;

        // Create 8 trips for this route (all day coverage)
        for (let tripIndex = 0; tripIndex < TRIPS_PER_ROUTE_PER_DAY; tripIndex++) {
          const bus = routeBuses[tripIndex % routeBuses.length];
          const driver = routeDrivers[tripIndex % routeDrivers.length];
          const conductor = routeConductors[tripIndex % routeConductors.length];
          const startTime = TIME_SLOTS[tripIndex];
          const durationMinutes = route.estimatedDuration || route.duration || 120;
          const endTime = calculateEndTime(startTime, durationMinutes);

          const trip = {
            routeId: route._id,
            busId: bus._id,
            driverId: driver?._id,
            conductorId: conductor?._id,
            depotId: routeDepotId || bus.depotId?._id,
            serviceDate: serviceDate,
            startTime: startTime,
            endTime: endTime,
            status: 'scheduled',
            fare: route.baseFare || 100,
            capacity: bus.capacity?.total || 45,
            availableSeats: bus.capacity?.total || 45,
            bookedSeats: 0,
            bookingOpen: true,
            notes: `Auto-scheduled trip - ${route.routeName}`,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          tripsToCreate.push(trip);
        }
      }
      
      const tripsForDay = routes.length * TRIPS_PER_ROUTE_PER_DAY;
      console.log(`   ✅ Generated ${tripsForDay} trips for ${serviceDate.toDateString()}`);
    }

    console.log(`\n📊 Total trips to create: ${tripsToCreate.length}`);
    
    // Clear existing scheduled trips for next 30 days
    console.log('\n🗑️ Clearing existing scheduled trips for next 30 days...');
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + DAYS_TO_SCHEDULE);
    
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

    console.log('\n\n✅ TRIP SCHEDULING COMPLETE!');
    console.log(`📊 Successfully created ${insertedCount} trips`);
    console.log(`📅 Coverage: ${DAYS_TO_SCHEDULE} days (${today.toDateString()} to ${endDate.toDateString()})`);
    console.log(`🚌 ${routes.length} routes with ${TRIPS_PER_ROUTE_PER_DAY} trips each per day`);
    console.log(`⏰ Service hours: 6:00 AM to 8:00 PM\n`);

    // Show summary statistics
    const todayEnd = new Date(today);
    todayEnd.setDate(todayEnd.getDate() + 1);
    
    const todayTrips = await Trip.countDocuments({
      serviceDate: { $gte: today, $lt: todayEnd },
      status: 'scheduled'
    });

    console.log('📈 STATISTICS:');
    console.log(`   Today's trips: ${todayTrips}`);
    console.log(`   Routes covered: ${routes.length}`);
    console.log(`   Buses utilized: ${buses.length}`);
    console.log(`   Drivers assigned: ${drivers.length}`);
    console.log(`   Conductors assigned: ${conductors.length}`);
    console.log(`\n🎉 Popular routes will now show these trips!`);

  } catch (error) {
    console.error('\n❌ Error during auto-scheduling:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the scheduler
connect().then(() => {
  autoScheduleTrips().then(() => {
    console.log('\n✅ Auto-scheduling completed successfully!');
    process.exit(0);
  }).catch((error) => {
    console.error('\n❌ Auto-scheduling failed:', error);
    process.exit(1);
  });
});

