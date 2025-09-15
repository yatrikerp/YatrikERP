const mongoose = require('mongoose');
const Bus = require('../models/Bus');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const migrateBusCrew = async () => {
  try {
    console.log('👥 Starting bus crew migration...');

    // 1. Get all buses
    const buses = await Bus.find({});
    console.log(`\n📋 Found ${buses.length} total buses`);

    // 2. Check buses with crew assignments
    const busesWithDriver = buses.filter(bus => bus.assignedDriver);
    const busesWithConductor = buses.filter(bus => bus.assignedConductor);
    const busesWithBoth = buses.filter(bus => bus.assignedDriver && bus.assignedConductor);
    
    console.log(`📋 Buses with driver assigned: ${busesWithDriver.length}`);
    console.log(`📋 Buses with conductor assigned: ${busesWithConductor.length}`);
    console.log(`📋 Buses with both assigned: ${busesWithBoth.length}`);

    // 3. Get all users with driver and conductor roles
    const drivers = await User.find({ role: 'driver' });
    const conductors = await User.find({ role: 'conductor' });
    
    console.log(`📋 Available drivers: ${drivers.length}`);
    console.log(`📋 Available conductors: ${conductors.length}`);

    // 4. Check for invalid assignments
    let invalidDriverAssignments = 0;
    let invalidConductorAssignments = 0;

    for (const bus of buses) {
      if (bus.assignedDriver) {
        const driver = await User.findById(bus.assignedDriver);
        if (!driver || driver.role !== 'driver') {
          console.log(`  ❌ Bus ${bus.busNumber} has invalid driver assignment: ${bus.assignedDriver}`);
          invalidDriverAssignments++;
        }
      }

      if (bus.assignedConductor) {
        const conductor = await User.findById(bus.assignedConductor);
        if (!conductor || conductor.role !== 'conductor') {
          console.log(`  ❌ Bus ${bus.busNumber} has invalid conductor assignment: ${bus.assignedConductor}`);
          invalidConductorAssignments++;
        }
      }
    }

    // 5. Show detailed information
    console.log(`\n🚌 Buses with valid driver assignments:`);
    for (const bus of busesWithDriver) {
      const driver = await User.findById(bus.assignedDriver);
      if (driver && driver.role === 'driver') {
        console.log(`  - ${bus.busNumber}: ${driver.name} (${driver.email})`);
      }
    }

    console.log(`\n🚌 Buses with valid conductor assignments:`);
    for (const bus of busesWithConductor) {
      const conductor = await User.findById(bus.assignedConductor);
      if (conductor && conductor.role === 'conductor') {
        console.log(`  - ${bus.busNumber}: ${conductor.name} (${conductor.email})`);
      }
    }

    // 6. Summary
    console.log(`\n📊 Summary:`);
    console.log(`- Total buses: ${buses.length}`);
    console.log(`- Buses with driver: ${busesWithDriver.length}`);
    console.log(`- Buses with conductor: ${busesWithConductor.length}`);
    console.log(`- Buses with both: ${busesWithBoth.length}`);
    console.log(`- Available drivers: ${drivers.length}`);
    console.log(`- Available conductors: ${conductors.length}`);
    console.log(`- Invalid driver assignments: ${invalidDriverAssignments}`);
    console.log(`- Invalid conductor assignments: ${invalidConductorAssignments}`);

    if (invalidDriverAssignments > 0 || invalidConductorAssignments > 0) {
      console.log(`\n💡 Recommendation: Clean up invalid assignments`);
    }

    // 7. Show available drivers and conductors for assignment
    console.log(`\n👨‍💼 Available drivers:`);
    drivers.forEach(driver => {
      console.log(`  - ${driver.name} (${driver.email}) - ${driver._id}`);
    });

    console.log(`\n👨‍✈️ Available conductors:`);
    conductors.forEach(conductor => {
      console.log(`  - ${conductor.name} (${conductor.email}) - ${conductor._id}`);
    });

  } catch (error) {
    console.error('❌ Error during crew migration:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the migration
migrateBusCrew();
