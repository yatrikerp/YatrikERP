const mongoose = require('mongoose');
const Route = require('../models/Route');
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

// Test route update
const testRouteUpdate = async () => {
  try {
    console.log('🔍 Testing route update...');
    
    // Find a route to test with
    const route = await Route.findOne({ isActive: true });
    if (!route) {
      console.log('❌ No routes found');
      return;
    }
    
    console.log(`📊 Testing with route: ${route.routeNumber}`);
    console.log(`   Current bus type: ${route.busType}`);
    console.log(`   Current base fare: ${route.baseFare}`);
    console.log(`   Current fare per km: ${route.farePerKm}`);
    
    // Test updating with different bus types
    const testBusTypes = ['ordinary', 'fast_passenger', 'super_fast', 'ac', 'volvo', 'garuda'];
    
    for (const busType of testBusTypes) {
      try {
        console.log(`\n🧪 Testing bus type: ${busType}`);
        
        const updateData = {
          busType: busType,
          baseFare: Math.floor(Math.random() * 500) + 100, // Random fare for testing
          farePerKm: Math.random() * 3 + 1 // Random fare per km
        };
        
        const updatedRoute = await Route.findByIdAndUpdate(
          route._id,
          updateData,
          { new: true, runValidators: true }
        );
        
        if (updatedRoute) {
          console.log(`   ✅ Successfully updated to: ${updatedRoute.busType}`);
          console.log(`   Base fare: ${updatedRoute.baseFare}, Fare per km: ${updatedRoute.farePerKm}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Failed to update to ${busType}:`, error.message);
      }
    }
    
    // Restore original values
    await Route.findByIdAndUpdate(route._id, {
      busType: route.busType,
      baseFare: route.baseFare,
      farePerKm: route.farePerKm
    });
    
    console.log('\n✅ Route update test completed');
    
  } catch (error) {
    console.error('❌ Error testing route update:', error);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await testRouteUpdate();
    console.log('\n✅ Test completed!');
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

