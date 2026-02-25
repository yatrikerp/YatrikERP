const mongoose = require('mongoose');
require('dotenv').config();

const Booking = require('./models/Booking');
const Trip = require('./models/Trip');
const User = require('./models/User');
const Route = require('./models/Route');
const Bus = require('./models/Bus');
const Depot = require('./models/Depot');

async function createSamplePassengerBookings() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a passenger user
    let passengerUser = await User.findOne({ role: 'passenger' });
    if (!passengerUser) {
      console.log('📝 Creating sample passenger user...');
      passengerUser = new User({
        name: 'Akhil Shluo',
        email: 'akhil.shluo@example.com',
        phone: '+91-9876543210',
        role: 'passenger',
        password: 'hashedpassword123', // In real app, this would be hashed
        isActive: true
      });
      await passengerUser.save();
      console.log('✅ Sample passenger user created');
    }

    // Find available trips
    const trips = await Trip.find({ status: 'scheduled' })
      .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
      .populate('busId', 'busNumber busType')
      .populate('depotId', 'depotName')
      .limit(3)
      .lean();

    if (trips.length === 0) {
      console.log('❌ No scheduled trips found. Please create some trips first.');
      return;
    }

    console.log(`📋 Found ${trips.length} trips to create bookings for`);

    // Create sample bookings
    const sampleBookings = [];

    for (let i = 0; i < Math.min(trips.length, 3); i++) {
      const trip = trips[i];
      const route = trip.routeId;
      const bus = trip.busId;

      // Check if booking already exists for this user and trip
      const existingBooking = await Booking.findOne({
        createdBy: passengerUser._id,
        tripId: trip._id
      });

      if (existingBooking) {
        console.log(`⏭️ Booking already exists for trip ${trip._id}, skipping...`);
        continue;
      }

      const bookingId = `BK${Date.now().toString().slice(-8)}${i}`;
      const bookingReference = `REF${Date.now().toString().slice(-8)}${i}`;

      const bookingData = {
        bookingId: bookingId,
        bookingReference: bookingReference,
        createdBy: passengerUser._id,
        tripId: trip._id,
        routeId: trip.routeId._id,
        busId: trip.busId._id,
        depotId: trip.depotId._id,
        customer: {
          name: passengerUser.name,
          email: passengerUser.email,
          phone: passengerUser.phone,
          age: 28,
          gender: 'male'
        },
        journey: {
          from: route?.startingPoint?.city || route?.startingPoint || 'Kochi',
          to: route?.endingPoint?.city || route?.endingPoint || 'Thiruvananthapuram',
          departureDate: trip.serviceDate || new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          departureTime: trip.startTime || '08:00',
          arrivalDate: trip.serviceDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
          arrivalTime: trip.endTime || '14:00',
          duration: 360 // 6 hours
        },
        seats: [
          {
            seatNumber: `A${i + 1}`,
            seatType: 'seater',
            seatPosition: 'window',
            price: trip.fare || 450,
            passengerName: passengerUser.name,
            passengerAge: 28,
            passengerGender: 'male'
          }
        ],
        pricing: {
          baseFare: trip.fare || 400,
          seatFare: trip.fare || 450,
          taxes: {
            gst: 50,
            serviceTax: 25
          },
          totalAmount: (trip.fare || 450) + 75,
          paidAmount: i === 0 ? (trip.fare || 450) + 75 : 0 // First booking is paid
        },
        payment: {
          method: 'upi',
          paymentStatus: i === 0 ? 'completed' : 'pending',
          transactionId: i === 0 ? `txn_${Date.now()}` : null,
          paidAt: i === 0 ? new Date() : null
        },
        status: i === 0 ? 'confirmed' : (i === 1 ? 'pending' : 'confirmed'),
        source: 'web',
        createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)) // Stagger creation dates
      };

      const booking = new Booking(bookingData);
      await booking.save();
      sampleBookings.push(booking);

      console.log(`✅ Created booking ${booking.bookingId} for trip ${route?.routeName || 'Unknown Route'}`);
    }

    console.log(`\n🎯 Summary:`);
    console.log(`- Created ${sampleBookings.length} sample bookings`);
    console.log(`- Passenger: ${passengerUser.name} (${passengerUser.email})`);
    console.log(`- Bookings: ${sampleBookings.map(b => b.bookingId).join(', ')}`);
    
    console.log('\n📱 Test the passenger dashboard:');
    console.log('1. Login as passenger with email:', passengerUser.email);
    console.log('2. Visit the passenger dashboard');
    console.log('3. Check "Upcoming Trips" and "Recent Activity" sections');
    console.log('4. Verify bookings are displayed correctly');

    console.log('\n🔗 API Endpoints to test:');
    console.log('- GET /api/passenger/dashboard');
    console.log('- GET /api/passenger/tickets');
    console.log('- GET /api/passenger/bookings');
    console.log('- GET /api/booking/my-bookings');

  } catch (error) {
    console.error('❌ Error creating sample bookings:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
createSamplePassengerBookings();