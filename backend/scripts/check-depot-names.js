const mongoose = require('mongoose');
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

// Check depot names
const checkDepotNames = async () => {
  try {
    console.log('🔍 Checking depot names in database...');
    
    const depots = await Depot.find({ isActive: true }).select('depotName name _id');
    console.log(`\n📊 Found ${depots.length} depots:`);
    
    depots.forEach((depot, index) => {
      console.log(`${index + 1}. ${depot.depotName || depot.name} (ID: ${depot._id})`);
    });
    
    console.log('\n🎯 Looking for Kerala-related depots:');
    const keralaDepots = depots.filter(depot => {
      const name = (depot.depotName || depot.name || '').toLowerCase();
      return name.includes('thrissur') || name.includes('kannur') || name.includes('kozhikode') || 
             name.includes('ernakulam') || name.includes('palakkad') || name.includes('kollam') ||
             name.includes('alappuzha') || name.includes('thiruvananthapuram') || name.includes('kottayam');
    });
    
    console.log(`\n✅ Found ${keralaDepots.length} Kerala-related depots:`);
    keralaDepots.forEach(depot => {
      console.log(`- ${depot.depotName || depot.name} (ID: ${depot._id})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking depot names:', error);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await checkDepotNames();
    console.log('\n✅ Depot check completed!');
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

