import React, { useState, useEffect } from 'react';
import { Bus, Navigation, MapPin, Route, Clock, Users, ExternalLink } from 'lucide-react';

const FreeMapTracker = ({ 
  trip, 
  isTracking = false, 
  onLocationUpdate,
  className = "w-full h-full"
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);

  // Default coordinates (Kerala, India)
  const defaultCenter = { lat: 10.8505, lng: 76.2711 };
  const defaultZoom = 10;

  // Sample route coordinates for demonstration
  const sampleRoute = [
    { lat: 8.5241, lng: 76.9558, name: 'Thiruvananthapuram' },
    { lat: 9.9312, lng: 76.2673, name: 'Ernakulam' },
    { lat: 10.5276, lng: 76.2144, name: 'Thrissur' },
    { lat: 11.2588, lng: 75.7804, name: 'Kozhikode' },
    { lat: 12.9141, lng: 74.8560, name: 'Mangalore' }
  ];

  // Sample bus stops
  const busStops = [
    { id: 1, name: 'Thiruvananthapuram Central', coords: { lat: 8.5241, lng: 76.9558 }, type: 'start' },
    { id: 2, name: 'Ernakulam Bus Station', coords: { lat: 9.9312, lng: 76.2673 }, type: 'stop' },
    { id: 3, name: 'Thrissur Railway Station', coords: { lat: 10.5276, lng: 76.2144 }, type: 'stop' },
    { id: 4, name: 'Kozhikode Central', coords: { lat: 11.2588, lng: 75.7804 }, type: 'stop' },
    { id: 5, name: 'Mangalore Terminal', coords: { lat: 12.9141, lng: 74.8560 }, type: 'end' }
  ];

  const getCurrentPosition = () => {
    if (trip && trip.coordinates) {
      return trip.coordinates;
    }
    return defaultCenter;
  };

  const generateOpenStreetMapUrl = () => {
    const center = getCurrentPosition();
    const zoom = 12;
    
    // Generate OpenStreetMap URL with markers
    let url = `https://www.openstreetmap.org/export/embed.html?bbox=${center.lng-0.1},${center.lat-0.1},${center.lng+0.1},${center.lat+0.1}&layer=mapnik&marker=${center.lat},${center.lng}`;
    
    return url;
  };

  const openInExternalMap = () => {
    const center = getCurrentPosition();
    const url = `https://www.openstreetmap.org/?mlat=${center.lat}&mlon=${center.lng}&zoom=12`;
    window.open(url, '_blank');
  };

  const getStopColor = (type) => {
    switch (type) {
      case 'start': return 'bg-green-500';
      case 'end': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  const getStopIcon = (type) => {
    switch (type) {
      case 'start': return '🟢';
      case 'end': return '🔴';
      default: return '🔵';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div className="w-full h-full rounded-lg overflow-hidden border-2 border-gray-200">
        <iframe
          src={generateOpenStreetMapUrl()}
          className="w-full h-full"
          style={{ border: 0 }}
          allowFullScreen
          title="Bus Tracking Map"
          onLoad={() => setMapLoaded(true)}
        />
      </div>

      {/* Loading Overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-bounce" />
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 space-y-2">
        <button
          onClick={() => {
            const center = defaultCenter;
            const url = `https://www.openstreetmap.org/?mlat=${center.lat}&mlon=${center.lng}&zoom=10`;
            window.open(url, '_blank');
          }}
          className="w-8 h-8 bg-blue-500 text-white rounded flex items-center justify-center hover:bg-blue-600 transition-colors"
          title="Reset View"
        >
          <Navigation className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => {
            if (trip && trip.coordinates) {
              const url = `https://www.openstreetmap.org/?mlat=${trip.coordinates.lat}&mlon=${trip.coordinates.lng}&zoom=15`;
              window.open(url, '_blank');
            }
          }}
          className="w-8 h-8 bg-green-500 text-white rounded flex items-center justify-center hover:bg-green-600 transition-colors"
          title="Focus on Bus"
        >
          <Bus className="w-4 h-4" />
        </button>
      </div>

      {/* Bus Stops List */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 rounded-lg p-3 max-w-xs">
        <h4 className="font-semibold text-gray-900 mb-2 text-sm">Route Stops</h4>
        <div className="space-y-1">
          {busStops.map((stop, index) => (
            <div key={stop.id} className="flex items-center gap-2 text-xs">
              <span className="text-lg">{getStopIcon(stop.type)}</span>
              <span className="text-gray-700 truncate">{stop.name}</span>
              {stop.type === 'start' && <span className="text-green-600 font-medium">Start</span>}
              {stop.type === 'end' && <span className="text-red-600 font-medium">End</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Current Bus Info */}
      {trip && trip.coordinates && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-95 rounded-lg p-3 max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-semibold text-gray-900 text-sm">Live Tracking</span>
          </div>
          
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <Bus className="w-3 h-3 text-blue-600" />
              <span className="font-medium">{trip.busId?.busNumber}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 text-green-600" />
              <span className="text-gray-600">{trip.currentLocation}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Navigation className="w-3 h-3 text-orange-600" />
              <span className="text-gray-600">{trip.currentSpeed}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-purple-600" />
              <span className="text-gray-600">ETA: {trip.estimatedArrival}</span>
            </div>
          </div>
        </div>
      )}

      {/* Map Info */}
      <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 rounded-lg px-3 py-2 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>OpenStreetMap</span>
          <button
            onClick={openInExternalMap}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Route Visualization */}
      <div className="absolute top-1/2 left-4 transform -translate-y-1/2">
        <div className="bg-white bg-opacity-95 rounded-lg p-3">
          <h4 className="font-semibold text-gray-900 mb-2 text-sm">Route Path</h4>
          <div className="space-y-2">
            {sampleRoute.map((point, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="text-xs text-gray-600">
                  {index + 1}. {point.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeMapTracker;