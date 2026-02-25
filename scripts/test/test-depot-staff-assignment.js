const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./backend/models/User');
const Depot = require('./backend/models/Depot');

async function testDepotStaffAssignment() {
  try {
    console.log('🔍 Testing depot staff assignment...');
    
    // Get all depots
    const depots = await Depot.find({});
    console.log(`📋 Found ${depots.length} depots:`);
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
        console.log(`  - ${staff.name} (${staff.role})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testDepotStaffAssignment();

