const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./models/User');
const Depot = require('./models/Depot');

async function testStaffAssignment() {
  try {
    console.log('🔍 Testing staff assignment...');
    
    // Get all depots
    const depots = await Depot.find({});
    console.log(`\n📋 Found ${depots.length} depots:`);
    depots.forEach(depot => {
      console.log(`  - ${depot.depotName} (${depot._id})`);
    });
    
    // Get all users with depot assignments
    const usersWithDepots = await User.find({ 
      depotId: { $exists: true, $ne: null },
      role: { $in: ['driver', 'conductor'] }
    });
    console.log(`\n👥 Found ${usersWithDepots.length} staff with depot assignments:`);
    usersWithDepots.forEach(user => {
      console.log(`  - ${user.name} (${user.role}) -> Depot: ${user.depotId}`);
    });
    
    // Check specific depot assignments
    for (const depot of depots) {
      const depotStaff = await User.find({ 
        depotId: depot._id,
        role: { $in: ['driver', 'conductor'] }
      });
      console.log(`\n🏢 ${depot.depotName} has ${depotStaff.length} staff:`);
      depotStaff.forEach(staff => {
        console.log(`  - ${staff.name} (${staff.role}) - ${staff.email}`);
      });
    }
    
    // Check for Pooja Agarwal specifically
    const pooja = await User.findOne({ email: 'pooja.agarwal@yatrik.com' });
    if (pooja) {
      console.log(`\n👤 Pooja Agarwal details:`);
      console.log(`  - Name: ${pooja.name}`);
      console.log(`  - Role: ${pooja.role}`);
      console.log(`  - Depot ID: ${pooja.depotId}`);
      console.log(`  - Status: ${pooja.status}`);
    } else {
      console.log(`\n❌ Pooja Agarwal not found`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testStaffAssignment();
