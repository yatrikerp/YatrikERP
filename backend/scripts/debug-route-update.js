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

// Debug specific route update (simulating the frontend request)
const debugRouteUpdate = async () => {
  try {
    console.log('🔍 Debugging route update for KL-KAS-BAN-519...');
    
    // Find the specific route mentioned in the error
    const route = await Route.findOne({ routeNumber: 'KL-KAS-BAN-519' });
    if (!route) {
      console.log('❌ Route KL-KAS-BAN-519 not found');
      return;
    }
    
    console.log(`📊 Found route: ${route.routeNumber}`);
    console.log(`   Route ID: ${route._id}`);
    console.log(`   Current bus type: ${route.busType}`);
    console.log(`   Current base fare: ${route.baseFare}`);
    console.log(`   Current fare per km: ${route.farePerKm}`);
    console.log(`   Current depot: ${route.depot?.depotName || 'N/A'}`);
    
    // Test the exact update that would come from frontend
    const updateData = {
      routeNumber: 'KL-KAS-BAN-519',
      routeName: 'Kasargod to Bangalore',
      startingPoint: route.startingPoint,
      endingPoint: route.endingPoint,
      totalDistance: 380,
      estimatedDuration: 540,
      depotId: route.depot?.depotId,
      busType: 'ordinary', // This is what should be sent from frontend after mapping
      baseFare: 380,
      farePerKm: 1,
      status: 'active',
      features: route.features || [],
      notes: route.notes || '',
      intermediateStops: route.intermediateStops || []
    };
    
    console.log('\n🧪 Testing update with data:');
    console.log(JSON.stringify(updateData, null, 2));
    
    try {
      const updatedRoute = await Route.findByIdAndUpdate(
        route._id,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (updatedRoute) {
        console.log('\n✅ Successfully updated route!');
        console.log(`   New bus type: ${updatedRoute.busType}`);
        console.log(`   New base fare: ${updatedRoute.baseFare}`);
        console.log(`   New fare per km: ${updatedRoute.farePerKm}`);
      }
      
    } catch (updateError) {
      console.log('\n❌ Update failed with error:');
      console.log(updateError.message);
      if (updateError.errors) {
        console.log('Validation errors:');
        Object.keys(updateError.errors).forEach(key => {
          console.log(`   ${key}: ${updateError.errors[key].message}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error debugging route update:', error);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await debugRouteUpdate();
    console.log('\n✅ Debug completed!');
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

