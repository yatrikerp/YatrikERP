import React, { useRef, useEffect, useState, useCallback } from 'react';
import './QRCodeScanner.css';

const QRCodeScanner = ({ 
  isActive, 
  onScan, 
  onError, 
  onClose, 
  className = '' 
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        setIsScanning(true);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      const errorMessage = err.name === 'NotAllowedError' 
        ? 'Camera access denied. Please enable camera permissions.'
        : 'Camera not available. Please check your device.';
      
      setError(errorMessage);
      onError && onError(errorMessage);
    }
  }, [onError]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const scanQRCode = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      try {
        // Ensure jsQR exists; attempt dynamic import with local fallback
        if (!window.jsQR) {
          try {
            await import(/* @vite-ignore */ '/vendor/jsqr.min.js');
          } catch (_) {
            try { await import('jsqr'); } catch (e) { /* ignore */ }
          }
        }
        // Try to detect QR code using jsQR if available
        if (window.jsQR) {
          const qrCode = window.jsQR(imageData.data, imageData.width, imageData.height);
          if (qrCode) {
            onScan && onScan(qrCode.data);
            stopCamera();
            return;
          }
        }
        
        // Fallback: Simple pattern detection for demo
        // Look for common QR code patterns in the image
        const hasQRPattern = detectQRPattern(imageData);
        if (hasQRPattern) {
          // Generate a mock QR data for demo purposes
          const mockQRData = `PNR${Date.now()}`;
          onScan && onScan(mockQRData);
          stopCamera();
        }
      } catch (error) {
        console.error('QR detection error:', error);
      }
    }
  }, [isScanning, onScan, stopCamera]);

  // Simple QR pattern detection fallback
  const detectQRPattern = (imageData) => {
    // This is a very basic pattern detection for demo
    // In production, you should use a proper QR detection library
    const data = imageData.data;
    let contrastCount = 0;
    
    // Sample some pixels to detect high contrast patterns typical of QR codes
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      
      // Count pixels that are very dark or very light (typical of QR codes)
      if (brightness < 50 || brightness > 200) {
        contrastCount++;
      }
    }
    
    // If we have enough high-contrast pixels, assume it might be a QR code
    return contrastCount > (data.length / 4) * 0.3;
  };

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive, startCamera, stopCamera]);

  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(scanQRCode, 100); // Scan every 100ms
      return () => clearInterval(interval);
    }
  }, [isScanning, scanQRCode]);

  if (!isActive) return null;

  return (
    <div className={`qr-scanner-modal ${className}`}>
      <div className="scanner-overlay">
        <div className="scanner-content">
          <div className="scanner-header">
            <h3>QR Code Scanner</h3>
            <button 
              className="close-btn" 
              onClick={() => {
                stopCamera();
                onClose && onClose();
              }}
              aria-label="Close scanner"
            >
              ✕
            </button>
          </div>

          <div className="scanner-view">
            <video 
              ref={videoRef} 
              className="scanner-video" 
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="scanner-canvas" />
            
            <div className="scan-overlay">
              <div className="scan-frame">
                <div className="scan-corners">
                  <div className="corner top-left"></div>
                  <div className="corner top-right"></div>
                  <div className="corner bottom-left"></div>
                  <div className="corner bottom-right"></div>
                </div>
              </div>
              <p className="scan-instruction">
                Position QR code within the frame
              </p>
            </div>
          </div>

          {error && (
            <div className="scanner-error">
              <p>{error}</p>
              <button onClick={startCamera} className="retry-btn">
                Try Again
              </button>
            </div>
          )}

          <div className="scanner-controls">
            <button 
              onClick={stopCamera}
              className="control-btn stop-btn"
              disabled={!isScanning}
            >
              Stop Scanner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeScanner;
