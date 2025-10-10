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
  const [busPosition, setBusPosition] = useState({ x: 50, y: 50 }); // For fallback bus icon positioning
  const [routePath, setRoutePath] = useState([]); // For storing route path points
  const fullscreenRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);
  const [routeProgress, setRouteProgress] = useState(0);
  const animationFrameRef = useRef(null);

  const enterFullscreen = () => {
    const el = fullscreenRef.current;
    if (!el) return;
    const request = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
    if (request) {
      request.call(el).then?.(() => setIsFullscreen(true));
    }
  };

  const exitFullscreen = () => {
    const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
    if (exit) {
      exit.call(document).then?.(() => setIsFullscreen(false));
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
    };
  }, []);

  // Read API key from both Vite and CRA environments so either setup works
  const getApiKey = () => {
    const viteKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) || '';
    const craKey = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_GOOGLE_MAPS_API_KEY) || '';
    return viteKey || craKey;
  };

  // Check if Google Maps API is configured
  useEffect(() => {
    const apiKey = getApiKey();
        const configured = !!(apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE' && String(apiKey).length > 10);
        // Force fallback for now since Google Maps API key is not working
        setIsApiConfigured(false);
        console.log('🔑 Google Maps API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'Not found');
        console.log('✅ Google Maps API configured: false (using fallback)');
        console.log('🗺️ Using OpenStreetMap fallback with enhanced features');
      setMapLoaded(true);
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

  // Smooth continuous animation using requestAnimationFrame
  useEffect(() => {
    if (!isRealTimeEnabled || !trip || !mapLoaded) return;

    let lastTimestamp = Date.now();
    const routeWaypoints = getRouteWaypoints(trip.routeId?.routeName || 'Default Route');
    let waypointIndex = 0;
    let progress = 0;

    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastTimestamp) / 1000; // Convert to seconds
      lastTimestamp = now;

      // Update progress (move 5% per second for smooth movement)
      progress += deltaTime * 0.05;

      if (progress >= 1) {
        // Move to next waypoint
        progress = 0;
        waypointIndex = (waypointIndex + 1) % routeWaypoints.length;
        setCurrentWaypointIndex(waypointIndex);
      }

      setRouteProgress(progress);

      // Calculate smooth position
      const currentWaypoint = routeWaypoints[waypointIndex];
      const nextWaypoint = routeWaypoints[(waypointIndex + 1) % routeWaypoints.length];
      
      const newCoordinates = interpolatePosition(currentWaypoint, nextWaypoint, progress);
      const newSpeed = calculateRealisticSpeed(0, 30 + Math.random() * 20, nextWaypoint);

      // Update bus position for display
      const newBusPosition = {
        x: 50 + (newCoordinates.lng - 76.2711) * 500,
        y: 50 - (newCoordinates.lat - 10.8505) * 500
      };
      setBusPosition(newBusPosition);
      setRoutePath(prev => [...prev.slice(-20), newBusPosition]);

      // Update trip data
      const updatedTrip = {
        ...trip,
        coordinates: newCoordinates,
        currentSpeed: `${newSpeed} km/h`,
        lastUpdate: new Date().toLocaleTimeString(),
        currentLocation: getLocationName(newCoordinates),
        nextStop: getNextStopName(nextWaypoint),
        estimatedArrival: calculateETA(newCoordinates, nextWaypoint, newSpeed)
      };

      if (onLocationUpdate) {
        onLocationUpdate(updatedTrip);
      }

      // Update Google Maps marker if available
      if (mapRef.current?.mapInstance && mapRef.current.markers && mapRef.current.markers.length > 0) {
        const busMarker = mapRef.current.markers[0];
        busMarker.setPosition(newCoordinates);
        busMarker.setTitle(`🚌 Live Bus ${trip.busId?.busNumber || 'Unknown'} - ${getLocationName(newCoordinates)}`);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRealTimeEnabled, trip, mapLoaded]);

  // Start simulation automatically when trip is loaded
  useEffect(() => {
    if (trip && !isRealTimeEnabled) {
      setIsRealTimeEnabled(true);
      console.log('🚌 Auto-starting realistic bus movement simulation');
    }
  }, [trip, isRealTimeEnabled]);

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
      if (mapRef.current.blinkInterval) {
        clearInterval(mapRef.current.blinkInterval);
        mapRef.current.blinkInterval = null;
      }

      // Create markers array
      mapRef.current.markers = [];

      // Add current location marker with enhanced styling
      if (trip.coordinates) {
        const currentMarker = new window.google.maps.Marker({
          position: { lat: trip.coordinates.lat, lng: trip.coordinates.lng },
          map: map,
          title: `🚌 Live Bus ${trip.busId?.busNumber || 'Unknown'} - ${trip.currentLocation}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="70" height="70" viewBox="0 0 70 70" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <style>
                    .pulse-ring { animation: pulse-ring 2s infinite; }
                    .bus-body { animation: bus-blink 1.5s infinite; }
                    @keyframes pulse-ring {
                      0% { transform: scale(0.8); opacity: 1; }
                      100% { transform: scale(1.4); opacity: 0; }
                    }
                    @keyframes bus-blink {
                      0%, 100% { opacity: 1; }
                      50% { opacity: 0.7; }
                    }
                  </style>
                </defs>
                <!-- Animated pulse rings -->
                <circle cx="35" cy="35" r="30" fill="#FF5722" opacity="0.1" class="pulse-ring"/>
                <circle cx="35" cy="35" r="25" fill="#FF5722" opacity="0.2" class="pulse-ring" style="animation-delay: 0.5s"/>
                <circle cx="35" cy="35" r="20" fill="#FF5722" opacity="0.3" class="pulse-ring" style="animation-delay: 1s"/>
                
                <!-- Main bus container -->
                <circle cx="35" cy="35" r="18" fill="#FF5722" stroke="#FFFFFF" stroke-width="4"/>
                
                <!-- Bus body with blinking effect -->
                <rect x="22" y="28" width="26" height="14" rx="3" fill="#FFFFFF" class="bus-body"/>
                
                <!-- Bus windows -->
                <rect x="25" y="30" width="8" height="6" fill="#FF5722" opacity="0.8"/>
                <rect x="35" y="30" width="8" height="6" fill="#FF5722" opacity="0.8"/>
                
                <!-- Bus wheels -->
                <circle cx="28" cy="42" r="2.5" fill="#333333"/>
                <circle cx="42" cy="42" r="2.5" fill="#333333"/>
                
                <!-- Speed indicator -->
                <circle cx="35" cy="20" r="8" fill="#4CAF50" stroke="#FFFFFF" stroke-width="2"/>
                <text x="35" y="25" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${trip.currentSpeed?.replace(' km/h', '') || '0'}</text>
                
                <!-- Live indicator -->
                <circle cx="50" cy="20" r="6" fill="#4CAF50" stroke="#FFFFFF" stroke-width="2"/>
                <text x="50" y="24" text-anchor="middle" fill="white" font-size="8" font-weight="bold">LIVE</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(70, 70),
            anchor: new window.google.maps.Point(35, 35)
          },
          animation: window.google.maps.Animation.BOUNCE,
          zIndex: 1000
        });

        mapRef.current.markers.push(currentMarker);

        // Center map on current location
        map.setCenter({ lat: trip.coordinates.lat, lng: trip.coordinates.lng });

        // Add enhanced info window with logical tracking info
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 280px;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <div style="width: 10px; height: 10px; background: #4CAF50; border-radius: 50%; margin-right: 10px; animation: pulse 2s infinite;"></div>
                <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #1976D2;">🚌 ${trip.busId?.busNumber || 'Bus'}</h3>
              </div>
              
              <div style="border-left: 3px solid #4CAF50; padding-left: 12px; margin-bottom: 12px;">
                <p style="margin: 4px 0; font-size: 14px; color: #333; font-weight: 500;">📍 ${trip.currentLocation || 'Current Location'}</p>
                <p style="margin: 4px 0; font-size: 13px; color: #666;">Next Stop: <span style="color: #1976D2; font-weight: 600;">${trip.nextStop || 'Unknown'}</span></p>
                <p style="margin: 4px 0; font-size: 13px; color: #666;">ETA: <span style="color: #FF5722; font-weight: 600;">${trip.estimatedArrival || 'Calculating...'}</span></p>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                <div style="background: #f8f9fa; padding: 8px; border-radius: 6px; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #666;">Speed</p>
                  <p style="margin: 0; font-size: 16px; color: #4CAF50; font-weight: 600;">${trip.currentSpeed || '0 km/h'}</p>
                </div>
                <div style="background: #f8f9fa; padding: 8px; border-radius: 6px; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #666;">Status</p>
                  <p style="margin: 0; font-size: 16px; color: #1976D2; font-weight: 600;">LIVE</p>
                </div>
              </div>
              
              <div style="background: #e3f2fd; padding: 10px; border-radius: 6px; margin-bottom: 8px;">
                <p style="margin: 0; font-size: 13px; color: #1976D2; font-weight: 500;">🛣️ Route: ${trip.routeId?.routeName || 'Unknown Route'}</p>
              </div>
              
              <p style="margin: 0; font-size: 11px; color: #999; text-align: center;">Last updated: ${trip.lastUpdate || new Date().toLocaleTimeString()}</p>
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

        // Add continuous blinking animation
        const blinkInterval = setInterval(() => {
          currentMarker.setAnimation(window.google.maps.Animation.BOUNCE);
          setTimeout(() => {
            currentMarker.setAnimation(null);
          }, 1000);
        }, 3000);

        // Store interval for cleanup
        mapRef.current.blinkInterval = blinkInterval;
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

  // Realistic bus movement simulation along actual routes
  const simulateLocationUpdate = () => {
    if (!trip) return;

    console.log('🚌 Starting realistic bus movement simulation...');

    // Get route waypoints for realistic movement
    const routeWaypoints = getRouteWaypoints(trip.routeId?.routeName || 'Default Route');
    const currentPosition = trip.coordinates || { lat: 10.8505, lng: 76.2711 };
    
    console.log('📍 Current position:', currentPosition);
    console.log('🛣️ Route waypoints:', routeWaypoints.length);
    
    // Find current position index in route
    let currentIndex = findNearestWaypointIndex(currentPosition, routeWaypoints);
    
    // Move to next waypoint with realistic speed
    const nextIndex = (currentIndex + 1) % routeWaypoints.length;
    const nextWaypoint = routeWaypoints[nextIndex];
    
    console.log('🎯 Moving towards:', nextWaypoint.name);
    
    // Calculate realistic movement based on distance and speed
    const distance = calculateDistance(currentPosition, nextWaypoint);
    const speed = parseFloat(trip.currentSpeed?.replace(' km/h', '') || '30');
    
    // Move bus towards next waypoint (25% progress each update for more visible movement)
    const progress = 0.25;
    const newCoordinates = interpolatePosition(currentPosition, nextWaypoint, progress);
    
    // Calculate realistic speed based on route conditions
    const newSpeed = calculateRealisticSpeed(distance, speed, nextWaypoint);
    
    console.log('🚀 New coordinates:', newCoordinates);
    console.log('⚡ New speed:', newSpeed);
    
    // Update bus position for fallback display with more dramatic movement
    const newBusPosition = {
      x: 50 + (newCoordinates.lng - 76.2711) * 2000, // Increased multiplier for more visible movement
      y: 50 - (newCoordinates.lat - 10.8505) * 2000
    };
    setBusPosition(newBusPosition);
    
    // Update route path
    setRoutePath(prev => [...prev.slice(-10), newBusPosition]); // Keep last 10 positions
    
    // Update bus marker position (for Google Maps if available)
    if (mapRef.current?.mapInstance && mapRef.current.markers && mapRef.current.markers.length > 0) {
      const busMarker = mapRef.current.markers[0];
      busMarker.setPosition(newCoordinates);
      
      // Update marker title with new info
      busMarker.setTitle(`🚌 Live Bus ${trip.busId?.busNumber || 'Unknown'} - ${getLocationName(newCoordinates)}`);
      console.log('📍 Bus marker updated to new position');
    }

    // Update trip with new coordinates
    const updatedTrip = {
        ...trip,
      coordinates: newCoordinates,
      currentSpeed: `${newSpeed} km/h`,
      lastUpdate: new Date().toLocaleTimeString(),
      currentLocation: getLocationName(newCoordinates),
      nextStop: getNextStopName(nextWaypoint),
      estimatedArrival: calculateETA(newCoordinates, nextWaypoint, newSpeed)
    };

    console.log('📊 Updated trip data:', updatedTrip);

    // Call the location update callback
    if (onLocationUpdate) {
      onLocationUpdate(updatedTrip);
    }
  };

  // Get realistic route waypoints for different routes
  const getRouteWaypoints = (routeName) => {
    const routes = {
      'Thiruvananthapuram - Kochi': [
        { lat: 8.5241, lng: 76.9361, name: 'Thiruvananthapuram Central' },
        { lat: 8.5931, lng: 76.9061, name: 'Kollam Junction' },
        { lat: 8.8841, lng: 76.6101, name: 'Kottayam' },
        { lat: 9.9312, lng: 76.2673, name: 'Kochi Central' }
      ],
      'Kochi - Bangalore': [
        { lat: 9.9312, lng: 76.2673, name: 'Kochi Central' },
        { lat: 10.8505, lng: 76.2711, name: 'Thrissur' },
        { lat: 11.2588, lng: 75.7804, name: 'Kozhikode' },
        { lat: 12.9716, lng: 77.5946, name: 'Bangalore Central' }
      ],
      'Default Route': [
        { lat: 10.8505, lng: 76.2711, name: 'Thrissur Central' },
        { lat: 10.8505, lng: 76.2800, name: 'Thrissur East' },
        { lat: 10.8600, lng: 76.2800, name: 'Thrissur North' },
        { lat: 10.8600, lng: 76.2711, name: 'Thrissur West' }
      ]
    };
    
    return routes[routeName] || routes['Default Route'];
  };

  // Find nearest waypoint index
  const findNearestWaypointIndex = (position, waypoints) => {
    let minDistance = Infinity;
    let nearestIndex = 0;
    
    waypoints.forEach((waypoint, index) => {
      const distance = calculateDistance(position, waypoint);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });
    
    return nearestIndex;
  };

  // Calculate distance between two points
  const calculateDistance = (point1, point2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Interpolate position between two points
  const interpolatePosition = (start, end, progress) => {
    return {
      lat: start.lat + (end.lat - start.lat) * progress,
      lng: start.lng + (end.lng - start.lng) * progress
    };
  };

  // Calculate realistic speed based on route conditions
  const calculateRealisticSpeed = (distance, baseSpeed, waypoint) => {
    // Simulate traffic conditions and route type
    const trafficFactor = Math.random() * 0.3 + 0.7; // 70-100% of base speed
    const routeFactor = waypoint.name.includes('Central') ? 0.8 : 1.0; // Slower in city centers
    
    return Math.round(baseSpeed * trafficFactor * routeFactor);
  };

  // Get location name based on coordinates
  const getLocationName = (coordinates) => {
    // Simple location mapping - in real app, this would use reverse geocoding
    const locations = {
      'Thiruvananthapuram': { lat: 8.5241, lng: 76.9361 },
      'Kollam': { lat: 8.5931, lng: 76.9061 },
      'Kottayam': { lat: 8.8841, lng: 76.6101 },
      'Kochi': { lat: 9.9312, lng: 76.2673 },
      'Thrissur': { lat: 10.8505, lng: 76.2711 }
    };
    
    for (const [name, coords] of Object.entries(locations)) {
      if (calculateDistance(coordinates, coords) < 5) {
        return name;
      }
    }
    
    return 'En Route';
  };

  // Get next stop name
  const getNextStopName = (waypoint) => {
    return waypoint.name || 'Next Stop';
  };

  // Calculate estimated time of arrival
  const calculateETA = (current, destination, speed) => {
    const distance = calculateDistance(current, destination);
    const timeInHours = distance / speed;
    const eta = new Date(Date.now() + timeInHours * 3600000);
    return eta.toLocaleTimeString();
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
      <div ref={fullscreenRef} className={`${className} relative bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col rounded-lg`}>
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
              
                {/* Enhanced Map with CLEAR Bus Movement */}
                <div className="flex-1 p-4">
                  <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-4">
                    <div 
                      className="aspect-video bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 rounded-xl flex items-center justify-center relative overflow-hidden cursor-zoom-in"
                      onClick={enterFullscreen}
                    >
                      {/* OpenStreetMap iframe */}
                      <iframe
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${(trip.coordinates?.lng || 76.2711) - 0.1},${(trip.coordinates?.lat || 10.8505) - 0.1},${(trip.coordinates?.lng || 76.2711) + 0.1},${(trip.coordinates?.lat || 10.8505) + 0.1}&layer=mapnik`}
                        width="100%"
                        height="100%"
                        style={{ border: 'none', borderRadius: '12px' }}
                        title="Live Bus Location"
                      />
                      
                      {/* Dynamic Route Path Visualization */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
                        {/* Dynamic route line following bus movement */}
                        {routePath.length > 1 && (
                          <path
                            d={`M ${routePath[0].x},${routePath[0].y} ${routePath.slice(1).map(point => `L ${point.x},${point.y}`).join(' ')}`}
                            stroke="#FF5722"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray="5,5"
                            className="animate-pulse"
                          />
                        )}
                        
                        {/* Route stops */}
                        <circle cx="50" cy="50" r="4" fill="#4CAF50" className="animate-ping" />
                        <circle cx="80" cy="40" r="4" fill="#2196F3" />
                        <circle cx="70" cy="70" r="4" fill="#2196F3" />
                        <circle cx="30" cy="60" r="4" fill="#2196F3" />
                        
                        {/* Path trail dots */}
                        {routePath.map((point, index) => (
                          <circle
                            key={index}
                            cx={point.x}
                            cy={point.y}
                            r="2"
                            fill="#FFC107"
                            opacity={0.6 - (index * 0.05)}
                            className="animate-ping"
                            style={{ animationDelay: `${index * 0.1}s` }}
                          />
                        ))}
                      </svg>
                      
                      {/* Small Bus Icon - Google Maps Style */}
                      <div 
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={{
                          left: `${busPosition.x}%`,
                          top: `${busPosition.y}%`,
                          zIndex: 20,
                          transition: 'left 0.1s linear, top 0.1s linear'
                        }}
                      >
                        <div className="relative">
                          {/* Small pulsing ring */}
                          <div className="absolute inset-0 w-10 h-10 bg-blue-500 rounded-full animate-ping opacity-40"></div>
                          
                          {/* Small Bus icon - Google Maps style */}
                          <div className="relative w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                            <div className="text-white text-lg">🚌</div>
                          </div>
                          
                          {/* Small Live indicator */}
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white animate-pulse"></div>
                        </div>
                      </div>
                      
                      {/* Movement Trail */}
                      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
                        <div 
                          className="absolute w-2 h-2 bg-yellow-400 rounded-full opacity-60 animate-ping"
                          style={{
                            left: `${Math.max(0, busPosition.x - 5)}%`,
                            top: `${Math.max(0, busPosition.y - 5)}%`,
                            animationDelay: '0.5s'
                          }}
                        ></div>
                        <div 
                          className="absolute w-1 h-1 bg-orange-400 rounded-full opacity-40 animate-ping"
                          style={{
                            left: `${Math.max(0, busPosition.x - 10)}%`,
                            top: `${Math.max(0, busPosition.y - 10)}%`,
                            animationDelay: '1s'
                          }}
                        ></div>
                  </div>
                      
                      {/* Enhanced Map controls */}
                      <div className="absolute top-4 right-4 bg-white bg-opacity-95 rounded-lg p-3 shadow-lg border-2 border-green-200">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-bold text-green-700">LIVE TRACKING</span>
                </div>
                        <div className="text-xs text-gray-600 mt-1">Bus Moving in Real-Time</div>
                        <button
                          onClick={(e) => { e.stopPropagation(); enterFullscreen(); }}
                          className="mt-2 text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                        >
                          Fullscreen
                        </button>
              </div>
                
                      {/* Enhanced Location info */}
                      <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 rounded-lg p-4 shadow-lg border-2 border-blue-200">
                        <div className="text-sm font-bold text-gray-800">📍 {trip.currentLocation || 'Current Location'}</div>
                        <div className="text-xs text-blue-600 font-semibold">Next: {trip.nextStop || 'Next Stop'}</div>
                        <div className="text-xs text-gray-500 mt-1">ETA: {trip.estimatedArrival || '10:30 AM'}</div>
                    </div>
                      
                      {/* Movement indicator */}
                      <div className="absolute top-4 left-4 bg-white bg-opacity-95 rounded-lg p-3 shadow-lg border-2 border-orange-200">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce"></div>
                          <span className="text-sm font-bold text-orange-700">MOVING</span>
                        </div>
                        <div className="text-xs text-gray-600">Route Progress: {Math.round(routeProgress * 100)}%</div>
                  </div>

                      {isFullscreen && (
                        <button
                          onClick={(e) => { e.stopPropagation(); exitFullscreen(); }}
                          className="absolute top-4 right-4 bg-black/60 text-white text-xs px-3 py-1 rounded"
                          style={{ zIndex: 50 }}
                        >
                          Exit Fullscreen
                        </button>
                      )}
                </div>
              </div>
              
                    </div>
              
                  {/* Enhanced Trip Details with Logical Tracking */}
                  <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                    <div className="space-y-4">
                      {/* Route Information */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm font-medium text-gray-600">🛣️ Route</span>
                          <span className="text-sm font-semibold text-blue-600">{trip.routeId?.routeName || 'Unknown Route'}</span>
                  </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm font-medium text-gray-600">🚌 Bus Number</span>
                          <span className="text-sm font-semibold text-gray-900">{trip.busId?.busNumber || 'N/A'}</span>
                </div>
                      </div>

                      {/* Current Status */}
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                        <div className="flex items-center justify-between py-2 border-b border-green-100">
                          <span className="text-sm font-medium text-gray-600">📍 Current Location</span>
                          <span className="text-sm font-semibold text-green-700">{trip.currentLocation || 'Current Location'}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-green-100">
                          <span className="text-sm font-medium text-gray-600">🎯 Next Stop</span>
                          <span className="text-sm font-semibold text-blue-600">{trip.nextStop || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm font-medium text-gray-600">⏰ ETA</span>
                          <span className="text-sm font-semibold text-orange-600">{trip.estimatedArrival || 'Calculating...'}</span>
                        </div>
              </div>

                      {/* Speed and Status */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">{trip.currentSpeed || '0 km/h'}</div>
                          <div className="text-xs text-gray-600 mt-1">Current Speed</div>
                </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">LIVE</div>
                          <div className="text-xs text-gray-600 mt-1">Tracking Status</div>
                </div>
                </div>

                      {/* Technical Details */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between py-1">
                          <span className="text-xs font-medium text-gray-500">Coordinates</span>
                          <span className="text-xs font-mono text-gray-700">
                            {trip.coordinates?.lat?.toFixed(4) || '0.0000'}, {trip.coordinates?.lng?.toFixed(4) || '0.0000'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-xs font-medium text-gray-500">Last Update</span>
                          <span className="text-xs text-gray-700">{trip.lastUpdate || new Date().toLocaleTimeString()}</span>
                        </div>
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
