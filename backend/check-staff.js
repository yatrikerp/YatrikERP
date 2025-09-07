const mongoose = require('mongoose');
const Driver = require('./models/Driver');
const Conductor = require('./models/Conductor');
const User = require('./models/User');
const Depot = require('./models/Depot');

async function checkStaff() {
  try {
    await mongoose.connect('mongodb://localhost:27017/yatrik_erp');
    console.log('Connected to MongoDB');

    // Check depots
    const depots = await Depot.find({});
    console.log('\n=== DEPOTS ===');
    console.log(`Found ${depots.length} depots:`);
    depots.forEach(depot => {
      console.log(`- ${depot.depotName} (${depot._id})`);
    });

    // Check users with driver role
    const userDrivers = await User.find({ role: 'driver' });
    console.log('\n=== USER DRIVERS ===');
    console.log(`Found ${userDrivers.length} user drivers:`);
    userDrivers.forEach(driver => {
      console.log(`- ${driver.name} (${driver._id}) - Depot: ${driver.depotId}`);
    });

    // Check users with conductor role
    const userConductors = await User.find({ role: 'conductor' });
    console.log('\n=== USER CONDUCTORS ===');
    console.log(`Found ${userConductors.length} user conductors:`);
    userConductors.forEach(conductor => {
      console.log(`- ${conductor.name} (${conductor._id}) - Depot: ${conductor.depotId}`);
    });

    // Check Driver model
    const driverModel = await Driver.find({});
    console.log('\n=== DRIVER MODEL ===');
    console.log(`Found ${driverModel.length} drivers in Driver model:`);
    driverModel.forEach(driver => {
      console.log(`- ${driver.name} (${driver._id}) - Depot: ${driver.depotId}`);
    });

    // Check Conductor model
    const conductorModel = await Conductor.find({});
    console.log('\n=== CONDUCTOR MODEL ===');
    console.log(`Found ${conductorModel.length} conductors in Conductor model:`);
    conductorModel.forEach(conductor => {
      console.log(`- ${conductor.name} (${conductor._id}) - Depot: ${conductor.depotId}`);
    });

    // If no staff found, create some sample data
    if (userDrivers.length === 0 && driverModel.length === 0) {
      console.log('\n=== CREATING SAMPLE DRIVERS ===');
      const depot = depots[0];
      if (depot) {
        const sampleDriver = new Driver({
          driverId: 'DRV001',
          name: 'John Driver',
          phone: '9876543210',
          email: 'john.driver@yatrik.com',
          employeeCode: 'EMP001',
          depotId: depot._id,
          username: 'johndriver',
          password: 'password123',
          drivingLicense: {
            licenseNumber: 'DL123456789',
            licenseType: 'HMV',
            issueDate: new Date('2020-01-01'),
            expiryDate: new Date('2030-01-01')
          },
          createdBy: depot.createdBy
        });
        await sampleDriver.save();
        console.log('Created sample driver:', sampleDriver.name);
      }
    }

    if (userConductors.length === 0 && conductorModel.length === 0) {
      console.log('\n=== CREATING SAMPLE CONDUCTORS ===');
      const depot = depots[0];
      if (depot) {
        const sampleConductor = new Conductor({
          conductorId: 'CON001',
          name: 'Jane Conductor',
          phone: '9876543211',
          email: 'jane.conductor@yatrik.com',
          employeeCode: 'EMP002',
          depotId: depot._id,
          username: 'janeconductor',
          password: 'password123',
          createdBy: depot.createdBy
        });
        await sampleConductor.save();
        console.log('Created sample conductor:', sampleConductor.name);
      }
    }

    console.log('\n=== FINAL CHECK ===');
    const finalDrivers = await Driver.find({});
    const finalConductors = await Conductor.find({});
    console.log(`Total drivers: ${finalDrivers.length}`);
    console.log(`Total conductors: ${finalConductors.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkStaff();
