require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Trip = require('./models/Trip');
const Route = require('./models/Route');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI;

async function createMoreBookings() {
  try {
    console.log('🚀 Creating more bookings...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get existing trips
    const trips = await Trip.find({ 
      status: { $in: ['running', 'scheduled'] } 
    })
      .populate('routeId')
      .populate('busId')
      .limit(100)
      .lean();
    
    if (trips.length === 0) {
      console.log('❌ No trips found');
      return;
    }

    console.log(`Found ${trips.length} trips\n`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bookings = [];
    const names = ['Akhil Shijo', 'John Doe', 'Jane Smith', 'Raj Kumar', 'Priya Menon', 'Rahul Das', 'Sara George', 'Mohammed Ali', 'Anjali Nair', 'David Wilson'];

    for (let i = 0; i < 100; i++) {
      const trip = trips[i % trips.length];
      const tripDate = new Date(trip.serviceDate);
      const isPast = tripDate < today;
      
      let status = 'confirmed';
      let paymentStatus = 'paid';
      
      if (i < 20) {
        status = 'pending';
        paymentStatus = 'pending';
      } else if (isPast && i < 60) {
        status = 'completed';
        paymentStatus = 'paid';
      } else if (i < 5) {
        status = 'cancelled';
        paymentStatus = 'refunded';
      }

      const fare = trip.fare || 200;
      const baseFare = Math.round(fare * 0.8);
      const total = Math.round(fare * (1 + 0.1 + 0.05));

      bookings.push({
        bookingId: `YTK${Date.now()}${i.toString().padStart(3, '0')}`,
        bookingReference: `REF${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        customer: {
          name: names[i % names.length],
          email: `passenger${i}@example.com`,
          phone: `+91-98765${String(i).padStart(5, '0')}`,
          age: 20 + (i % 40),
          gender: i % 2 === 0 ? 'male' : 'female'
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
            seatNumber: `A${(i % 15) + 1}`, 
            seatType: 'seater', 
            price: fare 
          }
        ],
        pricing: {
          baseFare: baseFare,
          seatCharges: Math.round(fare * 0.1),
          taxes: Math.round(fare * 0.05),
          total: total
        },
        tripId: trip._id,
        routeId: trip.routeId?._id,
        busId: trip.busId?._id,
        depotId: trip.depotId,
        status,
        paymentStatus,
        paymentMethod: ['upi', 'card', 'wallet', 'cash'][i % 4],
        createdAt: isPast ? new Date(Date.now() - (i * 24 * 60 * 60 * 1000)) : new Date(),
        updatedAt: new Date()
      });
    }

    console.log('Creating 100 bookings...\n');
    
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
    const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;
    const totalRevenue = bookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + b.pricing.total, 0);

    console.log('\n\n✅ BOOKINGS CREATED!');
    console.log(`📊 Total: ${inserted} bookings`);
    console.log(`⏳ Pending: ${pendingCount}`);
    console.log(`✅ Confirmed: ${confirmedCount}`);
    console.log(`✔️  Completed: ${completedCount}`);
    console.log(`❌ Cancelled: ${cancelledCount}`);
    console.log(`💰 Total Revenue: ₹${totalRevenue}`);
    console.log(`\n🎉 Admin dashboard is now populated!`);
    console.log(`\n📱 Visit: http://localhost:3000/admin/bookings`);
    console.log(`📊 Visit: http://localhost:3000/admin`);

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

createMoreBookings();

