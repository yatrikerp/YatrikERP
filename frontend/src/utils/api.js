import { handleError } from './errorHandler';
import { clearAllCaches } from './cacheManager';

// Cache for API responses to improve performance
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Request timeout configuration
const REQUEST_TIMEOUT = 30000; // 30 seconds for dashboard endpoints

let warnedBase = false;

export async function apiFetch(path, options = {}) {
  // Detect environment more accurately
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
  const isProduction = hostname.includes('yatrikerp.live') || hostname.includes('onrender.com');
  
  // Get base URL from environment variables with fallbacks
  let envBase = '';
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    envBase = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL || import.meta.env.PUBLIC_API_URL;
  }
  
  // Fallback to process.env for older React apps
  if (!envBase && typeof process !== 'undefined' && process.env) {
    envBase = process.env.REACT_APP_API_URL || process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Determine base URL
  let base = '';
  if (envBase) {
    base = envBase.replace(/\/$/, '');
  } else if (isDevelopment) {
    // Development: use proxy for same-origin requests or explicit localhost
    base = 'http://localhost:5000';
  } else if (isProduction) {
    // Production: use the Render backend
    base = 'https://yatrikerp.onrender.com';
  }
  
  // Final cleanup
  base = base.replace(/\/$/, '');
  
  // Warn only once if no environment variable is set
  if (!envBase && !warnedBase && isDevelopment) {
    try { 
      console.warn('[apiFetch] Using default backend URL:', base);
      console.warn('[apiFetch] To use a different backend, set VITE_BACKEND_URL in .env file');
    } catch {}
    warnedBase = true;
  }
  
  // Prefer depotToken when present (depot panel), fallback to regular token
  const token = localStorage.getItem('depotToken') || localStorage.getItem('token');
  
  // Create cache key
  const cacheKey = `${options.method || 'GET'}:${path}:${JSON.stringify(options.body || {})}`;
  
  // Check cache for GET requests
  if (options.method === 'GET' || !options.method) {
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
  
  // Add performance headers
  headers.set('X-Requested-With', 'XMLHttpRequest');
  
  // Dynamic timeout based on endpoint
  const getTimeout = (path) => {
    // Heavy admin lists can be slow on first load; allow more time
    if (path.includes('/admin/trips')) {
      return 60000; // 60 seconds for trips
    }
    if (path.includes('/admin/all-drivers') || path.includes('/admin/all-conductors') || path.includes('/admin/drivers') || path.includes('/admin/conductors')) {
      return 45000; // 45 seconds for driver/conductor lists (can be very large)
    }
    if (path.includes('/admin/buses') || path.includes('/admin/routes') || path.includes('/admin/depots')) {
      return 40000; // 40 seconds for large lists
    }
    if (path.includes('/dashboard') || path.includes('/recent-activities')) {
      return 30000; // 30 seconds for dashboard endpoints
    }
    if (path.includes('/admin/') || path.includes('/depot/')) {
      return 25000; // 25 seconds for admin/depot endpoints
    }
    if (path.includes('/auto-scheduler/') || path.includes('/bulk-scheduler/')) {
      return 90000; // 90 seconds for mass scheduling endpoints
    }
    return 10000; // 10 seconds for other endpoints
  };
  
  const timeout = options.timeout || getTimeout(path);
  
  let timeoutId;
  let controller;
  let abortedByTimeout = false;
  
  try {
    // Create abort controller for timeout
    controller = new AbortController();
    timeoutId = setTimeout(() => {
      if (controller && !controller.signal.aborted) {
        abortedByTimeout = true;
        controller.abort();
      }
    }, timeout);
    
    // Avoid double "/api" when base already ends with "/api" and path starts with "/api"
    const normalizedPath = (base.endsWith('/api') && path.startsWith('/api/'))
      ? path.replace(/^\/api/, '')
      : path;
    const fullUrl = (base ? base : '') + normalizedPath;
    const res = await fetch(fullUrl, { 
      ...options, 
      headers,
      signal: controller.signal
    });
    
    // Clear timeout on successful response
    if (timeoutId) clearTimeout(timeoutId);
    
    let data = null;
    try { 
      data = await res.json(); 
    } catch (_) {}
    
    if (!res.ok) {
      const message = (data && (data.message || data.error)) || res.statusText;
      
      // Create error object for consistent handling
      const error = {
        response: {
          status: res.status,
          data: data
        },
        message: message
      };
      
      // Handle authentication errors
      if (res.status === 401 || res.status === 403) {
        console.log('🔐 Authentication error detected, clearing all caches...');
        try {
          // Clear all caches on authentication error
          clearAllCaches().then(() => {
            console.log('✅ All caches cleared after authentication error');
          }).catch(err => {
            console.warn('⚠️ Error clearing caches after auth error:', err);
          });
        } catch {}
        // Show error message before redirect (unless suppressed)
        if (!options.suppressError) {
          handleError(error);
        }
        // Redirect to login
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        }
      } else {
        // Allow callers to suppress global error handling for optional/non-critical calls
        if (!options.suppressError) {
          handleError(error);
        }
      }
      
      return { ok: false, status: res.status, message, data };
    }
    
    const result = { ok: true, status: res.status, data };
    
    // Cache successful GET responses
    if (options.method === 'GET' || !options.method) {
      apiCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
    }
    
    return result;
  } catch (error) {
    // Always clear timeout on error
    if (timeoutId) clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      // Only show error for actual timeouts, not component unmounts
      if (abortedByTimeout && !options.suppressError) {
        const timeoutError = { 
          message: `Request timed out after ${timeout/1000} seconds. Please try again.`, 
          code: 'TIMEOUT' 
        };
        handleError(timeoutError);
      }
      
      return { ok: false, status: 408, message: 'Request timeout', data: null };
    }
    
    const networkError = { message: 'Network error. Please check your connection.', code: 'NETWORK_ERROR' };
    if (!options.suppressError) {
      handleError(networkError);
    }
    return { ok: false, status: 0, message: 'Network error', data: null };
  }
}

// Clear cache function
export function clearApiCache() {
  apiCache.clear();
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

// Run cleanup every minute
setInterval(cleanupApiCache, 60000);


