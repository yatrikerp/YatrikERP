import React, { useState, useEffect, useRef } from 'react';
import { Bus, Navigation, MapPin, Route, Clock, Users, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';

const FreeMapTracker = ({ 
  trip, 
  isTracking = false, 
  onLocationUpdate,
  className = "w-full h-full"
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(false);
  const mapRef = useRef(null);
  const map = useRef(null);
  const markersRef = useRef({});
  const polylinesRef = useRef({});

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
    { id: 5, name: 'Mangalore Bus Stand', coords: { lat: 12.9141, lng: 74.8560 }, type: 'end' }
  ];

  // Load Google Maps API
  const loadGoogleMapsAPI = () => {
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    const viteKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) || '';
    const craKey = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_GOOGLE_MAPS_API_KEY) || '';
    const apiKey = viteKey || craKey;

    if (!apiKey) {
      toast.error('Google Maps API key is required');
      setMapLoadError(true);
      return;
    }

    const existing = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existing) {
      existing.addEventListener('load', () => initializeMap(), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initializeMap();
    };
    script.onerror = () => {
      toast.error('Failed to load Google Maps');
      setMapLoadError(true);
    };
    document.head.appendChild(script);
  };

  // Initialize Google Maps
  const initializeMap = () => {
    if (!mapRef.current || map.current) return;

    map.current = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    map.current.addListener('tilesloaded', () => {
      setMapLoaded(true);
      loadRouteData();
    });
  };

  // Load route data and markers
  const loadRouteData = () => {
    if (!map.current) return;

    // Clear existing markers and polylines
    Object.values(markersRef.current).forEach(marker => {
      if (marker.setMap) marker.setMap(null);
    });
    Object.values(polylinesRef.current).forEach(polyline => {
      if (polyline.setMap) polyline.setMap(null);
    });
    markersRef.current = {};
    polylinesRef.current = {};

    // Add bus stop markers
    busStops.forEach(stop => {
      const marker = new window.google.maps.Marker({
        position: stop.coords,
        map: map.current,
        title: stop.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: stop.type === 'start' ? 10 : stop.type === 'end' ? 10 : 8,
          fillColor: stop.type === 'start' ? '#4caf50' : stop.type === 'end' ? '#f44336' : '#2196f3',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        },
        animation: window.google.maps.Animation.DROP
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-semibold">${stop.name}</h3>
            <p class="text-sm text-gray-600">${stop.type.toUpperCase()}</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map.current, marker);
      });

      markersRef.current[stop.id] = { marker, infoWindow };
    });

    // Add route polyline
    const routePath = sampleRoute.map(point => ({ lat: point.lat, lng: point.lng }));
    const polyline = new window.google.maps.Polyline({
      path: routePath,
      geodesic: true,
      strokeColor: '#1976d2',
      strokeOpacity: 0.8,
      strokeWeight: 4,
      map: map.current
    });

    polylinesRef.current['route'] = polyline;

    // Fit map to show all markers
    const bounds = new window.google.maps.LatLngBounds();
    busStops.forEach(stop => {
      bounds.extend(stop.coords);
    });
    map.current.fitBounds(bounds);
  };

  useEffect(() => {
    loadGoogleMapsAPI();
    
    return () => {
      Object.values(markersRef.current).forEach(({ marker }) => {
        if (marker.setMap) marker.setMap(null);
      });
      Object.values(polylinesRef.current).forEach(polyline => {
        if (polyline.setMap) polyline.setMap(null);
      });
      markersRef.current = {};
      polylinesRef.current = {};
      if (map.current) {
        map.current = null;
      }
    };
  }, []);

  const openInExternalMap = () => {
    const { lat, lng } = defaultCenter;
    const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(googleMapsUrl, '_blank');
  };

  if (mapLoadError) {
    return (
      <div className={`${className} bg-gray-200 flex items-center justify-center rounded-lg`}>
        <div className="text-center">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Google Maps failed to load</p>
          <p className="text-sm text-gray-400">Please check your API key configuration</p>
          <button
            onClick={openInExternalMap}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1 mx-auto"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open in Google Maps</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} bg-white rounded-xl shadow-lg overflow-hidden`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Route className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">Route Tracker</h3>
              <p className="text-sm text-gray-600">Kerala to Karnataka Route</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isTracking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {isTracking ? 'Tracking Active' : 'Tracking Stopped'}
            </div>
            <button
              onClick={openInExternalMap}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Open in Google Maps"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative">
        <div
          ref={mapRef}
          className="w-full h-96"
        />
        
        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <button
            onClick={() => {
              if (map.current) {
                map.current.setCenter(defaultCenter);
                map.current.setZoom(defaultZoom);
              }
            }}
            className="bg-white p-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
            title="Reset View"
          >
            <Navigation className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Loading Overlay */}
        {!mapLoaded && !mapLoadError && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading map...</p>
            </div>
          </div>
        )}
      </div>

      {/* Route Information */}
      <div className="p-4 bg-gray-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600">Duration</p>
            <p className="font-semibold text-gray-900">6h 30m</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Route className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-sm text-gray-600">Distance</p>
            <p className="font-semibold text-gray-900">280 km</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600">Stops</p>
            <p className="font-semibold text-gray-900">{busStops.length}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Bus className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-sm text-gray-600">Fare</p>
            <p className="font-semibold text-gray-900">₹450</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeMapTracker;