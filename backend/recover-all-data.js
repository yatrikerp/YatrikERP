const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const User = require('./models/User');
const Route = require('./models/Route');
const Bus = require('./models/Bus');
const Trip = require('./models/Trip');
const Depot = require('./models/Depot');
const Driver = require('./models/Driver');
const Conductor = require('./models/Conductor');
const Booking = require('./models/Booking');

// Connect to MongoDB using the same connection as the server
async function connectToDatabase() {
  try {
    const connectionUri = process.env.MONGODB_URI;
    
    if (!connectionUri) {
      throw new Error('MONGODB_URI environment variable is required. Please set it in your .env file.');
    }
    
    console.log('🔌 Connecting to Atlas MongoDB...');
    await mongoose.connect(connectionUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      retryWrites: true,
      retryReads: true
    });
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
}

async function createComprehensiveData() {
  try {
    console.log('🚀 Starting comprehensive data recovery...');
    
    // Get or create admin user
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'System Administrator',
        email: 'admin@yatrik.com',
        password: '$2a$12$b5176O3walO9EiOjL6s.Y.VK0gIM3Ffkey6izq7/g3jViFIDTLAu.', // admin123
        role: 'admin',
        status: 'active',
        phone: '+91-98765-43210'
      });
      console.log('✅ Created admin user');
    } else {
      console.log('✅ Using existing admin user');
    }

    // Get or create main depot
    let mainDepot = await Depot.findOne({ depotName: 'Mumbai Central Depot' });
    if (!mainDepot) {
      mainDepot = await Depot.create({
        depotCode: 'MUM001',
        depotName: 'Mumbai Central Depot',
        location: {
          address: 'Station Road, Mumbai Central',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400008',
          coordinates: { latitude: 19.0760, longitude: 72.8777 }
        },
        contact: {
          phone: '+91-22-2307-0000',
          email: 'mumbai@yatrik.com',
          manager: {
            name: 'Rajesh Kumar',
            phone: '+91-98765-43210',
            email: 'rajesh.kumar@yatrik.com'
          }
        },
        capacity: {
          totalBuses: 100,
          availableBuses: 85,
          maintenanceBuses: 15
        },
        operatingHours: {
          openTime: '05:00',
          closeTime: '23:00',
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        facilities: ['Fuel_Station', 'Maintenance_Bay', 'Washing_Bay', 'Parking_Lot', 'Driver_Rest_Room', 'Canteen', 'Security_Office', 'Admin_Office'],
        status: 'active',
        createdBy: adminUser._id
      });
      console.log('✅ Created main depot');
    } else {
      console.log('✅ Using existing main depot');
    }

    // Create additional depots
    const additionalDepots = [
      {
        depotCode: 'PUN001',
        depotName: 'Pune Central Depot',
        location: {
          address: 'Shivajinagar, Pune',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411005',
          coordinates: { latitude: 18.5204, longitude: 73.8567 }
        },
        contact: {
          phone: '+91-20-2612-3456',
          email: 'pune@yatrik.com'
        },
        capacity: { totalBuses: 50, availableBuses: 45, maintenanceBuses: 5 },
        operatingHours: { openTime: '05:00', closeTime: '23:00', workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
        facilities: ['Fuel_Station', 'Maintenance_Bay', 'Washing_Bay', 'Parking_Lot'],
        status: 'active',
        createdBy: adminUser._id
      },
      {
        depotCode: 'NAS001',
        depotName: 'Nashik Central Depot',
        location: {
          address: 'Dwarka Circle, Nashik',
          city: 'Nashik',
          state: 'Maharashtra',
          pincode: '422001',
          coordinates: { latitude: 19.9975, longitude: 73.7898 }
        },
        contact: {
          phone: '+91-253-234-5678',
          email: 'nashik@yatrik.com'
        },
        capacity: { totalBuses: 30, availableBuses: 25, maintenanceBuses: 5 },
        operatingHours: { openTime: '05:00', closeTime: '23:00', workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
        facilities: ['Fuel_Station', 'Maintenance_Bay', 'Washing_Bay', 'Parking_Lot'],
        status: 'active',
        createdBy: adminUser._id
      }
    ];

    for (const depotData of additionalDepots) {
      let depot = await Depot.findOne({ depotCode: depotData.depotCode });
      if (!depot) {
        depot = await Depot.create(depotData);
        console.log(`✅ Created depot: ${depot.depotName}`);
      }
    }

    // Create comprehensive routes
    console.log('🚌 Creating comprehensive routes...');
    
    const routes = [
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
          depotId: mainDepot._id,
          depotName: mainDepot.depotName,
          depotLocation: mainDepot.location.city
        },
        status: 'active',
        features: ['AC', 'WiFi', 'USB_Charging', 'Refreshments'],
        createdBy: adminUser._id
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
          depotId: mainDepot._id,
          depotName: mainDepot.depotName,
          depotLocation: mainDepot.location.city
        },
        status: 'active',
        features: ['AC', 'WiFi', 'USB_Charging'],
        createdBy: adminUser._id
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
          depotId: mainDepot._id,
          depotName: mainDepot.depotName,
          depotLocation: mainDepot.location.city
        },
        status: 'active',
        features: ['AC', 'WiFi', 'USB_Charging', 'Refreshments'],
        createdBy: adminUser._id
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
          depotId: mainDepot._id,
          depotName: mainDepot.depotName,
          depotLocation: mainDepot.location.city
        },
        status: 'active',
        features: ['AC', 'WiFi', 'USB_Charging', 'Refreshments', 'Entertainment'],
        createdBy: adminUser._id
      }
    ];

    const createdRoutes = [];
    for (const routeData of routes) {
      let route = await Route.findOne({ routeNumber: routeData.routeNumber });
      if (!route) {
        route = await Route.create(routeData);
        console.log(`✅ Created route: ${route.routeName}`);
      } else {
        console.log(`✅ Using existing route: ${route.routeName}`);
      }
      createdRoutes.push(route);
    }

    // Create comprehensive buses
    console.log('🚌 Creating comprehensive buses...');
    
    const buses = [
      {
        busNumber: 'MH-12-AB-1234',
        registrationNumber: 'MH12AB1234',
        depotId: mainDepot._id,
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
        assignedBy: adminUser._id,
        notes: 'Premium AC sleeper bus for long-distance routes'
      },
      {
        busNumber: 'MH-12-CD-5678',
        registrationNumber: 'MH12CD5678',
        depotId: mainDepot._id,
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
        assignedBy: adminUser._id,
        notes: 'Comfortable AC seater bus for medium-distance routes'
      },
      {
        busNumber: 'MH-12-EF-9012',
        registrationNumber: 'MH12EF9012',
        depotId: mainDepot._id,
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
        assignedBy: adminUser._id,
        notes: 'Luxury Mercedes-Benz sleeper bus for premium routes'
      },
      {
        busNumber: 'MH-12-GH-3456',
        registrationNumber: 'MH12GH3456',
        depotId: mainDepot._id,
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
        assignedBy: adminUser._id,
        notes: 'Economy non-AC bus for short-distance routes'
      }
    ];

    const createdBuses = [];
    for (const busData of buses) {
      let bus = await Bus.findOne({ busNumber: busData.busNumber });
      if (!bus) {
        bus = await Bus.create(busData);
        console.log(`✅ Created bus: ${bus.busNumber}`);
      } else {
        console.log(`✅ Using existing bus: ${bus.busNumber}`);
      }
      createdBuses.push(bus);
    }

    // Create drivers
    console.log('👨‍💼 Creating drivers...');
    
    const drivers = [
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
        depotId: mainDepot._id,
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
        depotId: mainDepot._id,
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
        depotId: mainDepot._id,
        joiningDate: new Date('2021-07-10'),
        experience: 3,
        salary: {
          basic: 22000,
          allowances: 4000,
          deductions: 1800,
          netSalary: 24200
        }
      }
    ];

    const createdDrivers = [];
    for (const driverData of drivers) {
      let driver = await Driver.findOne({ driverId: driverData.driverId });
      if (!driver) {
        driver = await Driver.create(driverData);
        console.log(`✅ Created driver: ${driver.name}`);
      } else {
        console.log(`✅ Using existing driver: ${driver.name}`);
      }
      createdDrivers.push(driver);
    }

    // Create conductors
    console.log('🎫 Creating conductors...');
    
    const conductors = [
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
        depotId: mainDepot._id,
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
        depotId: mainDepot._id,
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
        depotId: mainDepot._id,
        joiningDate: new Date('2021-08-20'),
        experience: 3,
        salary: {
          basic: 17000,
          allowances: 2500,
          deductions: 1300,
          netSalary: 18200
        }
      }
    ];

    const createdConductors = [];
    for (const conductorData of conductors) {
      let conductor = await Conductor.findOne({ conductorId: conductorData.conductorId });
      if (!conductor) {
        conductor = await Conductor.create(conductorData);
        console.log(`✅ Created conductor: ${conductor.name}`);
      } else {
        console.log(`✅ Using existing conductor: ${conductor.name}`);
      }
      createdConductors.push(conductor);
    }

    // Create comprehensive trips for the next 7 days
    console.log('🚌 Creating comprehensive trips...');
    
    const trips = [];
    const today = new Date();
    
    for (let day = 0; day < 7; day++) {
      const tripDate = new Date(today);
      tripDate.setDate(today.getDate() + day);
      tripDate.setHours(0, 0, 0, 0);
      
      // Mumbai-Pune Express trips (3 per day)
      trips.push({
        routeId: createdRoutes[0]._id,
        busId: createdBuses[0]._id,
        driverId: createdDrivers[0]._id,
        conductorId: createdConductors[0]._id,
        depotId: mainDepot._id,
        serviceDate: tripDate,
        startTime: '06:00',
        endTime: '09:00',
        status: day === 0 ? 'running' : 'scheduled',
        fare: 450,
        capacity: createdBuses[0].capacity.total,
        availableSeats: createdBuses[0].capacity.total - Math.floor(Math.random() * 10),
        bookedSeats: Math.floor(Math.random() * 10),
        bookingOpen: true,
        estimatedDuration: 180,
        createdBy: adminUser._id
      });
      
      trips.push({
        routeId: createdRoutes[0]._id,
        busId: createdBuses[1]._id,
        driverId: createdDrivers[1]._id,
        conductorId: createdConductors[1]._id,
        depotId: mainDepot._id,
        serviceDate: tripDate,
        startTime: '14:00',
        endTime: '17:00',
        status: 'scheduled',
        fare: 450,
        capacity: createdBuses[1].capacity.total,
        availableSeats: createdBuses[1].capacity.total - Math.floor(Math.random() * 15),
        bookedSeats: Math.floor(Math.random() * 15),
        bookingOpen: true,
        estimatedDuration: 180,
        createdBy: adminUser._id
      });
      
      trips.push({
        routeId: createdRoutes[0]._id,
        busId: createdBuses[2]._id,
        driverId: createdDrivers[2]._id,
        conductorId: createdConductors[2]._id,
        depotId: mainDepot._id,
        serviceDate: tripDate,
        startTime: '20:00',
        endTime: '23:00',
        status: 'scheduled',
        fare: 450,
        capacity: createdBuses[2].capacity.total,
        availableSeats: createdBuses[2].capacity.total - Math.floor(Math.random() * 12),
        bookedSeats: Math.floor(Math.random() * 12),
        bookingOpen: true,
        estimatedDuration: 180,
        createdBy: adminUser._id
      });
      
      // Mumbai-Nashik Highway trips (2 per day)
      trips.push({
        routeId: createdRoutes[1]._id,
        busId: createdBuses[1]._id,
        driverId: createdDrivers[0]._id,
        conductorId: createdConductors[1]._id,
        depotId: mainDepot._id,
        serviceDate: tripDate,
        startTime: '07:30',
        endTime: '11:30',
        status: day === 0 ? 'scheduled' : 'scheduled',
        fare: 550,
        capacity: createdBuses[1].capacity.total,
        availableSeats: createdBuses[1].capacity.total - Math.floor(Math.random() * 8),
        bookedSeats: Math.floor(Math.random() * 8),
        bookingOpen: true,
        estimatedDuration: 240,
        createdBy: adminUser._id
      });
      
      trips.push({
        routeId: createdRoutes[1]._id,
        busId: createdBuses[3]._id,
        driverId: createdDrivers[2]._id,
        conductorId: createdConductors[2]._id,
        depotId: mainDepot._id,
        serviceDate: tripDate,
        startTime: '15:00',
        endTime: '19:00',
        status: 'scheduled',
        fare: 550,
        capacity: createdBuses[3].capacity.total,
        availableSeats: createdBuses[3].capacity.total - Math.floor(Math.random() * 20),
        bookedSeats: Math.floor(Math.random() * 20),
        bookingOpen: true,
        estimatedDuration: 240,
        createdBy: adminUser._id
      });
      
      // Mumbai-Nagpur Direct (overnight, 5 days a week)
      if (day < 5) {
        trips.push({
          routeId: createdRoutes[2]._id,
          busId: createdBuses[0]._id,
          driverId: createdDrivers[1]._id,
          conductorId: createdConductors[0]._id,
          depotId: mainDepot._id,
          serviceDate: tripDate,
          startTime: '18:00',
          endTime: '06:00',
          status: 'scheduled',
          fare: 1200,
          capacity: createdBuses[0].capacity.total,
          availableSeats: createdBuses[0].capacity.total - Math.floor(Math.random() * 25),
          bookedSeats: Math.floor(Math.random() * 25),
          bookingOpen: true,
          estimatedDuration: 720,
          createdBy: adminUser._id
        });
      }
      
      // Mumbai-Goa Coastal (overnight, every alternate day)
      if (day % 2 === 0) {
        trips.push({
          routeId: createdRoutes[3]._id,
          busId: createdBuses[2]._id,
          driverId: createdDrivers[2]._id,
          conductorId: createdConductors[1]._id,
          depotId: mainDepot._id,
          serviceDate: tripDate,
          startTime: '20:00',
          endTime: '08:00',
          status: 'scheduled',
          fare: 800,
          capacity: createdBuses[2].capacity.total,
          availableSeats: createdBuses[2].capacity.total - Math.floor(Math.random() * 30),
          bookedSeats: Math.floor(Math.random() * 30),
          bookingOpen: true,
          estimatedDuration: 480,
          createdBy: adminUser._id
        });
      }
    }
    
    // Clear existing trips and create new ones
    await Trip.deleteMany({});
    const createdTrips = await Trip.insertMany(trips);
    console.log(`✅ Created ${createdTrips.length} trips`);

    // Create some sample bookings
    console.log('🎫 Creating sample bookings...');
    
    const sampleBookings = [
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
    ];

    const createdBookings = await Booking.insertMany(sampleBookings);
    console.log(`✅ Created ${createdBookings.length} sample bookings`);

    console.log('\n🎉 Comprehensive data recovery completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${await User.countDocuments()}`);
    console.log(`- Depots: ${await Depot.countDocuments()}`);
    console.log(`- Routes: ${await Route.countDocuments()}`);
    console.log(`- Buses: ${await Bus.countDocuments()}`);
    console.log(`- Drivers: ${await Driver.countDocuments()}`);
    console.log(`- Conductors: ${await Conductor.countDocuments()}`);
    console.log(`- Trips: ${await Trip.countDocuments()}`);
    console.log(`- Bookings: ${await Booking.countDocuments()}`);
    
    console.log('\n🚀 You can now:');
    console.log('- View live data in the admin dashboard');
    console.log('- Search and book trips');
    console.log('- Manage buses, routes, and staff');
    console.log('- Monitor trip status and bookings');
    
  } catch (error) {
    console.error('❌ Error during data recovery:', error);
    throw error;
  }
}

async function main() {
  try {
    await connectToDatabase();
    await createComprehensiveData();
    console.log('\n✅ Data recovery process completed successfully!');
  } catch (error) {
    console.error('❌ Data recovery failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

main();

