const mongoose = require('mongoose');
const Route = require('../models/Route');
const FarePolicy = require('../models/FarePolicy');
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

// Verify route fares and bus types
const verifyRouteFares = async () => {
  try {
    console.log('🔍 Verifying route fares and bus types...');
    
    // Get sample routes
    const sampleRoutes = await Route.find({ isActive: true })
      .select('routeNumber routeName busType baseFare farePerKm totalDistance depot')
      .limit(10)
      .sort({ routeNumber: 1 });
    
    console.log(`📊 Sample of ${sampleRoutes.length} routes:`);
    console.log('');
    
    sampleRoutes.forEach(route => {
      console.log(`🚌 ${route.routeNumber}: ${route.routeName}`);
      console.log(`   Bus Type: ${route.busType}`);
      console.log(`   Distance: ${route.totalDistance} km`);
      console.log(`   Base Fare: ₹${route.baseFare}`);
      console.log(`   Fare Per KM: ₹${route.farePerKm}`);
      console.log(`   Depot: ${route.depot?.depotName || 'N/A'}`);
      console.log('');
    });
    
    // Get fare policy summary
    const policies = await FarePolicy.find({ isActive: true })
      .select('busType minimumFare ratePerKm')
      .sort({ busType: 1 });
    
    console.log('💰 Fare Policy Summary:');
    policies.forEach(policy => {
      console.log(`   ${policy.busType}: Min ₹${policy.minimumFare}, Per KM ₹${policy.ratePerKm}`);
    });
    
    // Check for any routes with mismatched fares
    console.log('\n🔍 Checking for fare mismatches...');
    let mismatchCount = 0;
    
    for (const route of sampleRoutes) {
      const policy = await FarePolicy.findOne({ 
        busType: route.busType, 
        isActive: true 
      });
      
      if (policy) {
        const expectedBaseFare = Math.max(
          route.totalDistance * policy.ratePerKm,
          policy.minimumFare
        );
        
        if (Math.abs(route.baseFare - expectedBaseFare) > 1) {
          console.log(`⚠️  Mismatch in ${route.routeNumber}:`);
          console.log(`   Expected: ₹${expectedBaseFare}, Actual: ₹${route.baseFare}`);
          console.log(`   Policy: ${policy.ratePerKm} per km, min ₹${policy.minimumFare}`);
          mismatchCount++;
        }
      }
    }
    
    if (mismatchCount === 0) {
      console.log('✅ All sample routes have correct fare calculations!');
    } else {
      console.log(`⚠️  Found ${mismatchCount} routes with fare mismatches`);
    }
    
  } catch (error) {
    console.error('❌ Error verifying route fares:', error);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await verifyRouteFares();
    console.log('\n✅ Route fare verification completed!');
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

