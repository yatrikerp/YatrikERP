// Comprehensive Backend Validation Middleware
// Following latest industry standards and best practices

const { body, validationResult, param, query } = require('express-validator');

// Common validation rules
const commonValidations = {
  // Name validation
  name: body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s\-'\.]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, apostrophes, and periods'),

  // Email validation
  email: body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),

  // Phone validation
  phone: body('phone')
    .trim()
    .matches(/^[\+]?[0-9]{7,15}$/)
    .withMessage('Phone number must be 7-15 digits, optionally starting with +'),

  // Password validation
  password: body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  // Role validation
  role: body('role')
    .isIn(['passenger', 'conductor', 'driver', 'depot_manager', 'admin'])
    .withMessage('Invalid role selected'),

  // ID validation
  id: param('id')
    .isMongoId()
    .withMessage('Invalid ID format')
};

// User-specific validations
const userValidations = {
  // Registration validation
  register: [
    commonValidations.name,
    commonValidations.email,
    commonValidations.phone,
    commonValidations.password,
    commonValidations.role,
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords do not match');
        }
        return true;
      })
  ],

  // Login validation
  login: [
    commonValidations.email,
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ]
};

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

module.exports = {
  commonValidations,
  userValidations,
  handleValidationErrors
};
