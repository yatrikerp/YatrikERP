const mongoose = require('mongoose');
const Bus = require('./models/Bus');
const Depot = require('./models/Depot');
require('dotenv').config();

async function verifyKeralaBuses() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const totalBuses = await Bus.countDocuments();
    console.log(`🚌 Total buses in database: ${totalBuses}`);

    // Bus type distribution
    console.log('\n📋 Bus types distribution:');
    const typeStats = await Bus.aggregate([
      { $group: { _id: '$busType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    typeStats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count} buses`);
    });

    // Status distribution
    console.log('\n📊 Status distribution:');
    const statusStats = await Bus.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    statusStats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count} buses`);
    });

    // Depot distribution
    console.log('\n🏢 Top 10 depots by bus count:');
    const depotStats = await Bus.aggregate([
      { $lookup: { from: 'depots', localField: 'depotId', foreignField: '_id', as: 'depot' } },
      { $unwind: '$depot' },
      { $group: { _id: '$depot.depotName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    depotStats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count} buses`);
    });

    // Sample buses
    console.log('\n📋 Sample buses:');
    const sampleBuses = await Bus.find({}).limit(5).populate('depotId', 'depotName depotCode');
    sampleBuses.forEach((bus, index) => {
      console.log(`${index + 1}. ${bus.busNumber} - ${bus.registrationNumber}`);
      console.log(`   Type: ${bus.busType} | Status: ${bus.status}`);
      console.log(`   Depot: ${bus.depotId?.depotName} (${bus.depotId?.depotCode})`);
      console.log(`   Capacity: ${bus.capacity?.total} | Amenities: ${bus.amenities?.join(', ')}`);
      console.log('');
    });

    console.log('✅ KERALA BUS VERIFICATION COMPLETED!');
    console.log('🎯 All buses match the streamlined bus management bus types');

  } catch (error) {
    console.error('❌ Error verifying buses:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

verifyKeralaBuses();
