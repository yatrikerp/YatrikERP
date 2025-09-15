import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Brain, BarChart3, MapPin, Navigation, Phone,
  Wifi, Settings, Monitor, Plus, Eye, Edit, RefreshCw,
  AlertTriangle, CheckCircle, XCircle, Clock, Battery, Signal,
  Thermometer, Shield, Zap, TrendingUp, Users, Fuel, Wrench,
  Database, Cloud, Fingerprint, Grid, Star, Award
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const BusOperationsPanel = ({ 
  bus, 
  onOperationComplete, 
  realTimeData = {}, 
  isActive = false 
}) => {
  const [operationStatus, setOperationStatus] = useState({
    start: false,
    ai: false,
    analytics: false,
    liveTracking: false,
    gps: false,
    communication: false,
    emergency: false
  });

  const [systemStatus, setSystemStatus] = useState({
    cloudSync: true,
    lastSync: new Date(),
    systemHealth: 'active',
    connectionQuality: 'good'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Enhanced error handling
  const handleError = useCallback((error, operation) => {
    console.error(`${operation} error:`, error);
    setError(`${operation} failed: ${error.message}`);
    toast.error(`${operation} operation failed`);
  }, []);

  // Start Operation
  const handleStart = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/buses/${bus._id}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          driverId: bus.assignedDriver,
          conductorId: bus.assignedConductor,
          tripId: bus.currentTrip
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setOperationStatus(prev => ({ ...prev, start: true }));
        toast.success('Bus operations started successfully');
        onOperationComplete?.('start', result);
      } else {
        throw new Error(result.message || 'Failed to start operations');
      }
    } catch (error) {
      handleError(error, 'Start');
    } finally {
      setIsLoading(false);
    }
  };

  // AI Operations
  const handleAI = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/buses/${bus._id}/ai-analysis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          analysisType: 'performance',
          includeRecommendations: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setOperationStatus(prev => ({ ...prev, ai: true }));
        toast.success('AI analysis completed');
        onOperationComplete?.('ai', result);
      } else {
        throw new Error(result.message || 'AI analysis failed');
      }
    } catch (error) {
      handleError(error, 'AI Analysis');
    } finally {
      setIsLoading(false);
    }
  };

  // Analytics Operation
  const handleAnalytics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/buses/${bus._id}/analytics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setOperationStatus(prev => ({ ...prev, analytics: true }));
        toast.success('Analytics data retrieved');
        onOperationComplete?.('analytics', result);
      } else {
        throw new Error(result.message || 'Analytics retrieval failed');
      }
    } catch (error) {
      handleError(error, 'Analytics');
    } finally {
      setIsLoading(false);
    }
  };

  // Live Tracking
  const handleLiveTracking = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tracking/bus/${bus._id}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setOperationStatus(prev => ({ ...prev, liveTracking: true }));
        toast.success('Live tracking activated');
        onOperationComplete?.('liveTracking', result);
      } else {
        throw new Error(result.message || 'Live tracking activation failed');
      }
    } catch (error) {
      handleError(error, 'Live Tracking');
    } finally {
      setIsLoading(false);
    }
  };

  // GPS Operation
  const handleGPS = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tracking/bus/${bus._id}/gps`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setOperationStatus(prev => ({ ...prev, gps: true }));
        toast.success('GPS tracking activated');
        onOperationComplete?.('gps', result);
      } else {
        throw new Error(result.message || 'GPS activation failed');
      }
    } catch (error) {
      handleError(error, 'GPS');
    } finally {
      setIsLoading(false);
    }
  };

  // Communication
  const handleCommunication = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/buses/${bus._id}/communication`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'emergency_contact',
          priority: 'normal'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setOperationStatus(prev => ({ ...prev, communication: true }));
        toast.success('Communication system activated');
        onOperationComplete?.('communication', result);
      } else {
        throw new Error(result.message || 'Communication activation failed');
      }
    } catch (error) {
      handleError(error, 'Communication');
    } finally {
      setIsLoading(false);
    }
  };

  // Emergency System
  const handleEmergency = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/buses/${bus._id}/emergency`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emergencyType: 'system_check',
          location: bus.currentLocation,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setOperationStatus(prev => ({ ...prev, emergency: true }));
        toast.success('Emergency system verified');
        onOperationComplete?.('emergency', result);
      } else {
        throw new Error(result.message || 'Emergency system check failed');
      }
    } catch (error) {
      handleError(error, 'Emergency System');
    } finally {
      setIsLoading(false);
    }
  };

  // Cloud Sync
  const handleCloudSync = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/buses/${bus._id}/sync`, {
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
        setSystemStatus(prev => ({ 
          ...prev, 
          lastSync: new Date(),
          cloudSync: true 
        }));
        toast.success('Cloud sync completed');
        onOperationComplete?.('cloudSync', result);
      } else {
        throw new Error(result.message || 'Cloud sync failed');
      }
    } catch (error) {
      handleError(error, 'Cloud Sync');
      setSystemStatus(prev => ({ ...prev, cloudSync: false }));
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh system status
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStatus(prev => ({
        ...prev,
        lastSync: new Date()
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

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

  const getOperationButtonStyle = (operation, isActive) => {
    const baseStyle = "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200";
    
    if (isActive) {
      return `${baseStyle} bg-green-100 text-green-700 border border-green-200`;
    }
    
    if (isLoading) {
      return `${baseStyle} bg-gray-100 text-gray-500 cursor-not-allowed`;
    }
    
    return `${baseStyle} bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
            <Database className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{bus.busNumber}</h3>
            <p className="text-sm text-gray-600">{bus.registrationNumber}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            systemStatus.cloudSync ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="text-sm text-gray-600">Cloud Sync</span>
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

      {/* Main Operations Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {/* Start Operation */}
        <button
          onClick={handleStart}
          disabled={isLoading || operationStatus.start}
          className={getOperationButtonStyle('start', operationStatus.start)}
        >
          {operationStatus.start ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          <span>Start</span>
        </button>

        {/* AI Operation */}
        <button
          onClick={handleAI}
          disabled={isLoading}
          className={getOperationButtonStyle('ai', operationStatus.ai)}
        >
          <Brain className="w-4 h-4" />
          <span>AI</span>
        </button>

        {/* Analytics */}
        <button
          onClick={handleAnalytics}
          disabled={isLoading}
          className={getOperationButtonStyle('analytics', operationStatus.analytics)}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics</span>
        </button>

        {/* Add Button */}
        <button
          onClick={() => toast.info('Add functionality coming soon')}
          className="flex items-center justify-center p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* View Button */}
        <button
          onClick={() => toast.info('View details functionality coming soon')}
          className="flex items-center justify-center p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Edit Button */}
        <button
          onClick={() => toast.info('Edit functionality coming soon')}
          className="flex items-center justify-center p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
        >
          <Edit className="w-4 h-4" />
        </button>
      </div>

      {/* Feature Indicators */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        <button
          onClick={handleLiveTracking}
          disabled={isLoading}
          className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-colors ${
            operationStatus.liveTracking 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Navigation className="w-5 h-5" />
          <span className="text-xs font-medium">Live Tracking</span>
        </button>

        <button
          onClick={handleGPS}
          disabled={isLoading}
          className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-colors ${
            operationStatus.gps 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span className="text-xs font-medium">GPS</span>
        </button>

        <button
          onClick={handleCommunication}
          disabled={isLoading}
          className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-colors ${
            operationStatus.communication 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Phone className="w-5 h-5" />
          <span className="text-xs font-medium">Comm</span>
        </button>

        <button
          onClick={handleEmergency}
          disabled={isLoading}
          className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-colors ${
            operationStatus.emergency 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
          <span className="text-xs font-medium">Emergency</span>
        </button>

        <button
          onClick={handleAI}
          disabled={isLoading}
          className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-colors ${
            operationStatus.ai 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Zap className="w-5 h-5" />
          <span className="text-xs font-medium">AI Boost</span>
        </button>
      </div>

      {/* Trip Details */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Clock className="w-4 h-4 text-gray-500" />
          </div>
          <p className="text-xs text-gray-600">Daily</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Users className="w-4 h-4 text-gray-500" />
          </div>
          <p className="text-xs text-gray-600">{bus.capacity?.total || 0} Smart Seats</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <TrendingUp className="w-4 h-4 text-gray-500" />
          </div>
          <p className="text-xs text-gray-600">₹{bus.fare || 200}</p>
        </div>
      </div>

      {/* Status/Metrics */}
      <div className="mb-6">
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">System Status</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {systemStatus.systemHealth === 'active' ? 'Normal Operations' : 'Attention Required'}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Eye className="w-4 h-4 text-gray-500" />
            </div>
            <p className="text-sm font-bold text-gray-900">85%</p>
            <p className="text-xs text-gray-500">Visibility</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Users className="w-4 h-4 text-gray-500" />
            </div>
            <p className="text-sm font-bold text-gray-900">72%</p>
            <p className="text-xs text-gray-500">Occupancy</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Settings className="w-4 h-4 text-gray-500" />
            </div>
            <p className="text-sm font-bold text-gray-900">98%</p>
            <p className="text-xs text-gray-500">Efficiency</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleCloudSync}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
          >
            <Cloud className="w-4 h-4" />
            <span>Cloud Sync</span>
          </button>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Database className="w-4 h-4" />
            <span>{systemStatus.lastSync.toLocaleDateString()}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Shield className="w-4 h-4" />
            <span>Active</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <Fingerprint className="w-4 h-4 text-gray-400" />
          <Grid className="w-4 h-4 text-gray-400" />
          <CheckCircle className="w-4 h-4 text-green-500" />
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
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-sm text-gray-600">Processing...</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BusOperationsPanel;
