const mongoose = require('mongoose');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const Trip = require('../models/Trip');
const Depot = require('../models/Depot');

class RouteOptimizer {
  constructor() {
    this.optimizationRules = {
      // Distance-based optimization
      maxRouteDistance: 500, // km
      minRouteDistance: 50,  // km
      
      // Time-based optimization
      maxRouteDuration: 8,   // hours
      minRouteDuration: 1,   // hour
      
      // Demand-based optimization
      peakHours: ['07:00', '08:00', '09:00', '17:00', '18:00', '19:00'],
      offPeakMultiplier: 0.7,
      
      // Efficiency thresholds
      minUtilizationRate: 0.6, // 60%
      optimalUtilizationRate: 0.8, // 80%
      
      // Route assignment rules
      maxBusesPerRoute: 10,
      minBusesPerRoute: 1
    };
  }

  /**
   * Optimize route assignments for maximum efficiency
   */
  async optimizeRouteAssignments(depotId, dateRange) {
    console.log(`🔄 Starting route optimization for depot ${depotId}`);
    
    try {
      // Step 1: Analyze current route performance
      const routeAnalysis = await this.analyzeRoutePerformance(depotId, dateRange);
      
      // Step 2: Get available buses and routes
      const availableBuses = await this.getAvailableBuses(depotId);
      const activeRoutes = await this.getActiveRoutes(depotId);
      
      // Step 3: Calculate optimal assignments
      const optimalAssignments = await this.calculateOptimalAssignments(
        availableBuses, 
        activeRoutes, 
        routeAnalysis
      );
      
      // Step 4: Apply optimizations
      const results = await this.applyOptimizations(optimalAssignments);
      
      console.log(`✅ Route optimization completed: ${results.optimizedRoutes} routes optimized`);
      return results;
      
    } catch (error) {
      console.error('Route optimization error:', error);
      throw error;
    }
  }

  /**
   * Analyze route performance based on historical data
   */
  async analyzeRoutePerformance(depotId, dateRange) {
    const { startDate, endDate } = dateRange;
    
    const routes = await Route.find({
      'depot.depotId': depotId,
      status: 'active',
      isActive: true
    }).lean();
    
    const analysis = {};
    
    for (const route of routes) {
      // Get trip data for this route
      const trips = await Trip.find({
        routeId: route._id,
        serviceDate: { $gte: startDate, $lte: endDate },
        status: { $in: ['completed', 'running'] }
      }).lean();
      
      if (trips.length === 0) {
        analysis[route._id] = {
          routeId: route._id,
          routeName: route.routeName,
          totalTrips: 0,
          averageOccupancy: 0,
          revenue: 0,
          efficiency: 0,
          demandScore: 0,
          recommendation: 'INACTIVE'
        };
        continue;
      }
      
      // Calculate metrics
      const totalRevenue = trips.reduce((sum, trip) => sum + (trip.fare * trip.bookedSeats), 0);
      const averageOccupancy = trips.reduce((sum, trip) => {
        const occupancy = trip.capacity > 0 ? (trip.bookedSeats / trip.capacity) : 0;
        return sum + occupancy;
      }, 0) / trips.length;
      
      const efficiency = this.calculateRouteEfficiency(route, trips);
      const demandScore = this.calculateDemandScore(trips);
      
      analysis[route._id] = {
        routeId: route._id,
        routeName: route.routeName,
        totalTrips: trips.length,
        averageOccupancy,
        revenue: totalRevenue,
        efficiency,
        demandScore,
        recommendation: this.getRouteRecommendation(averageOccupancy, efficiency, demandScore)
      };
    }
    
    return analysis;
  }

  /**
   * Get available buses for assignment
   */
  async getAvailableBuses(depotId) {
    return await Bus.find({
      depotId: depotId,
      status: 'active'
    }).select('_id busNumber busType capacity currentRoute assignedDriver assignedConductor').lean();
  }

  /**
   * Get active routes for the depot
   */
  async getActiveRoutes(depotId) {
    return await Route.find({
      'depot.depotId': depotId,
      status: 'active',
      isActive: true,
      'schedules.isActive': true
    }).lean();
  }

