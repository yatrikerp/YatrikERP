import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Bus, Clock, Wifi, Signal, Battery } from 'lucide-react';
import { toast } from 'react-hot-toast';

const LiveTrackingMap = ({ trackingData, onTrackBus }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(false);
  const mapRef = useRef(null);
  const map = useRef(null);
  const markerRef = useRef(null);
  const routeRendererRef = useRef(null);
  const routeServiceRef = useRef(null);
  
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
      lat: 10.8505,
      lng: 76.2711
    }
  };

  const data = trackingData || defaultTracking;

  // Load Google Maps API
  const loadGoogleMapsAPI = () => {
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    // Read API key from both Vite and CRA environments so either setup works
    const viteKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) || '';
    const craKey = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_GOOGLE_MAPS_API_KEY) || '';
    const apiKey = viteKey || craKey;

    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      console.log('Google Maps API key not configured. Using fallback interface.');
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

    const centerCoords = (data && data.coordinates && data.coordinates.lat && data.coordinates.lng)
      ? data.coordinates
      : defaultTracking.coordinates;

    map.current = new window.google.maps.Map(mapRef.current, {
      center: centerCoords,
      zoom: 15,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    // Add bus marker
    markerRef.current = new window.google.maps.Marker({
      position: centerCoords,
      map: map.current,
      title: `Bus ${data.busNumber}`,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#1976d2',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3
      },
      animation: window.google.maps.Animation.DROP
    });

    // Create info window
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div class="p-3">
          <h3 class="font-semibold text-lg">Bus ${data.busNumber}</h3>
          <p class="text-sm text-gray-600">Route: ${data.route}</p>
          <p class="text-sm text-gray-600">Status: ${data.status}</p>
          <p class="text-sm text-gray-600">Speed: ${data.currentSpeed}</p>
          <p class="text-sm text-gray-600">Last Update: ${data.lastUpdate}</p>
        </div>
      `
    });

    markerRef.current.addListener('click', () => {
      infoWindow.open(map.current, markerRef.current);
    });

    map.current.addListener('tilesloaded', () => {
      setMapLoaded(true);
    });

    // Try to draw route if we have enough info
    tryDrawRoute();
  };

  const tryDrawRoute = () => {
    if (!map.current || !window.google) return;

    const origin = data.originCoordinates || data.origin;
    const destination = data.destinationCoordinates || data.destination;
    if (!origin || !destination) return; // Not enough data to show route

    if (!routeServiceRef.current) {
      routeServiceRef.current = new window.google.maps.DirectionsService();
    }
    if (!routeRendererRef.current) {
      routeRendererRef.current = new window.google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#1e88e5',
          strokeOpacity: 0.85,
          strokeWeight: 6
        }
      });
      routeRendererRef.current.setMap(map.current);
    }

    const originRequest = typeof origin === 'string' ? origin : new window.google.maps.LatLng(origin.lat, origin.lng);
    const destRequest = typeof destination === 'string' ? destination : new window.google.maps.LatLng(destination.lat, destination.lng);

    routeServiceRef.current.route({
      origin: originRequest,
      destination: destRequest,
      travelMode: window.google.maps.TravelMode.DRIVING
    }, (result, status) => {
      if (status === window.google.maps.DirectionsStatus.OK) {
        routeRendererRef.current.setDirections(result);

        // Add start/end markers
        const legs = result.routes[0]?.legs || [];
        if (legs.length) {
          const start = legs[0].start_location;
          const end = legs[legs.length - 1].end_location;
          new window.google.maps.Marker({
            position: start,
            map: map.current,
            title: 'Start',
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#2e7d32',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3
            }
          });
          new window.google.maps.Marker({
            position: end,
            map: map.current,
            title: 'Destination',
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#e53935',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3
            }
          });

          // Fit bounds to route and current bus
          const bounds = new window.google.maps.LatLngBounds();
          result.routes[0].overview_path.forEach(p => bounds.extend(p));
          if (markerRef.current) bounds.extend(markerRef.current.getPosition());
          map.current.fitBounds(bounds);
        }
      }
    });
  };

  useEffect(() => {
    loadGoogleMapsAPI();
    
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      if (map.current) {
        map.current = null;
      }
      if (routeRendererRef.current) {
        routeRendererRef.current.setMap(null);
        routeRendererRef.current = null;
      }
    };
  }, []);

  // Update marker position when tracking data changes
  useEffect(() => {
    if (markerRef.current && trackingData?.coordinates) {
      markerRef.current.setPosition(trackingData.coordinates);
      if (map.current) {
        map.current.setCenter(trackingData.coordinates);
      }
    }
    // If origin/destination changed, redraw route
    if (trackingData?.origin || trackingData?.originCoordinates || trackingData?.destination || trackingData?.destinationCoordinates) {
      tryDrawRoute();
    }
  }, [trackingData]);

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
      'cancelled': {
        color: 'bg-red-100 text-red-800',
        icon: '🔴',
        text: 'Cancelled'
      },
      'waiting': {
        color: 'bg-purple-100 text-purple-800',
        icon: '🟣',
        text: 'Waiting'
      }
    };
    return configs[status] || configs['on-route'];
  };

  const statusConfig = getStatusConfig(data.status);

  const handleTrackBus = () => {
    setIsTracking(!isTracking);
    if (onTrackBus) {
      onTrackBus(data.busNumber, !isTracking);
    }
  };

  if (mapLoadError) {
    return (
      <div className="w-full h-96 bg-gray-200 flex items-center justify-center rounded-lg">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Google Maps failed to load</p>
          <p className="text-sm text-gray-400">Please check your API key configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{data.busNumber}</h3>
              <p className="text-sm text-gray-600">{data.route}</p>
            </div>
          </div>
          <button
            onClick={handleTrackBus}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isTracking 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="relative">
        <div
          ref={mapRef}
          className="w-full h-96"
        />
        
        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <button
            onClick={() => {
              if (map.current && markerRef.current) {
                map.current.setCenter(markerRef.current.getPosition());
                map.current.setZoom(16);
              }
            }}
            className="bg-white p-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
            title="Center on Bus"
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
      <div className="p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
              <span className="mr-1">{statusConfig.icon}</span>
              {statusConfig.text}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>ETA: {data.estimatedArrival}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Signal className="w-4 h-4" />
              <span>Strong</span>
            </div>
            <div className="flex items-center space-x-1">
              <Battery className="w-4 h-4" />
              <span>85%</span>
            </div>
            <div className="flex items-center space-x-1">
              <Wifi className="w-4 h-4" />
              <span>Online</span>
            </div>
          </div>
        </div>
        
        <div className="mt-3 flex items-center justify-between text-sm">
          <div>
            <span className="text-gray-500">Current Location: </span>
            <span className="font-medium">{data.currentLocation}</span>
          </div>
          <div>
            <span className="text-gray-500">Speed: </span>
            <span className="font-medium">{data.currentSpeed}</span>
          </div>
          <div>
            <span className="text-gray-500">Last Update: </span>
            <span className="font-medium">{data.lastUpdate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTrackingMap;