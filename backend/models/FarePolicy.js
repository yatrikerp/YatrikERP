const mongoose = require('mongoose');

const farePolicySchema = new mongoose.Schema({
  // Basic Policy Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Bus Type Information
  busType: {
    type: String,
    required: true,
    enum: [
      'City / Ordinary',
      'City Fast',
      'Fast Passenger / LSFP',
      'Super Fast Passenger',
      'Super Express',
      'Super Deluxe',
      'Luxury / Hi-tech & AC',
      'Garuda Sanchari / Biaxle Premium',
      'Garuda Maharaja / Garuda King / Multi-axle Premium',
      'A/C Low Floor',
      'Non A/C Low Floor'
    ]
  },
  
  // Fare Structure
  minimumFare: {
    type: Number,
    required: true,
    min: 0
  },
  ratePerKm: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Route and Depot Information
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: false
  },
  routeName: {
    type: String,
    trim: true
  },
  depotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Depot',
    required: false
  },
  depotName: {
    type: String,
    trim: true
  },
  
  // Advanced Pricing Options
  peakHourMultiplier: {
    type: Number,
    default: 1.0,
    min: 1.0,
    max: 2.0
  },
  weekendMultiplier: {
    type: Number,
    default: 1.0,
    min: 1.0,
    max: 2.0
  },
  holidayMultiplier: {
    type: Number,
    default: 1.0,
    min: 1.0,
    max: 2.0
  },
  
  // Discount Options
  studentDiscount: {
    type: Number,
    default: 0,
    min: 0,
    max: 1.0
  },
  seniorDiscount: {
    type: Number,
    default: 0,
    min: 0,
    max: 1.0
  },
  groupDiscount: {
    type: Number,
    default: 0,
    min: 0,
    max: 1.0
  },
  advanceBookingDiscount: {
    type: Number,
    default: 0,
    min: 0,
    max: 1.0
  },
  
  // Cancellation and Refund
  cancellationFee: {
    type: Number,
    default: 0.1,
    min: 0,
    max: 1.0
  },
  refundPolicy: {
    type: String,
    enum: ['none', 'partial', 'full'],
    default: 'partial'
  },
  
  // Validity Period
  validityStart: {
    type: Date,
    default: Date.now
  },
  validityEnd: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
  },
  
  // Status and Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  conditions: [{
    type: String,
    trim: true
  }],
  
  // Audit Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
farePolicySchema.index({ busType: 1, isActive: 1 });
farePolicySchema.index({ routeId: 1, isActive: 1 });
farePolicySchema.index({ depotId: 1, isActive: 1 });

// Virtual for calculated sample fare
farePolicySchema.virtual('sampleFare').get(function() {
  const sampleDistance = 10; // 10km sample
  const calculatedFare = sampleDistance * this.ratePerKm;
  const peakHourFare = calculatedFare * this.peakHourMultiplier;
  return Math.max(this.minimumFare, peakHourFare);
});

// Ensure virtual fields are serialized
farePolicySchema.set('toJSON', { virtuals: true });
farePolicySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('FarePolicy', farePolicySchema);