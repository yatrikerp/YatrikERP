const mongoose = require('mongoose');

const depotSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 2,
    maxlength: 10
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  address: {
    street: {
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
      trim: true,
      match: /^[1-9][0-9]{5}$/
    },
    coordinates: {
      lat: {
        type: Number,
        min: -90,
        max: 90
      },
      lng: {
        type: Number,
        min: -180,
        max: 180
      }
    }
  },
  contact: {
    phone: {
      type: String,
      required: true,
      trim: true,
      match: /^[6-9]\d{9}$/
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
  },
  manager: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  capacity: {
    buses: {
      type: Number,
      default: 0,
      min: 0
    },
    staff: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  facilities: [{
    type: String,
    enum: ['parking', 'maintenance', 'fuel', 'canteen', 'restroom', 'wifi']
  }],
  operatingHours: {
    open: {
      type: String,
      default: '06:00',
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    close: {
      type: String,
      default: '22:00',
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    }
  }
}, {
  timestamps: true
});

// Pre-save middleware to handle validation errors gracefully
depotSchema.pre('save', function(next) {
  // Ensure required fields are present
  if (!this.code || !this.name || !this.contact?.phone) {
    return next(new Error('Missing required fields: code, name, and phone are required'));
  }
  
  // Validate phone format
  if (this.contact.phone && !/^[6-9]\d{9}$/.test(this.contact.phone)) {
    return next(new Error('Invalid phone number format. Must be 10 digits starting with 6-9'));
  }
  
  // Validate pincode format
  if (this.address?.pincode && !/^[1-9][0-9]{5}$/.test(this.address.pincode)) {
    return next(new Error('Invalid pincode format. Must be 6 digits'));
  }
  
  next();
});

// Indexes
// code index is already defined as unique in schema
depotSchema.index({ status: 1 });
depotSchema.index({ 'address.city': 1, 'address.state': 1 });

module.exports = mongoose.model('Depot', depotSchema);


