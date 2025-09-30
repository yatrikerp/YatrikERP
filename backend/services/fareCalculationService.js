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
      // City / Ordinary Service
      {
        name: 'City / Ordinary - Local',
        description: 'Standard city bus service for local routes',
        busType: 'City / Ordinary',
        minimumFare: 8,
        ratePerKm: 1.5,
        peakHourMultiplier: 1.0,
        weekendMultiplier: 1.0,
        holidayMultiplier: 1.0,
        studentDiscount: 0,
        seniorDiscount: 0,
        groupDiscount: 0,
        advanceBookingDiscount: 0,
        cancellationFee: 0.1,
        refundPolicy: 'partial',
        isActive: true
      },
      {
        name: 'City / Ordinary - Intercity',
        description: 'Standard city bus service for intercity routes',
        busType: 'City / Ordinary',
        minimumFare: 12,
        ratePerKm: 1.8,
        peakHourMultiplier: 1.0,
        weekendMultiplier: 1.0,
        holidayMultiplier: 1.0,
        studentDiscount: 0,
        seniorDiscount: 0,
        groupDiscount: 0,
        advanceBookingDiscount: 0,
        cancellationFee: 0.1,
        refundPolicy: 'partial',
        isActive: true
      },

      // Fast Passenger / LSFP
      {
        name: 'Fast Passenger / LSFP - Intercity',
        description: 'Limited Stop Fast Passenger service for intercity routes',
        busType: 'Fast Passenger / LSFP',
        minimumFare: 15,
        ratePerKm: 2.2,
        peakHourMultiplier: 1.0,
        weekendMultiplier: 1.0,
        holidayMultiplier: 1.0,
        studentDiscount: 0,
        seniorDiscount: 0,
        groupDiscount: 0,
        advanceBookingDiscount: 0,
        cancellationFee: 0.1,
        refundPolicy: 'partial',
        isActive: true
      },

      // Super Fast Passenger
      {
        name: 'Super Fast Passenger - Intercity',
        description: 'Super Fast Passenger service for intercity routes',
        busType: 'Super Fast Passenger',
        minimumFare: 18,
        ratePerKm: 2.5,
        peakHourMultiplier: 1.0,
        weekendMultiplier: 1.0,
        holidayMultiplier: 1.0,
        studentDiscount: 0,
        seniorDiscount: 0,
        groupDiscount: 0,
        advanceBookingDiscount: 0,
        cancellationFee: 0.1,
        refundPolicy: 'partial',
        isActive: true
      },

      // Super Deluxe
      {
        name: 'Super Deluxe - Intercity',
        description: 'Super Deluxe service for intercity routes',
        busType: 'Super Deluxe',
        minimumFare: 22,
        ratePerKm: 3.0,
        peakHourMultiplier: 1.0,
        weekendMultiplier: 1.0,
        holidayMultiplier: 1.0,
        studentDiscount: 0,
        seniorDiscount: 0,
        groupDiscount: 0,
        advanceBookingDiscount: 0,
        cancellationFee: 0.1,
        refundPolicy: 'partial',
        isActive: true
      },

      // Luxury / Hi-tech & AC
      {
        name: 'Luxury / Hi-tech & AC - Interstate',
        description: 'Luxury AC service for interstate routes',
        busType: 'Luxury / Hi-tech & AC',
        minimumFare: 35,
        ratePerKm: 4.5,
        peakHourMultiplier: 1.1,
        weekendMultiplier: 1.0,
        holidayMultiplier: 1.0,
        studentDiscount: 0,
        seniorDiscount: 0,
        groupDiscount: 0,
        advanceBookingDiscount: 0,
        cancellationFee: 0.1,
        refundPolicy: 'partial',
        isActive: true
      },

      // Garuda Sanchari / Biaxle Premium
      {
        name: 'Garuda Sanchari / Biaxle Premium - Interstate',
        description: 'Premium Garuda service for interstate routes',
        busType: 'Garuda Sanchari / Biaxle Premium',
        minimumFare: 40,
        ratePerKm: 5.0,
        peakHourMultiplier: 1.1,
        weekendMultiplier: 1.0,
        holidayMultiplier: 1.0,
        studentDiscount: 0,
        seniorDiscount: 0,
        groupDiscount: 0,
        advanceBookingDiscount: 0,
        cancellationFee: 0.1,
        refundPolicy: 'partial',
        isActive: true
      },

      // Garuda Maharaja / Garuda King / Multi-axle Premium
      {
        name: 'Garuda Maharaja / Garuda King / Multi-axle Premium - Interstate',
        description: 'Premium Maharaja service for interstate routes',
        busType: 'Garuda Maharaja / Garuda King / Multi-axle Premium',
        minimumFare: 50,
        ratePerKm: 6.0,
        peakHourMultiplier: 1.15,
        weekendMultiplier: 1.0,
        holidayMultiplier: 1.0,
        studentDiscount: 0,
        seniorDiscount: 0,
        groupDiscount: 0,
        advanceBookingDiscount: 0,
        cancellationFee: 0.1,
        refundPolicy: 'partial',
        isActive: true
      },

      // A/C Low Floor
      {
        name: 'A/C Low Floor - City',
        description: 'Air-conditioned low floor service for city routes',
        busType: 'A/C Low Floor',
        minimumFare: 15,
        ratePerKm: 2.8,
        peakHourMultiplier: 1.0,
        weekendMultiplier: 1.0,
        holidayMultiplier: 1.0,
        studentDiscount: 0,
        seniorDiscount: 0,
        groupDiscount: 0,
        advanceBookingDiscount: 0,
        cancellationFee: 0.1,
        refundPolicy: 'partial',
        isActive: true
      },

      // Non A/C Low Floor
      {
        name: 'Non A/C Low Floor - City',
        description: 'Non-air-conditioned low floor service for city routes',
        busType: 'Non A/C Low Floor',
        minimumFare: 12,
        ratePerKm: 2.2,
        peakHourMultiplier: 1.0,
        weekendMultiplier: 1.0,
        holidayMultiplier: 1.0,
        studentDiscount: 0,
        seniorDiscount: 0,
        groupDiscount: 0,
        advanceBookingDiscount: 0,
        cancellationFee: 0.1,
        refundPolicy: 'partial',
        isActive: true
      }
    ];

    try {
      for (const policy of defaultPolicies) {
        await FarePolicy.findOneAndUpdate(
          { busType: policy.busType, name: policy.name },
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
