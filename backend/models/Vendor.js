const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const vendorSchema = new mongoose.Schema({
  // Reference to User (optional for quick registration)
  // Note: Not unique to allow multiple vendors without userId
  // Omit this field completely during quick registration to avoid index conflicts
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
    // No default - will be undefined if not set, which sparse index will ignore
  },
  
  // Simple flat structure for quick registration (alternative to nested structure)
  companyName: {
    type: String,
    trim: true,
    sparse: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    unique: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format']
  },
  phone: {
    type: String,
    validate: {
      validator: function(v) {
        // Only validate if phone is provided
        if (!v || v === '') return true;
        return /^[\+]?[0-9]{7,15}$/.test(v);
      },
      message: 'Invalid phone number format (7-15 digits)'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  panNumber: {
    type: String,
    trim: true,
    uppercase: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'],
    sparse: true
  },
  companyType: {
    type: String,
    enum: ['manufacturer', 'supplier', 'service_provider', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended', 'active'],
    default: 'pending'
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  autoApproved: {
    type: Boolean,
    default: false
  },
  trustScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  complianceScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  deliveryReliabilityScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  
  // Account security
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  lastLogin: Date,
  
  // Section A: Business Details (for full registration)
  businessDetails: {
    vendorName: {
      type: String,
      trim: true
    },
    businessType: {
      type: String,
      enum: ['canteen', 'transport_partner', 'service_provider'],
    },
    registrationNumber: {
      type: String,
      trim: true
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST format']
    },
    businessAddress: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    pincode: {
      type: String,
      match: [/^[0-9]{6}$/, 'Invalid PIN code format']
    }
  },
  
  // Section B: Contact Details (for full registration)
  contactDetails: {
    authorizedPersonName: {
      type: String,
      trim: true
    },
    mobile: {
      type: String,
      match: [/^[\+]?[0-9]{7,15}$/, 'Invalid mobile number format']
    },
    otpVerified: {
      type: Boolean,
      default: false
    }
  },
  
  // Section C: Document Upload
  documents: {
    gstCertificate: {
      url: String,
      uploadedAt: Date,
      verified: { type: Boolean, default: false }
    },
    tradeLicense: {
      url: String,
      uploadedAt: Date,
      verified: { type: Boolean, default: false }
    },
    idProof: {
      url: String,
      uploadedAt: Date,
      verified: { type: Boolean, default: false }
    },
    bankCheque: {
      url: String,
      uploadedAt: Date,
      verified: { type: Boolean, default: false }
    }
  },
  
  // Section D: Approval Status
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  approvalDate: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: String,
  autoApproved: {
    type: Boolean,
    default: false
  },
  autoApprovalReason: String, // e.g., "PAN and GST numbers match"
  
  // Additional vendor information
  serviceAreas: [{
    type: String,
    trim: true
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  activeContracts: {
    type: Number,
    default: 0
  },
  
  // Compliance tracking
  complianceStatus: {
    documentsVerified: { type: Boolean, default: false },
    gstValid: { type: Boolean, default: false },
    panValid: { type: Boolean, default: false },
    lastVerified: Date
  },
  
  // Notes and remarks
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
// userId index - not unique, allows multiple vendors without userId
vendorSchema.index({ userId: 1 }, { sparse: true });
// Email must be unique
vendorSchema.index({ email: 1 }, { unique: true });
// PAN number index (sparse since it can be in nested structure)
vendorSchema.index({ panNumber: 1 }, { sparse: true });
vendorSchema.index({ 'businessDetails.panNumber': 1 }, { sparse: true });
vendorSchema.index({ 'businessDetails.gstNumber': 1 }, { sparse: true });
vendorSchema.index({ status: 1 });
vendorSchema.index({ approvalStatus: 1 });
vendorSchema.index({ 'contactDetails.email': 1 }, { sparse: true });

// Password hashing middleware
vendorSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 10
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
vendorSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if PAN and GST match (for auto-approval)
// GST format: XXAAAAA0000A1Z5 (15 chars)
// Positions 2-11: PAN (10 chars)
vendorSchema.methods.checkPanGstMatch = function() {
  if (!this.businessDetails.panNumber || !this.businessDetails.gstNumber) {
    return false;
  }
  
  // Validate GST length
  if (this.businessDetails.gstNumber.length !== 15) {
    return false;
  }
  
  // Extract PAN from GST (positions 2-11 = 10 characters)
  const gstPan = this.businessDetails.gstNumber.substring(2, 12).toUpperCase();
  const panNumber = this.businessDetails.panNumber.toUpperCase().trim();
  
  // Compare PAN numbers (both should be 10 characters)
  return gstPan === panNumber && panNumber.length === 10;
};

module.exports = mongoose.model('Vendor', vendorSchema);

