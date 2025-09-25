const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./models/User');
const Depot = require('./models/Depot');
const Route = require('./models/Route');
const Trip = require('./models/Trip');
const Bus = require('./models/Bus');

async function cleanupDepots() {
  try {
    console.log('🧹 Starting depot cleanup...');
    
    // Get all depots
    const allDepots = await Depot.find({});
    console.log(`📋 Found ${allDepots.length} total depots`);
    
    // Define depots to keep (active depots with real data)
    const depotsToKeep = [
      'Palakad depot',
      'Panthalam Depot', 
      'Kozhikode Central',
      'Thrissur Central',
      'Alappuzha Central',
      'Idukki Central'
    ];
    
    // Find depots to delete
    const depotsToDelete = allDepots.filter(depot => 
      !depotsToKeep.includes(depot.depotName)
    );
    
    console.log(`🗑️ Depots to delete: ${depotsToDelete.length}`);
    depotsToDelete.forEach(depot => {
      console.log(`   - ${depot.depotName} (${depot._id})`);
    });
    
    // Get depots to keep
    const keepDepots = allDepots.filter(depot => 
      depotsToKeep.includes(depot.depotName)
    );
    
    console.log(`✅ Depots to keep: ${keepDepots.length}`);
    keepDepots.forEach(depot => {
      console.log(`   - ${depot.depotName} (${depot._id})`);
    });
    
    // Delete depots and related data
    for (const depot of depotsToDelete) {
      console.log(`\n🗑️ Deleting depot: ${depot.depotName}`);
      
      // 1. Remove staff assignments from this depot
      const staffCount = await User.countDocuments({ depotId: depot._id });
      if (staffCount > 0) {
        await User.updateMany(
          { depotId: depot._id },
          { $unset: { depotId: 1 } }
        );
        console.log(`   ✅ Removed ${staffCount} staff assignments`);
      }
      
      // 2. Delete routes associated with this depot
      const routesCount = await Route.countDocuments({ 'depot.depotId': depot._id });
      if (routesCount > 0) {
        await Route.deleteMany({ 'depot.depotId': depot._id });
        console.log(`   ✅ Deleted ${routesCount} routes`);
      }
      
      // 3. Delete trips associated with this depot
      const tripsCount = await Trip.countDocuments({ 'routeId.depotId': depot._id });
      if (tripsCount > 0) {
        await Trip.deleteMany({ 'routeId.depotId': depot._id });
        console.log(`   ✅ Deleted ${tripsCount} trips`);
      }
      
      // 4. Delete buses associated with this depot
      const busesCount = await Bus.countDocuments({ depotId: depot._id });
      if (busesCount > 0) {
        await Bus.deleteMany({ depotId: depot._id });
        console.log(`   ✅ Deleted ${busesCount} buses`);
      }
      
      // 5. Delete the depot itself
      await Depot.findByIdAndDelete(depot._id);
      console.log(`   ✅ Deleted depot: ${depot.depotName}`);
    }
    
    // Verify cleanup
    console.log('\n🔍 Verification after cleanup:');
    const remainingDepots = await Depot.find({});
    console.log(`📋 Remaining depots: ${remainingDepots.length}`);
    
    for (const depot of remainingDepots) {
      const staffCount = await User.countDocuments({ 
        depotId: depot._id,
        role: { $in: ['driver', 'conductor'] }
      });
      const routesCount = await Route.countDocuments({ 'depot.depotId': depot._id });
      const busesCount = await Bus.countDocuments({ depotId: depot._id });
      
      console.log(`🏢 ${depot.depotName}:`);
      console.log(`   - Staff: ${staffCount}`);
      console.log(`   - Routes: ${routesCount}`);
      console.log(`   - Buses: ${busesCount}`);
    }
    
    // Show final staff distribution
    console.log('\n👥 Final staff distribution:');
    const allStaff = await User.find({ 
      depotId: { $exists: true, $ne: null },
      role: { $in: ['driver', 'conductor'] }
    });
    
    for (const depot of remainingDepots) {
      const depotStaff = allStaff.filter(staff => staff.depotId.toString() === depot._id.toString());
      console.log(`\n🏢 ${depot.depotName} (${depotStaff.length} staff):`);
      depotStaff.forEach(staff => {
        console.log(`   - ${staff.name} (${staff.role})`);
      });
    }
    
    console.log('\n✅ Depot cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    mongoose.connection.close();
  }
}

cleanupDepots();

