/**
 * Comprehensive Cache Management Utility
 * Handles all types of caching and storage clearing for the Yatrik ERP application
 */

import { clearApiCache } from './api';

/**
 * Clear all application caches and storage
 * This function should be called during logout to ensure complete cleanup
 */
export const clearAllCaches = async () => {
  try {
    console.log('🧹 Starting comprehensive cache clearing...');

    // 1. Clear API cache (in-memory cache for API responses)
    clearApiCache();
    console.log('✅ API cache cleared');

    // 2. Clear localStorage (authentication tokens, user data, etc.)
    const localStorageKeys = [
      'token',
      'user', 
      'depotToken',
      'depotUser',
      'depotInfo',
      'currentDutyId',
      'passenger_notifications',
      'location_permission',
      'location_settings',
      'app_settings',
      'user_preferences',
      'dashboard_settings',
      'theme_preferences',
      'language_settings',
      'notification_settings',
      'search_history',
      'recent_searches',
      'favorite_routes',
      'bookmark_data',
      'trip_history',
      'booking_cache',
      'route_cache',
      'depot_cache',
      'bus_cache',
      'driver_cache',
      'conductor_cache',
      'admin_cache',
      'analytics_cache',
      'performance_cache',
      'error_logs',
      'debug_data'
    ];

    localStorageKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove localStorage key: ${key}`, error);
      }
    });
    console.log('✅ localStorage cleared');

    // 3. Clear sessionStorage (session-specific data)
    try {
      sessionStorage.clear();
      console.log('✅ sessionStorage cleared');
    } catch (error) {
      console.warn('Failed to clear sessionStorage:', error);
    }

    // 4. Clear IndexedDB (if any exists)
    try {
      if ('indexedDB' in window) {
        // Clear any IndexedDB databases that might exist
        const databases = ['YatrikERP', 'yatrik_erp', 'app_cache', 'offline_data'];
        for (const dbName of databases) {
          try {
            const deleteRequest = indexedDB.deleteDatabase(dbName);
            deleteRequest.onsuccess = () => console.log(`✅ IndexedDB database ${dbName} deleted`);
            deleteRequest.onerror = () => console.warn(`Failed to delete IndexedDB database ${dbName}`);
          } catch (error) {
            console.warn(`Error deleting IndexedDB database ${dbName}:`, error);
          }
        }
      }
    } catch (error) {
      console.warn('Error clearing IndexedDB:', error);
    }

    // 5. Clear WebSQL (legacy browser storage)
    try {
      if ('openDatabase' in window) {
        // WebSQL is deprecated but still exists in some browsers
        const databases = ['YatrikERP', 'yatrik_erp', 'app_cache'];
        for (const dbName of databases) {
          try {
            const db = openDatabase(dbName, '', '', 0);
            if (db) {
              db.transaction((tx) => {
                tx.executeSql('DROP TABLE IF EXISTS cache');
                tx.executeSql('DROP TABLE IF EXISTS user_data');
                tx.executeSql('DROP TABLE IF EXISTS settings');
              });
            }
          } catch (error) {
            console.warn(`Error clearing WebSQL database ${dbName}:`, error);
          }
        }
      }
    } catch (error) {
      console.warn('Error clearing WebSQL:', error);
    }

    // 6. Clear Cache API (Service Worker caches)
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const deletePromises = cacheNames.map(cacheName => {
          console.log(`🗑️ Deleting cache: ${cacheName}`);
          return caches.delete(cacheName);
        });
        await Promise.all(deletePromises);
        console.log('✅ Cache API cleared');
      }
    } catch (error) {
      console.warn('Error clearing Cache API:', error);
    }

    // 7. Clear cookies (if any authentication cookies exist)
    try {
      const cookies = document.cookie.split(';');
      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        // Clear cookies related to the application
        if (name.includes('yatrik') || name.includes('erp') || name.includes('auth') || name.includes('token')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
        }
      });
      console.log('✅ Cookies cleared');
    } catch (error) {
      console.warn('Error clearing cookies:', error);
    }

    // 8. Clear any React Query cache (if using React Query)
    try {
      if (window.queryClient) {
        window.queryClient.clear();
        console.log('✅ React Query cache cleared');
      }
    } catch (error) {
      console.warn('Error clearing React Query cache:', error);
    }

    // 9. Clear any component-level caches
    try {
      // Clear any global component caches
      if (window.componentCache) {
        window.componentCache.clear();
      }
      if (window.busInsightsCache) {
        window.busInsightsCache.clear();
      }
      console.log('✅ Component caches cleared');
    } catch (error) {
      console.warn('Error clearing component caches:', error);
    }

    // 10. Clear browser history state (optional - for sensitive applications)
    try {
      // Replace current history state with a clean state
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      console.log('✅ Browser history state cleared');
    } catch (error) {
      console.warn('Error clearing browser history state:', error);
    }

    // 11. Clear any pending timers/intervals that might be user-specific
    try {
      // Clear any global intervals or timeouts that might be running
      if (window.appIntervals) {
        window.appIntervals.forEach(interval => clearInterval(interval));
        window.appIntervals = [];
      }
      if (window.appTimeouts) {
        window.appTimeouts.forEach(timeout => clearTimeout(timeout));
        window.appTimeouts = [];
      }
      console.log('✅ Application timers cleared');
    } catch (error) {
      console.warn('Error clearing application timers:', error);
    }

    console.log('🎉 Comprehensive cache clearing completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Error during cache clearing:', error);
    return false;
  }
};

/**
 * Clear only authentication-related caches
 * Use this for partial cache clearing during token refresh
 */
export const clearAuthCaches = () => {
  try {
    console.log('🔐 Clearing authentication caches...');
    
    const authKeys = [
      'token',
      'user',
      'depotToken', 
      'depotUser',
      'depotInfo',
      'currentDutyId'
    ];

    authKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove auth localStorage key: ${key}`, error);
      }
    });

    // Clear authentication cookies
    try {
      const authCookies = ['auth_token', 'access_token', 'refresh_token', 'yatrik_auth'];
      authCookies.forEach(cookieName => {
        document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });
    } catch (error) {
      console.warn('Error clearing auth cookies:', error);
    }

    console.log('✅ Authentication caches cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing auth caches:', error);
    return false;
  }
};

