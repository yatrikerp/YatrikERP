const mongoose = require('mongoose');

const conductorSchema = new mongoose.Schema({
  // Basic Information
  conductorId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  
  // Employment Details
  employeeCode: {
    type: String,
    required: true,
    unique: true
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'terminated'],
    default: 'active'
  },
  depotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Depot',
    required: true
  },
  
  // Credentials
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // Duty & Assignment
  currentDuty: {
    dutyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Duty'
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip'
    },
    busId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus'
    },
    startTime: Date,
    endTime: Date,
    status: {
      type: String,
      enum: ['assigned', 'started', 'in-progress', 'completed', 'cancelled'],
      default: 'assigned'
    }
  },
  
  // Attendance Tracking
  attendance: [{
    date: {
      type: Date,
      required: true
    },
    loginTime: Date,
    logoutTime: Date,
    dutyStartTime: Date,
    dutyEndTime: Date,
    totalDutyHours: Number,
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half-day', 'overtime'],
      default: 'present'
    },
    location: {
      type: {
        type: String,
        enum: 'Point',
        default: 'Point'
      },
      coordinates: [Number] // [longitude, latitude]
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  
  // Activity Log
  activities: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    action: {
      type: String,
      required: true
    },
    details: String,
    location: {
      type: {
        type: String,
        enum: 'Point',
        default: 'Point'
      },
      coordinates: [Number]
    },
    deviceInfo: {
      userAgent: String,
      ipAddress: String,
      deviceType: String
    },
    relatedEntity: {
      type: String,
      enum: ['trip', 'bus', 'passenger', 'ticket', 'route']
    },
    entityId: mongoose.Schema.Types.ObjectId
  }],
  
  // Performance Metrics
  performance: {
    totalTrips: {
      type: Number,
      default: 0
    },
    totalPassengers: {
      type: Number,
      default: 0
    },
    onTimePercentage: {
      type: Number,
      default: 0
    },
    customerRating: {
      type: Number,
      default: 0
    },
    complaints: {
      type: Number,
      default: 0
    },
    commendations: {
      type: Number,
      default: 0
    }
  },
  
  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['id-proof', 'address-proof', 'medical-certificate', 'training-certificate', 'other']
    },
    name: String,
    fileUrl: String,
    uploadDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: Date,
    status: {
      type: String,
      enum: ['valid', 'expired', 'expiring-soon'],
      default: 'valid'
    }
  }],
  
  // Emergency Contact
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    address: String
  },
  
  // Training & Certification
  training: [{
    courseName: String,
    completionDate: Date,
    expiryDate: Date,
    certificateUrl: String,
    score: Number,
    status: {
      type: String,
      enum: ['completed', 'in-progress', 'expired', 'required'],
      default: 'required'
    }
  }],
  
  // Leave Management
  leaves: [{
    type: {
      type: String,
      enum: ['casual', 'sick', 'annual', 'emergency', 'other']
    },
    startDate: Date,
    endDate: Date,
    reason: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    notes: String
  }],
  
  // Salary & Benefits
  salary: {
    basic: Number,
    allowances: Number,
    deductions: Number,
    netSalary: Number,
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      bankName: String
    }
  },
  
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
conductorSchema.index({ depotId: 1, status: 1 });
conductorSchema.index({ 'attendance.date': 1 });
conductorSchema.index({ 'currentDuty.status': 1 });
conductorSchema.index({ location: '2dsphere' });

// Virtual for full name
conductorSchema.virtual('fullName').get(function() {
  return this.name;
});

// Virtual for current duty status
conductorSchema.virtual('isOnDuty').get(function() {
  return this.currentDuty && this.currentDuty.status === 'in-progress';
});

// Virtual for attendance today
conductorSchema.virtual('todayAttendance').get(function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return this.attendance.find(a => a.date.getTime() === today.getTime());
});

// Pre-save middleware
conductorSchema.pre('save', function(next) {
  // Update net salary
  if (this.salary.basic) {
    this.salary.netSalary = this.salary.basic + this.salary.allowances - this.salary.deductions;
  }
  
  // Check for expiring documents
  this.documents.forEach(doc => {
    if (doc.expiryDate) {
      const daysUntilExpiry = Math.ceil((doc.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 0) {
        doc.status = 'expired';
      } else if (daysUntilExpiry <= 30) {
        doc.status = 'expiring-soon';
      } else {
        doc.status = 'valid';
      }
    }
  });
  
  next();
});

// Instance methods
conductorSchema.methods.markAttendance = function(status, location) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let attendanceRecord = this.attendance.find(a => a.date.getTime() === today.getTime());
  
  if (!attendanceRecord) {
    attendanceRecord = {
      date: today,
      status: status
    };
    this.attendance.push(attendanceRecord);
  }
  
  if (status === 'login') {
    attendanceRecord.loginTime = new Date();
    attendanceRecord.location = location;
  } else if (status === 'logout') {
    attendanceRecord.logoutTime = new Date();
  }
  
  return this.save();
};

conductorSchema.methods.startDuty = function(dutyId, tripId, busId) {
  this.currentDuty = {
    dutyId,
    tripId,
    busId,
    startTime: new Date(),
    status: 'started'
  };
  
  // Mark duty start in attendance
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let attendanceRecord = this.attendance.find(a => a.date.getTime() === today.getTime());
  
  if (attendanceRecord) {
    attendanceRecord.dutyStartTime = new Date();
  }
  
  return this.save();
};

conductorSchema.methods.endDuty = function() {
  if (this.currentDuty) {
    this.currentDuty.endTime = new Date();
    this.currentDuty.status = 'completed';
    
    // Calculate duty hours
    const dutyStart = this.currentDuty.startTime;
    const dutyEnd = this.currentDuty.endTime;
    const dutyHours = (dutyEnd - dutyStart) / (1000 * 60 * 60);
    
    // Update attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let attendanceRecord = this.attendance.find(a => a.date.getTime() === today.getTime());
    
    if (attendanceRecord) {
      attendanceRecord.dutyEndTime = dutyEnd;
      attendanceRecord.totalDutyHours = dutyHours;
      
      // Determine attendance status
      if (dutyHours >= 8) {
        attendanceRecord.status = 'present';
      } else if (dutyHours >= 4) {
        attendanceRecord.status = 'half-day';
      } else {
        attendanceRecord.status = 'absent';
      }
    }
    
    // Update performance metrics
    this.performance.totalTrips += 1;
    
    // Clear current duty
    this.currentDuty = null;
  }
  
  return this.save();
};

conductorSchema.methods.logActivity = function(action, details, location, relatedEntity, entityId) {
  this.activities.push({
    action,
    details,
    location,
    relatedEntity,
    entityId
  });
  
  return this.save();
};

// Static methods
conductorSchema.statics.findByDepot = function(depotId) {
  return this.find({ depotId, status: 'active' });
};

conductorSchema.statics.findAvailable = function(depotId) {
  return this.find({
    depotId,
    status: 'active',
    $or: [
      { 'currentDuty.status': { $ne: 'in-progress' } },
      { currentDuty: { $exists: false } }
    ]
  });
};

conductorSchema.statics.findOnDuty = function(depotId) {
  return this.find({
    depotId,
    status: 'active',
    'currentDuty.status': 'in-progress'
  });
};

module.exports = mongoose.model('Conductor', conductorSchema);
