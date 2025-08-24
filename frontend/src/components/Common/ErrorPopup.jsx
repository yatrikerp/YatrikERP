import React, { useEffect, useState } from 'react';
import { X, AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import './ErrorPopup.css';

const ErrorPopup = ({ 
  message, 
  type = 'error', 
  duration = 3000, 
  onClose, 
  show = false 
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setIsExiting(false);
      
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose && onClose();
    }, 300); // Animation duration
  };

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="popup-icon success" />;
      case 'warning':
        return <AlertCircle className="popup-icon warning" />;
      case 'info':
        return <Info className="popup-icon info" />;
      case 'error':
      default:
        return <XCircle className="popup-icon error" />;
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case 'success':
        return 'popup-success';
      case 'warning':
        return 'popup-warning';
      case 'info':
        return 'popup-info';
      case 'error':
      default:
        return 'popup-error';
    }
  };

  return (
    <div className={`error-popup ${getTypeClass()} ${isExiting ? 'popup-exit' : 'popup-enter'}`}>
      <div className="popup-content">
        <div className="popup-header">
          {getIcon()}
          <span className="popup-title">
            {type === 'success' && 'Success!'}
            {type === 'warning' && 'Warning!'}
            {type === 'info' && 'Information!'}
            {type === 'error' && 'Error!'}
          </span>
          <button 
            className="popup-close" 
            onClick={handleClose}
            aria-label="Close popup"
          >
            <X size={18} />
          </button>
        </div>
        <div className="popup-message">
          {message}
        </div>
        <div className="popup-progress">
          <div className="progress-bar" />
        </div>
      </div>
    </div>
  );
};

export default ErrorPopup;
