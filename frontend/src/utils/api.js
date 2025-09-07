import { handleError } from './errorHandler';
import { fetchInterceptors } from './fetchInterceptors';

// Cache for API responses to improve performance
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Request configuration
const REQUEST_TIMEOUT = 15000; // 15 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second base delay

// Request queue for rate limiting
const requestQueue = new Map();
const MAX_CONCURRENT_REQUESTS = 10;

let warnedBase = false;

// Enhanced fetch with retry logic and better error handling
export async function apiFetch(path, options = {}) {
  const base = process.env.REACT_APP_API_URL || '';
  if (!process.env.REACT_APP_API_URL && !warnedBase) {
    try { console.warn('[apiFetch] REACT_APP_API_URL not set; using relative URLs with Vite proxy'); } catch {}
    warnedBase = true;
  }

  // Rate limiting check
  const requestKey = `${options.method || 'GET'}:${path}`;
  if (requestQueue.has(requestKey)) {
    await requestQueue.get(requestKey);
  }

  return await fetchWithRetry(path, options, base, 0);
}

// Retry logic with exponential backoff
async function fetchWithRetry(path, options, base, attempt) {
  const token = localStorage.getItem('depotToken') || localStorage.getItem('token');
  const cacheKey = `${options.method || 'GET'}:${path}:${JSON.stringify(options.body || {})}`;
  
  // Check cache for GET requests
  if ((options.method === 'GET' || !options.method) && attempt === 0) {
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
  }
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);
  
  // Enhanced headers
  headers.set('X-Requested-With', 'XMLHttpRequest');
  headers.set('Accept', 'application/json');
  headers.set('Cache-Control', 'no-cache');
  
  // Add request ID for tracking
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  headers.set('X-Request-ID', requestId);
  
  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    // Add request to queue
    const requestPromise = makeRequest(base + path, { 
      ...options, 
      headers,
      signal: controller.signal
    });
    
    requestQueue.set(`${options.method || 'GET'}:${path}`, requestPromise);
    
    const res = await requestPromise;
    clearTimeout(timeoutId);
    requestQueue.delete(`${options.method || 'GET'}:${path}`);
    
    let data = null;
    const contentType = res.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try { 
        data = await res.json(); 
      } catch (parseError) {
        console.warn('Failed to parse JSON response:', parseError);
      }
    } else if (contentType && contentType.includes('text/')) {
      data = await res.text();
    }
    
    if (!res.ok) {
      const message = (data && (data.message || data.error)) || res.statusText;
      
      // Check if we should retry
      const shouldRetry = shouldRetryRequest(res.status, attempt);
      
      if (shouldRetry && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(2, attempt); // Exponential backoff
        console.log(`Retrying request in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(path, options, base, attempt + 1);
      }
      
      // Create error object for consistent handling
      const error = {
        response: {
          status: res.status,
          data: data
        },
        message: message,
        requestId: requestId
      };
      
      // Suppress noisy toast for backend API-only 404 catch-all on unknown endpoints
      const isApiOnlyCatchAll = res.status === 404 && (
        (data && (data.message || '')).toLowerCase().includes('api-only server') ||
        (data && (data.error || '')).toLowerCase().includes('api endpoint not found')
      );

      // Handle authentication errors
      if (res.status === 401 || res.status === 403) {
        try {
          localStorage.removeItem('depotToken');
          localStorage.removeItem('depotUser');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } catch {}
        handleError(error);
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        }
      } else if (!isApiOnlyCatchAll) {
        handleError(error);
      }
      
      return { ok: false, status: res.status, message, data, requestId };
    }
    
    const result = { ok: true, status: res.status, data, requestId };
    
    // Cache successful GET responses
    if (options.method === 'GET' || !options.method) {
      apiCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
    }
    
    return result;
  } catch (error) {
    requestQueue.delete(`${options.method || 'GET'}:${path}`);
    
    // Check if we should retry on network errors
    if (isRetryableError(error) && attempt < MAX_RETRIES) {
      const delay = RETRY_DELAY * Math.pow(2, attempt);
      console.log(`Retrying request in ${delay}ms due to network error (attempt ${attempt + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(path, options, base, attempt + 1);
    }
    
    if (error.name === 'AbortError') {
      const timeoutError = { message: 'Request timeout', code: 'TIMEOUT', requestId };
      handleError(timeoutError);
      return { ok: false, status: 408, message: 'Request timeout', data: null, requestId };
    }
    
    const networkError = { message: 'Network error', code: 'NETWORK_ERROR', requestId };
    handleError(networkError);
    return { ok: false, status: 0, message: 'Network error', data: null, requestId };
  }
}

// Make the actual fetch request with interceptors
async function makeRequest(url, options) {
  try {
    // Execute request interceptors
    const config = await fetchInterceptors.executeRequestInterceptors({
      url,
      ...options
    });

    // Make the actual request
    const response = await fetch(config.url, config);

    // Execute response interceptors
    const modifiedResponse = await fetchInterceptors.executeResponseInterceptors({
      ...response,
      config
    });

    return modifiedResponse;
  } catch (error) {
    // Execute error interceptors
    const modifiedError = await fetchInterceptors.executeErrorInterceptors(error);
    throw modifiedError;
  }
}

// Determine if a request should be retried based on status code
function shouldRetryRequest(status, attempt) {
  // Retry on server errors and some client errors
  return (
    status >= 500 || // Server errors
    status === 408 || // Request timeout
    status === 429 || // Too many requests
    (status >= 400 && status < 500 && attempt === 0) // Client errors on first attempt
  );
}

// Determine if an error is retryable
function isRetryableError(error) {
  return (
    error.name === 'TypeError' || // Network errors
    error.name === 'AbortError' || // Timeout errors
    error.message.includes('Failed to fetch') ||
    error.message.includes('NetworkError')
  );
}

// Enhanced API utilities
export function clearApiCache() {
  apiCache.clear();
  requestQueue.clear();
}

// Clear expired cache entries
export function cleanupApiCache() {
  const now = Date.now();
  for (const [key, value] of apiCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      apiCache.delete(key);
    }
  }
}

// Get cache statistics
export function getCacheStats() {
  return {
    cacheSize: apiCache.size,
    queueSize: requestQueue.size,
    cacheKeys: Array.from(apiCache.keys()),
    queueKeys: Array.from(requestQueue.keys())
  };
}

// Preload critical data
export async function preloadData(endpoints) {
  const promises = endpoints.map(endpoint => 
    apiFetch(endpoint).catch(error => {
      console.warn(`Failed to preload ${endpoint}:`, error);
      return null;
    })
  );
  
  return Promise.allSettled(promises);
}

// Batch requests
export async function batchRequests(requests) {
  const promises = requests.map(({ path, options }) => 
    apiFetch(path, options)
  );
  
  return Promise.allSettled(promises);
}

// Request interceptor for adding common headers
export function addRequestInterceptor(interceptor) {
  if (typeof interceptor === 'function') {
    // Store interceptor for use in apiFetch
    window.apiRequestInterceptor = interceptor;
  }
}

// Response interceptor for handling responses
export function addResponseInterceptor(interceptor) {
  if (typeof interceptor === 'function') {
    // Store interceptor for use in apiFetch
    window.apiResponseInterceptor = interceptor;
  }
}

// Health check function
export async function healthCheck() {
  try {
    const response = await apiFetch('/api/health', { 
      method: 'GET',
      timeout: 5000 // 5 second timeout for health checks
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Network status monitoring
export function getNetworkStatus() {
  return {
    online: navigator.onLine,
    connection: navigator.connection ? {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt
    } : null
  };
}

// Run cleanup every minute
setInterval(cleanupApiCache, 60000);

// Monitor network status
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Network connection restored');
    // Optionally retry failed requests
  });
  
  window.addEventListener('offline', () => {
    console.log('Network connection lost');
  });
}


