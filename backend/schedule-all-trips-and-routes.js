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

async function scheduleAllTripsAndRoutes() {
  try {
    console.log('🚀 Starting comprehensive trip and route scheduling...\n');

    // Step 1: Get all active routes
    console.log('📋 Step 1: Fetching active routes...');
    const routes = await Route.find({ status: 'active' });
    console.log(`✅ Found ${routes.length} active routes`);

    if (routes.length === 0) {
      console.log('❌ No active routes found. Please create routes first.');
      return;
    }

    // Step 2: Get all active buses
    console.log('\n🚌 Step 2: Fetching active buses...');
    const buses = await Bus.find({ status: 'active' }).populate('depotId');
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

    // Step 4: Clear existing scheduled trips for the next 30 days
    console.log('\n🗑️ Step 4: Clearing existing scheduled trips...');
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 30);
    
    const deleteResult = await Trip.deleteMany({
      serviceDate: { $gte: today, $lt: endDate },
      status: { $in: ['scheduled', 'running'] }
    });
    console.log(`✅ Cleared ${deleteResult.deletedCount} existing trips`);

    // Step 5: Create trips for the next 30 days
    console.log('\n📅 Step 5: Creating trips for the next 30 days...');
    const tripsToCreate = [];
    const daysToSchedule = 30;

    for (let day = 0; day < daysToSchedule; day++) {
      const serviceDate = new Date(today);
      serviceDate.setDate(today.getDate() + day);
      serviceDate.setHours(0, 0, 0, 0);

      console.log(`   📅 Creating trips for ${serviceDate.toDateString()}...`);
      let dayTrips = 0;

      routes.forEach((route, routeIndex) => {
        // Get buses for this route's depot
        const depotBuses = buses.filter(bus => 
          bus.depotId && route.depot && route.depot.depotId && 
          bus.depotId.toString() === route.depot.depotId.toString()
        );

        if (depotBuses.length === 0) {
          console.log(`   ⚠️ No buses found for route ${route.routeName} (${route.depot?.depotName})`);
          return;
        }

        // Create multiple trips per route per day (morning, afternoon, evening)
        const tripTimes = [
          { start: '06:00', end: '12:00', multiplier: 1.0 },
          { start: '12:00', end: '18:00', multiplier: 1.2 },
          { start: '18:00', end: '24:00', multiplier: 1.5 }
        ];

        tripTimes.forEach((timeSlot, slotIndex) => {
          const bus = depotBuses[slotIndex % depotBuses.length];
          const driver = drivers[Math.floor(Math.random() * drivers.length)];
          const conductor = conductors[Math.floor(Math.random() * conductors.length)];

          const trip = {
            routeId: route._id,
            busId: bus._id,
            driverId: driver?._id,
            conductorId: conductor?._id,
            depotId: route.depot?.depotId,
            serviceDate: serviceDate,
            startTime: timeSlot.start,
            endTime: timeSlot.end,
            status: 'scheduled',
            fare: Math.round((route.baseFare || 100) * timeSlot.multiplier),
            capacity: bus.capacity?.total || 45,
            availableSeats: bus.capacity?.total || 45,
            bookedSeats: 0,
            bookingOpen: true,
            notes: `Auto-scheduled trip for ${route.routeName} - ${timeSlot.start}`,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          tripsToCreate.push(trip);
          dayTrips++;
        });
      });

      console.log(`   ✅ Created ${dayTrips} trips for ${serviceDate.toDateString()}`);
    }

    console.log(`\n📊 Total trips to create: ${tripsToCreate.length}`);

    // Step 6: Insert all trips
    console.log('\n💾 Step 6: Inserting trips into database...');
    const createdTrips = await Trip.insertMany(tripsToCreate);
    console.log(`✅ Successfully created ${createdTrips.length} trips`);

    // Step 7: Set some trips to 'running' status for today
    console.log('\n🏃 Step 7: Setting today\'s trips to running status...');
    const todayTrips = await Trip.find({
      serviceDate: {
        $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0),
        $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0, 0)
      },
      status: 'scheduled'
    }).limit(50); // Limit to 50 running trips

    if (todayTrips.length > 0) {
      await Trip.updateMany(
        { _id: { $in: todayTrips.map(t => t._id) } },
        { $set: { status: 'running' } }
      );
      console.log(`✅ Set ${todayTrips.length} trips to running status`);
    }

    // Step 8: Update routes to ensure they're active and have trips
    console.log('\n🛣️ Step 8: Updating route status...');
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

    // Step 9: Summary
    console.log('\n🎉 COMPREHENSIVE SCHEDULING COMPLETE!');
    console.log('='.repeat(50));
    console.log(`📊 Total trips created: ${createdTrips.length}`);
    console.log(`📅 Days scheduled: ${daysToSchedule}`);
    console.log(`🛣️ Routes processed: ${routes.length}`);
    console.log(`🚌 Buses used: ${buses.length}`);
    console.log(`👥 Drivers available: ${drivers.length}`);
    console.log(`👥 Conductors available: ${conductors.length}`);
    console.log(`🏃 Running trips today: ${todayTrips.length}`);
    console.log('='.repeat(50));

    console.log('\n📱 View your trips at:');
    console.log('   http://localhost:3000/admin/streamlined-trips');
    console.log('   http://localhost:3000/admin/streamlined-buses');
    console.log('   http://localhost:3000/admin/streamlined-routes');

    console.log('\n🌐 Passenger views:');
    console.log('   http://localhost:3000/ (Landing page with popular routes)');
    console.log('   http://localhost:3000/pax (Passenger dashboard)');

  } catch (error) {
    console.error('❌ Error during scheduling:', error);
    throw error;
  }
}

async function main() {
  try {
    await connectDB();
    await scheduleAllTripsAndRoutes();
    console.log('\n✅ All operations completed successfully!');
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

module.exports = { scheduleAllTripsAndRoutes };
