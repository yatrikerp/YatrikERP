import { handleError } from './errorHandler';
import { clearAllCaches } from './cacheManager';

// Cache for API responses to improve performance
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Request timeout configuration
const REQUEST_TIMEOUT = 30000; // 30 seconds for dashboard endpoints

let warnedBase = false;

export async function apiFetch(path, options = {}) {
  const base = process.env.REACT_APP_API_URL || '';
  if (!process.env.REACT_APP_API_URL && !warnedBase) {
    // Helpful dev hint if env not configured
    try { console.warn('[apiFetch] REACT_APP_API_URL not set; using relative URLs with Vite proxy'); } catch {}
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
    if (path.includes('/admin/buses') || path.includes('/admin/routes') || path.includes('/admin/depots')) {
      return 40000; // 40 seconds for large lists
    }
    if (path.includes('/dashboard') || path.includes('/recent-activities')) {
      return 30000; // 30 seconds for dashboard endpoints
    }
    if (path.includes('/admin/') || path.includes('/depot/')) {
      return 20000; // 20 seconds for admin/depot endpoints
    }
    if (path.includes('/auto-scheduler/')) {
      return 90000; // 90 seconds for mass scheduling endpoints
    }
    return 10000; // 10 seconds for other endpoints
  };
  
  const timeout = options.timeout || getTimeout(path);
  
  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const res = await fetch(base + path, { 
      ...options, 
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
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
    if (error.name === 'AbortError') {
      const timeoutError = { 
        message: `Request timed out after ${timeout/1000} seconds. Please try again.`, 
        code: 'TIMEOUT' 
      };
      if (!options.suppressError) {
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


