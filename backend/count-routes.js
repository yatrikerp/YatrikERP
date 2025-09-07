const mongoose = require('mongoose');
require('dotenv').config();

const Route = require('./models/Route');
const Trip = require('./models/Trip');

async function countRoutes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('Connected to MongoDB');

    const routeCount = await Route.countDocuments();
    console.log('Total routes in database:', routeCount);

    const tripCount = await Trip.countDocuments();
    console.log('Total trips in database:', tripCount);

    if (routeCount > 0) {
      const route = await Route.findOne();
      console.log('Sample route:', JSON.stringify(route, null, 2));
    }

    if (tripCount > 0) {
      const trip = await Trip.findOne();
      console.log('Sample trip:', JSON.stringify(trip, null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

countRoutes();
