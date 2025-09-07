const mongoose = require('mongoose');
require('dotenv').config();

const Trip = require('./models/Trip');

async function countTrips() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('Connected to MongoDB');

    const count = await Trip.countDocuments();
    console.log('Total trips in database:', count);

    if (count > 0) {
      const trip = await Trip.findOne();
      console.log('Sample trip:', JSON.stringify(trip, null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

countTrips();
