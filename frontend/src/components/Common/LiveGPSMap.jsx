import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Radio, Settings, Play, Pause, Maximize2, Minimize2, Layers, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './LiveGPSMap.css';

// Kerala cities and transport hubs with coordinates
const KERALA_CITIES = {
  'Kochi': { lat: 9.9312, lng: 76.2673, state: 'Kerala' },
  'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366, state: 'Kerala' },
  'Kozhikode': { lat: 11.2588, lng: 75.7804, state: 'Kerala' },
  'Alappuzha': { lat: 9.4981, lng: 76.3388, state: 'Kerala' },
  'Kollam': { lat: 8.8932, lng: 76.6141, state: 'Kerala' },
  'Thrissur': { lat: 10.5276, lng: 76.2144, state: 'Kerala' },
  'Kottayam': { lat: 9.5916, lng: 76.5222, state: 'Kerala' },
  'Palakkad': { lat: 10.7867, lng: 76.6548, state: 'Kerala' },
  'Ernakulam': { lat: 9.9312, lng: 76.2673, state: 'Kerala' }
};

// Kerala route data for demonstration
const KERALA_ROUTES = [
  {
    id: 'KL001',
    name: 'Kochi - Thiruvananthapuram Express',
    from: 'Kochi',
    to: 'Thiruvananthapuram',
    distance: '220 km',
    duration: '4h 00m',
    status: 'active',
    busNumber: 'KL-BUS-001',
    driver: 'Rajesh Kumar',
    conductor: 'Amit Patel',
    currentLocation: { lat: 9.9312, lng: 76.2673 },
    speed: '65 km/h',
    eta: '2h 30m'
  },
  {
    id: 'KL002',
    name: 'Kozhikode - Kochi Express',
    from: 'Kozhikode',
    to: 'Kochi',
    distance: '180 km',
    duration: '3h 30m',
    status: 'active',
    busNumber: 'KL-BUS-002',
    driver: 'Suresh Nair',
    conductor: 'Priya Menon',
    currentLocation: { lat: 11.2588, lng: 75.7804 },
    speed: '70 km/h',
    eta: '2h 45m'
  },
  {
    id: 'KL003',
    name: 'Thrissur - Alappuzha Local',
    from: 'Thrissur',
    to: 'Alappuzha',
    distance: '120 km',
    duration: '2h 15m',
    status: 'delayed',
    busNumber: 'KL-BUS-003',
    driver: 'Vijay Kumar',
    conductor: 'Sunita Devi',
    currentLocation: { lat: 10.5276, lng: 76.2144 },
    speed: '45 km/h',
    eta: '3h 00m'
  }
];

