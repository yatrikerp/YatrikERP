/**
 * Modern Fetch Usage Examples
 * Demonstrates how to use the upgraded fetch system
 */

import { modernFetch, apiService } from '../utils/modernFetch';
import { useFetch, useMutation, usePagination } from '../hooks/useFetch';

// ============================================================================
// BASIC USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Basic GET request
 */
export async function fetchUserProfile(userId) {
  try {
    const response = await modernFetch.get(`/api/users/${userId}`);
    
    if (response.ok) {
      console.log('User profile:', response.data);
      return response.data;
    } else {
      console.error('Failed to fetch user:', response.message);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Example 2: POST request with data
 */
export async function createBooking(bookingData) {
  try {
    const response = await modernFetch.post('/api/bookings', bookingData);
    
    if (response.ok) {
      console.log('Booking created:', response.data);
      return response.data;
    } else {
      throw new Error(response.message || 'Failed to create booking');
    }
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

/**
 * Example 3: File upload
 */
export async function uploadTicket(file) {
  try {
    const formData = new FormData();
    formData.append('ticket', file);
    
    const response = await modernFetch.upload('/api/upload/ticket', formData, {
      onUploadProgress: (progress) => {
        console.log(`Upload progress: ${progress.percentage}%`);
      }
    });
    
    if (response.ok) {
      console.log('File uploaded:', response.data);
      return response.data;
    } else {
      throw new Error(response.message || 'Upload failed');
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

// ============================================================================
// ADVANCED USAGE EXAMPLES
// ============================================================================

/**
 * Example 4: Batch requests
 */
export async function fetchDashboardData() {
  try {
    const requests = [
      { url: '/api/stats/overview', method: 'GET' },
      { url: '/api/bookings/recent', method: 'GET' },
      { url: '/api/trips/upcoming', method: 'GET' },
      { url: '/api/routes/popular', method: 'GET' }
    ];
    
    const results = await modernFetch.batch(requests);
    
    const [overview, bookings, trips, routes] = results.map(result => 
      result.status === 'fulfilled' ? result.value.data : null
    );
    
    return { overview, bookings, trips, routes };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
}

/**
 * Example 5: Polling for real-time updates
 */
export async function waitForBookingConfirmation(bookingId) {
  try {
    const response = await modernFetch.poll(
      `/api/bookings/${bookingId}/status`,
      { method: 'GET' },
      2000, // Poll every 2 seconds
      (response) => response.ok && response.data.status === 'confirmed'
    );
    
    console.log('Booking confirmed:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error waiting for confirmation:', error);
    throw error;
  }
}

/**
 * Example 6: Sequential requests with dependencies
 */
export async function completeBookingFlow(bookingData) {
  try {
    // Step 1: Create booking
    const bookingResponse = await modernFetch.post('/api/bookings', bookingData);
    if (!bookingResponse.ok) throw new Error('Failed to create booking');
    
    // Step 2: Process payment
    const paymentResponse = await modernFetch.post('/api/payments', {
      bookingId: bookingResponse.data.id,
      amount: bookingResponse.data.totalAmount
    });
    if (!paymentResponse.ok) throw new Error('Payment failed');
    
    // Step 3: Confirm booking
    const confirmResponse = await modernFetch.put(`/api/bookings/${bookingResponse.data.id}/confirm`, {
      paymentId: paymentResponse.data.id
    });
    if (!confirmResponse.ok) throw new Error('Confirmation failed');
    
    return confirmResponse.data;
  } catch (error) {
    console.error('Error in booking flow:', error);
    throw error;
  }
}

// ============================================================================
// REACT HOOKS EXAMPLES
// ============================================================================

/**
 * Example 7: Using useFetch hook
 */
export function UserProfileComponent({ userId }) {
  const { data, loading, error, refetch } = useFetch(`/api/users/${userId}`);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>{data?.name}</h1>
      <p>{data?.email}</p>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}

/**
 * Example 8: Using useMutation hook
 */
export function CreateBookingComponent() {
  const { execute, loading, error, data } = useMutation('/api/bookings', {
    method: 'POST'
  });
  
  const handleSubmit = async (formData) => {
    try {
      const result = await execute({ body: JSON.stringify(formData) });
      console.log('Booking created:', result.data);
    } catch (err) {
      console.error('Booking failed:', err);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Booking'}
      </button>
      {error && <div>Error: {error.message}</div>}
    </form>
  );
}

/**
 * Example 9: Using usePagination hook
 */
export function BookingsListComponent() {
  const { data, loading, error, loadMore, hasMore } = usePagination('/api/bookings');
  
  if (loading && data.length === 0) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {data.map(booking => (
        <div key={booking.id}>
          <h3>Booking #{booking.id}</h3>
          <p>Status: {booking.status}</p>
        </div>
      ))}
      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}

// ============================================================================
// INTERCEPTOR EXAMPLES
// ============================================================================

/**
 * Example 10: Adding custom interceptors
 */
export function setupCustomInterceptors() {
  // Request interceptor for adding custom headers
  const requestId = modernFetch.addRequestInterceptor((config) => {
    config.headers = {
      ...config.headers,
      'X-Custom-Header': 'MyApp/1.0',
      'X-Request-ID': `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    return config;
  });
  
  // Response interceptor for logging
  const responseId = modernFetch.addResponseInterceptor((response) => {
    console.log(`Response received: ${response.status} ${response.url}`);
    return response;
  });
  
  // Error interceptor for custom error handling
  const errorId = modernFetch.addErrorInterceptor((error) => {
    if (error.status === 429) {
      // Handle rate limiting
      console.warn('Rate limited, retrying in 5 seconds...');
      setTimeout(() => {
        // Retry logic here
      }, 5000);
    }
    return error;
  });
  
  return { requestId, responseId, errorId };
}

// ============================================================================
// SERVICE LAYER EXAMPLES
// ============================================================================

/**
 * Example 11: Using the service layer
 */
export async function fetchUserBookings(userId) {
  try {
    const response = await apiService.bookings.getUserBookings(userId, {
      status: 'confirmed',
      limit: 10,
      page: 1
    });
    
    if (response.ok) {
      return response.data;
    } else {
      throw new Error(apiService.errorHandling.getErrorMessage(response));
    }
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
}

/**
 * Example 12: Preloading critical data
 */
export async function preloadAppData() {
  try {
    const endpoints = [
      '/api/routes/popular',
      '/api/trips/featured',
      '/api/stats/overview'
    ];
    
    const results = await apiService.utility.preloadCriticalData(endpoints);
    
    console.log('Preloaded data:', results);
    return results;
  } catch (error) {
    console.error('Error preloading data:', error);
    throw error;
  }
}

// ============================================================================
// ERROR HANDLING EXAMPLES
// ============================================================================

/**
 * Example 13: Comprehensive error handling
 */
export async function robustApiCall() {
  try {
    const response = await modernFetch.get('/api/some-endpoint');
    
    if (response.ok) {
      return response.data;
    } else {
      // Handle different error types
      switch (response.status) {
        case 400:
          throw new Error('Invalid request data');
        case 401:
          throw new Error('Please log in to continue');
        case 403:
          throw new Error('You do not have permission');
        case 404:
          throw new Error('Resource not found');
        case 429:
          throw new Error('Too many requests, please wait');
        case 500:
          throw new Error('Server error, please try again later');
        default:
          throw new Error(response.message || 'An error occurred');
      }
    }
  } catch (error) {
    // Log error for debugging
    console.error('API call failed:', {
      message: error.message,
      status: error.status,
      url: error.url,
      timestamp: new Date().toISOString()
    });
    
    // Re-throw with user-friendly message
    throw new Error(apiService.errorHandling.getErrorMessage(error));
  }
}

// ============================================================================
// PERFORMANCE OPTIMIZATION EXAMPLES
// ============================================================================

/**
 * Example 14: Request deduplication
 */
const requestCache = new Map();

export async function deduplicatedRequest(url, options = {}) {
  const cacheKey = `${options.method || 'GET'}:${url}:${JSON.stringify(options.body || {})}`;
  
  if (requestCache.has(cacheKey)) {
    console.log('Returning cached request');
    return requestCache.get(cacheKey);
  }
  
  const promise = modernFetch.request(url, options);
  requestCache.set(cacheKey, promise);
  
  // Clean up after 5 minutes
  setTimeout(() => {
    requestCache.delete(cacheKey);
  }, 300000);
  
  return promise;
}

/**
 * Example 15: Request cancellation
 */
export function cancellableRequest(url, options = {}) {
  const controller = new AbortController();
  
  const promise = modernFetch.request(url, {
    ...options,
    signal: controller.signal
  });
  
  return {
    promise,
    cancel: () => controller.abort()
  };
}

export default {
  fetchUserProfile,
  createBooking,
  uploadTicket,
  fetchDashboardData,
  waitForBookingConfirmation,
  completeBookingFlow,
  setupCustomInterceptors,
  fetchUserBookings,
  preloadAppData,
  robustApiCall,
  deduplicatedRequest,
  cancellableRequest
};
