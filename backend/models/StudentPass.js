const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentPassSchema = new mongoose.Schema({
  // Authentication fields (for direct login)
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true,
    index: true
  },
  phone: {
    type: String,
    trim: true,
    sparse: true,
    index: true
  },
  password: {
    type: String,
    select: false // Don't return password by default
  },
  aadhaarNumber: {
    type: String,
    trim: true,
    sparse: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  
  // Reference to User (optional - for linked accounts)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    unique: true,
    sparse: true
  },
  
  // Section A: Personal Details
  personalDetails: {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required']
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: [true, 'Gender is required']
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      match: [/^[\+]?[0-9]{7,15}$/, 'Invalid mobile number format']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
    },
    otpVerified: {
      type: Boolean,
      default: false
    }
  },
  
  // Section B: Educational Details
  educationalDetails: {
    institutionName: {
      type: String,
      required: [true, 'Institution name is required'],
      trim: true
    },
    course: {
      type: String,
      required: [true, 'Course/Class is required'],
      trim: true
    },
    year: {
      type: String,
      trim: true
    },
    semester: {
      type: String,
      trim: true
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      trim: true,
      uppercase: true
    },
    registerNumber: {
      type: String,
      trim: true,
      uppercase: true
    }
  },
  
  // Section C: Travel Details
  travelDetails: {
    homeAddress: {
      type: String,
      required: [true, 'Home address is required'],
      trim: true
    },
    nearestBusStop: {
      type: String,
      required: [true, 'Nearest bus stop is required'],
      trim: true
    },
    destinationBusStop: {
      type: String,
      required: [true, 'Destination bus stop is required'],
      trim: true
    },
    routeNumber: {
      type: String,
      trim: true
    },
    passDuration: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly'],
      required: [true, 'Pass duration is required']
    }
  },
  
  // Section D: Document Upload
  documents: {
    studentIdCard: {
      url: String,
      uploadedAt: Date,
      verified: { type: Boolean, default: false }
    },
    bonafideCertificate: {
      url: String,
      uploadedAt: Date,
      verified: { type: Boolean, default: false }
    },
    addressProof: {
      url: String,
      uploadedAt: Date,
      verified: { type: Boolean, default: false }
    },
    photo: {
      url: String,
      uploadedAt: Date,
      verified: { type: Boolean, default: false }
    }
  },
  
  // Section E: Pass Status
  passStatus: {
    type: String,
    enum: ['applied', 'approved', 'rejected', 'expired'],
    default: 'applied'
  },
  approvalDate: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: String,
  
  // Pass validity
  validity: {
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: false
    }
  },
  
  // Digital Pass Details
  digitalPass: {
    qrCode: String,
    barcode: String,
    passNumber: {
      type: String,
      unique: true,
      sparse: true
    },
    generatedAt: Date
  },
  
  // Route Information
  assignedRoute: {
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route'
    },
    routeName: String,
    routeNumber: String
  },
  
  // Payment Information
  payment: {
    amount: Number,
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentDate: Date,
    transactionId: String,
    receiptUrl: String
  },
  
  // Renewal Information
  renewalHistory: [{
    previousEndDate: Date,
    renewedAt: Date,
    renewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    amount: Number
  }],
  
  // Notifications
  notifications: [{
    type: {
      type: String,
      enum: ['expiry_alert', 'route_change', 'admin_message', 'payment_reminder']
    },
    message: String,
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Admin Notes
  adminNotes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
studentPassSchema.index({ userId: 1 });
studentPassSchema.index({ 'educationalDetails.rollNumber': 1 });
studentPassSchema.index({ passStatus: 1 });
studentPassSchema.index({ 'digitalPass.passNumber': 1 });
studentPassSchema.index({ 'validity.endDate': 1 });

// Method to check if pass is expired
studentPassSchema.methods.isExpired = function() {
  if (!this.validity.endDate) return true;
  return new Date() > this.validity.endDate;
};

// Method to get remaining days
studentPassSchema.methods.getRemainingDays = function() {
  if (!this.validity.endDate) return 0;
  const now = new Date();
  const end = new Date(this.validity.endDate);
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

// Hash password before saving
studentPassSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
studentPassSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('StudentPass', studentPassSchema);

