import toast from 'react-hot-toast';

// Error types and their corresponding messages
const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  CONNECTION_REFUSED: 'Unable to connect to server. Please try again later.',
  TIMEOUT: 'Request timed out. Please try again.',
  
  // Authentication errors
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. You do not have permission for this action.',
  TOKEN_EXPIRED: 'Your session has expired. Please login again.',
  
  // Validation errors
  VALIDATION_ERROR: 'Please check your input and try again.',
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PHONE: 'Please enter a valid phone number.',
  INVALID_DATE: 'Please enter a valid date.',
  INVALID_NUMBER: 'Please enter a valid number.',
  
  // Server errors
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  INTERNAL_ERROR: 'Internal server error. Please contact support.',
  DATABASE_ERROR: 'Database error occurred. Please try again.',
  
  // Business logic errors
  DUPLICATE_ENTRY: 'This entry already exists.',
  NOT_FOUND: 'The requested resource was not found.',
  INSUFFICIENT_PERMISSIONS: 'You do not have sufficient permissions.',
  INVALID_OPERATION: 'This operation is not allowed.',
  
  // File upload errors
  FILE_TOO_LARGE: 'File size is too large. Please choose a smaller file.',
  INVALID_FILE_TYPE: 'Invalid file type. Please choose a supported file format.',
  UPLOAD_FAILED: 'File upload failed. Please try again.',
  
  // Form specific errors
  FORM_INCOMPLETE: 'Please fill in all required fields.',
  FORM_INVALID: 'Please correct the errors in the form.',
  SAVE_FAILED: 'Failed to save data. Please try again.',
  UPDATE_FAILED: 'Failed to update data. Please try again.',
  DELETE_FAILED: 'Failed to delete data. Please try again.',
  
  // Bus management specific
  BUS_NOT_FOUND: 'Bus not found.',
  DRIVER_NOT_AVAILABLE: 'Selected driver is not available.',
  CONDUCTOR_NOT_AVAILABLE: 'Selected conductor is not available.',
  DEPOT_NOT_FOUND: 'Depot not found.',
  ROUTE_NOT_FOUND: 'Route not found.',
  BUS_ALREADY_EXISTS: 'Bus with this number already exists.',
  
  // User management specific
  USER_NOT_FOUND: 'User not found.',
  USER_ALREADY_EXISTS: 'User with this email already exists.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  
  // Generic fallback
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
};

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Toast configuration based on error severity
const getToastConfig = (severity) => {
  const baseConfig = {
    duration: 4000,
    position: 'top-right',
  };

  switch (severity) {
    case ERROR_SEVERITY.CRITICAL:
      return {
        ...baseConfig,
        duration: 8000,
        style: {
          background: '#dc2626',
          color: '#fff',
          fontWeight: 'bold'
        }
      };
    case ERROR_SEVERITY.HIGH:
      return {
        ...baseConfig,
        duration: 6000,
        style: {
          background: '#ea580c',
          color: '#fff',
          fontWeight: '600'
        }
      };
    case ERROR_SEVERITY.MEDIUM:
      return {
        ...baseConfig,
        duration: 4000,
        style: {
          background: '#d97706',
          color: '#fff'
        }
      };
    case ERROR_SEVERITY.LOW:
    default:
      return {
        ...baseConfig,
        duration: 3000,
        style: {
          background: '#6b7280',
          color: '#fff'
        }
      };
  }
};

