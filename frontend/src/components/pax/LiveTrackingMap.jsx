import React, { useState } from 'react';
import { MapPin, Navigation, Bus, Clock, Wifi, Signal, Battery } from 'lucide-react';

const LiveTrackingMap = ({ trackingData, onTrackBus }) => {
  const [isTracking, setIsTracking] = useState(false);
  
  const defaultTracking = {
    busNumber: 'KL-07-AB-1234',
    route: 'Kochi → Thiruvananthapuram',
    currentLocation: 'Alappuzha, Kerala',
    destination: 'Thiruvananthapuram, Kerala',
    estimatedArrival: '06:30',
    currentSpeed: '65 km/h',
    status: 'on-route',
    lastUpdate: '2 minutes ago',
    coordinates: {
      lat: 18.5204,
      lng: 73.8567
    }
  };

  const data = trackingData || defaultTracking;

  const getStatusConfig = (status) => {
    const configs = {
      'on-route': {
        color: 'bg-green-100 text-green-800',
        icon: '🟢',
        text: 'On Route'
      },
      'delayed': {
        color: 'bg-yellow-100 text-yellow-800',
        icon: '🟡',
        text: 'Delayed'
      },
      'arrived': {
        color: 'bg-blue-100 text-blue-800',
        icon: '🔵',
        text: 'Arrived'
      },
      'breakdown': {
        color: 'bg-red-100 text-red-800',
        icon: '🔴',
        text: 'Breakdown'
      }
    };
    return configs[status] || configs['on-route'];
  };

  const handleTrackBus = () => {
    setIsTracking(true);
    if (onTrackBus) {
      onTrackBus(data);
    }
    // Simulate tracking start
    setTimeout(() => setIsTracking(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Navigation className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Live Tracking</h3>
              <p className="text-gray-500 text-sm">Track your bus in real-time</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusConfig(data.status).color}`}>
              {getStatusConfig(data.status).icon} {getStatusConfig(data.status).text}
            </span>
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="relative mb-6">
          <div className="w-full h-64 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border-2 border-dashed border-blue-200 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-gray-600 font-medium">Google Maps Integration</p>
              <p className="text-sm text-gray-500">Live bus tracking will be displayed here</p>
            </div>
          </div>
          
          {/* Bus Location Indicator */}
          <div className="absolute top-4 left-4 bg-white rounded-lg p-3 shadow-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">Live Location</span>
            </div>
          </div>

          {/* Track Button Overlay */}
          <button
            onClick={handleTrackBus}
            disabled={isTracking}
            className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none flex items-center gap-2"
          >
            {isTracking ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Tracking...
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" />
                Track Bus
              </>
            )}
          </button>
        </div>

        {/* Bus Information */}
        <div className="space-y-4">
          {/* Route Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">Current Route</h4>
              <span className="text-sm text-gray-500">{data.lastUpdate}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Current Location:</span>
                </div>
                <p className="font-semibold text-gray-900">{data.currentLocation}</p>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="font-medium">Destination:</span>
                </div>
                <p className="font-semibold text-gray-900">{data.destination}</p>
              </div>
            </div>
          </div>

          {/* Bus Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <Bus className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-blue-600 font-medium">Bus Number</span>
              </div>
              <p className="text-lg font-bold text-blue-900">{data.busNumber}</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-3 border border-green-100">
              <div className="flex items-center gap-2 mb-1">
                <Navigation className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-600 font-medium">Speed</span>
              </div>
              <p className="text-lg font-bold text-green-900">{data.currentSpeed}</p>
            </div>
          </div>

          {/* ETA */}
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="text-xs text-orange-600 font-medium">Estimated Arrival</span>
            </div>
            <p className="text-lg font-bold text-orange-900">{data.estimatedArrival}</p>
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">GPS Active</span>
              </div>
              <div className="flex items-center gap-2">
                <Signal className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">Signal Strong</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Battery className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTrackingMap;
