const mongoose = require('mongoose');

const sparePartSchema = new mongoose.Schema({
  // Basic Information
  partName: {
    type: String,
    required: [true, 'Part name is required'],
    trim: true,
    index: true
  },
  partNumber: {
    type: String,
    required: [true, 'Part number is required'],
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Categorization
  category: {
    type: String,
    required: true,
    enum: [
      'engine', 'transmission', 'brakes', 'suspension', 'electrical',
      'body', 'interior', 'exterior', 'tires', 'battery', 'filters',
      'fluids', 'belts', 'hoses', 'lights', 'mirrors', 'wipers', 'other'
    ],
    index: true
  },
  subCategory: {
    type: String,
    trim: true
  },
  
  // Vehicle Compatibility
  compatibleVehicles: [{
    make: String,      // e.g., "Tata", "Ashok Leyland"
    model: String,      // e.g., "Leyland", "Marcopolo"
    year: String,      // e.g., "2020-2023"
    busType: String    // e.g., "AC", "Non-AC", "Sleeper"
  }],
  
  // Pricing
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Inventory Management
  stock: {
    current: {
      type: Number,
      default: 0,
      min: 0
    },
    minimum: {
      type: Number,
      default: 0,
      min: 0
    },
    maximum: {
      type: Number,
      default: 1000,
      min: 0
    },
    unit: {
      type: String,
      default: 'units',
      enum: ['units', 'kg', 'liters', 'meters', 'pieces']
    }
  },
  
  // Supplier Information
  preferredVendors: [{
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    vendorName: String,
    price: Number,
    leadTime: Number, // days
    rating: {
      type: Number,
      min: 0,
      max: 5
    }
  }],
  
  // Images & Media
  images: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  // Specifications
  specifications: {
    brand: String,
    manufacturer: String,
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        default: 'cm'
      }
    },
    material: String,
    warranty: {
      period: Number, // months
      type: {
        type: String,
        enum: ['manufacturer', 'vendor', 'none']
      }
    }
  },
  
  // Status & Management
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued', 'out_of_stock'],
    default: 'active',
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Procurement Details
  procurementDetails: {
    reorderPoint: {
      type: Number,
      default: 10
    },
    reorderQuantity: {
      type: Number,
      default: 50
    },
    averageLeadTime: {
      type: Number,
      default: 7 // days
    },
    lastOrderedDate: Date,
    lastReceivedDate: Date
  },
  
  // Usage Tracking
  usageStats: {
    totalOrdered: {
      type: Number,
      default: 0
    },
    totalUsed: {
      type: Number,
      default: 0
    },
    lastUsedDate: Date,
    lastUsedIn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceLog'
    }
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String
}, {
  timestamps: true
});

// Indexes for performance
sparePartSchema.index({ partNumber: 1 });
sparePartSchema.index({ category: 1, status: 1 });
sparePartSchema.index({ 'compatibleVehicles.make': 1, 'compatibleVehicles.model': 1 });
sparePartSchema.index({ status: 1, isActive: 1 });

// Virtual for stock status
sparePartSchema.virtual('stockStatus').get(function() {
  if (this.stock.current <= 0) return 'out_of_stock';
  if (this.stock.current <= this.stock.minimum) return 'low_stock';
  if (this.stock.current >= this.stock.maximum) return 'overstocked';
  return 'in_stock';
});

// Method to check if reorder is needed
sparePartSchema.methods.needsReorder = function() {
  return this.stock.current <= this.procurementDetails.reorderPoint;
};

module.exports = mongoose.model('SparePart', sparePartSchema);
