const mongoose = require('mongoose');
require('dotenv').config();

const Trip = require('./models/Trip');
const Route = require('./models/Route');
const Bus = require('./models/Bus');

async function checkTrips() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check all trips
    const trips = await Trip.find({})
      .populate('routeId', 'routeName routeNumber')
      .populate('busId', 'busNumber busType')
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`\n📊 Found ${trips.length} trips in database:`);
    trips.forEach((trip, index) => {
      console.log(`${index + 1}. ${trip.routeId?.routeName || 'No Route'} | ${trip.busId?.busNumber || 'No Bus'} | ${trip.serviceDate} | ${trip.status} | Fare: ₹${trip.fare}`);
    });

    // Check routes
    const routes = await Route.find({}).limit(5);
    console.log(`\n🛣️ Found ${routes.length} routes:`);
    routes.forEach((route, index) => {
      console.log(`${index + 1}. ${route.routeName} | ${route.startingPoint?.city} → ${route.endingPoint?.city}`);
    });

    // Check buses
    const buses = await Bus.find({}).limit(5);
    console.log(`\n🚌 Found ${buses.length} buses:`);
    buses.forEach((bus, index) => {
      console.log(`${index + 1}. ${bus.busNumber} | ${bus.busType} | Capacity: ${bus.capacity?.total || 'N/A'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTrips();
