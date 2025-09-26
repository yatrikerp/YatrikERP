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
  },

  // Enhanced Stop-to-Stop Fare Map
  stopFareMap: {
    type: Map,
    of: Map,
    default: new Map()
  },

  // Auto-generated Seat Layout
  seatLayout: {
    totalSeats: { type: Number },
    rows: { type: Number },
    seatsPerRow: { type: Number },
    layout: [{
      seatNumber: { type: String, required: true },
      row: { type: Number, required: true },
      column: { type: Number, required: true },
      seatType: { 
        type: String, 
        enum: ['regular', 'ladies', 'disabled', 'sleeper'], 
        default: 'regular' 
      },
      isAvailable: { type: Boolean, default: true },
      isBooked: { type: Boolean, default: false },
      bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }
    }],
    ladiesSeats: { type: Number, default: 0 },
    disabledSeats: { type: Number, default: 0 },
    sleeperSeats: { type: Number, default: 0 }
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

// Method to generate seat layout based on bus capacity
tripSchema.methods.generateSeatLayout = function(busCapacity, busType = 'ac_seater') {
  const layout = [];
  let rows, seatsPerRow, ladiesSeats = 0, disabledSeats = 0, sleeperSeats = 0;
  
  // Determine layout based on bus type and capacity
  switch (busType) {
    case 'ac_sleeper':
      rows = Math.ceil(busCapacity / 2); // Sleeper buses typically have 2 seats per row
      seatsPerRow = 2;
      sleeperSeats = busCapacity;
      break;
    case 'ac_seater':
    case 'non_ac_seater':
      rows = Math.ceil(busCapacity / 4); // Seater buses typically have 4 seats per row
      seatsPerRow = 4;
      ladiesSeats = Math.ceil(busCapacity * 0.15); // 15% ladies seats
      disabledSeats = Math.ceil(busCapacity * 0.05); // 5% disabled seats
      break;
    case 'volvo':
      rows = Math.ceil(busCapacity / 2);
      seatsPerRow = 2;
      sleeperSeats = busCapacity;
      break;
    case 'mini':
      rows = Math.ceil(busCapacity / 3);
      seatsPerRow = 3;
      ladiesSeats = Math.ceil(busCapacity * 0.2);
      disabledSeats = 1;
      break;
    default:
      rows = Math.ceil(busCapacity / 4);
      seatsPerRow = 4;
      ladiesSeats = Math.ceil(busCapacity * 0.15);
      disabledSeats = Math.ceil(busCapacity * 0.05);
  }

  let seatNumber = 1;
  let ladiesCount = 0;
  let disabledCount = 0;

  for (let row = 1; row <= rows; row++) {
    for (let col = 1; col <= seatsPerRow; col++) {
      if (seatNumber > busCapacity) break;

      let seatType = 'regular';
      
      // Assign special seat types
      if (busType.includes('sleeper') || busType === 'volvo') {
        seatType = 'sleeper';
      } else {
        if (ladiesCount < ladiesSeats && (row === 1 || row === 2)) {
          seatType = 'ladies';
          ladiesCount++;
        } else if (disabledCount < disabledSeats && row === 1 && col === 1) {
          seatType = 'disabled';
          disabledCount++;
        }
      }

      layout.push({
        seatNumber: `S${String(seatNumber).padStart(2, '0')}`,
        row: row,
        column: col,
        seatType: seatType,
        isAvailable: true,
        isBooked: false
      });

      seatNumber++;
    }
  }

  // Update seat layout
  this.seatLayout = {
    totalSeats: busCapacity,
    rows: rows,
    seatsPerRow: seatsPerRow,
    layout: layout,
    ladiesSeats: ladiesSeats,
    disabledSeats: disabledSeats,
    sleeperSeats: sleeperSeats
  };

  return this.seatLayout;
};

// Method to get available seats
tripSchema.methods.getAvailableSeats = function() {
  if (!this.seatLayout || !this.seatLayout.layout) {
    return [];
  }
  return this.seatLayout.layout.filter(seat => seat.isAvailable && !seat.isBooked);
};

// Method to book a specific seat
tripSchema.methods.bookSeat = function(seatNumber, userId, bookingId) {
  if (!this.seatLayout || !this.seatLayout.layout) {
    throw new Error('Seat layout not generated');
  }

  const seat = this.seatLayout.layout.find(s => s.seatNumber === seatNumber);
  if (!seat) {
    throw new Error('Seat not found');
  }

  if (seat.isBooked || !seat.isAvailable) {
    throw new Error('Seat already booked');
  }

  seat.isBooked = true;
  seat.isAvailable = false;
  seat.bookedBy = userId;
  seat.bookingId = bookingId;

  this.bookedSeats += 1;
  this.availableSeats = this.capacity - this.bookedSeats;

  return this.save();
};

// Method to cancel seat booking
tripSchema.methods.cancelSeatBooking = function(seatNumber) {
  if (!this.seatLayout || !this.seatLayout.layout) {
    throw new Error('Seat layout not generated');
  }

  const seat = this.seatLayout.layout.find(s => s.seatNumber === seatNumber);
  if (!seat) {
    throw new Error('Seat not found');
  }

  if (!seat.isBooked) {
    throw new Error('Seat not booked');
  }

  seat.isBooked = false;
  seat.isAvailable = true;
  seat.bookedBy = null;
  seat.bookingId = null;

  this.bookedSeats -= 1;
  this.availableSeats = this.capacity - this.bookedSeats;

  return this.save();
};

// Method to get fare between stops
tripSchema.methods.getFareBetweenStops = function(fromStopName, toStopName) {
  if (!this.stopFareMap || this.stopFareMap.size === 0) {
    return null;
  }

  const fromStopMap = this.stopFareMap.get(fromStopName);
  if (!fromStopMap) {
    return null;
  }

  const fareData = fromStopMap.get(toStopName);
  return fareData ? fareData.fare : null;
};

// Method to populate stop fare map from route
tripSchema.methods.populateStopFareMap = async function() {
  const Route = require('./Route');
  const route = await Route.findById(this.routeId);
  
  if (!route) {
    throw new Error('Route not found');
  }

  // Copy fare matrix from route to trip
  this.stopFareMap = route.fareMatrix || new Map();
  return this.save();
};

// Pre-save middleware to update available seats
tripSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('capacity') || this.isModified('bookedSeats')) {
    this.availableSeats = this.capacity - this.bookedSeats;
  }
  next();
});

module.exports = mongoose.model('Trip', tripSchema);
