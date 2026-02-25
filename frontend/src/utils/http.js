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
    // Basic auth error handling
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      // ABSOLUTE RULE: NEVER auto-logout ANY user - ALL users should ONLY logout when they click logout button
      // This applies to all roles: admin, depot_manager, vendor, passenger, driver, conductor, student, etc.
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 HTTP interceptor: Authentication error detected, but auto-logout is disabled for all users');
      }
      // Just return the error without any logout or redirect
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default http;


