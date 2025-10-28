#!/usr/bin/env node
/**
 * SCHEDULE ALL ACTIVE ROUTES
 * Creates trips for all active routes for the next 30 days
 * Sets today as "running" and future days as "scheduled"
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Trip = require('./models/Trip');
const Route = require('./models/Route');
const Bus = require('./models/Bus');
const Driver = require('./models/Driver');
const Conductor = require('./models/Conductor');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp';

console.log('Script starting...');
console.log('MONGODB_URI:', MONGODB_URI ? 'SET' : 'MISSING');

const TIME_SLOTS = [
  '05:00', '06:00', '07:00', '08:00', '09:00',
  '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
]; // From 5 AM to 8 PM

function calculateEndTime(startTime, durationMinutes = 180) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMins = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
}

async function scheduleAllActiveRoutes() {
  try {
    console.log('\n🚀 STARTING COMPREHENSIVE TRIP SCHEDULING');
    console.log('📅 Scheduling all active routes for 30 days\n');

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Fetch all active resources
    console.log('📊 Fetching resources...');
    const [routes, buses, drivers, conductors] = await Promise.all([
      Route.find({ status: 'active' }).lean(),
      Bus.find({ status: { $in: ['active', 'idle', 'available'] } }).lean(),
      Driver.find({ status: 'active' }).lean(),
      Conductor.find({ status: 'active' }).lean(),
      User.find({ role: { $in: ['driver', 'conductor'] }, status: 'active' }).lean()
    ]);

    console.log(`✅ Found ${routes.length} routes`);
    console.log(`✅ Found ${buses.length} buses`);
    console.log(`✅ Found ${drivers.length} drivers`);
    console.log(`✅ Found ${conductors.length} conductors\n`);

    if (!routes.length) {
      console.log('❌ No active routes found. Please create routes first.');
      process.exit(1);
    }

    if (!buses.length) {
      console.log('❌ No buses found. Please add buses first.');
      process.exit(1);
    }

    // Clear existing trips for next 30 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 31);

    console.log('🗑️ Clearing existing trips...');
    const deleteResult = await Trip.deleteMany({
      serviceDate: { $gte: today, $lt: endDate }
    });
    console.log(`✅ Cleared ${deleteResult.deletedCount} existing trips\n`);

    // Group resources
    const busesByDepot = {};
    buses.forEach(bus => {
      const depotId = bus.depotId?.toString() || 'all';
      if (!busesByDepot[depotId]) busesByDepot[depotId] = [];
      busesByDepot[depotId].push(bus);
    });

    const trips = [];
    
    console.log('📅 Creating trips for all routes...\n');

    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const serviceDate = new Date(today);
      serviceDate.setDate(today.getDate() + dayOffset);
      
      const status = dayOffset === 0 ? 'running' : 'scheduled';
      
      routes.forEach((route, rIdx) => {
        const depotId = route.depotId?.toString() || 'all';
        const availableBuses = busesByDepot[depotId] || buses;
        
        if (!availableBuses.length) return;

        // Create multiple trips per route per day (3 trips for morning, noon, evening)
        const tripsPerRoute = 3;
        
        for (let i = 0; i < tripsPerRoute; i++) {
          const bus = availableBuses[i % availableBuses.length];
          const driver = drivers[i % drivers.length] || null;
          const conductor = conductors[i % conductors.length] || null;
          const startTime = TIME_SLOTS[i % TIME_SLOTS.length];
          const duration = route.estimatedDuration || route.duration || 180;
          const endTime = calculateEndTime(startTime, duration);
          const capacity = bus.capacity?.total || 45;
          const fare = route.baseFare || route.minFare || 150;

          trips.push({
            routeId: route._id,
            busId: bus._id,
            driverId: driver?._id,
            conductorId: conductor?._id,
            depotId: depotId === 'all' ? route.depotId : depotId,
            serviceDate,
            startTime,
            endTime,
            status,
            fare,
            capacity,
            availableSeats: capacity,
            bookedSeats: 0,
            bookingOpen: true,
            bookingCloseTime: new Date(serviceDate.getTime() - (2 * 60 * 60 * 1000)),
            cancellationPolicy: {
              allowed: true,
              hoursBeforeDeparture: 2,
              refundPercentage: 80
            },
            notes: `${status} trip - ${route.routeName}`,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      });

      if (dayOffset % 7 === 0) {
        console.log(`   Day ${dayOffset + 1}: ${routes.length} routes × ${Math.min(10, TIME_SLOTS.length)} trips = ${routes.length * Math.min(10, TIME_SLOTS.length)} trips`);
      }
    }

    console.log(`\n📊 Total trips to create: ${trips.length}`);
    
    // Insert trips in batches
    console.log('\n💾 Inserting trips...');
    const batchSize = 500;
    let inserted = 0;
    
    for (let i = 0; i < trips.length; i += batchSize) {
      const batch = trips.slice(i, i + batchSize);
      await Trip.insertMany(batch, { ordered: false });
      inserted += batch.length;
      process.stdout.write(`\r   Progress: ${Math.round((inserted / trips.length) * 100)}% (${inserted}/${trips.length})`);
    }

    console.log('\n\n✅ TRIP SCHEDULING COMPLETE!');
    console.log(`📊 Successfully created ${inserted} trips`);
    console.log(`📅 Coverage: 30 days (${today.toDateString()} to ${endDate.toDateString()})`);
    console.log(`🚌 ${routes.length} routes with multiple trips per day`);
    console.log(`⏰ Time slots: 5:00 AM to 8:00 PM`);
    
    // Show stats
    const runningTrips = trips.filter(t => t.status === 'running').length;
    const scheduledTrips = trips.filter(t => t.status === 'scheduled').length;
    
    console.log(`\n📈 STATISTICS:`);
    console.log(`   Running trips (today): ${runningTrips}`);
    console.log(`   Scheduled trips (future): ${scheduledTrips}`);
    console.log(`   Total: ${trips.length}`);
    console.log(`   Routes: ${routes.length}`);
    console.log(`   Buses: ${buses.length}`);
    console.log(`   Drivers: ${drivers.length}`);
    console.log(`   Conductors: ${conductors.length}`);
    console.log(`\n🎉 All routes are now active and ready for booking!`);

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err);
    process.exit(1);
  }
}

scheduleAllActiveRoutes();

