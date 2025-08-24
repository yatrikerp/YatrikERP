const mongoose = require('mongoose');

const depotSchema = new mongoose.Schema({
  // Basic Depot Information
  depotCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  depotName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Location Information
  location: {
    address: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    pincode: {
      type: String,
      required: true,
      trim: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Contact Information
  contact: {
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    manager: {
      name: String,
      phone: String,
      email: String
    }
  },
  
  // Depot Capacity
  capacity: {
    totalBuses: {
      type: Number,
      required: true,
      min: 0
    },
    availableBuses: {
      type: Number,
      required: true,
      min: 0
    },
    maintenanceBuses: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Operating Hours
  operatingHours: {
    openTime: {
      type: String, // Format: "HH:MM"
      required: true
    },
    closeTime: {
      type: String, // Format: "HH:MM"
      required: true
    },
    workingDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
  },
  
  // Facilities
  facilities: [{
    type: String,
    enum: [
      'Fuel_Station',
      'Maintenance_Bay',
      'Washing_Bay',
      'Parking_Lot',
      'Driver_Rest_Room',
      'Canteen',
      'Security_Office',
      'Admin_Office',
      'Training_Room',
      'Spare_Parts_Store'
    ]
  }],
  
  // Depot Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'closed'],
    default: 'active'
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
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
depotSchema.index({ depotCode: 1 });
depotSchema.index({ 'location.city': 1 });
depotSchema.index({ 'location.state': 1 });
depotSchema.index({ status: 1 });
depotSchema.index({ isActive: 1 });

// Virtual for full address
depotSchema.virtual('fullAddress').get(function() {
  return `${this.location.address}, ${this.location.city}, ${this.location.state} - ${this.location.pincode}`;
});

// Virtual for available capacity percentage
depotSchema.virtual('capacityPercentage').get(function() {
  if (this.capacity.totalBuses === 0) return 0;
  return Math.round((this.capacity.availableBuses / this.capacity.totalBuses) * 100);
});

// Method to update bus count
depotSchema.methods.updateBusCount = function(type, count) {
  switch (type) {
    case 'available':
      this.capacity.availableBuses = Math.max(0, this.capacity.availableBuses + count);
      break;
    case 'maintenance':
      this.capacity.maintenanceBuses = Math.max(0, this.capacity.maintenanceBuses + count);
      break;
    case 'total':
      this.capacity.totalBuses = Math.max(0, this.capacity.totalBuses + count);
      break;
  }
  return this.save();
};

// Method to check if depot can accommodate more buses
depotSchema.methods.canAccommodateBuses = function(count) {
  return this.capacity.availableBuses + count <= this.capacity.totalBuses;
};

// Static method to find depots by city
depotSchema.statics.findByCity = function(city) {
  return this.find({
    'location.city': { $regex: city, $options: 'i' },
    isActive: true,
    status: 'active'
  });
};

// Static method to find depots with available capacity
depotSchema.statics.findWithAvailableCapacity = function(minCapacity = 0) {
  return this.find({
    'capacity.availableBuses': { $gte: minCapacity },
    isActive: true,
    status: 'active'
  });
};

const Depot = mongoose.model('Depot', depotSchema);

module.exports = Depot;


