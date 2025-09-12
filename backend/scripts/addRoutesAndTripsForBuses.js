const mongoose = require('mongoose');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const Bus = require('../models/Bus');
const Depot = require('../models/Depot');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Sample routes for Kerala buses
const keralaRoutes = [
  {
    routeNumber: 'KL-001',
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
    routeNumber: 'KL-002',
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
    routeNumber: 'KL-003',
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
    routeNumber: 'KL-004',
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

const createRoutesAndTrips = async () => {
  try {
    console.log('🚌 Starting to add routes and trips for existing buses...');

    // Find or create a default user for the createdBy field
    let defaultUser = await User.findOne({ role: 'admin' });
    if (!defaultUser) {
      defaultUser = await User.findOne({ email: 'admin@yatrik.com' });
    }
    if (!defaultUser) {
      defaultUser = new User({
        name: 'System Admin',
        email: 'admin@yatrik.com',
        password: 'admin123',
        role: 'admin',
        phone: '+91-98765-43210',
        authProvider: 'local',
        isActive: true
      });
      await defaultUser.save();
      console.log('✅ Created default admin user');
    } else {
      console.log('✅ Using existing admin user:', defaultUser.email);
    }

    // Find or create a Kerala depot
    let depot = await Depot.findOne({ depotCode: 'KCD001' });
    if (!depot) {
      depot = new Depot({
        depotCode: 'KCD001',
        depotName: 'Kerala Central Depot',
        location: {
          address: 'Kochi Central Bus Station, Ernakulam',
          city: 'Kochi',
          state: 'Kerala',
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
          availableBuses: 45,
          maintenanceBuses: 5
        },
        facilities: ['Fuel_Station', 'Maintenance_Bay', 'Washing_Bay', 'Parking_Lot', 'Driver_Rest_Room'],
        status: 'active',
        createdBy: defaultUser._id
      });
      await depot.save();
      console.log('✅ Created Kerala depot:', depot.depotName);
    } else {
      console.log('✅ Using existing depot:', depot.depotName);
    }

    // Find the existing buses from the image
    const existingBuses = await Bus.find({
      $or: [
        { busNumber: 'KL-76-BC-9076' },
        { busNumber: 'KL-76-CD-9722' },
        { busNumber: 'KL-76-DE-8633' },
        { busNumber: 'KL06K0355' }
      ]
    });

    console.log(`\n📋 Found ${existingBuses.length} existing buses:`);
    existingBuses.forEach(bus => {
      console.log(`- ${bus.busNumber}: ${bus.busType} (${bus.capacity.total} seats)`);
    });

    if (existingBuses.length === 0) {
      console.log('❌ No buses found with the specified numbers. Creating sample buses...');
      
      // Create the buses from the image
      const busData = [
        {
          busNumber: 'KL-76-BC-9076',
          registrationNumber: 'KL76BC8923',
          depotId: depot._id,
          busType: 'ac_sleeper',
          capacity: {
            total: 40,
            sleeper: 40,
            seater: 0
          },
          amenities: ['wifi', 'charging', 'entertainment', 'ac', 'refreshments'],
          specifications: {
            manufacturer: 'Tata',
            model: 'Starbus AC Sleeper',
            year: 2022,
            fuelType: 'diesel',
            mileage: 8.5
          },
          status: 'active',
          assignedBy: defaultUser._id
        },
        {
          busNumber: 'KL-76-CD-9722',
          registrationNumber: 'KL76CD7858',
          depotId: depot._id,
          busType: 'non_ac_seater',
          capacity: {
            total: 60,
            sleeper: 0,
            seater: 60
          },
          amenities: ['charging', 'toilet'],
          specifications: {
            manufacturer: 'Ashok Leyland',
            model: 'Viking',
            year: 2021,
            fuelType: 'diesel',
            mileage: 9.2
          },
          status: 'maintenance',
          assignedBy: defaultUser._id
        },
        {
          busNumber: 'KL-76-DE-8633',
          registrationNumber: 'KL76DE3481',
          depotId: depot._id,
          busType: 'ac_seater',
          capacity: {
            total: 45,
            sleeper: 0,
            seater: 45
          },
          amenities: ['wifi', 'charging', 'entertainment', 'ac'],
          specifications: {
            manufacturer: 'Volvo',
            model: 'B9R',
            year: 2023,
            fuelType: 'diesel',
            mileage: 8.8
          },
          status: 'active',
          assignedBy: defaultUser._id
        },
        {
          busNumber: 'KL06K0355',
          registrationNumber: 'KL06K0355',
          depotId: depot._id,
          busType: 'ac_seater',
          capacity: {
            total: 40,
            sleeper: 10,
            seater: 30
          },
          amenities: ['wifi', 'charging', 'entertainment', 'ac', 'refreshments'],
          specifications: {
            manufacturer: 'Tata',
            model: 'Starbus AC',
            year: 2022,
            fuelType: 'diesel',
            mileage: 8.3
          },
          status: 'active',
          assignedBy: defaultUser._id
        }
      ];

      for (const bus of busData) {
        const existingBus = await Bus.findOne({ busNumber: bus.busNumber });
        if (!existingBus) {
          const newBus = new Bus(bus);
          await newBus.save();
          existingBuses.push(newBus);
          console.log(`✅ Created bus: ${newBus.busNumber}`);
        }
      }
    }

    // Update buses to belong to the depot
    for (const bus of existingBuses) {
      if (bus.depotId.toString() !== depot._id.toString()) {
        bus.depotId = depot._id;
        await bus.save();
        console.log(`✅ Updated bus ${bus.busNumber} to belong to ${depot.depotName}`);
      }
    }

    // Clear existing routes for these buses
    await Route.deleteMany({ routeNumber: { $in: ['KL-001', 'KL-002', 'KL-003', 'KL-004'] } });
    console.log('🧹 Cleared existing routes');

    // Create routes and assign buses
    const createdRoutes = [];
    for (let i = 0; i < keralaRoutes.length && i < existingBuses.length; i++) {
      const routeData = keralaRoutes[i];
      const bus = existingBuses[i];

      // Prepare route data
      const routeInfo = {
        ...routeData,
        depot: {
          depotId: depot._id,
          depotName: depot.depotName,
          depotLocation: depot.location.city
        },
        assignedBuses: [{
          busId: bus._id,
          busNumber: bus.busNumber,
          capacity: bus.capacity.total,
          busType: bus.busType
        }],
        schedules: [{
          scheduleId: `SCH_${routeData.routeNumber}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          departureTime: '08:00',
          arrivalTime: routeData.routeNumber === 'KL-004' ? '15:00' : '12:00',
          frequency: 'daily',
          daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          isActive: true,
          createdBy: defaultUser._id
        }],
        createdBy: defaultUser._id
      };

      // Create route
      const route = new Route(routeInfo);
      await route.save();
      createdRoutes.push(route);
      console.log(`✅ Created route: ${route.routeNumber} - ${route.routeName}`);
      console.log(`   📍 From: ${route.startingPoint.city} To: ${route.endingPoint.city}`);
      console.log(`   🚌 Assigned bus: ${bus.busNumber} (${bus.busType})`);
      console.log(`   💰 Base fare: ₹${route.baseFare} | Duration: ${route.estimatedDuration} minutes`);

      // Update bus with route assignment
      bus.currentRoute = {
        routeId: route._id,
        routeName: route.routeName,
        routeNumber: route.routeNumber,
        assignedAt: new Date(),
        assignedBy: defaultUser._id
      };
      await bus.save();

      // Create trips for the next 7 days
      console.log(`   📅 Creating trips for next 7 days...`);
      for (let day = 0; day < 7; day++) {
        const tripDate = new Date();
        tripDate.setDate(tripDate.getDate() + day);

        // Morning trip
        const morningTrip = new Trip({
          routeId: route._id,
          busId: bus._id,
          serviceDate: tripDate,
          startTime: '08:00',
          endTime: routeData.routeNumber === 'KL-004' ? '15:00' : '12:00',
          fare: route.baseFare,
          capacity: bus.capacity.total,
          depotId: depot._id,
          createdBy: defaultUser._id,
          status: 'scheduled'
        });
        await morningTrip.save();

        // Evening trip (if bus is not in maintenance)
        if (bus.status !== 'maintenance') {
          const eveningTrip = new Trip({
            routeId: route._id,
            busId: bus._id,
            serviceDate: tripDate,
            startTime: '18:00',
            endTime: routeData.routeNumber === 'KL-004' ? '01:00' : '22:00',
            fare: route.baseFare,
            capacity: bus.capacity.total,
            depotId: depot._id,
            createdBy: defaultUser._id,
            status: 'scheduled'
          });
          await eveningTrip.save();
        }

        console.log(`     ✅ Created ${bus.status === 'maintenance' ? '1' : '2'} trip(s) for ${tripDate.toDateString()}`);
      }
    }

    // Create additional trips for buses that don't have routes yet
    if (existingBuses.length > keralaRoutes.length) {
      console.log(`\n🔄 Creating additional trips for remaining buses...`);
      for (let i = keralaRoutes.length; i < existingBuses.length; i++) {
        const bus = existingBuses[i];
        const route = createdRoutes[i % createdRoutes.length]; // Assign to existing routes

        // Update bus with route assignment
        bus.currentRoute = {
          routeId: route._id,
          routeName: route.routeName,
          routeNumber: route.routeNumber,
          assignedAt: new Date(),
          assignedBy: defaultUser._id
        };
        await bus.save();

        console.log(`✅ Assigned bus ${bus.busNumber} to route ${route.routeNumber}`);

        // Create trips for this bus
        for (let day = 0; day < 7; day++) {
          const tripDate = new Date();
          tripDate.setDate(tripDate.getDate() + day);

          if (bus.status !== 'maintenance') {
            const trip = new Trip({
              routeId: route._id,
              busId: bus._id,
              serviceDate: tripDate,
              startTime: '10:00',
              endTime: '14:00',
              fare: route.baseFare,
              capacity: bus.capacity.total,
              depotId: depot._id,
              createdBy: defaultUser._id,
              status: 'scheduled'
            });
            await trip.save();
          }
        }
      }
    }

    console.log('\n🎉 Successfully completed adding routes and trips!');
    console.log('\n📊 Summary:');
    console.log(`- Created ${createdRoutes.length} routes`);
    console.log(`- Assigned ${existingBuses.length} buses to routes`);
    console.log(`- Created trips for the next 7 days`);
    console.log('\n🚌 Bus assignments:');
    existingBuses.forEach((bus, index) => {
      const route = index < createdRoutes.length ? createdRoutes[index] : createdRoutes[index % createdRoutes.length];
      console.log(`- ${bus.busNumber} → ${route.routeNumber} (${route.routeName})`);
    });

  } catch (error) {
    console.error('❌ Error creating routes and trips:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the script
createRoutesAndTrips();
