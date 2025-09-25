import axios from 'axios';
import { clearAllCaches } from './cacheManager';

const baseURL = process.env.REACT_APP_API_URL || '';

const http = axios.create({
  baseURL,
  headers: {
    'X-Requested-With': 'XMLHttpRequest'
  },
  timeout: 10000
});

http.interceptors.request.use((config) => {
  const depotToken = typeof window !== 'undefined' ? localStorage.getItem('depotToken') : null;
  const token = depotToken || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    // Basic auth error handling and redirect
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      console.log('🔐 Authentication error detected in HTTP interceptor, clearing all caches...');
      try {
        // Clear all caches on authentication error
        clearAllCaches().then(() => {
          console.log('✅ All caches cleared after HTTP authentication error');
        }).catch(err => {
          console.warn('⚠️ Error clearing caches after HTTP auth error:', err);
        });
      } catch {}
      if (typeof window !== 'undefined') {
        setTimeout(() => (window.location.href = '/login'), 1000);
      }
    }
    return Promise.reject(error);
  }
);

export default http;


