const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp';
mongoose.connect(uri);

const db = mongoose.connection;

db.once('open', async () => {
  try {
    console.log('✅ Connected to MongoDB');
    
    // Get existing data
    const Trip = mongoose.model('Trip', new mongoose.Schema({}, { strict: false }));
    const trips = await Trip.find().limit(10);
    
    console.log(`📊 Found ${trips.length} trips`);
    
    if (trips.length === 0) {
      console.log('❌ No trips found. Creating sample trips first...');
      
      // Create a minimal trip
      const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
      let user = await User.findOne({ role: 'admin' });
      
      if (!user) {
        const bcrypt = require('bcryptjs');
        user = await User.create({
          name: 'Admin',
          email: 'admin@yatrik.com',
          password: await bcrypt.hash('admin123', 10),
          role: 'admin',
          isActive: true
        });
      }
      
      const Depot = mongoose.model('Depot', new mongoose.Schema({}, { strict: false }));
      let depot = await Depot.findOne();
      
      if (!depot) {
        depot = await Depot.create({
          depotCode: 'DP001',
          depotName: 'Main Depot',
          location: { city: 'Mumbai', state: 'Maharashtra' },
          status: 'active',
          createdBy: user._id
        });
      }
      
      const Bus = mongoose.model('Bus', new mongoose.Schema({}, { strict: false }));
      let bus = await Bus.findOne();
      
      if (!bus) {
        bus = await Bus.create({
          busNumber: 'KL01AB1234',
          busType: 'ac_seater',
          capacity: { total: 40, seater: 40 },
          status: 'active',
          depotId: depot._id,
          createdBy: user._id
        });
      }
      
      const Route = mongoose.model('Route', new mongoose.Schema({}, { strict: false }));
      let route = await Route.findOne();
      
      if (!route) {
        route = await Route.create({
          routeName: 'Mumbai - Pune',
          routeNumber: 'MP001',
          startingPoint: { 
            city: 'Mumbai', 
            location: 'Mumbai Central Station',
            coordinates: { latitude: 19.076, longitude: 72.8777 }
          },
          endingPoint: { 
            city: 'Pune', 
            location: 'Pune Junction',
            coordinates: { latitude: 18.5204, longitude: 73.8567 }
          },
          totalDistance: 150,
          estimatedDuration: 180,
          farePerKm: 2,
          status: 'active',
          createdBy: user._id,
          stops: []
        });
      }
      
      // Create trips
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const tripDate = new Date(today);
        tripDate.setDate(today.getDate() + i);
        
        await Trip.create({
          route: route._id,
          bus: bus._id,
          depot: depot._id,
          date: tripDate,
          startTime: '08:00',
          endTime: '11:00',
          fare: 300,
          totalSeats: 40,
          availableSeats: Math.floor(Math.random() * 30) + 5,
          status: 'scheduled',
          createdBy: user._id
        });
      }
      
      console.log('✅ Created 7 sample trips');
    }
    
    // Get all trips
    const allTrips = await Trip.find();
    console.log(`📊 Total trips: ${allTrips.length}`);
    
    // Create bookings
    const Booking = mongoose.model('Booking', new mongoose.Schema({}, { strict: false }));
    
    const bookingCount = await Booking.countDocuments();
    console.log(`📊 Current bookings: ${bookingCount}`);
    
    if (bookingCount >= 200) {
      console.log('✅ Already have enough bookings');
    } else {
      const bookingsToAdd = 200 - bookingCount;
      console.log(`📝 Adding ${bookingsToAdd} bookings...`);
      
      let count = 0;
      for (const trip of allTrips.slice(0, 20)) {
        const numBookings = Math.floor(Math.random() * 5) + 2;
        
        for (let i = 0; i < numBookings && count < bookingsToAdd; i++) {
          const bookingId = `BK${Date.now()}${count}`;
          const bookingRef = `REF${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
          
          try {
            await Booking.create({
              bookingId,
              bookingReference: bookingRef,
              tripId: trip._id || trip.route,
              routeId: trip.route,
              busId: trip.bus,
              depotId: trip.depot,
              customer: {
                name: `Passenger ${count + 1}`,
                email: `passenger${count}@example.com`,
                phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
                age: Math.floor(Math.random() * 50) + 18
              },
              journey: {
                from: 'Mumbai',
                to: 'Pune',
                departureDate: trip.date,
                departureTime: trip.startTime || '08:00',
                arrivalDate: trip.date,
                arrivalTime: trip.endTime || '11:00'
              },
              seats: [{ seatNumber: `A${count + 1}`, seatType: 'seater', price: trip.fare || 300 }],
              pricing: {
                baseFare: trip.fare || 300,
                seatCharges: 0,
                taxes: 0,
                discounts: 0,
                total: trip.fare || 300
              },
              baseFare: trip.fare || 300,
              fare: trip.fare || 300,
              status: 'confirmed',
              paymentStatus: 'paid',
              createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
              createdBy: trip.createdBy || mongoose.Types.ObjectId()
            });
            count++;
          } catch (err) {
            console.log(`   ⚠️ Skipped booking ${count}: ${err.message.substring(0, 50)}`);
          }
        }
      }
      
      console.log(`✅ Created ${count} bookings`);
    }
    
    const total = await Booking.countDocuments();
    console.log(`\n🎉 Total bookings now: ${total}`);
    console.log('\n✅ Ready to run ML models!');
    console.log('🚀 Run: curl -X POST http://localhost:5001/run_all');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
});

db.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
  process.exit(1);
});

