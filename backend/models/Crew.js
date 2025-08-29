const mongoose = require('mongoose');

const crewSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  conductorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  depotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Depot',
    required: true
  },
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true
  },
  dutyStartTime: {
    type: Date,
    required: true
  },
  dutyEndTime: Date,
  status: {
    type: String,
    enum: ['assigned', 'started', 'in_progress', 'completed', 'cancelled'],
    default: 'assigned'
  },
  actualStartTime: Date,
  actualEndTime: Date,
  breakTime: {
    start: Date,
    end: Date,
    duration: Number // in minutes
  },
  notes: String,
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  // Performance tracking
  performance: {
    onTimeDeparture: Boolean,
    onTimeArrival: Boolean,
    passengerCount: Number,
    revenueCollected: Number,
    fuelConsumed: Number,
    issues: [{
      type: String,
      description: String,
      reportedAt: Date,
      resolvedAt: Date,
      resolution: String
    }]
  }
}, {
  timestamps: true
});

// Indexes for performance
crewSchema.index({ tripId: 1 });
crewSchema.index({ driverId: 1, status: 1 });
crewSchema.index({ conductorId: 1, status: 1 });
crewSchema.index({ depotId: 1 });
crewSchema.index({ status: 1 });
crewSchema.index({ dutyStartTime: 1 });

module.exports = mongoose.model('Crew', crewSchema);

