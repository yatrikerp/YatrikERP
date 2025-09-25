const mongoose = require('mongoose');
require('dotenv').config();

// Import the mass scheduler
const MassBusScheduler = require('./scripts/massBusScheduler');

async function testMassScheduling() {
  console.log('🚀 Testing Mass Bus Scheduling System');
  console.log('=====================================\n');
  
  try {
    // Initialize the scheduler
    const scheduler = new MassBusScheduler();
    
    // Test 1: Quick scheduling for next 3 days
    console.log('📅 Test 1: Quick scheduling for next 3 days');
    console.log('---------------------------------------------');
    
    const result = await scheduler.quickSchedule(3);
    
    console.log('\n✅ Scheduling Results:');
    console.log(`Total Buses: ${result.summary.totalBuses}`);
    console.log(`Scheduled Buses: ${result.summary.scheduledBuses}`);
    console.log(`Failed Buses: ${result.summary.failedBuses}`);
    console.log(`Total Trips: ${result.summary.totalTrips}`);
    console.log(`Success Rate: ${result.summary.successRate}%`);
    console.log(`Average Trips per Bus: ${result.summary.averageTripsPerBus}`);
    
    // Test 2: System validation
    console.log('\n🔍 Test 2: System Validation');
    console.log('------------------------------');
    
    const systemStatus = await scheduler.validateSystemReadiness();
    
    console.log(`System Ready: ${systemStatus.ready ? '✅ Yes' : '❌ No'}`);
    console.log(`Total Buses: ${systemStatus.stats.totalBuses}`);
    console.log(`Total Routes: ${systemStatus.stats.totalRoutes}`);
    console.log(`Total Depots: ${systemStatus.stats.totalDepots}`);
    console.log(`Available Drivers: ${systemStatus.stats.drivers}`);
    console.log(`Available Conductors: ${systemStatus.stats.conductors}`);
    
    if (systemStatus.issues.length > 0) {
      console.log('\n⚠️ Issues Found:');
      systemStatus.issues.forEach(issue => console.log(`- ${issue}`));
    }
    
    // Test 3: Generate optimization report
    console.log('\n📊 Test 3: Route Optimization Report');
    console.log('-------------------------------------');
    
    const depotsData = await scheduler.getDepotsWithBuses();
    const depotIds = Object.keys(depotsData);
    
    if (depotIds.length > 0) {
      const firstDepotId = depotIds[0];
      const RouteOptimizer = require('./services/routeOptimizer');
      
      const report = await RouteOptimizer.generateOptimizationReport(firstDepotId, {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      });
      
      console.log(`Depot: ${depotsData[firstDepotId].depot.depotName}`);
      console.log(`Total Routes: ${report.summary.totalRoutes}`);
      console.log(`Active Routes: ${report.summary.activeRoutes}`);
      console.log(`Average Efficiency: ${(report.summary.averageEfficiency * 100).toFixed(1)}%`);
      console.log(`Average Demand: ${(report.summary.averageDemand * 100).toFixed(1)}%`);
      
      if (report.topPerformers.length > 0) {
        console.log('\n🏆 Top Performing Routes:');
        report.topPerformers.slice(0, 3).forEach((route, index) => {
          console.log(`${index + 1}. ${route.routeName} - Efficiency: ${(route.efficiency * 100).toFixed(1)}%`);
        });
      }
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Clean up
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from MongoDB');
    }
  }
}

// Run the test
if (require.main === module) {
  testMassScheduling();
}

module.exports = { testMassScheduling };
