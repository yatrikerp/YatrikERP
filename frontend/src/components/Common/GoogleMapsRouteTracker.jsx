import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, RefreshCw, ExternalLink, Bus } from 'lucide-react';

const GoogleMapsRouteTracker = ({ 
  trip, 
  isTracking = false, 
  onLocationUpdate,
  className = "w-full h-full"
}) => {
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isApiConfigured, setIsApiConfigured] = useState(false);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);

  const getApiKey = () => (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) || undefined;

  // Check if Google Maps API is configured
  useEffect(() => {
    const apiKey = getApiKey();
    const configured = apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE' && apiKey.length > 10;
    setIsApiConfigured(configured);
    
    // For development, we can still show the interface even without API key
    if (!configured) {
      console.log('Google Maps API key not configured. Using fallback interface.');
      // Set map as loaded immediately for instant display
      setMapLoaded(true);
    }
  }, []);

  // Initialize map when component mounts or trip changes
  useEffect(() => {
    if (trip) {
      if (isApiConfigured && !mapLoaded) {
        initializeMap();
      } else if (!isApiConfigured) {
        // For instant display without API key
        setMapLoaded(true);
      }
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

    // Add current location marker (Uber-style bus marker)
    if (trip.coordinates) {
      const currentMarker = new window.google.maps.Marker({
        position: { lat: trip.coordinates.lat, lng: trip.coordinates.lng },
        map: map,
        title: `Bus ${trip.busId?.busNumber || 'Unknown'} - ${trip.currentLocation}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <!-- Outer pulse circle -->
              <circle cx="24" cy="24" r="22" fill="#2196F3" opacity="0.2"/>
              <circle cx="24" cy="24" r="18" fill="#2196F3" opacity="0.4"/>
              <!-- Main bus circle -->
              <circle cx="24" cy="24" r="14" fill="#1976D2" stroke="#FFFFFF" stroke-width="3"/>
              <!-- Bus icon -->
              <rect x="14" y="18" width="20" height="12" rx="2" fill="#FFFFFF"/>
              <rect x="16" y="20" width="7" height="5" fill="#1976D2" opacity="0.7"/>
              <rect x="25" y="20" width="7" height="5" fill="#1976D2" opacity="0.7"/>
              <circle cx="18" cy="28" r="1.5" fill="#333333"/>
              <circle cx="30" cy="28" r="1.5" fill="#333333"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(48, 48),
          anchor: new window.google.maps.Point(24, 24)
        },
        animation: window.google.maps.Animation.DROP,
        zIndex: 1000
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
      // Uber-style route path with gradient effect
      const routePath = new window.google.maps.Polyline({
        path: routeCoordinates,
        geodesic: true,
        strokeColor: '#1976D2',
        strokeOpacity: 1.0,
        strokeWeight: 5,
        map: map,
        zIndex: 100,
        icons: [{
          icon: {
            path: 'M 0,-1 0,1',
            strokeOpacity: 1,
            strokeWeight: 2,
            scale: 3
          },
          offset: '0',
          repeat: '20px'
        }]
      });
      
      // Add a lighter background line for depth
      new window.google.maps.Polyline({
        path: routeCoordinates,
        geodesic: true,
        strokeColor: '#90CAF9',
        strokeOpacity: 0.6,
        strokeWeight: 8,
        map: map,
        zIndex: 50
      });

      mapRef.current.routePath = routePath;
      mapRef.current.backgroundPath = routePath; // Store reference

      // Add start and end markers with city names
      if (routeCoordinates.length > 0) {
        // Get city names from trip data
        const startCity = tripData.routeId?.startingPoint?.city || 'Start';
        const endCity = tripData.routeId?.endingPoint?.city || 'End';
        
        // Start marker (Green with A)
        const startMarker = new window.google.maps.Marker({
          position: routeCoordinates[0],
          map: map,
          title: `Starting Point: ${startCity}`,
          label: {
            text: 'A',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold'
          },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 15,
            fillColor: '#00C853',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3
          }
        });

        // Add info window for start marker
        const startInfoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="font-weight: 600; color: #00C853; margin: 0 0 4px 0;">Starting Point</h3>
              <p style="margin: 0; font-size: 14px; color: #333;">${startCity}</p>
              ${tripData.routeId?.startingPoint?.location ? 
                `<p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">${tripData.routeId.startingPoint.location}</p>` 
                : ''}
            </div>
          `
        });

        startMarker.addListener('click', () => {
          startInfoWindow.open(map, startMarker);
        });

        // End marker (Red with B)
        const endMarker = new window.google.maps.Marker({
          position: routeCoordinates[routeCoordinates.length - 1],
          map: map,
          title: `Destination: ${endCity}`,
          label: {
            text: 'B',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold'
          },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 15,
            fillColor: '#D32F2F',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3
          }
        });

        // Add info window for end marker
        const endInfoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="font-weight: 600; color: #D32F2F; margin: 0 0 4px 0;">Destination</h3>
              <p style="margin: 0; font-size: 14px; color: #333;">${endCity}</p>
              ${tripData.routeId?.endingPoint?.location ? 
                `<p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">${tripData.routeId.endingPoint.location}</p>` 
                : ''}
            </div>
          `
        });

        endMarker.addListener('click', () => {
          endInfoWindow.open(map, endMarker);
        });

        mapRef.current.markers.push(startMarker, endMarker);
        
        // Fit map bounds to show entire route
        const bounds = new window.google.maps.LatLngBounds();
        routeCoordinates.forEach(coord => bounds.extend(coord));
        map.fitBounds(bounds);
        
        // Add some padding to the bounds
        setTimeout(() => {
          const zoom = map.getZoom();
          map.setZoom(zoom - 0.5); // Zoom out slightly for better view
        }, 500);
      }
    }
  };

  const generateSampleRoute = (tripData) => {
    // Kerala city coordinates mapping (actual locations)
    const keralaCoordinates = {
      'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
      'Kollam': { lat: 8.8932, lng: 76.6141 },
      'Alappuzha': { lat: 9.4981, lng: 76.3388 },
      'Kottayam': { lat: 9.5916, lng: 76.5222 },
      'Kochi': { lat: 9.9312, lng: 76.2673 },
      'Ernakulam': { lat: 9.9816, lng: 76.2999 },
      'Thrissur': { lat: 10.5276, lng: 76.2144 },
      'Guruvayur': { lat: 10.5949, lng: 76.0400 },
      'Palakkad': { lat: 10.7867, lng: 76.6548 },
      'Malappuram': { lat: 11.0510, lng: 76.0711 },
      'Kozhikode': { lat: 11.2588, lng: 75.7804 },
      'Wayanad': { lat: 11.6854, lng: 76.1320 },
      'Kalpetta': { lat: 11.6854, lng: 76.1320 },
      'Kannur': { lat: 11.8745, lng: 75.3704 },
      'Kasaragod': { lat: 12.4996, lng: 74.9869 },
      'Bangalore': { lat: 12.9716, lng: 77.5946 },
      'Salem': { lat: 11.6643, lng: 78.1460 },
      'Madurai': { lat: 9.9252, lng: 78.1198 },
      'Hyderabad': { lat: 17.3850, lng: 78.4867 },
      'Mumbai': { lat: 19.0760, lng: 72.8777 },
      'Goa': { lat: 15.2993, lng: 74.1240 },
      'Mangalore': { lat: 12.9141, lng: 74.8560 },
      'Chennai': { lat: 13.0827, lng: 80.2707 },
      'Coimbatore': { lat: 11.0168, lng: 76.9558 },
      'Tirupati': { lat: 13.6288, lng: 79.4192 }
    };

    // Try to get route starting and ending points from trip data
    let startPoint = null;
    let endPoint = null;
    
    if (tripData.routeId) {
      const route = tripData.routeId;
      
      // Get starting point coordinates
      if (route.startingPoint) {
        const startCity = route.startingPoint.city || route.startingPoint;
        if (typeof startCity === 'string' && keralaCoordinates[startCity]) {
          startPoint = keralaCoordinates[startCity];
        } else if (route.startingPoint.coordinates) {
          const coords = route.startingPoint.coordinates;
          if (coords.latitude && coords.longitude) {
            startPoint = { lat: coords.latitude, lng: coords.longitude };
          }
        }
      }
      
      // Get ending point coordinates
      if (route.endingPoint) {
        const endCity = route.endingPoint.city || route.endingPoint;
        if (typeof endCity === 'string' && keralaCoordinates[endCity]) {
          endPoint = keralaCoordinates[endCity];
        } else if (route.endingPoint.coordinates) {
          const coords = route.endingPoint.coordinates;
          if (coords.latitude && coords.longitude) {
            endPoint = { lat: coords.latitude, lng: coords.longitude };
          }
        }
      }
    }
    
    // Also try to extract cities from route name if coordinates not found
    if (!startPoint || !endPoint) {
      const routeName = tripData.routeId?.routeName || '';
      const routeParts = routeName.split(' → ');
      if (routeParts.length === 2) {
        const startCity = routeParts[0].trim();
        const endCity = routeParts[1].trim();
        
        if (keralaCoordinates[startCity] && !startPoint) {
          startPoint = keralaCoordinates[startCity];
        }
        if (keralaCoordinates[endCity] && !endPoint) {
          endPoint = keralaCoordinates[endCity];
        }
      }
    }
    
    // Fallback to default route if no valid coordinates found
    if (!startPoint || !endPoint) {
      startPoint = { lat: 8.5241, lng: 76.9366 }; // Thiruvananthapuram
      endPoint = { lat: 9.5916, lng: 76.5222 };    // Kottayam
    }

    // Generate intermediate points for a more realistic route
    const intermediatePoints = generateIntermediatePoints(startPoint, endPoint);
    
    return [startPoint, ...intermediatePoints, endPoint];
  };

  const generateIntermediatePoints = (start, end) => {
    // Generate intermediate points along the route for better visualization
    // Using Bezier curve-like path for more realistic road routing
    const points = [];
    const numPoints = 8; // More points for smoother curve
    
    // Add curvature offset based on distance
    const distance = Math.sqrt(
      Math.pow(end.lat - start.lat, 2) + Math.pow(end.lng - start.lng, 2)
    );
    const curveOffset = distance * 0.15; // 15% of distance for curve
    
    // Calculate perpendicular direction for curve
    const dx = end.lng - start.lng;
    const dy = end.lat - start.lat;
    const perpLng = -dy * curveOffset;
    const perpLat = dx * curveOffset;
    
    for (let i = 1; i < numPoints; i++) {
      const t = i / numPoints;
      
      // Quadratic Bezier curve formula for more natural path
      const curveStrength = Math.sin(t * Math.PI); // Peak at middle
      
      const lat = start.lat + (end.lat - start.lat) * t + perpLat * curveStrength;
      const lng = start.lng + (end.lng - start.lng) * t + perpLng * curveStrength;
      
      // Add slight random variation to simulate road irregularities
      const microVariation = 0.002;
      points.push({
        lat: lat + (Math.random() - 0.5) * microVariation,
        lng: lng + (Math.random() - 0.5) * microVariation
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
      <div className={`${className} relative bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col rounded-lg`}>
        {trip ? (
          <>
            {/* Header */}
            <div className="p-4 bg-white bg-opacity-80 border-b border-blue-200 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">Live Tracking</span>
                </div>
                <div className="text-xs text-gray-500">
                  {trip.currentSpeed || '0 km/h'} • {trip.lastUpdate || new Date().toLocaleTimeString()}
                </div>
              </div>
              </div>
              
            {/* Route Information */}
            <div className="flex-1 p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bus className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Bus Tracking</h3>
                <p className="text-gray-600 mb-4">Route and location information</p>
                </div>
                
              {/* Route Details */}
              <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Route</span>
                    <span className="text-sm font-semibold text-gray-900">{trip.routeId?.routeName || 'Unknown Route'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Bus Number</span>
                    <span className="text-sm font-semibold text-gray-900">{trip.busId?.busNumber || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Current Location</span>
                    <span className="text-sm font-semibold text-gray-900">{trip.currentLocation || 'Current Location'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Speed</span>
                    <span className="text-sm font-semibold text-green-600">{trip.currentSpeed || '0 km/h'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Coordinates</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {trip.coordinates?.lat?.toFixed(4) || '0.0000'}, {trip.coordinates?.lng?.toFixed(4) || '0.0000'}
                    </span>
                  </div>
                  {trip.routeId?.startingPoint && trip.routeId?.endingPoint && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">From</span>
                        <span className="text-sm font-semibold text-gray-900">{trip.routeId.startingPoint.city || trip.routeId.startingPoint}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">To</span>
                        <span className="text-sm font-semibold text-gray-900">{trip.routeId.endingPoint.city || trip.routeId.endingPoint}</span>
                      </div>
                    </>
                  )}
                </div>
                </div>
                
              {/* Map Placeholder */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="aspect-video bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Route Map View</p>
                    <p className="text-xs text-gray-500">Configure Google Maps API key for full map functionality</p>
                  </div>
                </div>
              </div>
              
              {/* Action Button */}
              <div className="mt-4">
                <button
                  onClick={openInGoogleMaps}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in Google Maps
                </button>
              </div>

              {/* Features */}
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 mt-4">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Real-time Updates</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Navigation className="w-3 h-3" />
                  <span>Route Tracking</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Bus className="w-3 h-3" />
                  <span>Live Location</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Bus Tracking</h3>
              <p className="text-gray-600 mb-4">Select a trip to view live tracking information</p>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live Updates</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Navigation className="w-4 h-4" />
                  <span>Route Tracking</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Bus className="w-4 h-4" />
                  <span>GPS Location</span>
                </div>
              </div>
              </div>
            </div>
          )}
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
