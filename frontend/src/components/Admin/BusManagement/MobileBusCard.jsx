import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bus, MapPin, Fuel, Users, CheckCircle, Wrench, AlertTriangle,
  XCircle, Clock, MoreHorizontal, Edit, Eye, Activity, Gauge,
  ChevronDown, ChevronUp
} from 'lucide-react';

const MobileBusCard = ({ 
  bus, 
  realTimeData = {}, 
  insights = {}, 
  onEdit, 
  onView, 
  isSelected = false,
  onSelect 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  
  const realTimeInfo = realTimeData[bus._id] || {};
  const busInsights = insights[bus._id] || {};

  const getStatusConfig = (status) => {
    switch (status) {
      case 'active':
        return { color: 'bg-green-500', icon: CheckCircle, text: 'text-green-700' };
      case 'maintenance':
        return { color: 'bg-yellow-500', icon: Wrench, text: 'text-yellow-700' };
      case 'retired':
        return { color: 'bg-gray-500', icon: XCircle, text: 'text-gray-700' };
      case 'suspended':
        return { color: 'bg-red-500', icon: AlertTriangle, text: 'text-red-700' };
      default:
        return { color: 'bg-gray-500', icon: Clock, text: 'text-gray-700' };
    }
  };

  const statusConfig = getStatusConfig(bus.status);
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
      }`}
    >
      {/* Main Card Content */}
      <div className="p-4">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect?.(bus._id)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bus className="w-4 h-4 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 truncate">{bus.busNumber}</h3>
              <p className="text-xs text-gray-500 truncate">{bus.registrationNumber}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${statusConfig.color}`}></div>
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Info Row */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-gray-500 mb-1">
              <Users className="w-3 h-3" />
            </div>
            <p className="text-sm font-medium text-gray-900">{bus.capacity?.total || 0}</p>
            <p className="text-xs text-gray-500">Seats</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-gray-500 mb-1">
              <Fuel className="w-3 h-3" />
            </div>
            <p className="text-sm font-medium text-gray-900">{bus.fuel?.currentLevel || 0}%</p>
            <p className="text-xs text-gray-500">Fuel</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-gray-500 mb-1">
              <Gauge className="w-3 h-3" />
            </div>
            <p className="text-sm font-medium text-gray-900">
              {busInsights.performanceScore ? Math.round(busInsights.performanceScore) : 0}%
            </p>
            <p className="text-xs text-gray-500">Score</p>
          </div>
        </div>

        {/* Status and Location */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <StatusIcon className={`w-4 h-4 ${statusConfig.text}`} />
            <span className={`font-medium capitalize ${statusConfig.text}`}>{bus.status}</span>
          </div>
          
          <div className="flex items-center space-x-1 text-gray-500">
            <MapPin className="w-3 h-3" />
            <span className="text-xs truncate max-w-[100px]">
              {realTimeInfo.location?.stopName || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-3 py-2 text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center space-x-1 border-t border-gray-100"
        >
          <span>{isExpanded ? 'Less' : 'More'} Details</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-gray-100 p-4 bg-gray-50"
        >
          {/* Detailed Info Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Type</p>
              <p className="text-sm font-medium text-gray-900 capitalize">
                {bus.busType?.replace('_', ' ')}
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Mileage</p>
              <p className="text-sm font-medium text-gray-900">
                {bus.specifications?.mileage || 0} km/l
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Distance</p>
              <p className="text-sm font-medium text-gray-900">
                {bus.maintenance?.totalDistance || 0} km
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Last Service</p>
              <p className="text-sm font-medium text-gray-900">
                {bus.maintenance?.lastService ? 
                  new Date(bus.maintenance.lastService).toLocaleDateString() : 
                  'N/A'
                }
              </p>
            </div>
          </div>

          {/* Real-time Status */}
          {realTimeInfo.location && (
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700 font-medium">Live Location</span>
                <span className="text-blue-600">{realTimeInfo.location.speed || 0} km/h</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                {realTimeInfo.location.stopName || 'In Transit'}
              </p>
            </div>
          )}

          {/* AI Insights */}
          {busInsights.recommendations && busInsights.recommendations.length > 0 && (
            <div className="bg-purple-50 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">AI Recommendation</span>
              </div>
              <p className="text-xs text-purple-700">
                {busInsights.recommendations[0]}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onEdit?.(bus)}
              className="py-2 px-3 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center justify-center space-x-2 hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
            
            <button
              onClick={() => onView?.(bus)}
              className="py-2 px-3 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center justify-center space-x-2 hover:bg-green-700 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>View</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Actions Menu */}
      {showActions && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute right-4 top-16 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[120px] z-10"
        >
          <button
            onClick={() => { onEdit?.(bus); setShowActions(false); }}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            Edit Bus
          </button>
          <button
            onClick={() => { onView?.(bus); setShowActions(false); }}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            View Details
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MobileBusCard;
