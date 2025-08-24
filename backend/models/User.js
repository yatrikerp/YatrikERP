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
    match: [/^[\+]?[0-9]{7,15}$/, 'Please enter a valid phone number (7-15 digits)']
  },
  password: {
    type: String,
    required: function() { return this.authProvider === 'local'; },
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // This means password won't be returned in queries by default
  },
  role: {
    type: String,
    enum: ['passenger', 'conductor', 'driver', 'depot_manager', 'admin'],
    default: 'passenger'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
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
userSchema.index({ depotId: 1 });
userSchema.index({ email: 1 }); // Add email index for faster login queries
userSchema.index({ status: 1 }); // Add status index for role-based filtering
userSchema.index({ 'providerIds.google': 1 }); // Add OAuth provider indexes
userSchema.index({ 'providerIds.twitter': 1 });
userSchema.index({ 'providerIds.microsoft': 1 });

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
