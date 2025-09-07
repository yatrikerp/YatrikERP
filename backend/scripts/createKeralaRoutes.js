const mongoose = require('mongoose');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const Bus = require('../models/Bus');
const Depot = require('../models/Depot');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const keralaRoutes = [
  {
    routeNumber: 'KL001',
    routeName: 'Kochi - Thiruvananthapuram Express',
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
    estimatedDuration: 240, // 4 hours
    intermediateStops: [
      {
        city: 'Alappuzha',
        location: 'Alappuzha Bus Station',
        stopNumber: 1,
        distanceFromStart: 60,
        estimatedArrival: 80,
        coordinates: { latitude: 9.4981, longitude: 76.3388 }
      },
      {
        city: 'Kollam',
        location: 'Kollam Bus Station',
        stopNumber: 2,
        distanceFromStart: 140,
        estimatedArrival: 160,
        coordinates: { latitude: 8.8932, longitude: 76.6141 }
      }
    ],
    baseFare: 350,
    farePerKm: 1.5,
    features: ['AC', 'WiFi', 'USB_Charging', 'Refreshments'],
    status: 'active'
  },
  {
    routeNumber: 'KL002',
    routeName: 'Kozhikode - Kochi Coastal Route',
    startingPoint: {
      city: 'Kozhikode',
      location: 'Kozhikode Central Bus Station',
      coordinates: { latitude: 11.2588, longitude: 75.7804 }
    },
    endingPoint: {
      city: 'Kochi',
      location: 'Kochi Central Bus Station',
      coordinates: { latitude: 9.9312, longitude: 76.2673 }
    },
    totalDistance: 180,
    estimatedDuration: 210, // 3.5 hours
    intermediateStops: [
      {
        city: 'Thrissur',
        location: 'Thrissur Bus Station',
        stopNumber: 1,
        distanceFromStart: 90,
        estimatedArrival: 105,
        coordinates: { latitude: 10.5276, longitude: 76.2144 }
      },
      {
        city: 'Ernakulam',
        location: 'Ernakulam Bus Station',
        stopNumber: 2,
        distanceFromStart: 150,
        estimatedArrival: 180,
        coordinates: { latitude: 9.9312, longitude: 76.2673 }
      }
    ],
    baseFare: 280,
    farePerKm: 1.4,
    features: ['AC', 'WiFi', 'Entertainment'],
    status: 'active'
  },
  {
    routeNumber: 'KL003',
    routeName: 'Kochi - Idukki Hill Station Express',
    startingPoint: {
      city: 'Kochi',
      location: 'Kochi Central Bus Station',
      coordinates: { latitude: 9.9312, longitude: 76.2673 }
    },
    endingPoint: {
      city: 'Idukki',
      location: 'Idukki Bus Station',
      coordinates: { latitude: 9.8497, longitude: 76.9681 }
    },
    totalDistance: 120,
    estimatedDuration: 180, // 3 hours
    intermediateStops: [
      {
        city: 'Kothamangalam',
        location: 'Kothamangalam Bus Station',
        stopNumber: 1,
        distanceFromStart: 40,
        estimatedArrival: 50,
        coordinates: { latitude: 10.0652, longitude: 76.6304 }
      },
      {
        city: 'Munnar',
        location: 'Munnar Bus Station',
        stopNumber: 2,
        distanceFromStart: 80,
        estimatedArrival: 120,
        coordinates: { latitude: 10.0889, longitude: 77.0595 }
      }
    ],
    baseFare: 250,
    farePerKm: 2.0,
    features: ['AC', 'WiFi', 'USB_Charging', 'Refreshments'],
    status: 'active'
  },
  {
    routeNumber: 'KL004',
    routeName: 'Thiruvananthapuram - Kozhikode Mountain Express',
    startingPoint: {
      city: 'Thiruvananthapuram',
      location: 'Thiruvananthapuram Central Bus Station',
      coordinates: { latitude: 8.5241, longitude: 76.9366 }
    },
    endingPoint: {
      city: 'Kozhikode',
      location: 'Kozhikode Central Bus Station',
      coordinates: { latitude: 11.2588, longitude: 75.7804 }
    },
    totalDistance: 380,
    estimatedDuration: 420, // 7 hours
    intermediateStops: [
      {
        city: 'Kottayam',
        location: 'Kottayam Bus Station',
        stopNumber: 1,
        distanceFromStart: 80,
        estimatedArrival: 100,
        coordinates: { latitude: 9.5916, longitude: 76.5222 }
      },
      {
        city: 'Thrissur',
        location: 'Thrissur Bus Station',
        stopNumber: 2,
        distanceFromStart: 180,
        estimatedArrival: 220,
        coordinates: { latitude: 10.5276, longitude: 76.2144 }
      },
      {
        city: 'Palakkad',
        location: 'Palakkad Bus Station',
        stopNumber: 3,
        distanceFromStart: 280,
        estimatedArrival: 320,
        coordinates: { latitude: 10.7867, longitude: 76.6548 }
      }
    ],
    baseFare: 550,
    farePerKm: 1.6,
    features: ['AC', 'WiFi', 'USB_Charging', 'Entertainment', 'Refreshments'],
    status: 'active'
  }
];

