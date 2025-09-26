console.log('🚀 Basic test starting...');

const mongoose = require('mongoose');
require('dotenv').config();

console.log('📦 Dependencies loaded');

async function basicTest() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log('📡 MongoDB URI exists:', !!process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Test basic model loading
    const Route = require('./models/Route');
    console.log('✅ Route model loaded');
    
    const Trip = require('./models/Trip');
    console.log('✅ Trip model loaded');
    
    // Test creating a simple route
    console.log('📋 Testing route creation...');
    const route = new Route({
      routeNumber: 'BASIC001',
      routeName: 'Basic Test Route',
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
      schedules: [{
        scheduleId: 'SCH_BASIC001_' + Date.now(),
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
        depotName: 'Test Depot',
        depotLocation: 'Test Location'
      },
      baseFare: 50,
      farePerKm: 2.5,
      status: 'active',
      features: ['AC'],
      notes: 'Basic test route',
      createdBy: new mongoose.Types.ObjectId()
    });
    
    await route.save();
    console.log('✅ Route saved successfully');
    
    // Test fare matrix calculation
    console.log('💰 Testing fare matrix calculation...');
    const fareMatrix = route.calculateFareMatrix();
    console.log('✅ Fare matrix calculated, size:', route.fareMatrix.size);
    
    // Cleanup
    await Route.deleteMany({ routeNumber: 'BASIC001' });
    console.log('✅ Cleanup completed');
    
    console.log('🎉 Basic test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

basicTest();
