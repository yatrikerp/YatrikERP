const mongoose = require('mongoose');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const Bus = require('../models/Bus');
const Depot = require('../models/Depot');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const fixDepotRoutesIssue = async () => {
  try {
    console.log('🔍 Diagnosing depot routes issue...');

    // 1. Check what depots exist
    const depots = await Depot.find({});
    console.log('\n📋 Available depots:');
    depots.forEach(depot => {
      console.log(`- ${depot._id}: ${depot.depotName} (${depot.depotCode})`);
    });

    // 2. Check what routes exist
    const routes = await Route.find({});
    console.log(`\n📋 Available routes (${routes.length}):`);
    routes.forEach(route => {
      console.log(`- ${route._id}: ${route.routeNumber} - ${route.routeName}`);
      console.log(`  Depot: ${JSON.stringify(route.depot)}`);
    });

    // 3. Check what buses exist
    const buses = await Bus.find({});
    console.log(`\n📋 Available buses (${buses.length}):`);
    buses.forEach(bus => {
      console.log(`- ${bus._id}: ${bus.busNumber} (Depot: ${bus.depotId})`);
    });

    // 4. Check what trips exist
    const trips = await Trip.find({});
    console.log(`\n📋 Available trips (${trips.length}):`);
    trips.forEach(trip => {
      console.log(`- ${trip._id}: Route ${trip.routeId}, Bus ${trip.busId}, Depot ${trip.depotId}`);
    });

    // 5. Find the Kerala depot
    let keralaDepot = await Depot.findOne({ depotCode: 'KCD001' });
    if (!keralaDepot) {
      keralaDepot = await Depot.findOne({ depotName: { $regex: 'Kerala', $options: 'i' } });
    }
    if (!keralaDepot) {
      keralaDepot = await Depot.findOne();
    }

    if (!keralaDepot) {
      console.log('❌ No depot found! Creating a default depot...');
      
      // Create default admin user
      let adminUser = await User.findOne({ role: 'admin' });
      if (!adminUser) {
        adminUser = new User({
          name: 'System Admin',
          email: 'admin@yatrik.com',
          password: 'admin123',
          role: 'admin',
          phone: '+91-98765-43210',
          authProvider: 'local',
          isActive: true
        });
        await adminUser.save();
        console.log('✅ Created admin user');
      }

      // Create default depot
      keralaDepot = new Depot({
        depotCode: 'KCD001',
        depotName: 'Kerala Central Depot',
        location: {
          address: 'Kochi Central Bus Station, Ernakulam',
          city: 'Kochi',
          state: 'Kerala',
          pincode: '682001',
          coordinates: { latitude: 9.9312, longitude: 76.2673 }
        },
        contact: {
          phone: '+91-484-1234567',
          email: 'kcd@yatrik.com',
          manager: {
            name: 'Kerala Depot Manager',
            phone: '+91-484-1234567',
            email: 'manager@kcd.yatrik.com'
          }
        },
        operatingHours: {
          openTime: '06:00',
          closeTime: '22:00'
        },
        capacity: {
          totalBuses: 50,
          availableBuses: 45,
          maintenanceBuses: 5
        },
        facilities: ['Fuel_Station', 'Maintenance_Bay', 'Washing_Bay', 'Parking_Lot', 'Driver_Rest_Room'],
        status: 'active',
        createdBy: adminUser._id
      });
      await keralaDepot.save();
      console.log('✅ Created Kerala depot:', keralaDepot.depotName);
    }

    console.log(`\n🏢 Using depot: ${keralaDepot.depotName} (${keralaDepot._id})`);

    // 6. Fix routes depot assignment
    console.log('\n🔧 Fixing routes depot assignment...');
    const routesToFix = await Route.find({});
    
    for (const route of routesToFix) {
      const needsUpdate = !route.depot || 
                         !route.depot.depotId || 
                         route.depot.depotId.toString() !== keralaDepot._id.toString();

      if (needsUpdate) {
        route.depot = {
          depotId: keralaDepot._id,
          depotName: keralaDepot.depotName,
          depotLocation: keralaDepot.location.city
        };
        await route.save();
        console.log(`✅ Fixed route: ${route.routeNumber} - ${route.routeName}`);
      } else {
        console.log(`✓ Route already correct: ${route.routeNumber} - ${route.routeName}`);
      }
    }

    // 7. Fix buses depot assignment
    console.log('\n🔧 Fixing buses depot assignment...');
    const busesToFix = await Bus.find({});
    
    for (const bus of busesToFix) {
      const needsUpdate = !bus.depotId || bus.depotId.toString() !== keralaDepot._id.toString();

      if (needsUpdate) {
        bus.depotId = keralaDepot._id;
        await bus.save();
        console.log(`✅ Fixed bus: ${bus.busNumber}`);
      } else {
        console.log(`✓ Bus already correct: ${bus.busNumber}`);
      }
    }

    // 8. Fix trips depot assignment
    console.log('\n🔧 Fixing trips depot assignment...');
    const tripsToFix = await Trip.find({});
    
    for (const trip of tripsToFix) {
      const needsUpdate = !trip.depotId || trip.depotId.toString() !== keralaDepot._id.toString();

      if (needsUpdate) {
        trip.depotId = keralaDepot._id;
        await trip.save();
        console.log(`✅ Fixed trip: ${trip._id}`);
      } else {
        console.log(`✓ Trip already correct: ${trip._id}`);
      }
    }

    // 9. Test the depot routes query
    console.log('\n🧪 Testing depot routes query...');
    const testRoutes = await Route.find({ 'depot.depotId': keralaDepot._id });
    console.log(`Found ${testRoutes.length} routes for depot ${keralaDepot._id}`);
    
    testRoutes.forEach(route => {
      console.log(`- ${route.routeNumber}: ${route.routeName}`);
    });

    // 10. Test the depot trips query
    console.log('\n🧪 Testing depot trips query...');
    const testTrips = await Trip.find({ depotId: keralaDepot._id });
    console.log(`Found ${testTrips.length} trips for depot ${keralaDepot._id}`);

    // 11. Create depot user if needed
    console.log('\n👤 Checking depot user...');
    let depotUser = await User.findOne({ 
      $or: [
        { depotId: keralaDepot._id },
        { role: 'depot_manager' }
      ]
    });

    if (!depotUser) {
      depotUser = new User({
        name: 'Kerala Depot Manager',
        email: 'depot@kerala.yatrik.com',
        password: 'depot123',
        role: 'depot_manager',
        depotId: keralaDepot._id,
        phone: '+91-484-1234567',
        authProvider: 'local',
        isActive: true
      });
      await depotUser.save();
      console.log('✅ Created depot user:', depotUser.email);
    } else {
      // Update existing user with depot ID
      if (!depotUser.depotId || depotUser.depotId.toString() !== keralaDepot._id.toString()) {
        depotUser.depotId = keralaDepot._id;
        await depotUser.save();
        console.log('✅ Updated depot user with correct depot ID');
      } else {
        console.log('✓ Depot user already correct:', depotUser.email);
      }
    }

    console.log('\n🎉 Depot routes issue diagnosis and fix completed!');
    console.log('\n📊 Summary:');
    console.log(`- Depot: ${keralaDepot.depotName} (${keralaDepot._id})`);
    console.log(`- Routes: ${testRoutes.length} routes found`);
    console.log(`- Trips: ${testTrips.length} trips found`);
    console.log(`- Buses: ${busesToFix.length} buses`);
    console.log(`- Depot User: ${depotUser.email}`);

    console.log('\n🔑 To test the depot interface:');
    console.log(`- Login with email: ${depotUser.email}`);
    console.log(`- Password: depot123`);
    console.log(`- Or use the admin account: admin@yatrik.com / admin123`);

  } catch (error) {
    console.error('❌ Error fixing depot routes issue:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the script
fixDepotRoutesIssue();
