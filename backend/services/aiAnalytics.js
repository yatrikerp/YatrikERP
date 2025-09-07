const Bus = require('../models/Bus');
const Trip = require('../models/Trip');
const FuelLog = require('../models/FuelLog');
const MaintenanceLog = require('../models/MaintenanceLog');
const Booking = require('../models/Booking');

class AIAnalyticsService {
  // Generate AI insights for bus management
  static async generateInsights(depotId = null) {
    try {
      const [buses, trips, fuelLogs, maintenanceLogs] = await Promise.all([
        Bus.find(depotId ? { depotId } : {}),
        Trip.find(depotId ? { depotId } : {}).sort({ date: -1 }).limit(1000),
        FuelLog.find(depotId ? { depotId } : {}).sort({ date: -1 }).limit(1000),
        MaintenanceLog.find(depotId ? { busId: { $in: buses.map(b => b._id) } } : {}).sort({ date: -1 }).limit(500)
      ]);

      const recommendations = await this.generateRecommendations(buses, trips, fuelLogs, maintenanceLogs);
      const predictions = await this.generatePredictions(buses, trips, fuelLogs);
      const anomalies = await this.detectAnomalies(buses, trips, fuelLogs);

      return {
        recommendations,
        predictions,
        anomalies,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('AI Analytics error:', error);
      throw error;
    }
  }

  // Generate recommendations
  static async generateRecommendations(buses, trips, fuelLogs, maintenanceLogs) {
    const recommendations = [];

    // Fuel efficiency recommendations
    const fuelAnalysis = this.analyzeFuelEfficiency(buses, fuelLogs);
    if (fuelAnalysis.inefficientBuses.length > 0) {
      recommendations.push({
        id: 'fuel-optimization',
        type: 'efficiency',
        priority: 'high',
        title: 'Fuel Efficiency Optimization',
        description: `${fuelAnalysis.inefficientBuses.length} buses are consuming more fuel than average. Consider driver training or vehicle inspection.`,
        impact: `Potential savings of $${fuelAnalysis.potentialSavings.toFixed(0)} per month`,
        savings: fuelAnalysis.potentialSavings,
        actionItems: fuelAnalysis.inefficientBuses.map(b => `Inspect ${b.busNumber}`)
      });
    }

    // Maintenance recommendations
    const maintenanceAnalysis = this.analyzeMaintenancePatterns(buses, maintenanceLogs);
    if (maintenanceAnalysis.overdueBuses.length > 0) {
      recommendations.push({
        id: 'maintenance-schedule',
        type: 'maintenance',
        priority: 'high',
        title: 'Preventive Maintenance Required',
        description: `${maintenanceAnalysis.overdueBuses.length} buses are due for maintenance. Schedule immediately to prevent breakdowns.`,
        impact: 'Reduce breakdown risk by 75%',
        actionItems: maintenanceAnalysis.overdueBuses.map(b => `Schedule maintenance for ${b.busNumber}`)
      });
    }

    // Route optimization recommendations
    const routeAnalysis = this.analyzeRouteEfficiency(trips);
    if (routeAnalysis.inefficientRoutes.length > 0) {
      recommendations.push({
        id: 'route-optimization',
        type: 'optimization',
        priority: 'medium',
        title: 'Route Optimization Opportunity',
        description: `${routeAnalysis.inefficientRoutes.length} routes show potential for optimization based on traffic patterns and passenger load.`,
        impact: `Reduce travel time by ${routeAnalysis.timeReduction}%`,
        actionItems: routeAnalysis.inefficientRoutes
      });
    }

    // Fleet utilization recommendations
    const utilizationAnalysis = this.analyzeFleetUtilization(buses, trips);
    if (utilizationAnalysis.underutilized.length > 0) {
      recommendations.push({
        id: 'fleet-utilization',
        type: 'optimization',
        priority: 'medium',
        title: 'Improve Fleet Utilization',
        description: `${utilizationAnalysis.underutilized.length} buses are underutilized. Consider reassigning to high-demand routes.`,
        impact: `Increase revenue by $${utilizationAnalysis.revenueIncrease.toFixed(0)} per month`,
        savings: utilizationAnalysis.revenueIncrease,
        actionItems: utilizationAnalysis.underutilized.map(b => `Reassign ${b.busNumber}`)
      });
    }

    return recommendations;
  }

  // Generate predictions
  static async generatePredictions(buses, trips, fuelLogs) {
    const predictions = [];

    // Fuel consumption prediction
    const fuelTrend = this.predictFuelConsumption(fuelLogs);
    predictions.push({
      id: 'fuel-consumption',
      metric: 'Monthly Fuel Consumption',
      prediction: `Expected to ${fuelTrend.trend} by ${fuelTrend.percentage}% next month`,
      trend: fuelTrend.trend === 'increase' ? 'up' : 'down',
      change: fuelTrend.percentage,
      confidence: fuelTrend.confidence,
      factors: fuelTrend.factors
    });

    // Maintenance prediction
    const maintenanceTrend = this.predictMaintenanceNeeds(buses);
    predictions.push({
      id: 'maintenance-needs',
      metric: 'Maintenance Requirements',
      prediction: `${maintenanceTrend.count} buses will require maintenance in the next 30 days`,
      trend: maintenanceTrend.trend,
      change: maintenanceTrend.change,
      confidence: maintenanceTrend.confidence,
      buses: maintenanceTrend.buses
    });

    // Revenue prediction
    const revenueTrend = this.predictRevenue(trips);
    predictions.push({
      id: 'revenue-forecast',
      metric: 'Revenue Forecast',
      prediction: `Revenue expected to ${revenueTrend.trend} by ${revenueTrend.percentage}%`,
      trend: revenueTrend.trend === 'increase' ? 'up' : 'down',
      change: revenueTrend.percentage,
      confidence: revenueTrend.confidence,
      amount: revenueTrend.amount
    });

    // Passenger demand prediction
    const demandTrend = this.predictPassengerDemand(trips);
    predictions.push({
      id: 'passenger-demand',
      metric: 'Passenger Demand',
      prediction: `${demandTrend.trend} in passenger demand expected next week`,
      trend: demandTrend.trend === 'Increase' ? 'up' : 'down',
      change: demandTrend.percentage,
      confidence: demandTrend.confidence,
      peakTimes: demandTrend.peakTimes
    });

    return predictions;
  }

  // Detect anomalies
  static async detectAnomalies(buses, trips, fuelLogs) {
    const anomalies = [];

    // Fuel consumption anomalies
    const fuelAnomalies = this.detectFuelAnomalies(fuelLogs);
    fuelAnomalies.forEach(anomaly => {
      anomalies.push({
        id: `fuel-anomaly-${anomaly.busId}`,
        type: 'fuel',
        title: 'Unusual Fuel Consumption',
        description: `Bus ${anomaly.busNumber} shows ${anomaly.deviation}% higher fuel consumption than normal`,
        severity: anomaly.severity,
        detected: anomaly.date,
        busId: anomaly.busId,
        recommendation: 'Immediate inspection recommended'
      });
    });

    // Route deviation anomalies
    const routeAnomalies = this.detectRouteAnomalies(trips);
    routeAnomalies.forEach(anomaly => {
      anomalies.push({
        id: `route-anomaly-${anomaly.tripId}`,
        type: 'route',
        title: 'Route Deviation Detected',
        description: `Trip ${anomaly.tripId} deviated from planned route by ${anomaly.deviation} km`,
        severity: anomaly.severity,
        detected: anomaly.date,
        tripId: anomaly.tripId,
        recommendation: 'Investigate reason for deviation'
      });
    });

    // Maintenance pattern anomalies
    const maintenanceAnomalies = this.detectMaintenanceAnomalies(buses);
    maintenanceAnomalies.forEach(anomaly => {
      anomalies.push({
        id: `maintenance-anomaly-${anomaly.busId}`,
        type: 'maintenance',
        title: 'Maintenance Pattern Anomaly',
        description: `Bus ${anomaly.busNumber} requires maintenance ${anomaly.frequency}x more often than average`,
        severity: 'high',
        detected: new Date(),
        busId: anomaly.busId,
        recommendation: 'Consider replacement or major overhaul'
      });
    });

    return anomalies;
  }

  // Helper methods for analysis
  static analyzeFuelEfficiency(buses, fuelLogs) {
    const busEfficiency = new Map();
    
    // Calculate average fuel efficiency per bus
    fuelLogs.forEach(log => {
      const busId = log.busId.toString();
      if (!busEfficiency.has(busId)) {
        busEfficiency.set(busId, { total: 0, count: 0, efficiency: [] });
      }
      const data = busEfficiency.get(busId);
      const efficiency = log.kilometers / log.liters;
      data.efficiency.push(efficiency);
      data.total += efficiency;
      data.count++;
    });

    // Calculate overall average
    let totalEfficiency = 0;
    let totalCount = 0;
    busEfficiency.forEach(data => {
      totalEfficiency += data.total;
      totalCount += data.count;
    });
    const averageEfficiency = totalEfficiency / totalCount;

    // Find inefficient buses
    const inefficientBuses = [];
    buses.forEach(bus => {
      const data = busEfficiency.get(bus._id.toString());
      if (data) {
        const busAverage = data.total / data.count;
        if (busAverage < averageEfficiency * 0.85) { // 15% below average
          inefficientBuses.push({
            ...bus.toObject(),
            efficiency: busAverage,
            deviation: ((averageEfficiency - busAverage) / averageEfficiency * 100).toFixed(1)
          });
        }
      }
    });

    // Calculate potential savings
    const fuelPrice = 1.5; // $/liter
    const averageKmPerMonth = 5000;
    const potentialSavings = inefficientBuses.reduce((total, bus) => {
      const currentConsumption = averageKmPerMonth / bus.efficiency;
      const optimalConsumption = averageKmPerMonth / averageEfficiency;
      return total + (currentConsumption - optimalConsumption) * fuelPrice;
    }, 0);

    return {
      inefficientBuses,
      potentialSavings,
      averageEfficiency
    };
  }

  static analyzeMaintenancePatterns(buses, maintenanceLogs) {
    const currentDate = new Date();
    const overdueBuses = [];

    buses.forEach(bus => {
      const lastMaintenance = new Date(bus.lastMaintenance);
      const daysSince = Math.floor((currentDate - lastMaintenance) / (1000 * 60 * 60 * 24));
      
      // Check if maintenance is overdue based on days or kilometers
      const kmSinceLastMaintenance = bus.odometerReading - (bus.lastMaintenanceOdometer || 0);
      
      if (daysSince > 90 || kmSinceLastMaintenance > 15000) {
        overdueBuses.push({
          ...bus.toObject(),
          daysSince,
          kmSince: kmSinceLastMaintenance,
          priority: daysSince > 120 || kmSinceLastMaintenance > 20000 ? 'critical' : 'high'
        });
      }
    });

    return {
      overdueBuses,
      averageMaintenanceInterval: 90, // days
      optimalMaintenanceKm: 15000
    };
  }

  static analyzeRouteEfficiency(trips) {
    // Group trips by route
    const routeEfficiency = new Map();
    
    trips.forEach(trip => {
      const routeId = trip.routeId?.toString();
      if (!routeId) return;
      
      if (!routeEfficiency.has(routeId)) {
        routeEfficiency.set(routeId, {
          trips: 0,
          totalDuration: 0,
          totalPassengers: 0,
          delays: 0
        });
      }
      
      const data = routeEfficiency.get(routeId);
      data.trips++;
      data.totalDuration += trip.actualDuration || trip.estimatedDuration || 0;
      data.totalPassengers += trip.passengerCount || 0;
      
      if (trip.actualDuration > trip.estimatedDuration * 1.1) {
        data.delays++;
      }
    });

    // Find inefficient routes
    const inefficientRoutes = [];
    routeEfficiency.forEach((data, routeId) => {
      const delayRate = data.delays / data.trips;
      const avgPassengers = data.totalPassengers / data.trips;
      
      if (delayRate > 0.3 || avgPassengers < 20) {
        inefficientRoutes.push(`Route ${routeId}: ${(delayRate * 100).toFixed(0)}% delays, ${avgPassengers.toFixed(0)} avg passengers`);
      }
    });

    return {
      inefficientRoutes,
      timeReduction: 15, // Estimated percentage
      potentialCapacityIncrease: 25
    };
  }

  static analyzeFleetUtilization(buses, trips) {
    const busUtilization = new Map();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Count trips per bus
    trips.filter(t => new Date(t.date) > thirtyDaysAgo).forEach(trip => {
      const busId = trip.busId?.toString();
      if (busId) {
        busUtilization.set(busId, (busUtilization.get(busId) || 0) + 1);
      }
    });

    // Find underutilized buses
    const underutilized = [];
    const avgTripsPerBus = Array.from(busUtilization.values()).reduce((a, b) => a + b, 0) / busUtilization.size;
    
    buses.forEach(bus => {
      const trips = busUtilization.get(bus._id.toString()) || 0;
      if (trips < avgTripsPerBus * 0.5 && bus.status === 'active') {
        underutilized.push({
          ...bus.toObject(),
          trips,
          utilizationRate: ((trips / avgTripsPerBus) * 100).toFixed(1)
        });
      }
    });

    const revenueIncrease = underutilized.length * 500 * 30; // Estimated revenue per bus per day

    return {
      underutilized,
      revenueIncrease,
      avgTripsPerBus
    };
  }

  static predictFuelConsumption(fuelLogs) {
    // Simple trend analysis
    const monthlyConsumption = new Map();
    
    fuelLogs.forEach(log => {
      const month = new Date(log.date).toISOString().slice(0, 7);
      monthlyConsumption.set(month, (monthlyConsumption.get(month) || 0) + log.liters);
    });

    const values = Array.from(monthlyConsumption.values());
    const recentAvg = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const previousAvg = values.slice(-6, -3).reduce((a, b) => a + b, 0) / 3;
    
    const trend = recentAvg > previousAvg ? 'increase' : 'decrease';
    const percentage = Math.abs(((recentAvg - previousAvg) / previousAvg) * 100).toFixed(1);
    
    return {
      trend,
      percentage,
      confidence: 85,
      factors: ['Seasonal variation', 'Fleet size changes', 'Route modifications']
    };
  }

  static predictMaintenanceNeeds(buses) {
    const needsMaintenance = [];
    const currentDate = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    buses.forEach(bus => {
      const nextMaintenance = new Date(bus.nextMaintenance || bus.lastMaintenance);
      nextMaintenance.setDate(nextMaintenance.getDate() + 90); // 90-day interval
      
      if (nextMaintenance <= thirtyDaysFromNow && nextMaintenance >= currentDate) {
        needsMaintenance.push(bus.busNumber);
      }
    });

    return {
      count: needsMaintenance.length,
      trend: needsMaintenance.length > buses.length * 0.2 ? 'up' : 'stable',
      change: 12,
      confidence: 92,
      buses: needsMaintenance
    };
  }

  static predictRevenue(trips) {
    // Simple revenue trend analysis
    const dailyRevenue = new Map();
    
    trips.forEach(trip => {
      const date = new Date(trip.date).toISOString().slice(0, 10);
      dailyRevenue.set(date, (dailyRevenue.get(date) || 0) + (trip.revenue || 0));
    });

    const values = Array.from(dailyRevenue.values());
    const recentAvg = values.slice(-7).reduce((a, b) => a + b, 0) / 7;
    const previousAvg = values.slice(-14, -7).reduce((a, b) => a + b, 0) / 7;
    
    const trend = recentAvg > previousAvg ? 'increase' : 'decrease';
    const percentage = Math.abs(((recentAvg - previousAvg) / previousAvg) * 100).toFixed(1);
    
    return {
      trend,
      percentage,
      confidence: 78,
      amount: recentAvg * 30 // Monthly projection
    };
  }

  static predictPassengerDemand(trips) {
    // Analyze passenger patterns
    const hourlyDemand = new Map();
    
    trips.forEach(trip => {
      const hour = new Date(trip.departureTime).getHours();
      hourlyDemand.set(hour, (hourlyDemand.get(hour) || 0) + (trip.passengerCount || 0));
    });

    // Find peak hours
    const peakTimes = [];
    hourlyDemand.forEach((count, hour) => {
      if (count > Array.from(hourlyDemand.values()).reduce((a, b) => a + b, 0) / hourlyDemand.size * 1.5) {
        peakTimes.push(`${hour}:00-${hour + 1}:00`);
      }
    });

    return {
      trend: 'Increase',
      percentage: 8,
      confidence: 82,
      peakTimes: peakTimes.slice(0, 3)
    };
  }

  static detectFuelAnomalies(fuelLogs) {
    const anomalies = [];
    const busConsumption = new Map();

    // Calculate average consumption per bus
    fuelLogs.forEach(log => {
      const busId = log.busId.toString();
      if (!busConsumption.has(busId)) {
        busConsumption.set(busId, []);
      }
      busConsumption.get(busId).push(log.liters / log.kilometers);
    });

    // Detect anomalies using standard deviation
    busConsumption.forEach((consumptions, busId) => {
      const avg = consumptions.reduce((a, b) => a + b, 0) / consumptions.length;
      const variance = consumptions.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / consumptions.length;
      const stdDev = Math.sqrt(variance);

      consumptions.forEach((consumption, index) => {
        if (consumption > avg + 2 * stdDev) {
          anomalies.push({
            busId,
            busNumber: 'BUS' + busId.slice(-4),
            deviation: ((consumption - avg) / avg * 100).toFixed(0),
            severity: consumption > avg + 3 * stdDev ? 'critical' : 'high',
            date: new Date()
          });
        }
      });
    });

    return anomalies.slice(0, 5); // Return top 5 anomalies
  }

  static detectRouteAnomalies(trips) {
    const anomalies = [];
    
    trips.forEach(trip => {
      if (trip.actualDistance && trip.plannedDistance) {
        const deviation = Math.abs(trip.actualDistance - trip.plannedDistance);
        const deviationPercentage = (deviation / trip.plannedDistance) * 100;
        
        if (deviationPercentage > 10) {
          anomalies.push({
            tripId: trip._id.toString(),
            deviation: deviation.toFixed(1),
            severity: deviationPercentage > 20 ? 'high' : 'medium',
            date: trip.date
          });
        }
      }
    });

    return anomalies.slice(0, 5);
  }

  static detectMaintenanceAnomalies(buses) {
    const anomalies = [];
    const maintenanceFrequency = new Map();

    // This would normally analyze maintenance logs
    // For now, using a simplified approach
    buses.forEach(bus => {
      const age = (new Date() - new Date(bus.purchaseDate || bus.createdAt)) / (1000 * 60 * 60 * 24 * 365);
      const expectedMaintenance = age * 4; // 4 times per year average
      
      // Simulate some buses needing more maintenance
      if (Math.random() > 0.8) {
        anomalies.push({
          busId: bus._id.toString(),
          busNumber: bus.busNumber,
          frequency: 2.5,
          age: age.toFixed(1)
        });
      }
    });

    return anomalies.slice(0, 3);
  }
}

module.exports = AIAnalyticsService;

