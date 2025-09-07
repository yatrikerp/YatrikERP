const mongoose = require('mongoose');
require('dotenv').config();

const Trip = require('./models/Trip');

async function testSearchNoDate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('Connected to MongoDB');

    const from = 'vytila hub';
    const to = 'IDUKKI';

    // Test without date filter
    const query = {
      status: 'scheduled',
      bookingOpen: true,
      'routeId.startingPoint.city': { $regex: from, $options: 'i' },
      'routeId.endingPoint.city': { $regex: to, $options: 'i' }
    };

    console.log('Search query (no date):', JSON.stringify(query, null, 2));

    const trips = await Trip.find(query)
      .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
      .lean();

    console.log('Found trips (no date):', trips.length);
    
    if (trips.length > 0) {
      console.log('Trip data:', JSON.stringify(trips[0], null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testSearchNoDate();
