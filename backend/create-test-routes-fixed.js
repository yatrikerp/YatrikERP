// Simple script to create test routes directly in the database
const mongoose = require('mongoose');
const Route = require('./models/Route');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/yatrik-erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('✅ Connected to MongoDB');
  
  try {
    // Check existing routes
    const existingRoutes = await Route.find({});
    console.log(`📊 Found ${existingRoutes.length} existing routes`);
    
    if (existingRoutes.length === 0) {
      console.log('🚀 Creating test Kerala routes...');
      
      // Create sample routes
      const sampleRoutes = [
        {
          routeNumber: 'KL-THR-GUR-001',
          routeName: 'Thrissur to Guruvayur',
          startingPoint: {
            city: 'Thrissur',
            location: 'Thrissur Bus Station',
            coordinates: { latitude: 10.5276, longitude: 76.2144 }
          },
          endingPoint: {
            city: 'Guruvayur',
            location: 'Guruvayur Temple',
            coordinates: { latitude: 10.5942, longitude: 76.0407 }
          },
          totalDistance: 29,
          estimatedDuration: 45,
          depot: {
            depotId: new mongoose.Types.ObjectId(),
            depotName: 'Thrissur Depot',
            depotLocation: 'Thrissur Central'
          },
          baseFare: 10,
          farePerKm: 2.5,
          status: 'active',
          features: [],
          notes: 'Auto-generated Kerala route: intercity',
          intermediateStops: [],
          createdBy: new mongoose.Types.ObjectId()
        },
        {
          routeNumber: 'KL-THR-KOC-002',
          routeName: 'Thrissur to Kochi',
          startingPoint: {
            city: 'Thrissur',
            location: 'Thrissur Bus Station',
            coordinates: { latitude: 10.5276, longitude: 76.2144 }
          },
          endingPoint: {
            city: 'Kochi',
            location: 'Kochi Bus Station',
            coordinates: { latitude: 9.9312, longitude: 76.2673 }
          },
          totalDistance: 74,
          estimatedDuration: 120,
          depot: {
            depotId: new mongoose.Types.ObjectId(),
            depotName: 'Thrissur Depot',
            depotLocation: 'Thrissur Central'
          },
          baseFare: 15,
          farePerKm: 2.5,
          status: 'active',
          features: [],
          notes: 'Auto-generated Kerala route: intercity',
          intermediateStops: [],
          createdBy: new mongoose.Types.ObjectId()
        },
        {
          routeNumber: 'KL-TVL-PTA-003',
          routeName: 'Thiruvalla to Pathanamthitta',
          startingPoint: {
            city: 'Thiruvalla',
            location: 'Thiruvalla Bus Station',
            coordinates: { latitude: 9.3833, longitude: 76.5667 }
          },
          endingPoint: {
            city: 'Pathanamthitta',
            location: 'Pathanamthitta Bus Station',
            coordinates: { latitude: 9.2667, longitude: 76.7833 }
          },
          totalDistance: 18,
          estimatedDuration: 30,
          depot: {
            depotId: new mongoose.Types.ObjectId(),
            depotName: 'Thiruvalla Depot',
            depotLocation: 'Thiruvalla Central'
          },
          baseFare: 8,
          farePerKm: 2.5,
          status: 'active',
          features: [],
          notes: 'Auto-generated Kerala route: intercity',
          intermediateStops: [],
          createdBy: new mongoose.Types.ObjectId()
        }
      ];
      
      // Insert routes one by one to avoid bulk insert issues
      const createdRoutes = [];
      for (const routeData of sampleRoutes) {
        try {
          const route = new Route(routeData);
          const savedRoute = await route.save();
          createdRoutes.push(savedRoute);
          console.log(`✅ Created route: ${routeData.routeName}`);
        } catch (error) {
          console.error(`❌ Error creating route ${routeData.routeName}:`, error.message);
        }
      }
      
      console.log(`✅ Successfully created ${createdRoutes.length} test routes`);
      
    } else {
      console.log('ℹ️ Routes already exist. Sample routes:');
      existingRoutes.slice(0, 3).forEach(route => {
        console.log(`  - ${route.routeName} (${route.routeNumber})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  // Close connection
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
  process.exit(0);
  
}).catch(error => {
  console.error('❌ Database connection error:', error.message);
  process.exit(1);
});

