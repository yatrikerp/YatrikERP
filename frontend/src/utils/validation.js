// Comprehensive Validation Utility for Yatrik ERP
// Following latest industry standards and best practices

// Email validation patterns for different roles
export const ROLE_EMAIL_PATTERNS = {
  admin: {
    pattern: /^admin@yatrik\.com$/,
    description: 'Admin must use admin@yatrik.com',
    test: (email) => email === 'admin@yatrik.com'
  },
  conductor: {
    pattern: /^[a-zA-Z]+-[a-zA-Z]+@yatrik\.com$/,
    description: 'Conductor: {Cname}-{depot}@yatrik.com',
    test: (email) => /^[a-zA-Z]+-[a-zA-Z]+@yatrik\.com$/.test(email)
  },
  driver: {
    pattern: /^[a-zA-Z]+-[a-zA-Z]+@yatrik\.com$/,
    description: 'Driver: {Dname}-{depot}@yatrik.com',
    test: (email) => /^[a-zA-Z]+-[a-zA-Z]+@yatrik\.com$/.test(email)
  },
  depot_manager: {
    pattern: /^[a-zA-Z]+-depot@yatrik\.com$/,
    description: 'Depot Manager: {place}-depot@yatrik.com',
    test: (email) => /^[a-zA-Z]+-depot@yatrik\.com$/.test(email)
  },
  passenger: {
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    description: 'Passenger: Any valid email format',
    test: (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
  }
};

// Phone number validation - Indian mobile format
export const PHONE_VALIDATION = {
  pattern: /^\+91[6-9][0-9]{9}$/,
  minLength: 13, // +91 + 10 digits
  maxLength: 13,
  description: 'Mobile number must be in format (+91) followed by 10 digits starting with 6-9',
  test: (phone) => {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return /^\+91[6-9][0-9]{9}$/.test(cleanPhone);
  }
};

// Password validation
export const PASSWORD_VALIDATION = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  description: 'Password must be 8-128 characters with uppercase, lowercase, numbers, and special characters',
  test: (password) => {
    if (password.length < 8 || password.length > 128) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
    return true;
  }
};

// Name validation
export const NAME_VALIDATION = {
  minLength: 2,
  maxLength: 50,
  pattern: /^[a-zA-Z\s\-'\.]+$/,
  description: 'Name must be 2-50 characters, letters, spaces, hyphens, apostrophes, and periods only'
};

// Real-time validation functions
export const validateField = (fieldName, value) => {
  const errors = [];
  
  switch (fieldName) {
    case 'email':
      if (!value.trim()) {
        errors.push('Email is required');
      } else if (!ROLE_EMAIL_PATTERNS.passenger.test(value)) {
        errors.push('Please enter a valid email address');
      }
      break;
      
    case 'phone':
      if (!value.trim()) {
        errors.push('Phone number is required');
      } else if (!PHONE_VALIDATION.test(value)) {
        errors.push('Mobile number must be in format (+91) followed by 10 digits starting with 6-9');
      }
      break;
      
    case 'password':
      if (!value.trim()) {
        errors.push('Password is required');
      } else if (!PASSWORD_VALIDATION.test(value)) {
        errors.push(PASSWORD_VALIDATION.description);
      }
      break;
      
    case 'name':
      if (!value.trim()) {
        errors.push('Name is required');
      } else if (!NAME_VALIDATION.pattern.test(value)) {
        errors.push(NAME_VALIDATION.description);
      }
      break;
  }
  
  return errors;
};

// Role-based email validation
export const validateRoleEmail = (email, role) => {
  if (!role || !ROLE_EMAIL_PATTERNS[role]) {
    return { isValid: false, message: 'Invalid role specified' };
  }
  
  const pattern = ROLE_EMAIL_PATTERNS[role];
  const isValid = pattern.test(email);
  
  return {
    isValid,
    message: isValid ? 'Valid email for role' : pattern.description
  };
};

export default {
  ROLE_EMAIL_PATTERNS,
  PHONE_VALIDATION,
  PASSWORD_VALIDATION,
  NAME_VALIDATION,
  validateField,
  validateRoleEmail
};
