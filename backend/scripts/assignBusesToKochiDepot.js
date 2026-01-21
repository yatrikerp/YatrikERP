const mongoose = require('mongoose');
require('dotenv').config();

const Bus = require('../models/Bus');
const Depot = require('../models/Depot');
const Route = require('../models/Route');
const Trip = require('../models/Trip');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik';

async function assignBusesToKochiDepot() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find or create Kochi depot
    let kochiDepot = await Depot.findOne({ 
      $or: [
        { depotCode: 'KCH' },
        { depotCode: 'KOCHI' },
        { depotName: /kochi/i },
        { 'location.city': /kochi/i }
      ]
    });

    if (!kochiDepot) {
      // Try to find any depot with code DEP001 or default
      kochiDepot = await Depot.findOne({ depotCode: 'DEP001' }) || 
                   await Depot.findOne({ status: 'active' });
      
      if (!kochiDepot) {
        console.log('⚠️ No depot found. Creating Kochi depot...');
        kochiDepot = await Depot.create({
          depotCode: 'KCH',
          depotName: 'Kochi Depot',
          location: {
            city: 'Kochi',
            state: 'Kerala',
            country: 'India',
            coordinates: { lat: 9.9312, lng: 76.2673 }
          },
          status: 'active'
        });
      }
    }

    console.log(`✅ Using depot: ${kochiDepot.depotName} (${kochiDepot.depotCode || kochiDepot.code})\n`);

    // Get all buses (from admin dashboard)
    const allBuses = await Bus.find({}).lean();
    console.log(`📊 Found ${allBuses.length} total buses in system\n`);

    // Get routes for Kochi depot
    const kochiRoutes = await Route.find({
      $or: [
        { 'depot.depotId': kochiDepot._id },
        { depotId: kochiDepot._id },
        { origin: /kochi/i },
        { startingPoint: /kochi/i }
      ]
    }).limit(5).lean();

    console.log(`📋 Found ${kochiRoutes.length} routes for Kochi depot\n`);

    // Assign buses to Kochi depot
    let assignedCount = 0;
    let createdCount = 0;

    // If no buses exist, create some sample buses
    if (allBuses.length === 0) {
      console.log('📦 No buses found. Creating sample buses for Kochi depot...\n');
      
      const sampleBuses = [
        {
          busNumber: 'KL-01-AB-1234',
          registrationNumber: 'KL-01-AB-1234',
          make: 'Tata',
          model: 'Starbus',
          year: 2022,
          capacity: { total: 45, sleeper: 30, seater: 15 },
          busType: 'ac_sleeper',
          depotId: kochiDepot._id,
          status: 'active',
          routeId: kochiRoutes[0]?._id,
          specifications: {
            manufacturer: 'Tata',
            model: 'Starbus',
            year: 2022,
            fuelType: 'diesel',
            mileage: 8
          }
        },
        {
          busNumber: 'KL-01-CD-5678',
          registrationNumber: 'KL-01-CD-5678',
          make: 'Ashok Leyland',
          model: 'Viking',
          year: 2023,
          capacity: { total: 50, sleeper: 35, seater: 15 },
          busType: 'ac_sleeper',
          depotId: kochiDepot._id,
          status: 'active',
          routeId: kochiRoutes[0]?._id || kochiRoutes[1]?._id,
          specifications: {
            manufacturer: 'Ashok Leyland',
            model: 'Viking',
            year: 2023,
            fuelType: 'diesel',
            mileage: 7.5
          }
        },
        {
          busNumber: 'KL-01-EF-9012',
          registrationNumber: 'KL-01-EF-9012',
          make: 'Volvo',
          model: '9400',
          year: 2021,
          capacity: { total: 48, sleeper: 32, seater: 16 },
          busType: 'ac_sleeper',
          depotId: kochiDepot._id,
          status: 'active',
          routeId: kochiRoutes[1]?._id || kochiRoutes[0]?._id,
          specifications: {
            manufacturer: 'Volvo',
            model: '9400',
            year: 2021,
            fuelType: 'diesel',
            mileage: 9
          }
        },
        {
          busNumber: 'KL-01-GH-3456',
          registrationNumber: 'KL-01-GH-3456',
          make: 'Tata',
          model: 'Marcopolo',
          year: 2023,
          capacity: { total: 42, sleeper: 28, seater: 14 },
          busType: 'ac_seater',
          depotId: kochiDepot._id,
          status: 'available',
          routeId: kochiRoutes[2]?._id || kochiRoutes[0]?._id,
          specifications: {
            manufacturer: 'Tata',
            model: 'Marcopolo',
            year: 2023,
            fuelType: 'diesel',
            mileage: 8.5
          }
        },
        {
          busNumber: 'KL-01-IJ-7890',
          registrationNumber: 'KL-01-IJ-7890',
          make: 'Ashok Leyland',
          model: 'JanBus',
          year: 2022,
          capacity: { total: 40, sleeper: 25, seater: 15 },
          busType: 'ac_sleeper',
          depotId: kochiDepot._id,
          status: 'maintenance',
          routeId: kochiRoutes[0]?._id,
          specifications: {
            manufacturer: 'Ashok Leyland',
            model: 'JanBus',
            year: 2022,
            fuelType: 'diesel',
            mileage: 7.8
          },
          nextServiceDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
        }
      ];

      for (const busData of sampleBuses) {
        const existing = await Bus.findOne({ busNumber: busData.busNumber });
        if (!existing) {
          await Bus.create(busData);
          createdCount++;
          console.log(`  ✅ Created bus: ${busData.busNumber} (${busData.make} ${busData.model})`);
        } else {
          // Update existing bus
          existing.depotId = kochiDepot._id;
          existing.routeId = busData.routeId;
          existing.status = busData.status;
          await existing.save();
          assignedCount++;
          console.log(`  ✅ Updated bus: ${busData.busNumber}`);
        }
      }
    } else {
      // Assign existing buses to Kochi depot
      console.log('📦 Assigning existing buses to Kochi depot...\n');
      
      for (const bus of allBuses.slice(0, 10)) { // Assign first 10 buses
        const busObj = await Bus.findById(bus._id);
        if (busObj) {
          busObj.depotId = kochiDepot._id;
          // Assign a route if available
          if (kochiRoutes.length > 0) {
            const randomRoute = kochiRoutes[Math.floor(Math.random() * kochiRoutes.length)];
            busObj.routeId = randomRoute._id;
          }
          // Ensure status is set
          if (!busObj.status) {
            busObj.status = 'active';
          }
          await busObj.save();
          assignedCount++;
          console.log(`  ✅ Assigned bus: ${bus.busNumber || bus.registrationNumber || bus._id}`);
        }
      }
    }

    // Verify assignment
    const kochiBuses = await Bus.find({ depotId: kochiDepot._id }).lean();
    const activeBuses = kochiBuses.filter(b => b.status === 'active' || b.status === 'available');
    const maintenanceBuses = kochiBuses.filter(b => b.status === 'maintenance');

    console.log('\n✅ Bus assignment completed!');
    console.log('\n📊 Summary:');
    console.log(`   - Depot: ${kochiDepot.depotName} (${kochiDepot.depotCode || kochiDepot.code})`);
    console.log(`   - Total buses assigned: ${kochiBuses.length}`);
    console.log(`   - Active/Available buses: ${activeBuses.length}`);
    console.log(`   - Maintenance buses: ${maintenanceBuses.length}`);
    console.log(`   - Routes available: ${kochiRoutes.length}`);
    console.log(`   - Buses created: ${createdCount}`);
    console.log(`   - Buses assigned: ${assignedCount}`);

    // Show bus details
    if (kochiBuses.length > 0) {
      console.log('\n🚌 Bus Details:');
      kochiBuses.forEach((bus, index) => {
        console.log(`   ${index + 1}. ${bus.busNumber || bus.registrationNumber} - ${bus.make || 'N/A'} ${bus.model || ''} - Status: ${bus.status}`);
      });
    }

  } catch (error) {
    console.error('❌ Error assigning buses:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

assignBusesToKochiDepot();
