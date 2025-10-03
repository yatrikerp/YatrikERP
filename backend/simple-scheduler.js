#!/usr/bin/env node
/**
 * SIMPLE REAL DATA SCHEDULER
 * Fetches real data and creates trips
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Trip = require('./models/Trip');
const Route = require('./models/Route');
const Bus = require('./models/Bus');
const User = require('./models/User');
const Depot = require('./models/Depot');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik';

async function simpleScheduler() {
  try {
    console.log('🚀 SIMPLE REAL DATA SCHEDULER');
    console.log('📅 Fetching your real data and scheduling trips\n');

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Fetch all resources
    console.log('📊 Fetching resources...');
    const routes = await Route.find({ status: 'active', isActive: true });
    const buses = await Bus.find({ status: { $in: ['active', 'idle', 'assigned'] } }).populate('depotId');
    const drivers = await User.find({ role: 'driver', status: 'active' });
    const conductors = await User.find({ role: 'conductor', status: 'active' });
    const depots = await Depot.find({ status: 'active', isActive: true });

    console.log(`✅ Found ${routes.length} routes`);
    console.log(`✅ Found ${buses.length} buses`);
    console.log(`✅ Found ${drivers.length} drivers`);
    console.log(`✅ Found ${conductors.length} conductors`);
    console.log(`✅ Found ${depots.length} depots\n`);

    // Group buses by depot
    const busesByDepot = {};
    buses.forEach(bus => {
      const depotName = bus.depotId?.depotName;
      if (depotName) {
        if (!busesByDepot[depotName]) busesByDepot[depotName] = [];
        busesByDepot[depotName].push(bus);
      }
    });

    console.log('📊 Buses by depot:');
    Object.entries(busesByDepot).forEach(([depot, depotBuses]) => {
      console.log(`   ${depot}: ${depotBuses.length} buses`);
    });

    // Find routes with buses
    const validRoutes = [];
    routes.forEach(route => {
      let depotName = null;
      
      // Get depot name from route
      if (route.depot?.depotId?.depotName) {
        depotName = route.depot.depotId.depotName;
      } else if (route.depot?.depotName) {
        depotName = route.depot.depotName;
      } else if (route.depotId) {
        const depot = depots.find(d => d._id.toString() === route.depotId.toString());
        depotName = depot?.depotName;
      }

      if (depotName && busesByDepot[depotName]?.length > 0) {
        validRoutes.push({
          ...route,
          depotName,
          availableBuses: busesByDepot[depotName]
        });
      }
    });

    console.log(`\n✅ Valid routes with buses: ${validRoutes.length}`);
    console.log(`⚠️ Routes without buses: ${routes.length - validRoutes.length}`);

    if (validRoutes.length === 0) {
      console.error('❌ No valid routes found!');
      return;
    }

    // Create trips for next 7 days
    const tripsToCreate = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysToSchedule = 7;

    console.log(`\n🔄 Creating trips for next ${daysToSchedule} days...\n`);

    for (let day = 0; day < daysToSchedule; day++) {
      const serviceDate = new Date(today);
      serviceDate.setDate(serviceDate.getDate() + day);
      
      console.log(`📅 Day ${day + 1}: ${serviceDate.toDateString()}`);
      
      let dayTrips = 0;

      validRoutes.forEach((route, routeIndex) => {
        // Create 3 trips per route per day
        const tripsPerRoute = Math.min(3, route.availableBuses.length);
        
        for (let tripIndex = 0; tripIndex < tripsPerRoute; tripIndex++) {
          const bus = route.availableBuses[tripIndex % route.availableBuses.length];
          const driver = drivers[tripIndex % drivers.length];
          const conductor = conductors[tripIndex % conductors.length];
          
          const startTimes = ['06:00', '12:00', '18:00'];
          const startTime = startTimes[tripIndex % startTimes.length];
          
          const [hours, minutes] = startTime.split(':').map(Number);
          const durationMinutes = route.estimatedDuration || 180;
          const endHours = Math.floor((hours * 60 + minutes + durationMinutes) / 60) % 24;
          const endMinutes = (hours * 60 + minutes + durationMinutes) % 60;
          const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

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
            notes: `Real data trip - ${route.routeName} (${route.depotName})`,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          tripsToCreate.push(trip);
          dayTrips++;
        }
      });

      console.log(`   ✅ Created ${dayTrips} trips`);
    }

    console.log(`\n📊 Total trips to create: ${tripsToCreate.length}`);
    
    // Clear existing trips
    console.log('\n🗑️ Clearing existing trips...');
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + daysToSchedule);
    
    const deleteResult = await Trip.deleteMany({
      serviceDate: { $gte: today, $lt: endDate },
      status: 'scheduled'
    });
    console.log(`✅ Cleared ${deleteResult.deletedCount} existing trips`);

    // Insert new trips
    console.log('\n💾 Inserting trips...');
    await Trip.insertMany(tripsToCreate);
    console.log(`✅ Created ${tripsToCreate.length} trips`);

    console.log('\n🎉 REAL DATA SCHEDULING COMPLETE!');
    console.log(`📊 Successfully created ${tripsToCreate.length} trips`);
    console.log(`📅 Coverage: ${daysToSchedule} days`);
    console.log(`🔄 Valid routes: ${validRoutes.length} routes`);
    console.log(`🚌 Depots used: ${Object.keys(busesByDepot).length} depots`);

    console.log('\n📱 View your trips at:');
    console.log('   http://localhost:5173/admin/streamlined-trips');
    console.log('   http://localhost:5173/admin/streamlined-buses');
    console.log('   http://localhost:5173/admin/streamlined-routes');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

simpleScheduler();

