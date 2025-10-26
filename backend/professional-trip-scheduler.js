const mongoose = require('mongoose');
const Trip = require('./models/Trip');
const Route = require('./models/Route');
const Bus = require('./models/Bus');
const Driver = require('./models/Driver');
const Conductor = require('./models/Conductor');
const Depot = require('./models/Depot');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://yatrikerp:Yatrik123@cluster0.3qt2hfg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

class ProfessionalTripScheduler {
  constructor() {
    this.tripTimes = [
      { start: '05:30', end: '08:30', type: 'morning', multiplier: 1.0 },
      { start: '08:30', end: '11:30', type: 'morning-peak', multiplier: 1.2 },
      { start: '11:30', end: '14:30', type: 'midday', multiplier: 1.1 },
      { start: '14:30', end: '17:30', type: 'afternoon', multiplier: 1.0 },
      { start: '17:30', end: '20:30', type: 'evening-peak', multiplier: 1.3 },
      { start: '20:30', end: '23:30', type: 'night', multiplier: 1.5 }
    ];
  }

  async scheduleAllTrips() {
    try {
      console.log('🚀 Starting Professional Trip Scheduling System...\n');

      // Step 1: Get all active routes with proper depot information
      console.log('📋 Step 1: Fetching active routes...');
      const routes = await Route.find({ status: 'active' });
      console.log(`✅ Found ${routes.length} active routes`);

      if (routes.length === 0) {
        console.log('❌ No active routes found. Please create routes first.');
        return;
      }

      // Step 2: Get all active buses grouped by depot
      console.log('\n🚌 Step 2: Fetching active buses...');
      const buses = await Bus.find({ status: 'active' });
      console.log(`✅ Found ${buses.length} active buses`);

      if (buses.length === 0) {
        console.log('❌ No active buses found. Please create buses first.');
        return;
      }

      // Step 3: Get available drivers and conductors
      console.log('\n👥 Step 3: Fetching available crew...');
      const drivers = await Driver.find({ status: 'active' });
      const conductors = await Conductor.find({ status: 'active' });
      console.log(`✅ Found ${drivers.length} drivers and ${conductors.length} conductors`);

      // Step 4: Group buses by depot
      const busesByDepot = this.groupBusesByDepot(buses);
      console.log(`📊 Buses grouped into ${Object.keys(busesByDepot).length} depots`);

      // Step 5: Clear existing trips for the next 30 days
      console.log('\n🗑️ Step 5: Clearing existing scheduled trips...');
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 30);
      
      const deleteResult = await Trip.deleteMany({
        serviceDate: { $gte: today, $lt: endDate },
        status: { $in: ['scheduled', 'running'] }
      });
      console.log(`✅ Cleared ${deleteResult.deletedCount} existing trips`);

      // Step 6: Create professional trip schedules
      console.log('\n📅 Step 6: Creating professional trip schedules...');
      const tripsToCreate = [];
      const daysToSchedule = 30;

      for (let day = 0; day < daysToSchedule; day++) {
        const serviceDate = new Date(today);
        serviceDate.setDate(today.getDate() + day);
        serviceDate.setHours(0, 0, 0, 0);

        console.log(`   📅 Scheduling trips for ${serviceDate.toDateString()}...`);
        let dayTrips = 0;

        // Process each route
        for (const route of routes) {
          const routeTrips = await this.createTripsForRoute(
            route, 
            busesByDepot, 
            drivers, 
            conductors, 
            serviceDate
          );
          tripsToCreate.push(...routeTrips);
          dayTrips += routeTrips.length;
        }

        console.log(`   ✅ Created ${dayTrips} trips for ${serviceDate.toDateString()}`);
      }

      console.log(`\n📊 Total trips to create: ${tripsToCreate.length}`);

      // Step 7: Insert all trips
      console.log('\n💾 Step 7: Inserting trips into database...');
      const createdTrips = await Trip.insertMany(tripsToCreate);
      console.log(`✅ Successfully created ${createdTrips.length} trips`);

      // Step 8: Set some trips to 'running' status for today
      console.log('\n🏃 Step 8: Setting today\'s trips to running status...');
      const todayTrips = await Trip.find({
        serviceDate: {
          $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0),
          $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0, 0)
        },
        status: 'scheduled'
      }).limit(100); // Set up to 100 trips as running

      if (todayTrips.length > 0) {
        await Trip.updateMany(
          { _id: { $in: todayTrips.map(t => t._id) } },
          { $set: { status: 'running' } }
        );
        console.log(`✅ Set ${todayTrips.length} trips to running status`);
      }

      // Step 9: Update routes to ensure they're active
      console.log('\n🛣️ Step 9: Updating route status...');
      await Route.updateMany(
        { _id: { $in: routes.map(r => r._id) } },
        { 
          $set: { 
            status: 'active',
            lastUpdated: new Date()
          }
        }
      );
      console.log(`✅ Updated ${routes.length} routes to active status`);

      // Step 10: Summary
      console.log('\n🎉 PROFESSIONAL TRIP SCHEDULING COMPLETE!');
      console.log('='.repeat(60));
      console.log(`📊 Total trips created: ${createdTrips.length}`);
      console.log(`📅 Days scheduled: ${daysToSchedule}`);
      console.log(`🛣️ Routes processed: ${routes.length}`);
      console.log(`🚌 Buses used: ${buses.length}`);
      console.log(`👥 Drivers available: ${drivers.length}`);
      console.log(`👥 Conductors available: ${conductors.length}`);
      console.log(`🏃 Running trips today: ${todayTrips.length}`);
      console.log(`🏢 Depots with buses: ${Object.keys(busesByDepot).length}`);
      console.log('='.repeat(60));

      console.log('\n📱 View your trips at:');
      console.log('   http://localhost:3000/admin/streamlined-trips');
      console.log('   http://localhost:3000/admin/streamlined-buses');
      console.log('   http://localhost:3000/admin/streamlined-routes');

      console.log('\n🌐 Passenger views:');
      console.log('   http://localhost:3000/ (Landing page with popular routes)');
      console.log('   http://localhost:3000/pax (Passenger dashboard)');

      return {
        totalTrips: createdTrips.length,
        runningTrips: todayTrips.length,
        routes: routes.length,
        buses: buses.length,
        depots: Object.keys(busesByDepot).length
      };

    } catch (error) {
      console.error('❌ Error during professional scheduling:', error);
      throw error;
    }
  }

  groupBusesByDepot(buses) {
    const busesByDepot = {};
    
    buses.forEach(bus => {
      const depotId = bus.depotId ? bus.depotId.toString() : 'unknown';
      if (!busesByDepot[depotId]) {
        busesByDepot[depotId] = [];
      }
      busesByDepot[depotId].push(bus);
    });

    return busesByDepot;
  }

  async createTripsForRoute(route, busesByDepot, drivers, conductors, serviceDate) {
    const trips = [];
    
    // Get buses for this route's depot
    const depotId = route.depot?.depotId?.toString();
    const depotBuses = busesByDepot[depotId] || [];

    if (depotBuses.length === 0) {
      console.log(`   ⚠️ No buses found for route ${route.routeName} (${route.depot?.depotName || 'Unknown Depot'})`);
      return trips;
    }

    // Create trips for different time slots
    this.tripTimes.forEach((timeSlot, slotIndex) => {
      // Select a bus for this time slot (round-robin)
      const bus = depotBuses[slotIndex % depotBuses.length];
      
      // Select driver and conductor (random selection)
      const driver = drivers[Math.floor(Math.random() * drivers.length)];
      const conductor = conductors[Math.floor(Math.random() * conductors.length)];

      // Calculate fare based on route and time
      const baseFare = route.baseFare || 100;
      const fare = Math.round(baseFare * timeSlot.multiplier);

      // Calculate capacity
      const capacity = bus.capacity?.total || 45;

      const trip = {
        routeId: route._id,
        busId: bus._id,
        driverId: driver?._id,
        conductorId: conductor?._id,
        depotId: depotId,
        serviceDate: serviceDate,
        startTime: timeSlot.start,
        endTime: timeSlot.end,
        status: 'scheduled',
        fare: fare,
        capacity: capacity,
        availableSeats: capacity,
        bookedSeats: 0,
        bookingOpen: true,
        notes: `Professional ${timeSlot.type} trip for ${route.routeName} - Bus ${bus.busNumber}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Additional professional fields
        tripType: timeSlot.type,
        estimatedDuration: this.calculateDuration(timeSlot.start, timeSlot.end),
        amenities: this.getBusAmenities(bus),
        routeInfo: {
          routeName: route.routeName,
          routeNumber: route.routeNumber,
          startingPoint: route.startingPoint?.city,
          endingPoint: route.endingPoint?.city
        },
        busInfo: {
          busNumber: bus.busNumber,
          busType: bus.busType,
          capacity: capacity
        }
      };

      trips.push(trip);
    });

    return trips;
  }

  calculateDuration(startTime, endTime) {
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    
    // Handle overnight trips
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}h ${diffMinutes}m`;
  }

  getBusAmenities(bus) {
    const amenities = [];
    
    if (bus.busType === 'AC') amenities.push('Air Conditioning');
    if (bus.busType === 'Sleeper') amenities.push('Sleeper Berths');
    if (bus.capacity?.total > 40) amenities.push('Spacious Seating');
    
    // Add common amenities
    amenities.push('Comfortable Seats', 'Clean Interior');
    
    return amenities;
  }
}

async function main() {
  try {
    await connectDB();
    
    const scheduler = new ProfessionalTripScheduler();
    const results = await scheduler.scheduleAllTrips();
    
    console.log('\n✅ Professional trip scheduling completed successfully!');
    console.log('📊 Final Results:', results);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { ProfessionalTripScheduler };




