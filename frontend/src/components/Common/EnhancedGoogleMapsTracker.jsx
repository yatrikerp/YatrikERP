import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, RefreshCw, ExternalLink, Bus, Settings, AlertCircle } from 'lucide-react';

const EnhancedGoogleMapsTracker = ({ 
  trip, 
  isTracking = false, 
  onLocationUpdate,
  className = "w-full h-full"
}) => {
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isApiConfigured, setIsApiConfigured] = useState(false);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [showApiKeySetup, setShowApiKeySetup] = useState(false);

  const getApiKey = () => (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) || undefined;

  // Check if Google Maps API is configured
  useEffect(() => {
    const apiKey = getApiKey();
    const configured = apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE' && apiKey.length > 10;
    setIsApiConfigured(configured);
    
    if (!configured) {
      console.log('Google Maps API key not configured. Using enhanced fallback interface.');
      setMapLoaded(true);
    }
  }, []);

  // Initialize map when component mounts or trip changes
  useEffect(() => {
    if (trip) {
      if (isApiConfigured && !mapLoaded) {
        initializeMap();
      } else if (!isApiConfigured) {
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
      setMapError('Google Maps API not loaded');
      return;
    }

    const mapElement = mapRef.current;
    if (!mapElement) return;

    try {
      // Create map instance with enhanced styling
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
          },
          {
            featureType: 'transit',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#f0f0f0' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#e3f2fd' }]
          }
        ]
      });

      // Store map instance for later use
      mapRef.current.mapInstance = map;
      setMapLoaded(true);
      setMapError(null);
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Failed to initialize map');
    }
  };

  const updateMapWithTripData = () => {
    if (!mapRef.current?.mapInstance || !trip) return;

    const map = mapRef.current.mapInstance;
    
    try {
      // Clear existing markers and paths
      if (mapRef.current.markers) {
        mapRef.current.markers.forEach(marker => marker.setMap(null));
      }
      if (mapRef.current.routePath) {
        mapRef.current.routePath.setMap(null);
      }

      // Create markers array
      mapRef.current.markers = [];

      // Add current location marker with enhanced styling
      if (trip.coordinates) {
        const currentMarker = new window.google.maps.Marker({
          position: { lat: trip.coordinates.lat, lng: trip.coordinates.lng },
          map: map,
          title: `Bus ${trip.busId?.busNumber || 'Unknown'} - ${trip.currentLocation}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
                <!-- Outer pulse circles -->
                <circle cx="28" cy="28" r="26" fill="#2196F3" opacity="0.1"/>
                <circle cx="28" cy="28" r="20" fill="#2196F3" opacity="0.2"/>
                <circle cx="28" cy="28" r="14" fill="#2196F3" opacity="0.3"/>
                <!-- Main bus circle -->
                <circle cx="28" cy="28" r="12" fill="#1976D2" stroke="#FFFFFF" stroke-width="3"/>
                <!-- Bus icon -->
                <rect x="18" y="22" width="20" height="12" rx="2" fill="#FFFFFF"/>
                <rect x="20" y="24" width="7" height="5" fill="#1976D2" opacity="0.7"/>
                <rect x="29" y="24" width="7" height="5" fill="#1976D2" opacity="0.7"/>
                <circle cx="22" cy="32" r="1.5" fill="#333333"/>
                <circle cx="34" cy="32" r="1.5" fill="#333333"/>
                <!-- Speed indicator -->
                <circle cx="28" cy="16" r="6" fill="#4CAF50" stroke="#FFFFFF" stroke-width="2"/>
                <text x="28" y="20" text-anchor="middle" fill="white" font-size="8" font-weight="bold">${trip.currentSpeed?.replace(' km/h', '') || '0'}</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(56, 56),
            anchor: new window.google.maps.Point(28, 28)
          },
          animation: window.google.maps.Animation.DROP,
          zIndex: 1000
        });

        mapRef.current.markers.push(currentMarker);

        // Center map on current location
        map.setCenter({ lat: trip.coordinates.lat, lng: trip.coordinates.lng });

        // Add enhanced info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <div style="width: 8px; height: 8px; background: #4CAF50; border-radius: 50%; margin-right: 8px; animation: pulse 2s infinite;"></div>
                <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1976D2;">${trip.busId?.busNumber || 'Bus'}</h3>
              </div>
              <p style="margin: 4px 0; font-size: 14px; color: #333;">${trip.currentLocation}</p>
              <p style="margin: 4px 0; font-size: 13px; color: #666;">Speed: <span style="color: #4CAF50; font-weight: 600;">${trip.currentSpeed}</span></p>
              <p style="margin: 4px 0; font-size: 12px; color: #999;">Updated: ${trip.lastUpdate}</p>
              <div style="margin-top: 8px; padding: 6px; background: #f5f5f5; border-radius: 4px;">
                <p style="margin: 0; font-size: 12px; color: #666;">Route: ${trip.routeId?.routeName || 'Unknown Route'}</p>
              </div>
            </div>
            <style>
              @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
              }
            </style>
          `
        });

        currentMarker.addListener('click', () => {
          infoWindow.open(map, currentMarker);
        });
      }

      // Generate enhanced route path
      generateEnhancedRoutePath(trip);
    } catch (error) {
      console.error('Error updating map:', error);
      setMapError('Failed to update map');
    }
  };

  const generateEnhancedRoutePath = async (tripData) => {
    if (!mapRef.current?.mapInstance || !tripData) return;

    const map = mapRef.current.mapInstance;
    
    try {
      // Generate route coordinates
      const routeCoordinates = generateSampleRoute(tripData);
      
      if (routeCoordinates.length > 1) {
        // Create enhanced route path with gradient effect
        const routePath = new window.google.maps.Polyline({
          path: routeCoordinates,
          geodesic: true,
          strokeColor: '#1976D2',
          strokeOpacity: 1.0,
          strokeWeight: 6,
          map: map,
          zIndex: 100,
          icons: [{
            icon: {
              path: 'M 0,-1 0,1',
              strokeOpacity: 1,
              strokeWeight: 2,
              scale: 4
            },
            offset: '0',
            repeat: '20px'
          }]
        });
        
        // Add background line for depth
        new window.google.maps.Polyline({
          path: routeCoordinates,
          geodesic: true,
          strokeColor: '#90CAF9',
          strokeOpacity: 0.6,
          strokeWeight: 10,
          map: map,
          zIndex: 50
        });

        mapRef.current.routePath = routePath;

        // Add enhanced start and end markers
        if (routeCoordinates.length > 0) {
          const startCity = tripData.routeId?.startingPoint?.city || 'Start';
          const endCity = tripData.routeId?.endingPoint?.city || 'End';
          
          // Enhanced start marker
          const startMarker = new window.google.maps.Marker({
            position: routeCoordinates[0],
            map: map,
            title: `Starting Point: ${startCity}`,
            label: {
              text: 'A',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold'
            },
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 18,
              fillColor: '#00C853',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 4
            }
          });

          // Enhanced end marker
          const endMarker = new window.google.maps.Marker({
            position: routeCoordinates[routeCoordinates.length - 1],
            map: map,
            title: `Destination: ${endCity}`,
            label: {
              text: 'B',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold'
            },
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 18,
              fillColor: '#D32F2F',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 4
            }
          });

          mapRef.current.markers.push(startMarker, endMarker);
          
          // Fit map bounds to show entire route
          const bounds = new window.google.maps.LatLngBounds();
          routeCoordinates.forEach(coord => bounds.extend(coord));
          map.fitBounds(bounds);
          
          // Add padding to bounds
          setTimeout(() => {
            const zoom = map.getZoom();
            map.setZoom(zoom - 0.5);
          }, 500);
        }
      }
    } catch (error) {
      console.error('Error generating route path:', error);
    }
  };

  const generateSampleRoute = (tripData) => {
    // Kerala city coordinates mapping
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

    let startPoint = null;
    let endPoint = null;
    
    if (tripData.routeId) {
      const route = tripData.routeId;
      
      if (route.startingPoint) {
        const startCity = route.startingPoint.city || route.startingPoint;
        if (typeof startCity === 'string' && keralaCoordinates[startCity]) {
          startPoint = keralaCoordinates[startCity];
        }
      }
      
      if (route.endingPoint) {
        const endCity = route.endingPoint.city || route.endingPoint;
        if (typeof endCity === 'string' && keralaCoordinates[endCity]) {
          endPoint = keralaCoordinates[endCity];
        }
      }
    }
    
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
    
    if (!startPoint || !endPoint) {
      startPoint = { lat: 8.5241, lng: 76.9366 }; // Thiruvananthapuram
      endPoint = { lat: 9.5916, lng: 76.5222 };    // Kottayam
    }

    const intermediatePoints = generateIntermediatePoints(startPoint, endPoint);
    return [startPoint, ...intermediatePoints, endPoint];
  };

  const generateIntermediatePoints = (start, end) => {
    const points = [];
    const numPoints = 10;
    
    const distance = Math.sqrt(
      Math.pow(end.lat - start.lat, 2) + Math.pow(end.lng - start.lng, 2)
    );
    const curveOffset = distance * 0.2;
    
    const dx = end.lng - start.lng;
    const dy = end.lat - start.lat;
    const perpLng = -dy * curveOffset;
    const perpLat = dx * curveOffset;
    
    for (let i = 1; i < numPoints; i++) {
      const t = i / numPoints;
      const curveStrength = Math.sin(t * Math.PI);
      
      const lat = start.lat + (end.lat - start.lat) * t + perpLat * curveStrength;
      const lng = start.lng + (end.lng - start.lng) * t + perpLng * curveStrength;
      
      const microVariation = 0.003;
      points.push({
        lat: lat + (Math.random() - 0.5) * microVariation,
        lng: lng + (Math.random() - 0.5) * microVariation
      });
    }
    
    return points;
  };

  const simulateLocationUpdate = () => {
    if (!trip || !mapRef.current?.mapInstance) return;

    const route = generateSampleRoute(trip);
    const currentIndex = Math.floor(Math.random() * route.length);
    const newLocation = route[currentIndex];
    
    const variation = 0.002;
    const updatedLocation = {
      lat: newLocation.lat + (Math.random() - 0.5) * variation,
      lng: newLocation.lng + (Math.random() - 0.5) * variation
    };

    if (mapRef.current.markers && mapRef.current.markers.length > 0) {
      const busMarker = mapRef.current.markers[0];
      busMarker.setPosition(updatedLocation);
    }

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

  // Load Google Maps API script
  useEffect(() => {
    const key = getApiKey();
    if (!window.google && isApiConfigured && key) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google Maps API loaded successfully');
        if (trip) {
          initializeMap();
        }
      };
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
        setMapError('Failed to load Google Maps API');
      };
      document.head.appendChild(script);
    }
  }, [isApiConfigured]);

  if (!isApiConfigured) {
    return (
      <div className={`${className} relative bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col rounded-lg`}>
        {trip ? (
          <>
            {/* Enhanced Header */}
            <div className="p-4 bg-white bg-opacity-90 border-b border-blue-200 rounded-t-lg">
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
              
            {/* Enhanced Route Information */}
            <div className="flex-1 p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Bus className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Live Bus Tracking</h3>
                <p className="text-gray-600 mb-4">Route and location information</p>
              </div>
                
              {/* Enhanced Route Details */}
              <div className="bg-white rounded-xl p-6 mb-6 shadow-lg border border-gray-100">
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Route</span>
                    <span className="text-sm font-semibold text-gray-900">{trip.routeId?.routeName || 'Unknown Route'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Bus Number</span>
                    <span className="text-sm font-semibold text-gray-900">{trip.busId?.busNumber || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Current Location</span>
                    <span className="text-sm font-semibold text-gray-900">{trip.currentLocation || 'Current Location'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Speed</span>
                    <span className="text-sm font-semibold text-green-600">{trip.currentSpeed || '0 km/h'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-gray-600">Coordinates</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {trip.coordinates?.lat?.toFixed(4) || '0.0000'}, {trip.coordinates?.lng?.toFixed(4) || '0.0000'}
                    </span>
                  </div>
                </div>
              </div>
                
              {/* Enhanced Map Placeholder */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="aspect-video bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 rounded-xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white to-transparent opacity-20"></div>
                  <div className="text-center z-10">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <MapPin className="w-8 h-8 text-blue-500" />
                    </div>
                    <p className="text-lg font-semibold text-gray-700 mb-2">Interactive Map View</p>
                    <p className="text-sm text-gray-600 mb-4">Configure Google Maps API key for full map functionality</p>
                    
                    {/* API Key Setup Button */}
                    <button
                      onClick={() => setShowApiKeySetup(!showApiKeySetup)}
                      className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                    >
                      <Settings className="w-4 h-4" />
                      Setup Google Maps API
                    </button>
                  </div>
                </div>
              </div>
              
              {/* API Key Setup Instructions */}
              {showApiKeySetup && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-yellow-800 mb-2">Google Maps API Setup Required</h4>
                      <ol className="text-sm text-yellow-700 space-y-1">
                        <li>1. Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                        <li>2. Create a new project or select existing one</li>
                        <li>3. Enable Maps JavaScript API, Directions API, Places API</li>
                        <li>4. Create API credentials (API Key)</li>
                        <li>5. Add VITE_GOOGLE_MAPS_API_KEY to your .env file</li>
                        <li>6. Restart your development server</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Enhanced Action Buttons */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={openInGoogleMaps}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in Google Maps
                </button>
                <button
                  onClick={() => setShowApiKeySetup(!showApiKeySetup)}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>

              {/* Enhanced Features */}
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 mt-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Real-time Updates</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Navigation className="w-4 h-4" />
                  <span>Route Tracking</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Bus className="w-4 h-4" />
                  <span>Live Location</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Live Bus Tracking</h3>
              <p className="text-gray-600 mb-4">Select a trip to view live tracking information</p>
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live Updates</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Navigation className="w-4 h-4" />
                  <span>Route Tracking</span>
                </div>
                <div className="flex items-center space-x-2">
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
      
      {/* Enhanced Map Overlay Controls */}
      <div className="absolute top-4 left-4 bg-white rounded-lg p-3 shadow-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">Live Tracking</span>
        </div>
      </div>

      {/* Enhanced Control Buttons */}
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

      {/* Enhanced Bus Info Overlay */}
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

      {/* Error Display */}
      {mapError && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-50 border border-red-200 rounded-lg p-4 max-w-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-sm text-red-800">{mapError}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedGoogleMapsTracker;
