const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: function() { return this.authProvider === 'local'; },
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: function() { return this.authProvider === 'local'; },
    match: [/^[+]?[0-9]{7,15}$/, 'Please enter a valid phone number (7-15 digits)']
  },
  password: {
    type: String,
    required: function() { return this.authProvider === 'local'; },
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // This means password won't be returned in queries by default
  },
  role: {
    type: String,
    enum: ['passenger', 'conductor', 'driver', 'depot_manager', 'admin', 'support_agent', 'data_collector', 'vendor', 'student'],
    default: 'passenger'
  },
  roleType: {
    type: String,
    enum: ['internal', 'external'],
    default: function() {
      // Auto-determine roleType based on role
      const internalRoles = ['admin', 'depot_manager', 'conductor', 'driver', 'support_agent', 'data_collector'];
      return internalRoles.includes(this.role) ? 'internal' : 'external';
    }
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'suspended', 'inactive'],
    default: 'active'
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  depotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Depot',
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  roleHistory: [{
    from: {
      type: String,
      required: true
    },
    to: {
      type: String,
      required: true
    },
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    at: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      required: true,
      trim: true
    }
  }],
  profilePicture: {
    type: String,
    default: ''
  },
  // Passenger specific fields
  passengerDetails: {
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    }
  },
  // Staff specific fields
  staffDetails: {
    employeeId: String,
    department: String,
    joiningDate: Date,
    salary: Number,
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  // Wallet for passengers
  wallet: {
    balance: {
      type: Number,
      default: 0
    },
    transactions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    }]
  },
  // Vendor specific fields (for external vendor users)
  vendorDetails: {
    companyName: String,
    companyType: {
      type: String,
      enum: ['fuel', 'spare_parts', 'maintenance', 'cleaning', 'other']
    },
    panNumber: {
      type: String,
      uppercase: true,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format']
    },
    gstNumber: String,
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      bankName: String
    },
    trustScore: { type: Number, default: 50, min: 0, max: 100 },
    complianceScore: { type: Number, default: 50, min: 0, max: 100 }
  },
  // Student specific fields (for external student users)
  studentDetails: {
    aadhaarNumber: {
      type: String,
      match: [/^[0-9]{12}$/, 'Invalid Aadhaar number']
    },
    dateOfBirth: Date,
    institution: {
      name: String,
      type: {
        type: String,
        enum: ['school', 'college', 'university', 'other']
      },
      registrationNumber: String
    },
    course: {
      name: String,
      year: String,
      department: String
    },
    passType: {
      type: String,
      enum: ['monthly', 'student_concession', 'senior_citizen', 'annual']
    },
    passNumber: String,
    validityPeriod: {
      startDate: Date,
      endDate: Date
    },
    eligibilityStatus: {
      type: String,
      enum: ['approved', 'pending', 'rejected'],
      default: 'pending'
    }
  },
  // Authentication
  authProvider: {
    type: String,
    enum: ['local', 'google', 'twitter', 'microsoft'],
    default: 'local'
  },
  providerIds: {
    google: { type: String },
    twitter: { type: String },
    microsoft: { type: String }
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  // Password reset fields
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, {
  timestamps: true
});

// Indexes
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ roleType: 1 });
userSchema.index({ depotId: 1 });
userSchema.index({ email: 1 }, { unique: true }); // Unique email index for faster login queries
userSchema.index({ status: 1 }); // Add status index for role-based filtering
userSchema.index({ 'providerIds.google': 1 }); // Add OAuth provider indexes
userSchema.index({ 'providerIds.twitter': 1 });
userSchema.index({ 'providerIds.microsoft': 1 });
userSchema.index({ 'vendorDetails.panNumber': 1 }, { sparse: true }); // Vendor PAN index
userSchema.index({ 'studentDetails.aadhaarNumber': 1 }, { sparse: true }); // Student Aadhaar index

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10); // Reduced from 12 to 10 for better performance
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
userSchema.methods.incLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

module.exports = mongoose.model('User', userSchema);
