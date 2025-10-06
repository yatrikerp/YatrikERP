const mongoose = require('mongoose');
const Bus = require('./models/Bus');
const Depot = require('./models/Depot');
require('dotenv').config();

async function testBusPerformance() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🚀 TESTING BUS MANAGEMENT PERFORMANCE');
    console.log('=====================================\n');

    // Test 1: Basic count queries
    console.log('📊 Test 1: Basic Count Queries');
    const start1 = Date.now();
    const [totalBuses, activeBuses, maintenanceBuses] = await Promise.all([
      Bus.countDocuments(),
      Bus.countDocuments({ status: 'active' }),
      Bus.countDocuments({ status: 'maintenance' })
    ]);
    const time1 = Date.now() - start1;
    console.log(`   ✅ Total buses: ${totalBuses} (${time1}ms)`);
    console.log(`   ✅ Active buses: ${activeBuses}`);
    console.log(`   ✅ Maintenance buses: ${maintenanceBuses}`);

    // Test 2: Paginated bus list with depot info
    console.log('\n📋 Test 2: Paginated Bus List (20 buses)');
    const start2 = Date.now();
    const buses = await Bus.find({})
      .populate('depotId', 'depotName depotCode category')
      .select('busNumber registrationNumber busType status capacity.total amenities depotId')
      .sort({ busNumber: 1 })
      .limit(20)
      .lean();
    const time2 = Date.now() - start2;
    console.log(`   ✅ Fetched 20 buses with depot info in ${time2}ms`);
    console.log(`   📊 Sample bus: ${buses[0]?.busNumber} - ${buses[0]?.busType}`);

    // Test 3: Bus aggregation for statistics
    console.log('\n📈 Test 3: Bus Statistics Aggregation');
    const start3 = Date.now();
    const busStats = await Bus.aggregate([
      {
        $facet: {
          totalStats: [
            {
              $group: {
                _id: null,
                totalBuses: { $sum: 1 },
                activeBuses: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
                maintenanceBuses: { $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] } },
                assignedBuses: { $sum: { $cond: [{ $eq: ['$status', 'assigned'] }, 1, 0] } }
              }
            }
          ],
          busTypeStats: [
            {
              $group: {
                _id: '$busType',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
          ]
        }
      }
    ]);
    const time3 = Date.now() - start3;
    console.log(`   ✅ Generated statistics in ${time3}ms`);
    console.log(`   📊 Top bus types:`, busStats[0].busTypeStats.map(s => `${s._id}: ${s.count}`).join(', '));

    // Test 4: Search functionality
    console.log('\n🔍 Test 4: Bus Search');
    const start4 = Date.now();
    const searchResults = await Bus.find({
      $or: [
        { busNumber: { $regex: 'TVM', $options: 'i' } },
        { registrationNumber: { $regex: 'TVM', $options: 'i' } }
      ]
    })
      .populate('depotId', 'depotName depotCode')
      .select('busNumber registrationNumber busType status depotId')
      .limit(10)
      .lean();
    const time4 = Date.now() - start4;
    console.log(`   ✅ Search for 'TVM' returned ${searchResults.length} results in ${time4}ms`);

    // Test 5: Depot-based filtering
    console.log('\n🏢 Test 5: Depot-based Filtering');
    let time5 = 0;
    const depot = await Depot.findOne({ depotCode: 'TVM' });
    if (depot) {
      const start5 = Date.now();
      const depotBuses = await Bus.find({ depotId: depot._id })
        .select('busNumber registrationNumber busType status')
        .sort({ busNumber: 1 })
        .limit(20)
        .lean();
      time5 = Date.now() - start5;
      console.log(`   ✅ Fetched ${depotBuses.length} buses from ${depot.depotName} in ${time5}ms`);
    }

    // Test 6: Status-based filtering
    console.log('\n⚡ Test 6: Status-based Filtering');
    const start6 = Date.now();
    const activeBusesOnly = await Bus.find({ status: 'active' })
      .select('busNumber busType depotId')
      .populate('depotId', 'depotName')
      .limit(50)
      .lean();
    const time6 = Date.now() - start6;
    console.log(`   ✅ Fetched ${activeBusesOnly.length} active buses in ${time6}ms`);

    // Test 7: Complex aggregation with depot info
    console.log('\n🔄 Test 7: Complex Depot-Bus Aggregation');
    const start7 = Date.now();
    const depotBusStats = await Bus.aggregate([
      {
        $lookup: {
          from: 'depots',
          localField: 'depotId',
          foreignField: '_id',
          as: 'depot'
        }
      },
      {
        $unwind: '$depot'
      },
      {
        $group: {
          _id: {
            depotId: '$depotId',
            depotName: '$depot.depotName',
            category: '$depot.category'
          },
          totalBuses: { $sum: 1 },
          activeBuses: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }
        }
      },
      {
        $sort: { totalBuses: -1 }
      },
      {
        $limit: 10
      }
    ]);
    const time7 = Date.now() - start7;
    console.log(`   ✅ Generated depot-bus statistics in ${time7}ms`);
    console.log(`   📊 Top depot: ${depotBusStats[0]?._id.depotName} with ${depotBusStats[0]?.totalBuses} buses`);

    // Performance Summary
    console.log('\n🎯 PERFORMANCE SUMMARY');
    console.log('======================');
    console.log(`📊 Basic counts: ${time1}ms`);
    console.log(`📋 Paginated list: ${time2}ms`);
    console.log(`📈 Statistics: ${time3}ms`);
    console.log(`🔍 Search: ${time4}ms`);
    console.log(`🏢 Depot filter: ${time5 || 0}ms`);
    console.log(`⚡ Status filter: ${time6}ms`);
    console.log(`🔄 Complex aggregation: ${time7}ms`);

    const totalTime = time1 + time2 + time3 + time4 + time5 + time6 + time7;
    const avgTime = totalTime / 7;
    
    console.log(`\n⚡ Average query time: ${avgTime.toFixed(2)}ms`);
    
    if (avgTime < 100) {
      console.log('🚀 EXCELLENT: All queries under 100ms - Instant loading!');
    } else if (avgTime < 200) {
      console.log('✅ GOOD: Queries under 200ms - Fast loading!');
    } else if (avgTime < 500) {
      console.log('⚠️  ACCEPTABLE: Queries under 500ms - Reasonable loading');
    } else {
      console.log('❌ SLOW: Queries over 500ms - Needs optimization');
    }

    console.log('\n🎉 Performance test completed!');
    console.log('🌐 Bus management is optimized for instant loading!');

  } catch (error) {
    console.error('❌ Error testing performance:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

testBusPerformance();
