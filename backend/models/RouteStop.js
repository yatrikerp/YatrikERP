const mongoose = require('mongoose');

const routeStopSchema = new mongoose.Schema({
  // Route reference
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  routeNumber: {
    type: String,
    required: true,
    index: true
  },
  
  // Stop information
  stopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stop',
    required: true
  },
  stopCode: {
    type: String,
    required: true,
    index: true
  },
  stopName: {
    type: String,
    required: true
  },
  stopSequence: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Location data
  coordinates: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  
  // Distance and timing
  distanceFromStart: {
    type: Number,
    required: true,
    min: 0 // in kilometers
  },
  distanceFromPrev: {
    type: Number,
    required: true,
    min: 0 // in kilometers
  },
  estimatedArrival: {
    type: Number,
    required: true,
    min: 0 // minutes from route start
  },
  estimatedDeparture: {
    type: Number,
    required: true,
    min: 0 // minutes from route start
  },
  
  // Route segment timing (for pathfinding)
  segmentDuration: {
    type: Number,
    required: true,
    min: 0 // minutes to next stop
  },
  
  // KSRTC specific data
  ksrtcStopCode: {
    type: String,
    index: true
  },
  stopType: {
    type: String,
    enum: ['terminal', 'major', 'minor', 'request'],
    default: 'minor'
  },
  
  // Operational data
  isActive: {
    type: Boolean,
    default: true
  },
  boardingAllowed: {
    type: Boolean,
    default: true
  },
  alightingAllowed: {
    type: Boolean,
    default: true
  },
  
  // Fare information
  fareFromStart: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Metadata
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

// Compound indexes for efficient querying
routeStopSchema.index({ routeId: 1, stopSequence: 1 });
routeStopSchema.index({ stopId: 1, routeId: 1 });
routeStopSchema.index({ routeNumber: 1, stopSequence: 1 });
routeStopSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });

// Virtual for stop timing
routeStopSchema.virtual('arrivalTimeString').get(function() {
  const hours = Math.floor(this.estimatedArrival / 60);
  const minutes = this.estimatedArrival % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
});

routeStopSchema.virtual('departureTimeString').get(function() {
  const hours = Math.floor(this.estimatedDeparture / 60);
  const minutes = this.estimatedDeparture % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
});

// Method to calculate distance to another stop
routeStopSchema.methods.distanceTo = function(otherStop) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (otherStop.coordinates.latitude - this.coordinates.latitude) * Math.PI / 180;
  const dLon = (otherStop.coordinates.longitude - this.coordinates.longitude) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.coordinates.latitude * Math.PI / 180) * Math.cos(otherStop.coordinates.latitude * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Static method to find stops by route
routeStopSchema.statics.findByRoute = function(routeId) {
  return this.find({ routeId, isActive: true })
    .sort({ stopSequence: 1 })
    .populate('stopId', 'name code location')
    .lean();
};

// Static method to find routes passing through a stop
routeStopSchema.statics.findByStop = function(stopId) {
  return this.find({ stopId, isActive: true })
    .sort({ stopSequence: 1 })
    .populate('routeId', 'routeNumber routeName startingPoint endingPoint')
    .lean();
};

// Static method to find stops within radius
routeStopSchema.statics.findWithinRadius = function(lat, lon, radiusKm = 5) {
  return this.find({
    'coordinates.latitude': {
      $gte: lat - (radiusKm / 111), // Rough conversion: 1 degree ≈ 111 km
      $lte: lat + (radiusKm / 111)
    },
    'coordinates.longitude': {
      $gte: lon - (radiusKm / (111 * Math.cos(lat * Math.PI / 180))),
      $lte: lon + (radiusKm / (111 * Math.cos(lat * Math.PI / 180)))
    },
    isActive: true
  }).lean();
};

module.exports = mongoose.model('RouteStop', routeStopSchema);