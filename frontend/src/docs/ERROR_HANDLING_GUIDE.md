# Error Handling Implementation Guide

This guide explains how to implement comprehensive error handling with popup messages throughout the YATRIK ERP application.

## Overview

The error handling system provides:
- Centralized error management
- Automatic popup notifications (toasts)
- Form validation error handling
- API error handling
- Different severity levels for errors
- Consistent user experience

## Components

### 1. Error Handler (`utils/errorHandler.js`)

The main error handling utility with functions:
- `handleError(error, customMessage)` - Shows error popup
- `handleSuccess(message, duration)` - Shows success popup
- `handleWarning(message, duration)` - Shows warning popup
- `handleInfo(message, duration)` - Shows info popup
- `handleFormError(errors, formRef)` - Handles form validation errors
- `withFormErrorHandling(submitFunction)` - Wraps form submission functions
- `withErrorHandling(apiCall, customMessage)` - Wraps API calls

### 2. Form Error Handling (`components/FormWithErrorHandling.jsx`)

Provides:
- `useFormErrorHandling()` hook
- `withFormErrorHandling()` HOC
- `FormWrapper` component

### 3. API Integration (`utils/api.js`)

Updated to automatically handle errors and show popups.

## Implementation Examples

### Basic Form with Error Handling

```jsx
import React, { useState } from 'react';
import { useFormErrorHandling } from '../components/FormWithErrorHandling';
import { apiFetch } from '../utils/api';

const MyForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const { handleSubmit, handleValidationError } = useFormErrorHandling();

  const submitData = async (data) => {
    const response = await apiFetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(response.message || 'Failed to submit');
    }
    
    return response;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const errors = [];
    if (!formData.name) errors.push('Name is required');
    if (!formData.email) errors.push('Email is required');
    
    if (errors.length > 0) {
      handleValidationError(errors);
      return;
    }

    setLoading(true);
    try {
      await handleSubmit(submitData, formData);
      setFormData({ name: '', email: '' });
    } catch (error) {
      // Error automatically handled
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleFormSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};
```

### Using withFormErrorHandling HOC

```jsx
import { withFormErrorHandling } from '../components/FormWithErrorHandling';

const MyForm = ({ handleFormSubmit }) => {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      await handleFormSubmit(submitData, formData);
    } catch (error) {
      // Error automatically handled
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};

export default withFormErrorHandling(MyForm);
```

### API Calls with Error Handling

```jsx
import { withErrorHandling } from '../utils/errorHandler';
import { apiFetch } from '../utils/api';

// Wrap API calls
const fetchData = withErrorHandling(async () => {
  const response = await apiFetch('/api/data');
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.data;
}, 'Failed to load data');

// Use in component
const MyComponent = () => {
  const [data, setData] = useState(null);

  const loadData = async () => {
    try {
      const result = await fetchData();
      setData(result);
    } catch (error) {
      // Error automatically handled with popup
    }
  };

  return (
    <div>
      <button onClick={loadData}>Load Data</button>
      {/* Render data */}
    </div>
  );
};
```

## Error Types and Messages

The system handles various error types:

### Network Errors
- Connection refused
- Timeout errors
- Network unavailable

### Authentication Errors
- Unauthorized access
- Token expired
- Permission denied

### Validation Errors
- Required fields
- Invalid formats
- Business rule violations

### Server Errors
- Internal server errors
- Database errors
- Service unavailable

### Business Logic Errors
- Duplicate entries
- Resource not found
- Invalid operations

## Severity Levels

Errors are categorized by severity:

- **LOW**: Minor issues, short duration (3s)
- **MEDIUM**: Important issues, medium duration (4s)
- **HIGH**: Critical issues, longer duration (6s)
- **CRITICAL**: System-breaking issues, longest duration (8s)

## Toast Configuration

Toasts are configured with:
- Position: top-right
- Different colors for different types
- Appropriate durations
- Dismissible by user
- Stack multiple toasts

## Best Practices

1. **Always use error handling** for API calls and form submissions
2. **Provide meaningful error messages** to users
3. **Validate forms** before submission
4. **Handle loading states** appropriately
5. **Use appropriate severity levels** for different errors
6. **Test error scenarios** thoroughly
7. **Log errors** for debugging while showing user-friendly messages

## Migration Guide

To add error handling to existing forms:

1. Import the error handling utilities
2. Wrap form submission functions with `withFormErrorHandling`
3. Replace `toast.error()` calls with `handleError()`
4. Replace `toast.success()` calls with `handleSuccess()`
5. Add validation error handling
6. Test error scenarios

## Example Migration

**Before:**
```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await apiFetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      toast.success('Success!');
    } else {
      toast.error('Failed!');
    }
  } catch (error) {
    toast.error('Error occurred');
  }
};
```

**After:**
```jsx
const handleSubmit = withFormErrorHandling(async (e) => {
  e.preventDefault();
  const response = await apiFetch('/api/submit', {
    method: 'POST',
    body: JSON.stringify(formData)
  });
  
  if (!response.ok) {
    throw new Error(response.message || 'Failed to submit');
  }
  
  return response;
});
```

This approach provides consistent error handling across the entire application with minimal code changes.
