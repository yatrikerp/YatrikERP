const mongoose = require('mongoose');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const Trip = require('../models/Trip');
const Depot = require('../models/Depot');
const User = require('../models/User');
const DepotUser = require('../models/DepotUser');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  try {
    await createSampleData();
    console.log('Sample data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating sample data:', error);
    process.exit(1);
  }
});

async function createSampleData() {
  // Clear existing data
  console.log('Clearing existing sample data...');
  
  // Drop all collections to ensure clean state
  try {
    await Route.collection.drop();
    console.log('Dropped routes collection');
  } catch (error) {
    console.log('Routes collection already dropped or empty');
  }
  
  try {
    await Bus.collection.drop();
    console.log('Dropped buses collection');
  } catch (error) {
    console.log('Buses collection already dropped or empty');
  }
  
  try {
    await Trip.collection.drop();
    console.log('Dropped trips collection');
  } catch (error) {
    console.log('Trips collection already dropped or empty');
  }
  
  // First, create a default user for the createdBy field
  let defaultUser = await User.findOne({ email: 'admin@yatrik.com' });
  if (!defaultUser) {
    try {
      defaultUser = await User.create({
        name: 'System Admin',
        email: 'admin@yatrik.com',
        password: 'admin123',
        role: 'admin',
        phone: '+91-98765-43210',
        authProvider: 'local',
        isActive: true
      });
      console.log('Created default user:', defaultUser.email);
    } catch (error) {
      console.error('Error creating default user:', error.message);
      throw error;
    }
  } else {
    console.log('Using existing default user:', defaultUser.email);
  }

  // Ensure defaultUser exists
  if (!defaultUser || !defaultUser._id) {
    throw new Error('Failed to create or find default user');
  }
  
  // Create sample depot if it doesn't exist
  let depot = await Depot.findOne({ depotName: 'Central Transport Hub' });
  if (!depot) {
    depot = await Depot.create({
      depotCode: 'MUM-CENTRAL-001',
      depotName: 'Central Transport Hub',
      location: {
        address: 'Station Road, Mumbai Central',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400008',
        coordinates: { latitude: 19.0760, longitude: 72.8777 }
      },
      contact: {
        phone: '+91-22-2307-0000',
        email: 'central@yatrik.com',
        manager: {
          name: 'Rajesh Kumar',
          phone: '+91-98765-43210',
          email: 'rajesh.kumar@yatrik.com'
        }
      },
      capacity: {
        totalBuses: 50,
        availableBuses: 45,
        maintenanceBuses: 5
      },
      operatingHours: {
        openTime: '05:00',
        closeTime: '23:00',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      facilities: ['Fuel_Station', 'Maintenance_Bay', 'Washing_Bay', 'Parking_Lot', 'Driver_Rest_Room', 'Canteen', 'Security_Office', 'Admin_Office'],
      status: 'active',
      createdBy: defaultUser._id,
      isActive: true
    });
    console.log('Created depot:', depot.depotName);
  } else {
    console.log('Using existing depot:', depot.depotName);
  }

  // Ensure depot exists
  if (!depot) {
    throw new Error('Failed to create or find depot');
  }

  // Create sample depot user
  console.log('Creating sample depot user...');
  let depotUser = await DepotUser.findOne({ email: 'depot-plk@yatrik.com' });
  if (!depotUser) {
    depotUser = await DepotUser.create({
      username: 'depot-plk',
      email: 'depot-plk@yatrik.com',
      password: 'depot123',
      depotId: depot._id,
      depotCode: depot.depotCode,
      depotName: depot.depotName,
      role: 'depot_manager',
      permissions: [
        'manage_buses',
        'view_buses', 
        'manage_routes',
        'view_routes',
        'manage_schedules',
        'view_schedules',
        'manage_staff',
        'view_staff',
        'view_reports',
        'manage_depot_info',
        'view_depot_info'
      ],
      status: 'active'
    });
    console.log('Created depot user:', depotUser.email);
  } else {
    console.log('Using existing depot user:', depotUser.email);
  }

  // Create sample routes
  console.log('Creating sample routes...');
  console.log('Using defaultUser ID:', defaultUser._id);
  console.log('Using depot ID:', depot._id);
  
  // Create routes one by one to better handle errors
  console.log('Creating route 1: Mumbai-Pune Express...');
  const route1 = await Route.create({
    routeNumber: 'MPE-001',
    routeName: 'Mumbai-Pune Express',
    startingPoint: {
      city: 'Mumbai',
      location: 'Mumbai Central Bus Terminal',
      coordinates: { latitude: 19.0760, longitude: 72.8777 }
    },
    endingPoint: {
      city: 'Pune',
      location: 'Pune Bus Stand',
      coordinates: { latitude: 18.5204, longitude: 73.8567 }
    },
    totalDistance: 148,
    estimatedDuration: 180,
    baseFare: 450,
    farePerKm: 3.04,
    depot: {
      depotId: depot._id,
      depotName: depot.depotName,
      depotLocation: depot.location.city
    },
    status: 'active',
    intermediateStops: [
      {
        city: 'Thane',
        location: 'Thane Station',
        stopNumber: 1,
        distanceFromStart: 25,
        estimatedArrival: 30,
        coordinates: { latitude: 19.2183, longitude: 72.9781 }
      },
      {
        city: 'Kalyan',
        location: 'Kalyan Bus Stand',
        stopNumber: 2,
        distanceFromStart: 45,
        estimatedArrival: 60,
        coordinates: { latitude: 19.2433, longitude: 73.1305 }
      },
      {
        city: 'Lonavala',
        location: 'Lonavala Bus Stop',
        stopNumber: 3,
        distanceFromStart: 85,
        estimatedArrival: 120,
        coordinates: { latitude: 18.7543, longitude: 73.4062 }
      }
    ],
    features: ['AC', 'WiFi', 'USB_Charging', 'Refreshments'],
    schedules: [{
      scheduleId: 'MPE-001-SCH-001',
      departureTime: '06:00',
      arrivalTime: '09:00',
      frequency: 'daily',
      daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      isActive: true,
      effectiveFrom: new Date(),
      createdBy: defaultUser._id
    }],
    createdBy: defaultUser._id,
    assignedBuses: [],
    fareStructure: [
      { fromStop: 'Mumbai', toStop: 'Thane', fare: 100 },
      { fromStop: 'Mumbai', toStop: 'Kalyan', fare: 150 },
      { fromStop: 'Mumbai', toStop: 'Lonavala', fare: 250 },
      { fromStop: 'Mumbai', toStop: 'Pune', fare: 450 }
    ]
  });
  console.log('Route 1 created successfully');
  
  console.log('Creating route 2: Mumbai-Nashik Highway...');
  const route2 = await Route.create({
    routeNumber: 'MNH-002',
    routeName: 'Mumbai-Nashik Highway',
    startingPoint: {
      city: 'Mumbai',
      location: 'Mumbai Central Bus Terminal',
      coordinates: { latitude: 19.0760, longitude: 72.8777 }
    },
    endingPoint: {
      city: 'Nashik',
      location: 'Nashik Bus Stand',
      coordinates: { latitude: 19.9975, longitude: 73.7898 }
    },
    totalDistance: 180,
    estimatedDuration: 240,
    baseFare: 550,
    farePerKm: 3.06,
    depot: {
      depotId: depot._id,
      depotName: depot.depotName,
      depotLocation: depot.location.city
    },
    status: 'active',
    intermediateStops: [
      {
        city: 'Thane',
        location: 'Thane Station',
        stopNumber: 1,
        distanceFromStart: 25,
        estimatedArrival: 30,
        coordinates: { latitude: 19.2433, longitude: 72.9781 }
      },
      {
        city: 'Bhiwandi',
        location: 'Bhiwandi Bus Stop',
        stopNumber: 2,
        distanceFromStart: 50,
        estimatedArrival: 70,
        coordinates: { latitude: 19.2969, longitude: 73.0625 }
      },
      {
        city: 'Kalyan',
        location: 'Kalyan Bus Stand',
        stopNumber: 3,
        distanceFromStart: 65,
        estimatedArrival: 90,
        coordinates: { latitude: 19.2433, longitude: 73.1305 }
      }
    ],
    features: ['AC', 'WiFi', 'USB_Charging'],
    schedules: [{
      scheduleId: 'MNH-002-SCH-001',
      departureTime: '07:30',
      arrivalTime: '11:30',
      frequency: 'daily',
      daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      isActive: true,
      effectiveFrom: new Date(),
      createdBy: defaultUser._id
    }],
    createdBy: defaultUser._id,
    assignedBuses: [],
    fareStructure: [
      { fromStop: 'Mumbai', toStop: 'Thane', fare: 100 },
      { fromStop: 'Mumbai', toStop: 'Bhiwandi', fare: 150 },
      { fromStop: 'Mumbai', toStop: 'Kalyan', fare: 200 },
      { fromStop: 'Mumbai', toStop: 'Nashik', fare: 550 }
    ]
  });
  console.log('Route 2 created successfully');
  
  console.log('Creating route 3: Mumbai-Nagpur Direct...');
  const route3 = await Route.create({
    routeNumber: 'MND-003',
    routeName: 'Mumbai-Nagpur Direct',
    startingPoint: {
      city: 'Mumbai',
      location: 'Mumbai Central Bus Terminal',
      coordinates: { latitude: 19.0760, longitude: 72.8777 }
    },
    endingPoint: {
      city: 'Nagpur',
      location: 'Nagpur Bus Stand',
      coordinates: { latitude: 21.1458, longitude: 79.0882 }
    },
    totalDistance: 850,
    estimatedDuration: 720,
    baseFare: 1200,
    farePerKm: 1.41,
    depot: {
      depotId: depot._id,
      depotName: depot.depotName,
      depotLocation: depot.location.city
    },
    status: 'active',
    intermediateStops: [
      {
        city: 'Thane',
        location: 'Thane Station',
        stopNumber: 1,
        distanceFromStart: 25,
        estimatedArrival: 30,
        coordinates: { latitude: 19.2183, longitude: 72.9781 }
      },
      {
        city: 'Aurangabad',
        location: 'Aurangabad Bus Stand',
        stopNumber: 2,
        distanceFromStart: 400,
        estimatedArrival: 360,
        coordinates: { latitude: 19.8762, longitude: 75.3433 }
      }
    ],
    features: ['AC', 'WiFi', 'USB_Charging', 'Refreshments'],
    schedules: [{
      scheduleId: 'MND-003-SCH-001',
      departureTime: '18:00',
      arrivalTime: '06:00',
      frequency: 'daily',
      daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      isActive: true,
      effectiveFrom: new Date(),
      createdBy: defaultUser._id
    }],
    createdBy: defaultUser._id,
    assignedBuses: [],
    fareStructure: [
      { fromStop: 'Mumbai', toStop: 'Thane', fare: 100 },
      { fromStop: 'Mumbai', toStop: 'Aurangabad', fare: 600 },
      { fromStop: 'Mumbai', toStop: 'Nagpur', fare: 1200 }
    ]
  });
  console.log('Route 3 created successfully');
  
  console.log('Creating route 4: Mumbai-Goa Coastal...');
  const route4 = await Route.create({
    routeNumber: 'MNG-004',
    routeName: 'Mumbai-Goa Coastal',
    startingPoint: {
      city: 'Mumbai',
      location: 'Mumbai Central Bus Terminal',
      coordinates: { latitude: 19.0760, longitude: 72.8777 }
    },
    endingPoint: {
      city: 'Goa',
      location: 'Panaji Bus Stand',
      coordinates: { latitude: 15.4909, longitude: 73.8278 }
    },
    totalDistance: 600,
    estimatedDuration: 480,
    baseFare: 800,
    farePerKm: 1.33,
    depot: {
      depotId: depot._id,
      depotName: depot.depotName,
      depotLocation: depot.location.city
    },
    status: 'active',
    intermediateStops: [
      {
        city: 'Thane',
        location: 'Thane Station',
        stopNumber: 1,
        distanceFromStart: 25,
        estimatedArrival: 30,
        coordinates: { latitude: 19.2183, longitude: 72.9781 }
      },
      {
        city: 'Pune',
        location: 'Pune Bus Stand',
        stopNumber: 2,
        distanceFromStart: 148,
        estimatedArrival: 180,
        coordinates: { latitude: 18.5204, longitude: 73.8567 }
      },
      {
        city: 'Kolhapur',
        location: 'Kolhapur Bus Stand',
        stopNumber: 3,
        distanceFromStart: 350,
        estimatedArrival: 300,
        coordinates: { latitude: 16.7050, longitude: 74.2433 }
      }
    ],
    features: ['AC', 'WiFi', 'USB_Charging', 'Refreshments', 'Entertainment'],
    schedules: [{
      scheduleId: 'MNG-004-SCH-001',
      departureTime: '20:00',
      arrivalTime: '08:00',
      frequency: 'daily',
      daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      isActive: true,
      effectiveFrom: new Date(),
      createdBy: defaultUser._id
    }],
    createdBy: defaultUser._id,
    assignedBuses: [],
    fareStructure: [
      { fromStop: 'Mumbai', toStop: 'Thane', fare: 100 },
      { fromStop: 'Mumbai', toStop: 'Pune', fare: 450 },
      { fromStop: 'Mumbai', toStop: 'Kolhapur', fare: 600 },
      { fromStop: 'Mumbai', toStop: 'Goa', fare: 800 }
    ]
  });
  console.log('Route 4 created successfully');
  
  const routes = [route1, route2, route3, route4];

  console.log(`Created ${routes.length} routes`);

  // Create sample buses
  console.log('Creating sample buses...');
  const buses = await Bus.create([
    {
      busNumber: 'MH-12-AB-1234',
      registrationNumber: 'MH12AB1234',
      depotId: depot._id,
      busType: 'ac_sleeper',
      capacity: {
        total: 35,
        sleeper: 35,
        seater: 0,
        ladies: 5,
        disabled: 2
      },
      amenities: ['wifi', 'charging', 'ac', 'refreshments', 'toilet'],
      specifications: {
        manufacturer: 'Volvo',
        model: '9400 XL',
        year: 2022,
        engine: 'D8K 350 HP',
        fuelType: 'diesel',
        mileage: 8.5,
        maxSpeed: 120,
        length: 12.5,
        width: 2.55,
        height: 3.8
      },
      status: 'active',
      fuel: {
        currentLevel: 85,
        lastRefuel: new Date(),
        averageConsumption: 8.5,
        tankCapacity: 200
      },
      assignedBy: defaultUser._id,
      notes: 'Premium AC sleeper bus for long-distance routes'
    },
    {
      busNumber: 'MH-12-CD-5678',
      registrationNumber: 'MH12CD5678',
      depotId: depot._id,
      busType: 'ac_seater',
      capacity: {
        total: 45,
        sleeper: 0,
        seater: 45,
        ladies: 8,
        disabled: 3
      },
      amenities: ['wifi', 'charging', 'ac'],
      specifications: {
        manufacturer: 'Tata',
        model: 'Starbus Ultra',
        year: 2021,
        engine: '4SPCR 140 HP',
        fuelType: 'diesel',
        mileage: 7.8,
        maxSpeed: 100,
        length: 11.5,
        width: 2.5,
        height: 3.2
      },
      status: 'active',
      fuel: {
        currentLevel: 92,
        lastRefuel: new Date(),
        averageConsumption: 7.8,
        tankCapacity: 150
      },
      assignedBy: defaultUser._id,
      notes: 'Comfortable AC seater bus for medium-distance routes'
    },
    {
      busNumber: 'MH-12-EF-9012',
      registrationNumber: 'MH12EF9012',
      depotId: depot._id,
      busType: 'ac_sleeper',
      capacity: {
        total: 40,
        sleeper: 40,
        seater: 0,
        ladies: 6,
        disabled: 2
      },
      amenities: ['wifi', 'charging', 'ac', 'refreshments', 'toilet'],
      specifications: {
        manufacturer: 'Mercedes-Benz',
        model: 'O500 RS',
        year: 2023,
        engine: 'OM 457 LA 6',
        fuelType: 'diesel',
        mileage: 9.2,
        maxSpeed: 130,
        length: 13.0,
        width: 2.6,
        height: 3.9
      },
      status: 'active',
      fuel: {
        currentLevel: 78,
        lastRefuel: new Date(),
        averageConsumption: 9.2,
        tankCapacity: 250
      },
      assignedBy: defaultUser._id,
      notes: 'Luxury Mercedes-Benz sleeper bus for premium routes'
    },
    {
      busNumber: 'MH-12-GH-3456',
      registrationNumber: 'MH12GH3456',
      depotId: depot._id,
      busType: 'non_ac_seater',
      capacity: {
        total: 50,
        sleeper: 0,
        seater: 50,
        ladies: 10,
        disabled: 4
      },
      amenities: ['charging'],
      specifications: {
        manufacturer: 'Ashok Leyland',
        model: 'JanBus',
        year: 2020,
        engine: 'H Series 4 Cylinder',
        fuelType: 'diesel',
        mileage: 6.5,
        maxSpeed: 80,
        length: 10.5,
        width: 2.4,
        height: 3.0
      },
      status: 'active',
      fuel: {
        currentLevel: 95,
        lastRefuel: new Date(),
        averageConsumption: 6.5,
        tankCapacity: 120
      },
      assignedBy: defaultUser._id,
      notes: 'Economy non-AC bus for short-distance routes'
    }
  ]);

  console.log(`Created ${buses.length} buses`);

  // Create sample trips for the next 7 days
  console.log('Creating sample trips...');
  const trips = [];
  const today = new Date();
  
  for (let day = 0; day < 7; day++) {
    const tripDate = new Date(today);
    tripDate.setDate(today.getDate() + day);
    
    // Mumbai-Pune Express trips
    trips.push({
      routeId: routes[0]._id, // MPE-001
      busId: buses[0]._id, // AC Sleeper
      serviceDate: tripDate,
      startTime: '06:00',
      status: 'scheduled'
    });
    
    trips.push({
      routeId: routes[0]._id, // MPE-001
      busId: buses[2]._id, // Mercedes-Benz
      serviceDate: tripDate,
      startTime: '14:00',
      status: 'scheduled'
    });
    
    trips.push({
      routeId: routes[0]._id, // MPE-001
      busId: buses[1]._id, // AC Seater
      serviceDate: tripDate,
      startTime: '20:00',
      status: 'scheduled'
    });
    
    // Mumbai-Nashik Highway trips
    trips.push({
      routeId: routes[1]._id, // MNH-002
      busId: buses[1]._id, // AC Seater
      serviceDate: tripDate,
      startTime: '07:30',
      status: 'scheduled'
    });
    
    trips.push({
      routeId: routes[1]._id, // MNH-002
      busId: buses[3]._id, // Non-AC
      serviceDate: tripDate,
      startTime: '15:00',
      status: 'scheduled'
    });
    
    // Mumbai-Nagpur Direct (overnight)
    if (day < 5) { // Only 5 days a week for long distance
      trips.push({
        routeId: routes[2]._id, // MND-003
        busId: buses[0]._id, // AC Sleeper
        serviceDate: tripDate,
        startTime: '18:00',
        status: 'scheduled'
      });
    }
    
    // Mumbai-Goa Coastal (overnight)
    if (day % 2 === 0) { // Every alternate day
      trips.push({
        routeId: routes[3]._id, // MNG-004
        busId: buses[2]._id, // Mercedes-Benz
        serviceDate: tripDate,
        startTime: '20:00',
        status: 'scheduled'
      });
    }
  }
  
  const createdTrips = await Trip.create(trips);
  console.log(`Created ${createdTrips.length} trips`);

  // Update bus assignments
  for (const trip of createdTrips) {
    if (trip.busId) {
      await Bus.findByIdAndUpdate(trip.busId, {
        currentTrip: trip._id
      });
    }
  }

  console.log('Sample data creation completed successfully!');
  console.log('\nSummary:');
  console.log(`- Routes: ${routes.length}`);
  console.log(`- Buses: ${buses.length}`);
  console.log(`- Trips: ${createdTrips.length}`);
  console.log(`- Depot: ${depot.depotName}`);
  
  console.log('\nYou can now test the booking system with:');
  console.log('- Search trips from Mumbai to Pune');
  console.log('- Search trips from Mumbai to Nashik');
  console.log('- Search trips from Mumbai to Nagpur');
  console.log('- Search trips from Mumbai to Goa');
}
