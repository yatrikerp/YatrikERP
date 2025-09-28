const mongoose = require('mongoose');

const FarePolicySchema = new mongoose.Schema({
  busType: {
    type: String,
    enum: [
      // Official KSRTC Bus Types
      'ordinary', 'lspf', 'fast_passenger', 'venad', 'super_fast', 'super_deluxe',
      'deluxe_express', 'ananthapuri_fast', 'rajadhani', 'minnal',
      'garuda_king_long', 'garuda_volvo', 'garuda_scania', 'garuda_maharaja',
      'low_floor_non_ac', 'low_floor_ac', 'jnnurm_city',
      // Additional Types
      'custom'
    ],
    required: true
  },
  
  routeType: {
    type: String,
    enum: ['local', 'intercity', 'interstate', 'long_distance', 'city', 'district'],
    required: true
  },
  
  // Base fare rates per kilometer
  baseFarePerKm: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Minimum fare regardless of distance
  minimumFare: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Maximum fare cap (optional)
  maximumFare: {
    type: Number,
    min: 0
  },
  
  // Distance brackets for different rates
  distanceBrackets: [{
    fromKm: { type: Number, required: true },
    toKm: { type: Number, required: true },
    ratePerKm: { type: Number, required: true },
    description: String
  }],
  
  // Peak hour multipliers
  peakHourMultiplier: {
    type: Number,
    default: 1.0,
    min: 1.0
  },
  
  // Seasonal adjustments
  seasonalAdjustments: [{
    season: { type: String, enum: ['normal', 'festival', 'holiday', 'monsoon'] },
    multiplier: { type: Number, default: 1.0, min: 0.1 },
    startDate: Date,
    endDate: Date
  }],
  
  // Time-based pricing
  timeBasedPricing: {
    morning: { type: Number, default: 1.0 }, // 6AM-12PM
    afternoon: { type: Number, default: 1.0 }, // 12PM-6PM
    evening: { type: Number, default: 1.0 }, // 6PM-10PM
    night: { type: Number, default: 1.0 } // 10PM-6AM
  },
  
  // Additional charges
  additionalCharges: [{
    name: String,
    amount: Number,
    type: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
    condition: String // e.g., "distance > 100km"
  }],
  
  // Discounts
  discounts: [{
    name: String,
    type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    value: Number,
    condition: String, // e.g., "advance_booking", "student", "senior_citizen"
    validFrom: Date,
    validTo: Date
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  effectiveFrom: {
    type: Date,
    default: Date.now
  },
  
  effectiveTo: Date,
  
  notes: String
}, {
  timestamps: true
});

// Index for efficient queries
FarePolicySchema.index({ busType: 1, routeType: 1, isActive: 1 });
FarePolicySchema.index({ effectiveFrom: 1, effectiveTo: 1 });

// Virtual for calculating fare based on distance
FarePolicySchema.methods.calculateFare = function(distance, timeOfDay = 'afternoon', season = 'normal') {
  let fare = 0;
  
  // Find applicable distance bracket
  let applicableBracket = null;
  for (const bracket of this.distanceBrackets) {
    if (distance >= bracket.fromKm && distance <= bracket.toKm) {
      applicableBracket = bracket;
      break;
    }
  }
  
  // Calculate base fare
  if (applicableBracket) {
    fare = distance * applicableBracket.ratePerKm;
  } else {
    fare = distance * this.baseFarePerKm;
  }
  
  // Apply minimum fare
  fare = Math.max(fare, this.minimumFare);
  
  // Apply time-based multiplier
  const timeMultiplier = this.timeBasedPricing[timeOfDay] || 1.0;
  fare *= timeMultiplier;
  
  // Apply seasonal adjustment
  const seasonalAdjustment = this.seasonalAdjustments.find(s => s.season === season);
  if (seasonalAdjustment) {
    fare *= seasonalAdjustment.multiplier;
  }
  
  // Apply peak hour multiplier if applicable
  fare *= this.peakHourMultiplier;
  
  // Apply maximum fare cap if set
  if (this.maximumFare) {
    fare = Math.min(fare, this.maximumFare);
  }
  
  // Apply additional charges
  for (const charge of this.additionalCharges) {
    if (this.evaluateCondition(charge.condition, { distance })) {
      if (charge.type === 'fixed') {
        fare += charge.amount;
      } else {
        fare += (fare * charge.amount / 100);
      }
    }
  }
  
  return Math.round(fare);
};

// Helper method to evaluate conditions
FarePolicySchema.methods.evaluateCondition = function(condition, context) {
  if (!condition) return true;
  
  try {
    // Simple condition evaluation (can be enhanced)
    return eval(condition.replace(/distance/g, context.distance));
  } catch (e) {
    return false;
  }
};

module.exports = mongoose.model('FarePolicy', FarePolicySchema);