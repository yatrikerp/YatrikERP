import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Brain, TrendingUp, AlertTriangle, 
  CheckCircle, Activity, Fuel, Wrench, Star,
  Lightbulb, RefreshCw, Cloud,
  Database, Shield, Fingerprint, Grid,
  Play, Pause, BarChart3, 
  MapPin, Phone, Users, Eye, Calendar,
  Plus, Edit, Wifi, Monitor,
  Globe, MessageCircle, Bell, Zap, Target,
  Clock, User, Bus, Calendar as CalendarIcon,
  Battery, Thermometer, Gauge,
  Signal, SignalHigh, SignalLow,
  Route, Timer, Gauge as SpeedIcon,
  ChevronDown, ChevronUp, MoreHorizontal,
  Download, Share, Bookmark, Search, Filter
} from 'lucide-react';
import { LineChart, Line, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Pie } from 'recharts';

// Trip Schedule Card Component
const TripScheduleCard = ({ trip, index, onAction, isLoading }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const startTime = new Date(trip.startTime);
  const endTime = new Date(trip.endTime);
  const tripDate = new Date(trip.date);
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'scheduled': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in-progress': return 'In Progress';
      case 'scheduled': return 'Scheduled';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const occupancyPercentage = Math.round((trip.bookedSeats / trip.capacity) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Bus className="w-6 h-6 text-white" />
              </div>
              <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(trip.status)}`}></div>
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900">{trip.busNumber}</h4>
              <p className="text-sm text-gray-600 font-medium">{trip.route}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(trip.status)}`}>
              {getStatusText(trip.status)}
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
            </button>
          </div>
        </div>

        {/* Trip Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-gray-900">{startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
            <p className="text-xs text-gray-600">Departure</p>
          </div>
          
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <Clock className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-gray-900">{endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
            <p className="text-xs text-gray-600">Arrival</p>
          </div>
          
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <Users className="w-5 h-5 text-purple-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-gray-900">{trip.bookedSeats}/{trip.capacity}</p>
            <p className="text-xs text-gray-600">Occupancy</p>
          </div>
          
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <Target className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-gray-900">₹{trip.fare}</p>
            <p className="text-xs text-gray-600">Fare</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h5 className="text-lg font-bold text-gray-900">Trip Details</h5>
            <p className="text-sm text-gray-600">{tripDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900">{trip.driver}</p>
            <p className="text-xs text-gray-600">Driver</p>
          </div>
        </div>

        {/* Route Information */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MapPin className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{trip.departure}</p>
                <p className="text-xs text-gray-600">Departure</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <Bus className="w-4 h-4 text-gray-400" />
            <div className="w-8 h-0.5 bg-gray-300"></div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <MapPin className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{trip.arrival}</p>
                <p className="text-xs text-gray-600">Arrival</p>
              </div>
            </div>
          </div>
        </div>

        {/* Occupancy Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Occupancy</span>
            <span className="text-sm font-bold text-gray-900">{occupancyPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                occupancyPercentage > 80 ? 'bg-red-500' : 
                occupancyPercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${occupancyPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onAction(trip._id, 'start')}
            disabled={isLoading || trip.status === 'completed'}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {trip.status === 'in-progress' ? 'In Progress' : 'Start Trip'}
          </button>
          
          <button
            onClick={() => onAction(trip._id, 'view')}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 text-sm font-medium"
          >
            View Details
          </button>
          
          <button
            onClick={() => onAction(trip._id, 'edit')}
            disabled={trip.status === 'completed'}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            Edit
          </button>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h6 className="text-sm font-bold text-gray-700 mb-2">Trip Information</h6>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Duration:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round((endTime - startTime) / (1000 * 60 * 60))} hours
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Available Seats:</span>
                    <span className="text-sm font-medium text-gray-900">{trip.capacity - trip.bookedSeats}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Trip ID:</span>
                    <span className="text-sm font-medium text-gray-900">{trip._id}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h6 className="text-sm font-bold text-gray-700 mb-2">Performance</h6>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Revenue:</span>
                    <span className="text-sm font-medium text-gray-900">₹{trip.bookedSeats * trip.fare}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Efficiency:</span>
                    <span className="text-sm font-medium text-gray-900">{occupancyPercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`text-sm font-medium ${getStatusColor(trip.status).replace('bg-', 'text-')}`}>
                      {getStatusText(trip.status)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// Enhanced Bus Card Component
const BusCard = ({ bus, index, busStatus, busFeatures, onAction, onToggleFeature, onViewDetails, isLoading }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const isActive = busStatus === 'start';
  const features = busFeatures || {};
  
  const cardData = [
    {
      title: "Ordinary",
      subtitle: "due to the Sabirimala",
      busId: bus.busNumber || "KL02H0355",
      route: bus.route?.name || "National Express",
      timing: bus.schedule?.startTime && bus.schedule?.endTime 
        ? `${bus.schedule.startTime} - ${bus.schedule.endTime}` 
        : "08:00 - 11:45",
      driver: bus.driver?.name || "Ram",
      seats: bus.capacity || 38,
      price: bus.fare || 200,
      status: bus.status || "normal trips",
      performance: {
        target: bus.insights?.performanceScore || 85,
        occupancy: bus.insights?.occupancyRate || 72,
        efficiency: bus.insights?.efficiencyScore || 98
      },
      // Enhanced data
      fuelLevel: bus.fuel?.currentLevel || 75,
      temperature: bus.sensors?.temperature || 24,
      speed: bus.currentLocation?.speed || 0,
      distance: bus.trip?.distance || 0,
      nextStop: bus.route?.nextStop || "Central Station",
      eta: bus.route?.eta || "15 min",
      signalStrength: bus.connectivity?.signalStrength || 85,
      batteryLevel: bus.systems?.batteryLevel || 92,
      passengerCount: bus.passengers?.current || 28,
      maxPassengers: bus.capacity || 38,
      lastUpdate: bus.lastUpdate || new Date(),
      alerts: bus.alerts || [],
      maintenance: bus.maintenance || { nextService: "2024-02-15", mileage: 45000 }
    },
    {
      title: "MINNAL",
      subtitle: "FASREST",
      busId: bus.busNumber || "AI-Assigned",
      route: bus.route?.name || "Dynamic Route",
      timing: bus.schedule?.startTime && bus.schedule?.endTime 
        ? `${bus.schedule.startTime} - ${bus.schedule.endTime}` 
        : "13:05 - 16:37",
      driver: bus.driver?.name || "Ram",
      seats: bus.capacity || 30,
      price: bus.fare || 130,
      status: bus.status || "Correct timing",
      performance: {
        target: bus.insights?.performanceScore || 85,
        occupancy: bus.insights?.occupancyRate || 72,
        efficiency: bus.insights?.efficiencyScore || 98
      },
      // Enhanced data
      fuelLevel: bus.fuel?.currentLevel || 45,
      temperature: bus.sensors?.temperature || 26,
      speed: bus.currentLocation?.speed || 0,
      distance: bus.trip?.distance || 0,
      nextStop: bus.route?.nextStop || "Airport Terminal",
      eta: bus.route?.eta || "8 min",
      signalStrength: bus.connectivity?.signalStrength || 78,
      batteryLevel: bus.systems?.batteryLevel || 88,
      passengerCount: bus.passengers?.current || 22,
      maxPassengers: bus.capacity || 30,
      lastUpdate: bus.lastUpdate || new Date(),
      alerts: bus.alerts || [],
      maintenance: bus.maintenance || { nextService: "2024-02-20", mileage: 52000 }
    }
  ];

  const data = cardData[index] || cardData[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500"
    >
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-3xl shadow-xl">
                <Database className="w-10 h-10 text-white" />
              </div>
              <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full border-3 border-white ${
                isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}></div>
            </div>
            <div>
              <h4 className="text-4xl font-bold text-gray-900 mb-2">{data.title}</h4>
              <p className="text-lg text-gray-600 font-medium mb-3">{data.subtitle}</p>
              <div className="flex items-center space-x-3">
                <span className="text-sm bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-bold">
                  {data.busId}
                </span>
                <span className={`text-sm px-4 py-2 rounded-full font-bold ${
                  isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Enhanced Status Indicators */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {data.signalStrength > 80 ? <SignalHigh className="w-6 h-6 text-green-500" /> :
                 data.signalStrength > 50 ? <Signal className="w-6 h-6 text-yellow-500" /> :
                 <SignalLow className="w-6 h-6 text-red-500" />}
                <span className="text-sm font-bold text-gray-600">{data.signalStrength}%</span>
              </div>
              <Wifi className="w-6 h-6 text-gray-500" />
              <Users className="w-6 h-6 text-gray-500" />
              <Monitor className="w-6 h-6 text-gray-500" />
            </div>
            
            {/* Expand/Collapse Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isExpanded ? <ChevronUp className="w-6 h-6 text-gray-600" /> : <ChevronDown className="w-6 h-6 text-gray-600" />}
            </button>
          </div>
        </div>

        {/* Real-time Status Bar */}
        <div className="flex items-center justify-between bg-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <Battery className="w-6 h-6 text-green-500" />
              <span className="text-lg font-bold text-gray-700">{data.batteryLevel}%</span>
            </div>
            <div className="flex items-center space-x-3">
              <Fuel className="w-6 h-6 text-blue-500" />
              <span className="text-lg font-bold text-gray-700">{data.fuelLevel}%</span>
            </div>
            <div className="flex items-center space-x-3">
              <Thermometer className="w-6 h-6 text-orange-500" />
              <span className="text-lg font-bold text-gray-700">{data.temperature}°C</span>
            </div>
            <div className="flex items-center space-x-3">
              <SpeedIcon className="w-6 h-6 text-purple-500" />
              <span className="text-lg font-bold text-gray-700">{data.speed} km/h</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Users className="w-6 h-6 text-gray-500" />
              <span className="text-lg font-bold text-gray-700">{data.passengerCount}/{data.maxPassengers}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-6 h-6 text-gray-500" />
              <span className="text-lg font-bold text-gray-700">{data.nextStop}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Timer className="w-6 h-6 text-gray-500" />
              <span className="text-lg font-bold text-gray-700">{data.eta}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Action Buttons */}
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h5 className="text-2xl font-bold text-gray-900">Control Panel</h5>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all duration-200"
            >
              <MoreHorizontal className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => onAction(bus._id, isActive ? 'stop' : 'start')}
            disabled={isLoading}
            className={`p-6 rounded-3xl text-lg font-bold transition-all duration-300 disabled:opacity-50 shadow-xl hover:shadow-2xl ${
              isActive 
                ? 'bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700' 
                : 'bg-gradient-to-br from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
            }`}
          >
            <div className="flex flex-col items-center space-y-3">
              {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
              <span>{isActive ? 'Stop' : 'Start'}</span>
            </div>
          </button>
          
          <button
            onClick={() => onAction(bus._id, 'ai_boost')}
            disabled={isLoading}
            className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-3xl text-lg font-bold hover:from-purple-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 shadow-xl hover:shadow-2xl"
          >
            <div className="flex flex-col items-center space-y-3">
              <Brain className="w-8 h-8" />
              <span>AI Boost</span>
            </div>
          </button>
          
          <button
            onClick={() => onAction(bus._id, 'analytics')}
            disabled={isLoading}
            className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-3xl text-lg font-bold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 shadow-xl hover:shadow-2xl"
          >
            <div className="flex flex-col items-center space-y-3">
              <BarChart3 className="w-8 h-8" />
              <span>Analytics</span>
            </div>
          </button>
          
          <button
            onClick={onViewDetails}
            className="p-6 bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded-3xl text-lg font-bold hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-xl hover:shadow-2xl"
          >
            <div className="flex flex-col items-center space-y-3">
              <Eye className="w-8 h-8" />
              <span>Details</span>
            </div>
          </button>
        </div>

        {/* Secondary Action Buttons */}
        <div className="flex items-center space-x-3 mb-6">
          <button
            onClick={() => onAction(bus._id, 'add')}
            disabled={isLoading}
            className="p-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 disabled:opacity-50"
            title="Add Feature"
          >
            <Plus className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => onAction(bus._id, 'edit')}
            disabled={isLoading}
            className="p-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 disabled:opacity-50"
            title="Edit Bus"
          >
            <Edit className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => onAction(bus._id, 'share')}
            disabled={isLoading}
            className="p-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 disabled:opacity-50"
            title="Share Bus Info"
          >
            <Share className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => onAction(bus._id, 'download')}
            disabled={isLoading}
            className="p-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 disabled:opacity-50"
            title="Download Report"
          >
            <Download className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => onAction(bus._id, 'bookmark')}
            disabled={isLoading}
            className="p-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 disabled:opacity-50"
            title="Bookmark Bus"
          >
            <Bookmark className="w-6 h-6" />
          </button>
        </div>

        {/* Enhanced Key Information Grid */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="flex items-center space-x-6 p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-3xl border border-blue-200 shadow-lg">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl">
              <Bus className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-blue-600 uppercase tracking-wide mb-1">SMART BUS</p>
              <p className="text-2xl font-bold text-gray-900 mb-1">{data.busId}</p>
              <p className="text-sm text-gray-600">Fleet ID: {data.busId}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6 p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-3xl border border-green-200 shadow-lg">
            <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl">
              <Route className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-green-600 uppercase tracking-wide mb-1">ROUTE</p>
              <p className="text-2xl font-bold text-gray-900 mb-1">{data.route}</p>
              <p className="text-sm text-gray-600">Next: {data.nextStop}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6 p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-3xl border border-purple-200 shadow-lg">
            <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-purple-600 uppercase tracking-wide mb-1">SMART TIMING</p>
              <p className="text-2xl font-bold text-gray-900 mb-1">{data.timing}</p>
              <p className="text-sm text-gray-600">ETA: {data.eta}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6 p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-3xl border border-orange-200 shadow-lg">
            <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-orange-600 uppercase tracking-wide mb-1">DRIVER</p>
              <p className="text-2xl font-bold text-gray-900 mb-1">{data.driver}</p>
              <p className="text-sm text-gray-600">Experience: 5+ years</p>
            </div>
          </div>
        </div>

        {/* Enhanced Feature Indicators */}
        <div className="mb-8">
          <h6 className="text-xl font-bold text-gray-700 mb-4">System Features</h6>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <button
              onClick={() => onToggleFeature(bus._id, 'live_tracking')}
              className={`p-4 rounded-2xl text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl ${
                features.live_tracking 
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <Globe className="w-6 h-6" />
                <span>Live Tracking</span>
              </div>
            </button>
            
            <button
              onClick={() => onToggleFeature(bus._id, 'gps')}
              className={`p-4 rounded-2xl text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl ${
                features.gps 
                  ? 'bg-gradient-to-br from-green-500 to-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <MapPin className="w-6 h-6" />
                <span>GPS</span>
              </div>
            </button>
            
            <button
              onClick={() => onToggleFeature(bus._id, 'communication')}
              className={`p-4 rounded-2xl text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl ${
                features.communication 
                  ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <MessageCircle className="w-6 h-6" />
                <span>Comm</span>
              </div>
            </button>
            
            <button
              onClick={() => onToggleFeature(bus._id, 'emergency')}
              className={`p-4 rounded-2xl text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl ${
                features.emergency 
                  ? 'bg-gradient-to-br from-red-500 to-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <Bell className="w-6 h-6" />
                <span>Emergency</span>
              </div>
            </button>
            
            <button
              onClick={() => onToggleFeature(bus._id, 'ai_boost')}
              className={`p-4 rounded-2xl text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl ${
                features.ai_boost 
                  ? 'bg-gradient-to-br from-pink-500 to-pink-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <Zap className="w-6 h-6" />
                <span>AI Boost</span>
              </div>
            </button>
          </div>
        </div>

        {/* Expandable Detailed Section */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl p-8 border border-gray-200 shadow-lg">
              <h6 className="text-2xl font-bold text-gray-900 mb-6">Detailed Information</h6>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* System Status */}
                <div className="space-y-4">
                  <h7 className="text-lg font-bold text-gray-700">System Status</h7>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-base text-gray-600">Engine</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-base font-bold text-gray-900">Running</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-base text-gray-600">Brakes</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-base font-bold text-gray-900">OK</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-base text-gray-600">Tires</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-base font-bold text-gray-900">Check</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Passenger Info */}
                <div className="space-y-4">
                  <h7 className="text-lg font-bold text-gray-700">Passenger Information</h7>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-base text-gray-600">Current</span>
                      <span className="text-lg font-bold text-gray-900">{data.passengerCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-base text-gray-600">Capacity</span>
                      <span className="text-lg font-bold text-gray-900">{data.maxPassengers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-base text-gray-600">Occupancy</span>
                      <span className="text-lg font-bold text-gray-900">{Math.round((data.passengerCount / data.maxPassengers) * 100)}%</span>
                    </div>
                  </div>
                </div>

                {/* Maintenance Info */}
                <div className="space-y-4">
                  <h7 className="text-lg font-bold text-gray-700">Maintenance</h7>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-base text-gray-600">Next Service</span>
                      <span className="text-lg font-bold text-gray-900">{data.maintenance.nextService}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-base text-gray-600">Mileage</span>
                      <span className="text-lg font-bold text-gray-900">{data.maintenance.mileage.toLocaleString()} km</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-base text-gray-600">Last Update</span>
                      <span className="text-lg font-bold text-gray-900">{new Date(data.lastUpdate).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Enhanced Capacity & Pricing */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-3xl p-6 mb-8 border border-indigo-200 shadow-lg">
          <h6 className="text-xl font-bold text-gray-700 mb-4">Service Information</h6>
          <div className="grid grid-cols-3 gap-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-indigo-500 rounded-xl">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Schedule</p>
                <p className="text-lg font-bold text-gray-900">Daily</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-500 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Capacity</p>
                <p className="text-lg font-bold text-gray-900">{data.seats} Smart Seats</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-500 rounded-xl">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Fare</p>
                <p className="text-lg font-bold text-gray-900">₹{data.price}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Performance & Status */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-6 mb-8 border border-emerald-200 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-500 rounded-xl">
                <AlertTriangle className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">Status: {data.status}</p>
                <p className="text-sm text-gray-600">Last updated: {new Date(data.lastUpdate).toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-5 bg-white rounded-2xl shadow-lg">
              <div className="flex items-center justify-center mb-3">
                <Target className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{data.performance.target}%</p>
              <p className="text-sm text-gray-600">Performance</p>
            </div>
            <div className="text-center p-5 bg-white rounded-2xl shadow-lg">
              <div className="flex items-center justify-center mb-3">
                <Users className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{data.performance.occupancy}%</p>
              <p className="text-sm text-gray-600">Occupancy</p>
            </div>
            <div className="text-center p-5 bg-white rounded-2xl shadow-lg">
              <div className="flex items-center justify-center mb-3">
                <Gauge className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{data.performance.efficiency}%</p>
              <p className="text-sm text-gray-600">Efficiency</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Footer */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-xl">
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-700">Cloud Sync</span>
            </div>
            <div className="flex items-center space-x-3">
              <CalendarIcon className="w-6 h-6 text-gray-500" />
              <span className="text-lg font-bold text-gray-700">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500 rounded-xl">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-700">Active</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onAction(bus._id, 'fingerprint')}
              className="p-3 bg-white text-gray-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              title="Biometric Access"
            >
              <Fingerprint className="w-6 h-6" />
            </button>
            <button
              onClick={() => onAction(bus._id, 'qr')}
              className="p-3 bg-white text-gray-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              title="QR Code"
            >
              <Grid className="w-6 h-6" />
            </button>
            <button
              onClick={() => onAction(bus._id, 'verify')}
              className="p-3 bg-white text-gray-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              title="System Verification"
            >
              <CheckCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const AIInsightsDashboard = ({ buses = [], onClose }) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('week');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [showBusDetails, setShowBusDetails] = useState(false);
  const [busStatuses, setBusStatuses] = useState({});
  const [busFeatures, setBusFeatures] = useState({});
  const [showBusCards, setShowBusCards] = useState(true);
  
  // Scheduled trips state
  const [scheduledTrips, setScheduledTrips] = useState([]);
  const [showScheduledTrips, setShowScheduledTrips] = useState(true);
  const [tripsLoading, setTripsLoading] = useState(false);

  // Enhanced error handling and data validation
  const validateBusData = (bus) => {
    const errors = [];
    if (!bus._id) errors.push('Missing bus ID');
    if (!bus.busNumber) errors.push('Missing bus number');
    if (!bus.status) errors.push('Missing status');
    return errors;
  };

  // API Helper function
  const apiCall = async (endpoint, options = {}) => {
      const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token not found');
      return null;
    }

    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    try {
      const response = await fetch(endpoint, Object.assign({}, defaultOptions, options));
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error(`API call failed for ${endpoint}:`, err);
      throw err;
    }
  };

  // Real-time data fetching
  const fetchRealTimeData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await apiCall('/api/tracking/running-trips');
      if (data) {
        setLastSyncTime(new Date());
        setSuccessMessage('Real-time data updated successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError(`Failed to fetch real-time data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch scheduled trips from API
  const fetchScheduledTrips = useCallback(async () => {
    try {
      setTripsLoading(true);
      setError(null);
      
      const data = await apiCall('/api/trips/scheduled');
      if (data && data.trips) {
        setScheduledTrips(data.trips);
        setSuccessMessage('Scheduled trips updated successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError(`Failed to fetch scheduled trips: ${err.message}`);
      // Fallback to empty array if API fails
      setScheduledTrips([]);
    } finally {
      setTripsLoading(false);
    }
  }, []);

  // Cloud sync functionality
  const handleCloudSync = async () => {
    setIsCloudSyncing(true);
    try {
      setError(null);
      
      // Sync multiple data sources
      const [tripsData, busesData, analyticsData] = await Promise.all([
        apiCall('/api/tracking/running-trips'),
        apiCall('/api/buses'),
        apiCall('/api/analytics/fleet-performance')
      ]);

      if (tripsData && busesData && analyticsData) {
      setLastSyncTime(new Date());
        setSuccessMessage('Cloud sync completed successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError(`Cloud sync failed: ${err.message}`);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Bus management functions
  const handleBusAction = async (busId, action) => {
    try {
      setIsLoading(true);
      setError(null);

      let endpoint, method = 'POST';
      
      switch (action) {
        case 'start':
          endpoint = `/api/buses/${busId}/start`;
          break;
        case 'stop':
          endpoint = `/api/buses/${busId}/stop`;
          break;
        case 'maintenance':
          endpoint = `/api/buses/${busId}/maintenance`;
          break;
        case 'emergency':
          endpoint = `/api/buses/${busId}/emergency`;
          break;
        default:
          throw new Error('Invalid action');
      }

      const result = await apiCall(endpoint, { method });
      
      if (result) {
        setBusStatuses(prev => ({ ...prev, [busId]: action }));
        setSuccessMessage(`Bus ${action} action completed successfully`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError(`Failed to ${action} bus: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Analytics functions
  const handleAnalyticsAction = async (action, busId = null) => {
    try {
      setIsLoading(true);
      setError(null);

      let endpoint;
      switch (action) {
        case 'performance':
          endpoint = busId ? `/api/analytics/bus/${busId}/performance` : '/api/analytics/fleet-performance';
          break;
        case 'fuel':
          endpoint = busId ? `/api/analytics/bus/${busId}/fuel` : '/api/analytics/fuel-efficiency';
          break;
        case 'maintenance':
          endpoint = busId ? `/api/analytics/bus/${busId}/maintenance` : '/api/analytics/maintenance-schedule';
          break;
        default:
          throw new Error('Invalid analytics action');
      }

      const data = await apiCall(endpoint);
      
      if (data) {
        setSuccessMessage(`${action} analytics updated successfully`);
        setTimeout(() => setSuccessMessage(null), 3000);
        return data;
      }
    } catch (err) {
      setError(`Failed to fetch ${action} analytics: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Recommendation actions
  const handleRecommendationAction = async (recommendation, action) => {
    try {
      setIsLoading(true);
      setError(null);

      let endpoint, method = 'POST';
      
      switch (action) {
        case 'schedule_maintenance':
          endpoint = '/api/maintenance/schedule';
          break;
        case 'refuel':
          endpoint = '/api/fuel/schedule-refuel';
          break;
        case 'optimize_route':
          endpoint = '/api/routes/optimize';
          break;
        case 'emergency_check':
          endpoint = '/api/emergency/check-systems';
          break;
        default:
          throw new Error('Invalid recommendation action');
      }

      const payload = {
        recommendationId: recommendation.id || Date.now(),
        type: recommendation.type,
        priority: recommendation.priority,
        affectedBuses: recommendation.affectedBuses,
        action: recommendation.action
      };

      const result = await apiCall(endpoint, { 
        method, 
        body: JSON.stringify(payload) 
      });
      
      if (result) {
        setSuccessMessage(`Recommendation action "${action}" completed successfully`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError(`Failed to execute recommendation action: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Bus card specific functions
  const handleBusCardAction = async (busId, action) => {
    try {
      setIsLoading(true);
      setError(null);

      let endpoint, method = 'POST';
      
      switch (action) {
        case 'start':
          endpoint = `/api/buses/${busId}/start`;
          break;
        case 'stop':
          endpoint = `/api/buses/${busId}/stop`;
          break;
        case 'ai_boost':
          endpoint = `/api/buses/${busId}/ai-boost`;
          break;
        case 'live_tracking':
          endpoint = `/api/buses/${busId}/tracking/toggle`;
          break;
        case 'gps':
          endpoint = `/api/buses/${busId}/gps/toggle`;
          break;
        case 'communication':
          endpoint = `/api/buses/${busId}/communication/toggle`;
          break;
        case 'emergency':
          endpoint = `/api/buses/${busId}/emergency/toggle`;
          break;
        case 'delete':
          endpoint = `/api/buses/${busId}`;
          method = 'DELETE';
          break;
        default:
          throw new Error('Invalid bus card action');
      }

      const result = await apiCall(endpoint, { method });
      
      if (result) {
        // Update local state
        if (action === 'start' || action === 'stop') {
          setBusStatuses(prev => ({ ...prev, [busId]: action }));
        } else if (action === 'ai_boost' || action === 'live_tracking' || action === 'gps' || action === 'communication' || action === 'emergency') {
          setBusFeatures(prev => ({ 
            ...prev, 
            [busId]: { 
              ...prev[busId], 
              [action]: !prev[busId]?.[action] 
            } 
          }));
        }
        
        setSuccessMessage(`Bus ${action} action completed successfully`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError(`Failed to ${action} bus: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle bus feature
  const toggleBusFeature = (busId, feature) => {
    setBusFeatures(prev => ({
      ...prev,
      [busId]: {
        ...prev[busId],
        [feature]: !prev[busId]?.[feature]
      }
    }));
  };

  // Trip action handler
  const handleTripAction = async (tripId, action) => {
    try {
      setIsLoading(true);
      setError(null);

      let endpoint, method = 'POST';
      
      switch (action) {
        case 'start':
          endpoint = `/api/trips/${tripId}/start`;
          break;
        case 'stop':
          endpoint = `/api/trips/${tripId}/stop`;
          break;
        case 'edit':
          // Handle edit action - could open a modal or navigate to edit page
          setSuccessMessage('Edit trip functionality - redirecting to edit page');
          setTimeout(() => setSuccessMessage(null), 3000);
          return;
        case 'view':
          // Handle view action - could open a detailed view modal
          setSuccessMessage('View trip details - opening detailed view');
          setTimeout(() => setSuccessMessage(null), 3000);
          return;
        default:
          throw new Error('Invalid trip action');
      }

      const result = await apiCall(endpoint, { method });
      
      if (result) {
        // Update trip status in local state
        setScheduledTrips(prev => prev.map(trip => 
          trip._id === tripId 
            ? { ...trip, status: action === 'start' ? 'in-progress' : 'completed' }
            : trip
        ));
        
        setSuccessMessage(`Trip ${action} action completed successfully`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError(`Failed to ${action} trip: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate AI insights and analytics with enhanced validation
  const insights = useMemo(() => {                                                                                    
    if (!buses.length) return null;

    // Validate all bus data
    const validationErrors = buses.map(validateBusData).flat();
    if (validationErrors.length > 0) {
      console.warn('Bus data validation warnings:', validationErrors);
    }

    const totalBuses = buses.length;
    const activeBuses = buses.filter(bus => bus.status === 'active').length;
    const maintenanceBuses = buses.filter(bus => bus.status === 'maintenance').length;
    
    // Enhanced performance metrics with safety checks
    const performanceScores = buses.map(bus => {
      const score = bus.insights?.performanceScore || 0;
      return Math.max(0, Math.min(100, score)); // Ensure score is between 0-100
    });
    const avgPerformance = totalBuses > 0 ? 
      Math.round(performanceScores.reduce((acc, score) => acc + score, 0) / totalBuses) : 0;
    
    // Enhanced fuel efficiency with real-time data
    const fuelLevels = buses.map(bus => {
      const level = bus.fuel?.currentLevel || bus.currentLocation?.fuelLevel || 0;
      return Math.max(0, Math.min(100, level)); // Ensure fuel level is between 0-100
    });
    const avgFuelLevel = totalBuses > 0 ? 
      Math.round(fuelLevels.reduce((acc, level) => acc + level, 0) / totalBuses) : 0;
    const lowFuelBuses = buses.filter(bus => {
      const fuelLevel = bus.fuel?.currentLevel || bus.currentLocation?.fuelLevel || 0;
      return fuelLevel < 20;
    }).length;
    
    // Enhanced maintenance insights with better date handling
    const now = new Date();
    const maintenanceDue = buses.filter(bus => {
      try {
        if (!bus.maintenance?.nextService) return false;
        const serviceDate = new Date(bus.maintenance.nextService);
        return serviceDate <= now;
      } catch (error) {
        console.warn('Invalid maintenance date for bus:', bus.busNumber);
        return false;
      }
    }).length;
    
    const maintenanceUpcoming = buses.filter(bus => {
      try {
        if (!bus.maintenance?.nextService) return false;
        const serviceDate = new Date(bus.maintenance.nextService);
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return serviceDate <= weekFromNow && serviceDate > now;
      } catch (error) {
        console.warn('Invalid maintenance date for bus:', bus.busNumber);
        return false;
      }
    }).length;

    // Enhanced efficiency trends with better data handling
    const efficiencyTrends = buses.map(bus => ({
      busNumber: bus.busNumber || 'Unknown',
      performance: Math.max(0, Math.min(100, bus.insights?.performanceScore || 0)),
      fuelEfficiency: Math.max(0, bus.fuel?.averageConsumption || bus.specifications?.mileage || 0),
      maintenanceScore: bus.maintenance?.totalDistance ? 
        Math.max(0, Math.min(100, 100 - (bus.maintenance.totalDistance / 100000) * 10)) : 50,
      currentLocation: bus.currentLocation || null,
      status: bus.status || 'unknown',
      lastUpdate: bus.currentLocation?.lastUpdated || bus.updatedAt || new Date()
    }));

    // Enhanced top performers with better filtering
    const topPerformers = buses
      .filter(bus => bus.insights?.performanceScore && bus.status === 'active')
      .sort((a, b) => (b.insights?.performanceScore || 0) - (a.insights?.performanceScore || 0))
      .slice(0, 5)
      .map(bus => ({
        ...bus,
        performanceScore: Math.max(0, Math.min(100, bus.insights?.performanceScore || 0)),
        efficiency: bus.fuel?.averageConsumption || bus.specifications?.mileage || 0,
        reliability: bus.maintenance?.totalDistance ? 
          Math.max(0, Math.min(100, 100 - (bus.maintenance.totalDistance / 100000) * 10)) : 50
      }));

    // Enhanced AI recommendations with more intelligent insights
    const recommendations = [];
    
    // Low fuel alerts with specific bus numbers
    if (lowFuelBuses > 0) {
      const lowFuelBusNumbers = buses
        .filter(bus => {
          const fuelLevel = bus.fuel?.currentLevel || bus.currentLocation?.fuelLevel || 0;
          return fuelLevel < 20;
        })
        .map(bus => bus.busNumber)
        .slice(0, 3);
      
      recommendations.push({
        type: 'warning',
        title: 'Low Fuel Alert',
        description: `${lowFuelBuses} buses have low fuel levels (<20%)${lowFuelBusNumbers.length > 0 ? `: ${lowFuelBusNumbers.join(', ')}${lowFuelBuses > 3 ? '...' : ''}` : ''}`,
        action: 'Schedule immediate refueling for affected buses',
        priority: 'high',
        affectedBuses: lowFuelBuses,
        icon: '⛽'
      });
    }
    
    // Critical maintenance alerts
    if (maintenanceDue > 0) {
      const overdueBusNumbers = buses
        .filter(bus => {
          try {
            if (!bus.maintenance?.nextService) return false;
            return new Date(bus.maintenance.nextService) <= now;
          } catch (error) {
            return false;
          }
        })
        .map(bus => bus.busNumber)
        .slice(0, 3);
      
      recommendations.push({
        type: 'error',
        title: 'Maintenance Overdue',
        description: `${maintenanceDue} buses have overdue maintenance${overdueBusNumbers.length > 0 ? `: ${overdueBusNumbers.join(', ')}${maintenanceDue > 3 ? '...' : ''}` : ''}`,
        action: 'Immediately schedule maintenance for overdue buses',
        priority: 'critical',
        affectedBuses: maintenanceDue,
        icon: '🔧'
      });
    }
    
    // Upcoming maintenance alerts
    if (maintenanceUpcoming > 0) {
      recommendations.push({
        type: 'warning',
        title: 'Maintenance Due Soon',
        description: `${maintenanceUpcoming} buses need maintenance within 7 days`,
        action: 'Plan maintenance schedule for upcoming services',
        priority: 'medium',
        affectedBuses: maintenanceUpcoming,
        icon: '📅'
      });
    }
    
    // Performance optimization recommendations
    if (avgPerformance < 70) {
      recommendations.push({
        type: 'info',
        title: 'Performance Optimization',
        description: `Average fleet performance is ${avgPerformance}% - below optimal threshold`,
        action: 'Review and optimize underperforming buses',
        priority: 'medium',
        affectedBuses: buses.filter(bus => (bus.insights?.performanceScore || 0) < 70).length,
        icon: '📈'
      });
    }
    
    // Emergency system checks
    const emergencySystemStatus = buses.filter(bus => {
      return bus.currentLocation?.emergencySystem === 'active' || 
             bus.status === 'emergency' ||
             (bus.currentLocation?.speed && bus.currentLocation.speed > 100);
    }).length;
    
    if (emergencySystemStatus > 0) {
      recommendations.push({
        type: 'error',
        title: 'Emergency System Alert',
        description: `${emergencySystemStatus} buses have emergency system activations`,
        action: 'Immediately check emergency systems and driver status',
        priority: 'critical',
        affectedBuses: emergencySystemStatus,
        icon: '🚨'
      });
    }

    // Generate sample time series data
    const generateTimeSeriesData = () => {
      const data = [];
      const days = selectedTimeRange === 'week' ? 7 : selectedTimeRange === 'month' ? 30 : 90;
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        data.push({
          date: date.toISOString().split('T')[0],
          performance: Math.round(avgPerformance + (Math.random() - 0.5) * 20),
          fuelEfficiency: Math.round(avgFuelLevel + (Math.random() - 0.5) * 30),
          maintenance: Math.round((maintenanceDue + maintenanceUpcoming) * (0.8 + Math.random() * 0.4)),
          utilization: Math.round(activeBuses / totalBuses * 100 + (Math.random() - 0.5) * 20)
        });
      }
      
      return data;
    };

    return {
      overview: {
        totalBuses,
        activeBuses,
        maintenanceBuses,
        avgPerformance: Math.round(avgPerformance),
        avgFuelLevel: Math.round(avgFuelLevel),
        lowFuelBuses,
        maintenanceDue,
        maintenanceUpcoming
      },
      efficiencyTrends,
      topPerformers,
      recommendations,
      timeSeriesData: generateTimeSeriesData()
    };
  }, [buses, selectedTimeRange]);

  // Enhanced refresh functionality with real-time data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      // Refresh multiple data sources
      await Promise.all([
        fetchRealTimeData(),
        fetchScheduledTrips(),
        handleAnalyticsAction('performance'),
        handleAnalyticsAction('fuel'),
        handleAnalyticsAction('maintenance')
      ]);
      
      setSuccessMessage('All data refreshed successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(`Failed to refresh data: ${err.message}`);
      console.error('Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh functionality
  React.useEffect(() => {
    const interval = setInterval(fetchRealTimeData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchRealTimeData]);

  // Fetch scheduled trips on component mount
  React.useEffect(() => {
    fetchScheduledTrips();
  }, [fetchScheduledTrips]);

  if (!insights) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <div className="bg-white rounded-xl p-8 text-center">
          <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No data available for AI insights</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden border border-gray-200"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">AI Insights Dashboard</h3>
                <p className="text-sm text-gray-600 font-medium">Intelligent fleet analytics and recommendations</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Success Message */}
              {successMessage && (
                <div className="px-4 py-2 bg-green-100 text-green-700 rounded-xl shadow-sm border border-green-200 text-sm font-medium">
                  {successMessage}
                </div>
              )}
              
              {/* Cloud Sync Button */}
              <button
                onClick={handleCloudSync}
                disabled={isCloudSyncing || isLoading}
                className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md"
                title="Cloud Sync - Sync all data sources"
              >
                <Cloud className={`w-5 h-5 ${isCloudSyncing ? 'animate-pulse' : ''}`} />
              </button>
              
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
                className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md"
                title="Refresh Data - Update all analytics"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              
              {/* Error Indicator */}
              {error && (
                <div className="p-3 text-red-500 bg-red-50 rounded-xl shadow-sm border border-red-200" title={error}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
              
              {/* Loading Indicator */}
              {isLoading && (
                <div className="p-3 text-blue-500 bg-blue-50 rounded-xl shadow-sm border border-blue-200">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                title="Close Dashboard"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-8 space-y-8">
            {/* Filter Panel */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Filter & Search</h3>
              <div className="space-y-4">
                {/* Search Schedules */}
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Search className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search schedules..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Filter className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium bg-gray-50 focus:ring-2 focus:ring-green-500 focus:border-transparent">
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                </div>

                {/* Date Picker */}
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <input
                      type="date"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Buses Filter */}
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Bus className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                      <option value="">All Buses</option>
                      {buses.map(bus => (
                        <option key={bus._id} value={bus._id}>
                          {bus.busNumber || bus.registrationNumber || 'Unknown Bus'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Routes Filter */}
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <MapPin className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium bg-gray-50 focus:ring-2 focus:ring-red-500 focus:border-transparent">
                      <option value="">All Routes</option>
                      <option value="route1">Route 1 - City Center</option>
                      <option value="route2">Route 2 - Airport</option>
                      <option value="route3">Route 3 - Suburbs</option>
                      <option value="route4">Route 4 - Industrial</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Fleet Performance</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{insights.overview.avgPerformance}%</p>
                    <p className="text-xs text-gray-500 mt-1">Average across fleet</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                    <TrendingUp className="w-7 h-7 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Active Buses</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{insights.overview.activeBuses}</p>
                    <p className="text-xs text-gray-500 mt-1">Currently operational</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg">
                    <Activity className="w-7 h-7 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Maintenance Due</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{insights.overview.maintenanceDue}</p>
                    <p className="text-xs text-gray-500 mt-1">Requires attention</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg">
                    <Wrench className="w-7 h-7 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Low Fuel</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{insights.overview.lowFuelBuses}</p>
                    <p className="text-xs text-gray-500 mt-1">Need refueling</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg">
                    <Fuel className="w-7 h-7 text-white" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Bus Management Cards */}
            {showBusCards && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">Bus Fleet Management</h3>
                  <button
                    onClick={() => setShowBusCards(!showBusCards)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-200"
                  >
                    {showBusCards ? 'Hide Cards' : 'Show Cards'}
                  </button>
                </div>
                
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {buses.slice(0, 2).map((bus, index) => (
                    <BusCard 
                      key={bus._id} 
                      bus={bus} 
                      index={index}
                      busStatus={busStatuses[bus._id]}
                      busFeatures={busFeatures[bus._id]}
                      onAction={handleBusCardAction}
                      onToggleFeature={toggleBusFeature}
                      onViewDetails={() => {
                        setSelectedBus(bus);
                        setShowBusDetails(true);
                      }}
                      isLoading={isLoading}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Scheduled Trips Section */}
            {showScheduledTrips && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">Scheduled Trips</h3>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">
                      Showing {scheduledTrips.length} trips
                    </span>
                    <button
                      onClick={() => setShowScheduledTrips(!showScheduledTrips)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-200"
                    >
                      {showScheduledTrips ? 'Hide Trips' : 'Show Trips'}
                    </button>
                    <button
                      onClick={fetchScheduledTrips}
                      disabled={tripsLoading}
                      className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 disabled:opacity-50"
                    >
                      {tripsLoading ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>
                </div>
                
                {scheduledTrips.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {scheduledTrips.map((trip, index) => (
                      <TripScheduleCard 
                        key={trip._id} 
                        trip={trip} 
                        index={index}
                        onAction={handleTripAction}
                        isLoading={isLoading}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-100">
                    <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-xl font-bold text-gray-900 mb-2">No Scheduled Trips Found</h4>
                    <p className="text-gray-600 mb-4">
                      {tripsLoading 
                        ? 'Loading scheduled trips...'
                        : 'No trips are scheduled at the moment. Add new trips to get started.'
                      }
                    </p>
                    <button
                      onClick={fetchScheduledTrips}
                      disabled={tripsLoading}
                      className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 font-medium disabled:opacity-50"
                    >
                      {tripsLoading ? 'Loading...' : 'Refresh Trips'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Performance Trend Chart */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">Performance Trend</h4>
                    <p className="text-sm text-gray-600 mt-1">Fleet performance over time</p>
                  </div>
                  <div className="flex items-center space-x-2">
                  <select
                    value={selectedTimeRange}
                      onChange={(e) => {
                        setSelectedTimeRange(e.target.value);
                        handleAnalyticsAction('performance');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="quarter">Last 90 Days</option>
                  </select>
                    
                    {/* Refresh Chart Button */}
                    <button
                      onClick={() => handleAnalyticsAction('performance')}
                      disabled={isLoading}
                      className="p-2 bg-blue-500 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:bg-blue-600 disabled:opacity-50"
                      title="Refresh Performance Data"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={insights.timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12, fill: '#666' }}
                        axisLine={{ stroke: '#e0e0e0' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#666' }}
                        axisLine={{ stroke: '#e0e0e0' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e0e0e0', 
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="performance" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        name="Performance %"
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="utilization" 
                        stroke="#10B981" 
                        strokeWidth={3}
                        name="Utilization %"
                        dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Fleet Distribution */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <div className="mb-6">
                  <h4 className="text-xl font-bold text-gray-900">Fleet Status Distribution</h4>
                  <p className="text-sm text-gray-600 mt-1">Current fleet status overview</p>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={[
                          { name: 'Active', value: insights.overview.activeBuses, color: '#10B981' },
                          { name: 'Maintenance', value: insights.overview.maintenanceBuses, color: '#F59E0B' },
                          { name: 'Retired', value: insights.overview.totalBuses - insights.overview.activeBuses - insights.overview.maintenanceBuses, color: '#6B7280' }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={40}
                        dataKey="value"
                        stroke="white"
                        strokeWidth={2}
                      >
                        {[
                          { name: 'Active', value: insights.overview.activeBuses, color: '#10B981' },
                          { name: 'Maintenance', value: insights.overview.maintenanceBuses, color: '#F59E0B' },
                          { name: 'Retired', value: insights.overview.totalBuses - insights.overview.activeBuses - insights.overview.maintenanceBuses, color: '#6B7280' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e0e0e0', 
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="mb-6">
                <h4 className="text-xl font-bold text-gray-900">Top Performing Buses</h4>
                <p className="text-sm text-gray-600 mt-1">Best performing buses in the fleet</p>
              </div>
              <div className="space-y-4">
                {insights.topPerformers.map((bus, index) => (
                  <motion.div
                    key={bus._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                        <span className="text-lg font-bold text-white">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{bus.busNumber}</p>
                        <p className="text-sm text-gray-600 font-medium">{bus.registrationNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {bus.insights?.performanceScore || 0}%
                        </p>
                        <p className="text-sm text-gray-600 font-medium">Performance Score</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.floor((bus.insights?.performanceScore || 0) / 20)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* Start/Stop Bus Button */}
                        <button
                          onClick={() => handleBusAction(bus._id, busStatuses[bus._id] === 'start' ? 'stop' : 'start')}
                          disabled={isLoading}
                          className={`p-2 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md ${
                            busStatuses[bus._id] === 'start' 
                              ? 'bg-red-500 text-white hover:bg-red-600' 
                              : 'bg-green-500 text-white hover:bg-green-600'
                          } disabled:opacity-50`}
                          title={busStatuses[bus._id] === 'start' ? 'Stop Bus' : 'Start Bus'}
                        >
                          {busStatuses[bus._id] === 'start' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        
                        {/* Analytics Button */}
                        <button
                          onClick={() => handleAnalyticsAction('performance', bus._id)}
                          disabled={isLoading}
                          className="p-2 bg-blue-500 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:bg-blue-600 disabled:opacity-50"
                          title="View Performance Analytics"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                        
                        {/* View Details Button */}
                        <button
                          onClick={() => {
                            setSelectedBus(bus);
                            setShowBusDetails(true);
                          }}
                          className="p-2 bg-gray-500 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:bg-gray-600"
                          title="View Bus Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl shadow-lg">
                  <Lightbulb className="w-6 h-6 text-white" />
              </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">AI Recommendations</h4>
                  <p className="text-sm text-gray-600 mt-1">Intelligent insights and actionable recommendations</p>
                </div>
              </div>
              <div className="space-y-6">
                {insights.recommendations.map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-6 rounded-2xl border-l-4 shadow-sm hover:shadow-md transition-all duration-300 ${
                      rec.type === 'error' ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-500' :
                      rec.type === 'warning' ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-500' :
                      'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-2xl shadow-lg ${
                        rec.type === 'error' ? 'bg-red-500' :
                        rec.type === 'warning' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}>
                        {rec.type === 'error' ? (
                          <AlertTriangle className="w-6 h-6 text-white" />
                        ) : rec.type === 'warning' ? (
                          <AlertTriangle className="w-6 h-6 text-white" />
                        ) : (
                          <CheckCircle className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            {rec.icon && <span className="text-2xl">{rec.icon}</span>}
                            <h5 className="font-bold text-gray-900 text-lg">{rec.title}</h5>
                          </div>
                          <div className="flex items-center space-x-3">
                            {rec.affectedBuses && (
                              <span className="px-3 py-1 bg-white text-gray-700 rounded-full text-sm font-bold shadow-sm border border-gray-200">
                                {rec.affectedBuses} buses
                              </span>
                            )}
                            <span className={`px-3 py-1 rounded-full text-sm font-bold shadow-sm ${
                              rec.priority === 'critical' ? 'bg-red-500 text-white' :
                              rec.priority === 'high' ? 'bg-orange-500 text-white' :
                              rec.priority === 'medium' ? 'bg-yellow-500 text-white' :
                              'bg-gray-500 text-white'
                            }`}>
                              {rec.priority.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-700 font-medium mb-3">{rec.description}</p>
                        <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-gray-200">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">💡</span>
                            <p className="text-gray-800 font-semibold">{rec.action}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {/* Execute Action Button */}
                            <button
                              onClick={() => {
                                const actionMap = {
                                  'Low Fuel Alert': 'refuel',
                                  'Maintenance Overdue': 'schedule_maintenance',
                                  'Maintenance Due Soon': 'schedule_maintenance',
                                  'Performance Optimization': 'optimize_route',
                                  'Emergency System Alert': 'emergency_check'
                                };
                                const action = actionMap[rec.title] || 'schedule_maintenance';
                                handleRecommendationAction(rec, action);
                              }}
                              disabled={isLoading}
                              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 ${
                                rec.priority === 'critical' ? 'bg-red-500 text-white hover:bg-red-600' :
                                rec.priority === 'high' ? 'bg-orange-500 text-white hover:bg-orange-600' :
                                rec.priority === 'medium' ? 'bg-yellow-500 text-white hover:bg-yellow-600' :
                                'bg-blue-500 text-white hover:bg-blue-600'
                              }`}
                            >
                              Execute
                            </button>
                            
                            {/* Dismiss Button */}
                            <button
                              onClick={() => {
                                setSuccessMessage(`Recommendation "${rec.title}" dismissed`);
                                setTimeout(() => setSuccessMessage(null), 3000);
                              }}
                              className="px-3 py-1 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-all duration-200"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="px-8 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full shadow-sm ${isCloudSyncing ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
              <span className="font-medium text-gray-700">{isCloudSyncing ? 'Syncing...' : 'Cloud Sync Active'}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Database className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">Last updated: {lastSyncTime.toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-700">System Status: <span className="text-green-600 font-bold">Active</span></span>
            </div>
            <div className="flex items-center space-x-2">
              <Fingerprint className="w-5 h-5 text-gray-600" />
              <Grid className="w-5 h-5 text-gray-600" />
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bus Details Modal */}
      {showBusDetails && selectedBus && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200"
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                    <Activity className="w-7 h-7 text-white" />
            </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Bus Details</h3>
                    <p className="text-sm text-gray-600 font-medium">{selectedBus.busNumber} - {selectedBus.registrationNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBusDetails(false)}
                  className="p-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-6 bg-gray-50">
              {/* Bus Status and Controls */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h4 className="text-xl font-bold text-gray-900 mb-4">Bus Control Panel</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    onClick={() => handleBusAction(selectedBus._id, 'start')}
                    disabled={isLoading}
                    className="p-4 bg-green-500 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:bg-green-600 disabled:opacity-50"
                  >
                    <Play className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">Start Bus</span>
                  </button>
                  
                  <button
                    onClick={() => handleBusAction(selectedBus._id, 'stop')}
                    disabled={isLoading}
                    className="p-4 bg-red-500 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:bg-red-600 disabled:opacity-50"
                  >
                    <Pause className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">Stop Bus</span>
                  </button>
                  
                  <button
                    onClick={() => handleBusAction(selectedBus._id, 'maintenance')}
                    disabled={isLoading}
                    className="p-4 bg-yellow-500 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:bg-yellow-600 disabled:opacity-50"
                  >
                    <Wrench className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">Maintenance</span>
                  </button>
                  
                  <button
                    onClick={() => handleBusAction(selectedBus._id, 'emergency')}
                    disabled={isLoading}
                    className="p-4 bg-red-600 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:bg-red-700 disabled:opacity-50"
                  >
                    <Phone className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">Emergency</span>
                  </button>
                </div>
              </div>

              {/* Bus Information */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h4 className="text-xl font-bold text-gray-900 mb-4">Bus Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Activity className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <p className="font-bold text-gray-900">{selectedBus.status || 'Unknown'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Fuel className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Fuel Level</p>
                        <p className="font-bold text-gray-900">{selectedBus.fuel?.currentLevel || selectedBus.currentLocation?.fuelLevel || 0}%</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Performance Score</p>
                        <p className="font-bold text-gray-900">{selectedBus.insights?.performanceScore || 0}%</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <MapPin className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Current Location</p>
                        <p className="font-bold text-gray-900">{selectedBus.currentLocation?.address || 'Not Available'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Users className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Driver</p>
                        <p className="font-bold text-gray-900">{selectedBus.driver?.name || 'Not Assigned'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Last Updated</p>
                        <p className="font-bold text-gray-900">{new Date(selectedBus.updatedAt || Date.now()).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Actions */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h4 className="text-xl font-bold text-gray-900 mb-4">Analytics & Reports</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => handleAnalyticsAction('performance', selectedBus._id)}
                    disabled={isLoading}
                    className="p-4 bg-blue-500 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:bg-blue-600 disabled:opacity-50"
                  >
                    <BarChart3 className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">Performance Report</span>
                  </button>
                  
                  <button
                    onClick={() => handleAnalyticsAction('fuel', selectedBus._id)}
                    disabled={isLoading}
                    className="p-4 bg-green-500 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:bg-green-600 disabled:opacity-50"
                  >
                    <Fuel className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">Fuel Analytics</span>
                  </button>
                  
                  <button
                    onClick={() => handleAnalyticsAction('maintenance', selectedBus._id)}
                    disabled={isLoading}
                    className="p-4 bg-yellow-500 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:bg-yellow-600 disabled:opacity-50"
                  >
                    <Wrench className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">Maintenance Report</span>
                  </button>
            </div>
          </div>
        </div>
      </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AIInsightsDashboard;