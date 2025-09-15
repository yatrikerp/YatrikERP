const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Depot = require('../models/Depot');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const Trip = require('../models/Trip');
const User = require('../models/User');

// Real Kerala routes data
const keralaRoutes = [
  {
    routeNumber: 'KTV-001',
    routeName: 'Kochi to Thiruvananthapuram Express',
    startingPoint: {
      city: 'Kochi',
      location: 'Kochi Central Bus Station',
      coordinates: { latitude: 9.9312, longitude: 76.2673 }
    },
    endingPoint: {
      city: 'Thiruvananthapuram',
      location: 'Thiruvananthapuram Central Bus Station',
      coordinates: { latitude: 8.5241, longitude: 76.9366 }
    },
    totalDistance: 220,
    estimatedDuration: 300, // 5 hours
    intermediateStops: [
      {
        city: 'Kollam',
        location: 'Kollam Bus Station',
        stopNumber: 1,
        distanceFromStart: 80,
        estimatedArrival: 120,
        coordinates: { latitude: 8.8932, longitude: 76.6141 }
      },
      {
        city: 'Kottayam',
        location: 'Kottayam Bus Station',
        stopNumber: 2,
        distanceFromStart: 150,
        estimatedArrival: 200,
        coordinates: { latitude: 9.5916, longitude: 76.5222 }
      }
    ]
  },
  {
    routeNumber: 'KKT-002',
    routeName: 'Kochi to Kottayam Local',
    startingPoint: {
      city: 'Kochi',
      location: 'Kochi Central Bus Station',
      coordinates: { latitude: 9.9312, longitude: 76.2673 }
    },
    endingPoint: {
      city: 'Kottayam',
      location: 'Kottayam Bus Station',
      coordinates: { latitude: 9.5916, longitude: 76.5222 }
    },
    totalDistance: 75,
    estimatedDuration: 120, // 2 hours
    intermediateStops: [
      {
        city: 'Aluva',
        location: 'Aluva Bus Station',
        stopNumber: 1,
        distanceFromStart: 25,
        estimatedArrival: 40,
        coordinates: { latitude: 10.1076, longitude: 76.3518 }
      },
      {
        city: 'Perumbavoor',
        location: 'Perumbavoor Bus Station',
        stopNumber: 2,
        distanceFromStart: 45,
        estimatedArrival: 70,
        coordinates: { latitude: 10.1153, longitude: 76.4760 }
      }
    ]
  },
  {
    routeNumber: 'KPL-003',
    routeName: 'Kochi to Palakkad Express',
    startingPoint: {
      city: 'Kochi',
      location: 'Kochi Central Bus Station',
      coordinates: { latitude: 9.9312, longitude: 76.2673 }
    },
    endingPoint: {
      city: 'Palakkad',
      location: 'Palakkad Bus Station',
      coordinates: { latitude: 10.7867, longitude: 76.6548 }
    },
    totalDistance: 180,
    estimatedDuration: 240, // 4 hours
    intermediateStops: [
      {
        city: 'Thrissur',
        location: 'Thrissur Bus Station',
        stopNumber: 1,
        distanceFromStart: 80,
        estimatedArrival: 100,
        coordinates: { latitude: 10.5276, longitude: 76.2144 }
      },
      {
        city: 'Ottapalam',
        location: 'Ottapalam Bus Station',
        stopNumber: 2,
        distanceFromStart: 140,
        estimatedArrival: 180,
        coordinates: { latitude: 10.7700, longitude: 76.3800 }
      }
    ]
  },
  {
    routeNumber: 'TVK-004',
    routeName: 'Thiruvananthapuram to Kochi Express',
    startingPoint: {
      city: 'Thiruvananthapuram',
      location: 'Thiruvananthapuram Central Bus Station',
      coordinates: { latitude: 8.5241, longitude: 76.9366 }
    },
    endingPoint: {
      city: 'Kochi',
      location: 'Kochi Central Bus Station',
      coordinates: { latitude: 9.9312, longitude: 76.2673 }
    },
    totalDistance: 220,
    estimatedDuration: 300, // 5 hours
    intermediateStops: [
      {
        city: 'Kollam',
        location: 'Kollam Bus Station',
        stopNumber: 1,
        distanceFromStart: 80,
        estimatedArrival: 120,
        coordinates: { latitude: 8.8932, longitude: 76.6141 }
      },
      {
        city: 'Kottayam',
        location: 'Kottayam Bus Station',
        stopNumber: 2,
        distanceFromStart: 150,
        estimatedArrival: 200,
        coordinates: { latitude: 9.5916, longitude: 76.5222 }
      }
    ]
  }
];

// Real Kerala buses data
const keralaBuses = [
  {
    busNumber: 'KL-01-AB-1234',
    registrationNumber: 'KL-01-AB-1234',
    busType: 'ac_sleeper',
    capacity: {
      total: 45,
      sleeper: 45,
      seater: 0,
      ladies: 8,
      disabled: 2
    },
    amenities: ['wifi', 'charging', 'entertainment', 'refreshments', 'ac'],
    specifications: {
      manufacturer: 'Volvo',
      model: 'B9R',
      year: 2023,
      engine: 'D8K 350 HP',
      fuelType: 'diesel',
      mileage: 6,
      maxSpeed: 100,
      length: 12.5,
      width: 2.55,
      height: 3.8
    }
  },
  {
    busNumber: 'KL-01-CD-5678',
    registrationNumber: 'KL-01-CD-5678',
    busType: 'ac_seater',
    capacity: {
      total: 45,
      sleeper: 0,
      seater: 45,
      ladies: 8,
      disabled: 2
    },
    amenities: ['wifi', 'charging', 'ac', 'refreshments'],
    specifications: {
      manufacturer: 'Scania',
      model: 'Metrolink',
      year: 2022,
      engine: 'DC13 450 HP',
      fuelType: 'diesel',
      mileage: 5.5,
      maxSpeed: 90,
      length: 12.0,
      width: 2.55,
      height: 3.6
    }
  },
  {
    busNumber: 'KL-01-EF-9012',
    registrationNumber: 'KL-01-EF-9012',
    busType: 'non_ac_seater',
    capacity: {
      total: 45,
      sleeper: 0,
      seater: 45,
      ladies: 8,
      disabled: 2
    },
    amenities: ['charging'],
    specifications: {
      manufacturer: 'Tata',
      model: 'Starbus',
      year: 2021,
      engine: 'Cummins 6BT',
      fuelType: 'diesel',
      mileage: 7,
      maxSpeed: 80,
      length: 11.5,
      width: 2.5,
      height: 3.4
    }
  }
];

