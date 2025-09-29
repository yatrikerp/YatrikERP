const Bus = require('../models/Bus');
const Driver = require('../models/Driver');
const Conductor = require('../models/Conductor');
const Trip = require('../models/Trip');
const Route = require('../models/Route');
const FarePolicy = require('../models/FarePolicy');

class TripAssignmentService {
  
  /**
   * Main method to create a trip with automatic bus and staff assignment
   * @param {Object} tripData - Trip data including routeId, depotId, busType, etc.
   * @returns {Object} - Result with trip details and assignment status
   */
  static async createTripWithAssignment(tripData) {
    try {
      const {
        routeId,
        depotId,
        busType,
        serviceDate,
        startTime,
        endTime,
        capacity,
        notes
      } = tripData;

      // Step 1: Validate route and get route details
      const route = await Route.findById(routeId).populate('depotId');
      if (!route) {
        throw new Error('Route not found');
      }

      // Step 2: Find available bus
      const busAssignment = await this.findAvailableBus(depotId, busType);
      if (!busAssignment.success) {
        return {
          success: false,
          error: busAssignment.error,
          requiresManualAssignment: true,
          availableBuses: busAssignment.availableBuses || []
        };
      }

      // Step 3: Find available driver
      const driverAssignment = await this.findAvailableDriver(depotId, serviceDate, startTime, endTime);
      if (!driverAssignment.success) {
        return {
          success: false,
          error: driverAssignment.error,
          requiresManualAssignment: true,
          assignedBus: busAssignment.bus,
          availableDrivers: driverAssignment.availableDrivers || []
        };
      }

      // Step 4: Find available conductor
      const conductorAssignment = await this.findAvailableConductor(depotId, serviceDate, startTime, endTime);
      if (!conductorAssignment.success) {
        return {
          success: false,
          error: conductorAssignment.error,
          requiresManualAssignment: true,
          assignedBus: busAssignment.bus,
          assignedDriver: driverAssignment.driver,
          availableConductors: conductorAssignment.availableConductors || []
        };
      }

      // Step 5: Get fare policy
      const farePolicy = await this.getFarePolicy(busType);
      if (!farePolicy) {
        throw new Error('Fare policy not found for bus type: ' + busType);
      }

      // Step 6: Calculate fare
      const fareCalculation = this.calculateFare(route.distance || route.totalDistance, farePolicy);

      // Step 7: Create trip
      const trip = new Trip({
        routeId,
        busId: busAssignment.bus._id,
        driverId: driverAssignment.driver._id,
        conductorId: conductorAssignment.conductor._id,
        depotId,
        serviceDate: new Date(serviceDate),
        startTime,
        endTime,
        fare: fareCalculation.totalFare,
        capacity: capacity || busAssignment.bus.capacity.total,
        status: 'scheduled',
        notes,
        farePolicy: {
          policyId: farePolicy._id,
          ratePerKm: farePolicy.ratePerKm,
          minimumFare: farePolicy.minimumFare,
          appliedPolicy: farePolicy.name
        }
      });

      await trip.save();

      // Step 8: Update bus status to assigned
      await Bus.findByIdAndUpdate(busAssignment.bus._id, {
        status: 'assigned',
        currentTrip: trip._id,
        currentRoute: {
          routeId: route._id,
          routeName: route.routeName,
          routeNumber: route.routeNumber,
          assignedAt: new Date()
        }
      });

      // Step 9: Update driver and conductor status
      await this.updateStaffStatus(driverAssignment.driver._id, conductorAssignment.conductor._id, trip._id);

      return {
        success: true,
        trip: await Trip.findById(trip._id)
          .populate('routeId', 'routeName routeNumber')
          .populate('busId', 'busNumber busType')
          .populate('driverId', 'name licenseNumber')
          .populate('conductorId', 'name employeeId')
          .populate('depotId', 'depotName'),
        assignments: {
          bus: busAssignment.bus,
          driver: driverAssignment.driver,
          conductor: conductorAssignment.conductor,
          farePolicy: farePolicy,
          fareCalculation: fareCalculation
        }
      };

    } catch (error) {
      console.error('Error in trip assignment:', error);
      throw error;
    }
  }