const createSampleBuses = async (depotId) => {
  const buses = [
    {
      busNumber: 'KL-BUS-001',
      depotId: depotId,
      busType: 'ac_sleeper',
      capacity: {
        total: 45,
        sleeper: 45,
        seater: 0
      },
      registrationNumber: 'KL-01-AB-1234',
      amenities: ['wifi', 'charging', 'entertainment', 'ac'],
      specifications: {
        manufacturer: 'Tata',
        model: 'Starbus',
        year: 2022,
        fuelType: 'diesel'
      },
      status: 'active',
      assignedBy: new mongoose.Types.ObjectId()
    },
    {
      busNumber: 'KL-BUS-002',
      depotId: depotId,
      busType: 'ac_seater',
      capacity: {
        total: 40,
        sleeper: 0,
        seater: 40
      },
      registrationNumber: 'KL-02-CD-5678',
      amenities: ['wifi', 'entertainment', 'ac'],
      specifications: {
        manufacturer: 'Ashok Leyland',
        model: 'Viking',
        year: 2021,
        fuelType: 'diesel'
      },
      status: 'active',
      assignedBy: new mongoose.Types.ObjectId()
    },
    {
      busNumber: 'KL-BUS-003',
      depotId: depotId,
      busType: 'volvo',
      capacity: {
        total: 50,
        sleeper: 50,
        seater: 0
      },
      registrationNumber: 'KL-03-EF-9012',
      amenities: ['wifi', 'charging', 'entertainment', 'refreshments', 'ac'],
      specifications: {
        manufacturer: 'Volvo',
        model: 'B9R',
        year: 2023,
        fuelType: 'diesel'
      },
      status: 'active',
      assignedBy: new mongoose.Types.ObjectId()
    }
  ];

  const createdBuses = [];
  for (const busData of buses) {
    const existingBus = await Bus.findOne({ busNumber: busData.busNumber });
    if (!existingBus) {
      const bus = new Bus(busData);
      await bus.save();
      createdBuses.push(bus);
      console.log(`Created bus: ${bus.busNumber}`);
    } else {
      createdBuses.push(existingBus);
      console.log(`Bus already exists: ${busData.busNumber}`);
    }
  }
  return createdBuses;
};

const createSampleDepot = async () => {
  const depotData = {
    depotName: 'Kerala Central Depot',
    depotCode: 'KCD001',
    location: {
      city: 'Kochi',
      state: 'Kerala',
      address: 'Kochi Central Bus Station, Ernakulam',
      pincode: '682001',
      coordinates: { latitude: 9.9312, longitude: 76.2673 }
    },
    contact: {
      phone: '+91-484-1234567',
      email: 'kcd@yatrik.com',
      manager: {
        name: 'Kerala Depot Manager',
        phone: '+91-484-1234567',
        email: 'manager@kcd.yatrik.com'
      }
    },
    operatingHours: {
      openTime: '06:00',
      closeTime: '22:00'
    },
    capacity: {
      totalBuses: 50,
      availableBuses: 45
    },
    status: 'active',
    createdBy: new mongoose.Types.ObjectId() // Create a dummy ObjectId
  };

  let depot = await Depot.findOne({ depotCode: depotData.depotCode });
  if (!depot) {
    depot = new Depot(depotData);
    await depot.save();
    console.log(`Created depot: ${depot.depotName}`);
  } else {
    console.log(`Depot already exists: ${depotData.depotName}`);
  }
  return depot;
};

const createRoutes = async () => {
  try {
    console.log('Starting Kerala routes creation...');

    // Create sample depot
    const depot = await createSampleDepot();

    // Create sample buses
    const buses = await createSampleBuses(depot._id);

    // Clear existing routes
    await Route.deleteMany({ routeNumber: { $in: ['KL001', 'KL002', 'KL003', 'KL004'] } });
    console.log('Cleared existing Kerala routes');

    // Create routes
    for (let i = 0; i < keralaRoutes.length; i++) {
      const routeData = keralaRoutes[i];
      
      // Assign depot and buses
      routeData.depot = {
        depotId: depot._id,
        createdAt: new Date()
      };

      routeData.assignedBuses = [
        {
          busId: buses[i % buses.length]._id,
          busNumber: buses[i % buses.length].busNumber,
          capacity: buses[i % buses.length].capacity.total,
          busType: buses[i % buses.length].busType
        }
      ];

      routeData.depot = {
        depotId: depot._id,
        depotName: depot.depotName,
        depotLocation: depot.location.city,
        createdAt: new Date()
      };

      routeData.createdBy = new mongoose.Types.ObjectId();

      // Add default schedule
      routeData.schedules = [
        {
          scheduleId: `SCH_${routeData.routeNumber}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          departureTime: '08:00',
          arrivalTime: '12:00',
          frequency: 'daily',
          daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          isActive: true,
          createdBy: routeData.createdBy
        }
      ];

      // Create route
      const route = new Route(routeData);
      await route.save();
      console.log(`Created route: ${route.routeNumber} - ${route.routeName}`);

      // Create sample trips for next 7 days
      for (let day = 0; day < 7; day++) {
        const tripDate = new Date();
        tripDate.setDate(tripDate.getDate() + day);

        // Morning trip
        const morningTrip = new Trip({
          routeId: route._id,
          busId: buses[i % buses.length]._id,
          serviceDate: tripDate,
          startTime: '08:00',
          status: 'scheduled'
        });
        await morningTrip.save();

        // Evening trip
        const eveningTrip = new Trip({
          routeId: route._id,
          busId: buses[i % buses.length]._id,
          serviceDate: tripDate,
          startTime: '18:00',
          status: 'scheduled'
        });
        await eveningTrip.save();

        console.log(`Created trips for ${route.routeNumber} on ${tripDate.toDateString()}`);
      }
    }

    console.log('✅ Kerala routes and trips created successfully!');
    console.log('\nRoutes created:');
    keralaRoutes.forEach(route => {
      console.log(`- ${route.routeNumber}: ${route.routeName}`);
      console.log(`  From: ${route.startingPoint.city} To: ${route.endingPoint.city}`);
      console.log(`  Fare: ₹${route.baseFare} | Duration: ${route.estimatedDuration} minutes`);
    });

  } catch (error) {
    console.error('Error creating Kerala routes:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
createRoutes();
