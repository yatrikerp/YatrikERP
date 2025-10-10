const mongoose = require('mongoose');
const PathfindingService = require('../services/pathfindingService');
const Stop = require('../models/Stop');
const Route = require('../models/Route');
const RouteGraph = require('../models/RouteGraph');
require('dotenv').config();

async function testPathfinding() {
  try {
    console.log('🧪 Starting pathfinding tests...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('✅ Connected to MongoDB');

    const pathfindingService = new PathfindingService();

    // Test 1: Check if graph exists
    console.log('\n📊 Test 1: Checking route graph status...');
    const graph = await RouteGraph.getLatest();
    if (!graph) {
      console.log('❌ No route graph found. Please run the sample data import first.');
      return;
    }
    console.log(`✅ Route graph found: ${graph.nodeCount} nodes, ${graph.edgeCount} edges`);

    // Test 2: Find all available stops
    console.log('\n🚏 Test 2: Listing available stops...');
    const stops = await Stop.find({}).select('name code lat lon').lean();
    console.log(`✅ Found ${stops.length} stops:`);
    stops.forEach((stop, index) => {
      console.log(`  ${index + 1}. ${stop.name} (${stop.code})`);
    });

    // Test 3: Test fastest route (Thiruvananthapuram to Kozhikode)
    console.log('\n🚀 Test 3: Finding fastest route from Thiruvananthapuram to Kozhikode...');
    const tvmStop = await Stop.findOne({ code: 'TVM01' });
    const cltStop = await Stop.findOne({ code: 'CLT01' });

    if (tvmStop && cltStop) {
      const result = await pathfindingService.findFastestRoute(tvmStop._id, cltStop._id, '10:00');
      
      console.log(`✅ Fastest route found:`);
      console.log(`   From: ${result.stops[0].name}`);
      console.log(`   To: ${result.stops[result.stops.length - 1].name}`);
      console.log(`   Duration: ${result.totalDuration} minutes`);
      console.log(`   Fare: ₹${result.totalFare}`);
      console.log(`   Transfers: ${result.transferCount}`);
      console.log(`   Route: ${result.routeSummary}`);
      
      console.log('\n   📍 Detailed route:');
      result.directions.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step.message}`);
        if (step.duration) {
          console.log(`      Duration: ${step.duration} minutes, Fare: ₹${step.fare}`);
        }
      });
    } else {
      console.log('❌ Could not find TVM01 or CLT01 stops');
    }

    // Test 4: Test cheapest route
    console.log('\n💰 Test 4: Finding cheapest route from Thiruvananthapuram to Kozhikode...');
    if (tvmStop && cltStop) {
      const result = await pathfindingService.findCheapestRoute(tvmStop._id, cltStop._id);
      
      console.log(`✅ Cheapest route found:`);
      console.log(`   Duration: ${result.totalDuration} minutes`);
      console.log(`   Fare: ₹${result.totalFare}`);
      console.log(`   Route: ${result.routeSummary}`);
    }

    // Test 5: Test least transfers route
    console.log('\n🔄 Test 5: Finding route with least transfers...');
    if (tvmStop && cltStop) {
      const result = await pathfindingService.findLeastTransfersRoute(tvmStop._id, cltStop._id);
      
      console.log(`✅ Least transfers route found:`);
      console.log(`   Duration: ${result.totalDuration} minutes`);
      console.log(`   Fare: ₹${result.totalFare}`);
      console.log(`   Transfers: ${result.transferCount}`);
      console.log(`   Route: ${result.routeSummary}`);
    }

    // Test 6: Test multiple route options
    console.log('\n🎯 Test 6: Finding multiple route options...');
    if (tvmStop && cltStop) {
      const results = await pathfindingService.findRouteOptions(tvmStop._id, cltStop._id, '10:00', { maxOptions: 3 });
      
      console.log(`✅ Found ${results.length} route options:`);
      results.forEach((route, index) => {
        console.log(`\n   Option ${index + 1}:`);
        console.log(`   Duration: ${route.totalDuration} minutes`);
        console.log(`   Fare: ₹${route.totalFare}`);
        console.log(`   Transfers: ${route.transferCount}`);
        console.log(`   Confidence: ${route.confidence}%`);
        console.log(`   Route: ${route.routeSummary}`);
      });
    }

    // Test 7: Test nearby stops
    console.log('\n📍 Test 7: Finding nearby stops...');
    const nearbyStops = await pathfindingService.findNearbyStops(10.5276, 76.2144, 50); // Around Thrissur
    console.log(`✅ Found ${nearbyStops.length} nearby stops:`);
    nearbyStops.slice(0, 5).forEach((stop, index) => {
      console.log(`   ${index + 1}. ${stop.stopName} - ${stop.distance.toFixed(2)} km away`);
    });

    // Test 8: Test different time of day
    console.log('\n⏰ Test 8: Testing different times of day...');
    if (tvmStop && cltStop) {
      const times = ['07:00', '10:00', '18:00', '22:00'];
      
      for (const time of times) {
        const result = await pathfindingService.findFastestRoute(tvmStop._id, cltStop._id, time);
        const timeCategory = time < '09:00' || time > '19:00' ? 'Off-peak' : 'Peak';
        console.log(`   ${time} (${timeCategory}): ${result.adjustedDuration} minutes, ₹${result.adjustedFare}`);
      }
    }

    // Test 9: Test cache functionality
    console.log('\n💾 Test 9: Testing cache functionality...');
    const cacheStats = pathfindingService.getCacheStats();
    console.log(`✅ Cache contains ${cacheStats.size} entries`);
    
    // Test cache hit
    const startTime = Date.now();
    await pathfindingService.findFastestRoute(tvmStop._id, cltStop._id, '10:00');
    const cachedTime = Date.now() - startTime;
    console.log(`✅ Cached query took ${cachedTime}ms`);

    // Test 10: Error handling
    console.log('\n🚨 Test 10: Testing error handling...');
    try {
      await pathfindingService.findFastestRoute('invalid-id', 'another-invalid-id');
      console.log('❌ Should have thrown an error');
    } catch (error) {
      console.log(`✅ Correctly caught error: ${error.message}`);
    }

    console.log('\n🎉 All pathfinding tests completed successfully!');

  } catch (error) {
    console.error('❌ Error during pathfinding tests:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Performance benchmark
async function benchmarkPathfinding() {
  try {
    console.log('\n⚡ Starting pathfinding benchmark...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    const pathfindingService = new PathfindingService();

    const tvmStop = await Stop.findOne({ code: 'TVM01' });
    const cltStop = await Stop.findOne({ code: 'CLT01' });
    const kocStop = await Stop.findOne({ code: 'KOC01' });

    if (!tvmStop || !cltStop || !kocStop) {
      console.log('❌ Required stops not found for benchmark');
      return;
    }

    const testRoutes = [
      { from: tvmStop._id, to: cltStop._id, name: 'TVM to CLT' },
      { from: tvmStop._id, to: kocStop._id, name: 'TVM to KOC' },
      { from: kocStop._id, to: cltStop._id, name: 'KOC to CLT' }
    ];

    console.log('Running 100 queries for each route...');
    
    for (const route of testRoutes) {
      const times = [];
      
      // Warm up
      await pathfindingService.findFastestRoute(route.from, route.to, '10:00');
      
      // Benchmark
      for (let i = 0; i < 100; i++) {
        const startTime = process.hrtime.bigint();
        await pathfindingService.findFastestRoute(route.from, route.to, '10:00');
        const endTime = process.hrtime.bigint();
        times.push(Number(endTime - startTime) / 1000000); // Convert to milliseconds
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      console.log(`✅ ${route.name}: Avg ${avgTime.toFixed(2)}ms, Min ${minTime.toFixed(2)}ms, Max ${maxTime.toFixed(2)}ms`);
    }

  } catch (error) {
    console.error('❌ Benchmark error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--benchmark')) {
    benchmarkPathfinding()
      .then(() => {
        console.log('✅ Benchmark completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Benchmark failed:', error);
        process.exit(1);
      });
  } else {
    testPathfinding()
      .then(() => {
        console.log('✅ Tests completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Tests failed:', error);
        process.exit(1);
      });
  }
}

module.exports = { testPathfinding, benchmarkPathfinding };

































