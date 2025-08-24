import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import './ValidationFeedback.css';

const ValidationFeedback = ({ 
  field, 
  value, 
  isValid, 
  isTouched, 
  errorMessage, 
  successMessage,
  showIcon = true 
}) => {
  if (!isTouched) return null;
  
  if (isValid && value.trim()) {
    return (
      <div className="validation-feedback validation-success">
        {showIcon && <CheckCircle className="validation-icon success" size={16} />}
        <span className="validation-message">{successMessage || `${field} is valid`}</span>
      </div>
    );
  }
  
  if (!isValid && value.trim()) {
    return (
      <div className="validation-feedback validation-error">
        {showIcon && <XCircle className="validation-icon error" size={16} />}
        <span className="validation-message">{errorMessage || `Invalid ${field}`}</span>
      </div>
    );
  }
  
  if (value.trim() === '') {
    return (
      <div className="validation-feedback validation-warning">
        {showIcon && <AlertCircle className="validation-icon warning" size={16} />}
        <span className="validation-message">{field} is required</span>
      </div>
    );
  }
  
  return null;
};

export default ValidationFeedback;
