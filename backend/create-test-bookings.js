require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Trip = require('./models/Trip');
const Route = require('./models/Route');
const User = require('./models/User');
const Bus = require('./models/Bus');

const MONGODB_URI = process.env.MONGODB_URI;

async function createTestBookings() {
  try {
    console.log('🚀 Creating test bookings...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get existing trips
    const trips = await Trip.find({ status: { $in: ['running', 'scheduled'] } })
      .populate('routeId')
      .populate('busId')
      .limit(50)
      .lean();
    
    if (trips.length === 0) {
      console.log('❌ No trips found');
      return;
    }

    console.log(`Found ${trips.length} trips\n`);

    // Get or create a test user
    let testUser = await User.findOne({ email: 'test@yatrik.com' });
    if (!testUser) {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@yatrik.com',
        phone: '+919876543210',
        password: 'test123',
        role: 'passenger',
        status: 'active'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bookings = [];

    // Create bookings with different statuses
    trips.forEach((trip, idx) => {
      const tripDate = new Date(trip.serviceDate);
      const isPast = tripDate < today;
      const isToday = tripDate.toDateString() === today.toDateString();
      
      // Determine status based on date
      let status = 'confirmed';
      let paymentStatus = 'paid';
      
      if (idx < 15) {
        status = 'pending';
        paymentStatus = 'pending';
      } else if (isPast && idx < 30) {
        status = 'completed';
        paymentStatus = 'paid';
      }

      bookings.push({
        bookingId: `BK${Date.now()}${idx}`,
        customer: {
          name: getRandomName(),
          email: `passenger${idx}@example.com`,
          phone: `+91-98765${String(idx).padStart(5, '0')}`,
          age: 20 + (idx % 40),
          gender: idx % 2 === 0 ? 'male' : 'female'
        },
        journey: {
          from: trip.routeId?.startingPoint?.city || 'Kochi',
          to: trip.routeId?.endingPoint?.city || 'Thiruvananthapuram',
          departureDate: trip.serviceDate,
          departureTime: trip.startTime,
          arrivalTime: trip.endTime
        },
        seats: [
          { 
            seatNumber: `A${(idx % 10) + 1}`, 
            seatType: 'seater', 
            price: trip.fare || 200 
          }
        ],
        pricing: {
          baseFare: trip.fare || 200,
          seatCharges: 50,
          taxes: 25,
          total: (trip.fare || 200) + 75
        },
        tripId: trip._id,
        routeId: trip.routeId?._id,
        busId: trip.busId?._id,
        depotId: trip.depotId,
        status,
        paymentStatus,
        paymentMethod: ['upi', 'card', 'wallet'][idx % 3],
        createdAt: isPast ? new Date(Date.now() - (idx * 24 * 60 * 60 * 1000)) : new Date(),
        updatedAt: new Date()
      });
    });

    console.log('Creating bookings...\n');
    
    // Insert bookings
    const batchSize = 50;
    let inserted = 0;
    
    for (let i = 0; i < bookings.length; i += batchSize) {
      const batch = bookings.slice(i, i + batchSize);
      try {
        await Booking.insertMany(batch, { ordered: false });
        inserted += batch.length;
        process.stdout.write(`\r   Inserted ${inserted}/${bookings.length} bookings`);
      } catch (err) {
        console.error(`\nError: ${err.message}`);
      }
    }

    const pendingCount = bookings.filter(b => b.status === 'pending').length;
    const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
    const completedCount = bookings.filter(b => b.status === 'completed').length;
    const totalRevenue = bookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + b.pricing.total, 0);

    console.log('\n\n✅ TEST BOOKINGS CREATED!');
    console.log(`📊 Total: ${inserted} bookings`);
    console.log(`⏳ Pending: ${pendingCount}`);
    console.log(`✅ Confirmed: ${confirmedCount}`);
    console.log(`✔️  Completed: ${completedCount}`);
    console.log(`💰 Total Revenue: ₹${totalRevenue}`);
    console.log(`\n🎉 Dashboard is now populated!`);

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

function getRandomName() {
  const names = [
    'John Doe', 'Jane Smith', 'Akhil Raj', 'Priya Menon', 'Mohammed Ali',
    'Sarah George', 'Rajesh Kumar', 'Anjali Nair', 'David Wilson', 'Lisa Brown',
    'Manoj Gopal', 'Deepa Krishnan', 'Vikram Singh', 'Meera Pillai', 'Ravi Das'
  ];
  return names[Math.floor(Math.random() * names.length)];
}

createTestBookings();