// Parse error from different sources
const parseError = (error) => {
  // If it's already a parsed error object
  if (error && typeof error === 'object' && error.message && error.severity) {
    return error;
  }

  // Parse axios error
  if (error?.response) {
    const status = error.response.status;
    const data = error.response.data;
    
    let message = ERROR_MESSAGES.SERVER_ERROR;
    let severity = ERROR_SEVERITY.MEDIUM;
    
    switch (status) {
      case 400:
        message = data?.message || data?.error || ERROR_MESSAGES.VALIDATION_ERROR;
        severity = ERROR_SEVERITY.LOW;
        break;
      case 401:
        message = ERROR_MESSAGES.UNAUTHORIZED;
        severity = ERROR_SEVERITY.HIGH;
        break;
      case 403:
        message = ERROR_MESSAGES.FORBIDDEN;
        severity = ERROR_SEVERITY.HIGH;
        break;
      case 404:
        message = data?.message || ERROR_MESSAGES.NOT_FOUND;
        severity = ERROR_SEVERITY.MEDIUM;
        break;
      case 409:
        message = data?.message || ERROR_MESSAGES.DUPLICATE_ENTRY;
        severity = ERROR_SEVERITY.MEDIUM;
        break;
      case 422:
        message = data?.message || ERROR_MESSAGES.VALIDATION_ERROR;
        severity = ERROR_SEVERITY.LOW;
        break;
      case 500:
        message = data?.message || ERROR_MESSAGES.INTERNAL_ERROR;
        severity = ERROR_SEVERITY.CRITICAL;
        break;
      default:
        message = data?.message || ERROR_MESSAGES.SERVER_ERROR;
        severity = ERROR_SEVERITY.MEDIUM;
    }
    
    return { message, severity, status, details: data };
  }
  
  // Parse network error
  if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
    return {
      message: ERROR_MESSAGES.NETWORK_ERROR,
      severity: ERROR_SEVERITY.HIGH,
      details: error
    };
  }
  
  // Parse timeout error
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return {
      message: ERROR_MESSAGES.TIMEOUT,
      severity: ERROR_SEVERITY.MEDIUM,
      details: error
    };
  }
  
  // Parse generic error
  if (error?.message) {
    return {
      message: error.message,
      severity: ERROR_MESSAGES[error.message] ? ERROR_SEVERITY.LOW : ERROR_SEVERITY.MEDIUM,
      details: error
    };
  }
  
  // Fallback
  return {
    message: ERROR_MESSAGES.UNKNOWN_ERROR,
    severity: ERROR_SEVERITY.MEDIUM,
    details: error
  };
};

// Main error handler function
export const handleError = (error, customMessage = null) => {
  const parsedError = parseError(error);
  const message = customMessage || parsedError.message;
  const severity = parsedError.severity;
  
  // Log error for debugging
  console.error('Error handled:', {
    original: error,
    parsed: parsedError,
    message,
    severity
  });
  
  // Show toast notification
  const toastConfig = getToastConfig(severity);
  toast.error(message, toastConfig);
  
  return parsedError;
};

// Success handler
export const handleSuccess = (message, duration = 3000) => {
  toast.success(message, {
    duration,
    position: 'top-right',
    style: {
      background: '#059669',
      color: '#fff'
    }
  });
};

// Warning handler
export const handleWarning = (message, duration = 4000) => {
  toast(message, {
    duration,
    position: 'top-right',
    icon: '⚠️',
    style: {
      background: '#d97706',
      color: '#fff'
    }
  });
};

// Info handler
export const handleInfo = (message, duration = 3000) => {
  toast(message, {
    duration,
    position: 'top-right',
    icon: 'ℹ️',
    style: {
      background: '#2563eb',
      color: '#fff'
    }
  });
};

// Form validation error handler
export const handleFormError = (errors, formRef = null) => {
  if (Array.isArray(errors)) {
    errors.forEach(error => {
      handleError(error, ERROR_MESSAGES.VALIDATION_ERROR);
    });
  } else if (typeof errors === 'object') {
    Object.entries(errors).forEach(([field, message]) => {
      handleError(new Error(message), `${field}: ${message}`);
    });
  } else {
    handleError(errors, ERROR_MESSAGES.FORM_INVALID);
  }
  
  // Focus on first error field if form ref is provided
  if (formRef && formRef.current) {
    const firstErrorField = formRef.current.querySelector('[aria-invalid="true"]');
    if (firstErrorField) {
      firstErrorField.focus();
    }
  }
};

// API error handler wrapper
export const withErrorHandling = (apiCall, customErrorMessage = null) => {
  return async (...args) => {
    try {
      const result = await apiCall(...args);
      return result;
    } catch (error) {
      handleError(error, customErrorMessage);
      throw error; // Re-throw to allow calling code to handle if needed
    }
  };
};

// Form submission wrapper
export const withFormErrorHandling = (submitFunction, formRef = null) => {
  return async (formData, ...args) => {
    try {
      const result = await submitFunction(formData, ...args);
      handleSuccess('Operation completed successfully!');
      return result;
    } catch (error) {
      handleFormError(error, formRef);
      throw error;
    }
  };
};

// Export error messages for custom use
export { ERROR_MESSAGES };
