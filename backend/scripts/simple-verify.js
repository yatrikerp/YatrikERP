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

// Simple verification
const verifyRoutes = async () => {
  try {
    console.log('🔍 Verifying routes in database...');
    
    // Get total count
    const totalRoutes = await Route.countDocuments({ isActive: true });
    console.log(`📊 Total routes in database: ${totalRoutes}`);
    
    // Get sample routes
    const sampleRoutes = await Route.find({ isActive: true })
      .limit(10)
      .select('routeNumber routeName startingPoint.city endingPoint.city busType baseFare depot.depotName');
    
    console.log('\n📋 Sample routes:');
    sampleRoutes.forEach((route, index) => {
      console.log(`${index + 1}. ${route.routeNumber} - ${route.routeName}`);
      console.log(`   From: ${route.startingPoint.city} → To: ${route.endingPoint.city}`);
      console.log(`   Bus Type: ${route.busType}, Base Fare: ₹${route.baseFare}`);
      console.log(`   Depot: ${route.depot?.depotName || 'Unknown'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error verifying routes:', error);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await verifyRoutes();
    console.log('\n✅ Route verification completed!');
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

