const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');

const db = mongoose.connection;

// Kerala routes data
const keralaRoutes = [
  {
    routeName: 'Thiruvananthapuram - Kochi',
    routeNumber: 'TVM-CKI-001',
    startingPoint: { city: 'Thiruvananthapuram', location: 'Thampanoor KSRTC', coordinates: { latitude: 8.5241, longitude: 76.9366 } },
    endingPoint: { city: 'Kochi', location: 'Kaloor KSRTC', coordinates: { latitude: 9.9390, longitude: 76.2705 } },
    totalDistance: 200,
    estimatedDuration: 240,
    farePerKm: 2.2,
    status: 'active'
  },
  {
    routeName: 'Kochi - Kozhikode',
    routeNumber: 'CKI-KZK-002',
    startingPoint: { city: 'Kochi', location: 'Kaloor KSRTC', coordinates: { latitude: 9.9390, longitude: 76.2705 } },
    endingPoint: { city: 'Kozhikode', location: 'Mofussil Bus Stand', coordinates: { latitude: 11.2588, longitude: 75.7804 } },
    totalDistance: 185,
    estimatedDuration: 240,
    farePerKm: 2.0,
    status: 'active'
  },
  {
    routeName: 'Kozhikode - Kannur',
    routeNumber: 'KZK-CAN-003',
    startingPoint: { city: 'Kozhikode', location: 'Mofussil Bus Stand', coordinates: { latitude: 11.2588, longitude: 75.7804 } },
    endingPoint: { city: 'Kannur', location: 'Central Bus Stand', coordinates: { latitude: 11.8745, longitude: 75.3704 } },
    totalDistance: 93,
    estimatedDuration: 120,
    farePerKm: 2.0,
    status: 'active'
  },
  {
    routeName: 'Kochi - Thiruvananthapuram',
    routeNumber: 'CKI-TVM-004',
    startingPoint: { city: 'Kochi', location: 'Kaloor KSRTC', coordinates: { latitude: 9.9390, longitude: 76.2705 } },
    endingPoint: { city: 'Thiruvananthapuram', location: 'Thampanoor KSRTC', coordinates: { latitude: 8.5241, longitude: 76.9366 } },
    totalDistance: 200,
    estimatedDuration: 240,
    farePerKm: 2.2,
    status: 'active'
  },
  {
    routeName: 'Kochi - Thrissur',
    routeNumber: 'CKI-TSR-005',
    startingPoint: { city: 'Kochi', location: 'Kaloor KSRTC', coordinates: { latitude: 9.9390, longitude: 76.2705 } },
    endingPoint: { city: 'Thrissur', location: 'Sakthan Stand', coordinates: { latitude: 10.5276, longitude: 76.2144 } },
    totalDistance: 85,
    estimatedDuration: 120,
    farePerKm: 2.1,
    status: 'active'
  },
  {
    routeName: 'Thiruvananthapuram - Alappuzha',
    routeNumber: 'TVM-ALP-006',
    startingPoint: { city: 'Thiruvananthapuram', location: 'Thampanoor KSRTC', coordinates: { latitude: 8.5241, longitude: 76.9366 } },
    endingPoint: { city: 'Alappuzha', location: 'Central Bus Stand', coordinates: { latitude: 9.4981, longitude: 76.3388 } },
    totalDistance: 140,
    estimatedDuration: 180,
    farePerKm: 2.0,
    status: 'active'
  },
  {
    routeName: 'Kochi - Kottayam',
    routeNumber: 'CKI-KTM-007',
    startingPoint: { city: 'Kochi', location: 'Kaloor KSRTC', coordinates: { latitude: 9.9390, longitude: 76.2705 } },
    endingPoint: { city: 'Kottayam', location: 'Central Bus Stand', coordinates: { latitude: 9.5916, longitude: 76.5222 } },
    totalDistance: 75,
    estimatedDuration: 100,
    farePerKm: 2.1,
    status: 'active'
  },
  {
    routeName: 'Kozhikode - Palakkad',
    routeNumber: 'KZK-PKD-008',
    startingPoint: { city: 'Kozhikode', location: 'Mofussil Bus Stand', coordinates: { latitude: 11.2588, longitude: 75.7804 } },
    endingPoint: { city: 'Palakkad', location: 'RS Road Bus Stand', coordinates: { latitude: 10.7867, longitude: 76.6548 } },
    totalDistance: 80,
    estimatedDuration: 120,
    farePerKm: 2.0,
    status: 'active'
  }
];

