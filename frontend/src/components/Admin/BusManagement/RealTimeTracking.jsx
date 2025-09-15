import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Navigation, Clock, Users, Fuel, Gauge, Route, 
  Signal, Wifi, Battery, Thermometer, AlertTriangle, CheckCircle,
  XCircle, RefreshCw, Play, Pause, Stop, Eye, EyeOff, 
  TrendingUp, TrendingDown, Zap, Shield, Database, Cloud
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const RealTimeTracking = ({ bus, onTrackingUpdate, isActive = false }) => {
  const [trackingData, setTrackingData] = useState({
    location: {
      latitude: bus.currentLocation?.latitude || 0,
      longitude: bus.currentLocation?.longitude || 0,
      address: bus.currentLocation?.stopName || 'Unknown Location',
      speed: bus.currentLocation?.speed || 0,
      heading: bus.currentLocation?.heading || 0,
      lastUpdated: bus.currentLocation?.lastUpdated || new Date()
    },
    route: {
      currentStop: 'Loading...',
      nextStop: 'Loading...',
      progress: 0,
      estimatedArrival: null,
      delays: []
    },
    passengers: {
      onboard: 0,
      capacity: bus.capacity?.total || 0,
      occupancy: 0
    },
    vehicle: {
      fuel: bus.fuel?.currentLevel || 0,
      temperature: 0,
      battery: 0,
      engineStatus: 'normal',
      maintenanceAlerts: []
    },
    communication: {
      gpsSignal: 'strong',
      wifiConnected: true,
      lastSync: new Date(),
      connectionQuality: 'excellent'
    }
  });

  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [trackingHistory, setTrackingHistory] = useState([]);
  
  const trackingIntervalRef = useRef(null);
  const lastPositionRef = useRef(null);

  // Enhanced error handling
  const handleError = useCallback((error, operation) => {
    console.error(`${operation} error:`, error);
    setError(`${operation} failed: ${error.message}`);
    toast.error(`${operation} operation failed`);
  }, []);

  // Start tracking
  const startTracking = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tracking/bus/${bus._id}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          busId: bus._id,
          trackingInterval: 10000, // 10 seconds
          includeRoute: true,
          includePassengers: true,
          includeVehicleData: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setIsTracking(true);
        toast.success('Real-time tracking started');
        
        // Start periodic updates
        startPeriodicUpdates();
        
        onTrackingUpdate?.({
          type: 'tracking_started',
          data: result.trackingData
        });
      } else {
        throw new Error(result.message || 'Failed to start tracking');
      }
    } catch (error) {
      handleError(error, 'Start Tracking');
    } finally {
      setIsLoading(false);
    }
  };

  // Stop tracking
  const stopTracking = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tracking/bus/${bus._id}/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setIsTracking(false);
        stopPeriodicUpdates();
        toast.success('Real-time tracking stopped');
        
        onTrackingUpdate?.({
          type: 'tracking_stopped',
          data: result.summary
        });
      } else {
        throw new Error(result.message || 'Failed to stop tracking');
      }
    } catch (error) {
      handleError(error, 'Stop Tracking');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch real-time data
  const fetchTrackingData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tracking/bus/${bus._id}/current`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const newData = result.trackingData;
        
        // Update tracking data
        setTrackingData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            ...newData.location,
            lastUpdated: new Date()
          },
          route: {
            ...prev.route,
            ...newData.route
          },
          passengers: {
            ...prev.passengers,
            ...newData.passengers
          },
          vehicle: {
            ...prev.vehicle,
            ...newData.vehicle
          },
          communication: {
            ...prev.communication,
            ...newData.communication,
            lastSync: new Date()
          }
        }));

        // Add to tracking history
        setTrackingHistory(prev => [
          {
            timestamp: new Date(),
            location: newData.location,
            speed: newData.location.speed,
            passengers: newData.passengers.onboard
          },
          ...prev.slice(0, 49) // Keep last 50 records
        ]);

        // Check for alerts
        checkForAlerts(newData);

        onTrackingUpdate?.({
          type: 'data_update',
          data: newData
        });
      } else {
        throw new Error(result.message || 'Failed to fetch tracking data');
      }
    } catch (error) {
      handleError(error, 'Fetch Tracking Data');
    }
  };

  // Start periodic updates
  const startPeriodicUpdates = () => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
    }

    trackingIntervalRef.current = setInterval(() => {
      fetchTrackingData();
    }, 10000); // Update every 10 seconds
  };

  // Stop periodic updates
  const stopPeriodicUpdates = () => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
  };

  // Check for alerts
  const checkForAlerts = (data) => {
    const newAlerts = [];

    // Speed alert
    if (data.location.speed > 80) {
      newAlerts.push({
        id: Date.now(),
        type: 'speed',
        severity: 'warning',
        message: `High speed detected: ${data.location.speed} km/h`,
        timestamp: new Date()
      });
    }

    // Fuel alert
    if (data.vehicle.fuel < 20) {
      newAlerts.push({
        id: Date.now(),
        type: 'fuel',
        severity: 'critical',
        message: `Low fuel level: ${data.vehicle.fuel}%`,
        timestamp: new Date()
      });
    }

    // Temperature alert
    if (data.vehicle.temperature > 90) {
      newAlerts.push({
        id: Date.now(),
        type: 'temperature',
        severity: 'warning',
        message: `High engine temperature: ${data.vehicle.temperature}°C`,
        timestamp: new Date()
      });
    }

    // GPS signal alert
    if (data.communication.gpsSignal === 'weak' || data.communication.gpsSignal === 'lost') {
      newAlerts.push({
        id: Date.now(),
        type: 'gps',
        severity: 'critical',
        message: `GPS signal ${data.communication.gpsSignal}`,
        timestamp: new Date()
      });
    }

    // Add new alerts
    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev.slice(0, 9)]); // Keep last 10 alerts
      newAlerts.forEach(alert => {
        toast.error(alert.message);
      });
    }
  };

  // Dismiss alert
  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  // Get connection quality color
  const getConnectionQualityColor = (quality) => {
    switch (quality) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-orange-600 bg-orange-100';
      case 'lost': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'normal': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPeriodicUpdates();
    };
  }, []);

  // Auto-start tracking when component becomes active
  useEffect(() => {
    if (isActive && !isTracking) {
      startTracking();
    }
  }, [isActive]);

  // Add null check for bus object after all hooks
  if (!bus || !bus._id) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No bus data available</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
            <Navigation className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Real-Time Tracking</h3>
            <p className="text-sm text-gray-600">{bus.busNumber}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
          }`}></div>
          <span className="text-sm text-gray-600">
            {isTracking ? 'Tracking Active' : 'Tracking Stopped'}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2"
        >
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Active Alerts</h4>
          <div className="space-y-2">
            {alerts.slice(0, 3).map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-3 rounded-lg border-l-4 flex items-center justify-between ${
                  alert.severity === 'critical' ? 'bg-red-50 border-red-400' :
                  alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                  'bg-blue-50 border-blue-400'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <AlertTriangle className={`w-4 h-4 ${
                    alert.severity === 'critical' ? 'text-red-600' :
                    alert.severity === 'warning' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`} />
                  <span className="text-sm font-medium">{alert.message}</span>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Location & Route Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Current Location</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">{trackingData.location.address}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Gauge className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">{trackingData.location.speed} km/h</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">
                Last update: {trackingData.location.lastUpdated.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Route Information</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Route className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">Current: {trackingData.route.currentStop}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">Next: {trackingData.route.nextStop}</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">
                Progress: {trackingData.route.progress}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Status */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center mb-2">
            <Users className="w-5 h-5 text-gray-500" />
          </div>
          <p className="text-lg font-bold text-gray-900">{trackingData.passengers.onboard}</p>
          <p className="text-xs text-gray-500">
            {trackingData.passengers.occupancy}% occupied
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center mb-2">
            <Fuel className="w-5 h-5 text-gray-500" />
          </div>
          <p className="text-lg font-bold text-gray-900">{trackingData.vehicle.fuel}%</p>
          <p className="text-xs text-gray-500">Fuel level</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center mb-2">
            <Thermometer className="w-5 h-5 text-gray-500" />
          </div>
          <p className="text-lg font-bold text-gray-900">{trackingData.vehicle.temperature}°C</p>
          <p className="text-xs text-gray-500">Engine temp</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center mb-2">
            <Battery className="w-5 h-5 text-gray-500" />
          </div>
          <p className="text-lg font-bold text-gray-900">{trackingData.vehicle.battery}%</p>
          <p className="text-xs text-gray-500">Battery</p>
        </div>
      </div>

      {/* Communication Status */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <div className={`flex items-center justify-center p-2 rounded-lg ${
          trackingData.communication.gpsSignal === 'strong' 
            ? 'bg-green-100 text-green-700' 
            : trackingData.communication.gpsSignal === 'weak'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-red-100 text-red-700'
        }`}>
          <Signal className="w-4 h-4" />
        </div>
        
        <div className={`flex items-center justify-center p-2 rounded-lg ${
          trackingData.communication.wifiConnected 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          <Wifi className="w-4 h-4" />
        </div>
        
        <div className={`flex items-center justify-center p-2 rounded-lg ${
          getConnectionQualityColor(trackingData.communication.connectionQuality)
        }`}>
          <Database className="w-4 h-4" />
        </div>
        
        <div className={`flex items-center justify-center p-2 rounded-lg ${
          trackingData.vehicle.engineStatus === 'normal' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          <Shield className="w-4 h-4" />
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={isTracking ? stopTracking : startTracking}
            disabled={isLoading}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isTracking 
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {isTracking ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Stop Tracking</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Start Tracking</span>
              </>
            )}
          </button>
          
          <button
            onClick={fetchTrackingData}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Cloud className="w-4 h-4" />
          <span>Last sync: {trackingData.communication.lastSync.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-xl"
        >
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 animate-spin text-green-600" />
            <span className="text-sm text-gray-600">
              {isTracking ? 'Starting tracking...' : 'Stopping tracking...'}
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default RealTimeTracking;
