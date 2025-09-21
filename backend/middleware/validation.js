// Comprehensive Backend Validation Middleware
// Following latest industry standards and best practices

const { body, validationResult } = require('express-validator');

// User validation rules
const userValidations = {
  register: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Must be a valid email address'),
    
    body('phone')
      .matches(/^(\+91)?[6-9]\d{9}$/)
      .withMessage('Phone number must be a valid 10-digit Indian mobile number'),
    
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    
    body('role')
      .optional()
      .isIn(['passenger', 'conductor', 'driver', 'depot_manager', 'admin'])
      .withMessage('Invalid role specified'),
    
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      next();
    }
  ],
  
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Must be a valid email address'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      next();
    }
  ]
};

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Validation middleware for conductor data
const validateConductorData = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('phone')
    .matches(/^(\+91)?[6-9]\d{9}$/)
    .withMessage('Phone number must be a valid 10-digit Indian mobile number'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email address'),
  
  body('employeeCode')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Employee code must be between 3 and 20 characters'),
  
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters, alphanumeric and underscore only'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  
  body('depotId')
    .isMongoId()
    .withMessage('Valid depot ID is required'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  
  body('emergencyContact.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Emergency contact name must be between 2 and 100 characters'),
  
  body('emergencyContact.phone')
    .optional()
    .matches(/^(\+91)?[6-9]\d{9}$/)
    .withMessage('Emergency contact phone must be a valid 10-digit Indian mobile number'),
  
  body('emergencyContact.relationship')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Emergency contact relationship must not exceed 50 characters'),
  
  body('salary.basic')
    .optional()
    .isNumeric()
    .withMessage('Basic salary must be a number'),
  
  body('salary.allowances')
    .optional()
    .isNumeric()
    .withMessage('Allowances must be a number'),
  
  body('salary.bonus')
    .optional()
    .isNumeric()
    .withMessage('Bonus must be a number'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// Validation middleware for driver data
const validateDriverData = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('phone')
    .matches(/^(\+91)?[6-9]\d{9}$/)
    .withMessage('Phone number must be a valid 10-digit Indian mobile number'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email address'),
  
  body('employeeCode')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Employee code must be between 3 and 20 characters'),
  
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters, alphanumeric and underscore only'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  
  body('depotId')
    .isMongoId()
    .withMessage('Valid depot ID is required'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  
  body('drivingLicense.licenseNumber')
    .trim()
    .isLength({ min: 10, max: 20 })
    .withMessage('License number must be between 10 and 20 characters'),
  
  body('drivingLicense.type')
    .isIn(['LMV', 'MCWG', 'MCWOG', 'HMV', 'HGV', 'HPMV', 'HGMV', 'HMV-TR', 'HMV-TR-ARTICULATED'])
    .withMessage('Invalid driving license type'),
  
  body('drivingLicense.issueDate')
    .isISO8601()
    .withMessage('License issue date must be a valid date'),
  
  body('drivingLicense.expiryDate')
    .isISO8601()
    .withMessage('License expiry date must be a valid date'),
  
  body('drivingLicense.issuingAuthority')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Issuing authority must be between 2 and 100 characters'),
  
  body('emergencyContact.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Emergency contact name must be between 2 and 100 characters'),
  
  body('emergencyContact.phone')
    .optional()
    .matches(/^(\+91)?[6-9]\d{9}$/)
    .withMessage('Emergency contact phone must be a valid 10-digit Indian mobile number'),
  
  body('emergencyContact.relationship')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Emergency contact relationship must not exceed 50 characters'),
  
  body('salary.basic')
    .optional()
    .isNumeric()
    .withMessage('Basic salary must be a number'),
  
  body('salary.allowances')
    .optional()
    .isNumeric()
    .withMessage('Allowances must be a number'),
  
  body('salary.bonus')
    .optional()
    .isNumeric()
    .withMessage('Bonus must be a number'),
  
  body('performance.totalDistance')
    .optional()
    .isNumeric()
    .withMessage('Total distance must be a number'),
  
  body('performance.totalHours')
    .optional()
    .isNumeric()
    .withMessage('Total hours must be a number'),
  
  body('performance.fuelEfficiency')
    .optional()
    .isNumeric()
    .withMessage('Fuel efficiency must be a number'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// Validation middleware for duty data
const validateDutyData = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Duty title must be between 5 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('type')
    .isIn(['regular', 'overtime', 'holiday', 'emergency', 'training'])
    .withMessage('Invalid duty type'),
  
  body('depotId')
    .isMongoId()
    .withMessage('Valid depot ID is required'),
  
  body('driverId')
    .isMongoId()
    .withMessage('Valid driver ID is required'),
  
  body('conductorId')
    .optional()
    .isMongoId()
    .withMessage('Valid conductor ID is required'),
  
  body('busId')
    .isMongoId()
    .withMessage('Valid bus ID is required'),
  
  body('tripId')
    .isMongoId()
    .withMessage('Valid trip ID is required'),
  
  body('routeId')
    .isMongoId()
    .withMessage('Valid route ID is required'),
  
  body('scheduledStartTime')
    .isISO8601()
    .withMessage('Scheduled start time must be a valid date'),
  
  body('scheduledEndTime')
    .isISO8601()
    .withMessage('Scheduled end time must be a valid date'),
  
  body('specialInstructions')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Special instructions must not exceed 1000 characters'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// Validation middleware for attendance data
const validateAttendanceData = [
  body('date')
    .isISO8601()
    .withMessage('Date must be a valid date'),
  
  body('status')
    .isIn(['present', 'absent', 'late', 'half-day', 'leave'])
    .withMessage('Invalid attendance status'),
  
  body('checkInTime')
    .optional()
    .isISO8601()
    .withMessage('Check-in time must be a valid date'),
  
  body('checkOutTime')
    .optional()
    .isISO8601()
    .withMessage('Check-out time must be a valid date'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Location must not exceed 200 characters'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// Validation middleware for activity data
const validateActivityData = [
  body('action')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Action must be between 2 and 50 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Description must be between 5 and 500 characters'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Location must not exceed 200 characters'),
  
  body('category')
    .isIn(['system', 'duty', 'attendance', 'profile', 'safety', 'incident'])
    .withMessage('Invalid activity category'),
  
  body('relatedEntity')
    .optional()
    .isMongoId()
    .withMessage('Valid related entity ID is required'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

module.exports = {
  userValidations,
  handleValidationErrors,
  validateConductorData,
  validateDriverData,
  validateDutyData,
  validateAttendanceData,
  validateActivityData
};
