// Fare Policy Service for automatic fare calculation
export const FARE_POLICIES = {
  'City / Ordinary': {
    minimumFare: 10,
    ratePerKm: 1.00, // ₹1/km
    description: 'City / Ordinary service'
  },
  'City Fast': {
    minimumFare: 12,
    ratePerKm: 1.03, // 103 paise/km
    description: 'City Fast service'
  },
  'Fast Passenger / LSFP': {
    minimumFare: 15,
    ratePerKm: 1.05, // 105 paise/km
    description: 'Fast Passenger / Limited Stop Fast Passenger'
  },
  'Super Fast Passenger': {
    minimumFare: 22,
    ratePerKm: 1.08, // 108 paise/km
    description: 'Super Fast Passenger service'
  },
  'Super Express': {
    minimumFare: 28,
    ratePerKm: 1.10, // 110 paise/km
    description: 'Super Express service'
  },
  'Super Deluxe': {
    minimumFare: 40,
    ratePerKm: 1.20, // 120 paise/km
    description: 'Super Deluxe service'
  },
  'Luxury / Hi-tech & AC': {
    minimumFare: 60,
    ratePerKm: 1.50, // 150 paise/km
    description: 'Luxury / Hi-tech & AC service'
  },
  'Garuda Sanchari / Biaxle Premium': {
    minimumFare: 60,
    ratePerKm: 1.81, // 181 paise/km
    description: 'Garuda Sanchari / Biaxle Premium service'
  },
  'Garuda Maharaja / Garuda King / Multi-axle Premium': {
    minimumFare: 100,
    ratePerKm: 2.25, // 225 paise/km
    description: 'Garuda Maharaja / Garuda King / Multi-axle Premium service'
  },
  'A/C Low Floor': {
    minimumFare: 26,
    ratePerKm: 1.75, // 175 paise/km
    description: 'A/C Low Floor service'
  },
  'Non A/C Low Floor': {
    minimumFare: 10,
    ratePerKm: 1.00, // 100 paise/km
    description: 'Non A/C Low Floor service'
  }
};

/**
 * Calculate fare based on bus type and distance
 * @param {string} busType - The type of bus service
 * @param {number} distanceKm - Distance in kilometers
 * @returns {Object} - Fare calculation result
 */
export const calculateFare = (busType, distanceKm) => {
  const policy = FARE_POLICIES[busType];
  
  if (!policy) {
    console.warn(`No fare policy found for bus type: ${busType}`);
    return {
      busType,
      distanceKm,
      minimumFare: 10,
      ratePerKm: 1.00,
      calculatedFare: 10,
      finalFare: Math.max(10, distanceKm * 1.00),
      error: `No fare policy found for bus type: ${busType}`
    };
  }

  const calculatedFare = distanceKm * policy.ratePerKm;
  const finalFare = Math.max(policy.minimumFare, calculatedFare);

  return {
    busType,
    distanceKm,
    minimumFare: policy.minimumFare,
    ratePerKm: policy.ratePerKm,
    calculatedFare: Math.round(calculatedFare * 100) / 100,
    finalFare: Math.round(finalFare * 100) / 100,
    description: policy.description
  };
};

/**
 * Get all available bus types
 * @returns {Array} - Array of bus type names
 */
export const getAvailableBusTypes = () => {
  return Object.keys(FARE_POLICIES);
};

/**
 * Get fare policy for a specific bus type
 * @param {string} busType - The type of bus service
 * @returns {Object|null} - Fare policy object or null if not found
 */
export const getFarePolicy = (busType) => {
  return FARE_POLICIES[busType] || null;
};

/**
 * Calculate fare with additional factors
 * @param {string} busType - The type of bus service
 * @param {number} distanceKm - Distance in kilometers
 * @param {Object} options - Additional options
 * @param {number} options.peakHourMultiplier - Peak hour multiplier (default: 1.0)
 * @param {number} options.weekendMultiplier - Weekend multiplier (default: 1.0)
 * @param {number} options.holidayMultiplier - Holiday multiplier (default: 1.0)
 * @param {number} options.studentDiscount - Student discount (default: 0)
 * @param {number} options.seniorDiscount - Senior discount (default: 0)
 * @returns {Object} - Enhanced fare calculation result
 */
export const calculateFareWithFactors = (busType, distanceKm, options = {}) => {
  const baseCalculation = calculateFare(busType, distanceKm);
  
  const {
    peakHourMultiplier = 1.0,
    weekendMultiplier = 1.0,
    holidayMultiplier = 1.0,
    studentDiscount = 0,
    seniorDiscount = 0
  } = options;

  let adjustedFare = baseCalculation.finalFare;
  
  // Apply multipliers
  adjustedFare *= peakHourMultiplier;
  adjustedFare *= weekendMultiplier;
  adjustedFare *= holidayMultiplier;
  
  // Apply discounts (subtract from fare)
  const discountAmount = adjustedFare * (studentDiscount + seniorDiscount);
  adjustedFare -= discountAmount;
  
  // Ensure minimum fare is maintained
  adjustedFare = Math.max(baseCalculation.minimumFare, adjustedFare);

  return {
    ...baseCalculation,
    peakHourMultiplier,
    weekendMultiplier,
    holidayMultiplier,
    studentDiscount,
    seniorDiscount,
    adjustedFare: Math.round(adjustedFare * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100
  };
};

/**
 * Format fare for display
 * @param {number} fare - Fare amount
 * @returns {string} - Formatted fare string
 */
export const formatFare = (fare) => {
  return `₹${fare.toFixed(2)}`;
};

/**
 * Validate fare calculation input
 * @param {string} busType - The type of bus service
 * @param {number} distanceKm - Distance in kilometers
 * @returns {Object} - Validation result
 */
export const validateFareInput = (busType, distanceKm) => {
  const errors = [];
  
  if (!busType || !FARE_POLICIES[busType]) {
    errors.push(`Invalid bus type: ${busType}`);
  }
  
  if (!distanceKm || distanceKm <= 0) {
    errors.push('Distance must be greater than 0');
  }
  
  if (distanceKm > 1000) {
    errors.push('Distance seems unusually high (>1000km)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
