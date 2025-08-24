// Script to create sample routes and trips for testing
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');

// Import models
const Route = require('./backend/models/Route');
const Trip = require('./backend/models/Trip');
const Depot = require('./backend/models/Depot');
const Bus = require('./backend/models/Bus');

async function createSampleData() {
  try {
    console.log('🚀 Creating sample data for YATRIK ERP...\n');

    // Create a sample depot if it doesn't exist
    let depot = await Depot.findOne({ name: 'Mumbai Central Depot' });
    if (!depot) {
      depot = new Depot({
        name: 'Mumbai Central Depot',
        code: 'MUM001',
        city: 'Mumbai',
        state: 'Maharashtra',
        address: 'Mumbai Central, Mumbai',
        contactNumber: '+91-22-12345678',
        email: 'mumbai@yatrik.com',
        status: 'active'
      });
      await depot.save();
      console.log('✅ Created depot:', depot.name);
    }

    // Create sample routes
    const sampleRoutes = [
      {
        routeNumber: 'MUM-PUN-001',
        routeName: 'Mumbai to Pune Express',
        startingPoint: { city: 'Mumbai', location: 'Mumbai Central' },
        endingPoint: { city: 'Pune', location: 'Pune Station' },
        totalDistance: 150,
        estimatedDuration: 180,
        intermediateStops: [
          { city: 'Thane', location: 'Thane Station', stopNumber: 1, distanceFromStart: 30, estimatedArrival: 45 },
          { city: 'Kalyan', location: 'Kalyan Junction', stopNumber: 2, distanceFromStart: 60, estimatedArrival: 90 }
        ],
        depot: { depotId: depot._id },
        status: 'active',
        baseFare: 300,
        busType: 'AC Sleeper'
      },
      {
        routeNumber: 'MUM-NAS-002',
        routeName: 'Mumbai to Nashik Express',
        startingPoint: { city: 'Mumbai', location: 'Mumbai Central' },
        endingPoint: { city: 'Nashik', location: 'Nashik Road' },
        totalDistance: 180,
        estimatedDuration: 240,
        intermediateStops: [
          { city: 'Thane', location: 'Thane Station', stopNumber: 1, distanceFromStart: 30, estimatedArrival: 45 },
          { city: 'Igatpuri', location: 'Igatpuri Station', stopNumber: 2, distanceFromStart: 120, estimatedArrival: 180 }
        ],
        depot: { depotId: depot._id },
        status: 'active',
        baseFare: 400,
        busType: 'AC Sleeper'
      },
      {
        routeNumber: 'MUM-GOA-003',
        routeName: 'Mumbai to Goa Express',
        startingPoint: { city: 'Mumbai', location: 'Mumbai Central' },
        endingPoint: { city: 'Goa', location: 'Panaji' },
        totalDistance: 600,
        estimatedDuration: 720,
        intermediateStops: [
          { city: 'Pune', location: 'Pune Station', stopNumber: 1, distanceFromStart: 150, estimatedArrival: 180 },
          { city: 'Kolhapur', location: 'Kolhapur Station', stopNumber: 2, distanceFromStart: 400, estimatedArrival: 480 }
        ],
        depot: { depotId: depot._id },
        status: 'active',
        baseFare: 800,
        busType: 'AC Sleeper'
      }
    ];

    // Create routes
    for (const routeData of sampleRoutes) {
      let route = await Route.findOne({ routeNumber: routeData.routeNumber });
      if (!route) {
        route = new Route(routeData);
        await route.save();
        console.log('✅ Created route:', route.routeName);
      }
    }

    // Create sample trips for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const sampleTrips = [
      {
        routeId: (await Route.findOne({ routeNumber: 'MUM-PUN-001' }))._id,
        serviceDate: tomorrow,
        startTime: '08:00',
        status: 'scheduled',
        depotId: depot._id
      },
      {
        routeId: (await Route.findOne({ routeNumber: 'MUM-PUN-001' }))._id,
        serviceDate: tomorrow,
        startTime: '14:00',
        status: 'scheduled',
        depotId: depot._id
      },
      {
        routeId: (await Route.findOne({ routeNumber: 'MUM-NAS-002' }))._id,
        serviceDate: tomorrow,
        startTime: '09:00',
        status: 'scheduled',
        depotId: depot._id
      },
      {
        routeId: (await Route.findOne({ routeNumber: 'MUM-GOA-003' }))._id,
        serviceDate: tomorrow,
        startTime: '20:00',
        status: 'scheduled',
        depotId: depot._id
      }
    ];

    // Create trips
    for (const tripData of sampleTrips) {
      let trip = await Trip.findOne({
        routeId: tripData.routeId,
        serviceDate: tripData.serviceDate,
        startTime: tripData.startTime
      });
      
      if (!trip) {
        trip = new Trip(tripData);
        await trip.save();
        console.log('✅ Created trip:', tripData.startTime, 'for route');
      }
    }

    console.log('\n🎉 Sample data created successfully!');
    console.log('📅 Trips scheduled for:', tomorrow.toDateString());
    console.log('🔍 You can now search for trips from Mumbai to Pune, Nashik, or Goa');
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
createSampleData();
