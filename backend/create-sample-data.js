const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./models/User');
const Trip = require('./models/Trip');
const Bus = require('./models/Bus');
const Depot = require('./models/Depot');
const Conductor = require('./models/Conductor');
const Driver = require('./models/Driver');
const Route = require('./models/Route');

async function createSampleData() {
  try {
    console.log('🚀 Creating sample routes and trips...');
    
    // Get existing data
    const buses = await Bus.find().limit(3);
    const depots = await Depot.find().limit(3);
    const drivers = await Driver.find().limit(3);
    const conductors = await Conductor.find().limit(3);
    
    console.log('📊 Found existing data:');
    console.log('Buses:', buses.length);
    console.log('Depots:', depots.length);
    console.log('Drivers:', drivers.length);
    console.log('Conductors:', conductors.length);
    
    if (buses.length === 0 || depots.length === 0) {
      console.log('❌ Need at least 1 bus and 1 depot to create routes');
      return;
    }
    
    // Create sample routes
    const routes = [
      {
        routeName: 'Mumbai to Pune Express',
        routeNumber: 'R001',
        startingPoint: {
          city: 'Mumbai',
          location: 'Mumbai Central Bus Stand',
          coordinates: { latitude: 19.0760, longitude: 72.8777 }
        },
        endingPoint: {
          city: 'Pune',
          location: 'Pune Bus Stand',
          coordinates: { latitude: 18.5204, longitude: 73.8567 }
        },
        totalDistance: 150,
        estimatedDuration: 180,
        status: 'active',
        baseFare: 50,
        farePerKm: 2.5,
        depot: {
          depotId: depots[0]._id,
          depotName: depots[0].depotName,
          depotLocation: depots[0].location || 'Mumbai Central'
        },
        createdBy: drivers[0]?._id || depots[0]?._id
      },
      {
        routeName: 'Delhi to Jaipur Highway',
        routeNumber: 'R002',
        startingPoint: {
          city: 'Delhi',
          location: 'Delhi Bus Terminal',
          coordinates: { latitude: 28.7041, longitude: 77.1025 }
        },
        endingPoint: {
          city: 'Jaipur',
          location: 'Jaipur Bus Stand',
          coordinates: { latitude: 26.9124, longitude: 75.7873 }
        },
        totalDistance: 280,
        estimatedDuration: 240,
        status: 'active',
        baseFare: 80,
        farePerKm: 2.2,
        depot: {
          depotId: depots[1]._id,
          depotName: depots[1].depotName,
          depotLocation: depots[1].location || 'Delhi Central'
        },
        createdBy: drivers[0]?._id || depots[0]?._id
      },
      {
        routeName: 'Bangalore to Chennai Coastal',
        routeNumber: 'R003',
        startingPoint: {
          city: 'Bangalore',
          location: 'Bangalore Bus Station',
          coordinates: { latitude: 12.9716, longitude: 77.5946 }
        },
        endingPoint: {
          city: 'Chennai',
          location: 'Chennai Central Bus Stand',
          coordinates: { latitude: 13.0827, longitude: 80.2707 }
        },
        totalDistance: 350,
        estimatedDuration: 300,
        status: 'active',
        baseFare: 100,
        farePerKm: 2.8,
        depot: {
          depotId: depots[2]._id,
          depotName: depots[2].depotName,
          depotLocation: depots[2].location || 'Bangalore Central'
        },
        createdBy: drivers[0]?._id || depots[0]?._id
      }
    ];
    
    // Create routes
    const createdRoutes = await Route.insertMany(routes);
    console.log('✅ Created', createdRoutes.length, 'routes');
    
    // Create sample trips for the next 7 days
    const trips = [];
    const today = new Date();
    
    for (let day = 0; day < 7; day++) {
      const serviceDate = new Date(today);
      serviceDate.setDate(today.getDate() + day);
      serviceDate.setHours(0, 0, 0, 0);
      
      for (let routeIndex = 0; routeIndex < createdRoutes.length; routeIndex++) {
        const route = createdRoutes[routeIndex];
        const bus = buses[routeIndex % buses.length];
        const driver = drivers[routeIndex % drivers.length];
        const conductor = conductors[routeIndex % conductors.length];
        const depot = depots[routeIndex % depots.length];
        
        // Create 2 trips per route per day (morning and evening)
        const timeSlots = [
          { start: '08:00', end: '11:00', status: 'scheduled' },
          { start: '14:00', end: '17:00', status: 'scheduled' }
        ];
        
        for (const timeSlot of timeSlots) {
          const trip = {
            routeId: route._id,
            busId: bus._id,
            driverId: driver._id,
            conductorId: conductor._id,
            depotId: depot._id,
            serviceDate: serviceDate,
            startTime: timeSlot.start,
            endTime: timeSlot.end,
            status: timeSlot.status,
            fare: Math.round(route.totalDistance * route.farePerKm),
            capacity: bus.capacity?.total || 40,
            availableSeats: bus.capacity?.total || 40,
            bookedSeats: Math.floor(Math.random() * 10), // Random bookings
            bookingOpen: true,
            estimatedDuration: route.estimatedDuration,
            createdBy: drivers[0]?._id || depots[0]?._id
          };
          
          trips.push(trip);
        }
      }
    }
    
    // Create trips
    const createdTrips = await Trip.insertMany(trips);
    console.log('✅ Created', createdTrips.length, 'trips');
    
    // Update some trips to different statuses
    const todayTrips = createdTrips.filter(trip => {
      const tripDate = new Date(trip.serviceDate);
      return tripDate.toDateString() === today.toDateString();
    });
    
    if (todayTrips.length > 0) {
      // Make some trips running
      const runningTrips = todayTrips.slice(0, 2);
      await Trip.updateMany(
        { _id: { $in: runningTrips.map(t => t._id) } },
        { status: 'running' }
      );
      console.log('✅ Updated', runningTrips.length, 'trips to running status');
      
      // Make some trips completed
      const completedTrips = todayTrips.slice(2, 4);
      await Trip.updateMany(
        { _id: { $in: completedTrips.map(t => t._id) } },
        { status: 'completed' }
      );
      console.log('✅ Updated', completedTrips.length, 'trips to completed status');
    }
    
    console.log('\n🎉 Sample data creation completed!');
    console.log('📊 Summary:');
    console.log('- Routes:', createdRoutes.length);
    console.log('- Trips:', createdTrips.length);
    console.log('- Trips for today:', todayTrips.length);
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    mongoose.connection.close();
  }
}

createSampleData();
