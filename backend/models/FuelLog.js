const mongoose = require('mongoose');

const fuelLogSchema = new mongoose.Schema({
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  depotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Depot',
    required: true
  },
  fuelType: {
    type: String,
    enum: ['diesel', 'petrol', 'cng', 'electric'],
    default: 'diesel'
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    enum: ['liters', 'kg', 'kwh'],
    default: 'liters'
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  odometerReading: {
    type: Number,
    required: true,
    min: 0
  },
  previousOdometer: {
    type: Number,
    required: true,
    min: 0
  },
  distanceCovered: {
    type: Number,
    required: true,
    min: 0
  },
  mileage: {
    type: Number, // km/liter or km/kwh
    min: 0
  },
  fuelStation: {
    name: String,
    location: String,
    gstNumber: String
  },
  receiptNumber: String,
  notes: String,
  loggedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationNotes: String
}, {
  timestamps: true
});

// Calculate mileage before saving
fuelLogSchema.pre('save', function(next) {
  if (this.distanceCovered > 0 && this.quantity > 0) {
    this.mileage = this.distanceCovered / this.quantity;
  }
  next();
});

// Indexes for performance
fuelLogSchema.index({ busId: 1, createdAt: -1 });
fuelLogSchema.index({ tripId: 1 });
fuelLogSchema.index({ driverId: 1 });
fuelLogSchema.index({ depotId: 1 });
fuelLogSchema.index({ createdAt: -1 });
fuelLogSchema.index({ verificationStatus: 1 });

module.exports = mongoose.model('FuelLog', fuelLogSchema);

