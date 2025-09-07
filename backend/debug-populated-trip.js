const mongoose = require('mongoose');
require('dotenv').config();

const Trip = require('./models/Trip');
const Route = require('./models/Route');

async function debugPopulatedTrip() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('Connected to MongoDB');

    const trip = await Trip.findOne()
      .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
      .lean();

    console.log('Trip with populated routeId:', JSON.stringify(trip, null, 2));

    // Test the search query
    const from = 'vytila hub';
    const to = 'IDUKKI';
    const date = '2025-09-07';

    const searchDate = new Date(date);
    const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));

    const query = {
      status: 'scheduled',
      bookingOpen: true,
      serviceDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      'routeId.startingPoint.city': { $regex: from, $options: 'i' },
      'routeId.endingPoint.city': { $regex: to, $options: 'i' }
    };

    console.log('Search query:', JSON.stringify(query, null, 2));

    const trips = await Trip.find(query)
      .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
      .lean();

    console.log('Found trips:', trips.length);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugPopulatedTrip();
