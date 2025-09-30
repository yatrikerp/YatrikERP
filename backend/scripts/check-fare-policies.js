const mongoose = require('mongoose');
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

// Check fare policies
const checkFarePolicies = async () => {
  try {
    console.log('🔍 Checking fare policies in database...');
    
    const policies = await FarePolicy.find({ isActive: true })
      .select('name busType minimumFare ratePerKm isActive')
      .sort({ busType: 1 });
    
    console.log(`📊 Found ${policies.length} active fare policies:`);
    console.log('');
    
    policies.forEach(policy => {
      console.log(`🚌 Bus Type: ${policy.busType}`);
      console.log(`   Name: ${policy.name}`);
      console.log(`   Minimum Fare: ₹${policy.minimumFare}`);
      console.log(`   Rate Per KM: ₹${policy.ratePerKm}`);
      console.log('');
    });
    
    // Check if we have policies for all bus types
    const expectedBusTypes = ['ordinary', 'fast_passenger', 'super_fast', 'ac', 'volvo', 'garuda'];
    const existingBusTypes = policies.map(p => p.busType);
    
    console.log('🔍 Bus Type Coverage:');
    expectedBusTypes.forEach(busType => {
      const hasPolicy = existingBusTypes.includes(busType);
      console.log(`   ${busType}: ${hasPolicy ? '✅' : '❌'}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking fare policies:', error);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await checkFarePolicies();
    console.log('\n✅ Fare policy check completed!');
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

