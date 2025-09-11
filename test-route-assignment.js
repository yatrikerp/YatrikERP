const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Bus = require('./backend/models/Bus');
const Route = require('./backend/models/Route');
const Depot = require('./backend/models/Depot');
const User = require('./backend/models/User');

async function testRouteAssignment() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');
    console.log('Connected to MongoDB');

    // Find a depot
    const depot = await Depot.findOne();
    if (!depot) {
      console.log('No depot found. Please create a depot first.');
      return;
    }
    console.log('Found depot:', depot.depotName);

    // Find a bus
    const bus = await Bus.findOne({ depotId: depot._id });
    if (!bus) {
      console.log('No bus found in this depot. Please create a bus first.');
      return;
    }
    console.log('Found bus:', bus.busNumber);

    // Find a route
    const route = await Route.findOne({ status: 'active' });
    if (!route) {
      console.log('No active route found. Please create a route first.');
      return;
    }
    console.log('Found route:', route.routeName);

    // Test route assignment
    console.log('\n=== Testing Route Assignment ===');
    
    // Update bus with current route
    await Bus.findByIdAndUpdate(bus._id, {
      $set: {
        currentRoute: {
          routeId: route._id,
          routeName: route.routeName,
          routeNumber: route.routeNumber,
          assignedAt: new Date(),
          assignedBy: depot._id
        },
        lastUpdated: new Date()
      }
    });

    // Add bus to route's assigned buses
    await Route.findByIdAndUpdate(route._id, {
      $addToSet: {
        assignedBuses: {
          busId: bus._id,
          assignedAt: new Date(),
          assignedBy: depot._id,
          active: true
        }
      }
    });

    console.log('✅ Route assignment completed successfully!');
    console.log(`Route ${route.routeName} assigned to bus ${bus.busNumber}`);

    // Verify the assignment
    const updatedBus = await Bus.findById(bus._id).populate('currentRoute.routeId');
    const updatedRoute = await Route.findById(route._id).populate('assignedBuses.busId');

    console.log('\n=== Verification ===');
    console.log('Bus current route:', updatedBus.currentRoute);
    console.log('Route assigned buses:', updatedRoute.assignedBuses.length);

  } catch (error) {
    console.error('Error testing route assignment:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testRouteAssignment();
