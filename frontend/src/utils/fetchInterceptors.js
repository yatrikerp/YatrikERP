/**
 * Modern Fetch Interceptors System
 * Provides request/response interceptors similar to Axios
 */

class FetchInterceptors {
  constructor() {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.errorInterceptors = [];
  }

  /**
   * Add request interceptor
   * @param {Function} fulfilled - Success handler
   * @param {Function} rejected - Error handler
   * @returns {number} Interceptor ID
   */
  request(fulfilled, rejected) {
    const id = Date.now() + Math.random();
    this.requestInterceptors.push({ id, fulfilled, rejected });
    return id;
  }

  /**
   * Add response interceptor
   * @param {Function} fulfilled - Success handler
   * @param {Function} rejected - Error handler
   * @returns {number} Interceptor ID
   */
  response(fulfilled, rejected) {
    const id = Date.now() + Math.random();
    this.responseInterceptors.push({ id, fulfilled, rejected });
    return id;
  }

  /**
   * Add error interceptor
   * @param {Function} handler - Error handler
   * @returns {number} Interceptor ID
   */
  error(handler) {
    const id = Date.now() + Math.random();
    this.errorInterceptors.push({ id, handler });
    return id;
  }

  /**
   * Remove interceptor by ID
   * @param {number} id - Interceptor ID
   */
  remove(id) {
    this.requestInterceptors = this.requestInterceptors.filter(i => i.id !== id);
    this.responseInterceptors = this.responseInterceptors.filter(i => i.id !== id);
    this.errorInterceptors = this.errorInterceptors.filter(i => i.id !== id);
  }

  /**
   * Clear all interceptors
   */
  clear() {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.errorInterceptors = [];
  }

  /**
   * Execute request interceptors
   * @param {Object} config - Request configuration
   * @returns {Promise<Object>} Modified configuration
   */
  async executeRequestInterceptors(config) {
    let modifiedConfig = { ...config };

    for (const interceptor of this.requestInterceptors) {
      try {
        if (interceptor.fulfilled) {
          modifiedConfig = await interceptor.fulfilled(modifiedConfig);
        }
      } catch (error) {
        if (interceptor.rejected) {
          throw await interceptor.rejected(error);
        }
        throw error;
      }
    }

    return modifiedConfig;
  }

  /**
   * Execute response interceptors
   * @param {Object} response - Response object
   * @returns {Promise<Object>} Modified response
   */
  async executeResponseInterceptors(response) {
    let modifiedResponse = { ...response };

    for (const interceptor of this.responseInterceptors) {
      try {
        if (interceptor.fulfilled) {
          modifiedResponse = await interceptor.fulfilled(modifiedResponse);
        }
      } catch (error) {
        if (interceptor.rejected) {
          throw await interceptor.rejected(error);
        }
        throw error;
      }
    }

    return modifiedResponse;
  }

  /**
   * Execute error interceptors
   * @param {Error} error - Error object
   * @returns {Promise<Error>} Modified error
   */
  async executeErrorInterceptors(error) {
    let modifiedError = error;

    for (const interceptor of this.errorInterceptors) {
      try {
        modifiedError = await interceptor.handler(modifiedError);
      } catch (interceptorError) {
        console.error('Error in error interceptor:', interceptorError);
      }
    }

    return modifiedError;
  }
}

// Create global instance
const fetchInterceptors = new FetchInterceptors();

// Common interceptors
const commonInterceptors = {
  /**
   * Add authentication token to requests
   */
  authInterceptor: fetchInterceptors.request((config) => {
    const token = localStorage.getItem('depotToken') || localStorage.getItem('token');
    if (token && !config.headers?.Authorization) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`
      };
    }
    return config;
  }),

  /**
   * Add request timestamp
   */
  timestampInterceptor: fetchInterceptors.request((config) => {
    config.headers = {
      ...config.headers,
      'X-Request-Time': new Date().toISOString()
    };
    return config;
  }),

  /**
   * Log requests in development
   */
  loggingInterceptor: fetchInterceptors.request((config) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 ${config.method || 'GET'} ${config.url}`, config);
    }
    return config;
  }),

  /**
   * Handle response errors globally
   */
  errorHandlerInterceptor: fetchInterceptors.response(
    (response) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ ${response.status} ${response.url}`, response);
      }
      return response;
    },
    (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ Request failed:`, error);
      }
      throw error;
    }
  ),

  /**
   * Handle authentication errors
   */
  authErrorInterceptor: fetchInterceptors.error(async (error) => {
    if (error.status === 401 || error.status === 403) {
      // Clear stored tokens
      localStorage.removeItem('depotToken');
      localStorage.removeItem('depotUser');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login if not already there
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return error;
  }),

  /**
   * Handle network errors
   */
  networkErrorInterceptor: fetchInterceptors.error(async (error) => {
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      // Show offline indicator
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('network-error', { 
          detail: { error, timestamp: Date.now() } 
        });
        window.dispatchEvent(event);
      }
    }
    return error;
  }),

  /**
   * Handle rate limiting
   */
  rateLimitInterceptor: fetchInterceptors.error(async (error) => {
    if (error.status === 429) {
      // Show rate limit message
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('rate-limit', { 
          detail: { error, retryAfter: error.headers?.['retry-after'] } 
        });
        window.dispatchEvent(event);
      }
    }
    return error;
  })
};

// Performance monitoring interceptor
const performanceInterceptor = fetchInterceptors.request((config) => {
  config.startTime = performance.now();
  return config;
});

fetchInterceptors.response((response) => {
  if (response.config?.startTime) {
    const duration = performance.now() - response.config.startTime;
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ Request took ${duration.toFixed(2)}ms`);
    }
    
    // Track slow requests
    if (duration > 5000) {
      console.warn(`🐌 Slow request detected: ${duration.toFixed(2)}ms`);
    }
  }
  return response;
});

// Export the interceptor instance and common interceptors
export { fetchInterceptors, commonInterceptors };

// Export utility functions
export const interceptorUtils = {
  /**
   * Create a retry interceptor
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} delay - Delay between retries
   * @returns {Function} Retry interceptor
   */
  createRetryInterceptor(maxRetries = 3, delay = 1000) {
    return fetchInterceptors.response(
      (response) => response,
      async (error) => {
        if (error.config && error.config.retryCount < maxRetries) {
          error.config.retryCount = (error.config.retryCount || 0) + 1;
          
          await new Promise(resolve => 
            setTimeout(resolve, delay * Math.pow(2, error.config.retryCount - 1))
          );
          
          // Retry the request
          return fetch(error.config.url, error.config);
        }
        throw error;
      }
    );
  },

  /**
   * Create a cache interceptor
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Function} Cache interceptor
   */
  createCacheInterceptor(ttl = 300000) { // 5 minutes default
    const cache = new Map();
    
    return fetchInterceptors.request((config) => {
      if (config.method === 'GET' || !config.method) {
        const cacheKey = `${config.method || 'GET'}:${config.url}:${JSON.stringify(config.body || {})}`;
        const cached = cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < ttl) {
          return Promise.resolve(cached.data);
        }
      }
      return config;
    });
  },

  /**
   * Create a timeout interceptor
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Function} Timeout interceptor
   */
  createTimeoutInterceptor(timeout = 10000) {
    return fetchInterceptors.request((config) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      config.signal = controller.signal;
      config.timeoutId = timeoutId;
      
      return config;
    });
  }
};

export default fetchInterceptors;