  /**
   * Calculate optimal bus-route assignments
   */
  async calculateOptimalAssignments(buses, routes, routeAnalysis) {
    const assignments = [];
    
    // Sort routes by priority (demand score + efficiency)
    const sortedRoutes = routes.sort((a, b) => {
      const aScore = (routeAnalysis[a._id]?.demandScore || 0) + (routeAnalysis[a._id]?.efficiency || 0);
      const bScore = (routeAnalysis[b._id]?.demandScore || 0) + (routeAnalysis[b._id]?.efficiency || 0);
      return bScore - aScore;
    });
    
    // Sort buses by capacity and type
    const sortedBuses = buses.sort((a, b) => {
      // Prioritize buses with higher capacity
      if (b.capacity.total !== a.capacity.total) {
        return b.capacity.total - a.capacity.total;
      }
      // Prioritize AC buses for long routes
      const aIsAC = a.busType.includes('ac');
      const bIsAC = b.busType.includes('ac');
      return bIsAC - aIsAC;
    });
    
    const assignedBuses = new Set();
    const routeBusCount = {};
    
    for (const route of sortedRoutes) {
      const analysis = routeAnalysis[route._id];
      if (!analysis || analysis.recommendation === 'INACTIVE') continue;
      
      // Determine number of buses needed for this route
      const busesNeeded = this.calculateBusesNeeded(route, analysis);
      const assignedBusesForRoute = [];
      
      for (let i = 0; i < busesNeeded && assignedBusesForRoute.length < this.optimizationRules.maxBusesPerRoute; i++) {
        // Find best available bus for this route
        const bestBus = this.findBestBusForRoute(sortedBuses, route, assignedBuses);
        
        if (bestBus) {
          assignedBusesForRoute.push({
            busId: bestBus._id,
            busNumber: bestBus.busNumber,
            busType: bestBus.busType,
            capacity: bestBus.capacity.total,
            compatibilityScore: this.calculateBusRouteCompatibility(bestBus, route)
          });
          
          assignedBuses.add(bestBus._id.toString());
        }
      }
      
      if (assignedBusesForRoute.length >= this.optimizationRules.minBusesPerRoute) {
        assignments.push({
          routeId: route._id,
          routeName: route.routeName,
          routeNumber: route.routeNumber,
          buses: assignedBusesForRoute,
          analysis: analysis,
          optimizationScore: this.calculateOptimizationScore(route, assignedBusesForRoute, analysis)
        });
        
        routeBusCount[route._id] = assignedBusesForRoute.length;
      }
    }
    
    return assignments;
  }

  /**
   * Apply route optimizations
   */
  async applyOptimizations(assignments) {
    let optimizedRoutes = 0;
    let totalOptimizations = 0;
    
    for (const assignment of assignments) {
      try {
        // Update route with assigned buses
        await Route.findByIdAndUpdate(assignment.routeId, {
          $set: {
            assignedBuses: assignment.buses.map(bus => ({
              busId: bus.busId,
              busNumber: bus.busNumber,
              capacity: bus.capacity,
              busType: bus.busType,
              assignedAt: new Date(),
              assignedBy: new mongoose.Types.ObjectId(), // System user
              active: true
            }))
          }
        });
        
        // Update buses with route assignments
        for (const bus of assignment.buses) {
          await Bus.findByIdAndUpdate(bus.busId, {
            $set: {
              currentRoute: {
                routeId: assignment.routeId,
                routeName: assignment.routeName,
                routeNumber: assignment.routeNumber,
                assignedAt: new Date(),
                assignedBy: new mongoose.Types.ObjectId()
              }
            }
          });
        }
        
        optimizedRoutes++;
        totalOptimizations += assignment.buses.length;
        
        console.log(`✅ Optimized route ${assignment.routeName}: ${assignment.buses.length} buses assigned`);
        
      } catch (error) {
        console.error(`❌ Failed to optimize route ${assignment.routeName}:`, error);
      }
    }
    
    return {
      optimizedRoutes,
      totalOptimizations,
      assignments
    };
  }

  /**
   * Calculate route efficiency score
   */
  calculateRouteEfficiency(route, trips) {
    if (trips.length === 0) return 0;
    
    // Distance efficiency (shorter routes with high demand are more efficient)
    const distanceScore = Math.max(0, 1 - (route.totalDistance / this.optimizationRules.maxRouteDistance));
    
    // Time efficiency (routes that complete on time are more efficient)
    const avgDuration = trips.reduce((sum, trip) => {
      const start = this.parseTime(trip.startTime);
      const end = this.parseTime(trip.endTime);
      return sum + ((end - start) / (1000 * 60 * 60)); // hours
    }, 0) / trips.length;
    
    const timeScore = Math.max(0, 1 - (avgDuration / this.optimizationRules.maxRouteDuration));
    
    // Occupancy efficiency
    const avgOccupancy = trips.reduce((sum, trip) => {
      return sum + (trip.capacity > 0 ? trip.bookedSeats / trip.capacity : 0);
    }, 0) / trips.length;
    
    // Combine scores
    return (distanceScore * 0.3 + timeScore * 0.3 + avgOccupancy * 0.4);
  }

  /**
   * Calculate demand score for a route
   */
  calculateDemandScore(trips) {
    if (trips.length === 0) return 0;
    
    // Calculate average occupancy rate
    const avgOccupancy = trips.reduce((sum, trip) => {
      return sum + (trip.capacity > 0 ? trip.bookedSeats / trip.capacity : 0);
    }, 0) / trips.length;
    
    // Calculate frequency of trips
    const frequencyScore = Math.min(1, trips.length / 30); // Normalize to max 30 trips
    
    // Calculate revenue per trip
    const avgRevenue = trips.reduce((sum, trip) => sum + trip.fare, 0) / trips.length;
    const revenueScore = Math.min(1, avgRevenue / 500); // Normalize to max 500 per trip
    
    return (avgOccupancy * 0.5 + frequencyScore * 0.3 + revenueScore * 0.2);
  }

