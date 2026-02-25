const mongoose = require('mongoose');

/**
 * Monthly Payroll Model
 * Generated from attendance records
 * Matches Kerala RTC payroll structure
 */
const payrollMonthlySchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  staffType: {
    type: String,
    enum: ['driver', 'conductor'],
    required: true
  },
  depotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Depot',
    required: true,
    index: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true,
    min: 2020
  },
  // Attendance-based calculations
  totalDays: {
    type: Number,
    required: true,
    default: 0
  },
  presentDays: {
    type: Number,
    required: true,
    default: 0
  },
  absentDays: {
    type: Number,
    required: true,
    default: 0
  },
  leaveDays: {
    type: Number,
    required: true,
    default: 0
  },
  payableDays: {
    type: Number,
    required: true,
    default: 0
  },
  // Salary calculations
  perDayRate: {
    type: Number,
    required: true,
    min: 0
  },
  grossSalary: {
    type: Number,
    required: true,
    min: 0
  },
  deductions: {
    type: Number,
    default: 0,
    min: 0
  },
  netSalary: {
    type: Number,
    required: true,
    min: 0
  },
  // Status and tracking
  status: {
    type: String,
    enum: ['DRAFT', 'FINALIZED', 'PAID'],
    default: 'DRAFT'
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  finalizedAt: {
    type: Date,
    default: null
  },
  finalizedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Discrepancies and notes
  depotNotes: {
    type: String,
    default: null
  },
  adminNotes: {
    type: String,
    default: null
  },
  // Reference to attendance records used
  attendanceSummary: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Unique constraint: one payroll per staff per month per year
payrollMonthlySchema.index({ staffId: 1, month: 1, year: 1, depotId: 1 }, { unique: true });

// Indexes for efficient queries
payrollMonthlySchema.index({ depotId: 1, month: 1, year: 1 });
payrollMonthlySchema.index({ status: 1, month: 1, year: 1 });
payrollMonthlySchema.index({ generatedAt: -1 });

// Prevent modifications once finalized
payrollMonthlySchema.pre('save', function(next) {
  if (this.isModified() && this.status === 'FINALIZED' && !this.isNew) {
    return next(new Error('Finalized payroll cannot be modified. Create a new payroll cycle.'));
  }
  next();
});

module.exports = mongoose.model('PayrollMonthly', payrollMonthlySchema);
