const mongoose = require('mongoose');

/**
 * Model for storing daily ticket machine data uploads
 * Used for AI training and analytics
 */
const ticketMachineDataSchema = new mongoose.Schema({
  // Upload metadata
  uploadId: {
    type: String,
    unique: true,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  
  // Depot and trip information
  depotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Depot',
    required: true
  },
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus'
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  },
  
  // Date of ticket data
  dataDate: {
    type: Date,
    required: true
  },
  
  // Ticket machine information
  machineId: {
    type: String,
    required: true
  },
  machineModel: String,
  machineSerial: String,
  
  // Data file information
  fileName: {
    type: String,
    required: true
  },
  fileSize: Number, // in bytes
  fileType: {
    type: String,
    enum: ['csv', 'txt', 'json', 'xml', 'excel'],
    required: true
  },
  fileUrl: String, // If stored in cloud storage
  
  // Parsed ticket data
  ticketData: [{
    ticketNumber: String,
    issueTime: Date,
    passengerName: String,
    age: Number,
    gender: String,
    boardingStop: String,
    destinationStop: String,
    fareAmount: Number,
    seatNumber: String,
    ticketType: {
      type: String,
      enum: ['full', 'half', 'student', 'senior', 'disabled', 'other']
    },
    paymentMode: {
      type: String,
      enum: ['cash', 'card', 'upi', 'wallet', 'other']
    },
    concessionAmount: Number,
    conductorId: String
  }],
  
  // Statistics
  totalTickets: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  totalPassengers: {
    type: Number,
    default: 0
  },
  
  // Processing status
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'verified'],
    default: 'pending'
  },
  processingError: String,
  processedAt: Date,
  
  // Verification
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  verificationNotes: String,
  
  // Data quality metrics
  dataQuality: {
    completeness: Number, // percentage
    accuracy: Number, // percentage
    consistency: Number, // percentage
    issues: [{
      type: String,
      description: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      }
    }]
  },
  
  // AI Training metadata
  usedForTraining: {
    type: Boolean,
    default: false
  },
  trainingBatchId: String,
  trainingDate: Date,
  
  // Additional metadata
  notes: String,
  tags: [String],
  
  // Audit trail
  auditLog: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: String
  }]
}, {
  timestamps: true
});

// Indexes for performance
ticketMachineDataSchema.index({ uploadId: 1 });
ticketMachineDataSchema.index({ depotId: 1, dataDate: -1 });
ticketMachineDataSchema.index({ processingStatus: 1 });
ticketMachineDataSchema.index({ uploadedBy: 1, uploadDate: -1 });
ticketMachineDataSchema.index({ machineId: 1, dataDate: -1 });
ticketMachineDataSchema.index({ tripId: 1 });
ticketMachineDataSchema.index({ usedForTraining: 1 });

// Calculate statistics before saving
ticketMachineDataSchema.pre('save', function(next) {
  if (this.ticketData && this.ticketData.length > 0) {
    this.totalTickets = this.ticketData.length;
    this.totalRevenue = this.ticketData.reduce((sum, ticket) => sum + (ticket.fareAmount || 0), 0);
    this.totalPassengers = this.ticketData.length;
  }
  next();
});

module.exports = mongoose.model('TicketMachineData', ticketMachineDataSchema);

