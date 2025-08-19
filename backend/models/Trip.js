const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  conductorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  serviceDate: { type: Date, required: true },
  startTime: { type: String, required: true }, // HH:mm
  status: { type: String, enum: ['scheduled','running','completed','cancelled'], default: 'scheduled' }
}, { timestamps: true });

// Indexes
tripSchema.index({ routeId: 1 });
tripSchema.index({ serviceDate: 1 });
tripSchema.index({ status: 1 });

// Virtual for trip duration
// Phase-0 simplified schema

// Virtual for occupancy rate
tripSchema.virtual('occupancyRate').get(function() {
  if (this.totalSeats > 0) {
    return (this.bookedSeats / this.totalSeats) * 100;
  }
  return 0;
});

// Virtual for delay status
tripSchema.virtual('isDelayed').get(function() {
  if (this.actualDeparture && this.scheduledDeparture) {
    return this.actualDeparture > this.scheduledDeparture;
  }
  return false;
});

// Method to update trip status
tripSchema.methods.updateStatus = function(newStatus, location = null) {
  this.status = newStatus;
  
  if (location) {
    this.currentLocation = {
      type: 'Point',
      coordinates: location.coordinates,
      timestamp: new Date(),
      speed: location.speed || 0,
      heading: location.heading || 0
    };
  }
  
  // Update timestamps based on status
  switch (newStatus) {
    case 'boarding':
      if (!this.actualDeparture) {
        this.actualDeparture = new Date();
      }
      break;
    case 'departed':
      this.actualDeparture = new Date();
      break;
    case 'arrived':
      this.actualArrival = new Date();
      break;
  }
  
  return this.save();
};

// Method to add delay
tripSchema.methods.addDelay = function(reason, duration, location) {
  this.delays.push({
    reason,
    duration,
    location,
    timestamp: new Date()
  });
  
  if (this.status === 'scheduled') {
    this.status = 'delayed';
  }
  
  return this.save();
};

// Method to check if trip is full
tripSchema.methods.isFull = function() {
  return this.bookedSeats >= this.totalSeats;
};

// Method to get current fare (with dynamic pricing)
tripSchema.methods.getCurrentFare = function() {
  if (this.dynamicPricing.enabled) {
    return this.baseFare * this.dynamicPricing.multiplier;
  }
  return this.baseFare;
};

// Pre-save middleware to update available seats
// no-op

module.exports = mongoose.model('Trip', tripSchema);
