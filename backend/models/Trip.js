const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  conductorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  serviceDate: { type: Date, required: true },
  startTime: { type: String, required: true }, // HH:mm
  endTime: { type: String, required: true }, // HH:mm
  fare: { type: Number, required: true, min: 0 },
  capacity: { type: Number, required: true, min: 1 },
  availableSeats: { type: Number, default: function() { return this.capacity; } },
  bookedSeats: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['scheduled','boarding','running','completed','cancelled','delayed'], 
    default: 'scheduled' 
  },
  depotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Depot', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
  
  // Booking and payment details
  bookingOpen: { type: Boolean, default: true },
  bookingCloseTime: { type: Date }, // When booking closes before departure
  cancellationPolicy: {
    allowed: { type: Boolean, default: true },
    hoursBeforeDeparture: { type: Number, default: 2 }, // Hours before departure
    refundPercentage: { type: Number, default: 80 } // Percentage refund
  },
  
  // Trip tracking
  actualDeparture: { type: Date },
  actualArrival: { type: Date },
  currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
    timestamp: { type: Date },
    speed: { type: Number, default: 0 },
    heading: { type: Number, default: 0 }
  },
  
  // Delays and incidents
  delays: [{
    reason: { type: String, required: true },
    duration: { type: Number, required: true }, // minutes
    location: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Dynamic pricing
  dynamicPricing: {
    enabled: { type: Boolean, default: false },
    baseFare: { type: Number },
    multiplier: { type: Number, default: 1.0 },
    factors: [{
      type: { type: String, enum: ['demand', 'time', 'weather', 'special'] },
      value: { type: Number },
      description: { type: String }
    }]
  }
}, { timestamps: true });

// Indexes
tripSchema.index({ routeId: 1 });
tripSchema.index({ serviceDate: 1 });
tripSchema.index({ status: 1 });
tripSchema.index({ depotId: 1 });
tripSchema.index({ busId: 1 });

// Virtual for trip duration
// Phase-0 simplified schema

// Virtual for occupancy rate
tripSchema.virtual('occupancyRate').get(function() {
  if (this.capacity > 0) {
    return (this.bookedSeats / this.capacity) * 100;
  }
  return 0;
});

// Virtual for delay status
tripSchema.virtual('isDelayed').get(function() {
  if (this.actualDeparture && this.serviceDate) {
    const scheduledTime = new Date(this.serviceDate);
    const [hours, minutes] = this.startTime.split(':');
    scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return this.actualDeparture > scheduledTime;
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
  return this.bookedSeats >= this.capacity;
};

// Method to get current fare (with dynamic pricing)
tripSchema.methods.getCurrentFare = function() {
  if (this.dynamicPricing.enabled) {
    return this.dynamicPricing.baseFare * this.dynamicPricing.multiplier;
  }
  return this.fare;
};

// Method to check if booking is allowed
tripSchema.methods.canBook = function() {
  if (!this.bookingOpen) return false;
  if (this.status !== 'scheduled') return false;
  if (this.isFull()) return false;
  
  // Check if booking is closed
  if (this.bookingCloseTime && new Date() > this.bookingCloseTime) {
    return false;
  }
  
  return true;
};

// Method to book a seat
tripSchema.methods.bookSeat = function() {
  if (!this.canBook()) {
    throw new Error('Booking not allowed for this trip');
  }
  
  this.bookedSeats += 1;
  this.availableSeats = this.capacity - this.bookedSeats;
  
  return this.save();
};

// Method to cancel a booking
tripSchema.methods.cancelBooking = function() {
  if (this.bookedSeats > 0) {
    this.bookedSeats -= 1;
    this.availableSeats = this.capacity - this.bookedSeats;
    return this.save();
  }
  return this;
};

// Method to check if cancellation is allowed
tripSchema.methods.canCancel = function() {
  if (!this.cancellationPolicy.allowed) return false;
  
  const departureTime = new Date(this.serviceDate);
  const [hours, minutes] = this.startTime.split(':');
  departureTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  const hoursUntilDeparture = (departureTime - new Date()) / (1000 * 60 * 60);
  return hoursUntilDeparture >= this.cancellationPolicy.hoursBeforeDeparture;
};

// Pre-save middleware to update available seats
tripSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('capacity') || this.isModified('bookedSeats')) {
    this.availableSeats = this.capacity - this.bookedSeats;
  }
  next();
});

module.exports = mongoose.model('Trip', tripSchema);
