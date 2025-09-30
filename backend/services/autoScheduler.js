const mongoose = require('mongoose');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const User = require('../models/User');
const Depot = require('../models/Depot');
const NotificationService = require('./notificationService');

class AutoScheduler {
  constructor() {
    this.batchSize = 100; // Process buses in batches
    this.maxRetries = 3;
    this.schedulingRules = {
      // Driver/Conductor work hour limits
      maxDailyHours: 12,
      maxConsecutiveDays: 6,
      minRestHours: 8,
      
      // Bus utilization rules
      maxBusDailyTrips: 4,
      minMaintenanceGap: 2, // hours between trips
      
      // Route priority rules
      highPriorityRoutes: ['express', 'long_distance'],
      peakHourMultiplier: 1.5
    };
  }

  /**
   * Main scheduling function - schedules all buses for the specified date range
   */
  async scheduleAllBuses(startDate, endDate, options = {}) {
    const startTime = Date.now();
    console.log(`🚌 Starting auto-scheduling for ${startDate} to ${endDate}`);

    try {
      // Step 1: Get all active buses grouped by depot
      const busesByDepot = await this.getBusesByDepot();
      console.log(`📊 Found ${Object.keys(busesByDepot).length} depots with buses`);

      // Step 2: Get all active routes with schedules
      const routesWithSchedules = await this.getRoutesWithSchedules();
      console.log(`🛣️ Found ${routesWithSchedules.length} active routes`);

      // Step 3: Get available drivers and conductors
      const availableCrew = await this.getAvailableCrew(startDate, endDate);
      console.log(`👥 Found ${availableCrew.drivers.length} drivers, ${availableCrew.conductors.length} conductors`);

      // Step 4: Process each depot
      const results = {
        totalBuses: 0,
        scheduledBuses: 0,
        failedBuses: 0,
        totalTrips: 0,
        depots: {}
      };

      for (const [depotId, depotData] of Object.entries(busesByDepot)) {
        console.log(`🏢 Processing depot ${depotId} with ${depotData.buses.length} buses`);

        const depotResult = await this.scheduleDepotBuses(
          depotId,
          depotData,
          routesWithSchedules,
          availableCrew,
          startDate,
          endDate,
          options
        );

        results.depots[depotId] = depotResult;
        results.totalBuses += depotData.buses.length;
        results.scheduledBuses += depotResult.scheduledBuses;
        results.failedBuses += depotResult.failedBuses;
        results.totalTrips += depotResult.totalTrips;
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Auto-scheduling completed in ${duration}ms`);
      console.log(`📈 Results: ${results.scheduledBuses}/${results.totalBuses} buses scheduled, ${results.totalTrips} trips created`);

      return results;

    } catch (error) {
      console.error('❌ Auto-scheduling failed:', error);
      throw error;
    }
  }

  /**
   * Continuous scheduling function - runs every few minutes to schedule new trips
   */
  async runContinuousScheduling() {
    console.log('🚀 Starting continuous auto-scheduling...');

    try {
      // Get current date and next 7 days
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      // Run scheduling for the next week
      const results = await this.scheduleAllBuses(today, nextWeek);

      // Send summary notification
      await this.sendContinuousSchedulingNotification(results);

      return results;

    } catch (error) {
      console.error('❌ Continuous scheduling failed:', error);
      throw error;
    }
  }

  /**
   * Mass schedule function for Kerala routes specifically
   */
  async massSchedule(options = {}) {
    const {
      date,
      maxTripsPerRoute = 4,
      timeGap = 30, // minutes
      autoAssignCrew = true,
      autoAssignBuses = true,
      region = 'KERALA'
    } = options;

    console.log(`🚌 Starting mass scheduling for ${region} on ${date}`);

    try {
      // Get Kerala routes
      const keralaRoutes = await this.getKeralaRoutes();
      console.log(`🛣️ Found ${keralaRoutes.length} Kerala routes`);

      // Get available buses and crew for Kerala depots
      const keralaDepotIds = keralaRoutes.map(route => route.depot.depotId.toString());
      const availableCrew = await this.getAvailableCrewForRegion(date, region);
      const availableBuses = await this.getAvailableBusesForRegion(keralaDepotIds);

      let totalTrips = 0;

      // Process each route
      for (const route of keralaRoutes) {
        const routeTrips = await this.scheduleRouteMultipleTimes(
          route,
          availableBuses,
          availableCrew,
          date,
          maxTripsPerRoute,
          timeGap,
          autoAssignCrew,
          autoAssignBuses
        );

        totalTrips += routeTrips.length;

        // Send notifications for each scheduled route
        if (routeTrips.length > 0) {
          await this.sendRouteScheduledNotification(route, routeTrips.length, date);
        }
      }

      console.log(`✅ Mass scheduling completed: ${totalTrips} trips created for Kerala`);

      return {
        success: true,
        totalTrips,
        region,
        date,
        routesProcessed: keralaRoutes.length
      };

    } catch (error) {
      console.error('❌ Mass scheduling failed:', error);
      throw error;
    }
  }

  /**
   * Get all active buses grouped by depot
   */
  async getBusesByDepot() {
    const buses = await Bus.find({ 
      status: { $in: ['active', 'idle'] }, // Include both active and idle buses
      depotId: { $exists: true }
    }).populate('depotId', 'depotName depotCode').lean();
    
    return buses.reduce((acc, bus) => {
      const depotId = bus.depotId._id.toString();
      if (!acc[depotId]) {
        acc[depotId] = {
          depot: bus.depotId,
          buses: []
        };
      }
      acc[depotId].buses.push(bus);
      return acc;
    }, {});
  }

  /**
   * Get all active routes with their schedules
   */
  async getRoutesWithSchedules() {
    // Modified to work with existing route structure
    return await Route.find({
      status: 'active',
      isActive: true
    }).populate('depot.depotId', 'depotName depotCode').lean();
  }

  /**
   * Get available drivers and conductors for the date range
   */
  async getAvailableCrew(startDate, endDate) {
    const drivers = await User.find({
      role: 'driver',
      status: 'active',
      isActive: true
    }).select('_id name phone licenseNumber depotId').lean();
    
    const conductors = await User.find({
      role: 'conductor',
      status: 'active',
      isActive: true
    }).select('_id name phone employeeId depotId').lean();
    
    // Get existing trip assignments to check availability
    const existingAssignments = await Trip.find({
      serviceDate: { $gte: startDate, $lte: endDate },
      status: { $in: ['scheduled', 'running'] }
    }).select('driverId conductorId serviceDate startTime endTime').lean();
    
    return {
      drivers: this.filterAvailableCrew(drivers, existingAssignments, startDate, endDate),
      conductors: this.filterAvailableCrew(conductors, existingAssignments, startDate, endDate),
      existingAssignments
    };
  }

  /**
   * Filter crew members based on availability
   */
  filterAvailableCrew(crew, existingAssignments, startDate, endDate) {
    return crew.filter(member => {
      const memberAssignments = existingAssignments.filter(
        assignment => 
          assignment.driverId?.toString() === member._id.toString() ||
          assignment.conductorId?.toString() === member._id.toString()
      );
      
      // Check if member has too many assignments
      const totalHours = this.calculateTotalHours(memberAssignments);
      return totalHours < this.schedulingRules.maxDailyHours * this.getDaysInRange(startDate, endDate);
    });
  }

  /**
   * Schedule buses for a specific depot
   */
  async scheduleDepotBuses(depotId, depotData, routesWithSchedules, availableCrew, startDate, endDate, options) {
    // Since routes don't have depot associations, assign routes based on depot location
    // For now, assign a subset of routes to each depot
    const depotRoutes = routesWithSchedules.slice(0, Math.min(5, routesWithSchedules.length));
    
    if (depotRoutes.length === 0) {
      console.log(`⚠️ No routes available for depot ${depotId}`);
      return { scheduledBuses: 0, failedBuses: depotData.buses.length, totalTrips: 0 };
    }
    
    console.log(`✅ Assigned ${depotRoutes.length} routes to depot ${depotData.depot.depotName}`);

    // Since crew don't have depot associations, use all available crew
    const depotDrivers = availableCrew.drivers;
    const depotConductors = availableCrew.conductors;

    let scheduledBuses = 0;
    let failedBuses = 0;
    let totalTrips = 0;

    // Process buses in batches
    for (let i = 0; i < depotData.buses.length; i += this.batchSize) {
      const batch = depotData.buses.slice(i, i + this.batchSize);
      
      const batchPromises = batch.map(bus => 
        this.scheduleBus(bus, depotRoutes, depotDrivers, depotConductors, startDate, endDate, options)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          scheduledBuses++;
          totalTrips += result.value.tripsCreated;
        } else {
          failedBuses++;
          const reason = result.reason || result.value?.reason || 'Unknown error';
          console.error(`❌ Failed to schedule bus ${batch[index].busNumber}:`, reason);
        }
      });
    }

    return { scheduledBuses, failedBuses, totalTrips };
  }

  /**
   * Schedule a single bus for the date range
   */
  async scheduleBus(bus, routes, drivers, conductors, startDate, endDate, options) {
    try {
      // Find suitable routes for this bus
      const suitableRoutes = this.findSuitableRoutes(bus, routes);
      
      if (suitableRoutes.length === 0) {
        return { success: false, reason: 'No suitable routes found' };
      }

      // Get available drivers and conductors for this bus type
      const availableDrivers = this.filterDriversByBusType(drivers, bus.busType);
      const availableConductors = conductors; // Conductors can work any bus type
      
      if (availableDrivers.length === 0 || availableConductors.length === 0) {
        return { success: false, reason: 'No available crew' };
      }

      let tripsCreated = 0;
      const createdTrips = [];

      // Generate trips for each day in the range
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayTrips = await this.generateTripsForDay(
          bus, 
          suitableRoutes, 
          availableDrivers, 
          availableConductors, 
          new Date(currentDate),
          options
        );
        
        tripsCreated += dayTrips.length;
        createdTrips.push(...dayTrips);
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Send notification about successful scheduling
      await this.sendSchedulingNotification(bus, tripsCreated, createdTrips[0]?.serviceDate);

      return { success: true, tripsCreated, createdTrips };
      
    } catch (error) {
      console.error(`Error scheduling bus ${bus.busNumber}:`, error);
      return { success: false, reason: error.message || error.toString() };
    }
  }

  /**
   * Find routes suitable for a specific bus
   */
  findSuitableRoutes(bus, routes) {
    return routes.filter(route => {
      // Simplified filtering - just check basic capacity
      const routeCapacity = this.getRouteCapacityRequirement(route);
      return bus.capacity.total >= routeCapacity;
    });
  }

  /**
   * Generate trips for a specific day
   */
  async generateTripsForDay(bus, routes, drivers, conductors, date, options) {
    const trips = [];
    const usedRoutes = new Set();
    const usedDrivers = new Set();
    const usedConductors = new Set();
    
    // Sort routes by priority
    const sortedRoutes = this.sortRoutesByPriority(routes, date);
    
    for (const route of sortedRoutes) {
      if (usedRoutes.has(route._id.toString())) continue;
      
      // Find available schedule for this route and date
      const schedule = this.findAvailableSchedule(route, date);
      if (!schedule) continue;
      
      // Find available driver and conductor
      const driver = this.findAvailableCrewMember(drivers, usedDrivers, date);
      const conductor = this.findAvailableCrewMember(conductors, usedConductors, date);
      
      if (!driver || !conductor) continue;
      
      // Create trip
      const trip = await this.createTrip(bus, route, schedule, driver, conductor, date);
      if (trip) {
        trips.push(trip);
        usedRoutes.add(route._id.toString());
        usedDrivers.add(driver._id.toString());
        usedConductors.add(conductor._id.toString());
      }
      
      // Limit trips per bus per day
      if (trips.length >= this.schedulingRules.maxBusDailyTrips) break;
    }
    
    return trips;
  }

  /**
   * Create a trip record
   */
  async createTrip(bus, route, schedule, driver, conductor, date) {
    try {
      const tripData = {
        routeId: route._id,
        busId: bus._id,
        driverId: driver._id,
        conductorId: conductor._id,
        serviceDate: date,
        startTime: schedule.departureTime,
        endTime: schedule.arrivalTime,
        fare: this.calculateFare(route, schedule),
        capacity: bus.capacity.total,
        availableSeats: bus.capacity.total,
        bookedSeats: 0,
        status: 'scheduled',
        depotId: bus.depotId, // Use bus depot instead of route depot
        createdBy: new mongoose.Types.ObjectId(), // System user
        bookingOpen: true,
        cancellationPolicy: {
          allowed: true,
          hoursBeforeDeparture: 2,
          refundPercentage: 80
        }
      };
      
      const trip = new Trip(tripData);
      await trip.save();
      
      // Update bus current route
      await Bus.findByIdAndUpdate(bus._id, {
        $set: {
          currentRoute: {
            routeId: route._id,
            routeName: route.routeName,
            routeNumber: route.routeNumber,
            assignedAt: new Date(),
            assignedBy: tripData.createdBy
          }
        }
      });
      
      console.log(`✅ Created trip ${trip._id} for bus ${bus.busNumber} on route ${route.routeName}`);
      return trip;
      
    } catch (error) {
      console.error('Error creating trip:', error);
      return null;
    }
  }

  /**
   * Helper methods
   */
  getRouteCapacityRequirement(route) {
    // Default capacity requirement based on route type
    return 30; // Minimum capacity for most routes
  }

  isBusTypeCompatible(busType, routeFeatures) {
    // Check if bus type is compatible with route features
    if (routeFeatures.includes('AC') && !busType.includes('ac')) {
      return false;
    }
    return true;
  }

  sortRoutesByPriority(routes, date) {
    return routes.sort((a, b) => {
      // Priority 1: High priority routes
      const aHighPriority = this.schedulingRules.highPriorityRoutes.some(type => 
        a.routeName.toLowerCase().includes(type)
      );
      const bHighPriority = this.schedulingRules.highPriorityRoutes.some(type => 
        b.routeName.toLowerCase().includes(type)
      );
      
      if (aHighPriority && !bHighPriority) return -1;
      if (!aHighPriority && bHighPriority) return 1;
      
      // Priority 2: Routes with more schedules
      return b.schedules.length - a.schedules.length;
    });
  }

  findAvailableSchedule(route, date) {
    // Modified to create default schedule for routes without schedules
    if (!route.schedules || route.schedules.length === 0) {
      // Create a default schedule for the route
      return {
        scheduleId: `default_${route._id}`,
        departureTime: '06:00',
        arrivalTime: this.calculateArrivalTime('06:00', route.estimatedDuration || 300),
        frequency: 'daily',
        isActive: true,
        fare: {
          baseFare: route.farePerKm ? route.farePerKm * (route.totalDistance || 100) : 100,
          perKmRate: route.farePerKm || 2.0
        },
        createdBy: 'system'
      };
    }
    
    const dayOfWeek = this.getDayName(date);
    
    return route.schedules.find(schedule => {
      if (!schedule.isActive) return false;
      
      // Check if schedule is valid for this date
      if (schedule.effectiveFrom && date < schedule.effectiveFrom) return false;
      if (schedule.effectiveTo && date > schedule.effectiveTo) return false;
      
      // Check if schedule runs on this day
      if (schedule.daysOfWeek && !schedule.daysOfWeek.includes(dayOfWeek)) return false;
      if (schedule.customDates && !schedule.customDates.some(d => 
        d.toDateString() === date.toDateString()
      )) return false;
      
      return true;
    });
  }

  findAvailableCrewMember(crew, usedCrew, date) {
    return crew.find(member => !usedCrew.has(member._id.toString()));
  }

  /**
   * Calculate arrival time based on departure time and duration
   */
  calculateArrivalTime(departureTime, durationMinutes) {
    const [hours, minutes] = departureTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const arrivalHours = Math.floor(totalMinutes / 60) % 24;
    const arrivalMinutes = totalMinutes % 60;
    return `${arrivalHours.toString().padStart(2, '0')}:${arrivalMinutes.toString().padStart(2, '0')}`;
  }

  calculateFare(route, schedule) {
    return route.baseFare || 100; // Default fare
  }

  calculateTotalHours(assignments) {
    return assignments.reduce((total, assignment) => {
      const startTime = this.parseTime(assignment.startTime);
      const endTime = this.parseTime(assignment.endTime);
      const duration = (endTime - startTime) / (1000 * 60 * 60); // hours
      return total + duration;
    }, 0);
  }

  getDaysInRange(startDate, endDate) {
    return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  }

  getDayName(date) {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return dayNames[date.getDay()];
  }

  parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  filterDriversByBusType(drivers, busType) {
    // For now, return all drivers. In production, you might want to filter by license type
    return drivers;
  }

  async sendSchedulingNotification(bus, tripsCreated, serviceDate) {
    try {
      await NotificationService.createSystemNotification({
        title: 'Bus Auto-Scheduled',
        message: `Bus ${bus.busNumber} has been automatically scheduled for ${tripsCreated} trips starting ${serviceDate}`,
        type: 'scheduling',
        priority: 'medium',
        relatedEntity: {
          type: 'bus',
          id: bus._id
        }
      });
    } catch (error) {
      console.error('Failed to send scheduling notification:', error);
    }
  }

  /**
   * Get Kerala routes specifically
   */
  async getKeralaRoutes() {
    return await Route.find({
      status: 'active',
      isActive: true,
      'depot.depotId': { $exists: true }
    }).populate('depot.depotId', 'depotName depotCode').lean();
  }

  /**
   * Get available crew for a specific region
   */
  async getAvailableCrewForRegion(date, region) {
    const crew = await this.getAvailableCrew(date, new Date(date.getTime() + 24 * 60 * 60 * 1000));

    // Filter crew by region (for Kerala, we can use all crew for now)
    return crew;
  }

  /**
   * Get available buses for specific depots
   */
  async getAvailableBusesForRegion(depotIds) {
    return await Bus.find({
      status: 'active',
      depotId: { $in: depotIds },
      'currentRoute.assignedAt': { $exists: false }
    }).lean();
  }

  /**
   * Schedule a route multiple times in a day
   */
  async scheduleRouteMultipleTimes(route, availableBuses, availableCrew, date, maxTrips, timeGap, autoAssignCrew, autoAssignBuses) {
    const trips = [];

    for (let i = 0; i < maxTrips; i++) {
      const schedule = this.findAvailableSchedule(route, date);
      if (!schedule) break;

      // Find available bus, driver, and conductor
      const bus = this.findAvailableBus(availableBuses, route);
      const driver = autoAssignCrew ? this.findAvailableCrewMember(availableCrew.drivers, new Set(), date) : null;
      const conductor = autoAssignCrew ? this.findAvailableCrewMember(availableCrew.conductors, new Set(), date) : null;

      if (autoAssignBuses && !bus) continue;
      if (autoAssignCrew && (!driver || !conductor)) continue;

      // Create trip
      const trip = await this.createTrip(bus, route, schedule, driver, conductor, date);
      if (trip) {
        trips.push(trip);

        // Update schedule time for next trip
        schedule.departureTime = this.addMinutesToTime(schedule.departureTime, timeGap);
        schedule.arrivalTime = this.addMinutesToTime(schedule.arrivalTime, timeGap);
      }
    }

    return trips;
  }

  /**
   * Find available bus for a route
   */
  findAvailableBus(availableBuses, route) {
    return availableBuses.find(bus => {
      // Check capacity and type compatibility
      return bus.capacity.total >= this.getRouteCapacityRequirement(route) &&
             this.isBusTypeCompatible(bus.busType, route.features);
    });
  }

  /**
   * Add minutes to time string
   */
  addMinutesToTime(timeString, minutes) {
    const [hours, mins] = timeString.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }

  /**
   * Send continuous scheduling notification
   */
  async sendContinuousSchedulingNotification(results) {
    try {
      await NotificationService.createSystemNotification({
        title: 'Continuous Auto-Scheduling Completed',
        message: `Auto-scheduling completed: ${results.scheduledBuses}/${results.totalBuses} buses scheduled, ${results.totalTrips} trips created across ${Object.keys(results.depots).length} depots`,
        type: 'scheduling',
        priority: 'high',
        relatedEntity: {
          type: 'system',
          id: 'continuous-scheduling'
        }
      });
    } catch (error) {
      console.error('Failed to send continuous scheduling notification:', error);
    }
  }

  /**
   * Send route scheduled notification
   */
  async sendRouteScheduledNotification(route, tripsCount, date) {
    try {
      await NotificationService.createSystemNotification({
        title: 'Route Scheduled',
        message: `Route ${route.routeName} (${route.routeNumber}) has been scheduled for ${tripsCount} trips on ${date.toDateString()}`,
        type: 'scheduling',
        priority: 'medium',
        relatedEntity: {
          type: 'route',
          id: route._id
        }
      });
    } catch (error) {
      console.error('Failed to send route scheduled notification:', error);
    }
  }
}

module.exports = new AutoScheduler();



