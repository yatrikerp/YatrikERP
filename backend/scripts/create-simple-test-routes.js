const mongoose = require('mongoose');
const Route = require('../models/Route');
const Depot = require('../models/Depot');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://yatrik:yatrik123@cluster0.3qt2hfg.mongodb.net/yatrik-erp?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create simple test routes
const createSimpleTestRoutes = async () => {
  try {
    console.log('🚀 Creating simple test routes...');
    
    // Get a depot
    const depot = await Depot.findOne({ isActive: true });
    if (!depot) {
      console.error('❌ No depot found');
      return;
    }
    
    console.log(`✅ Found depot: ${depot.depotName || depot.name}`);
    
    // Create a simple route without schedules
    const routeData = {
      routeNumber: 'TEST-001',
      routeName: 'Test Route 1',
      startingPoint: {
        city: 'Thrissur',
        location: 'Thrissur Bus Station, Kerala',
        coordinates: { latitude: 10.5276, longitude: 76.2144 }
      },
      endingPoint: {
        city: 'Kochi',
        location: 'Kochi Bus Station, Kerala',
        coordinates: { latitude: 9.9312, longitude: 76.2673 }
      },
      totalDistance: 74,
      estimatedDuration: 120,
      depot: {
        depotId: depot._id,
        depotName: depot.depotName || depot.name,
        depotLocation: `${depot.depotName || depot.name}, Kerala`
      },
      busType: 'ordinary',
      baseFare: 50,
      farePerKm: 1.5,
      status: 'active',
      features: ['WiFi'],
      notes: 'Test route',
      intermediateStops: [],
      createdBy: '68a14f559891fce2ae3c7f65',
      isActive: true
    };
    
    // Try to create the route
    const newRoute = new Route(routeData);
    await newRoute.save();
    
    console.log('✅ Successfully created test route:', newRoute.routeNumber);
    
    // Check total routes
    const totalRoutes = await Route.countDocuments({ isActive: true });
    console.log(`🎉 Total routes in database: ${totalRoutes}`);
    
  } catch (error) {
    console.error('❌ Error creating test routes:', error);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await createSimpleTestRoutes();
    console.log('\n✅ Test route creation completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  main();
}

