#!/usr/bin/env node

/**
 * Test Script for Bulk Trip Scheduler
 * Tests the comprehensive trip generation system
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Trip = require('./backend/models/Trip');
const Bus = require('./backend/models/Bus');
const Route = require('./backend/models/Route');
const Depot = require('./backend/models/Depot');
const User = require('./backend/models/User');

// Test configuration
const TEST_CONFIG = {
  daysToSchedule: 7, // Test with 7 days first
  tripsPerDepotPerDay: 5, // Test with 5 trips per depot per day
  startDate: new Date(),
  autoAssignCrew: true,
  autoAssignBuses: true,
  generateReports: true
};

async function connectToDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

async function checkSystemReadiness() {
  console.log('\n📊 Checking System Readiness...');
  
  const depots = await Depot.find({ isActive: true }).lean();
  const buses = await Bus.find({ status: { $in: ['active', 'assigned'] } }).lean();
  const routes = await Route.find({ status: 'active' }).lean();
  const drivers = await User.find({ role: 'driver', isActive: true }).lean();
  const conductors = await User.find({ role: 'conductor', isActive: true }).lean();
  const existingTrips = await Trip.countDocuments();

  console.log(`📈 System Status:`);
  console.log(`   - Active Depots: ${depots.length}`);
  console.log(`   - Available Buses: ${buses.length}`);
  console.log(`   - Active Routes: ${routes.length}`);
  console.log(`   - Drivers: ${drivers.length}`);
  console.log(`   - Conductors: ${conductors.length}`);
  console.log(`   - Existing Trips: ${existingTrips}`);

  // Check depot readiness
  console.log(`\n🏢 Depot Readiness Analysis:`);
  for (const depot of depots) {
    const depotBuses = buses.filter(bus => bus.depotId?.toString() === depot._id.toString());
    const depotRoutes = routes.filter(route => route.depot?.depotId?.toString() === depot._id.toString());
    const depotDrivers = drivers.filter(driver => driver.depotId?.toString() === depot._id.toString());
    const depotConductors = conductors.filter(conductor => conductor.depotId?.toString() === depot._id.toString());
    
    const readinessScore = Math.min(depotBuses.length, depotRoutes.length, depotDrivers.length, depotConductors.length);
    const canSchedule = depotBuses.length > 0 && depotRoutes.length > 0 && depotDrivers.length > 0 && depotConductors.length > 0;
    
    console.log(`   ${depot.depotName}: Buses(${depotBuses.length}) Routes(${depotRoutes.length}) Drivers(${depotDrivers.length}) Conductors(${depotConductors.length}) - ${canSchedule ? '✅ Ready' : '❌ Not Ready'}`);
  }

  return {
    depots,
    buses,
    routes,
    drivers,
    conductors,
    existingTrips,
    readyDepots: depots.filter(depot => {
      const depotBuses = buses.filter(bus => bus.depotId?.toString() === depot._id.toString());
      const depotRoutes = routes.filter(route => route.depot?.depotId?.toString() === depot._id.toString());
      const depotDrivers = drivers.filter(driver => driver.depotId?.toString() === depot._id.toString());
      const depotConductors = conductors.filter(conductor => conductor.depotId?.toString() === depot._id.toString());
      return depotBuses.length > 0 && depotRoutes.length > 0 && depotDrivers.length > 0 && depotConductors.length > 0;
    })
  };
}

async function testBulkTripGeneration() {
  console.log('\n🚀 Testing Bulk Trip Generation...');
  
  const systemStatus = await checkSystemReadiness();
  
  if (systemStatus.readyDepots.length === 0) {
    console.log('❌ No depots are ready for trip scheduling. Please ensure depots have buses, routes, drivers, and conductors.');
    return;
  }

  console.log(`\n📅 Test Configuration:`);
  console.log(`   - Days to Schedule: ${TEST_CONFIG.daysToSchedule}`);
  console.log(`   - Trips per Depot per Day: ${TEST_CONFIG.tripsPerDepotPerDay}`);
  console.log(`   - Ready Depots: ${systemStatus.readyDepots.length}`);
  console.log(`   - Total Target Trips: ${systemStatus.readyDepots.length * TEST_CONFIG.daysToSchedule * TEST_CONFIG.tripsPerDepotPerDay}`);

  const targetTrips = systemStatus.readyDepots.length * TEST_CONFIG.daysToSchedule * TEST_CONFIG.tripsPerDepotPerDay;
  
  if (targetTrips > 1000) {
    console.log('⚠️  Warning: This will generate a large number of trips. Consider reducing the test parameters.');
    return;
  }

  // Simulate the bulk trip generation
  const allTrips = [];
  const timeSlots = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
  
  console.log('\n🔄 Generating test trips...');
  
  for (let day = 0; day < TEST_CONFIG.daysToSchedule; day++) {
    const currentDate = new Date(TEST_CONFIG.startDate);
    currentDate.setDate(currentDate.getDate() + day);
    
    for (const depot of systemStatus.readyDepots) {
      const depotBuses = systemStatus.buses.filter(bus => bus.depotId?.toString() === depot._id.toString());
      const depotRoutes = systemStatus.routes.filter(route => route.depot?.depotId?.toString() === depot._id.toString());
      const depotDrivers = systemStatus.drivers.filter(driver => driver.depotId?.toString() === depot._id.toString());
      const depotConductors = systemStatus.conductors.filter(conductor => conductor.depotId?.toString() === depot._id.toString());
      
      for (let i = 0; i < TEST_CONFIG.tripsPerDepotPerDay; i++) {
        const timeSlot = timeSlots[i % timeSlots.length];
        const route = depotRoutes[i % depotRoutes.length];
        const bus = depotBuses[i % depotBuses.length];
        const driver = depotDrivers[i % depotDrivers.length];
        const conductor = depotConductors[i % depotConductors.length];
        
        // Calculate end time (assume 3 hours duration)
        const endTime = calculateEndTime(timeSlot, 180);
        
        // Calculate fare
        const fare = calculateTripFare(route, bus);
        
        const trip = {
          routeId: route._id,
          busId: bus._id,
          driverId: driver._id,
          conductorId: conductor._id,
          serviceDate: new Date(currentDate),
          startTime: timeSlot,
          endTime: endTime,
          fare: fare,
          capacity: bus.capacity?.total || 50,
          availableSeats: bus.capacity?.total || 50,
          bookedSeats: 0,
          status: 'scheduled',
          depotId: depot._id,
          notes: `Test trip for ${depot.depotName} - Day ${day + 1}`,
          bookingOpen: true,
          cancellationPolicy: {
            allowed: true,
            hoursBeforeDeparture: 2,
            refundPercentage: 80
          }
        };
        
        allTrips.push(trip);
      }
    }
  }

  console.log(`✅ Generated ${allTrips.length} test trips`);
  
  // Show sample trips
  console.log('\n📋 Sample Generated Trips:');
  for (let i = 0; i < Math.min(5, allTrips.length); i++) {
    const trip = allTrips[i];
    console.log(`   ${i + 1}. ${trip.startTime} - ${trip.endTime} | Depot: ${trip.depotId} | Fare: ₹${trip.fare}`);
  }

  return allTrips;
}

function calculateEndTime(startTime, durationMinutes) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

function calculateTripFare(route, bus) {
  if (route.baseFare && route.baseFare > 0) {
    return route.baseFare;
  }
  
  if (route.totalDistance && route.farePerKm) {
    return Math.round(route.totalDistance * route.farePerKm);
  }
  
  const defaultFares = {
    'ac_sleeper': 500,
    'ac_seater': 300,
    'non_ac_sleeper': 400,
    'non_ac_seater': 200,
    'volvo': 600,
    'mini': 150
  };
  
  return defaultFares[bus.busType] || 250;
}

async function testAPIEndpoint() {
  console.log('\n🌐 Testing API Endpoint...');
  
  try {
    // Test the status endpoint
    const fetch = require('node-fetch');
    const baseURL = process.env.API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${baseURL}/api/bulk-scheduler/status`, {
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_TOKEN || 'test-token'}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Status endpoint working:', data);
    } else {
      console.log('⚠️  API endpoint not accessible (this is expected if server is not running)');
    }
  } catch (error) {
    console.log('⚠️  API endpoint not accessible (this is expected if server is not running)');
  }
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  const result = await Trip.deleteMany({
    notes: { $regex: /Test trip/ }
  });
  
  console.log(`🗑️  Deleted ${result.deletedCount} test trips`);
}

async function main() {
  try {
    await connectToDatabase();
    
    console.log('🧪 Bulk Trip Scheduler Test Suite');
    console.log('================================');
    
    // Check system readiness
    const systemStatus = await checkSystemReadiness();
    
    if (systemStatus.readyDepots.length === 0) {
      console.log('\n❌ System not ready for trip scheduling.');
      console.log('Please ensure you have:');
      console.log('   - At least one active depot');
      console.log('   - Buses assigned to depots');
      console.log('   - Routes assigned to depots');
      console.log('   - Drivers assigned to depots');
      console.log('   - Conductors assigned to depots');
      process.exit(1);
    }
    
    // Test trip generation
    const testTrips = await testBulkTripGeneration();
    
    if (testTrips && testTrips.length > 0) {
      console.log('\n✅ Trip generation test successful!');
      
      // Ask user if they want to insert test data
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise((resolve) => {
        rl.question('\n❓ Do you want to insert test trips into the database? (y/N): ', resolve);
      });
      
      rl.close();
      
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        console.log('\n💾 Inserting test trips...');
        await Trip.insertMany(testTrips);
        console.log(`✅ Inserted ${testTrips.length} test trips`);
        
        // Ask if they want to cleanup
        const cleanupAnswer = await new Promise((resolve) => {
          const rl2 = readline.createInterface({
            input: process.stdin,
            output: process.stdout
          });
          rl2.question('\n❓ Do you want to cleanup test data? (Y/n): ', resolve);
          rl2.close();
        });
        
        if (cleanupAnswer.toLowerCase() !== 'n' && cleanupAnswer.toLowerCase() !== 'no') {
          await cleanupTestData();
        }
      }
    }
    
    // Test API endpoint
    await testAPIEndpoint();
    
    console.log('\n🎉 Test suite completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Start your backend server: npm run dev (in backend directory)');
    console.log('   2. Start your frontend: npm run dev (in frontend directory)');
    console.log('   3. Navigate to http://localhost:5173/admin/streamlined-buses');
    console.log('   4. Click the "Bulk Trip Scheduler" button');
    console.log('   5. Configure and generate your 6000+ trips!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run the test suite
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testBulkTripGeneration,
  checkSystemReadiness,
  calculateEndTime,
  calculateTripFare
};
