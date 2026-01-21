// Global Error Logger for Google Maps and other issues
class ErrorLogger {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.networkErrors = [];
    this.setupGlobalHandlers();
  }

  setupGlobalHandlers() {
    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.logError('Unhandled Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack || event.error,
        timestamp: new Date().toISOString()
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('Unhandled Promise Rejection', {
        reason: event.reason?.toString() || event.reason,
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Store original console methods to avoid circular reference
    this.originalConsoleError = console.error;
    this.originalConsoleWarn = console.warn;
    
    // Capture console errors
    console.error = (...args) => {
      const errorMessage = args.join(' ');
      
      // Ignore expected 404 errors from depot API endpoints
      const isDepot404 = errorMessage.includes('404') && 
                        (errorMessage.includes('/api/depot/') || 
                         errorMessage.includes('Failed to load resource'));
      
      // Ignore network errors for expected missing endpoints
      const isExpected404 = errorMessage.includes('404') && 
                           (errorMessage.includes('/api/depot/notifications') ||
                            errorMessage.includes('/api/depot/trips') ||
                            errorMessage.includes('/api/depot/crew/') ||
                            errorMessage.includes('/api/depot/maintenance/') ||
                            errorMessage.includes('/api/depot/fuel/') ||
                            errorMessage.includes('/api/depot/inventory') ||
                            errorMessage.includes('/api/depot/vendor/') ||
                            errorMessage.includes('/api/depot/complaints') ||
                            errorMessage.includes('/api/depot/concessions') ||
                            errorMessage.includes('/api/depot/reports/'));
      
      // Also ignore generic "Failed to load resource" messages for depot endpoints
      const isDepotResourceError = errorMessage.includes('Failed to load resource') &&
                                  (errorMessage.includes('/api/depot/') || 
                                   errorMessage.includes('localhost:5000/api/depot/'));
      
      if (!isDepot404 && !isExpected404 && !isDepotResourceError) {
        this.logError('Console Error', {
          message: errorMessage,
          timestamp: new Date().toISOString(),
          stack: new Error().stack
        });
      }
      // Always call original console.error but only log to errorLogger if not expected
      this.originalConsoleError.apply(console, args);
    };
    
    console.warn = (...args) => {
      this.logWarning('Console Warning', {
        message: args.join(' '),
        timestamp: new Date().toISOString(),
        stack: new Error().stack
      });
      this.originalConsoleWarn.apply(console, args);
    };

    // Capture fetch errors
    const originalFetch = window.fetch;
    window.fetch = (...args) => {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
      
      return originalFetch.apply(window, args)
        .then(response => {
          // Check for 404 on depot endpoints and suppress logging
          if (response.status === 404 && url.includes('/api/depot/')) {
            // Don't log expected 404s from depot endpoints
            return response;
          }
          return response;
        })
        .catch(error => {
          // Don't log expected AbortErrors (timeouts, component unmounts, etc.)
          if (error.name !== 'AbortError' && error.message !== 'signal is aborted without reason') {
            // Don't log 404 errors from depot endpoints (expected missing endpoints)
            const isDepot404 = url.includes('/api/depot/') && 
                             (error.message?.includes('404') || error.status === 404);
            
            if (!isDepot404) {
              this.logNetworkError('Fetch Error', {
                url: url,
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
              });
            }
          }
          throw error;
        });
    };
  }

  logError(type, details) {
    const error = {
      id: Date.now() + Math.random(),
      type,
      details,
      timestamp: new Date().toISOString()
    };
    this.errors.push(error);
    
    // Keep only last 50 errors
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(-50);
    }
    
    // Use original console.error to avoid circular reference
    this.originalConsoleError(`🚨 [ErrorLogger] ${type}:`, details);
  }

  logWarning(type, details) {
    const warning = {
      id: Date.now() + Math.random(),
      type,
      details,
      timestamp: new Date().toISOString()
    };
    this.warnings.push(warning);
    
    // Keep only last 50 warnings
    if (this.warnings.length > 50) {
      this.warnings = this.warnings.slice(-50);
    }
    
    // Use original console.warn to avoid circular reference
    this.originalConsoleWarn(`⚠️ [ErrorLogger] ${type}:`, details);
  }

  logNetworkError(type, details) {
    const networkError = {
      id: Date.now() + Math.random(),
      type,
      details,
      timestamp: new Date().toISOString()
    };
    this.networkErrors.push(networkError);
    
    // Keep only last 50 network errors
    if (this.networkErrors.length > 50) {
      this.networkErrors = this.networkErrors.slice(-50);
    }
    
    // Use original console.error to avoid circular reference
    this.originalConsoleError(`🌐 [ErrorLogger] ${type}:`, details);
  }

  getAllErrors() {
    return {
      errors: this.errors,
      warnings: this.warnings,
      networkErrors: this.networkErrors,
      summary: {
        totalErrors: this.errors.length,
        totalWarnings: this.warnings.length,
        totalNetworkErrors: this.networkErrors.length,
        lastError: this.errors[this.errors.length - 1],
        lastWarning: this.warnings[this.warnings.length - 1],
        lastNetworkError: this.networkErrors[this.networkErrors.length - 1]
      }
    };
  }

  clearAll() {
    this.errors = [];
    this.warnings = [];
    this.networkErrors = [];
  }

  // Google Maps specific error logging
  logGoogleMapsError(errorType, details) {
    this.logError(`Google Maps - ${errorType}`, {
      ...details,
      googleMapsAvailable: !!window.google,
      googleMapsLoaded: !!(window.google && window.google.maps),
      apiKeyPresent: !!(typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY)
    });
  }
}

// Create global instance
const errorLogger = new ErrorLogger();

// Make it available globally for debugging
window.errorLogger = errorLogger;

export default errorLogger;
