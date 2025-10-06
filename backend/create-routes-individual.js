const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Depot = require('./models/Depot');
const Route = require('./models/Route');

async function createRoutes() {
  try {
    console.log('🚀 Creating sample routes...');
    
    // Get existing depots
    const depots = await Depot.find().limit(3);
    console.log('📊 Found', depots.length, 'depots');
    
    if (depots.length === 0) {
      console.log('❌ No depots found');
      return;
    }
    
    // Create routes one by one
    const routes = [
      {
        routeName: 'Mumbai to Pune Express',
        routeNumber: 'R001',
        startingPoint: {
          city: 'Mumbai',
          location: 'Mumbai Central Bus Stand',
          coordinates: { latitude: 19.0760, longitude: 72.8777 }
        },
        endingPoint: {
          city: 'Pune',
          location: 'Pune Bus Stand',
          coordinates: { latitude: 18.5204, longitude: 73.8567 }
        },
        totalDistance: 150,
        estimatedDuration: 180,
        status: 'active',
        baseFare: 50,
        farePerKm: 2.5,
        depot: {
          depotId: depots[0]._id,
          depotName: depots[0].depotName,
          depotLocation: depots[0].location || 'Mumbai Central'
        },
        createdBy: depots[0]._id
      },
      {
        routeName: 'Delhi to Jaipur Highway',
        routeNumber: 'R002',
        startingPoint: {
          city: 'Delhi',
          location: 'Delhi Bus Terminal',
          coordinates: { latitude: 28.7041, longitude: 77.1025 }
        },
        endingPoint: {
          city: 'Jaipur',
          location: 'Jaipur Bus Stand',
          coordinates: { latitude: 26.9124, longitude: 75.7873 }
        },
        totalDistance: 280,
        estimatedDuration: 240,
        status: 'active',
        baseFare: 80,
        farePerKm: 2.2,
        depot: {
          depotId: depots[1] ? depots[1]._id : depots[0]._id,
          depotName: depots[1] ? depots[1].depotName : depots[0].depotName,
          depotLocation: depots[1] ? (depots[1].location || 'Delhi Central') : (depots[0].location || 'Delhi Central')
        },
        createdBy: depots[0]._id
      },
      {
        routeName: 'Bangalore to Chennai Coastal',
        routeNumber: 'R003',
        startingPoint: {
          city: 'Bangalore',
          location: 'Bangalore Bus Station',
          coordinates: { latitude: 12.9716, longitude: 77.5946 }
        },
        endingPoint: {
          city: 'Chennai',
          location: 'Chennai Central Bus Stand',
          coordinates: { latitude: 13.0827, longitude: 80.2707 }
        },
        totalDistance: 350,
        estimatedDuration: 300,
        status: 'active',
        baseFare: 100,
        farePerKm: 2.8,
        depot: {
          depotId: depots[2] ? depots[2]._id : depots[0]._id,
          depotName: depots[2] ? depots[2].depotName : depots[0].depotName,
          depotLocation: depots[2] ? (depots[2].location || 'Bangalore Central') : (depots[0].location || 'Bangalore Central')
        },
        createdBy: depots[0]._id
      }
    ];
    
    // Create routes one by one
    const createdRoutes = [];
    for (const routeData of routes) {
      try {
        const route = new Route(routeData);
        const savedRoute = await route.save();
        createdRoutes.push(savedRoute);
        console.log('✅ Created route:', routeData.routeName);
      } catch (error) {
        console.error('❌ Error creating route:', routeData.routeName, error.message);
      }
    }
    
    console.log('\n🎉 Routes created successfully!');
    console.log('📊 Summary:');
    console.log('- Routes created:', createdRoutes.length);
    
  } catch (error) {
    console.error('❌ Error creating routes:', error);
  } finally {
    mongoose.connection.close();
  }
}

createRoutes();

