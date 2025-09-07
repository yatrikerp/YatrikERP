# 🚀 Modern Fetch System

A comprehensive, modern fetch implementation with advanced features like retry logic, caching, interceptors, and React hooks.

## 📁 File Structure

```
frontend/src/utils/
├── api.js                 # Core API utility with retry and caching
├── modernFetch.js         # Fluent API wrapper
├── fetchInterceptors.js   # Request/response interceptors
└── README.md             # This file

frontend/src/hooks/
└── useFetch.js           # React hooks for data fetching

frontend/src/services/
└── apiService.js         # Organized service layer

frontend/src/examples/
└── fetchExamples.js      # Usage examples
```

## 🎯 Key Features

### ✨ Core Features
- **Automatic Retry Logic** - Exponential backoff for failed requests
- **Response Caching** - Intelligent caching with TTL
- **Request Deduplication** - Prevents duplicate requests
- **Timeout Handling** - Configurable request timeouts
- **Error Interceptors** - Global error handling
- **Request/Response Interceptors** - Middleware-like functionality
- **Rate Limiting** - Built-in request queuing
- **Network Status Monitoring** - Online/offline detection

### 🔧 Advanced Features
- **Batch Requests** - Execute multiple requests in parallel
- **Sequential Requests** - Chain requests with dependencies
- **Polling Support** - Real-time data updates
- **File Upload/Download** - Streamlined file operations
- **Request Cancellation** - AbortController integration
- **Performance Monitoring** - Request timing and metrics
- **TypeScript-like JSDoc** - Full type documentation

## 🚀 Quick Start

### Basic Usage

```javascript
import { modernFetch } from '../utils/modernFetch';

// Simple GET request
const response = await modernFetch.get('/api/users/123');

// POST with data
const newUser = await modernFetch.post('/api/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// File upload
const formData = new FormData();
formData.append('file', file);
const uploadResult = await modernFetch.upload('/api/upload', formData);
```

### Using React Hooks

```javascript
import { useFetch, useMutation } from '../hooks/useFetch';

function UserProfile({ userId }) {
  const { data, loading, error, refetch } = useFetch(`/api/users/${userId}`);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>{data.name}</h1>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}

function CreateUser() {
  const { execute, loading, error } = useMutation('/api/users', {
    method: 'POST'
  });
  
  const handleSubmit = async (userData) => {
    try {
      const result = await execute({ body: JSON.stringify(userData) });
      console.log('User created:', result.data);
    } catch (err) {
      console.error('Error:', err);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
```

### Using Service Layer

```javascript
import { apiService } from '../services/apiService';

// Authentication
const loginResponse = await apiService.auth.login({
  email: 'user@example.com',
  password: 'password123'
});

// Bookings
const bookings = await apiService.bookings.getUserBookings(userId, {
  status: 'confirmed',
  limit: 10
});

// Error handling
try {
  const data = await apiService.trips.searchTrips(searchParams);
} catch (error) {
  const message = apiService.errorHandling.getErrorMessage(error);
  console.error(message);
}
```

## 🔧 Configuration

### Environment Variables

```bash
# .env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_RAZORPAY_KEY=rzp_test_your_key_here
```

### Default Configuration

```javascript
import { modernFetch } from '../utils/modernFetch';

// Set base URL
modernFetch.setBaseURL('https://api.example.com');

// Set default options
modernFetch.setDefaults({
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
  headers: {
    'X-Custom-Header': 'MyApp/1.0'
  }
});
```

## 🎛️ Interceptors

### Request Interceptors

```javascript
// Add authentication token
const authInterceptor = modernFetch.addRequestInterceptor((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add request timestamp
const timestampInterceptor = modernFetch.addRequestInterceptor((config) => {
  config.headers['X-Request-Time'] = new Date().toISOString();
  return config;
});
```

### Response Interceptors

```javascript
// Log responses
const loggingInterceptor = modernFetch.addResponseInterceptor((response) => {
  console.log(`Response: ${response.status} ${response.url}`);
  return response;
});

// Handle errors globally
const errorInterceptor = modernFetch.addResponseInterceptor(
  (response) => response,
  (error) => {
    if (error.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    throw error;
  }
);
```

### Error Interceptors

```javascript
// Global error handling
const globalErrorInterceptor = modernFetch.addErrorInterceptor((error) => {
  console.error('API Error:', error);
  
  // Show user-friendly message
  if (error.status >= 500) {
    showNotification('Server error. Please try again later.');
  } else if (error.status === 429) {
    showNotification('Too many requests. Please wait a moment.');
  }
  
  return error;
});
```

## 📊 Advanced Features

### Batch Requests

```javascript
// Execute multiple requests in parallel
const results = await modernFetch.batch([
  { url: '/api/users', method: 'GET' },
  { url: '/api/posts', method: 'GET' },
  { url: '/api/comments', method: 'GET' }
]);

const [users, posts, comments] = results.map(result => 
  result.status === 'fulfilled' ? result.value.data : null
);
```

### Polling

```javascript
// Poll for status updates
const response = await modernFetch.poll(
  '/api/booking/123/status',
  { method: 'GET' },
  2000, // Poll every 2 seconds
  (response) => response.ok && response.data.status === 'confirmed'
);
```

### Request Cancellation

```javascript
// Cancelable request
const { promise, cancel } = modernFetch.cancellableRequest('/api/long-running-task');

// Cancel after 5 seconds
setTimeout(() => cancel(), 5000);

try {
  const result = await promise;
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request was cancelled');
  }
}
```

## 🎣 React Hooks

### useFetch Hook

