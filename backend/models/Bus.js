const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  depotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Depot',
    required: true
  },
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
  capacity: {
    total: {
      type: Number,
      required: true,
      min: 1
    },
    sleeper: {
      type: Number,
      default: 0
    },
    seater: {
      type: Number,
      default: 0
    },
    ladies: {
      type: Number,
      default: 0
    },
    disabled: {
      type: Number,
      default: 0
    }
  },
  amenities: [{
    type: String,
    enum: ['wifi', 'charging', 'entertainment', 'refreshments', 'toilet', 'ac', 'heating']
  }],
  specifications: {
    manufacturer: String,
    model: String,
    year: Number,
    engine: String,
    fuelType: {
      type: String,
      enum: ['diesel', 'petrol', 'cng', 'electric', 'hybrid'],
      default: 'diesel'
    },
    mileage: Number, // km/liter
    maxSpeed: Number, // km/h
    length: Number, // meters
    width: Number, // meters
    height: Number // meters
  },
  status: {
    type: String,
    enum: ['active', 'idle', 'assigned', 'maintenance', 'retired', 'suspended'],
    default: 'idle'
  },
  currentLocation: {
    latitude: Number,
    longitude: Number,
    lastUpdated: Date,
    speed: Number, // km/h
    heading: Number, // degrees
    stopName: String
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  assignedConductor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conductor'
  },
  currentTrip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  },
  currentRoute: {
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route'
    },
    routeName: String,
    routeNumber: String,
    assignedAt: Date,
  },
  
  // Fare information
  fareInfo: {
    baseFarePerKm: Number,
    minimumFare: Number,
    maximumFare: Number,
    routeType: {
      type: String,
      enum: ['local', 'intercity', 'interstate', 'long_distance', 'city', 'district'],
      default: 'intercity'
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  maintenance: {
    lastService: Date,
    nextService: Date,
    totalDistance: Number, // km
    engineHours: Number,
    issues: [{
      description: String,
      reportedAt: Date,
      resolvedAt: Date,
      cost: Number,
      mechanic: String
    }]
  },
  fuel: {
    currentLevel: Number, // percentage
    lastRefuel: Date,
    averageConsumption: Number, // km/liter
    tankCapacity: Number // liters
  },
  documents: {
    permit: {
      number: String,
      expiryDate: Date,
      status: String
    },
    insurance: {
      number: String,
      expiryDate: Date,
      company: String
    },
    fitness: {
      number: String,
      expiryDate: Date,
      status: String
    },
    puc: {
      number: String,
      expiryDate: Date,
      status: String
    }
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: String
}, {
  timestamps: true
});

// Indexes for performance
busSchema.index({ depotId: 1 });
busSchema.index({ status: 1 });
busSchema.index({ busType: 1 });
busSchema.index({ 'currentLocation.lastUpdated': -1 });
busSchema.index({ assignedDriver: 1 });
busSchema.index({ assignedConductor: 1 });
busSchema.index({ currentTrip: 1 });
busSchema.index({ 'currentRoute.routeId': 1 });

// Calculate total capacity before saving (only if not explicitly set)
busSchema.pre('save', function(next) {
  if (this.capacity && this.isNew) {
    // Only auto-calculate if total is not explicitly set or is 0
    if (!this.capacity.total || this.capacity.total === 0) {
      this.capacity.total = (this.capacity.sleeper || 0) + (this.capacity.seater || 0);
    }
  }
  next();
});

// Instance methods for compliance checking
busSchema.methods.isCompliant = function() {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
  
  // Check if insurance is expired or expiring soon
  if (this.documents.insurance.expiryDate && this.documents.insurance.expiryDate <= thirtyDaysFromNow) {
    return { compliant: false, reason: 'Insurance expired or expiring soon', expiryDate: this.documents.insurance.expiryDate };
  }
  
  // Check if fitness certificate is expired or expiring soon
  if (this.documents.fitness.expiryDate && this.documents.fitness.expiryDate <= thirtyDaysFromNow) {
    return { compliant: false, reason: 'Fitness certificate expired or expiring soon', expiryDate: this.documents.fitness.expiryDate };
  }
  
  // Check if bus is in maintenance
  if (this.status === 'maintenance') {
    return { compliant: false, reason: 'Bus is under maintenance' };
  }
  
  // Check if bus is retired
  if (this.status === 'retired') {
    return { compliant: false, reason: 'Bus is retired' };
  }
  
  return { compliant: true };
};

// Method to check if bus is available for assignment
busSchema.methods.isAvailableForAssignment = function() {
  const compliance = this.isCompliant();
  if (!compliance.compliant) {
    return false;
  }
  
  // Bus must be idle to be available for assignment
  return this.status === 'idle';
};

// Method to get compliance alerts
busSchema.methods.getComplianceAlerts = function() {
  const alerts = [];
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
  
  if (this.documents.insurance.expiryDate && this.documents.insurance.expiryDate <= thirtyDaysFromNow) {
    alerts.push({
      type: 'insurance',
      message: `Insurance expires on ${this.documents.insurance.expiryDate.toDateString()}`,
      severity: this.documents.insurance.expiryDate <= now ? 'critical' : 'warning',
      expiryDate: this.documents.insurance.expiryDate
    });
  }
  
  if (this.documents.fitness.expiryDate && this.documents.fitness.expiryDate <= thirtyDaysFromNow) {
    alerts.push({
      type: 'fitness',
      message: `Fitness certificate expires on ${this.documents.fitness.expiryDate.toDateString()}`,
      severity: this.documents.fitness.expiryDate <= now ? 'critical' : 'warning',
      expiryDate: this.documents.fitness.expiryDate
    });
  }
  
  if (this.maintenance.nextService && this.maintenance.nextService <= thirtyDaysFromNow) {
    alerts.push({
      type: 'maintenance',
      message: `Maintenance due on ${this.maintenance.nextService.toDateString()}`,
      severity: this.maintenance.nextService <= now ? 'critical' : 'warning',
      dueDate: this.maintenance.nextService
    });
  }
  
  return alerts;
};

// Static method to find available buses for assignment
busSchema.statics.findAvailableBuses = function(depotId, busType) {
  const query = {
    depotId: depotId,
    status: 'idle'
  };
  
  if (busType) {
    query.busType = busType;
  }
  
  return this.find(query).populate('depotId', 'depotName depotCode');
};

// Static method to get fleet summary
busSchema.statics.getFleetSummary = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('Bus', busSchema);