/**
 * Clear only data caches (preserving authentication)
 * Use this for refreshing application data
 */
export const clearDataCaches = () => {
  try {
    console.log('📊 Clearing data caches...');
    
    // Clear API cache
    clearApiCache();
    
    // Clear data-specific localStorage keys
    const dataKeys = [
      'passenger_notifications',
      'search_history',
      'recent_searches', 
      'favorite_routes',
      'trip_history',
      'booking_cache',
      'route_cache',
      'depot_cache',
      'bus_cache',
      'driver_cache',
      'conductor_cache',
      'admin_cache',
      'analytics_cache',
      'performance_cache'
    ];

    dataKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove data localStorage key: ${key}`, error);
      }
    });

    console.log('✅ Data caches cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing data caches:', error);
    return false;
  }
};

/**
 * Initialize cache management utilities
 * Call this during app initialization
 */
export const initializeCacheManager = () => {
  try {
    // Initialize global arrays for timer management
    if (!window.appIntervals) {
      window.appIntervals = [];
    }
    if (!window.appTimeouts) {
      window.appTimeouts = [];
    }

    // Add utility functions to window for debugging
    if (process.env.NODE_ENV === 'development') {
      window.clearAllCaches = clearAllCaches;
      window.clearAuthCaches = clearAuthCaches;
      window.clearDataCaches = clearDataCaches;
      console.log('🛠️ Cache management utilities available in development mode');
    }

    console.log('✅ Cache manager initialized');
  } catch (error) {
    console.error('❌ Error initializing cache manager:', error);
  }
};

export default {
  clearAllCaches,
  clearAuthCaches,
  clearDataCaches,
  initializeCacheManager
};