  /**
   * Find available bus for assignment
   */
  static async findAvailableBus(depotId, busType) {
    try {
      // Find idle buses in the depot
      const availableBuses = await Bus.findAvailableBuses(depotId, busType);
      
      if (availableBuses.length === 0) {
        return {
          success: false,
          error: `No idle buses available in depot for bus type: ${busType}`,
          availableBuses: []
        };
      }

      // Check compliance for each bus
      for (const bus of availableBuses) {
        const compliance = bus.isCompliant();
        if (compliance.compliant) {
          return {
            success: true,
            bus: bus
          };
        }
      }

      return {
        success: false,
        error: 'No compliant buses available (insurance/fitness expired or maintenance required)',
        availableBuses: availableBuses
      };

    } catch (error) {
      console.error('Error finding available bus:', error);
      return {
        success: false,
        error: 'Error finding available bus: ' + error.message
      };
    }
  }

  /**
   * Find available driver for assignment
   */
  static async findAvailableDriver(depotId, serviceDate, startTime, endTime) {
    try {
      const drivers = await Driver.find({
        depotId: depotId,
        isActive: true
      });

      const availableDrivers = [];

      for (const driver of drivers) {
        // Check if driver is available (not exceeding daily duty limit)
        const isAvailable = await this.checkDriverAvailability(driver, serviceDate, startTime, endTime);
        if (isAvailable) {
          availableDrivers.push(driver);
        }
      }

      if (availableDrivers.length === 0) {
        return {
          success: false,
          error: 'No available drivers found (all drivers exceed daily duty limit)',
          availableDrivers: []
        };
      }

      // Return first available driver
      return {
        success: true,
        driver: availableDrivers[0]
      };

    } catch (error) {
      console.error('Error finding available driver:', error);
      return {
        success: false,
        error: 'Error finding available driver: ' + error.message
      };
    }
  }

  /**
   * Find available conductor for assignment
   */
  static async findAvailableConductor(depotId, serviceDate, startTime, endTime) {
    try {
      const conductors = await Conductor.find({
        depotId: depotId,
        isActive: true
      });

      const availableConductors = [];

      for (const conductor of conductors) {
        // Check if conductor is available (no overlapping trips)
        const isAvailable = await this.checkConductorAvailability(conductor, serviceDate, startTime, endTime);
        if (isAvailable) {
          availableConductors.push(conductor);
        }
      }

      if (availableConductors.length === 0) {
        return {
          success: false,
          error: 'No available conductors found (all conductors have overlapping trips)',
          availableConductors: []
        };
      }

      // Return first available conductor
      return {
        success: true,
        conductor: availableConductors[0]
      };

    } catch (error) {
      console.error('Error finding available conductor:', error);
      return {
        success: false,
        error: 'Error finding available conductor: ' + error.message
      };
    }
  }

  /**
   * Check driver availability (not exceeding 8 hours daily duty)
   */
  static async checkDriverAvailability(driver, serviceDate, startTime, endTime) {
    try {
      const startDateTime = new Date(`${serviceDate}T${startTime}`);
      const endDateTime = new Date(`${serviceDate}T${endTime}`);
      const tripDuration = (endDateTime - startDateTime) / (1000 * 60 * 60); // hours

      // Get existing trips for the driver on the same date
      const existingTrips = await Trip.find({
        driverId: driver._id,
        serviceDate: new Date(serviceDate),
        status: { $in: ['scheduled', 'in-progress', 'completed'] }
      });

      let totalHours = 0;
      for (const trip of existingTrips) {
        const tripStart = new Date(`${trip.serviceDate.toISOString().split('T')[0]}T${trip.startTime}`);
        const tripEnd = new Date(`${trip.serviceDate.toISOString().split('T')[0]}T${trip.endTime}`);
        totalHours += (tripEnd - tripStart) / (1000 * 60 * 60);
      }

      // Check if adding this trip would exceed 8 hours
      return (totalHours + tripDuration) <= 8;

    } catch (error) {
      console.error('Error checking driver availability:', error);
      return false;
    }
  }

  /**
   * Check conductor availability (no overlapping trips)
   */
  static async checkConductorAvailability(conductor, serviceDate, startTime, endTime) {
    try {
      const startDateTime = new Date(`${serviceDate}T${startTime}`);
      const endDateTime = new Date(`${serviceDate}T${endTime}`);

      // Check for overlapping trips
      const overlappingTrip = await Trip.findOne({
        conductorId: conductor._id,
        serviceDate: new Date(serviceDate),
        status: { $in: ['scheduled', 'in-progress'] },
        $or: [
          {
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
          }
        ]
      });

      return !overlappingTrip;

    } catch (error) {
      console.error('Error checking conductor availability:', error);
      return false;
    }
  }

