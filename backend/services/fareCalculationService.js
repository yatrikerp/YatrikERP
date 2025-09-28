const FarePolicy = require('../models/FarePolicy');

class FareCalculationService {
  
  /**
   * Calculate fare for a specific bus type, route, and distance
   * @param {string} busType - Type of bus
   * @param {string} routeType - Type of route (local, intercity, interstate, etc.)
   * @param {number} distance - Distance in kilometers
   * @param {Object} options - Additional options
   * @returns {Object} Fare calculation result
   */
  static async calculateFare(busType, routeType, distance, options = {}) {
    try {
      const {
        timeOfDay = 'afternoon',
        season = 'normal',
        departureTime = null,
        advanceBooking = false,
        passengerType = 'adult'
      } = options;

      // Find applicable fare policy
      const farePolicy = await FarePolicy.findOne({
        busType,
        routeType,
        isActive: true,
        effectiveFrom: { $lte: new Date() },
        $or: [
          { effectiveTo: null },
          { effectiveTo: { $gte: new Date() } }
        ]
      }).sort({ effectiveFrom: -1 });

      if (!farePolicy) {
        throw new Error(`No fare policy found for bus type: ${busType}, route type: ${routeType}`);
      }

      // Calculate base fare
      const baseFare = farePolicy.calculateFare(distance, timeOfDay, season);

      // Apply discounts
      let finalFare = baseFare;
      let appliedDiscounts = [];

      for (const discount of farePolicy.discounts) {
        if (this.isDiscountApplicable(discount, options)) {
          let discountAmount = 0;
          
          if (discount.type === 'percentage') {
            discountAmount = (finalFare * discount.value) / 100;
          } else {
            discountAmount = discount.value;
          }

          finalFare -= discountAmount;
          appliedDiscounts.push({
            name: discount.name,
            amount: discountAmount,
            type: discount.type
          });
        }
      }

      // Ensure fare is not negative
      finalFare = Math.max(finalFare, 0);

      return {
        success: true,
        data: {
          busType,
          routeType,
          distance,
          baseFare,
          finalFare,
          appliedDiscounts,
          farePolicy: {
            id: farePolicy._id,
            name: `${busType} - ${routeType}`,
            minimumFare: farePolicy.minimumFare,
            maximumFare: farePolicy.maximumFare
          },
          breakdown: {
            distanceKm: distance,
            ratePerKm: this.getRatePerKm(farePolicy, distance),
            timeMultiplier: farePolicy.timeBasedPricing[timeOfDay] || 1.0,
            seasonalMultiplier: this.getSeasonalMultiplier(farePolicy, season),
            peakHourMultiplier: farePolicy.peakHourMultiplier
          }
        }
      };

    } catch (error) {
      console.error('Fare calculation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get fare for multiple bus types on the same route
   */
  static async getFareComparison(busTypes, routeType, distance, options = {}) {
    const comparisons = [];
    
    for (const busType of busTypes) {
      const fareResult = await this.calculateFare(busType, routeType, distance, options);
      if (fareResult.success) {
        comparisons.push(fareResult.data);
      }
    }

    return {
      success: true,
      data: {
        routeType,
        distance,
        comparisons: comparisons.sort((a, b) => a.finalFare - b.finalFare)
      }
    };
  }

  /**
   * Get fare policies for a specific bus type
   */
  static async getFarePoliciesForBusType(busType) {
    try {
      const policies = await FarePolicy.find({
        busType,
        isActive: true
      }).sort({ routeType: 1 });

      return {
        success: true,
        data: policies
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create default fare policies for all KSRTC bus types
   */
  static async createDefaultFarePolicies() {
    const defaultPolicies = [
      // Ordinary Service
      {
        busType: 'ordinary',
        routeType: 'local',
        baseFarePerKm: 1.5,
        minimumFare: 8,
        maximumFare: 50,
        distanceBrackets: [
          { fromKm: 0, toKm: 10, ratePerKm: 1.5, description: 'Local short distance' },
          { fromKm: 11, toKm: 25, ratePerKm: 1.3, description: 'Local medium distance' },
          { fromKm: 26, toKm: 50, ratePerKm: 1.2, description: 'Local long distance' }
        ],
        timeBasedPricing: { morning: 1.0, afternoon: 1.0, evening: 1.0, night: 1.2 }
      },
      {
        busType: 'ordinary',
        routeType: 'intercity',
        baseFarePerKm: 1.8,
        minimumFare: 12,
        maximumFare: 80,
        distanceBrackets: [
          { fromKm: 0, toKm: 20, ratePerKm: 1.8, description: 'Short intercity' },
          { fromKm: 21, toKm: 50, ratePerKm: 1.6, description: 'Medium intercity' },
          { fromKm: 51, toKm: 100, ratePerKm: 1.4, description: 'Long intercity' }
        ]
      },

      // LSFP (Limited Stop Fast Passenger)
      {
        busType: 'lspf',
        routeType: 'intercity',
        baseFarePerKm: 2.2,
        minimumFare: 15,
        maximumFare: 100,
        distanceBrackets: [
          { fromKm: 0, toKm: 25, ratePerKm: 2.2, description: 'Short intercity' },
          { fromKm: 26, toKm: 60, ratePerKm: 2.0, description: 'Medium intercity' },
          { fromKm: 61, toKm: 120, ratePerKm: 1.8, description: 'Long intercity' }
        ]
      },

      // Super Fast
      {
        busType: 'super_fast',
        routeType: 'intercity',
        baseFarePerKm: 2.5,
        minimumFare: 18,
        maximumFare: 120,
        distanceBrackets: [
          { fromKm: 0, toKm: 30, ratePerKm: 2.5, description: 'Short intercity' },
          { fromKm: 31, toKm: 70, ratePerKm: 2.3, description: 'Medium intercity' },
          { fromKm: 71, toKm: 150, ratePerKm: 2.0, description: 'Long intercity' }
        ]
      },

      // Super Deluxe
      {
        busType: 'super_deluxe',
        routeType: 'intercity',
        baseFarePerKm: 3.0,
        minimumFare: 22,
        maximumFare: 150,
        distanceBrackets: [
          { fromKm: 0, toKm: 35, ratePerKm: 3.0, description: 'Short intercity' },
          { fromKm: 36, toKm: 80, ratePerKm: 2.8, description: 'Medium intercity' },
          { fromKm: 81, toKm: 180, ratePerKm: 2.5, description: 'Long intercity' }
        ]
      },

      // Garuda Services (Luxury)
      {
        busType: 'garuda_volvo',
        routeType: 'interstate',
        baseFarePerKm: 4.5,
        minimumFare: 35,
        maximumFare: 300,
        distanceBrackets: [
          { fromKm: 0, toKm: 50, ratePerKm: 4.5, description: 'Short interstate' },
          { fromKm: 51, toKm: 120, ratePerKm: 4.0, description: 'Medium interstate' },
          { fromKm: 121, toKm: 250, ratePerKm: 3.5, description: 'Long interstate' }
        ],
        peakHourMultiplier: 1.1
      },
      {
        busType: 'garuda_scania',
        routeType: 'interstate',
        baseFarePerKm: 5.0,
        minimumFare: 40,
        maximumFare: 350,
        distanceBrackets: [
          { fromKm: 0, toKm: 50, ratePerKm: 5.0, description: 'Short interstate' },
          { fromKm: 51, toKm: 120, ratePerKm: 4.5, description: 'Medium interstate' },
          { fromKm: 121, toKm: 250, ratePerKm: 4.0, description: 'Long interstate' }
        ],
        peakHourMultiplier: 1.1
      },
      {
        busType: 'garuda_maharaja',
        routeType: 'interstate',
        baseFarePerKm: 6.0,
        minimumFare: 50,
        maximumFare: 400,
        distanceBrackets: [
          { fromKm: 0, toKm: 60, ratePerKm: 6.0, description: 'Short interstate' },
          { fromKm: 61, toKm: 150, ratePerKm: 5.5, description: 'Medium interstate' },
          { fromKm: 151, toKm: 300, ratePerKm: 5.0, description: 'Long interstate' }
        ],
        peakHourMultiplier: 1.15
      },

      // City Services
      {
        busType: 'low_floor_ac',
        routeType: 'city',
        baseFarePerKm: 2.8,
        minimumFare: 15,
        maximumFare: 60,
        distanceBrackets: [
          { fromKm: 0, toKm: 15, ratePerKm: 2.8, description: 'City short distance' },
          { fromKm: 16, toKm: 30, ratePerKm: 2.5, description: 'City medium distance' },
          { fromKm: 31, toKm: 50, ratePerKm: 2.2, description: 'City long distance' }
        ]
      },

      // Minnal (Night Service)
      {
        busType: 'minnal',
        routeType: 'long_distance',
        baseFarePerKm: 3.5,
        minimumFare: 25,
        maximumFare: 200,
        distanceBrackets: [
          { fromKm: 0, toKm: 40, ratePerKm: 3.5, description: 'Short night service' },
          { fromKm: 41, toKm: 100, ratePerKm: 3.2, description: 'Medium night service' },
          { fromKm: 101, toKm: 200, ratePerKm: 2.8, description: 'Long night service' }
        ],
        timeBasedPricing: { morning: 0.9, afternoon: 1.0, evening: 1.1, night: 1.2 }
      }
    ];

    try {
      for (const policy of defaultPolicies) {
        await FarePolicy.findOneAndUpdate(
          { busType: policy.busType, routeType: policy.routeType },
          policy,
          { upsert: true, new: true }
        );
      }

      return {
        success: true,
        message: 'Default fare policies created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper methods
  static isDiscountApplicable(discount, options) {
    if (discount.validFrom && new Date() < discount.validFrom) return false;
    if (discount.validTo && new Date() > discount.validTo) return false;
    
    // Add more condition evaluation logic here
    if (discount.condition === 'advance_booking' && options.advanceBooking) return true;
    if (discount.condition === 'student' && options.passengerType === 'student') return true;
    
    return true;
  }

  static getRatePerKm(farePolicy, distance) {
    for (const bracket of farePolicy.distanceBrackets) {
      if (distance >= bracket.fromKm && distance <= bracket.toKm) {
        return bracket.ratePerKm;
      }
    }
    return farePolicy.baseFarePerKm;
  }

  static getSeasonalMultiplier(farePolicy, season) {
    const adjustment = farePolicy.seasonalAdjustments.find(s => s.season === season);
    return adjustment ? adjustment.multiplier : 1.0;
  }
}

module.exports = FareCalculationService;
