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
  
  // Inform only once if no environment variable is set (quiet mode - no errorLogger)
  if (!envBase && !warnedBase && isDevelopment) {
    try { 
      // Use console.info instead of console.warn to avoid errorLogger catching it
      console.info('[apiFetch] Using default backend URL:', base);
    } catch {}
    warnedBase = true;
  }
  
  // Select appropriate token based on endpoint type
  const storedDepotToken = localStorage.getItem('depotToken');
  const storedUserToken = localStorage.getItem('token');
  const isDepotEndpoint =
    path.startsWith('/api/depot') ||
    path.startsWith('/api/admin/depots') ||
    path.includes('/api/depot/');

  // For depot-related APIs, prefer depotToken; for all others (vendor, passenger, admin, etc.) prefer regular token
  let token = isDepotEndpoint
    ? (storedDepotToken || storedUserToken)
    : (storedUserToken || storedDepotToken);
  
  // Clean token if it has Bearer prefix (shouldn't be stored with prefix)
  if (token && token.startsWith('Bearer ')) {
    token = token.replace('Bearer ', '').trim();
    // Update stored token without Bearer prefix
    if (localStorage.getItem('depotToken')) {
      localStorage.setItem('depotToken', token);
    } else if (localStorage.getItem('token')) {
      localStorage.setItem('token', token);
    }
  }
  
  // For admin endpoints, validate token before making request
  if (path.includes('/admin/') && !path.includes('/test-connection')) {
    if (!token || token.trim() === '') {
      if (!options.suppressError) {
        console.warn('⚠️ [apiFetch] No token found for admin endpoint:', path);
        console.warn('⚠️ [apiFetch] Available localStorage keys:', Object.keys(localStorage));
        localStorage.clear();
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
      }
      return {
        ok: false,
        status: 401,
        message: 'No authentication token found. Please log in.',
        data: null
      };
    }

    // Validate token
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        if (!options.suppressError) {
          console.warn('⚠️ [apiFetch] Invalid token format for admin endpoint:', path);
          localStorage.clear();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return {
          ok: false,
          status: 401,
          message: 'Invalid authentication token. Please log in again.',
          data: null
        };
      }

      const payload = JSON.parse(atob(parts[1]));
      
      // Check expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        if (!options.suppressError) {
          console.warn('⚠️ [apiFetch] Token expired for admin endpoint:', path);
          localStorage.clear();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return {
          ok: false,
          status: 401,
          message: 'Authentication token has expired. Please log in again.',
          data: null
        };
      }

      // Check admin role - be more flexible with role format
      let role = (payload.role || '').toLowerCase();
      // Handle uppercase roles from backend
      if (role === 'admin' || role === 'administrator' || payload.role?.toUpperCase() === 'ADMIN') {
        role = 'admin';
      }
      const allowedRoles = ['admin', 'administrator', 'depot_manager', 'depot_supervisor', 'depot_operator'];
      const roleUpper = String(payload.role || '').toUpperCase();
      const isDepotManager = roleUpper === 'DEPOT_MANAGER' || roleUpper === 'DEPOT_SUPERVISOR' || roleUpper === 'DEPOT_OPERATOR';
      const isAdmin = role === 'admin' || role === 'administrator' || roleUpper === 'ADMIN' || roleUpper === 'ADMINISTRATOR';
      
      if (!allowedRoles.includes(role) && !isAdmin && !isDepotManager) {
        // Don't suppress errors for role checks - always redirect
        console.warn('⚠️ [apiFetch] User does not have admin role:', payload.role, 'decoded role:', role, 'for endpoint:', path);
        localStorage.clear();
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
        return {
          ok: false,
          status: 403,
          message: 'You do not have permission to access this resource. Please log in with an admin account.',
          data: null
        };
      }

      // Log token status for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [apiFetch] Admin token validated:', {
          role: payload.role || role,
          decodedRole: role,
          email: payload.email || 'N/A',
          userId: payload.userId || 'N/A',
          endpoint: path,
          isAdmin: isAdmin,
          isDepotManager: isDepotManager
        });
      }
    } catch (e) {
      if (!options.suppressError) {
        console.error('❌ [apiFetch] Error validating token:', e);
        localStorage.clear();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      return {
        ok: false,
        status: 401,
        message: 'Invalid authentication token. Please log in again.',
        data: null
      };
    }
  }
  
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
  if (token && token.trim() !== '') {
    // Clean token and ensure Bearer prefix
    const cleanToken = token.replace('Bearer ', '').trim();
    const authHeader = `Bearer ${cleanToken}`;
    headers.set('Authorization', authHeader);
    
    // Log header for debugging (only in development)
    if (process.env.NODE_ENV === 'development' && path.includes('/admin/')) {
      try {
        const parts = cleanToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const isExpired = payload.exp && payload.exp * 1000 < Date.now();
          console.log('🔐 [apiFetch] Authorization header set:', {
            hasToken: true,
            tokenLength: cleanToken.length,
            tokenPreview: cleanToken.substring(0, 20) + '...',
            role: payload.role || 'N/A',
            email: payload.email || 'N/A',
            userId: payload.userId || 'N/A',
            expired: isExpired,
            endpoint: path,
            authHeader: authHeader.substring(0, 30) + '...'
          });
          
          if (isExpired) {
            console.error('❌ [apiFetch] Token is expired!');
          }
        } else {
          console.warn('⚠️ [apiFetch] Token format invalid - not a JWT:', {
            partsLength: parts.length,
            endpoint: path
          });
        }
      } catch (e) {
        console.error('❌ [apiFetch] Token decode failed:', e.message, {
          hasToken: true,
          tokenLength: cleanToken.length,
          endpoint: path
        });
      }
    }
  } else {
    // No token available
    if (path.includes('/admin/') && !options.suppressError) {
      console.error('❌ [apiFetch] Admin endpoint called without token:', path);
      console.error('❌ [apiFetch] localStorage check:', {
        hasToken: !!localStorage.getItem('token'),
        hasDepotToken: !!localStorage.getItem('depotToken'),
        allKeys: Object.keys(localStorage)
      });
    }
  }
  
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
    if (path.includes('/bookings') || path.includes('/booking')) {
      return 50000; // 50 seconds for bookings (can be large datasets)
    }
    if (path.includes('/students') || path.includes('/student')) {
      return 45000; // 45 seconds for students (can be large datasets)
    }
    if (path.includes('/admin/buses') || path.includes('/admin/routes') || path.includes('/admin/depots')) {
      return 40000; // 40 seconds for large lists
    }
    if (path.includes('/dashboard') || path.includes('/recent-activities')) {
      return 35000; // 35 seconds for dashboard endpoints
    }
    if (path.includes('/admin/') || path.includes('/depot/')) {
      return 30000; // 30 seconds for admin/depot endpoints (increased from 25)
    }
    if (path.includes('/auto-scheduler/') || path.includes('/bulk-scheduler/')) {
      return 90000; // 90 seconds for mass scheduling endpoints
    }
    return 15000; // 15 seconds for other endpoints (increased from 10)
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
    let normalizedPath = path;
    if (base.endsWith('/api') && path.startsWith('/api/')) {
      normalizedPath = path.replace(/^\/api/, '');
      console.log(`🔧 Normalized path: ${path} → ${normalizedPath}`);
    }
    const fullUrl = (base ? base : '') + normalizedPath;
    // Only log URL in development and for non-admin endpoints (to reduce noise)
    if (process.env.NODE_ENV === 'development' && !path.includes('/admin/dashboard') && !path.includes('/admin/recent-activities')) {
      console.log(`🌐 Full URL: ${fullUrl}`);
    }
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
      
      // Check if this is an expected 404 from a depot endpoint (optional endpoints)
      const isExpectedDepot404 = res.status === 404 && path.includes('/api/depot/') && (
        path.includes('/notifications') ||
        path.includes('/trips') ||
        path.includes('/crew/') ||
        path.includes('/maintenance/') ||
        path.includes('/fuel/') ||
        path.includes('/inventory') ||
        path.includes('/vendor/') ||
        path.includes('/complaints') ||
        path.includes('/concessions') ||
        path.includes('/reports/')
      );
      
      // Suppress 404 errors for vendor endpoints (routes may not be fully implemented yet)
      const isExpectedVendor404 = res.status === 404 && (
        path.includes('/api/vendor/') || 
        path.includes('/api/vendor?') ||
        path === '/api/vendor'
      );
      
      // Suppress 404 errors for admin product endpoints that might not exist
      const isExpectedAdminProduct404 = res.status === 404 && (
        path.includes('/api/products/admin/') ||
        path.includes('/api/cart/enhanced')
      );
      
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
        // Check if we should suppress logout (for dashboard calls or recent login)
        const suppressLogout = options.suppressLogout || 
                               options.suppressError ||
                               (sessionStorage.getItem('justLoggedIn') && 
                                (Date.now() - parseInt(sessionStorage.getItem('justLoggedIn'))) < 10000); // 10 seconds
        
        // For admin routes, always clear invalid tokens unless explicitly suppressed
        if (path.includes('/admin/')) {
          const token = localStorage.getItem('token') || localStorage.getItem('depotToken');
          if (token) {
            try {
              const parts = token.split('.');
              if (parts.length === 3) {
                const payload = JSON.parse(atob(parts[1]));
                // Check if token is expired or invalid role
                if (payload.exp && payload.exp * 1000 < Date.now()) {
                  console.warn('🔐 Admin token expired, clearing...');
                  localStorage.clear();
                } else {
                  const role = (payload.role || '').toLowerCase();
                  const allowedRoles = ['admin', 'administrator', 'depot_manager', 'depot_supervisor', 'depot_operator'];
                  if (!allowedRoles.includes(role)) {
                    console.warn('🔐 Admin token has invalid role:', role, 'clearing...');
                    localStorage.clear();
                  }
                }
              }
            } catch (e) {
              console.warn('🔐 Invalid admin token format, clearing...');
              localStorage.clear();
            }
          }
        }
        
        if (!suppressLogout) {
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
          // Only log once per error type to reduce noise
          if (process.env.NODE_ENV === 'development') {
            console.log('🔐 Authentication error suppressed (recent login or suppressLogout flag)');
          }
        }
      } else {
        // Suppress error handling for expected 404s on depot, vendor, and admin product endpoints
        // Allow callers to suppress global error handling for optional/non-critical calls
        if (!options.suppressError && !isExpectedDepot404 && !isExpectedVendor404 && !isExpectedAdminProduct404) {
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
        // Suppress duplicate error logging - errors are already logged by handleError
        handleError(timeoutError);
      }
      
      return { ok: false, status: 408, message: `Request timed out after ${timeout/1000} seconds`, data: null };
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


