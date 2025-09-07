const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Trip = require('./models/Trip');

async function createSimpleTrips() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('Connected to MongoDB');

    // Create simple trips directly
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tripDates = [
      today.toISOString().split('T')[0],
      tomorrow.toISOString().split('T')[0]
    ];

    for (const date of tripDates) {
      // Check if trip already exists
      const existingTrip = await Trip.findOne({
        serviceDate: new Date(date)
      });

      if (!existingTrip) {
        const trip = new Trip({
          tripNumber: `TRP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          startTime: '22:00',
          endTime: '06:00',
          serviceDate: new Date(date),
          fare: 800,
          capacity: 30,
          availableSeats: 30,
          bookedSeats: 0,
          status: 'scheduled',
          bookingOpen: true,
          from: 'Bangalore',
          to: 'Chennai',
          routeName: 'Bangalore to Chennai'
        });

        await trip.save();
        console.log(`Created simple trip for ${date}`);
      }
    }

    console.log('Simple trips creation completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error creating simple trips:', error);
    process.exit(1);
  }
}

createSimpleTrips();
