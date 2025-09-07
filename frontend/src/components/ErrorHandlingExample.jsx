import React, { useState } from 'react';
import { useFormErrorHandling } from './FormWithErrorHandling';
import { apiFetch } from '../utils/api';

// Example component showing how to use error handling in forms
const ErrorHandlingExample = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  
  const { handleSubmit, handleValidationError } = useFormErrorHandling();

  // Example API call with error handling
  const submitData = async (data) => {
    const response = await apiFetch('/api/example', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(response.message || 'Failed to submit data');
    }
    
    return response;
  };

  // Form submission with error handling
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    const errors = [];
    if (!formData.name) errors.push('Name is required');
    if (!formData.email) errors.push('Email is required');
    if (!formData.phone) errors.push('Phone is required');
    
    if (errors.length > 0) {
      handleValidationError(errors);
      return;
    }

    setLoading(true);
    try {
      await handleSubmit(submitData, formData);
      // Success message is automatically shown by handleSubmit
      setFormData({ name: '', email: '', phone: '' });
    } catch (error) {
      // Error is automatically handled by handleSubmit
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Error Handling Example</h2>
      
      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default ErrorHandlingExample;