const LiveGPSMap = ({ isFullscreen = false, onToggleFullscreen }) => {
  const [isTracking, setIsTracking] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [mapType, setMapType] = useState('roadmap');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(false);
  
  const mapRef = useRef(null);
  const map = useRef(null);
  const markersRef = useRef({});
  const polylinesRef = useRef({});

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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
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
      center: { lat: 10.8505, lng: 76.2711 }, // Kerala center
      zoom: 8,
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
      loadRoutes();
    });
  };

  // Load and display routes
  const loadRoutes = () => {
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

    // Add city markers
    Object.entries(KERALA_CITIES).forEach(([cityName, coordinates]) => {
      const marker = new window.google.maps.Marker({
        position: coordinates,
        map: map.current,
        title: cityName,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: '#1976d2',
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-semibold">${cityName}</h3>
            <p class="text-sm text-gray-600">${coordinates.state}</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map.current, marker);
      });

      markersRef.current[`city_${cityName}`] = { marker, infoWindow };
    });

    // Add route markers and polylines
    KERALA_ROUTES.forEach(route => {
      if (filterStatus !== 'all' && route.status !== filterStatus) return;

      // Bus marker
      const busMarker = new window.google.maps.Marker({
        position: route.currentLocation,
        map: map.current,
        title: route.busNumber,
        icon: {
          path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 8,
          fillColor: route.status === 'active' ? '#4caf50' : route.status === 'delayed' ? '#ff9800' : '#f44336',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          rotation: 45 // Rotate arrow to show direction
        },
        animation: window.google.maps.Animation.DROP
      });

      const routeInfoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-3">
            <h3 class="font-semibold text-lg">${route.busNumber}</h3>
            <p class="text-sm text-gray-600">Route: ${route.name}</p>
            <p class="text-sm text-gray-600">Driver: ${route.driver}</p>
            <p class="text-sm text-gray-600">Speed: ${route.speed}</p>
            <p class="text-sm text-gray-600">ETA: ${route.eta}</p>
            <p class="text-sm">
              <span class="px-2 py-1 rounded text-xs ${route.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                ${route.status.toUpperCase()}
              </span>
            </p>
          </div>
        `
      });

      busMarker.addListener('click', () => {
        routeInfoWindow.open(map.current, busMarker);
        setSelectedRoute(route);
      });

      markersRef.current[route.id] = { marker: busMarker, infoWindow: routeInfoWindow };

      // Route polyline
      const fromCity = KERALA_CITIES[route.from];
      const toCity = KERALA_CITIES[route.to];
      
      if (fromCity && toCity) {
        const polyline = new window.google.maps.Polyline({
          path: [fromCity, route.currentLocation, toCity],
          geodesic: true,
          strokeColor: route.status === 'active' ? '#4caf50' : route.status === 'delayed' ? '#ff9800' : '#f44336',
          strokeOpacity: 0.6,
          strokeWeight: 4,
          map: map.current
        });

        polylinesRef.current[route.id] = polyline;
      }
    });

    // Fit map to show all routes
    const bounds = new window.google.maps.LatLngBounds();
    KERALA_ROUTES.forEach(route => {
      bounds.extend(route.currentLocation);
    });
    Object.values(KERALA_CITIES).forEach(coordinates => {
      bounds.extend(coordinates);
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

  useEffect(() => {
    if (mapLoaded) {
      loadRoutes();
    }
  }, [filterStatus, mapLoaded]);

  const handleMapTypeChange = (type) => {
    setMapType(type);
    if (map.current) {
      const mapTypeId = type === 'satellite' ? 
        window.google.maps.MapTypeId.SATELLITE : 
        window.google.maps.MapTypeId.ROADMAP;
      map.current.setMapTypeId(mapTypeId);
    }
  };

  const filteredRoutes = KERALA_ROUTES.filter(route => 
    filterStatus === 'all' || route.status === filterStatus
  );

  if (mapLoadError) {
    return (
      <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'w-full h-full'} flex items-center justify-center`}>
        <div className="text-center">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Google Maps failed to load</p>
          <p className="text-sm text-gray-400">Please check your API key configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'w-full h-full'} flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Radio className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-lg text-gray-900">Live GPS Tracking</h2>
            <p className="text-sm text-gray-600">Kerala Bus Network</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Filters"
          >
            <Filter className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleMapTypeChange(mapType === 'roadmap' ? 'satellite' : 'roadmap')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Map Type"
          >
            <Layers className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsTracking(!isTracking)}
            className={`p-2 rounded-lg transition-colors ${
              isTracking 
                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                : 'bg-green-100 text-green-600 hover:bg-green-200'
            }`}
            title={isTracking ? 'Stop Tracking' : 'Start Tracking'}
          >
            {isTracking ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            onClick={() => onToggleFullscreen && onToggleFullscreen()}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Status Filter:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="ml-2 px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Routes</option>
                <option value="active">Active</option>
                <option value="delayed">Delayed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="flex-1 relative">
        <div
          ref={mapRef}
          className="w-full h-full"
        />
        
        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <button
            onClick={() => {
              if (map.current) {
                map.current.setCenter({ lat: 10.8505, lng: 76.2711 });
                map.current.setZoom(8);
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

      {/* Status Bar */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Active: {filteredRoutes.filter(r => r.status === 'active').length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Delayed: {filteredRoutes.filter(r => r.status === 'delayed').length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Cancelled: {filteredRoutes.filter(r => r.status === 'cancelled').length}</span>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Last Updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveGPSMap;