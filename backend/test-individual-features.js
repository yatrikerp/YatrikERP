/**
 * Individual Feature Tests for Enhanced Route & Trip Management
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Route = require('./models/Route');
const Trip = require('./models/Trip');

async function testIndividualFeatures() {
  try {
    console.log('🧪 Testing Individual Enhanced Features...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const timestamp = Date.now();
    
    // Test 1: Route with stops
    console.log('\n📋 Test 1: Route with Multiple Stops');
    const route = new Route({
      routeNumber: `TEST${timestamp}`,
      routeName: `Test Route ${timestamp}`,
      startingPoint: { city: 'Mumbai', location: 'Mumbai Central' },
      endingPoint: { city: 'Pune', location: 'Pune Station' },
      totalDistance: 100,
      estimatedDuration: 120,
      stops: [
        {
          stopName: 'Stop 1',
          city: 'City 1',
          location: 'Location 1',
          stopNumber: 1,
          distanceFromPrev: 25,
          distanceFromStart: 25,
          estimatedArrival: 30,
          isActive: true
        },
        {
          stopName: 'Stop 2',
          city: 'City 2',
          location: 'Location 2',
          stopNumber: 2,
          distanceFromPrev: 30,
          distanceFromStart: 55,
          estimatedArrival: 60,
          isActive: true
        }
      ],
      schedules: [{
        scheduleId: `SCH_TEST${timestamp}`,
        departureTime: '08:00',
        arrivalTime: '10:00',
        frequency: 'daily',
        isActive: true,
        effectiveFrom: new Date(),
        createdBy: new mongoose.Types.ObjectId(),
        createdAt: new Date()
      }],
      depot: {
        depotId: new mongoose.Types.ObjectId(),
        depotName: 'Test Depot',
        depotLocation: 'Test Location'
      },
      baseFare: 50,
      farePerKm: 2.0,
      status: 'active',
      features: ['AC'],
      notes: 'Individual test route',
      createdBy: new mongoose.Types.ObjectId()
    });
    
    await route.save();
    console.log('✅ Route created with', route.stops.length, 'stops');
    
    // Test 2: Fare matrix calculation
    console.log('\n💰 Test 2: Fare Matrix Calculation');
    const fareMatrix = route.calculateFareMatrix();
    console.log('✅ Fare matrix calculated:', route.fareMatrix.size, 'combinations');
    
    // Test 3: Trip creation
    console.log('\n🚍 Test 3: Trip Creation');
    const trip = new Trip({
      routeId: route._id,
      busId: new mongoose.Types.ObjectId(),
      serviceDate: new Date('2024-01-15'),
      startTime: '08:00',
      endTime: '10:00',
      fare: 100,
      capacity: 30,
      depotId: new mongoose.Types.ObjectId(),
      status: 'scheduled',
      notes: 'Individual test trip',
      createdBy: new mongoose.Types.ObjectId()
    });
    
    await trip.save();
    console.log('✅ Trip created');
    
    // Test 4: Seat layout generation
    console.log('\n🪑 Test 4: Seat Layout Generation');
    const seatLayout = trip.generateSeatLayout(30, 'ac_seater');
    console.log('✅ Seat layout generated:');
    console.log('   - Total seats:', seatLayout.totalSeats);
    console.log('   - Ladies seats:', seatLayout.ladiesSeats);
    console.log('   - Disabled seats:', seatLayout.disabledSeats);
    console.log('   - Layout:', seatLayout.rows, 'rows ×', seatLayout.seatsPerRow, 'seats');
    
    // Test 5: Fare map population
    console.log('\n💰 Test 5: Fare Map Population');
    await trip.populateStopFareMap();
    console.log('✅ Fare map populated:', trip.stopFareMap.size, 'combinations');
    
    // Test 6: Seat availability
    console.log('\n🪑 Test 6: Seat Availability');
    const availableSeats = trip.getAvailableSeats();
    console.log('✅ Available seats:', availableSeats.length);
    
    // Test 7: Different bus types
    console.log('\n🚌 Test 7: Different Bus Types');
    const sleeperTrip = new Trip({
      routeId: route._id,
      busId: new mongoose.Types.ObjectId(),
      serviceDate: new Date('2024-01-16'),
      startTime: '22:00',
      endTime: '06:00',
      fare: 200,
      capacity: 20,
      depotId: new mongoose.Types.ObjectId(),
      status: 'scheduled',
      notes: 'Sleeper test trip',
      createdBy: new mongoose.Types.ObjectId()
    });
    
    const sleeperLayout = sleeperTrip.generateSeatLayout(20, 'ac_sleeper');
    console.log('✅ Sleeper layout generated:');
    console.log('   - Total seats:', sleeperLayout.totalSeats);
    console.log('   - Sleeper seats:', sleeperLayout.sleeperSeats);
    console.log('   - Layout:', sleeperLayout.rows, 'rows ×', sleeperLayout.seatsPerRow, 'seats');
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('🎉 ALL INDIVIDUAL FEATURES TESTED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('✅ Route with multiple stops');
    console.log('✅ Fare matrix calculation');
    console.log('✅ Trip creation');
    console.log('✅ Seat layout generation (AC Seater)');
    console.log('✅ Seat layout generation (AC Sleeper)');
    console.log('✅ Fare map population');
    console.log('✅ Seat availability tracking');
    console.log('='.repeat(50));
    
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await Trip.deleteMany({ notes: { $in: ['Individual test trip', 'Sleeper test trip'] } });
    await Route.deleteMany({ routeNumber: `TEST${timestamp}` });
    console.log('✅ Cleanup completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

testIndividualFeatures();

