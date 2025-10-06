const mongoose = require('mongoose');
const Route = require('./models/Route');
const Bus = require('./models/Bus');
const Trip = require('./models/Trip');
const Depot = require('./models/Depot');
const User = require('./models/User');
const DepotUser = require('./models/DepotUser');
const Driver = require('./models/Driver');
const Conductor = require('./models/Conductor');
const Booking = require('./models/Booking');
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
  
  try {
    await Route.deleteMany({});
    console.log('Cleared routes');
  } catch (error) {
    console.log('Routes collection already cleared');
  }
  
  try {
    await Bus.deleteMany({});
    console.log('Cleared buses');
  } catch (error) {
    console.log('Buses collection already cleared');
  }
  
  try {
    await Trip.deleteMany({});
    console.log('Cleared trips');
  } catch (error) {
    console.log('Trips collection already cleared');
  }

  try {
    await Driver.deleteMany({});
    console.log('Cleared drivers');
  } catch (error) {
    console.log('Drivers collection already cleared');
  }

  try {
    await Conductor.deleteMany({});
    console.log('Cleared conductors');
  } catch (error) {
    console.log('Conductors collection already cleared');
  }

  try {
    await Booking.deleteMany({});
    console.log('Cleared bookings');
  } catch (error) {
    console.log('Bookings collection already cleared');
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

  // Create sample routes with unique schedule IDs
  console.log('Creating sample routes...');
  
  const routes = await Route.create([
    {
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
      features: ['AC', 'WiFi', 'USB_Charging', 'Refreshments'],
      schedules: [{
        scheduleId: 'SCH_MPE001_001',
        departureTime: '06:00',
        arrivalTime: '09:00',
        frequency: 'daily',
        daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        isActive: true,
        effectiveFrom: new Date(),
        createdBy: defaultUser._id
      }],
      createdBy: defaultUser._id
    },
    {
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
      features: ['AC', 'WiFi', 'USB_Charging'],
      schedules: [{
        scheduleId: 'SCH_MNH002_001',
        departureTime: '07:30',
        arrivalTime: '11:30',
        frequency: 'daily',
        daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        isActive: true,
        effectiveFrom: new Date(),
        createdBy: defaultUser._id
      }],
      createdBy: defaultUser._id
    },
    {
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
      features: ['AC', 'WiFi', 'USB_Charging', 'Refreshments'],
      schedules: [{
        scheduleId: 'SCH_MND003_001',
        departureTime: '18:00',
        arrivalTime: '06:00',
        frequency: 'daily',
        daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        isActive: true,
        effectiveFrom: new Date(),
        createdBy: defaultUser._id
      }],
      createdBy: defaultUser._id
    },
    {
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
      features: ['AC', 'WiFi', 'USB_Charging', 'Refreshments', 'Entertainment'],
      schedules: [{
        scheduleId: 'SCH_MNG004_001',
        departureTime: '20:00',
        arrivalTime: '08:00',
        frequency: 'daily',
        daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        isActive: true,
        effectiveFrom: new Date(),
        createdBy: defaultUser._id
      }],
      createdBy: defaultUser._id
    }
  ]);

  console.log(`Created ${routes.length} routes`);

  // Create sample buses with correct enum values
  console.log('Creating sample buses...');
  const buses = await Bus.create([
    {
      busNumber: 'MH-12-AB-1234',
      registrationNumber: 'MH12AB1234',
      depotId: depot._id,
      busType: 'garuda_volvo', // Correct enum value
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
      busType: 'super_deluxe', // Correct enum value
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
      busType: 'garuda_scania', // Correct enum value
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
      busType: 'ordinary', // Correct enum value
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

  // Create drivers
  console.log('Creating drivers...');
  const drivers = await Driver.create([
    {
      driverId: 'DRV001',
      name: 'Rajesh Kumar',
      phone: '9876543210',
      email: 'rajesh.kumar@yatrik.com',
      licenseNumber: 'MH12345678901234',
      licenseExpiry: new Date('2025-12-31'),
      address: {
        street: '123 MG Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      },
      status: 'active',
      depotId: depot._id,
      joiningDate: new Date('2020-01-15'),
      experience: 5,
      salary: {
        basic: 25000,
        allowances: 5000,
        deductions: 2000,
        netSalary: 28000
      }
    },
    {
      driverId: 'DRV002',
      name: 'Suresh Patel',
      phone: '9876543211',
      email: 'suresh.patel@yatrik.com',
      licenseNumber: 'MH12345678901235',
      licenseExpiry: new Date('2026-06-30'),
      address: {
        street: '456 Andheri West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400058'
      },
      status: 'active',
      depotId: depot._id,
      joiningDate: new Date('2019-03-20'),
      experience: 6,
      salary: {
        basic: 27000,
        allowances: 5500,
        deductions: 2200,
        netSalary: 30300
      }
    },
    {
      driverId: 'DRV003',
      name: 'Amit Sharma',
      phone: '9876543212',
      email: 'amit.sharma@yatrik.com',
      licenseNumber: 'MH12345678901236',
      licenseExpiry: new Date('2025-09-15'),
      address: {
        street: '789 Powai',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400076'
      },
      status: 'active',
      depotId: depot._id,
      joiningDate: new Date('2021-07-10'),
      experience: 3,
      salary: {
        basic: 22000,
        allowances: 4000,
        deductions: 1800,
        netSalary: 24200
      }
    }
  ]);

  console.log(`Created ${drivers.length} drivers`);

  // Create conductors
  console.log('Creating conductors...');
  const conductors = await Conductor.create([
    {
      conductorId: 'CND001',
      name: 'Priya Singh',
      phone: '9876543213',
      email: 'priya.singh@yatrik.com',
      address: {
        street: '321 Bandra East',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400051'
      },
      status: 'active',
      depotId: depot._id,
      joiningDate: new Date('2020-02-01'),
      experience: 4,
      salary: {
        basic: 18000,
        allowances: 3000,
        deductions: 1500,
        netSalary: 19500
      }
    },
    {
      conductorId: 'CND002',
      name: 'Vikram Reddy',
      phone: '9876543214',
      email: 'vikram.reddy@yatrik.com',
      address: {
        street: '654 Malad West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400064'
      },
      status: 'active',
      depotId: depot._id,
      joiningDate: new Date('2019-05-15'),
      experience: 5,
      salary: {
        basic: 20000,
        allowances: 3500,
        deductions: 1700,
        netSalary: 21800
      }
    },
    {
      conductorId: 'CND003',
      name: 'Sunita Joshi',
      phone: '9876543215',
      email: 'sunita.joshi@yatrik.com',
      address: {
        street: '987 Goregaon East',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400063'
      },
      status: 'active',
      depotId: depot._id,
      joiningDate: new Date('2021-08-20'),
      experience: 3,
      salary: {
        basic: 17000,
        allowances: 2500,
        deductions: 1300,
        netSalary: 18200
      }
    }
  ]);

  console.log(`Created ${conductors.length} conductors`);

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
      busId: buses[0]._id, // Garuda Volvo
      driverId: drivers[0]._id,
      conductorId: conductors[0]._id,
      depotId: depot._id,
      serviceDate: tripDate,
      startTime: '06:00',
      endTime: '09:00',
      status: day === 0 ? 'running' : 'scheduled',
      fare: 450,
      capacity: buses[0].capacity.total,
      availableSeats: buses[0].capacity.total - Math.floor(Math.random() * 10),
      bookedSeats: Math.floor(Math.random() * 10),
      bookingOpen: true,
      estimatedDuration: 180,
      createdBy: defaultUser._id
    });
    
    trips.push({
      routeId: routes[0]._id, // MPE-001
      busId: buses[2]._id, // Garuda Scania
      driverId: drivers[1]._id,
      conductorId: conductors[1]._id,
      depotId: depot._id,
      serviceDate: tripDate,
      startTime: '14:00',
      endTime: '17:00',
      status: 'scheduled',
      fare: 450,
      capacity: buses[2].capacity.total,
      availableSeats: buses[2].capacity.total - Math.floor(Math.random() * 12),
      bookedSeats: Math.floor(Math.random() * 12),
      bookingOpen: true,
      estimatedDuration: 180,
      createdBy: defaultUser._id
    });
    
    trips.push({
      routeId: routes[0]._id, // MPE-001
      busId: buses[1]._id, // Super Deluxe
      driverId: drivers[2]._id,
      conductorId: conductors[2]._id,
      depotId: depot._id,
      serviceDate: tripDate,
      startTime: '20:00',
      endTime: '23:00',
      status: 'scheduled',
      fare: 450,
      capacity: buses[1].capacity.total,
      availableSeats: buses[1].capacity.total - Math.floor(Math.random() * 15),
      bookedSeats: Math.floor(Math.random() * 15),
      bookingOpen: true,
      estimatedDuration: 180,
      createdBy: defaultUser._id
    });
    
    // Mumbai-Nashik Highway trips
    trips.push({
      routeId: routes[1]._id, // MNH-002
      busId: buses[1]._id, // Super Deluxe
      driverId: drivers[0]._id,
      conductorId: conductors[1]._id,
      depotId: depot._id,
      serviceDate: tripDate,
      startTime: '07:30',
      endTime: '11:30',
      status: 'scheduled',
      fare: 550,
      capacity: buses[1].capacity.total,
      availableSeats: buses[1].capacity.total - Math.floor(Math.random() * 8),
      bookedSeats: Math.floor(Math.random() * 8),
      bookingOpen: true,
      estimatedDuration: 240,
      createdBy: defaultUser._id
    });
    
    trips.push({
      routeId: routes[1]._id, // MNH-002
      busId: buses[3]._id, // Ordinary
      driverId: drivers[2]._id,
      conductorId: conductors[2]._id,
      depotId: depot._id,
      serviceDate: tripDate,
      startTime: '15:00',
      endTime: '19:00',
      status: 'scheduled',
      fare: 550,
      capacity: buses[3].capacity.total,
      availableSeats: buses[3].capacity.total - Math.floor(Math.random() * 20),
      bookedSeats: Math.floor(Math.random() * 20),
      bookingOpen: true,
      estimatedDuration: 240,
      createdBy: defaultUser._id
    });
    
    // Mumbai-Nagpur Direct (overnight)
    if (day < 5) { // Only 5 days a week for long distance
      trips.push({
        routeId: routes[2]._id, // MND-003
        busId: buses[0]._id, // Garuda Volvo
        driverId: drivers[1]._id,
        conductorId: conductors[0]._id,
        depotId: depot._id,
        serviceDate: tripDate,
        startTime: '18:00',
        endTime: '06:00',
        status: 'scheduled',
        fare: 1200,
        capacity: buses[0].capacity.total,
        availableSeats: buses[0].capacity.total - Math.floor(Math.random() * 25),
        bookedSeats: Math.floor(Math.random() * 25),
        bookingOpen: true,
        estimatedDuration: 720,
        createdBy: defaultUser._id
      });
    }
    
    // Mumbai-Goa Coastal (overnight)
    if (day % 2 === 0) { // Every alternate day
      trips.push({
        routeId: routes[3]._id, // MNG-004
        busId: buses[2]._id, // Garuda Scania
        driverId: drivers[2]._id,
        conductorId: conductors[1]._id,
        depotId: depot._id,
        serviceDate: tripDate,
        startTime: '20:00',
        endTime: '08:00',
        status: 'scheduled',
        fare: 800,
        capacity: buses[2].capacity.total,
        availableSeats: buses[2].capacity.total - Math.floor(Math.random() * 30),
        bookedSeats: Math.floor(Math.random() * 30),
        bookingOpen: true,
        estimatedDuration: 480,
        createdBy: defaultUser._id
      });
    }
  }
  
  const createdTrips = await Trip.create(trips);
  console.log(`Created ${createdTrips.length} trips`);

  // Create some sample bookings
  console.log('Creating sample bookings...');
  const sampleBookings = await Booking.create([
    {
      tripId: createdTrips[0]._id,
      passengerName: 'John Doe',
      passengerPhone: '9876543216',
      passengerEmail: 'john.doe@email.com',
      seatNumbers: ['A1', 'A2'],
      totalAmount: 900,
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: 'razorpay',
      bookingDate: new Date(),
      journeyDate: createdTrips[0].serviceDate
    },
    {
      tripId: createdTrips[1]._id,
      passengerName: 'Jane Smith',
      passengerPhone: '9876543217',
      passengerEmail: 'jane.smith@email.com',
      seatNumbers: ['B3'],
      totalAmount: 450,
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: 'razorpay',
      bookingDate: new Date(),
      journeyDate: createdTrips[1].serviceDate
    },
    {
      tripId: createdTrips[3]._id,
      passengerName: 'Mike Johnson',
      passengerPhone: '9876543218',
      passengerEmail: 'mike.johnson@email.com',
      seatNumbers: ['C1', 'C2'],
      totalAmount: 1100,
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: 'razorpay',
      bookingDate: new Date(),
      journeyDate: createdTrips[3].serviceDate
    }
  ]);

  console.log(`Created ${sampleBookings.length} sample bookings`);

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
  console.log(`- Drivers: ${drivers.length}`);
  console.log(`- Conductors: ${conductors.length}`);
  console.log(`- Trips: ${createdTrips.length}`);
  console.log(`- Bookings: ${sampleBookings.length}`);
  console.log(`- Depot: ${depot.depotName}`);
  
  console.log('\nYou can now test the booking system with:');
  console.log('- Search trips from Mumbai to Pune');
  console.log('- Search trips from Mumbai to Nashik');
  console.log('- Search trips from Mumbai to Nagpur');
  console.log('- Search trips from Mumbai to Goa');
}

