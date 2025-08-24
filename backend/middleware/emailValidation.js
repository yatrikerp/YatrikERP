/**
 * Email Pattern Validation Middleware
 * Enforces role-based email patterns for user registration and updates
 */

const ROLE_EMAIL_PATTERNS = {
  admin: {
    pattern: /^admin@yatrik\.com$/,
    description: 'Admin must use admin@yatrik.com'
  },
  conductor: {
    pattern: /^[a-zA-Z]+-[a-zA-Z]+@yatrik\.com$/,
    description: 'Conductor: {Cname}-{depot}@yatrik.com (e.g., rajesh-mumbai@yatrik.com)'
  },
  driver: {
    pattern: /^[a-zA-Z]+-[a-zA-Z]+@yatrik\.com$/,
    description: 'Driver: {Dname}-{depot}@yatrik.com (e.g., suresh-mumbai@yatrik.com)'
  },
  depot_manager: {
    pattern: /^[a-zA-Z]+-depot@yatrik\.com$/,
    description: 'Depot Manager: {place}-depot@yatrik.com (e.g., mumbai-depot@yatrik.com)'
  },
  passenger: {
    pattern: /^[a-zA-Z0-9._%+-]+@gmail\.com$/,
    description: 'Passenger: {name}@gmail.com (Gmail addresses only)'
  }
};

/**
 * Validate email format based on user role
 */
function validateEmailForRole(email, role) {
  if (!email || !role) {
    return { valid: false, error: 'Email and role are required' };
  }

  const roleConfig = ROLE_EMAIL_PATTERNS[role.toUpperCase()];
  if (!roleConfig) {
    return { valid: false, error: `Invalid role: ${role}` };
  }

  const isValid = roleConfig.pattern.test(email);
  return {
    valid: isValid,
    error: isValid ? null : roleConfig.description
  };
}

/**
 * Middleware to validate email patterns during registration
 */
function validateRegistrationEmail(req, res, next) {
  const { email, role } = req.body;
  
  if (!email || !role) {
    return res.status(400).json({
      success: false,
      message: 'Email and role are required'
    });
  }

  const validation = validateEmailForRole(email, role);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: `Invalid email format for ${role} role`,
      details: validation.error,
      expectedFormat: ROLE_EMAIL_PATTERNS[role.toUpperCase()]?.description
    });
  }

  next();
}

/**
 * Middleware to validate email patterns during profile updates
 */
function validateProfileUpdateEmail(req, res, next) {
  const { email, role } = req.body;
  
  // If email is not being updated, skip validation
  if (!email) {
    return next();
  }

  // If role is not provided, get it from the authenticated user
  const userRole = role || req.user?.role;
  if (!userRole) {
    return res.status(400).json({
      success: false,
      message: 'Role is required for email validation'
    });
  }

  const validation = validateEmailForRole(email, userRole);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: `Invalid email format for ${userRole} role`,
      details: validation.error,
      expectedFormat: ROLE_EMAIL_PATTERNS[userRole.toUpperCase()]?.description
    });
  }

  next();
}

/**
 * Get email pattern information for a specific role
 */
function getEmailPatternInfo(role) {
  const roleConfig = ROLE_EMAIL_PATTERNS[role?.toUpperCase()];
  if (!roleConfig) {
    return null;
  }

  return {
    role: role.toUpperCase(),
    pattern: roleConfig.pattern.toString(),
    description: roleConfig.description,
    examples: getExamplesForRole(role.toUpperCase())
  };
}

/**
 * Get example emails for a specific role
 */
function getExamplesForRole(role) {
  const examples = {
    ADMIN: ['admin@yatrik.com'],
    CONDUCTOR: ['rajesh-mumbai@yatrik.com', 'amit-delhi@yatrik.com'],
    DRIVER: ['suresh-mumbai@yatrik.com', 'ramesh-delhi@yatrik.com'],
    DEPOT_MANAGER: ['mumbai-depot@yatrik.com', 'delhi-depot@yatrik.com'],
    PASSENGER: ['john.doe@gmail.com', 'jane.smith@gmail.com']
  };

  return examples[role] || [];
}

/**
 * Get all email patterns for documentation
 */
function getAllEmailPatterns() {
  return Object.entries(ROLE_EMAIL_PATTERNS).map(([role, config]) => ({
    role,
    pattern: config.pattern.toString(),
    description: config.description,
    examples: getExamplesForRole(role)
  }));
}

module.exports = {
  validateEmailForRole,
  validateRegistrationEmail,
  validateProfileUpdateEmail,
  getEmailPatternInfo,
  getAllEmailPatterns,
  ROLE_EMAIL_PATTERNS
};
