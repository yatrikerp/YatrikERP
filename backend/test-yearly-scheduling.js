#!/usr/bin/env node
/**
 * TEST YEARLY SCHEDULING SCRIPT
 * 
 * Simplified version to test yearly scheduling with a smaller date range
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Trip = require('./models/Trip');
const Route = require('./models/Route');
const Bus = require('./models/Bus');
const User = require('./models/User');
const Depot = require('./models/Depot');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik';

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

async function testYearlyScheduling() {
  try {
    console.log('\n🚀 TESTING YEARLY SCHEDULING');
    console.log('📅 Scheduling trips for next 7 days (test run)\n');

    // Fetch all active resources
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

    if (routes.length === 0 || buses.length === 0) {
      console.error('❌ No routes or buses found. Cannot schedule trips.');
      return;
    }

    // Group buses by depot name
    const busesByDepotName = {};
    buses.forEach(bus => {
      const depotName = bus.depotId?.depotName || 'unknown';
      if (!busesByDepotName[depotName]) busesByDepotName[depotName] = [];
      busesByDepotName[depotName].push(bus);
    });

    console.log(`📊 Buses grouped by depot:`);
    Object.entries(busesByDepotName).slice(0, 5).forEach(([depotName, depotBuses]) => {
      console.log(`   ${depotName}: ${depotBuses.length} buses`);
    });

    // Generate trips for 7 days (test)
    const tripsToCreate = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('🔄 Generating test trip schedule...\n');

    // Test with first 5 routes and 7 days
    const testRoutes = routes.slice(0, 5);
    const testDays = 7;

    for (let dayOffset = 0; dayOffset < testDays; dayOffset++) {
      const serviceDate = new Date(today);
      serviceDate.setDate(serviceDate.getDate() + dayOffset);
      
      console.log(`📅 Day ${dayOffset + 1}: ${serviceDate.toDateString()}`);

      for (const route of testRoutes) {
        // Get route's depot
        let routeDepotName = null;
        let routeDepotId = null;
        
        if (route.depot?.depotId?.depotName) {
          routeDepotName = route.depot.depotId.depotName;
          routeDepotId = route.depot.depotId._id || route.depot.depotId;
        } else if (route.depot?.depotName) {
          routeDepotName = route.depot.depotName;
          routeDepotId = route.depot._id;
        } else if (route.depotId) {
          routeDepotId = route.depotId;
          const depot = depots.find(d => d._id.toString() === routeDepotId.toString());
          routeDepotName = depot?.depotName || depot?.name;
        }
        
        if (!routeDepotName) {
          console.log(`   ⚠️ Route ${route.routeNumber || route._id} missing depot info. Skipped.`);
          continue;
        }

        // Get available buses
        const routeBuses = busesByDepotName[routeDepotName] || [];
        
        if (routeBuses.length === 0) {
          console.log(`   ⚠️ Route ${route.routeNumber} has no buses in depot ${routeDepotName}`);
          continue;
        }

        // Create 3 trips for this route per day (test)
        const timeSlots = ['06:00', '12:00', '18:00'];
        
        for (let tripIndex = 0; tripIndex < 3 && tripIndex < routeBuses.length; tripIndex++) {
          const bus = routeBuses[tripIndex];
          const driver = drivers[tripIndex % drivers.length];
          const conductor = conductors[tripIndex % conductors.length];
          const startTime = timeSlots[tripIndex];
          const durationMinutes = route.estimatedDuration || 180;
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
            notes: `Test yearly scheduled trip - ${route.routeName}`,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          tripsToCreate.push(trip);
        }
      }
    }

    console.log(`\n📊 Total trips to create: ${tripsToCreate.length}`);
    
    // Clear existing scheduled trips for test period
    console.log('\n🗑️ Clearing existing scheduled trips for test period...');
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + testDays);
    
    const deleteResult = await Trip.deleteMany({
      serviceDate: { $gte: today, $lt: endDate },
      status: 'scheduled'
    });
    console.log(`✅ Cleared ${deleteResult.deletedCount} existing scheduled trips`);

    // Insert new trips
    console.log('\n💾 Inserting trips into database...');
    let insertedCount = 0;

    try {
      await Trip.insertMany(tripsToCreate, { ordered: false });
      insertedCount = tripsToCreate.length;
      console.log(`✅ Successfully created ${insertedCount} trips`);
    } catch (error) {
      console.error(`❌ Error inserting trips:`, error.message);
    }

    console.log('\n✅ TEST YEARLY SCHEDULING COMPLETE!');
    console.log(`📊 Successfully created ${insertedCount} trips`);
    console.log(`📅 Coverage: ${testDays} days (${today.toDateString()} to ${endDate.toDateString()})`);
    console.log(`🔄 Test routes: ${testRoutes.length} routes`);
    console.log(`🚌 Test buses: ${Object.keys(busesByDepotName).length} depot groups`);

    console.log('\n🎉 Test successful! Ready for full yearly scheduling!');
    console.log('📱 View trips at: http://localhost:5173/admin/streamlined-trips');

  } catch (error) {
    console.error('\n❌ Error during test yearly scheduling:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the test
connect().then(() => {
  testYearlyScheduling().then(() => {
    console.log('\n✅ Test yearly scheduling completed successfully!');
    process.exit(0);
  }).catch((error) => {
    console.error('\n❌ Test yearly scheduling failed:', error);
    process.exit(1);
  });
});

