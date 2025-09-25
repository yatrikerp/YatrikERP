const mongoose = require('mongoose');
require('dotenv').config();

// Import services and models
const AutoScheduler = require('../services/autoScheduler');
const RouteOptimizer = require('../services/routeOptimizer');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Depot = require('../models/Depot');
const Trip = require('../models/Trip');

class MassBusScheduler {
  constructor() {
    this.config = {
      // Scheduling configuration
      defaultDaysToSchedule: 7,
      maxConcurrentScheduling: 100,
      batchSize: 50,
      
      // Performance thresholds
      minEfficiencyThreshold: 0.6,
      maxRoutesPerBus: 3,
      minRoutesPerBus: 1,
      
      // Time windows for scheduling
      schedulingWindows: {
        morning: { start: '06:00', end: '12:00' },
        afternoon: { start: '12:00', end: '18:00' },
        evening: { start: '18:00', end: '24:00' }
      }
    };
  }

  /**
   * Main function to schedule 6000+ buses automatically
   */
  async scheduleAllBusesForDateRange(startDate, endDate, options = {}) {
    console.log(`🚀 Starting mass bus scheduling from ${startDate.toDateString()} to ${endDate.toDateString()}`);
    
    try {
      // Connect to MongoDB
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');
      console.log('✅ Connected to MongoDB');
      
      // Step 1: Validate system readiness
      const systemStatus = await this.validateSystemReadiness();
      if (!systemStatus.ready) {
        throw new Error(`System not ready: ${systemStatus.issues.join(', ')}`);
      }
      
      // Step 2: Get all depots and their buses
      const depotsData = await this.getDepotsWithBuses();
      console.log(`📊 Found ${Object.keys(depotsData).length} depots with buses`);
      
      // Step 3: Optimize routes before scheduling
      console.log('🔄 Optimizing routes...');
      await this.optimizeAllRoutes(depotsData);
      
      // Step 4: Schedule buses in parallel batches
      console.log('📅 Starting parallel bus scheduling...');
      const results = await this.scheduleBusesInBatches(depotsData, startDate, endDate, options);
      
      // Step 5: Generate comprehensive report
      const report = await this.generateSchedulingReport(startDate, endDate, results);
      
      console.log('✅ Mass bus scheduling completed successfully!');
      console.log(`📈 Final Report: ${report.summary.totalTrips} trips scheduled for ${report.summary.totalBuses} buses`);
      
      return report;
      
    } catch (error) {
      console.error('❌ Mass bus scheduling failed:', error);
      throw error;
    } finally {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }
  }

  /**
   * Validate that the system is ready for mass scheduling
   */
  async validateSystemReadiness() {
    const issues = [];
    
    try {
      // Check if we have buses
      const totalBuses = await Bus.countDocuments({ status: 'active' });
      if (totalBuses === 0) {
        issues.push('No active buses found');
      }
      
      // Check if we have routes
      const totalRoutes = await Route.countDocuments({ status: 'active', isActive: true });
      if (totalRoutes === 0) {
        issues.push('No active routes found');
      }
      
      // Check if we have depots
      const totalDepots = await Depot.countDocuments();
      if (totalDepots === 0) {
        issues.push('No depots found');
      }
      
      // Check if we have drivers and conductors
      const drivers = await require('../models/User').countDocuments({ 
        role: 'driver', 
        status: 'active' 
      });
      const conductors = await require('../models/User').countDocuments({ 
        role: 'conductor', 
        status: 'active' 
      });
      
      if (drivers === 0) {
        issues.push('No active drivers found');
      }
      
      if (conductors === 0) {
        issues.push('No active conductors found');
      }
      
      // Check if buses are properly assigned to depots
      const busesWithoutDepot = await Bus.countDocuments({ 
        status: 'active', 
        depotId: { $exists: false } 
      });
      
      if (busesWithoutDepot > 0) {
        issues.push(`${busesWithoutDepot} buses are not assigned to any depot`);
      }
      
      return {
        ready: issues.length === 0,
        issues,
        stats: {
          totalBuses,
          totalRoutes,
          totalDepots,
          drivers,
          conductors,
          busesWithoutDepot
        }
      };
      
    } catch (error) {
      issues.push(`System validation error: ${error.message}`);
      return { ready: false, issues };
    }
  }

  /**
   * Get all depots with their buses
   */
  async getDepotsWithBuses() {
    const depots = await Depot.find({}).lean();
    const depotsData = {};
    
    for (const depot of depots) {
      const buses = await Bus.find({
        depotId: depot._id,
        status: 'active'
      }).lean();
      
      if (buses.length > 0) {
        depotsData[depot._id.toString()] = {
          depot,
          buses,
          busCount: buses.length
        };
      }
    }
    
    return depotsData;
  }

