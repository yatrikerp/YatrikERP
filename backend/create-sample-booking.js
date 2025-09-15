const mongoose = require('mongoose');
const Booking = require('./models/Booking');
require('dotenv').config();

async function createSampleBooking() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('✅ Connected to MongoDB');

    // Create sample booking data
    const sampleBooking = {
      bookingId: 'PNR69154187',
      customer: {
        name: 'Guest Passenger',
        email: 'guest@example.com',
        phone: '+91-9876543210',
        age: 30,
        gender: 'male'
      },
      journey: {
        from: 'Kochi',
        to: 'Thiruvananthapuram',
        departureDate: new Date('2025-09-14'),
        departureTime: '08:00',
        arrivalTime: '14:00'
      },
      seats: [
        { seatNumber: 'U1', seatType: 'seater', price: 225 },
        { seatNumber: 'U2', seatType: 'seater', price: 225 }
      ],
      pricing: {
        baseFare: 400,
        seatCharges: 50,
        total: 450
      },
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: 'upi',
      createdAt: new Date()
    };

    // Check if booking already exists
    const existingBooking = await Booking.findOne({ bookingId: sampleBooking.bookingId });
    if (existingBooking) {
      console.log('✅ Sample booking already exists:', existingBooking.bookingId);
      return existingBooking;
    }

    // Create new booking
    const booking = new Booking(sampleBooking);
    await booking.save();

    console.log('✅ Sample booking created successfully:', booking.bookingId);
    console.log('📋 Booking details:', {
      PNR: booking.bookingId,
      Customer: booking.customer.name,
      Journey: `${booking.journey.from} → ${booking.journey.to}`,
      Date: booking.journey.departureDate.toDateString(),
      Seats: booking.seats.map(s => s.seatNumber).join(', '),
      Total: `₹${booking.pricing.total}`
    });

    return booking;

  } catch (error) {
    console.error('❌ Error creating sample booking:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the function
createSampleBooking();
