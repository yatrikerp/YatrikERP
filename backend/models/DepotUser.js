const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const depotUserSchema = new mongoose.Schema({
  // Basic user information
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  // Depot association
  depotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Depot',
    required: true
  },
  
  depotCode: {
    type: String,
    required: true,
    trim: true
  },
  
  depotName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Role and permissions
  role: {
    type: String,
    enum: ['depot_manager', 'depot_supervisor', 'depot_operator'],
    default: 'depot_manager'
  },
  
  permissions: [{
    type: String,
    enum: [
      'manage_buses',
      'view_buses', 
      'manage_routes',
      'view_routes',
      'manage_schedules',
      'view_schedules',
      'manage_staff',
      'view_staff',
      'view_reports',
      'manage_depot_info',
      'view_depot_info'
    ]
  }],
  
  // Status and metadata
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  
  lastLogin: {
    type: Date,
    default: null
  },
  
  loginAttempts: {
    type: Number,
    default: 0
  },
  
  lockUntil: {
    type: Date,
    default: null
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
depotUserSchema.index({ username: 1 });
depotUserSchema.index({ email: 1 });
depotUserSchema.index({ depotId: 1 });
depotUserSchema.index({ status: 1 });
depotUserSchema.index({ role: 1 });

// Virtual for full name
depotUserSchema.virtual('fullName').get(function() {
  return this.username;
});

// Virtual for isLocked
depotUserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
depotUserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update timestamp
depotUserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to compare password
depotUserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to increment login attempts
depotUserSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
depotUserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Static method to find by credentials
depotUserSchema.statics.findByCredentials = async function(username, password) {
  const user = await this.findOne({ 
    $or: [{ username }, { email: username }],
    status: 'active'
  });
  
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  if (user.isLocked) {
    throw new Error('Account is temporarily locked due to too many failed login attempts');
  }
  
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incLoginAttempts();
    throw new Error('Invalid credentials');
  }
  
  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }
  
  // Update last login
  await user.updateOne({ lastLogin: Date.now() });
  
  return user;
};

// Static method to create depot user
depotUserSchema.statics.createDepotUser = async function(userData) {
  try {
    const user = new this(userData);
    await user.save();
    return user;
  } catch (error) {
    throw new Error(`Failed to create depot user: ${error.message}`);
  }
};

// Method to update permissions
depotUserSchema.methods.updatePermissions = async function(newPermissions) {
  this.permissions = newPermissions;
  return this.save();
};

// Method to change password
depotUserSchema.methods.changePassword = async function(newPassword) {
  this.password = newPassword;
  return this.save();
};

// Method to suspend user
depotUserSchema.methods.suspend = async function() {
  this.status = 'suspended';
  return this.save();
};

// Method to activate user
depotUserSchema.methods.activate = async function() {
  this.status = 'active';
  return this.save();
};

// Method to deactivate user
depotUserSchema.methods.deactivate = async function() {
  this.status = 'inactive';
  return this.save();
};

const DepotUser = mongoose.model('DepotUser', depotUserSchema);

module.exports = DepotUser;
