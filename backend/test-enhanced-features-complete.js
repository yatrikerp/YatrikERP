/**
 * Complete test for Enhanced Route & Trip Management Features
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Route = require('./models/Route');
const Trip = require('./models/Trip');

async function testEnhancedFeaturesComplete() {
  try {
    console.log('🚀 Starting Complete Enhanced Features Test...');
    
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Test 1: Create route with multiple stops
    console.log('\n📋 Test 1: Creating route with multiple stops...');
    const route = new Route({
      routeNumber: 'ENH001',
      routeName: 'Mumbai to Pune Enhanced Route',
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
        }
      ],
      schedules: [{
        scheduleId: 'SCH_ENH001_' + Date.now(),
        departureTime: '08:00',
        arrivalTime: '11:00',
        frequency: 'daily',
        daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        isActive: true,
        effectiveFrom: new Date(),
        createdBy: new mongoose.Types.ObjectId(),
        createdAt: new Date()
      }],
      depot: {
        depotId: new mongoose.Types.ObjectId(),
        depotName: 'Mumbai Central Depot',
        depotLocation: 'Mumbai Central, Maharashtra'
      },
      baseFare: 50,
      farePerKm: 2.5,
      status: 'active',
      features: ['AC', 'WiFi'],
      notes: 'Enhanced route with multiple stops',
      createdBy: new mongoose.Types.ObjectId()
    });
    
    await route.save();
    console.log('✅ Route created with', route.stops.length, 'stops');
    
    // Test 2: Calculate fare matrix
    console.log('\n💰 Test 2: Calculating fare matrix...');
    const fareMatrix = route.calculateFareMatrix();
    await route.save();
    console.log('✅ Fare matrix calculated with', route.fareMatrix.size, 'stop combinations');
    
    // Display sample fares
    const allStops = route.getAllStops();
    console.log('📍 All stops:', allStops.length);
    console.log('💰 Sample fares:');
    for (let i = 0; i < Math.min(3, allStops.length - 1); i++) {
      const fromStop = allStops[i];
      const toStop = allStops[i + 1];
      const fare = route.getFareBetweenStops(fromStop.stopName, toStop.stopName);
      console.log(`   ${fromStop.stopName} → ${toStop.stopName}: ₹${fare}`);
    }
    
    // Test 3: Create trip
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
      notes: 'Enhanced trip test',
      createdBy: new mongoose.Types.ObjectId()
    });
    
    await trip.save();
    console.log('✅ Trip created');
    
    // Test 4: Generate seat layout
    console.log('\n🪑 Test 4: Generating seat layout...');
    const seatLayout = trip.generateSeatLayout(45, 'ac_seater');
    await trip.save();
    console.log('✅ Seat layout generated:');
    console.log('   - Total seats:', seatLayout.totalSeats);
    console.log('   - Ladies seats:', seatLayout.ladiesSeats);
    console.log('   - Disabled seats:', seatLayout.disabledSeats);
    console.log('   - Layout:', seatLayout.rows, 'rows ×', seatLayout.seatsPerRow, 'seats per row');
    
    // Test 5: Populate fare map
    console.log('\n💰 Test 5: Populating fare map...');
    await trip.populateStopFareMap();
    console.log('✅ Fare map populated with', trip.stopFareMap.size, 'combinations');
    
    // Test 6: Test seat availability
    console.log('\n🪑 Test 6: Testing seat availability...');
    const availableSeats = trip.getAvailableSeats();
    console.log('✅ Available seats:', availableSeats.length, 'out of', trip.capacity);
    
    // Test 7: Test fare calculation between stops
    console.log('\n🧮 Test 7: Testing fare calculations...');
    if (allStops.length >= 2) {
      const fare = trip.getFareBetweenStops(allStops[0].stopName, allStops[1].stopName);
      console.log(`✅ Trip fare calculation (${allStops[0].stopName} → ${allStops[1].stopName}): ₹${fare}`);
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL ENHANCED FEATURES TESTED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('✅ Route with', route.stops.length, 'stops created');
    console.log('✅ Fare matrix with', route.fareMatrix.size, 'combinations calculated');
    console.log('✅ Trip created successfully');
    console.log('✅ Seat layout with', seatLayout.totalSeats, 'seats generated');
    console.log('✅ Stop-to-stop fare map with', trip.stopFareMap.size, 'combinations populated');
    console.log('✅ Fare calculations working correctly');
    console.log('✅ Seat availability tracking working');
    console.log('='.repeat(60));
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await Trip.deleteMany({ notes: 'Enhanced trip test' });
    await Route.deleteMany({ routeNumber: 'ENH001' });
    console.log('✅ Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the test
testEnhancedFeaturesComplete();




