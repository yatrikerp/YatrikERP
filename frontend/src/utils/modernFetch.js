/**
 * Modern Fetch Wrapper with Advanced Features
 * Provides a more powerful and user-friendly fetch API
 */

import { apiFetch } from './api';
import { fetchInterceptors } from './fetchInterceptors';

/**
 * Modern Fetch Class
 * Provides a fluent API for making HTTP requests
 */
class ModernFetch {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
    this.defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 15000,
      retries: 3,
      retryDelay: 1000
    };
  }

  /**
   * Set base URL
   * @param {string} baseURL - Base URL for all requests
   * @returns {ModernFetch} This instance
   */
  setBaseURL(baseURL) {
    this.baseURL = baseURL;
    return this;
  }

  /**
   * Set default options
   * @param {Object} options - Default options
   * @returns {ModernFetch} This instance
   */
  setDefaults(options) {
    this.defaultOptions = { ...this.defaultOptions, ...options };
    return this;
  }

  /**
   * Add request interceptor
   * @param {Function} fulfilled - Success handler
   * @param {Function} rejected - Error handler
   * @returns {number} Interceptor ID
   */
  addRequestInterceptor(fulfilled, rejected) {
    return fetchInterceptors.request(fulfilled, rejected);
  }

  /**
   * Add response interceptor
   * @param {Function} fulfilled - Success handler
   * @param {Function} rejected - Error handler
   * @returns {number} Interceptor ID
   */
  addResponseInterceptor(fulfilled, rejected) {
    return fetchInterceptors.response(fulfilled, rejected);
  }

  /**
   * Add error interceptor
   * @param {Function} handler - Error handler
   * @returns {number} Interceptor ID
   */
  addErrorInterceptor(handler) {
    return fetchInterceptors.error(handler);
  }

  /**
   * Remove interceptor
   * @param {number} id - Interceptor ID
   */
  removeInterceptor(id) {
    fetchInterceptors.remove(id);
  }

  /**
   * Make a request
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise<Response>} Response object
   */
  async request(url, options = {}) {
    const fullURL = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    const mergedOptions = { ...this.defaultOptions, ...options };

    // Merge headers
    mergedOptions.headers = {
      ...this.defaultOptions.headers,
      ...mergedOptions.headers
    };

    return await apiFetch(fullURL, mergedOptions);
  }

  /**
   * GET request
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise<Response>} Response object
   */
  async get(url, options = {}) {
    return await this.request(url, { ...options, method: 'GET' });
  }

  /**
   * POST request
   * @param {string} url - Request URL
   * @param {Object} data - Request data
   * @param {Object} options - Request options
   * @returns {Promise<Response>} Response object
   */
  async post(url, data, options = {}) {
    return await this.request(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * PUT request
   * @param {string} url - Request URL
   * @param {Object} data - Request data
   * @param {Object} options - Request options
   * @returns {Promise<Response>} Response object
   */
  async put(url, data, options = {}) {
    return await this.request(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * PATCH request
   * @param {string} url - Request URL
   * @param {Object} data - Request data
   * @param {Object} options - Request options
   * @returns {Promise<Response>} Response object
   */
  async patch(url, data, options = {}) {
    return await this.request(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  /**
   * DELETE request
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise<Response>} Response object
   */
  async delete(url, options = {}) {
    return await this.request(url, { ...options, method: 'DELETE' });
  }

  /**
   * Upload file
   * @param {string} url - Request URL
   * @param {FormData} formData - Form data
   * @param {Object} options - Request options
   * @returns {Promise<Response>} Response object
   */
  async upload(url, formData, options = {}) {
    const uploadOptions = {
      ...options,
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let browser set it
        ...options.headers
      }
    };
    delete uploadOptions.headers['Content-Type'];
    
    return await this.request(url, uploadOptions);
  }

  /**
   * Download file
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise<Blob>} File blob
   */
  async download(url, options = {}) {
    const response = await this.request(url, {
      ...options,
      method: 'GET'
    });

    if (response.ok) {
      return response.data;
    }
    throw new Error(`Download failed: ${response.message}`);
  }

  /**
   * Stream data
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise<ReadableStream>} Stream object
   */
  async stream(url, options = {}) {
    const response = await fetch(`${this.baseURL}${url}`, {
      ...this.defaultOptions,
      ...options
    });

    if (!response.ok) {
      throw new Error(`Stream failed: ${response.statusText}`);
    }

    return response.body;
  }

  /**
   * Batch requests
   * @param {Array<Object>} requests - Array of request objects
   * @returns {Promise<Array>} Array of responses
   */
  async batch(requests) {
    const promises = requests.map(({ url, method = 'GET', data, options = {} }) => {
      const requestOptions = { ...options, method };
      if (data) {
        requestOptions.body = JSON.stringify(data);
      }
      return this.request(url, requestOptions);
    });

    return Promise.allSettled(promises);
  }

  /**
   * Parallel requests
   * @param {Array<Object>} requests - Array of request objects
   * @returns {Promise<Array>} Array of responses
   */
  async parallel(requests) {
    return this.batch(requests);
  }

  /**
   * Sequential requests
   * @param {Array<Object>} requests - Array of request objects
   * @returns {Promise<Array>} Array of responses
   */
  async sequential(requests) {
    const results = [];
    
    for (const { url, method = 'GET', data, options = {} } of requests) {
      const requestOptions = { ...options, method };
      if (data) {
        requestOptions.body = JSON.stringify(data);
      }
      
      try {
        const result = await this.request(url, requestOptions);
        results.push({ status: 'fulfilled', value: result });
      } catch (error) {
        results.push({ status: 'rejected', reason: error });
      }
    }
    
    return results;
  }

  /**
   * Polling request
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @param {number} interval - Polling interval in ms
   * @param {Function} condition - Condition to stop polling
   * @returns {Promise<Response>} Final response
   */
  async poll(url, options = {}, interval = 1000, condition = (response) => response.ok) {
    return new Promise((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        try {
          const response = await this.request(url, options);
          
          if (condition(response)) {
            clearInterval(pollInterval);
            resolve(response);
          }
        } catch (error) {
          clearInterval(pollInterval);
          reject(error);
        }
      }, interval);
    });
  }

  /**
   * Cancel all pending requests
   */
  cancelAll() {
    // This would need to be implemented with AbortController tracking
    console.warn('cancelAll not implemented yet');
  }
}

// Create default instance
const modernFetch = new ModernFetch(process.env.REACT_APP_API_URL || '');

// Export both the class and default instance
export { ModernFetch, modernFetch };
export default modernFetch;

// Convenience functions
export const {
  get,
  post,
  put,
  patch,
  delete: del,
  upload,
  download,
  stream,
  batch,
  parallel,
  sequential,
  poll
} = modernFetch;

// Export interceptor functions
export const {
  addRequestInterceptor,
  addResponseInterceptor,
  addErrorInterceptor,
  removeInterceptor
} = modernFetch;
