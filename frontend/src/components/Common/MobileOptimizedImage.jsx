import React, { useState } from 'react';

const MobileOptimizedImage = ({ 
  src, 
  alt, 
  fallbackIcon: FallbackIcon, 
  className = '',
  style = {},
  ...props 
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  if (imageError || !src) {
    return (
      <div 
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
          borderRadius: '8px',
          ...style
        }}
        {...props}
      >
        {FallbackIcon ? (
          <FallbackIcon size={32} color="#9ca3af" />
        ) : (
          <div style={{
            width: '32px',
            height: '32px',
            background: '#d1d5db',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
            fontSize: '16px'
          }}>
            📷
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', ...style }}>
      {!imageLoaded && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1
        }}>
          {FallbackIcon ? (
            <FallbackIcon size={32} color="#9ca3af" />
          ) : (
            <div style={{
              width: '32px',
              height: '32px',
              border: '2px solid #d1d5db',
              borderTop: '2px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          )}
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={className}
        onError={handleImageError}
        onLoad={handleImageLoad}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: '8px',
          opacity: imageLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease',
          ...style
        }}
        loading="lazy"
        {...props}
      />
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MobileOptimizedImage;