db.once('open', async () => {
  try {
    console.log('🚀 Creating Kerala Routes and ML Test Data...\n');

    // Get or create admin user
    const User = require('./models/User');
    let adminUser = await User.findOne({ email: 'admin@yatrik.com' });
    
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Admin',
        email: 'admin@yatrik.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin',
        isActive: true
      });
      console.log('✅ Created admin user');
    } else {
      console.log('✅ Using existing admin user');
    }

    // Get or create depot
    const Depot = require('./models/Depot');
    let depot = await Depot.findOne();
    
    if (!depot) {
      depot = await Depot.create({
        depotCode: 'KER001',
        depotName: 'Kerala Central Depot',
        location: { city: 'Thiruvananthapuram', state: 'Kerala', address: 'Thampanoor' },
        status: 'active',
        createdBy: adminUser._id
      });
      console.log('✅ Created depot');
    } else {
      console.log('✅ Using existing depot');
    }

    // Create buses
    const Bus = require('./models/Bus');
    let buses = await Bus.find();
    
    if (buses.length === 0) {
      buses = await Bus.insertMany([
        {
          busNumber: 'KL01AB1234',
          busType: 'ac_seater',
          capacity: { total: 45, seater: 45 },
          status: 'active',
          depotId: depot._id,
          createdBy: adminUser._id
        },
        {
          busNumber: 'KL02CD5678',
          busType: 'ac_sleeper',
          capacity: { total: 30, sleeper: 30 },
          status: 'active',
          depotId: depot._id,
          createdBy: adminUser._id
        },
        {
          busNumber: 'KL03EF9012',
          busType: 'ordinary',
          capacity: { total: 50, seater: 50 },
          status: 'active',
          depotId: depot._id,
          createdBy: adminUser._id
        }
      ]);
      console.log(`✅ Created ${buses.length} buses`);
    } else {
      console.log(`✅ Using existing ${buses.length} buses`);
    }

    // Create routes
    const Route = require('./models/Route');
    await Route.deleteMany({});
    
    const createdRoutes = [];
    for (const routeData of keralaRoutes) {
      const stops = [
        {
          stopId: `ST${routeData.routeNumber}-1`,
          stopName: routeData.startingPoint.city,
          name: routeData.startingPoint.location,
          city: routeData.startingPoint.city,
          location: routeData.startingPoint.location,
          stopNumber: 1,
          sequence: 1,
          distanceFromPrev: 0,
          distanceFromStart: 0,
          estimatedArrival: 0,
          lat: routeData.startingPoint.coordinates.latitude,
          lng: routeData.startingPoint.coordinates.longitude,
          coordinates: routeData.startingPoint.coordinates,
          isActive: true
        },
        {
          stopId: `ST${routeData.routeNumber}-2`,
          stopName: routeData.endingPoint.city,
          name: routeData.endingPoint.location,
          city: routeData.endingPoint.city,
          location: routeData.endingPoint.location,
          stopNumber: 2,
          sequence: 2,
          distanceFromPrev: routeData.totalDistance,
          distanceFromStart: routeData.totalDistance,
          estimatedArrival: routeData.estimatedDuration,
          lat: routeData.endingPoint.coordinates.latitude,
          lng: routeData.endingPoint.coordinates.longitude,
          coordinates: routeData.endingPoint.coordinates,
          isActive: true
        }
      ];
      
      const route = await Route.create({
        ...routeData,
        stops,
        depot: {
          depotId: depot._id,
          depotName: depot.depotName,
          depotLocation: depot.location?.city || 'Kerala'
        },
        baseFare: Math.round(routeData.totalDistance * routeData.farePerKm),
        schedules: [{
          scheduleId: `SCH-${routeData.routeNumber}`,
          departureTime: '06:00',
          arrivalTime: routeData.estimatedDuration >= 240 ? '12:00' : '10:00',
          frequency: 'daily',
          createdBy: adminUser._id
        }],
        createdBy: adminUser._id
      });
      
      createdRoutes.push(route);
    }
    
    console.log(`✅ Created ${createdRoutes.length} Kerala routes\n`);

    // Create trips for next 60 days
    const Trip = require('./models/Trip');
    await Trip.deleteMany({});
    
    const trips = [];
    const today = new Date();
    
    for (let day = 0; day < 60; day++) {
      const tripDate = new Date(today);
      tripDate.setDate(today.getDate() + day);
      
      for (const route of createdRoutes) {
        const timeSlots = [
          { start: '06:00', end: route.estimatedDuration >= 240 ? '12:00' : '10:00' },
          { start: '10:00', end: route.estimatedDuration >= 240 ? '16:00' : '14:00' },
          { start: '15:00', end: route.estimatedDuration >= 240 ? '21:00' : '19:00' },
          { start: '21:00', end: route.estimatedDuration >= 240 ? '03:00' : '23:00' }
        ];
        
        for (const slot of timeSlots) {
          const bus = buses[Math.floor(Math.random() * buses.length)];
          
          trips.push({
            routeId: route._id,
            busId: bus._id,
            depotId: depot._id,
            serviceDate: tripDate,
            startTime: slot.start,
            endTime: slot.end,
            fare: Math.round(route.totalDistance * route.farePerKm),
            capacity: bus.capacity.total,
            availableSeats: Math.floor(Math.random() * 30) + 5,
            bookedSeats: bus.capacity.total - Math.floor(Math.random() * 30) - 5,
            status: day === 0 ? 'scheduled' : 'scheduled',
            createdBy: adminUser._id
          });
        }
      }
    }
    
    const createdTrips = await Trip.insertMany(trips);
    console.log(`✅ Created ${createdTrips.length} trips\n`);

    // Create bookings
    const Booking = require('./models/Booking');
    await Booking.deleteMany({});
    
    const passengerNames = [
      'Rohit Kumar', 'Anjali Nair', 'Suresh Pillai', 'Priya Menon',
      'Rajesh Kurup', 'Meera Das', 'Ajith Karthikeyan', 'Deepa Iyer',
      'Manoj Nambiar', 'Kavya Unnikrishnan', 'Vijay Gopal', 'Saranya S'
    ];
    
    let bookingCount = 0;
    for (const trip of createdTrips.slice(0, 500)) {
      const numBookings = Math.floor(Math.random() * 8) + 1;
      
      for (let i = 0; i < numBookings && bookingCount < 1000; i++) {
        const passengerName = passengerNames[Math.floor(Math.random() * passengerNames.length)];
        const bookingId = `BK${Date.now()}${bookingCount}`;
        const bookingRef = `REF${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const bookingDate = new Date(trip.serviceDate);
        bookingDate.setHours(bookingDate.getHours() - Math.floor(Math.random() * 48));
        
        await Booking.create({
          bookingId,
          bookingReference: bookingRef,
          tripId: trip._id,
          routeId: trip.routeId,
          busId: trip.busId,
          depotId: trip.depotId,
          customer: {
            name: passengerName,
            email: `${passengerName.toLowerCase().replace(' ', '.')}@gmail.com`,
            phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            age: Math.floor(Math.random() * 50) + 20,
            gender: ['male', 'female'][Math.floor(Math.random() * 2)]
          },
          journey: {
            from: 'Thiruvananthapuram',
            to: 'Kochi',
            departureDate: trip.serviceDate,
            departureTime: trip.startTime,
            arrivalDate: trip.serviceDate,
            arrivalTime: trip.endTime,
            duration: 180
          },
          seats: [{
            seatNumber: `${['A','B','C'][Math.floor(Math.random() * 3)]}${Math.floor(Math.random() * 20) + 1}`,
            seatType: 'seater',
            seatPosition: ['window', 'aisle', 'middle'][Math.floor(Math.random() * 3)],
            passengerName: passengerName,
            passengerAge: Math.floor(Math.random() * 50) + 20,
            passengerGender: ['male', 'female'][Math.floor(Math.random() * 2)],
            price: trip.fare
          }],
          pricing: {
            baseFare: trip.fare,
            seatFare: trip.fare,
            taxes: { gst: 0, serviceTax: 0, other: 0 },
            discounts: { earlyBird: 0, loyalty: 0, promo: 0, other: 0 },
            totalAmount: trip.fare,
            paidAmount: trip.fare
          },
          payment: {
            method: 'upi',
            paymentStatus: 'completed',
            transactionId: `TXN${Date.now()}${bookingCount}`,
            paidAt: bookingDate
          },
          status: 'confirmed',
          createdAt: bookingDate,
          createdBy: adminUser._id
        });
        
        bookingCount++;
      }
    }
    
    console.log(`✅ Created ${bookingCount} bookings\n`);
    
    console.log('🎉 KERALA ML TEST DATA COMPLETE!');
    console.log(`📊 Summary:`);
    console.log(`   - Routes: ${createdRoutes.length}`);
    console.log(`   - Buses: ${buses.length}`);
    console.log(`   - Trips: ${createdTrips.length}`);
    console.log(`   - Bookings: ${bookingCount}`);
    console.log(`\n🚀 Ready to run ML models!`);
    console.log(`   Run: curl -X POST http://localhost:5001/run_all`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
});

db.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
  process.exit(1);
});