async function createRealKeralaData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing Kerala data...');
    await Route.deleteMany({});
    await Bus.deleteMany({});
    await Trip.deleteMany({});

    // Find or create Kerala depot
    let depot = await Depot.findOne({ depotName: 'Kerala Central Depot' });
    if (!depot) {
      depot = await Depot.create({
        depotName: 'Kerala Central Depot',
        location: 'Kochi, Kerala',
        address: 'Kochi Central Bus Station, Kerala',
        contactNumber: '+91-484-1234567',
        email: 'kochi-depot@yatrik.com',
        status: 'active',
        coordinates: { latitude: 9.9312, longitude: 76.2673 }
      });
      console.log('Created Kerala depot:', depot.depotName);
    }

    // Create routes
    console.log('Creating Kerala routes...');
    const createdRoutes = [];
    for (const routeData of keralaRoutes) {
      const route = await Route.create({
        ...routeData,
        depot: {
          depotId: depot._id,
          depotName: depot.depotName,
          depotLocation: depot.location
        },
        schedules: [
          { day: 'monday', frequency: 'every_2_hours', startTime: '06:00', endTime: '22:00' },
          { day: 'tuesday', frequency: 'every_2_hours', startTime: '06:00', endTime: '22:00' },
          { day: 'wednesday', frequency: 'every_2_hours', startTime: '06:00', endTime: '22:00' },
          { day: 'thursday', frequency: 'every_2_hours', startTime: '06:00', endTime: '22:00' },
          { day: 'friday', frequency: 'every_2_hours', startTime: '06:00', endTime: '22:00' },
          { day: 'saturday', frequency: 'every_2_hours', startTime: '06:00', endTime: '22:00' },
          { day: 'sunday', frequency: 'every_2_hours', startTime: '06:00', endTime: '22:00' }
        ],
        status: 'active',
        createdBy: depot._id
      });
      createdRoutes.push(route);
      console.log(`Created route: ${route.routeName}`);
    }

    // Create buses
    console.log('Creating Kerala buses...');
    const createdBuses = [];
    for (const busData of keralaBuses) {
      const bus = await Bus.create({
        ...busData,
        depotId: depot._id,
        status: 'active',
        currentLocation: {
          latitude: 9.9312,
          longitude: 76.2673,
          lastUpdated: new Date(),
          speed: 0,
          heading: 0,
          stopName: 'Kochi Central Bus Station'
        }
      });
      createdBuses.push(bus);
      console.log(`Created bus: ${bus.busNumber}`);
    }

    // Create trips for the next 7 days
    console.log('Creating trips for next 7 days...');
    const today = new Date();
    const trips = [];

    for (let day = 0; day < 7; day++) {
      const tripDate = new Date(today);
      tripDate.setDate(today.getDate() + day);

      // Create trips for each route
      for (let i = 0; i < createdRoutes.length; i++) {
        const route = createdRoutes[i];
        const bus = createdBuses[i % createdBuses.length];

        // Morning trip
        trips.push({
          routeId: route._id,
          busId: bus._id,
          serviceDate: tripDate,
          startTime: '06:00',
          endTime: '11:00',
          fare: Math.round(50 + route.totalDistance * 2),
          capacity: bus.capacity.total,
          availableSeats: bus.capacity.total,
          bookedSeats: 0,
          status: 'scheduled',
          depotId: depot._id,
          createdBy: depot._id
        });

        // Afternoon trip
        trips.push({
          routeId: route._id,
          busId: bus._id,
          serviceDate: tripDate,
          startTime: '14:00',
          endTime: '19:00',
          fare: Math.round(50 + route.totalDistance * 2),
          capacity: bus.capacity.total,
          availableSeats: bus.capacity.total,
          bookedSeats: 0,
          status: 'scheduled',
          depotId: depot._id,
          createdBy: depot._id
        });

        // Evening trip
        trips.push({
          routeId: route._id,
          busId: bus._id,
          serviceDate: tripDate,
          startTime: '20:00',
          endTime: '01:00',
          fare: Math.round(50 + route.totalDistance * 2),
          capacity: bus.capacity.total,
          availableSeats: bus.capacity.total,
          bookedSeats: 0,
          status: 'scheduled',
          depotId: depot._id,
          createdBy: depot._id
        });
      }
    }

    const createdTrips = await Trip.create(trips);
    console.log(`Created ${createdTrips.length} trips`);

    console.log('✅ Real Kerala data created successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Routes: ${createdRoutes.length}`);
    console.log(`   - Buses: ${createdBuses.length}`);
    console.log(`   - Trips: ${createdTrips.length}`);
    console.log(`   - Depot: ${depot.depotName}`);

  } catch (error) {
    console.error('❌ Error creating Kerala data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  createRealKeralaData();
}

module.exports = createRealKeralaData;
