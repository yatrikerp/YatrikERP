import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Upload, QrCode, CheckCircle, AlertCircle } from 'lucide-react';
import QrScanner from 'qr-scanner';

const QRScanner = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('camera'); // 'camera' or 'upload'
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (mode === 'camera' && videoRef.current && !scannerRef.current) {
      initializeScanner();
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, [mode]);

  const initializeScanner = async () => {
    try {
      setScanning(true);
      setError(null);

      const scanner = new QrScanner(
        videoRef.current,
        result => handleScanResult(result),
        {
          onDecodeError: error => {
            console.error('Decode error:', error);
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 5
        }
      );

      await scanner.start();
      scannerRef.current = scanner;
    } catch (err) {
      console.error('Scanner initialization error:', err);
      setError('Failed to access camera. Please check permissions.');
      setScanning(false);
    }
  };

  const handleScanResult = (result) => {
    if (result?.data) {
      setResult(result.data);
      setScanning(false);
      
      // Stop scanner
      if (scannerRef.current) {
        scannerRef.current.stop();
      }

      // Parse QR data
      try {
        const data = JSON.parse(result.data);
        onScan(data);
      } catch (e) {
        // If not JSON, pass raw data
        onScan({ raw: result.data });
      }
    }
  };

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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <QrCode className="w-6 h-6" />
                QR Code Scanner
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Mode Selector */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setMode('camera')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  mode === 'camera'
                    ? 'bg-white text-blue-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <Camera className="w-4 h-4 inline mr-2" />
                Camera
              </button>
              <button
                onClick={() => setMode('upload')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  mode === 'upload'
                    ? 'bg-white text-blue-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Upload
              </button>
            </div>
          </div>

          {/* Scanner Content */}
          <div className="p-6">
            {mode === 'camera' ? (
              <div className="space-y-4">
                {!result && (
                  <>
                    <div className="relative rounded-lg overflow-hidden bg-black aspect-square">
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                      />
                      {scanning && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-48 h-48 border-2 border-white rounded-lg animate-pulse"></div>
                        </div>
                      )}
                    </div>
                    <p className="text-center text-sm text-gray-600">
                      Position the QR code within the frame to scan
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
                >
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Click to upload QR code image</p>
                  <p className="text-sm text-gray-400 mt-2">PNG, JPG up to 10MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {/* Result Display */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-800">QR Code Scanned Successfully!</h4>
                    <p className="text-sm text-green-700 mt-1 font-mono break-all">{result}</p>
                  </div>
                </div>
                <button
                  onClick={resetScanner}
                  className="mt-3 text-sm text-green-600 hover:text-green-700 font-medium"
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
                className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-800">Scan Error</h4>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
                <button
                  onClick={resetScanner}
                  className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Try again
                </button>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Powered by advanced QR technology</span>
              <span className="flex items-center gap-1">
                {scanning && (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Scanning...
                  </>
                )}
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QRScanner;