  /**
   * Get fare policy for bus type
   */
  static async getFarePolicy(busType) {
    try {
      // Map bus type to fare policy bus type
      const busTypeMapping = {
        'ordinary': 'City / Ordinary',
        'fast_passenger': 'Fast Passenger / LSFP',
        'super_fast': 'Super Fast Passenger',
        'super_deluxe': 'Super Deluxe',
        'low_floor_ac': 'A/C Low Floor',
        'garuda_volvo': 'Luxury / Hi-tech & AC',
        'venad': 'City Fast',
        'deluxe_express': 'Super Express',
        'garuda_king_long': 'Garuda Sanchari / Biaxle Premium',
        'rajadhani': 'Garuda Maharaja / Garuda King / Multi-axle Premium'
      };

      const farePolicyBusType = busTypeMapping[busType] || 'City / Ordinary';
      
      const farePolicy = await FarePolicy.findOne({
        busType: farePolicyBusType,
        isActive: true
      });

      return farePolicy;

    } catch (error) {
      console.error('Error getting fare policy:', error);
      return null;
    }
  }

  /**
   * Calculate fare based on distance and fare policy
   */
  static calculateFare(distance, farePolicy) {
    const baseFare = distance * farePolicy.ratePerKm;
    const totalFare = Math.max(baseFare, farePolicy.minimumFare);

    return {
      distance: distance,
      ratePerKm: farePolicy.ratePerKm,
      baseFare: Math.round(baseFare * 100) / 100,
      minimumFare: farePolicy.minimumFare,
      totalFare: Math.round(totalFare * 100) / 100,
      appliedPolicy: farePolicy.name
    };
  }

  /**
   * Update staff status after assignment
   */
  static async updateStaffStatus(driverId, conductorId, tripId) {
    try {
      // Update driver status
      await Driver.findByIdAndUpdate(driverId, {
        currentDuty: {
          tripId: tripId,
          status: 'assigned',
          startTime: new Date()
        }
      });

      // Update conductor status
      await Conductor.findByIdAndUpdate(conductorId, {
        currentDuty: {
          tripId: tripId,
          status: 'assigned',
          startTime: new Date()
        }
      });

    } catch (error) {
      console.error('Error updating staff status:', error);
    }
  }

  /**
   * Get fleet summary for dashboard
   */
  static async getFleetSummary() {
    try {
      const summary = await Bus.getFleetSummary();
      const totalBuses = await Bus.countDocuments();
      
      const fleetSummary = {
        total: totalBuses,
        active: 0,
        idle: 0,
        assigned: 0,
        maintenance: 0,
        retired: 0,
        suspended: 0
      };

      summary.forEach(item => {
        fleetSummary[item._id] = item.count;
      });

      return fleetSummary;

    } catch (error) {
      console.error('Error getting fleet summary:', error);
      return null;
    }
  }

  /**
   * Get crew summary for dashboard
   */
  static async getCrewSummary() {
    try {
      const [totalDrivers, activeDrivers, totalConductors, activeConductors] = await Promise.all([
        Driver.countDocuments(),
        Driver.countDocuments({ isActive: true }),
        Conductor.countDocuments(),
        Conductor.countDocuments({ isActive: true })
      ]);

      return {
        drivers: {
          total: totalDrivers,
          active: activeDrivers,
          available: activeDrivers // This would need more complex logic
        },
        conductors: {
          total: totalConductors,
          active: activeConductors,
          available: activeConductors // This would need more complex logic
        }
      };

    } catch (error) {
      console.error('Error getting crew summary:', error);
      return null;
    }
  }

  /**
   * Get compliance alerts for dashboard
   */
  static async getComplianceAlerts() {
    try {
      const buses = await Bus.find({ status: { $in: ['idle', 'assigned'] } });
      const alerts = [];

      for (const bus of buses) {
        const busAlerts = bus.getComplianceAlerts();
        if (busAlerts.length > 0) {
          alerts.push({
            busId: bus._id,
            busNumber: bus.busNumber,
            depotId: bus.depotId,
            alerts: busAlerts
          });
        }
      }

      return alerts;

    } catch (error) {
      console.error('Error getting compliance alerts:', error);
      return [];
    }
  }
}

module.exports = TripAssignmentService;
