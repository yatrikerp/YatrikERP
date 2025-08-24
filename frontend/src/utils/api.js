// Cache for API responses to improve performance
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Request timeout configuration
const REQUEST_TIMEOUT = 10000; // 10 seconds

let warnedBase = false;

export async function apiFetch(path, options = {}) {
  const base = process.env.REACT_APP_API_URL || '';
  if (!process.env.REACT_APP_API_URL && !warnedBase) {
    // Helpful dev hint if env not configured
    try { console.warn('[apiFetch] REACT_APP_API_URL not set; using relative URLs with Vite proxy'); } catch {}
    warnedBase = true;
  }
  const token = localStorage.getItem('token');
  
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
  
  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
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
      return { ok: false, status: 408, message: 'Request timeout', data: null };
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


