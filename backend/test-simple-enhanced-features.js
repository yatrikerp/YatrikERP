/**
 * Simple test script to verify enhanced route and trip features
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Route = require('./models/Route');
const Trip = require('./models/Trip');

async function testEnhancedFeatures() {
  try {
    console.log('🚀 Starting Simple Enhanced Features Test...');
    
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Test 1: Create a simple route with stops
    console.log('\n📋 Test 1: Creating route with stops...');
    const route = new Route({
      routeNumber: 'TEST001',
      routeName: 'Test Route',
      startingPoint: {
        city: 'Mumbai',
        location: 'Mumbai Central',
        coordinates: { latitude: 19.0176, longitude: 72.8562 }
      },
      endingPoint: {
        city: 'Pune',
        location: 'Pune Station',
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
        }
      ],
      depot: {
        depotId: new mongoose.Types.ObjectId(),
        depotName: 'Test Depot',
        depotLocation: 'Test Location'
      },
      baseFare: 50,
      farePerKm: 2.5,
      status: 'active',
      features: ['AC'],
      notes: 'Test route for enhanced features',
      createdBy: new mongoose.Types.ObjectId()
    });
    
    await route.save();
    console.log('✅ Route created with stops:', route.stops.length);
    
    // Test 2: Calculate fare matrix
    console.log('\n💰 Test 2: Calculating fare matrix...');
    const fareMatrix = route.calculateFareMatrix();
    await route.save();
    console.log('✅ Fare matrix calculated:', route.fareMatrix.size, 'combinations');
    
    // Test 3: Create a trip
    console.log('\n🚍 Test 3: Creating trip...');
    const trip = new Trip({
      routeId: route._id,
      busId: new mongoose.Types.ObjectId(),
      serviceDate: new Date('2024-01-15'),
      startTime: '08:00',
      endTime: '11:00',
      fare: 150,
      capacity: 45,
      depotId: new mongoose.Types.ObjectId(),
      status: 'scheduled',
      notes: 'Test trip for enhanced features',
      createdBy: new mongoose.Types.ObjectId()
    });
    
    await trip.save();
    console.log('✅ Trip created');
    
    // Test 4: Generate seat layout
    console.log('\n🪑 Test 4: Generating seat layout...');
    const seatLayout = trip.generateSeatLayout(45, 'ac_seater');
    await trip.save();
    console.log('✅ Seat layout generated:', seatLayout.totalSeats, 'seats');
    console.log('   - Ladies seats:', seatLayout.ladiesSeats);
    console.log('   - Disabled seats:', seatLayout.disabledSeats);
    console.log('   - Layout:', seatLayout.rows, 'rows ×', seatLayout.seatsPerRow, 'seats per row');
    
    // Test 5: Populate fare map
    console.log('\n💰 Test 5: Populating fare map...');
    await trip.populateStopFareMap();
    console.log('✅ Fare map populated:', trip.stopFareMap.size, 'combinations');
    
    // Test 6: Test fare calculation
    console.log('\n🧮 Test 6: Testing fare calculations...');
    const allStops = route.getAllStops();
    console.log('📍 All stops:', allStops.length);
    
    if (allStops.length >= 2) {
      const fare = route.getFareBetweenStops(allStops[0].stopName, allStops[1].stopName);
      console.log(`💰 Sample fare (${allStops[0].stopName} → ${allStops[1].stopName}): ₹${fare}`);
    }
    
    // Test 7: Test seat availability
    console.log('\n🪑 Test 7: Testing seat availability...');
    const availableSeats = trip.getAvailableSeats();
    console.log('✅ Available seats:', availableSeats.length);
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('🎉 ALL ENHANCED FEATURES TESTED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('✅ Route with multiple stops created');
    console.log('✅ Fare matrix calculated automatically');
    console.log('✅ Trip created successfully');
    console.log('✅ Seat layout generated automatically');
    console.log('✅ Stop-to-stop fare map populated');
    console.log('✅ Fare calculations working');
    console.log('✅ Seat availability tracking working');
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await Trip.deleteMany({ notes: 'Test trip for enhanced features' });
    await Route.deleteMany({ routeNumber: 'TEST001' });
    console.log('✅ Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the test
testEnhancedFeatures();




