const mongoose = require('mongoose');

const dutySchema = new mongoose.Schema({
  // Duty Identification
  dutyId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  dutyCode: {
    type: String,
    required: true,
    unique: true
  },
  
  // Duty Details
  title: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['regular', 'overtime', 'emergency', 'special', 'training'],
    default: 'regular'
  },
  
  // Depot & Assignment
  depotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Depot',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Personnel Assignment
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  conductorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conductor',
    required: true
  },
  
  // Vehicle Assignment
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true
  },
  
  // Trip Details
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  },
  
  // Schedule
  scheduledStartTime: {
    type: Date,
    required: true
  },
  scheduledEndTime: {
    type: Date,
    required: true
  },
  actualStartTime: Date,
  actualEndTime: Date,
  
  // Duration & Breaks
  scheduledDuration: {
    type: Number, // in minutes
    required: true
  },
  actualDuration: Number, // in minutes
  breakTime: {
    type: Number, // in minutes
    default: 0
  },
  
  // Status & Progress
  status: {
    type: String,
    enum: ['scheduled', 'assigned', 'started', 'in-progress', 'on-break', 'completed', 'cancelled', 'delayed'],
    default: 'scheduled'
  },
  progress: {
    type: Number, // percentage 0-100
    default: 0,
    min: 0,
    max: 100
  },
  
  // Location Tracking
  currentLocation: {
    type: {
      type: String,
      enum: 'Point',
      default: 'Point'
    },
    coordinates: [Number] // [longitude, latitude]
  },
  startLocation: {
    type: {
      type: String,
      enum: 'Point',
      default: 'Point'
    },
    coordinates: [Number]
  },
  endLocation: {
    type: {
      type: String,
      enum: 'Point',
      default: 'Point'
    },
      coordinates: [Number]
  },
  
  // Performance Metrics
  performance: {
    onTimeStart: {
      type: Boolean,
      default: true
    },
    onTimeEnd: {
      type: Boolean,
      default: true
    },
    delays: [{
      reason: String,
      duration: Number, // in minutes
      timestamp: Date
    }],
    totalDelays: {
      type: Number,
      default: 0
    },
    fuelConsumption: Number,
    distanceCovered: Number,
    passengerCount: Number,
    revenue: Number
  },
  
  // Safety & Compliance
  safety: {
    preTripCheck: {
      completed: {
        type: Boolean,
        default: false
      },
      completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      completedAt: Date,
      notes: String
    },
    postTripCheck: {
      completed: {
        type: Boolean,
        default: false
      },
      completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      completedAt: Date,
      notes: String
    },
    incidents: [{
      type: {
        type: String,
        enum: ['accident', 'breakdown', 'medical', 'security', 'other']
      },
      description: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      },
      timestamp: Date,
      location: {
        type: {
          type: String,
          enum: 'Point',
          default: 'Point'
        },
        coordinates: [Number]
      },
      reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      status: {
        type: String,
        enum: ['reported', 'investigating', 'resolved', 'closed']
      },
      resolution: String
    }]
  },
  
  // Communication & Updates
  updates: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['status', 'location', 'delay', 'incident', 'break', 'other']
    },
    message: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    location: {
      type: {
        type: String,
        enum: 'Point',
        default: 'Point'
      },
      coordinates: [Number]
    }
  }],
  
  // Compliance & Documentation
  compliance: {
    driverRestHours: {
      type: Number, // in hours
      default: 0
    },
    conductorRestHours: {
      type: Number, // in hours
      default: 0
    },
    maxDutyHours: {
      type: Number, // in hours
      default: 12
    },
    restBreaks: [{
      startTime: Date,
      endTime: Date,
      duration: Number, // in minutes
      location: String
    }]
  },
  
  // Financial
  financial: {
    driverAllowance: Number,
    conductorAllowance: Number,
    fuelAllowance: Number,
    otherExpenses: Number,
    totalCost: Number
  },
  
  // Notes & Comments
  notes: String,
  specialInstructions: String,
  
  // Audit Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for performance
dutySchema.index({ depotId: 1, status: 1 });
dutySchema.index({ driverId: 1, status: 1 });
dutySchema.index({ conductorId: 1, status: 1 });
dutySchema.index({ scheduledStartTime: 1 });
dutySchema.index({ 'currentLocation': '2dsphere' });

// Virtual for duty duration
dutySchema.virtual('duration').get(function() {
  if (this.actualStartTime && this.actualEndTime) {
    return (this.actualEndTime - this.actualStartTime) / (1000 * 60); // in minutes
  }
  return this.scheduledDuration;
});

// Virtual for duty status
dutySchema.virtual('isActive').get(function() {
  return ['started', 'in-progress', 'on-break'].includes(this.status);
});

// Virtual for duty completion
dutySchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

