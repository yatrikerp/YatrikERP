require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Trip = require('./models/Trip');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connected to MongoDB');
  
  const count = await Booking.countDocuments();
  console.log(`Bookings in database: ${count}`);
  
  if (count === 0) {
    console.log('No bookings found. Creating 50 bookings...');
    
    const trips = await Trip.find().limit(50);
    const bookings = [];
    
    for (let i = 0; i < 50; i++) {
      const trip = trips[i % trips.length];
      bookings.push({
        bookingId: `YTK${Date.now()}-${i}`,
        customer: { name: `Customer ${i+1}`, email: `c${i}@test.com`, phone: `+91987${i}543` },
        journey: { from: 'Origin', to: 'Destination', departureDate: trip.serviceDate, departureTime: trip.startTime },
        seats: [{ seatNumber: `A${i%10}`, seatType: 'seater', price: 250 }],
        pricing: { baseFare: 200, total: 250 },
        tripId: trip._id,
        routeId: trip.routeId,
        status: i < 15 ? 'pending' : 'confirmed',
        paymentStatus: i < 15 ? 'pending' : 'paid',
        paymentMethod: 'upi'
      });
    }
    
    await Booking.insertMany(bookings);
    console.log(`Created ${bookings.length} bookings!`);
  }
  
  const stats = await Promise.all([
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'pending' }),
    Booking.countDocuments({ status: 'confirmed' })
  ]);
  
  console.log(`\nStats: Total=${stats[0]}, Pending=${stats[1]}, Confirmed=${stats[2]}`);
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});


