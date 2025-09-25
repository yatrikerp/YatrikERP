import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, RefreshCw, ExternalLink, Settings } from 'lucide-react';

const GoogleMapsRouteTracker = ({ 
  trip, 
  isTracking = false, 
  onLocationUpdate,
  className = "w-full h-full"
}) => {
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routePath, setRoutePath] = useState(null);
  const [isApiConfigured, setIsApiConfigured] = useState(false);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);
  const [locationHistory, setLocationHistory] = useState([]);

  const getApiKey = () => (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) || undefined;

  // Check if Google Maps API is configured
  useEffect(() => {
    const apiKey = getApiKey();
    setIsApiConfigured(apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE' && apiKey.length > 10);
  }, []);

  // Initialize map when component mounts or trip changes
  useEffect(() => {
    if (trip && isApiConfigured && !mapLoaded) {
      initializeMap();
    }
  }, [trip, isApiConfigured, mapLoaded]);

  // Update map when trip data changes
  useEffect(() => {
    if (mapLoaded && trip) {
      updateMapWithTripData();
    }
  }, [trip, mapLoaded]);

  // Real-time location updates
  useEffect(() => {
    let interval;
    if (isRealTimeEnabled && trip && mapLoaded) {
      interval = setInterval(() => {
        simulateLocationUpdate();
      }, 5000); // Update every 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRealTimeEnabled, trip, mapLoaded]);

  const initializeMap = () => {
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API not loaded');
      return;
    }

    const mapElement = mapRef.current;
    if (!mapElement) return;

    // Create map instance
    const map = new window.google.maps.Map(mapElement, {
      zoom: 13,
      center: trip.coordinates ? { lat: trip.coordinates.lat, lng: trip.coordinates.lng } : { lat: 9.9312, lng: 76.2673 },
      mapTypeId: 'roadmap',
      disableDefaultUI: false,
      zoomControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      mapTypeControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    // Store map instance for later use
    mapRef.current.mapInstance = map;
    setMapLoaded(true);
  };

  const updateMapWithTripData = () => {
    if (!mapRef.current?.mapInstance || !trip) return;

    const map = mapRef.current.mapInstance;
    
    // Clear existing markers and paths
    if (mapRef.current.markers) {
      mapRef.current.markers.forEach(marker => marker.setMap(null));
    }
    if (mapRef.current.routePath) {
      mapRef.current.routePath.setMap(null);
    }

    // Create markers array
    mapRef.current.markers = [];

    // Add current location marker
    if (trip.coordinates) {
      const currentMarker = new window.google.maps.Marker({
        position: { lat: trip.coordinates.lat, lng: trip.coordinates.lng },
        map: map,
        title: `Bus ${trip.busId?.busNumber || 'Unknown'} - ${trip.currentLocation}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#E91E63" stroke="#FFFFFF" stroke-width="3"/>
              <path d="M12 16h16v8H12z" fill="#FFFFFF"/>
              <circle cx="20" cy="20" r="3" fill="#E91E63"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 20)
        },
        animation: window.google.maps.Animation.BOUNCE
      });

      mapRef.current.markers.push(currentMarker);

      // Center map on current location
      map.setCenter({ lat: trip.coordinates.lat, lng: trip.coordinates.lng });

      // Add info window for current location
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-semibold text-gray-900">${trip.busId?.busNumber || 'Bus'}</h3>
            <p class="text-sm text-gray-600">${trip.currentLocation}</p>
            <p class="text-sm text-gray-500">Speed: ${trip.currentSpeed}</p>
            <p class="text-xs text-gray-400">Updated: ${trip.lastUpdate}</p>
          </div>
        `
      });

      currentMarker.addListener('click', () => {
        infoWindow.open(map, currentMarker);
      });
    }

    // Generate route path if we have start and end coordinates
    generateRoutePath(trip);
  };

  const generateRoutePath = async (tripData) => {
    if (!mapRef.current?.mapInstance || !tripData) return;

    const map = mapRef.current.mapInstance;
    
    // For demonstration, we'll create a simple path between known Kerala cities
    // In a real implementation, you would use the Google Directions API
    const routeCoordinates = generateSampleRoute(tripData);
    
    if (routeCoordinates.length > 1) {
      const routePath = new window.google.maps.Polyline({
        path: routeCoordinates,
        geodesic: true,
        strokeColor: '#E91E63',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: map
      });

      mapRef.current.routePath = routePath;

      // Add start and end markers
      if (routeCoordinates.length > 0) {
        // Start marker
        const startMarker = new window.google.maps.Marker({
          position: routeCoordinates[0],
          map: map,
          title: 'Start Point',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                <circle cx="15" cy="15" r="12" fill="#00BCD4" stroke="#FFFFFF" stroke-width="2"/>
                <text x="15" y="19" text-anchor="middle" fill="white" font-size="12" font-weight="bold">S</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(30, 30),
            anchor: new window.google.maps.Point(15, 15)
          }
        });

        // End marker
        const endMarker = new window.google.maps.Marker({
          position: routeCoordinates[routeCoordinates.length - 1],
          map: map,
          title: 'End Point',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                <circle cx="15" cy="15" r="12" fill="#4CAF50" stroke="#FFFFFF" stroke-width="2"/>
                <text x="15" y="19" text-anchor="middle" fill="white" font-size="12" font-weight="bold">E</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(30, 30),
            anchor: new window.google.maps.Point(15, 15)
          }
        });

        mapRef.current.markers.push(startMarker, endMarker);
      }
    }
  };

  const generateSampleRoute = (tripData) => {
    // Use the specific coordinates from the provided URL
    // URL: http://localhost:5000/route/v1/driving/76.9558,8.5241;76.5219,9.5916
    const specificRoute = [
      { lat: 8.5241, lng: 76.9558 }, // Start point (Thiruvananthapuram area)
      { lat: 9.5916, lng: 76.5219 }  // End point (Kottayam area)
    ];

    // Generate intermediate points for a more realistic route
    const intermediatePoints = generateIntermediatePoints(specificRoute[0], specificRoute[1]);
    
    return [specificRoute[0], ...intermediatePoints, specificRoute[1]];
  };

  const generateIntermediatePoints = (start, end) => {
    // Generate intermediate points along the route for better visualization
    const points = [];
    const numPoints = 5; // Number of intermediate points
    
    for (let i = 1; i < numPoints; i++) {
      const ratio = i / numPoints;
      const lat = start.lat + (end.lat - start.lat) * ratio;
      const lng = start.lng + (end.lng - start.lng) * ratio;
      
      // Add some variation to make the route more realistic
      const variation = 0.01;
      points.push({
        lat: lat + (Math.random() - 0.5) * variation,
        lng: lng + (Math.random() - 0.5) * variation
      });
    }
    
    return points;
  };

  const simulateLocationUpdate = () => {
    if (!trip || !mapRef.current?.mapInstance) return;

    // Simulate bus movement along the route
    const route = generateSampleRoute(trip);
    const currentIndex = Math.floor(Math.random() * route.length);
    const newLocation = route[currentIndex];
    
    // Add some random variation to simulate real GPS movement
    const variation = 0.001;
    const updatedLocation = {
      lat: newLocation.lat + (Math.random() - 0.5) * variation,
      lng: newLocation.lng + (Math.random() - 0.5) * variation
    };

    // Update location history
    setLocationHistory(prev => [...prev.slice(-10), updatedLocation]);
    setCurrentLocation(updatedLocation);

    // Update the map marker
    if (mapRef.current.markers && mapRef.current.markers.length > 0) {
      const busMarker = mapRef.current.markers[0]; // First marker is the bus
      busMarker.setPosition(updatedLocation);
      
      // Update info window content
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-semibold text-gray-900">${trip.busId?.busNumber || 'Bus'}</h3>
            <p class="text-sm text-gray-600">${trip.currentLocation}</p>
            <p class="text-sm text-gray-500">Speed: ${trip.currentSpeed}</p>
            <p class="text-xs text-gray-400">Updated: Just now</p>
          </div>
        `
      });
      
      // Close any existing info window and open new one
      if (mapRef.current.infoWindow) {
        mapRef.current.infoWindow.close();
      }
      mapRef.current.infoWindow = infoWindow;
      infoWindow.open(mapRef.current.mapInstance, busMarker);
    }

    // Call the location update callback
    if (onLocationUpdate) {
      onLocationUpdate({
        ...trip,
        coordinates: updatedLocation,
        lastUpdate: 'Just now'
      });
    }
  };

  const handleRefreshLocation = () => {
    if (onLocationUpdate) {
      onLocationUpdate(trip);
    }
  };

  const toggleRealTimeTracking = () => {
    setIsRealTimeEnabled(!isRealTimeEnabled);
  };

  const openInGoogleMaps = () => {
    if (trip?.coordinates) {
      const url = `https://www.google.com/maps?q=${trip.coordinates.lat},${trip.coordinates.lng}`;
      window.open(url, '_blank');
    }
  };

  // Load Google Maps API script if not already loaded
  useEffect(() => {
    const key = getApiKey();
    if (!window.google && isApiConfigured && key) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        try { console.log('Google Maps API loaded successfully'); } catch {}
        if (trip) {
          initializeMap();
        }
      };
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
      };
      document.head.appendChild(script);
    }
  }, [isApiConfigured]);

  if (!isApiConfigured) {
    return (
      <div className={`${className} bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center relative overflow-hidden`}>
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <MapPin className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Google Maps Integration</h3>
          <p className="text-gray-600 mb-4">Live bus tracking map will be displayed here</p>
          
          {/* API Key Configuration Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">API Key Required</span>
            </div>
            <p className="text-xs text-yellow-700 mb-2">
              To enable Google Maps integration, add your API key to the environment variables (VITE_GOOGLE_MAPS_API_KEY).
            </p>
            <a
              href="https://console.cloud.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Get API Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          
          {/* Bus Location Info */}
          {trip && (
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">Bus Location</span>
              </div>
              <p className="text-sm text-gray-600">{trip.currentLocation}</p>
              <p className="text-xs text-gray-500 mt-1">
                Coordinates: {trip.coordinates?.lat?.toFixed(4)}, {trip.coordinates?.lng?.toFixed(4)}
              </p>
              <button
                onClick={openInGoogleMaps}
                className="mt-2 text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Open in Google Maps <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ minHeight: '400px' }}
      />
      
      {/* Map Overlay Controls */}
      <div className="absolute top-4 left-4 bg-white rounded-lg p-3 shadow-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">Live Tracking</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={toggleRealTimeTracking}
          className={`px-3 py-2 rounded-lg shadow-lg border transition-all duration-200 flex items-center gap-2 ${
            isRealTimeEnabled 
              ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' 
              : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
          }`}
          title={isRealTimeEnabled ? "Stop Real-time Tracking" : "Start Real-time Tracking"}
        >
          <div className={`w-2 h-2 rounded-full ${isRealTimeEnabled ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
          {isRealTimeEnabled ? 'Live' : 'Live'}
        </button>
        
        <button
          onClick={handleRefreshLocation}
          className="bg-white hover:bg-gray-50 text-gray-700 font-semibold px-3 py-2 rounded-lg shadow-lg border border-gray-200 transition-all duration-200 flex items-center gap-2"
          title="Refresh Location"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Bus Info Overlay */}
      {trip && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg p-4 shadow-lg border border-gray-200 max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Bus {trip.busId?.busNumber}</span>
          </div>
          <p className="text-sm text-gray-600 mb-1">{trip.currentLocation}</p>
          <p className="text-xs text-gray-500">Speed: {trip.currentSpeed}</p>
          <p className="text-xs text-gray-400">Updated: {trip.lastUpdate}</p>
        </div>
      )}
    </div>
  );
};

export default GoogleMapsRouteTracker;
