const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Trip = require('./models/Trip');
const Route = require('./models/Route');
const Bus = require('./models/Bus');
const Depot = require('./models/Depot');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');

async function addBookings() {
  try {
    console.log('🚀 Creating bookings for ML testing...');

    // Get existing trips
    const trips = await Trip.find().limit(50).populate('route bus depot');
    
    if (trips.length === 0) {
      console.log('❌ No trips found! Creating sample trips first...');
      
      // Get or create basic data
      const DepotModel = require('./models/Depot');
      const BusModel = require('./models/Bus');
      const RouteModel = require('./models/Route');
      const UserModel = require('./models/User');
      
      let admin = await UserModel.findOne({ email: 'admin@yatrik.com' });
      if (!admin) {
        admin = await UserModel.create({
          name: 'Admin',
          email: 'admin@yatrik.com',
          password: '$2a$10$rKQXqZzL5BLXyzXLvm/nNeDd2LzdL6c7jJZ4JpV5YvZ8yJYxYvZ8yG',
          role: 'admin',
          isActive: true
        });
      }
      
      let depot = await DepotModel.findOne();
      if (!depot) {
        depot = await DepotModel.create({
          depotCode: 'DP001',
          depotName: 'Main Depot',
          location: { city: 'Mumbai', state: 'Maharashtra', address: '123 Main St' },
          status: 'active',
          createdBy: admin._id,
          depotId: 'DP001',
          depotLocation: 'Mumbai'
        });
      }
      
      // Create a simple route
      let route = await RouteModel.findOne();
      if (!route) {
        route = await RouteModel.create({
          routeName: 'Mumbai-Pune',
          routeNumber: 'MP001',
          startingPoint: { city: 'Mumbai', location: 'Mumbai Station' },
          endingPoint: { city: 'Pune', location: 'Pune Station' },
          totalDistance: 150,
          estimatedDuration: 180,
          farePerKm: 2,
          stops: [
            {
              stopId: 'S1',
              stopName: 'Mumbai',
              name: 'Mumbai Central',
              city: 'Mumbai',
              location: 'Mumbai Central',
              stopNumber: 1,
              sequence: 1,
              distanceFromPrev: 0,
              distanceFromStart: 0,
              estimatedArrival: 0,
              lat: 19.076,
              lng: 72.8777,
              isActive: true
            },
            {
              stopId: 'S2',
              stopName: 'Pune',
              name: 'Pune Station',
              city: 'Pune',
              location: 'Pune Junction',
              stopNumber: 2,
              sequence: 2,
              distanceFromPrev: 150,
              distanceFromStart: 150,
              estimatedArrival: 180,
              lat: 18.5204,
              lng: 73.8567,
              isActive: true
            }
          ],
          schedules: [
            {
              scheduleId: 'SCH1',
              departureTime: '08:00',
              arrivalTime: '11:00',
              createdBy: admin._id
            }
          ],
          status: 'active',
          createdBy: admin._id
        });
      }
      
      // Create a bus
      let bus = await BusModel.findOne();
      if (!bus) {
        bus = await BusModel.create({
          busNumber: 'KL01AB1234',
          busType: 'ac_seater',
          capacity: { total: 40, seater: 40 },
          status: 'active',
          depotId: depot._id,
          createdBy: admin._id
        });
      }
      
      // Create trips
      const newTrips = [];
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        
        newTrips.push({
          route: route._id,
          bus: bus._id,
          depot: depot._id,
          date,
          startTime: '08:00',
          endTime: '11:00',
          fare: 300,
          totalSeats: 40,
          availableSeats: Math.floor(Math.random() * 30) + 5,
          status: i === 0 ? 'in_progress' : 'scheduled',
          createdBy: admin._id
        });
      }
      
      const createdTrips = await Trip.insertMany(newTrips);
      console.log(`✅ Created ${createdTrips.length} trips`);
      
      // Now add bookings to these trips
      for (const trip of createdTrips) {
        const numBookings = Math.floor(Math.random() * 8) + 1;
        
        for (let i = 0; i < numBookings; i++) {
          const bookingId = `BK${Date.now()}${i}`;
          const bookingRef = `REF${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
          
          await Booking.create({
            bookingId,
            bookingReference: bookingRef,
            tripId: trip._id,
            routeId: route._id,
            busId: bus._id,
            depotId: depot._id,
            customer: {
              name: `Passenger ${i + 1}`,
              email: `passenger${i}@test.com`,
              phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
              age: Math.floor(Math.random() * 50) + 18
            },
            journey: {
              from: 'Mumbai',
              to: 'Pune',
              departureDate: trip.date,
              departureTime: trip.startTime,
              arrivalDate: trip.date,
              arrivalTime: trip.endTime
            },
            seats: [{ seatNumber: `A${i + 1}`, seatType: 'seater', price: trip.fare }],
            pricing: {
              baseFare: trip.fare,
              seatCharges: 0,
              taxes: 0,
              discounts: 0,
              total: trip.fare
            },
            baseFare: trip.fare,
            fare: trip.fare,
            status: 'confirmed',
            paymentStatus: 'paid',
            createdAt: new Date(trip.date.getTime() - Math.random() * 48 * 60 * 60 * 1000),
            createdBy: admin._id
          });
        }
      }
      
      console.log('✅ Created bookings');
    } else {
      // Add bookings to existing trips
      console.log(`✅ Found ${trips.length} existing trips`);
      
      let count = 0;
      for (const trip of trips) {
        if (!trip.route || !trip.bus || !trip.depot) continue;
        
        const numBookings = Math.floor(Math.random() * 5) + 1;
        
        for (let i = 0; i < numBookings; i++) {
          const bookingId = `BK${Date.now()}${count}`;
          const bookingRef = `REF${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
          
          await Booking.create({
            bookingId,
            bookingReference: bookingRef,
            tripId: trip._id,
            routeId: trip.route._id,
            busId: trip.bus._id,
            depotId: trip.depot._id,
            customer: {
              name: `Passenger ${i + 1}`,
              email: `passenger${count}@test.com`,
              phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
              age: Math.floor(Math.random() * 50) + 18
            },
            journey: {
              from: trip.route?.startingPoint?.city || 'Origin',
              to: trip.route?.endingPoint?.city || 'Destination',
              departureDate: trip.date,
              departureTime: trip.startTime,
              arrivalDate: trip.date,
              arrivalTime: trip.endTime
            },
            seats: [{ seatNumber: `A${i + 1}`, seatType: 'seater', price: trip.fare || 200 }],
            pricing: {
              baseFare: trip.fare || 200,
              seatCharges: 0,
              taxes: 0,
              discounts: 0,
              total: trip.fare || 200
            },
            baseFare: trip.fare || 200,
            fare: trip.fare || 200,
            status: 'confirmed',
            paymentStatus: 'paid',
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            createdBy: trip.createdBy
          });
          count++;
        }
      }
      
      console.log(`✅ Created ${count} bookings`);
    }

    const totalBookings = await Booking.countDocuments();
    console.log(`\n🎉 Total bookings in database: ${totalBookings}`);
    console.log('✅ Ready to run ML models!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addBookings();

