const mongoose = require('mongoose');
require('dotenv').config();

const Trip = require('./models/Trip');

async function debugSearch() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('Connected to MongoDB');

    const from = 'vytila hub';
    const to = 'IDUKKI';
    const date = '2025-09-07';

    console.log('Searching for:', { from, to, date });

    // Test direct query
    const directQuery = {
      status: 'scheduled',
      bookingOpen: true,
      from: { $regex: from, $options: 'i' },
      to: { $regex: to, $options: 'i' }
    };

    console.log('Direct query:', JSON.stringify(directQuery, null, 2));

    const trips = await Trip.find(directQuery);
    console.log('Found trips:', trips.length);
    
    if (trips.length > 0) {
      console.log('Trip data:', JSON.stringify(trips[0], null, 2));
    }

    // Test date query
    const searchDate = new Date(date);
    const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));
    
    console.log('Date range:', { startOfDay, endOfDay });

    const dateQuery = {
      ...directQuery,
      serviceDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    };

    console.log('Date query:', JSON.stringify(dateQuery, null, 2));

    const tripsWithDate = await Trip.find(dateQuery);
    console.log('Found trips with date:', tripsWithDate.length);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugSearch();
