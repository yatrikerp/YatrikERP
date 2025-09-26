/**
 * YATRIK ERP - Enhanced Route & Trip Management Test Script
 * 
 * This script demonstrates the complete workflow:
 * 1. Create a route with multiple stops
 * 2. Calculate fare matrix automatically
 * 3. Create a trip on the route
 * 4. Generate seat layout automatically
 * 5. Populate stop-to-stop fare map
 * 
 * Run with: node test-enhanced-route-trip-workflow.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Route = require('./models/Route');
const Trip = require('./models/Trip');
const Bus = require('./models/Bus');
const Depot = require('./models/Depot');
const User = require('./models/User');
const FarePolicy = require('./models/FarePolicy');

// Test data
const testData = {
  depot: {
    depotName: 'Mumbai Central Depot',
    depotCode: 'MUM001',
    location: {
      address: 'Mumbai Central Bus Station, Dr. A. B. Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      coordinates: { latitude: 19.0176, longitude: 72.8562 }
    },
    contact: {
      phone: '+91-22-12345678',
      email: 'mumbai@yatrik.com',
      manager: {
        name: 'Rajesh Kumar',
        phone: '+91-9876543210',
        email: 'rajesh.manager@yatrik.com'
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
    facilities: ['Parking_Lot', 'Maintenance_Bay', 'Fuel_Station'],
    status: 'active',
    createdBy: null // Will be set after user creation
  },
  
  bus: {
    busNumber: 'MH01-AB-1234',
    registrationNumber: 'MH01-AB-1234',
    busType: 'ac_seater',
    capacity: {
      total: 45,
      ladies: 7,
      disabled: 2
    },
    features: ['AC', 'WiFi', 'USB_Charging'],
    depotId: null, // Will be set after depot creation
    assignedBy: null // Will be set after admin user creation
  },
  
  route: {
    routeNumber: 'R001',
    routeName: 'Mumbai to Pune Express',
    startingPoint: {
      city: 'Mumbai',
      location: 'Mumbai Central Bus Station',
      coordinates: { latitude: 19.0176, longitude: 72.8562 }
    },
    endingPoint: {
      city: 'Pune',
      location: 'Pune Bus Station',
      coordinates: { latitude: 18.5204, longitude: 73.8567 }
    },
    totalDistance: 150,
    estimatedDuration: 180,
    stops: [
      {
        stopName: 'Thane Station',
        city: 'Thane',
        location: 'Thane Railway Station',
        stopNumber: 1,
        distanceFromPrev: 25,
        distanceFromStart: 25,
        estimatedArrival: 30,
        coordinates: { latitude: 19.1868, longitude: 72.9750 },
        isActive: true
      },
      {
        stopName: 'Kalyan Junction',
        city: 'Kalyan',
        location: 'Kalyan Railway Station',
        stopNumber: 2,
        distanceFromPrev: 20,
        distanceFromStart: 45,
        estimatedArrival: 60,
        coordinates: { latitude: 19.2437, longitude: 73.1355 },
        isActive: true
      },
      {
        stopName: 'Karjat Station',
        city: 'Karjat',
        location: 'Karjat Railway Station',
        stopNumber: 3,
        distanceFromPrev: 35,
        distanceFromStart: 80,
        estimatedArrival: 120,
        coordinates: { latitude: 18.9107, longitude: 73.3236 },
        isActive: true
      },
      {
        stopName: 'Lonavala Bus Stand',
        city: 'Lonavala',
        location: 'Lonavala Bus Station',
        stopNumber: 4,
        distanceFromPrev: 25,
        distanceFromStart: 105,
        estimatedArrival: 150,
        coordinates: { latitude: 18.7528, longitude: 73.4058 },
        isActive: true
      }
    ],
    schedules: [{
      scheduleId: 'SCH_R001_' + Date.now(),
      departureTime: '08:00',
      arrivalTime: '11:00',
      frequency: 'daily',
      daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      isActive: true,
      effectiveFrom: new Date(),
      createdBy: null, // Will be set after admin user creation
      createdAt: new Date()
    }],
    depot: {
      depotId: null, // Will be set after depot creation
      depotName: 'Mumbai Central Depot',
      depotLocation: 'Mumbai Central, Maharashtra'
    },
    baseFare: 50,
    farePerKm: 2.5,
    status: 'active',
    features: ['AC', 'WiFi'],
    notes: 'Express route with multiple stops'
  },
  
  trip: {
    routeId: null, // Will be set after route creation
    busId: null, // Will be set after bus creation
    driverId: null, // Will be set after user creation
    conductorId: null, // Will be set after user creation
    serviceDate: new Date('2024-01-15'),
    startTime: '08:00',
    endTime: '11:00',
    fare: 150,
    capacity: 45,
    depotId: null, // Will be set after depot creation
    status: 'scheduled',
    notes: 'Test trip for enhanced workflow'
  },
  
  users: {
    driver: {
      name: 'Rajesh Kumar',
      email: 'rajesh.driver@yatrik.com',
      phone: '9876543210',
      password: 'driver123',
      role: 'driver',
      licenseNumber: 'DL123456789',
      address: 'Mumbai, Maharashtra'
    },
    conductor: {
      name: 'Priya Sharma',
      email: 'priya.conductor@yatrik.com',
      phone: '9876543211',
      password: 'conductor123',
      role: 'conductor',
      employeeId: 'EMP001',
      address: 'Mumbai, Maharashtra'
    }
  }
};

async function connectDB() {
  try {
    console.log('🔌 Attempting to connect to MongoDB...');
    console.log('📡 MongoDB URI:', process.env.MONGODB_URI ? 'Found' : 'Not found');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function setupFarePolicy() {
  try {
    console.log('\n📋 Setting up Fare Policy...');
    
    // Create or update fare policy
    let farePolicy = await FarePolicy.findOne({ active: true });
    if (!farePolicy) {
      farePolicy = new FarePolicy({
        baseFare: 50,
        perKm: 2.5,
        currency: 'INR',
        active: true
      });
      await farePolicy.save();
      console.log('✅ Fare Policy created');
    } else {
      console.log('✅ Fare Policy already exists');
    }
    
    return farePolicy;
  } catch (error) {
    console.error('❌ Error setting up fare policy:', error);
    throw error;
  }
}

async function createDepot(adminUser) {
  try {
    console.log('\n🏢 Creating Depot...');
    
    // Generate unique depot code to avoid conflicts
    const timestamp = Date.now();
    testData.depot.depotCode = `MUM${timestamp}`;
    testData.depot.depotName = `Mumbai Central Depot ${timestamp}`;
    testData.depot.createdBy = adminUser._id;
    
    // Check if depot already exists and clean up if needed
    const existingDepot = await Depot.findOne({ depotCode: testData.depot.depotCode });
    if (existingDepot) {
      console.log('🧹 Cleaning up existing test depot...');
      await Depot.deleteOne({ depotCode: testData.depot.depotCode });
    }
    
    const depot = new Depot(testData.depot);
    await depot.save();
    console.log('✅ Depot created:', depot.depotName);
    
    // Update test data with depot ID
    testData.bus.depotId = depot._id;
    testData.route.depot.depotId = depot._id;
    testData.route.depot.depotName = depot.depotName;
    testData.route.depot.depotLocation = depot.location.address;
    testData.trip.depotId = depot._id;
    
    return depot;
  } catch (error) {
    console.error('❌ Error creating depot:', error);
    throw error;
  }
}

async function createAdminUser() {
  try {
    console.log('\n👤 Creating Admin User...');
    
    // Check if admin user already exists
    let adminUser = await User.findOne({ email: 'admin@yatrik.com' });
    if (!adminUser) {
      adminUser = new User({
        name: 'System Admin',
        email: 'admin@yatrik.com',
        phone: '+91-9876543200',
        role: 'admin',
        password: 'admin123', // In real scenario, this would be hashed
        address: 'Mumbai, Maharashtra'
      });
      await adminUser.save();
      console.log('✅ Admin user created:', adminUser.name);
    } else {
      console.log('✅ Admin user already exists:', adminUser.name);
    }
    
    return adminUser;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}

async function createUsers() {
  try {
    console.log('\n👥 Creating Users (Driver & Conductor)...');
    
    // Generate unique email addresses to avoid conflicts
    const timestamp = Date.now();
    const driverData = {
      ...testData.users.driver,
      email: `rajesh.driver.${timestamp}@yatrik.com`
    };
    const conductorData = {
      ...testData.users.conductor,
      email: `priya.conductor.${timestamp}@yatrik.com`
    };
    
    // Check if users already exist and clean up if needed
    const existingDriver = await User.findOne({ email: driverData.email });
    if (existingDriver) {
      console.log('🧹 Cleaning up existing test driver...');
      await User.deleteOne({ email: driverData.email });
    }
    
    const existingConductor = await User.findOne({ email: conductorData.email });
    if (existingConductor) {
      console.log('🧹 Cleaning up existing test conductor...');
      await User.deleteOne({ email: conductorData.email });
    }
    
    const driver = new User(driverData);
    await driver.save();
    console.log('✅ Driver created:', driver.name);
    
    const conductor = new User(conductorData);
    await conductor.save();
    console.log('✅ Conductor created:', conductor.name);
    
    // Update test data with user IDs
    testData.trip.driverId = driver._id;
    testData.trip.conductorId = conductor._id;
    
    return { driver, conductor };
  } catch (error) {
    console.error('❌ Error creating users:', error);
    throw error;
  }
}

async function createBus(adminUser) {
  try {
    console.log('\n🚌 Creating Bus...');
    
    // Generate unique bus number to avoid conflicts
    const timestamp = Date.now();
    testData.bus.busNumber = `MH01-AB-${timestamp}`;
    testData.bus.registrationNumber = `MH01-AB-${timestamp}`;
    testData.bus.assignedBy = adminUser._id;
    
    // Check if bus already exists and clean up if needed
    const existingBus = await Bus.findOne({ busNumber: testData.bus.busNumber });
    if (existingBus) {
      console.log('🧹 Cleaning up existing test bus...');
      await Bus.deleteOne({ busNumber: testData.bus.busNumber });
    }
    
    const bus = new Bus(testData.bus);
    await bus.save();
    console.log('✅ Bus created:', bus.busNumber);
    
    // Update test data with bus ID
    testData.trip.busId = bus._id;
    
    return bus;
  } catch (error) {
    console.error('❌ Error creating bus:', error);
    throw error;
  }
}

async function createRoute(adminUser) {
  try {
    console.log('\n🛣️ Creating Route with Stops...');
    
    // Generate unique route number to avoid conflicts
    const timestamp = Date.now();
    testData.route.routeNumber = `R${timestamp}`;
    testData.route.routeName = `Mumbai to Pune Express ${timestamp}`;
    testData.route.createdBy = adminUser._id;
    
    // Update schedule createdBy field
    if (testData.route.schedules && testData.route.schedules.length > 0) {
      testData.route.schedules[0].createdBy = adminUser._id;
    }
    
    // Check if route already exists and clean up if needed
    const existingRoute = await Route.findOne({ routeNumber: testData.route.routeNumber });
    if (existingRoute) {
      console.log('🧹 Cleaning up existing test route...');
      await Route.deleteOne({ routeNumber: testData.route.routeNumber });
    }
    
    const route = new Route(testData.route);
    await route.save();
    console.log('✅ Route created:', route.routeNumber, '-', route.routeName);
    console.log('📍 Stops added:', route.stops.length);
    
    // Update test data with route ID
    testData.trip.routeId = route._id;
    
    return route;
  } catch (error) {
    console.error('❌ Error creating route:', error);
    throw error;
  }
}

async function calculateFareMatrix(route) {
  try {
    console.log('\n💰 Calculating Fare Matrix...');
    
    const fareMatrix = route.calculateFareMatrix();
    await route.save();
    
    console.log('✅ Fare Matrix calculated successfully');
    console.log('📊 Matrix size:', route.fareMatrix.size, 'stop combinations');
    
    // Display sample fares
    const allStops = route.getAllStops();
    console.log('\n📋 Sample Fares:');
    allStops.slice(0, 3).forEach((fromStop, i) => {
      if (i < allStops.length - 1) {
        const toStop = allStops[i + 1];
        const fare = route.getFareBetweenStops(fromStop.stopName, toStop.stopName);
        console.log(`   ${fromStop.stopName} → ${toStop.stopName}: ₹${fare}`);
      }
    });
    
    return fareMatrix;
  } catch (error) {
    console.error('❌ Error calculating fare matrix:', error);
    throw error;
  }
}

async function createTrip(adminUser) {
  try {
    console.log('\n🚍 Creating Trip...');
    
    // Set createdBy field
    testData.trip.createdBy = adminUser._id;
    
    const trip = new Trip(testData.trip);
    await trip.save();
    console.log('✅ Trip created:', trip._id);
    
    return trip;
  } catch (error) {
    console.error('❌ Error creating trip:', error);
    throw error;
  }
}

async function generateSeatLayout(trip) {
  try {
    console.log('\n🪑 Generating Seat Layout...');
    
    const seatLayout = trip.generateSeatLayout(45, 'ac_seater');
    await trip.save();
    
    console.log('✅ Seat Layout generated successfully');
    console.log('🪑 Total Seats:', seatLayout.totalSeats);
    console.log('👩 Ladies Seats:', seatLayout.ladiesSeats);
    console.log('♿ Disabled Seats:', seatLayout.disabledSeats);
    console.log('📐 Layout:', seatLayout.rows, 'rows ×', seatLayout.seatsPerRow, 'seats per row');
    
    return seatLayout;
  } catch (error) {
    console.error('❌ Error generating seat layout:', error);
    throw error;
  }
}

async function populateFareMap(trip) {
  try {
    console.log('\n💰 Populating Stop Fare Map...');
    
    await trip.populateStopFareMap();
    
    console.log('✅ Stop Fare Map populated successfully');
    console.log('📊 Fare map size:', trip.stopFareMap.size, 'stop combinations');
    
    return trip.stopFareMap;
  } catch (error) {
    console.error('❌ Error populating fare map:', error);
    throw error;
  }
}

async function testBookingFlow(trip) {
  try {
    console.log('\n🎫 Testing Booking Flow...');
    
    // Get available seats
    const availableSeats = trip.getAvailableSeats();
    console.log('✅ Available seats:', availableSeats.length);
    
    // Test booking a seat
    if (availableSeats.length > 0) {
      const seatToBook = availableSeats[0];
      console.log('🎫 Booking seat:', seatToBook.seatNumber);
      
      // Note: In real scenario, you'd need a user ID and booking ID
      // trip.bookSeat(seatToBook.seatNumber, userId, bookingId);
      
      console.log('✅ Seat booking simulation completed');
    }
    
    // Test fare calculation between stops
    const route = await Route.findById(trip.routeId);
    const allStops = route.getAllStops();
    if (allStops.length >= 2) {
      const fare = trip.getFareBetweenStops(allStops[0].stopName, allStops[1].stopName);
      console.log('💰 Sample fare calculation:', allStops[0].stopName, '→', allStops[1].stopName, '= ₹' + fare);
    }
    
  } catch (error) {
    console.error('❌ Error testing booking flow:', error);
    throw error;
  }
}

async function displaySummary(route, trip) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 ENHANCED ROUTE & TRIP MANAGEMENT - TEST SUMMARY');
  console.log('='.repeat(60));
  
  console.log('\n🛣️ ROUTE DETAILS:');
  console.log(`   Route: ${route.routeNumber} - ${route.routeName}`);
  console.log(`   Distance: ${route.totalDistance} km`);
  console.log(`   Duration: ${route.estimatedDuration} minutes`);
  console.log(`   Stops: ${route.stops.length} intermediate stops`);
  console.log(`   Fare per KM: ₹${route.farePerKm}`);
  console.log(`   Fare Matrix: ${route.fareMatrix.size} stop combinations`);
  
  console.log('\n🚍 TRIP DETAILS:');
  console.log(`   Trip ID: ${trip._id}`);
  console.log(`   Service Date: ${trip.serviceDate.toDateString()}`);
  console.log(`   Time: ${trip.startTime} - ${trip.endTime}`);
  console.log(`   Capacity: ${trip.capacity} seats`);
  console.log(`   Seat Layout: ${trip.seatLayout?.rows || 'N/A'} rows × ${trip.seatLayout?.seatsPerRow || 'N/A'} seats`);
  console.log(`   Stop Fare Map: ${trip.stopFareMap.size} combinations`);
  
  console.log('\n✅ ALL TESTS COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(60));
}

async function cleanup() {
  try {
    console.log('\n🧹 Cleaning up test data...');
    
    // Delete test data in reverse order
    await Trip.deleteMany({ notes: 'Test trip for enhanced workflow' });
    await Route.deleteMany({ routeNumber: { $regex: /^R[0-9]+$/ } }); // Clean up routes with pattern R{timestamp}
    await Bus.deleteMany({ busNumber: { $regex: /^MH01-AB-[0-9]+$/ } }); // Clean up buses with pattern MH01-AB-{timestamp}
    await User.deleteMany({ 
      $or: [
        { email: { $regex: /^rajesh\.driver\.[0-9]+@yatrik\.com$/ } },
        { email: { $regex: /^priya\.conductor\.[0-9]+@yatrik\.com$/ } },
        { email: 'admin@yatrik.com' }
      ]
    });
    await Depot.deleteMany({ depotCode: { $regex: /^MUM[0-9]+$/ } }); // Clean up depots with pattern MUM{timestamp}
    
    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

async function runTest() {
  try {
    console.log('🚀 Starting Enhanced Route & Trip Management Test...');
    
    await connectDB();
    
    // Setup phase
    const farePolicy = await setupFarePolicy();
    const adminUser = await createAdminUser();
    const depot = await createDepot(adminUser);
    const { driver, conductor } = await createUsers();
    const bus = await createBus(adminUser);
    
    // Route phase
    const route = await createRoute(adminUser);
    const fareMatrix = await calculateFareMatrix(route);
    
    // Trip phase
    const trip = await createTrip(adminUser);
    const seatLayout = await generateSeatLayout(trip);
    const fareMap = await populateFareMap(trip);
    
    // Test phase
    await testBookingFlow(trip);
    
    // Summary
    await displaySummary(route, trip);
    
    // Cleanup (optional - comment out to keep test data)
    // await cleanup();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the test
if (require.main === module) {
  runTest();
}

module.exports = { runTest };
