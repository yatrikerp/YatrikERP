import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bus, MapPin, Wrench, Fuel, Users, AlertTriangle,
  CheckCircle, XCircle, Clock, Edit, Eye, Gauge,
  Wifi, Battery, Signal, Thermometer, Zap,
  TrendingUp, TrendingDown, MoreVertical, Star
} from 'lucide-react';

const EnhancedBusCard = ({ 
  bus, 
  realTimeData = {}, 
  insights = {}, 
  onEdit, 
  onView, 
  onAssign,
  isSelected = false,
  onSelect 
}) => {
  const [showActions, setShowActions] = useState(false);
  
  // Add null check for bus object
  if (!bus) {
    return null;
  }
  
  const realTimeInfo = realTimeData[bus._id] || {};
  const busInsights = insights[bus._id] || {};

  const getStatusConfig = (status) => {
    switch (status) {
      case 'active':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle,
          pulse: 'bg-green-500'
        };
      case 'maintenance':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: Wrench,
          pulse: 'bg-yellow-500'
        };
      case 'retired':
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: XCircle,
          pulse: 'bg-gray-500'
        };
      case 'suspended':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertTriangle,
          pulse: 'bg-red-500'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Clock,
          pulse: 'bg-gray-500'
        };
    }
  };

  const getPerformanceScore = () => {
    if (!busInsights.performanceScore) return 0;
    return Math.round(busInsights.performanceScore);
  };

  const getEfficiencyTrend = () => {
    if (!busInsights.efficiencyTrend) return 0;
    return busInsights.efficiencyTrend;
  };

  const statusConfig = getStatusConfig(bus.status);
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-300 hover:shadow-xl ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Selection checkbox */}
      <div className="absolute top-4 left-4 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect?.(bus._id)}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
        />
      </div>

      {/* Performance Score Badge */}
      {busInsights.performanceScore && (
        <div className="absolute top-4 right-4 z-10">
          <div className={`px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1 ${
            getPerformanceScore() >= 80 ? 'bg-green-100 text-green-800' :
            getPerformanceScore() >= 60 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            <Star className="w-3 h-3" />
            <span>{getPerformanceScore()}</span>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
              <Bus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{bus.busNumber}</h3>
              <p className="text-sm text-gray-500">{bus.registrationNumber}</p>
              <p className="text-xs text-gray-400 capitalize">{bus.busType?.replace('_', ' ')}</p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[150px] z-20"
              >
                <button
                  onClick={() => { 
                    if (bus && bus._id) {
                      onEdit?.(bus); 
                      setShowActions(false);
                    }
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Details</span>
                </button>
                <button
                  onClick={() => { 
                    if (bus && bus._id) {
                      onView?.(bus); 
                      setShowActions(false);
                    }
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </button>
                <button
                  onClick={() => { 
                    if (bus && bus._id) {
                      onAssign?.(bus); 
                      setShowActions(false);
                    }
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Assign Staff</span>
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-2 w-fit border ${statusConfig.color}`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${statusConfig.pulse}`}></div>
            <StatusIcon className="w-3 h-3" />
            <span className="capitalize">{bus.status}</span>
          </span>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-600">Capacity</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{bus.capacity?.total || 0}</p>
            <p className="text-xs text-gray-500">
              {realTimeInfo.occupancy ? `${realTimeInfo.occupancy}% occupied` : 'No data'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Fuel className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-600">Fuel</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{bus.fuel?.currentLevel || 0}%</p>
            <p className="text-xs text-gray-500">
              {bus.specifications?.mileage ? `${bus.specifications.mileage} km/l` : 'No data'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-600">Location</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {realTimeInfo.location?.stopName || 'Unknown'}
            </p>
            <p className="text-xs text-gray-500">
              {realTimeInfo.location?.speed ? `${realTimeInfo.location.speed} km/h` : 'Stationary'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Gauge className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-600">Efficiency</span>
            </div>
            <div className="flex items-center space-x-1">
              <p className="text-lg font-bold text-gray-900">{getPerformanceScore()}%</p>
              {getEfficiencyTrend() !== 0 && (
                <div className={`flex items-center ${getEfficiencyTrend() > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {getEfficiencyTrend() > 0 ? 
                    <TrendingUp className="w-3 h-3" /> : 
                    <TrendingDown className="w-3 h-3" />
                  }
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Real-time Status Indicators */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className={`flex items-center justify-center p-2 rounded-lg ${
            realTimeInfo.gpsStatus ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            <Signal className="w-4 h-4" />
          </div>
          <div className={`flex items-center justify-center p-2 rounded-lg ${
            realTimeInfo.wifiStatus ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
          }`}>
            <Wifi className="w-4 h-4" />
          </div>
          <div className={`flex items-center justify-center p-2 rounded-lg ${
            realTimeInfo.batteryLevel > 20 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <Battery className="w-4 h-4" />
          </div>
          <div className={`flex items-center justify-center p-2 rounded-lg ${
            realTimeInfo.temperature < 80 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
          }`}>
            <Thermometer className="w-4 h-4" />
          </div>
        </div>

        {/* AI Insights */}
        {busInsights.recommendations && busInsights.recommendations.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 mb-4 border border-purple-200">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">AI Insights</span>
            </div>
            <p className="text-xs text-purple-700">
              {busInsights.recommendations[0]}
            </p>
          </div>
        )}

        {/* Maintenance Alert */}
        {bus.maintenance?.nextService && (
          <div className={`rounded-lg p-3 mb-4 ${
            new Date(bus.maintenance.nextService) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ?
            'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center justify-between text-sm">
              <span className={`font-medium ${
                new Date(bus.maintenance.nextService) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ?
                'text-red-700' : 'text-yellow-700'
              }`}>
                Next Service
              </span>
              <span className={`${
                new Date(bus.maintenance.nextService) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ?
                'text-red-600' : 'text-yellow-600'
              }`}>
                {new Date(bus.maintenance.nextService).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-500 mb-4">
          <div>
            <p className="font-medium text-gray-900">{bus.maintenance?.totalDistance || 0}</p>
            <p>km traveled</p>
          </div>
          <div>
            <p className="font-medium text-gray-900">{bus.maintenance?.engineHours || 0}</p>
            <p>engine hours</p>
          </div>
          <div>
            <p className="font-medium text-gray-900">{bus.fuel?.averageConsumption || 0}</p>
            <p>avg km/l</p>
          </div>
        </div>

        {/* Footer with timestamp */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>Updated {new Date(bus.updatedAt || Date.now()).toLocaleTimeString()}</span>
          </div>
          
          {busInsights.rating && (
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < busInsights.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hover overlay for quick actions */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className="absolute inset-0 bg-black bg-opacity-5 rounded-xl flex items-center justify-center space-x-2 opacity-0 hover:opacity-100 transition-opacity"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (bus && bus._id) {
              onEdit?.(bus);
            }
          }}
          className="p-3 bg-white rounded-full shadow-lg text-blue-600 hover:bg-blue-50"
          title="Edit Bus"
        >
          <Edit className="w-4 h-4" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (bus && bus._id) {
              onView?.(bus);
            }
          }}
          className="p-3 bg-white rounded-full shadow-lg text-green-600 hover:bg-green-50"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (bus && bus._id) {
              onAssign?.(bus);
            }
          }}
          className="p-3 bg-white rounded-full shadow-lg text-purple-600 hover:bg-purple-50"
          title="Assign Staff"
        >
          <Users className="w-4 h-4" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default EnhancedBusCard;
