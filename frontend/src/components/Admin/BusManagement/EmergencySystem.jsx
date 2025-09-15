import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Phone, MapPin, Clock, Users, Car, Shield,
  CheckCircle, XCircle, Wifi, Signal, Battery, Thermometer,
  Navigation, MessageSquare, Video, Mic, Send, RefreshCw,
  Bell, Siren, Heart, Zap, Lock, Unlock, Eye, EyeOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const EmergencySystem = ({ bus, onEmergencyResolved, isActive = false }) => {
  const [emergencyStatus, setEmergencyStatus] = useState({
    isActive: false,
    type: null,
    severity: 'low',
    location: null,
    timestamp: null,
    affectedPassengers: 0,
    responseTeam: [],
    communication: {
      driver: false,
      conductor: false,
      controlRoom: false,
      emergencyServices: false
    }
  });

  const [systemChecks, setSystemChecks] = useState({
    gps: true,
    communication: true,
    emergencyButton: true,
    panicAlarm: true,
    locationTracking: true,
    passengerCount: true
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);

  // Enhanced error handling
  const handleError = useCallback((error, operation) => {
    console.error(`${operation} error:`, error);
    setError(`${operation} failed: ${error.message}`);
    toast.error(`${operation} operation failed`);
  }, []);

  // Initialize emergency system
  const initializeEmergencySystem = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/buses/${bus._id}/emergency/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          busId: bus._id,
          location: bus.currentLocation,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setEmergencyStatus(prev => ({
          ...prev,
          location: bus.currentLocation,
          timestamp: new Date(),
          isActive: true
        }));
        toast.success('Emergency system initialized');
      } else {
        throw new Error(result.message || 'Emergency system initialization failed');
      }
    } catch (error) {
      handleError(error, 'Emergency System Initialization');
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger emergency
  const triggerEmergency = async (type, severity = 'high') => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/buses/${bus._id}/emergency/trigger`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emergencyType: type,
          severity: severity,
          location: bus.currentLocation,
          timestamp: new Date().toISOString(),
          busNumber: bus.busNumber,
          passengerCount: bus.capacity?.total || 0
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setEmergencyStatus(prev => ({
          ...prev,
          isActive: true,
          type: type,
          severity: severity,
          timestamp: new Date(),
          affectedPassengers: result.affectedPassengers || 0,
          responseTeam: result.responseTeam || []
        }));
        
        // Add emergency message
        addMessage({
          id: Date.now(),
          type: 'emergency',
          message: `Emergency triggered: ${type}`,
          timestamp: new Date(),
          severity: severity
        });

        toast.error(`Emergency triggered: ${type}`);
      } else {
        throw new Error(result.message || 'Emergency trigger failed');
      }
    } catch (error) {
      handleError(error, 'Emergency Trigger');
    } finally {
      setIsLoading(false);
    }
  };

  // Send emergency communication
  const sendEmergencyCommunication = async (recipient, message) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/buses/${bus._id}/emergency/communicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient: recipient,
          message: message,
          emergencyType: emergencyStatus.type,
          location: bus.currentLocation,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setEmergencyStatus(prev => ({
          ...prev,
          communication: {
            ...prev.communication,
            [recipient]: true
          }
        }));

        addMessage({
          id: Date.now(),
          type: 'communication',
          message: `Message sent to ${recipient}: ${message}`,
          timestamp: new Date(),
          severity: 'info'
        });

        toast.success(`Message sent to ${recipient}`);
      } else {
        throw new Error(result.message || 'Communication failed');
      }
    } catch (error) {
      handleError(error, 'Emergency Communication');
    } finally {
      setIsLoading(false);
    }
  };

  // Resolve emergency
  const resolveEmergency = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/buses/${bus._id}/emergency/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resolution: 'System check completed',
          timestamp: new Date().toISOString(),
          resolvedBy: 'system'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setEmergencyStatus(prev => ({
          ...prev,
          isActive: false,
          type: null,
          severity: 'low'
        }));

        addMessage({
          id: Date.now(),
          type: 'resolution',
          message: 'Emergency resolved successfully',
          timestamp: new Date(),
          severity: 'success'
        });

        toast.success('Emergency resolved');
        onEmergencyResolved?.(result);
      } else {
        throw new Error(result.message || 'Emergency resolution failed');
      }
    } catch (error) {
      handleError(error, 'Emergency Resolution');
    } finally {
      setIsLoading(false);
    }
  };

  // Add message to communication log
  const addMessage = (message) => {
    setMessages(prev => [message, ...prev.slice(0, 9)]); // Keep last 10 messages
  };

  // Perform system checks
  const performSystemChecks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/buses/${bus._id}/emergency/system-check`, {
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
        setSystemChecks(result.systemChecks);
        
        // Check if all systems are operational
        const allSystemsOperational = Object.values(result.systemChecks).every(check => check === true);
        
        if (allSystemsOperational) {
          toast.success('All emergency systems operational');
        } else {
          toast.warning('Some emergency systems need attention');
        }
      } else {
        throw new Error(result.message || 'System check failed');
      }
    } catch (error) {
      handleError(error, 'System Check');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh system status
  useEffect(() => {
    if (isActive) {
      const interval = setInterval(performSystemChecks, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
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

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityTextColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-50 border-red-200';
      case 'high': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-700 bg-green-50 border-green-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
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
          <div className={`p-3 rounded-xl ${
            emergencyStatus.isActive 
              ? 'bg-red-100' 
              : 'bg-green-100'
          }`}>
            <AlertTriangle className={`w-6 h-6 ${
              emergencyStatus.isActive 
                ? 'text-red-600' 
                : 'text-green-600'
            }`} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Emergency System</h3>
            <p className="text-sm text-gray-600">
              {emergencyStatus.isActive ? 'EMERGENCY ACTIVE' : 'System Ready'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            emergencyStatus.isActive ? 'bg-red-500 animate-pulse' : 'bg-green-500'
          }`}></div>
          <span className="text-sm text-gray-600">
            {emergencyStatus.isActive ? 'Emergency' : 'Normal'}
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

      {/* Emergency Status */}
      {emergencyStatus.isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`mb-6 p-4 rounded-lg border-l-4 ${getSeverityTextColor(emergencyStatus.severity)}`}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold">Emergency Active</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              getSeverityTextColor(emergencyStatus.severity)
            }`}>
              {emergencyStatus.severity?.toUpperCase()}
            </span>
          </div>
          <p className="text-sm mb-2">Type: {emergencyStatus.type}</p>
          <p className="text-sm mb-2">Location: {emergencyStatus.location?.stopName || 'Unknown'}</p>
          <p className="text-sm">Time: {emergencyStatus.timestamp?.toLocaleTimeString()}</p>
        </motion.div>
      )}

      {/* System Status Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <div className={`p-3 rounded-lg flex items-center space-x-2 ${
          systemChecks.gps ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          <MapPin className="w-4 h-4" />
          <span className="text-sm font-medium">GPS</span>
        </div>
        
        <div className={`p-3 rounded-lg flex items-center space-x-2 ${
          systemChecks.communication ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          <Phone className="w-4 h-4" />
          <span className="text-sm font-medium">Communication</span>
        </div>
        
        <div className={`p-3 rounded-lg flex items-center space-x-2 ${
          systemChecks.emergencyButton ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">Emergency Button</span>
        </div>
        
        <div className={`p-3 rounded-lg flex items-center space-x-2 ${
          systemChecks.panicAlarm ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          <Siren className="w-4 h-4" />
          <span className="text-sm font-medium">Panic Alarm</span>
        </div>
        
        <div className={`p-3 rounded-lg flex items-center space-x-2 ${
          systemChecks.locationTracking ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          <Navigation className="w-4 h-4" />
          <span className="text-sm font-medium">Location Tracking</span>
        </div>
        
        <div className={`p-3 rounded-lg flex items-center space-x-2 ${
          systemChecks.passengerCount ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          <Users className="w-4 h-4" />
          <span className="text-sm font-medium">Passenger Count</span>
        </div>
      </div>

      {/* Emergency Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <button
          onClick={() => triggerEmergency('medical', 'high')}
          disabled={isLoading}
          className="flex flex-col items-center space-y-2 p-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          <Heart className="w-5 h-5" />
          <span className="text-xs font-medium">Medical</span>
        </button>
        
        <button
          onClick={() => triggerEmergency('mechanical', 'medium')}
          disabled={isLoading}
          className="flex flex-col items-center space-y-2 p-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
        >
          <Car className="w-5 h-5" />
          <span className="text-xs font-medium">Mechanical</span>
        </button>
        
        <button
          onClick={() => triggerEmergency('security', 'high')}
          disabled={isLoading}
          className="flex flex-col items-center space-y-2 p-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
        >
          <Shield className="w-5 h-5" />
          <span className="text-xs font-medium">Security</span>
        </button>
        
        <button
          onClick={() => triggerEmergency('fire', 'critical')}
          disabled={isLoading}
          className="flex flex-col items-center space-y-2 p-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          <Zap className="w-5 h-5" />
          <span className="text-xs font-medium">Fire</span>
        </button>
      </div>

      {/* Communication Panel */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">Emergency Communication</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => sendEmergencyCommunication('driver', 'Emergency assistance required')}
            disabled={isLoading || !emergencyStatus.isActive}
            className={`flex items-center space-x-2 p-3 rounded-lg transition-colors ${
              emergencyStatus.communication.driver
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span className="text-sm">Driver</span>
          </button>
          
          <button
            onClick={() => sendEmergencyCommunication('controlRoom', 'Emergency situation reported')}
            disabled={isLoading || !emergencyStatus.isActive}
            className={`flex items-center space-x-2 p-3 rounded-lg transition-colors ${
              emergencyStatus.communication.controlRoom
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm">Control Room</span>
          </button>
          
          <button
            onClick={() => sendEmergencyCommunication('emergencyServices', 'Emergency services required')}
            disabled={isLoading || !emergencyStatus.isActive}
            className={`flex items-center space-x-2 p-3 rounded-lg transition-colors ${
              emergencyStatus.communication.emergencyServices
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span className="text-sm">Emergency Services</span>
          </button>
          
          <button
            onClick={() => sendEmergencyCommunication('conductor', 'Emergency protocol activated')}
            disabled={isLoading || !emergencyStatus.isActive}
            className={`flex items-center space-x-2 p-3 rounded-lg transition-colors ${
              emergencyStatus.communication.conductor
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-sm">Conductor</span>
          </button>
        </div>
      </div>

      {/* Communication Log */}
      {messages.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Communication Log</h4>
          <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
            {messages.map((message) => (
              <div key={message.id} className="flex items-start space-x-2 mb-2 text-sm">
                <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(message.severity)}`}></div>
                <div className="flex-1">
                  <p className="text-gray-700">{message.message}</p>
                  <p className="text-xs text-gray-500">{message.timestamp.toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          onClick={performSystemChecks}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>System Check</span>
        </button>
        
        {emergencyStatus.isActive && (
          <button
            onClick={resolveEmergency}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Resolve Emergency</span>
          </button>
        )}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-xl"
        >
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 animate-spin text-red-600" />
            <span className="text-sm text-gray-600">Processing emergency...</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EmergencySystem;