  /**
   * Optimize routes for all depots
   */
  async optimizeAllRoutes(depotsData) {
    const optimizationPromises = Object.keys(depotsData).map(depotId => 
      RouteOptimizer.optimizeRouteAssignments(depotId, {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        endDate: new Date()
      })
    );
    
    const results = await Promise.allSettled(optimizationPromises);
    
    let optimizedDepots = 0;
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        optimizedDepots++;
        console.log(`✅ Optimized depot ${Object.keys(depotsData)[index]}: ${result.value.optimizedRoutes} routes`);
      } else {
        console.error(`❌ Failed to optimize depot ${Object.keys(depotsData)[index]}:`, result.reason);
      }
    });
    
    console.log(`🔄 Route optimization completed: ${optimizedDepots}/${Object.keys(depotsData).length} depots optimized`);
  }

  /**
   * Schedule buses in parallel batches
   */
  async scheduleBusesInBatches(depotsData, startDate, endDate, options) {
    const results = {
      totalBuses: 0,
      scheduledBuses: 0,
      failedBuses: 0,
      totalTrips: 0,
      depots: {}
    };
    
    // Process depots in parallel batches
    const depotIds = Object.keys(depotsData);
    const batchSize = Math.ceil(depotIds.length / this.config.maxConcurrentScheduling);
    
    for (let i = 0; i < depotIds.length; i += batchSize) {
      const batch = depotIds.slice(i, i + batchSize);
      
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(depotIds.length / batchSize)}`);
      
      const batchPromises = batch.map(depotId => 
        this.scheduleDepotBuses(depotsData[depotId], startDate, endDate, options)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        const depotId = batch[index];
        if (result.status === 'fulfilled') {
          results.depots[depotId] = result.value;
          results.totalBuses += result.value.totalBuses;
          results.scheduledBuses += result.value.scheduledBuses;
          results.failedBuses += result.value.failedBuses;
          results.totalTrips += result.value.totalTrips;
          
          console.log(`✅ Depot ${depotId}: ${result.value.scheduledBuses}/${result.value.totalBuses} buses scheduled`);
        } else {
          results.depots[depotId] = {
            totalBuses: depotsData[depotId].busCount,
            scheduledBuses: 0,
            failedBuses: depotsData[depotId].busCount,
            totalTrips: 0,
            error: result.reason.message
          };
          results.totalBuses += depotsData[depotId].busCount;
          results.failedBuses += depotsData[depotId].busCount;
          
          console.error(`❌ Depot ${depotId} failed:`, result.reason.message);
        }
      });
    }
    
    return results;
  }

  /**
   * Schedule buses for a specific depot
   */
  async scheduleDepotBuses(depotData, startDate, endDate, options) {
    const { depot, buses } = depotData;
    
    try {
      // Use the AutoScheduler service
      const schedulingOptions = {
        ...options,
        depotId: depot._id
      };
      
      const result = await AutoScheduler.scheduleAllBuses(startDate, endDate, schedulingOptions);
      
      return {
        depotId: depot._id.toString(),
        depotName: depot.depotName,
        totalBuses: buses.length,
        scheduledBuses: result.scheduledBuses,
        failedBuses: result.failedBuses,
        totalTrips: result.totalTrips,
        success: true
      };
      
    } catch (error) {
      console.error(`Error scheduling depot ${depot.depotName}:`, error);
      return {
        depotId: depot._id.toString(),
        depotName: depot.depotName,
        totalBuses: buses.length,
        scheduledBuses: 0,
        failedBuses: buses.length,
        totalTrips: 0,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate comprehensive scheduling report
   */
  async generateSchedulingReport(startDate, endDate, results) {
    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        duration: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
      },
      summary: {
        totalBuses: results.totalBuses,
        scheduledBuses: results.scheduledBuses,
        failedBuses: results.failedBuses,
        totalTrips: results.totalTrips,
        successRate: results.totalBuses > 0 ? ((results.scheduledBuses / results.totalBuses) * 100).toFixed(2) : 0,
        averageTripsPerBus: results.scheduledBuses > 0 ? (results.totalTrips / results.scheduledBuses).toFixed(2) : 0
      },
      depotBreakdown: Object.entries(results.depots).map(([depotId, data]) => ({
        depotId,
        depotName: data.depotName || 'Unknown',
        totalBuses: data.totalBuses,
        scheduledBuses: data.scheduledBuses,
        failedBuses: data.failedBuses,
        totalTrips: data.totalTrips,
        successRate: data.totalBuses > 0 ? ((data.scheduledBuses / data.totalBuses) * 100).toFixed(2) : 0,
        error: data.error || null
      })),
      performance: {
        topPerformers: Object.entries(results.depots)
          .filter(([_, data]) => data.success)
          .sort(([_, a], [__, b]) => b.totalTrips - a.totalTrips)
          .slice(0, 5)
          .map(([depotId, data]) => ({
            depotId,
            depotName: data.depotName,
            tripsScheduled: data.totalTrips
          })),
        underPerformers: Object.entries(results.depots)
          .filter(([_, data]) => data.success && data.totalTrips < 10)
          .sort(([_, a], [__, b]) => a.totalTrips - b.totalTrips)
          .slice(0, 5)
          .map(([depotId, data]) => ({
            depotId,
            depotName: data.depotName,
            tripsScheduled: data.totalTrips,
            issues: data.error || 'Low trip count'
          }))
      },
      recommendations: this.generateRecommendations(results)
    };
    
    return report;
  }

  /**
   * Generate recommendations based on scheduling results
   */
  generateRecommendations(results) {
    const recommendations = [];
    
    // Check success rate
    if (results.totalBuses > 0) {
      const successRate = (results.scheduledBuses / results.totalBuses) * 100;
      
      if (successRate < 80) {
        recommendations.push({
          type: 'warning',
          message: `Low success rate: ${successRate.toFixed(1)}%. Consider checking route assignments and crew availability.`
        });
      }
      
      if (successRate < 60) {
        recommendations.push({
          type: 'critical',
          message: 'Critical success rate. Immediate attention required for route optimization and crew management.'
        });
      }
    }
    
    // Check failed depots
    const failedDepots = Object.values(results.depots).filter(d => !d.success);
    if (failedDepots.length > 0) {
      recommendations.push({
        type: 'error',
        message: `${failedDepots.length} depots failed to schedule. Review depot configurations and try again.`
      });
    }
    
    // Check under-performing depots
    const underPerformers = Object.values(results.depots)
      .filter(d => d.success && d.totalTrips < 5);
    
    if (underPerformers.length > 0) {
      recommendations.push({
        type: 'info',
        message: `${underPerformers.length} depots have low trip counts. Consider adding more routes or optimizing existing ones.`
      });
    }
    
    // Performance optimization
    if (results.totalTrips > 0) {
      const avgTripsPerBus = results.totalTrips / results.scheduledBuses;
      if (avgTripsPerBus < 2) {
        recommendations.push({
          type: 'optimization',
          message: 'Low average trips per bus. Consider optimizing route assignments and schedules.'
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Quick schedule function for immediate use
   */
  async quickSchedule(days = 7) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days - 1);
    
    return await this.scheduleAllBusesForDateRange(startDate, endDate);
  }

  /**
   * Schedule for specific date
   */
  async scheduleForDate(targetDate, options = {}) {
    const startDate = new Date(targetDate);
    const endDate = new Date(targetDate);
    
    return await this.scheduleAllBusesForDateRange(startDate, endDate, options);
  }
}

// CLI interface
async function main() {
  const scheduler = new MassBusScheduler();
  
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const command = args[0] || 'quick';
    
    let result;
    
    switch (command) {
      case 'quick':
        const days = parseInt(args[1]) || 7;
        console.log(`🚀 Quick scheduling for next ${days} days...`);
        result = await scheduler.quickSchedule(days);
        break;
        
      case 'date':
        const targetDate = args[1];
        if (!targetDate) {
          throw new Error('Target date required for date command');
        }
        console.log(`📅 Scheduling for ${targetDate}...`);
        result = await scheduler.scheduleForDate(targetDate);
        break;
        
      case 'range':
        const startDate = args[1];
        const endDate = args[2];
        if (!startDate || !endDate) {
          throw new Error('Start and end dates required for range command');
        }
        console.log(`📅 Scheduling from ${startDate} to ${endDate}...`);
        result = await scheduler.scheduleAllBusesForDateRange(
          new Date(startDate), 
          new Date(endDate)
        );
        break;
        
      default:
        console.log('Usage:');
        console.log('  node massBusScheduler.js quick [days]     - Schedule for next N days (default: 7)');
        console.log('  node massBusScheduler.js date <date>      - Schedule for specific date');
        console.log('  node massBusScheduler.js range <start> <end> - Schedule for date range');
        process.exit(1);
    }
    
    console.log('\n📊 SCHEDULING REPORT');
    console.log('==================');
    console.log(`Total Buses: ${result.summary.totalBuses}`);
    console.log(`Scheduled: ${result.summary.scheduledBuses}`);
    console.log(`Failed: ${result.summary.failedBuses}`);
    console.log(`Total Trips: ${result.summary.totalTrips}`);
    console.log(`Success Rate: ${result.summary.successRate}%`);
    console.log(`Avg Trips/Bus: ${result.summary.averageTripsPerBus}`);
    
    if (result.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS');
      console.log('==================');
      result.recommendations.forEach(rec => {
        console.log(`${rec.type.toUpperCase()}: ${rec.message}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Mass scheduling failed:', error.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = MassBusScheduler;

// Run if called directly
if (require.main === module) {
  main();
}



