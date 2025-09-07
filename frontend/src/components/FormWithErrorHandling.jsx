import React from 'react';
import { handleError, handleSuccess, handleWarning, handleFormError } from '../utils/errorHandler';

// Higher-order component for form error handling
export const withFormErrorHandling = (WrappedComponent) => {
  return React.forwardRef((props, ref) => {
    const handleFormSubmit = async (submitFunction, formData, ...args) => {
      try {
        const result = await submitFunction(formData, ...args);
        handleSuccess('Operation completed successfully!');
        return result;
      } catch (error) {
        handleFormError(error, ref);
        throw error;
      }
    };

    const handleFormError = (error, formRef = null) => {
      if (Array.isArray(error)) {
        error.forEach(err => {
          handleError(err, 'Validation Error');
        });
      } else if (typeof error === 'object' && error.message) {
        handleError(error);
      } else {
        handleError(new Error(error), 'Form Error');
      }
      
      // Focus on first error field if form ref is provided
      if (formRef && formRef.current) {
        const firstErrorField = formRef.current.querySelector('[aria-invalid="true"]');
        if (firstErrorField) {
          firstErrorField.focus();
        }
      }
    };

    return (
      <WrappedComponent
        {...props}
        ref={ref}
        handleFormSubmit={handleFormSubmit}
        handleFormError={handleFormError}
      />
    );
  });
};

// Hook for form error handling
export const useFormErrorHandling = () => {
  const handleSubmit = async (submitFunction, formData, ...args) => {
    try {
      const result = await submitFunction(formData, ...args);
      handleSuccess('Operation completed successfully!');
      return result;
    } catch (error) {
      handleFormError(error);
      throw error;
    }
  };

  const handleValidationError = (errors) => {
    if (Array.isArray(errors)) {
      errors.forEach(error => {
        handleError(error, 'Validation Error');
      });
    } else if (typeof errors === 'object') {
      Object.entries(errors).forEach(([field, message]) => {
        handleError(new Error(message), `${field}: ${message}`);
      });
    } else {
      handleError(errors, 'Form Error');
    }
  };

  return {
    handleSubmit,
    handleValidationError,
    handleError,
    handleSuccess,
    handleWarning
  };
};

// Form wrapper component
export const FormWrapper = ({ children, onSubmit, className = '', ...props }) => {
  const { handleSubmit } = useFormErrorHandling();

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      await handleSubmit(onSubmit, e);
    } catch (error) {
      // Error already handled by useFormErrorHandling
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className={className} {...props}>
      {children}
    </form>
  );
};

export default FormWrapper;