// Pre-save middleware
dutySchema.pre('save', function(next) {
  // Calculate actual duration
  if (this.actualStartTime && this.actualEndTime) {
    this.actualDuration = (this.actualEndTime - this.actualStartTime) / (1000 * 60);
  }
  
  // Update progress based on status
  if (this.status === 'scheduled') {
    this.progress = 0;
  } else if (this.status === 'assigned') {
    this.progress = 10;
  } else if (this.status === 'started') {
    this.progress = 25;
  } else if (this.status === 'in-progress') {
    this.progress = 50;
  } else if (this.status === 'on-break') {
    this.progress = 75;
  } else if (this.status === 'completed') {
    this.progress = 100;
  }
  
  // Calculate total cost
  if (this.financial.driverAllowance || this.financial.conductorAllowance || this.financial.fuelAllowance || this.financial.otherExpenses) {
    this.financial.totalCost = (this.financial.driverAllowance || 0) + 
                               (this.financial.conductorAllowance || 0) + 
                               (this.financial.fuelAllowance || 0) + 
                               (this.financial.otherExpenses || 0);
  }
  
  next();
});

// Instance methods
dutySchema.methods.startDuty = function(location) {
  this.status = 'started';
  this.actualStartTime = new Date();
  this.currentLocation = location;
  this.progress = 25;
  
  // Add update
  this.updates.push({
    type: 'status',
    message: 'Duty started',
    updatedBy: this.assignedBy,
    location: location
  });
  
  return this.save();
};

dutySchema.methods.updateProgress = function(progress, location, message) {
  this.progress = Math.min(100, Math.max(0, progress));
  this.currentLocation = location;
  
  if (progress >= 100) {
    this.status = 'completed';
    this.actualEndTime = new Date();
  } else if (progress >= 75) {
    this.status = 'in-progress';
  }
  
  // Add update
  this.updates.push({
    type: 'status',
    message: message || `Progress updated to ${progress}%`,
    updatedBy: this.assignedBy,
    location: location
  });
  
  return this.save();
};

dutySchema.methods.addDelay = function(reason, duration, location) {
  this.performance.delays.push({
    reason,
    duration,
    timestamp: new Date()
  });
  
  this.performance.totalDelays += duration;
  
  // Add update
  this.updates.push({
    type: 'delay',
    message: `Delay: ${reason} (${duration} minutes)`,
    updatedBy: this.assignedBy,
    location: location
  });
  
  return this.save();
};

dutySchema.methods.reportIncident = function(type, description, severity, location, reportedBy) {
  this.safety.incidents.push({
    type,
    description,
    severity,
    timestamp: new Date(),
    location,
    reportedBy,
    status: 'reported'
  });
  
  // Add update
  this.updates.push({
    type: 'incident',
    message: `Incident reported: ${type} - ${description}`,
    updatedBy: reportedBy,
    location: location
  });
  
  return this.save();
};

dutySchema.methods.completeDuty = function(location) {
  this.status = 'completed';
  this.actualEndTime = new Date();
  this.progress = 100;
  this.currentLocation = location;
  
  // Calculate performance metrics
  if (this.actualStartTime && this.actualEndTime) {
    const actualDuration = (this.actualEndTime - this.actualStartTime) / (1000 * 60);
    const scheduledDuration = this.scheduledDuration;
    
    this.performance.onTimeStart = Math.abs((this.actualStartTime - this.scheduledStartTime) / (1000 * 60)) <= 15;
    this.performance.onTimeEnd = Math.abs((this.actualEndTime - this.scheduledEndTime) / (1000 * 60)) <= 15;
  }
  
  // Add update
  this.updates.push({
    type: 'status',
    message: 'Duty completed',
    updatedBy: this.assignedBy,
    location: location
  });
  
  return this.save();
};

dutySchema.methods.takeBreak = function(location, duration) {
  this.status = 'on-break';
  this.breakTime += duration;
  
  // Add rest break
  this.compliance.restBreaks.push({
    startTime: new Date(),
    endTime: new Date(Date.now() + duration * 60 * 1000),
    duration: duration,
    location: location
  });
  
  // Add update
  this.updates.push({
    type: 'break',
    message: `Break started for ${duration} minutes`,
    updatedBy: this.assignedBy,
    location: location
  });
  
  return this.save();
};

dutySchema.methods.endBreak = function() {
  this.status = 'in-progress';
  
  // Update last break end time
  if (this.compliance.restBreaks.length > 0) {
    this.compliance.restBreaks[this.compliance.restBreaks.length - 1].endTime = new Date();
  }
  
  // Add update
  this.updates.push({
    type: 'break',
    message: 'Break ended',
    updatedBy: this.assignedBy
  });
  
  return this.save();
};

// Static methods
dutySchema.statics.findByDepot = function(depotId) {
  return this.find({ depotId }).populate('driverId conductorId busId tripId routeId');
};

dutySchema.statics.findActiveByDepot = function(depotId) {
  return this.find({
    depotId,
    status: { $in: ['started', 'in-progress', 'on-break'] }
  }).populate('driverId conductorId busId tripId routeId');
};

dutySchema.statics.findByDriver = function(driverId) {
  return this.find({ driverId }).populate('conductorId busId tripId routeId');
};

dutySchema.statics.findByConductor = function(conductorId) {
  return this.find({ conductorId }).populate('driverId busId tripId routeId');
};

dutySchema.statics.findScheduledForDate = function(depotId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    depotId,
    scheduledStartTime: { $gte: startOfDay, $lte: endOfDay }
  }).populate('driverId conductorId busId tripId routeId');
};

module.exports = mongoose.model('Duty', dutySchema);


