const mongoose = require('mongoose');
require('dotenv').config();

const Trip = require('./models/Trip');

async function debugTrip() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('Connected to MongoDB');

    // Find any trip
    const trip = await Trip.findOne();
    console.log('Trip found:', trip ? 'Yes' : 'No');
    
    if (trip) {
      console.log('Trip fields:', Object.keys(trip.toObject()));
      console.log('Trip data:', JSON.stringify(trip.toObject(), null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugTrip();
