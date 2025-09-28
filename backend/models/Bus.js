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
    enum: ['active', 'maintenance', 'retired', 'suspended'],
    default: 'active'
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
    ref: 'User'
  },
  assignedConductor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

module.exports = mongoose.model('Bus', busSchema);


