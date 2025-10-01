import React, { useState } from 'react';
import './OAuthButton.css';

// provider: 'google' renders the official multi-color G icon
const OAuthButton = ({ href, provider = 'google', icon, children, ariaLabel, onClick, className = '', disabled = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const baseClasses = "w-full inline-flex items-center justify-center gap-3 py-3 px-5 rounded-full border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 oauth-button disabled:opacity-50 disabled:cursor-not-allowed";

  const googleIcon = (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
  const resolvedIcon = provider === 'google' ? googleIcon : icon;
  
  const resolveUrl = (rawHref) => {
    if (!rawHref) return '';
    // If the href starts with /api, force absolute URL to backend
    if (rawHref.startsWith('/api')) {
      const backendBase = ((typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL) || process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, '');
      return `${backendBase}${rawHref}`;
    }
    return rawHref;
  };

  const finalHref = resolveUrl(href);

  const handleClick = async (e) => {
    if (disabled || isLoading) return;
    
    // Prevent default and stop propagation for better mobile compatibility
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    
    setIsLoading(true);
    
    if (onClick) {
      try {
        await onClick(e);
      } finally {
        setIsLoading(false);
      }
    } else if (finalHref) {
      // For mobile compatibility, use window.location.href instead of assign
      console.log('🔗 Google OAuth redirect:', finalHref);
      setTimeout(() => {
        // Force full-page navigation - works better on mobile
        window.location.href = finalHref;
      }, 100);
    }
  };

  // Mobile-specific touch event handlers
  const handleTouchStart = (e) => {
    if (disabled || isLoading) return;
    // Add visual feedback on touch
    e.currentTarget.style.transform = 'scale(0.98)';
  };

  const handleTouchEnd = (e) => {
    if (disabled || isLoading) return;
    // Remove visual feedback
    e.currentTarget.style.transform = 'scale(1)';
  };
  
  if (onClick) {
    return (
      <button
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label={ariaLabel}
        className={`${baseClasses} ${className}`}
        disabled={disabled || isLoading}
        style={{
          touchAction: 'manipulation', // Improve mobile touch response
          WebkitTapHighlightColor: 'transparent' // Remove tap highlight on iOS
        }}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
        ) : (
          resolvedIcon
        )}
        <span>{isLoading ? 'Processing...' : children}</span>
      </button>
    );
  }

  return (
    <a
      href={finalHref}
      aria-label={ariaLabel}
      className={`${baseClasses} ${className}`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        touchAction: 'manipulation', // Improve mobile touch response
        WebkitTapHighlightColor: 'transparent', // Remove tap highlight on iOS
        cursor: 'pointer',
        userSelect: 'none' // Prevent text selection on mobile
      }}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
      ) : (
        resolvedIcon
      )}
      <span>{isLoading ? 'Processing...' : children}</span>
    </a>
  );
};

export default OAuthButton;