  /**
   * Get route recommendation based on performance
   */
  getRouteRecommendation(occupancy, efficiency, demandScore) {
    if (occupancy < 0.3 && efficiency < 0.4) {
      return 'INACTIVE';
    } else if (occupancy < 0.5 || efficiency < 0.6) {
      return 'REDUCE_FREQUENCY';
    } else if (occupancy > 0.8 && efficiency > 0.7) {
      return 'INCREASE_FREQUENCY';
    } else if (demandScore > 0.8) {
      return 'ADD_BUSES';
    } else {
      return 'MAINTAIN';
    }
  }

  /**
   * Calculate number of buses needed for a route
   */
  calculateBusesNeeded(route, analysis) {
    const baseFrequency = route.schedules?.length || 1;
    const demandMultiplier = Math.ceil(analysis.demandScore * 2); // 1-2 buses based on demand
    
    // Consider route distance for bus requirements
    const distanceMultiplier = route.totalDistance > 200 ? 2 : 1;
    
    return Math.min(
      Math.max(1, baseFrequency * demandMultiplier * distanceMultiplier),
      this.optimizationRules.maxBusesPerRoute
    );
  }

  /**
   * Find best bus for a route
   */
  findBestBusForRoute(buses, route, assignedBuses) {
    return buses.find(bus => {
      if (assignedBuses.has(bus._id.toString())) return false;
      
      // Check if bus is compatible with route
      return this.isBusCompatibleWithRoute(bus, route);
    });
  }

  /**
   * Check if bus is compatible with route
   */
  isBusCompatibleWithRoute(bus, route) {
    // Check capacity requirements
    if (bus.capacity.total < 30) return false; // Minimum capacity
    
    // Check bus type compatibility
    if (route.features?.includes('AC') && !bus.busType.includes('ac')) {
      return false;
    }
    
    // Check if bus is already assigned to a conflicting route
    if (bus.currentRoute?.routeId && bus.currentRoute.routeId.toString() !== route._id.toString()) {
      return false;
    }
    
    return true;
  }

  /**
   * Calculate bus-route compatibility score
   */
  calculateBusRouteCompatibility(bus, route) {
    let score = 0.5; // Base score
    
    // Capacity match
    if (bus.capacity.total >= route.baseFare * 2) { // Rough capacity estimate
      score += 0.2;
    }
    
    // Bus type match
    if (route.features?.includes('AC') && bus.busType.includes('ac')) {
      score += 0.2;
    }
    
    // Distance compatibility
    if (route.totalDistance > 200 && bus.busType.includes('sleeper')) {
      score += 0.1;
    }
    
    return Math.min(1, score);
  }

  /**
   * Calculate optimization score for an assignment
   */
  calculateOptimizationScore(route, buses, analysis) {
    const busUtilization = buses.length > 0 ? analysis.demandScore / buses.length : 0;
    const efficiencyScore = analysis.efficiency;
    const capacityMatch = buses.reduce((sum, bus) => sum + bus.compatibilityScore, 0) / buses.length;
    
    return (busUtilization * 0.4 + efficiencyScore * 0.3 + capacityMatch * 0.3);
  }

  /**
   * Parse time string to Date object
   */
  parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  /**
   * Generate optimization report
   */
  async generateOptimizationReport(depotId, dateRange) {
    const analysis = await this.analyzeRoutePerformance(depotId, dateRange);
    
    const report = {
      summary: {
        totalRoutes: Object.keys(analysis).length,
        activeRoutes: Object.values(analysis).filter(r => r.totalTrips > 0).length,
        inactiveRoutes: Object.values(analysis).filter(r => r.totalTrips === 0).length,
        averageEfficiency: Object.values(analysis).reduce((sum, r) => sum + r.efficiency, 0) / Object.keys(analysis).length,
        averageDemand: Object.values(analysis).reduce((sum, r) => sum + r.demandScore, 0) / Object.keys(analysis).length
      },
      recommendations: Object.values(analysis).map(route => ({
        routeName: route.routeName,
        recommendation: route.recommendation,
        efficiency: route.efficiency,
        demandScore: route.demandScore,
        averageOccupancy: route.averageOccupancy,
        totalRevenue: route.revenue
      })).sort((a, b) => b.efficiency - a.efficiency),
      topPerformers: Object.values(analysis)
        .filter(r => r.efficiency > 0.7)
        .sort((a, b) => b.efficiency - a.efficiency)
        .slice(0, 5),
      underPerformers: Object.values(analysis)
        .filter(r => r.efficiency < 0.5)
        .sort((a, b) => a.efficiency - b.efficiency)
        .slice(0, 5)
    };
    
    return report;
  }
}

module.exports = new RouteOptimizer();