```javascript
import { useFetch } from '../hooks/useFetch';

function DataComponent() {
  const { 
    data, 
    loading, 
    error, 
    refetch, 
    retry, 
    retryCount 
  } = useFetch('/api/data', {}, [dependency]);
  
  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && (
        <div>
          Error: {error.message}
          <button onClick={retry}>Retry ({retryCount}/3)</button>
        </div>
      )}
      {data && <div>{JSON.stringify(data)}</div>}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### useMutation Hook

```javascript
import { useMutation } from '../hooks/useFetch';

function CreateComponent() {
  const { execute, loading, error, data, reset } = useMutation('/api/create', {
    method: 'POST'
  });
  
  const handleSubmit = async (formData) => {
    try {
      const result = await execute({ body: JSON.stringify(formData) });
      console.log('Success:', result.data);
    } catch (err) {
      console.error('Error:', err);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create'}
      </button>
      {error && <div>Error: {error.message}</div>}
    </form>
  );
}
```

### usePagination Hook

```javascript
import { usePagination } from '../hooks/useFetch';

function PaginatedList() {
  const { 
    data, 
    loading, 
    error, 
    loadMore, 
    hasMore, 
    total 
  } = usePagination('/api/items');
  
  return (
    <div>
      <div>Total: {total} items</div>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

## 🔍 Error Handling

### Built-in Error Types

```javascript
// Network errors
if (error.code === 'NETWORK_ERROR') {
  console.log('Network connection failed');
}

// Timeout errors
if (error.code === 'TIMEOUT') {
  console.log('Request timed out');
}

// HTTP status errors
if (error.status === 404) {
  console.log('Resource not found');
}
```

### Custom Error Handling

```javascript
import { apiService } from '../services/apiService';

try {
  const data = await apiService.trips.searchTrips(params);
} catch (error) {
  const message = apiService.errorHandling.getErrorMessage(error);
  const isRetryable = apiService.errorHandling.isRetryableError(error);
  
  if (isRetryable) {
    // Show retry option
    showRetryDialog();
  } else {
    // Show error message
    showError(message);
  }
}
```

## 📈 Performance Optimization

### Caching

```javascript
// Automatic caching for GET requests
const response1 = await modernFetch.get('/api/data'); // Fetches from server
const response2 = await modernFetch.get('/api/data'); // Returns from cache

// Clear cache
import { clearApiCache } from '../utils/api';
clearApiCache();
```

### Request Deduplication

```javascript
// Multiple calls to same endpoint are deduplicated
const promise1 = modernFetch.get('/api/users');
const promise2 = modernFetch.get('/api/users'); // Returns same promise
const promise3 = modernFetch.get('/api/users'); // Returns same promise
```

### Preloading

```javascript
import { apiService } from '../services/apiService';

// Preload critical data
const endpoints = ['/api/routes', '/api/trips', '/api/stats'];
const results = await apiService.utility.preloadCriticalData(endpoints);
```

## 🧪 Testing

### Mock Responses

```javascript
// Mock API responses for testing
const mockResponse = {
  ok: true,
  status: 200,
  data: { id: 1, name: 'Test User' }
};

// Override fetch for testing
global.fetch = jest.fn(() => Promise.resolve(mockResponse));
```

### Error Testing

```javascript
// Test error handling
const errorResponse = {
  ok: false,
  status: 404,
  message: 'Not found'
};

global.fetch = jest.fn(() => Promise.resolve(errorResponse));
```

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**
   ```javascript
   // Ensure backend has proper CORS configuration
   app.use(cors({
     origin: 'http://localhost:3000',
     credentials: true
   }));
   ```

2. **Authentication Issues**
   ```javascript
   // Check token storage
   const token = localStorage.getItem('token');
   console.log('Token:', token);
   ```

3. **Network Errors**
   ```javascript
   // Check network status
   import { getNetworkStatus } from '../utils/api';
   const status = getNetworkStatus();
   console.log('Network:', status);
   ```

### Debug Mode

```javascript
// Enable debug logging
if (process.env.NODE_ENV === 'development') {
  modernFetch.addRequestInterceptor((config) => {
    console.log('Request:', config);
    return config;
  });
  
  modernFetch.addResponseInterceptor((response) => {
    console.log('Response:', response);
    return response;
  });
}
```

## 📚 API Reference

### ModernFetch Methods

| Method | Description | Parameters |
|--------|-------------|------------|
| `get(url, options)` | GET request | `url: string, options?: object` |
| `post(url, data, options)` | POST request | `url: string, data: any, options?: object` |
| `put(url, data, options)` | PUT request | `url: string, data: any, options?: object` |
| `patch(url, data, options)` | PATCH request | `url: string, data: any, options?: object` |
| `delete(url, options)` | DELETE request | `url: string, options?: object` |
| `upload(url, formData, options)` | File upload | `url: string, formData: FormData, options?: object` |
| `download(url, options)` | File download | `url: string, options?: object` |
| `batch(requests)` | Batch requests | `requests: array` |
| `poll(url, options, interval, condition)` | Polling | `url: string, options: object, interval: number, condition: function` |

### Hook Parameters

| Hook | Parameters | Returns |
|------|------------|---------|
| `useFetch(url, options, deps)` | `url: string, options?: object, deps?: array` | `{ data, loading, error, refetch, retry }` |
| `useMutation(url, options)` | `url: string, options?: object` | `{ execute, loading, error, data, reset }` |
| `usePagination(url, options)` | `url: string, options?: object` | `{ data, loading, error, loadMore, hasMore, total }` |

## 🎉 Conclusion

The modern fetch system provides a powerful, flexible, and user-friendly way to handle HTTP requests in your React application. With features like automatic retry, caching, interceptors, and React hooks, it makes API communication both robust and efficient.

For more examples and advanced usage, check out the `fetchExamples.js` file in the examples directory.
