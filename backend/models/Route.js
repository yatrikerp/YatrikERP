const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  // Basic Route Information
  routeNumber: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  routeName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Starting and Ending Points
  startingPoint: {
    city: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  endingPoint: {
    city: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Route Details
  totalDistance: {
    type: Number,
    required: true,
    min: 0
  },
  estimatedDuration: {
    type: Number, // in minutes
    required: true,
    min: 0
  },
  
  // Enhanced Intermediate Stops with Distance from Previous
  stops: [{
    stopName: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    stopNumber: {
      type: Number,
      required: true
    },
    distanceFromPrev: {
      type: Number,
      required: true,
      min: 0
    },
    distanceFromStart: {
      type: Number,
      required: true
    },
    estimatedArrival: {
      type: Number, // minutes from start
      required: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],

  // Legacy intermediateStops for backward compatibility
  intermediateStops: [{
    city: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    stopNumber: {
      type: Number,
      required: true
    },
    distanceFromStart: {
      type: Number,
      required: true
    },
    estimatedArrival: {
      type: Number, // minutes from start
      required: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  }],
  
  // Depot Information
  depot: {
    depotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Depot',
      required: true
    },
    depotName: {
      type: String,
      required: true
    },
    depotLocation: {
      type: String,
      required: true
    }
  },
  
  // Scheduling Information
  schedules: [{
    scheduleId: {
      type: String,
      required: true,
      unique: true
    },
    departureTime: {
      type: String, // Format: "HH:MM"
      required: true
    },
    arrivalTime: {
      type: String, // Format: "HH:MM"
      required: true
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom'],
      default: 'daily'
    },
    daysOfWeek: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    customDates: [{
      type: Date
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    effectiveFrom: {
      type: Date,
      default: Date.now
    },
    effectiveTo: {
      type: Date
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Route Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'suspended'],
    default: 'active'
  },
  
  // Bus Assignment
  assignedBuses: [{
    busId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus'
    },
    busNumber: String,
    capacity: Number,
    busType: String
  }],
  
  // Enhanced Pricing Information
  baseFare: {
    type: Number,
    required: true,
    min: 0
  },
  farePerKm: {
    type: Number,
    required: true,
    min: 0
  },
  fareStructure: [{
    fromStop: String,
    toStop: String,
    fare: Number
  }],
  
  // Auto-generated Fare Matrix for Stop-to-Stop Pricing
  fareMatrix: {
    type: Map,
    of: Map,
    default: new Map()
  },
  
  // Fare calculation metadata
  fareCalculation: {
    lastCalculated: {
      type: Date,
      default: Date.now
    },
    farePerKmUsed: {
      type: Number
    },
    totalStops: {
      type: Number
    }
  },
  
  // Route Features
  features: [{
    type: String,
    enum: ['AC', 'WiFi', 'USB_Charging', 'Entertainment', 'Refreshments', 'Wheelchair_Accessible']
  }],
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
routeSchema.index({ routeNumber: 1 });
routeSchema.index({ 'startingPoint.city': 1 });
routeSchema.index({ 'endingPoint.city': 1 });
routeSchema.index({ 'depot.depotId': 1 });
routeSchema.index({ status: 1 });
routeSchema.index({ isActive: 1 });

// Virtual for full route description
routeSchema.virtual('fullRouteDescription').get(function() {
  return `${this.startingPoint.city} → ${this.endingPoint.city}`;
});

// Virtual for total stops
routeSchema.virtual('totalStops').get(function() {
  return this.intermediateStops.length + 2; // +2 for start and end points
});

// Pre-save middleware to generate schedule IDs
routeSchema.pre('save', function(next) {
  if (this.schedules && this.schedules.length > 0) {
    this.schedules.forEach(schedule => {
      if (!schedule.scheduleId) {
        schedule.scheduleId = `SCH_${this.routeNumber}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
    });
  }
  next();
});

// Method to add new schedule
routeSchema.methods.addSchedule = function(scheduleData) {
  const newSchedule = {
    ...scheduleData,
    scheduleId: `SCH_${this.routeNumber}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date()
  };
  
  this.schedules.push(newSchedule);
  return this.save();
};

// Method to update schedule
routeSchema.methods.updateSchedule = function(scheduleId, updateData) {
  const schedule = this.schedules.id(scheduleId);
  if (schedule) {
    Object.assign(schedule, updateData);
    schedule.updatedAt = new Date();
    return this.save();
  }
  throw new Error('Schedule not found');
};

// Method to remove schedule
routeSchema.methods.removeSchedule = function(scheduleId) {
  this.schedules = this.schedules.filter(schedule => schedule.scheduleId !== scheduleId);
  return this.save();
};

// Static method to find routes by cities
routeSchema.statics.findByCities = function(fromCity, toCity) {
  return this.find({
    'startingPoint.city': { $regex: fromCity, $options: 'i' },
    'endingPoint.city': { $regex: toCity, $options: 'i' },
    isActive: true,
    status: 'active'
  });
};

// Static method to find routes by depot
routeSchema.statics.findByDepot = function(depotId) {
  return this.find({
    'depot.depotId': depotId,
    isActive: true
  });
};

// Method to calculate fare matrix for all stop combinations
routeSchema.methods.calculateFareMatrix = function(farePerKm) {
  const stops = this.stops || this.intermediateStops;
  if (!stops || stops.length === 0) {
    return new Map();
  }

  const fareMatrix = new Map();
  const ratePerKm = farePerKm || this.farePerKm || 0;

  // Add start and end points to stops array for calculation
  const allStops = [
    {
      stopName: this.startingPoint.location,
      distanceFromStart: 0,
      stopNumber: 0
    },
    ...stops,
    {
      stopName: this.endingPoint.location,
      distanceFromStart: this.totalDistance,
      stopNumber: stops.length + 1
    }
  ];

  // Calculate fare for each stop-to-stop combination
  for (let i = 0; i < allStops.length; i++) {
    const fromStop = allStops[i];
    const stopMap = new Map();
    
    for (let j = i + 1; j < allStops.length; j++) {
      const toStop = allStops[j];
      const distance = toStop.distanceFromStart - fromStop.distanceFromStart;
      const fare = Math.round(distance * ratePerKm * 100) / 100; // Round to 2 decimal places
      
      stopMap.set(toStop.stopName, {
        distance: distance,
        fare: fare,
        fromStopNumber: fromStop.stopNumber,
        toStopNumber: toStop.stopNumber
      });
    }
    
    if (stopMap.size > 0) {
      fareMatrix.set(fromStop.stopName, stopMap);
    }
  }

  // Update fare calculation metadata
  this.fareMatrix = fareMatrix;
  this.fareCalculation = {
    lastCalculated: new Date(),
    farePerKmUsed: ratePerKm,
    totalStops: allStops.length
  };

  return fareMatrix;
};

// Method to get fare between two stops
routeSchema.methods.getFareBetweenStops = function(fromStopName, toStopName) {
  if (!this.fareMatrix || this.fareMatrix.size === 0) {
    // Calculate fare matrix if not exists
    this.calculateFareMatrix();
  }

  const fromStopMap = this.fareMatrix.get(fromStopName);
  if (!fromStopMap) {
    return null;
  }

  const fareData = fromStopMap.get(toStopName);
  return fareData ? fareData.fare : null;
};

// Method to get all stops for this route
routeSchema.methods.getAllStops = function() {
  const stops = this.stops || this.intermediateStops;
  return [
    {
      stopName: this.startingPoint.location,
      city: this.startingPoint.city,
      stopNumber: 0,
      distanceFromStart: 0,
      isActive: true
    },
    ...stops,
    {
      stopName: this.endingPoint.location,
      city: this.endingPoint.city,
      stopNumber: stops.length + 1,
      distanceFromStart: this.totalDistance,
      isActive: true
    }
  ];
};

const Route = mongoose.model('Route', routeSchema);

module.exports = Route;
