import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Upload, QrCode, CheckCircle, AlertCircle, Maximize2, Minimize2 } from 'lucide-react';
import QrScanner from 'qr-scanner';
import './QRScanner.css';

const QRScanner = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('camera'); // 'camera' or 'upload'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const scanningIndicatorRef = useRef(null);

  const handleScanResult = useCallback((result) => {
    if (result?.data) {
      setResult(result.data);
      setScanning(false);
      
      // Vibrate on successful scan (mobile only)
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
      
      // Stop scanner
      if (scannerRef.current) {
        scannerRef.current.stop();
      }

      // Parse QR data
      try {
        const data = JSON.parse(result.data);
        onScan(data);
      } catch (e) {
        onScan(result.data);
      }
    }
  }, [onScan]);

  const initializeScanner = useCallback(async () => {
    try {
      setScanning(true);
      setError(null);
      
      // Preflight: ensure camera exists and request permission explicitly
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        throw new Error('No camera found on this device');
      }

      // Request permission to surface the browser prompt
      try {
        const preflight = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false
        });
        // Immediately stop preflight stream to release camera for QrScanner
        preflight.getTracks().forEach(t => t.stop());
      } catch (permErr) {
        console.error('Camera permission error:', permErr);
        throw new Error('Camera permission denied. Please allow camera access and try again.');
      }

      // Choose the best camera (prefer back/environment)
      let preferredCamera = undefined;
      try {
        const cameras = await QrScanner.listCameras(true);
        const backCam = cameras.find(c => /back|rear|environment/i.test(`${c.label} ${c.id}`));
        preferredCamera = backCam?.id || cameras?.[0]?.id;
      } catch (e) {
        // ignore; QrScanner will choose default
      }

      const scanner = new QrScanner(
        videoRef.current,
        handleScanResult,
        {
          onDecodeError: error => {
            // benign decode errors during scanning; keep silent
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 10,
          preferredCamera
        }
      );

      // Start only once; guard rapid restarts causing play() interruption
      await scanner.start();
      scannerRef.current = scanner;
    } catch (err) {
      console.error('Scanner initialization error:', err);
      setError(
        typeof err?.message === 'string' && err.message
          ? err.message
          : 'Failed to access camera. Please check permissions.'
      );
      setScanning(false);
    }
  }, [handleScanResult]);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      const video = videoRef.current;
      if (mode === 'camera' && video) {
        // Ensure any existing scanner is stopped before starting new
        if (scannerRef.current) {
          try { await scannerRef.current.stop(); } catch {}
          try { scannerRef.current.destroy(); } catch {}
          scannerRef.current = null;
        }
        if (!cancelled) {
          await initializeScanner();
        }
      }
    };
    boot();

    const onVisibility = async () => {
      if (document.hidden) {
        try { await scannerRef.current?.stop(); } catch {}
      } else if (mode === 'camera' && videoRef.current && !scannerRef.current) {
        await initializeScanner();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      if (scannerRef.current) {
        try { scannerRef.current.stop(); } catch {}
        try { scannerRef.current.destroy(); } catch {}
        scannerRef.current = null;
      }
      const video = videoRef.current;
      if (video) {
        try { video.srcObject = null; } catch {}
      }
    };
  }, [mode, initializeScanner]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setError(null);
      const result = await QrScanner.scanImage(file, {
        returnDetailedScanResult: true
      });
      
      handleScanResult(result);
    } catch (err) {
      console.error('File scan error:', err);
      setError('Failed to scan QR code from image');
    }
  };

  const resetScanner = () => {
    setResult(null);
    setError(null);
    if (mode === 'camera') {
      initializeScanner();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`qr-scanner-overlay ${isFullscreen ? 'fullscreen' : ''}`}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`qr-scanner-container ${isFullscreen ? 'fullscreen' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="qr-scanner-header">
            <div className="qr-scanner-header-content">
              <div className="qr-scanner-title">
                <QrCode className="qr-icon" />
                <h3>QR Code Scanner</h3>
              </div>
              <div className="qr-scanner-actions">
                <button
                  onClick={toggleFullscreen}
                  className="qr-toggle-fullscreen-btn"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="qr-icon" /> : <Maximize2 className="qr-icon" />}
                </button>
                <button
                  onClick={onClose}
                  className="qr-close-btn"
                  title="Close Scanner"
                >
                  <X className="qr-icon" />
                </button>
              </div>
            </div>
            
            {/* Mode Selector */}
            <div className="qr-mode-selector">
              <button
                onClick={() => setMode('camera')}
                className={`qr-mode-btn ${mode === 'camera' ? 'active' : ''}`}
              >
                <Camera className="qr-icon" />
                Camera
              </button>
              <button
                onClick={() => setMode('upload')}
                className={`qr-mode-btn ${mode === 'upload' ? 'active' : ''}`}
              >
                <Upload className="qr-icon" />
                Upload
              </button>
            </div>
          </div>

          {/* Scanner Content */}
          <div className="qr-scanner-body">
            {mode === 'camera' ? (
              <div className="qr-camera-container">
                {!result && (
                  <>
                    <div className="qr-video-wrapper">
                      <video
                        ref={videoRef}
                        className="qr-video"
                        playsInline
                        autoPlay
                        muted
                      />
                      {scanning && (
                        <div className="qr-scanning-overlay">
                          <div className="qr-corner qr-corner-tl"></div>
                          <div className="qr-corner qr-corner-tr"></div>
                          <div className="qr-corner qr-corner-bl"></div>
                          <div className="qr-corner qr-corner-br"></div>
                          <div className="qr-scan-line" ref={scanningIndicatorRef}></div>
                        </div>
                      )}
                    </div>
                    <div className="qr-scanning-instructions">
                      <p className="qr-scanning-text">
                        👉 Position the QR code within the frame
                      </p>
                      <p className="qr-scanning-hint">
                        Hold steady for best results
                      </p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="qr-upload-container">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="qr-upload-box"
                >
                  <Upload className="qr-upload-icon" />
                  <p className="qr-upload-text">Click to upload QR code image</p>
                  <p className="qr-upload-hint">PNG, JPG up to 10MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="qr-file-input"
                  />
                </div>
              </div>
            )}

            {/* Result Display */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="qr-result-success"
              >
                <div className="qr-result-content">
                  <CheckCircle className="qr-success-icon" />
                  <div className="qr-result-info">
                    <h4>QR Code Scanned Successfully!</h4>
                    <p className="qr-result-data">{result}</p>
                  </div>
                </div>
                <button
                  onClick={resetScanner}
                  className="qr-rescan-btn"
                >
                  Scan another code
                </button>
              </motion.div>
            )}

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="qr-result-error"
              >
                <div className="qr-result-content">
                  <AlertCircle className="qr-error-icon" />
                  <div className="qr-result-info">
                    <h4>Scan Error</h4>
                    <p>{error}</p>
                  </div>
                </div>
                <button
                  onClick={resetScanner}
                  className="qr-retry-btn"
                >
                  Try again
                </button>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="qr-scanner-footer">
            <div className="qr-footer-left">
              <span>Powered by advanced QR technology</span>
            </div>
            <div className="qr-footer-right">
              {scanning && (
                <span className="qr-scanning-indicator">
                  <span className="qr-pulse-dot"></span>
                  Scanning...
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QRScanner;
