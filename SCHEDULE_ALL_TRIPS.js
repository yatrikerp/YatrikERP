/**
 * SCHEDULE ALL TRIPS FOR POPULAR ROUTES
 * This script will create trips for all active routes
 * Run this to ensure popular routes show up with live trips
 */

const mongoose = require('mongoose');
const Trip = require('./backend/models/Trip');
const Route = require('./backend/models/Route');
const Bus = require('./backend/models/Bus');
const Driver = require('./backend/models/Driver');
const Conductor = require('./backend/models/Conductor');

require('dotenv').config({ path: './backend/.env' });

async function scheduleAllTrips() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get today and next 30 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const daysToSchedule = 30;
    const timeSlots = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

    // Get all active routes
    const routes = await Route.find({ isActive: true }).limit(50);
    console.log(`📋 Found ${routes.length} active routes`);

    if (routes.length === 0) {
      console.log('❌ No active routes found. Please create routes first.');
      process.exit(1);
    }

    // Get all buses
    const buses = await Bus.find({ status: { $in: ['active', 'available'] } });
    console.log(`🚌 Found ${buses.length} active buses`);

    // Get all drivers and conductors
    const drivers = await Driver.find({ status: 'active' });
    const conductors = await Conductor.find({ status: 'active' });
    console.log(`👥 Found ${drivers.length} drivers, ${conductors.length} conductors`);

    if (buses.length === 0) {
      console.log('❌ No active buses found. Please create buses first.');
      process.exit(1);
    }

    let totalTripsCreated = 0;
    const tripsToInsert = [];

    // Create trips for each route for the next 30 days
    for (let day = 0; day < daysToSchedule; day++) {
      const serviceDate = new Date(today);
      serviceDate.setDate(today.getDate() + day);

      // Create 2-3 trips per route per day
      for (let tripIndex = 0; tripIndex < 3; tripIndex++) {
        routes.forEach((route, routeIndex) => {
          // Select random bus, driver, and conductor
          const randomBus = buses[Math.floor(Math.random() * buses.length)];
          const randomDriver = drivers[Math.floor(Math.random() * drivers.length)] || null;
          const randomConductor = conductors[Math.floor(Math.random() * conductors.length)] || null;

          const timeSlot = timeSlots[tripIndex % timeSlots.length];
          
          // Calculate end time (default 3 hours journey)
          const [hours, minutes] = timeSlot.split(':').map(Number);
          const endHours = (hours + 3) % 24;
          const endTime = `${String(endHours).padStart(2, '0')}:${minutes}`;

          // Calculate fare based on distance
          const distanceKm = route.totalDistance || route.distance || 100;
          const baseFare = route.baseFare || 100;
          const farePerKm = route.farePerKm || 2;
          const fare = Math.round(baseFare + distanceKm * farePerKm);

          // Get capacity
          const capacity = randomBus.capacity?.total || 45;

          const trip = {
            routeId: route._id,
            busId: randomBus._id,
            driverId: randomDriver?._id,
            conductorId: randomConductor?._id,
            serviceDate: serviceDate,
            startTime: timeSlot,
            endTime: endTime,
            fare: fare,
            capacity: capacity,
            availableSeats: capacity,
            bookedSeats: 0,
            status: 'scheduled',
            bookingOpen: true,
            depotId: route.depot?.depotId || route.depotId || randomBus.depotId,
            notes: `Auto-scheduled trip for ${route.routeName} - Day ${day + 1}`,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          tripsToInsert.push(trip);
        });
      }

      if ((day + 1) % 7 === 0) {
        console.log(`📅 Progress: ${day + 1}/${daysToSchedule} days...`);
      }
    }

    // Insert trips in batches
    console.log(`\n🚀 Creating ${tripsToInsert.length} trips...`);
    
    if (tripsToInsert.length > 0) {
      const result = await Trip.insertMany(tripsToInsert, { ordered: false });
      totalTripsCreated = result.length;
      console.log(`✅ Successfully created ${totalTripsCreated} trips!`);
    }

    // Show popular routes that will appear
    const popularRoutesSummary = await Trip.aggregate([
      {
        $match: {
          serviceDate: { $gte: today },
          status: 'scheduled',
          bookingOpen: true
        }
      },
      {
        $group: {
          _id: '$routeId',
          tripCount: { $sum: 1 },
          minFare: { $min: '$fare' }
        }
      },
      {
        $lookup: {
          from: 'routes',
          localField: '_id',
          foreignField: '_id',
          as: 'route'
        }
      },
      {
        $unwind: '$route'
      },
      {
        $sort: { tripCount: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          routeName: '$route.routeName',
          tripCount: 1,
          minFare: 1
        }
      }
    ]);

    console.log('\n📊 Top Popular Routes (with trips):');
    popularRoutesSummary.forEach((route, index) => {
      console.log(`${index + 1}. ${route.routeName} - ${route.tripCount} trips, From ₹${route.minFare}`);
    });

    console.log('\n✅ All trips scheduled successfully!');
    console.log('🌐 Popular routes will now appear with live trip data');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Run the script
scheduleAllTrips();


