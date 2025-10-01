import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MapPin, 
  Navigation, 
  Route, 
  Trash2, 
  Save, 
  RefreshCw,
  DollarSign,
  Bus,
  Clock,
  Map as MapIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import GoogleMapsDebug from './GoogleMapsDebug';
import errorLogger from '../utils/errorLogger';

const RouteMapEditor = ({ 
  isOpen, 
  onClose, 
  route, 
  onSaveRoute, 
  onUpdateStops,
  loading = false 
}) => {
  const [map, setMap] = useState(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [intermediateStops, setIntermediateStops] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [stopPrices, setStopPrices] = useState({});
  const [totalDistance, setTotalDistance] = useState(0);
  const [estimatedDuration, setEstimatedDuration] = useState(0);
  const [mapLoadError, setMapLoadError] = useState(false);
  const [autoDetectedRoute, setAutoDetectedRoute] = useState(null);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  const mapRef = useRef(null);

  // Normalize coordinate objects to { lat: number, lng: number }
  const toLatLng = (coord) => {
    if (!coord) return null;
    if (typeof coord.lat !== 'undefined' && typeof coord.lng !== 'undefined') {
      return { lat: Number(coord.lat), lng: Number(coord.lng) };
    }
    if (typeof coord.latitude !== 'undefined' && typeof coord.longitude !== 'undefined') {
      return { lat: Number(coord.latitude), lng: Number(coord.longitude) };
    }
    return null;
  };

  // Extract route name from route data
  const getRouteDisplayName = (route) => {
    if (route?.routeName) {
      return route.routeName;
    }
    
    if (route?.startingPoint?.city && route?.endingPoint?.city) {
      return `${route.startingPoint.city} → ${route.endingPoint.city}`;
    }
    
    if (route?.routeNumber) {
      // Extract cities from route number (e.g., KL-KAN-HYD-207)
      const parts = route.routeNumber.split('-');
      if (parts.length >= 3) {
        const startCity = parts[1]; // KAN
        const endCity = parts[2];   // HYD
        const cityMap = {
          'KAN': 'Kannur',
          'HYD': 'Hyderabad', 
          'MUM': 'Mumbai',
          'GOA': 'Goa',
          'MAN': 'Mangalore',
          'SAL': 'Salem',
          'KAS': 'Kasaragod',
          'TVM': 'Thiruvananthapuram',
          'KOCHI': 'Kochi',
          'BAN': 'Bangalore',
          'CHE': 'Chennai',
          'COI': 'Coimbatore',
          'MAD': 'Madurai'
        };
        return `${cityMap[startCity] || startCity} → ${cityMap[endCity] || endCity}`;
      }
    }
    
    return 'Edit Route';
  };

  // Calculate fare per km based on bus type
  const getFarePerKm = (busType) => {
    const fareStructure = {
      'ordinary': 1.2,
      'fast_passenger': 1.5,
      'super_fast': 1.8,
      'ac': 2.0,
      'volvo': 2.5,
      'garuda': 3.0
    };
    return fareStructure[busType] || 1.5; // Default to fast_passenger rate
  };

  // Calculate total price based on distance, bus type, and intermediate stops
  const calculateTotalPrice = (route, distance, intermediateStops) => {
    if (!route || !distance) return 0;
    
    const busType = route.busType || route.busId?.busType || 'fast_passenger';
    const farePerKm = getFarePerKm(busType);
    
    // Base price calculation
    let basePrice = distance * farePerKm;
    
    // Add intermediate stop charges (₹5 per stop)
    const stopCharges = intermediateStops.length * 5;
    
    // Add convenience charges based on distance
    let convenienceCharges = 0;
    if (distance > 500) {
      convenienceCharges = 50; // Long distance convenience charge
    } else if (distance > 200) {
      convenienceCharges = 25; // Medium distance convenience charge
    } else {
      convenienceCharges = 10; // Short distance convenience charge
    }
    
    // Calculate total
    const totalPrice = basePrice + stopCharges + convenienceCharges;
    
    return Math.round(totalPrice * 100) / 100; // Round to 2 decimal places
  };

  // Get bus type display name
  const getBusTypeDisplayName = (busType) => {
    const busTypeNames = {
      'ordinary': 'Ordinary',
      'fast_passenger': 'Fast Passenger',
      'super_fast': 'Super Fast',
      'ac': 'AC',
      'volvo': 'Volvo',
      'garuda': 'Garuda'
    };
    return busTypeNames[busType] || 'Fast Passenger';
  };

  // Simple distance calculator (Haversine)
  const calculateDistanceKm = (a, b) => {
    if (!a || !b) return 0;
    const R = 6371; // km
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const aVal = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
    const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
    return R * c;
  };

  // Compute basic distance/duration between start and end
  useEffect(() => {
    if (!isOpen) return;
    const s = toLatLng(route?.startingPoint?.coordinates) || toLatLng(route?.startingPoint);
    const e = toLatLng(route?.endingPoint?.coordinates) || toLatLng(route?.endingPoint);
    if (s && e) {
      const km = calculateDistanceKm(s, e);
      setTotalDistance(km);
      // rough estimate 40 km/h
      setEstimatedDuration((km / 40) * 60);
    }
  }, [isOpen, route]);

  // Initialize map
  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google) return;

    const centerLatLng =
      toLatLng(route?.startingPoint?.coordinates) ||
      toLatLng(route?.startingPoint) ||
      { lat: 12.9716, lng: 77.5946 };

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      zoom: 10,
      center: centerLatLng, // Default to Bangalore if missing
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    const directionsServiceInstance = new window.google.maps.DirectionsService();
    const directionsRendererInstance = new window.google.maps.DirectionsRenderer({
      draggable: true,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#3B82F6',
        strokeWeight: 4,
        strokeOpacity: 0.8
      }
    });

    directionsRendererInstance.setMap(mapInstance);

    setMap(mapInstance);
    setDirectionsService(directionsServiceInstance);
    setDirectionsRenderer(directionsRendererInstance);

    // Load route if route data exists
    if (route) {
      console.log('🚀 Initializing map with route:', route);
      loadRouteOnMap(route, directionsServiceInstance, directionsRendererInstance);
    } else {
      console.log('⚠️ No route data provided to RouteMapEditor');
    }

    // Add click listener for adding intermediate stops
    mapInstance.addListener('click', (event) => {
      if (isEditing) {
        addIntermediateStop(event.latLng);
          } else if (!route && !autoDetectedRoute) {
            // If no route exists, allow clicking to set start/end points
            handleMapClickForRoute(event.latLng);
      }
    });

    // Add drag listener for route updates
    directionsRendererInstance.addListener('directions_changed', () => {
      const directions = directionsRendererInstance.getDirections();
      if (directions) {
        updateRouteFromDirections(directions);
      }
    });
  }, [route, isEditing]);

  // Load Google Maps API
  const loadGoogleMapsAPI = useCallback(() => {
    // Already available
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    // Get API key from environment with hardcoded fallback
    const viteKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) || '';
    const craKey = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_GOOGLE_MAPS_API_KEY) || '';
    const hardcodedKey = 'AIzaSyAsAkznA2sJF0pp4iAq5H2uqP9FIATjdbk';
    const apiKey = viteKey || craKey || hardcodedKey;

    console.log('Google Maps API Debug:', {
      viteKey: viteKey ? `${viteKey.substring(0, 10)}...` : 'Not found',
      craKey: craKey ? `${craKey.substring(0, 10)}...` : 'Not found',
      hardcodedKey: hardcodedKey ? `${hardcodedKey.substring(0, 10)}...` : 'Not found',
      finalApiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'Not found',
      importMeta: typeof import.meta,
      importMetaEnv: typeof import.meta !== 'undefined' ? import.meta.env : 'undefined',
      process: typeof process,
      processEnv: typeof process !== 'undefined' ? process.env : 'undefined'
    });

    if (!apiKey) {
      console.error('No Google Maps API key found');
      errorLogger.logGoogleMapsError('API Key Missing', {
        viteKey: viteKey ? 'Present' : 'Missing',
        craKey: craKey ? 'Present' : 'Missing',
        hardcodedKey: hardcodedKey ? 'Present' : 'Missing',
        importMetaExists: typeof import.meta !== 'undefined',
        importMetaEnvExists: typeof import.meta !== 'undefined' && !!import.meta.env
      });
      toast.error('Google Maps API key is required');
      setMapLoadError(true);
      return;
    }

    // Avoid adding script multiple times
    const existing = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existing) {
      console.log('Google Maps script already exists, adding event listeners');
      existing.addEventListener('load', () => initializeMap(), { once: true });
      existing.addEventListener('error', () => {
        console.error('Existing Google Maps script failed to load');
        toast.error('Failed to load Google Maps');
        setMapLoadError(true);
      }, { once: true });
      return;
    }

    console.log('Loading Google Maps API with key:', `${apiKey.substring(0, 10)}...`);
    const script = document.createElement('script');
    // Do NOT include "directions" in libraries; DirectionsService is core
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google Maps API script loaded successfully');
      initializeMap();
    };
    script.onerror = (error) => {
      console.error('Failed to load Google Maps API script:', error);
      errorLogger.logGoogleMapsError('Script Load Failed', {
        scriptSrc: script.src,
        error: error.message || 'Unknown error',
        apiKey: `${apiKey.substring(0, 10)}...`,
        userAgent: navigator.userAgent,
        currentUrl: window.location.href
      });
      toast.error('Failed to load Google Maps. Please check your API key and network connection.');
      setMapLoadError(true);
    };
    document.head.appendChild(script);
  }, [initializeMap]);

  // Initialize Google Maps
  useEffect(() => {
    if (isOpen && window.google && window.google.maps) {
      initializeMap();
    } else if (isOpen) {
      // Load Google Maps API if not already loaded
      loadGoogleMapsAPI();
    }
  }, [isOpen, initializeMap, loadGoogleMapsAPI]);

  // Auto-detect route when map is ready and no route is provided
  useEffect(() => {
    if (isOpen && map && directionsService && !route && !autoDetectedRoute) {
      autoDetectRoute();
    }
  }, [isOpen, map, directionsService, route, autoDetectedRoute]);

  // Debug route data when component mounts
  useEffect(() => {
    if (isOpen) {
      console.log('🔍 RouteMapEditor opened with route:', route);
      console.log('🔍 Route starting point:', route?.startingPoint);
      console.log('🔍 Route ending point:', route?.endingPoint);
    }
  }, [isOpen, route]);

  // Auto-detect route from current map view
  const autoDetectRoute = useCallback(async () => {
    if (!map || !directionsService || isAutoDetecting) return;

    setIsAutoDetecting(true);
    console.log('🗺️ Auto-detecting route from map...');

    try {
      // Get current map bounds
      const bounds = map.getBounds();
      
      // Create sample route points based on map bounds
      const northeast = bounds.getNorthEast();
      const southwest = bounds.getSouthWest();
      
      // Create start and end points (you can customize this logic)
      const startPoint = {
        lat: southwest.lat() + (northeast.lat() - southwest.lat()) * 0.2,
        lng: southwest.lng() + (northeast.lng() - southwest.lng()) * 0.2
      };
      
      const endPoint = {
        lat: southwest.lat() + (northeast.lat() - southwest.lat()) * 0.8,
        lng: southwest.lng() + (northeast.lng() - southwest.lng()) * 0.8
      };

      // Request directions from Google Maps
      const request = {
        origin: new window.google.maps.LatLng(startPoint.lat, startPoint.lng),
        destination: new window.google.maps.LatLng(endPoint.lat, endPoint.lng),
        travelMode: window.google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false
      };

      directionsService.route(request, (result, status) => {
        setIsAutoDetecting(false);
        
        if (status === window.google.maps.DirectionsStatus.OK) {
          console.log('✅ Auto-detected route successfully');
          
          // Create route object
          const detectedRoute = {
            id: `auto-${Date.now()}`,
            routeName: 'Auto-Detected Route',
            startingPoint: {
              name: result.routes[0].legs[0].start_address || 'Start Point',
              coordinates: startPoint
            },
            endingPoint: {
              name: result.routes[0].legs[0].end_address || 'End Point', 
              coordinates: endPoint
            },
            intermediateStops: [],
            totalDistance: result.routes[0].legs[0].distance.value / 1000, // Convert to km
            estimatedDuration: result.routes[0].legs[0].duration.value / 60, // Convert to minutes
            route: result.routes[0]
          };

          setAutoDetectedRoute(detectedRoute);
          
          // Load the route on the map
          if (directionsRenderer) {
            directionsRenderer.setDirections(result);
          }
          
          // Update distance and duration
          setTotalDistance(detectedRoute.totalDistance);
          setEstimatedDuration(detectedRoute.estimatedDuration);
          
          toast.success('Route auto-detected successfully!');
        } else {
          console.error('❌ Auto-detection failed:', status);
          toast.error('Failed to auto-detect route');
        }
      });

    } catch (error) {
      setIsAutoDetecting(false);
      console.error('❌ Auto-detection error:', error);
      toast.error('Error during auto-detection');
    }
  }, [map, directionsService, isAutoDetecting]);

  // Handle map clicks for route creation
  const handleMapClickForRoute = useCallback((latLng) => {
    if (!autoDetectedRoute) {
      // First click - set as start point
      const startPoint = { lat: latLng.lat(), lng: latLng.lng() };
      
      // Use reverse geocoding to get address
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const address = results[0].formatted_address;
          
          setAutoDetectedRoute({
            id: `click-${Date.now()}`,
            routeName: 'Click-Detected Route',
            startingPoint: {
              name: address,
              coordinates: startPoint
            },
            endingPoint: null,
            intermediateStops: [],
            totalDistance: 0,
            estimatedDuration: 0
          });
          
          toast.success('Start point set! Click another location to set end point.');
        }
      });
    } else if (autoDetectedRoute && !autoDetectedRoute.endingPoint) {
      // Second click - set as end point and create route
      const endPoint = { lat: latLng.lat(), lng: latLng.lng() };
      
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const address = results[0].formatted_address;
          
          // Update the route with end point
          const updatedRoute = {
            ...autoDetectedRoute,
            endingPoint: {
              name: address,
              coordinates: endPoint
            }
          };
          
          setAutoDetectedRoute(updatedRoute);
          
          // Request directions
          if (directionsService) {
            const request = {
              origin: new window.google.maps.LatLng(
                autoDetectedRoute.startingPoint.coordinates.lat, 
                autoDetectedRoute.startingPoint.coordinates.lng
              ),
              destination: new window.google.maps.LatLng(endPoint.lat, endPoint.lng),
              travelMode: window.google.maps.TravelMode.DRIVING
            };
            
            directionsService.route(request, (result, status) => {
              if (status === window.google.maps.DirectionsStatus.OK) {
                const routeData = {
                  ...updatedRoute,
                  totalDistance: result.routes[0].legs[0].distance.value / 1000,
                  estimatedDuration: result.routes[0].legs[0].duration.value / 60,
                  route: result.routes[0]
                };
                
                setAutoDetectedRoute(routeData);
                setTotalDistance(routeData.totalDistance);
                setEstimatedDuration(routeData.estimatedDuration);
                
                if (directionsRenderer) {
                  directionsRenderer.setDirections(result);
                }
                
                toast.success('Route created successfully!');
              }
            });
          }
        }
      });
    }
  }, [autoDetectedRoute, directionsService, directionsRenderer]);

  // Geocode city names to coordinates
  const geocodeRouteCities = (routeData, directionsService, directionsRenderer) => {
    const geocoder = new window.google.maps.Geocoder();
    let geocodedCount = 0;
    const totalCities = 2; // start and end
    
    const onGeocodeComplete = () => {
      geocodedCount++;
      if (geocodedCount === totalCities) {
        // Both cities geocoded, now load the route
        loadRouteOnMap(routeData, directionsService, directionsRenderer);
      }
    };
    
    // Geocode starting point
    if (routeData.startingPoint?.city) {
      geocoder.geocode({ address: routeData.startingPoint.city }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          routeData.startingPoint.coordinates = {
            lat: location.lat(),
            lng: location.lng()
          };
          console.log('✅ Geocoded starting point:', routeData.startingPoint.city, '→', routeData.startingPoint.coordinates);
        } else {
          console.error('❌ Failed to geocode starting point:', routeData.startingPoint.city);
        }
        onGeocodeComplete();
      });
    } else {
      onGeocodeComplete();
    }
    
    // Geocode ending point
    if (routeData.endingPoint?.city) {
      geocoder.geocode({ address: routeData.endingPoint.city }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          routeData.endingPoint.coordinates = {
            lat: location.lat(),
            lng: location.lng()
          };
          console.log('✅ Geocoded ending point:', routeData.endingPoint.city, '→', routeData.endingPoint.coordinates);
        } else {
          console.error('❌ Failed to geocode ending point:', routeData.endingPoint.city);
        }
        onGeocodeComplete();
      });
    } else {
      onGeocodeComplete();
    }
  };

  // Load route on map
  const loadRouteOnMap = (routeData, directionsService, directionsRenderer) => {
    if (!window.google || !window.google.maps) {
      console.warn('Google Maps API not loaded yet');
      return;
    }

    setIsLoadingRoute(true);
    console.log('🗺️ Loading route on map:', routeData);
    console.log('📍 Starting point:', routeData.startingPoint);
    console.log('📍 Ending point:', routeData.endingPoint);

    const origin =
      toLatLng(routeData.startingPoint?.coordinates) ||
      toLatLng(routeData.startingPoint);
    const destination =
      toLatLng(routeData.endingPoint?.coordinates) ||
      toLatLng(routeData.endingPoint);

    console.log('🎯 Parsed origin:', origin);
    console.log('🎯 Parsed destination:', destination);

    if (!origin || !destination) {
      console.error('❌ Invalid route coordinates:', { origin, destination });
      
      // Try to geocode city names if coordinates are missing
      if (routeData.startingPoint?.city || routeData.endingPoint?.city) {
        console.log('🔄 Attempting to geocode city names...');
        geocodeRouteCities(routeData, directionsService, directionsRenderer);
        return;
      }
      
      toast.error('Invalid route coordinates');
      return;
    }

    const request = {
      origin: new window.google.maps.LatLng(origin.lat, origin.lng),
      destination: new window.google.maps.LatLng(destination.lat, destination.lng),
      waypoints:
        routeData.intermediateStops?.map((stop) => {
          const stopCoord = toLatLng(stop?.coordinates) ||
            (typeof stop.lat !== 'undefined' && typeof stop.lng !== 'undefined'
              ? { lat: Number(stop.lat), lng: Number(stop.lng) }
              : null);
          return stopCoord ? {
            location: new window.google.maps.LatLng(stopCoord.lat, stopCoord.lng),
          stopover: true,
          } : null;
        }).filter(Boolean) || [],
      travelMode: window.google.maps.TravelMode.DRIVING,
      optimizeWaypoints: true
    };

    directionsService.route(request, (result, status) => {
      console.log('🗺️ Directions API response:', { status, result });
      
      if (status === 'OK') {
        directionsRenderer.setDirections(result);
        
        // Update route information
        const route = result.routes[0];
        const leg = route.legs[0];
        
        console.log('✅ Route loaded successfully:', {
          distance: leg.distance.value / 1000,
          duration: leg.duration.value / 60,
          startAddress: leg.start_address,
          endAddress: leg.end_address
        });
        
        // Update route name if it's not properly set
        if (routeData && (!routeData.routeName || routeData.routeName === 'Auto-Detected Route')) {
          const startCity = leg.start_address.split(',')[0] || 'Start';
          const endCity = leg.end_address.split(',')[0] || 'End';
          const newRouteName = `${startCity} → ${endCity}`;
          console.log('📍 Updated route name:', newRouteName);
        }
        
        setTotalDistance(leg.distance.value / 1000); // Convert to km
        setEstimatedDuration(leg.duration.value / 60); // Convert to minutes
        
        // Extract intermediate stops from waypoints
        const stops = result.routes[0].waypoint_order?.map(index => {
          const waypoint = request.waypoints[index];
          return {
            ...waypoint.location,
            name: `Stop ${index + 1}`,
            price: stopPrices[`stop_${index}`] || 0
          };
        }) || [];
        
        setIntermediateStops(stops);
        
        // Auto-fetch intermediate stops if none exist
        if (stops.length === 0 && routeData.intermediateStops?.length === 0) {
          console.log('🔄 Auto-fetching intermediate stops...');
          toast.loading('Auto-generating intermediate stops...', { duration: 2000 });
          autoFetchIntermediateStopsFromRoute(result);
        }
        
        toast.success('Route loaded successfully');
      } else {
        console.error('❌ Directions request failed:', status);
        console.error('❌ Request was:', request);
        toast.error(`Failed to load route directions: ${status}`);
      }
      setIsLoadingRoute(false);
    });
  };

  // Update route from directions
  const updateRouteFromDirections = (directions) => {
    const route = directions.routes[0];
    const leg = route.legs[0];
    
    setTotalDistance(leg.distance.value / 1000);
    setEstimatedDuration(leg.duration.value / 60);

    // Extract waypoints for intermediate stops
    const stops = directions.request.waypoints?.map((waypoint, index) => ({
      lat: waypoint.location.lat(),
      lng: waypoint.location.lng(),
      name: `Intermediate Stop ${index + 1}`,
      price: stopPrices[`stop_${index}`] || 0
    })) || [];

    setIntermediateStops(stops);
  };

  // Add intermediate stop
  const addIntermediateStop = (latLng) => {
    const newStop = {
      lat: latLng.lat(),
      lng: latLng.lng(),
      name: `Stop ${intermediateStops.length + 1}`,
      price: 0
    };

    setIntermediateStops(prev => [...prev, newStop]);
    toast.success('Intermediate stop added');
  };

  // Remove intermediate stop
  const removeIntermediateStop = (index) => {
    setIntermediateStops(prev => prev.filter((_, i) => i !== index));
    toast.success('Intermediate stop removed');
  };

  // Update stop price
  const updateStopPrice = (index, price) => {
    setStopPrices(prev => ({
      ...prev,
      [`stop_${index}`]: parseFloat(price) || 0
    }));

    setIntermediateStops(prev => 
      prev.map((stop, i) => 
        i === index ? { ...stop, price: parseFloat(price) || 0 } : stop
      )
    );
  };

  // Auto-fetch intermediate stops from route result
  const autoFetchIntermediateStopsFromRoute = async (directionsResult) => {
    if (!window.google || !window.google.maps) {
      return;
    }

    try {
      const route = directionsResult.routes[0];
      const leg = route.legs[0];
      
      // Generate intermediate points along the route
      const steps = leg.steps;
      const intermediatePoints = [];
      
      // Take every 3rd step as an intermediate stop for better coverage
      for (let i = 2; i < steps.length - 2; i += 3) {
        const step = steps[i];
        const location = step.end_location;
        
        // Use Geocoding to get address
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const address = results[0].formatted_address;
            const cityName = address.split(',')[1]?.trim() || address.split(',')[0]?.trim() || `Stop ${intermediatePoints.length + 1}`;
            
            intermediatePoints.push({
              lat: location.lat(),
              lng: location.lng(),
              name: cityName,
              price: 0
            });
            
            // Update stops as they come in
            setIntermediateStops(prev => [...prev, {
              lat: location.lat(),
              lng: location.lng(),
              name: cityName,
              price: 0
            }]);
          }
        });
      }

      // Show success message after a delay
      setTimeout(() => {
        if (intermediatePoints.length > 0) {
          toast.success(`Auto-generated ${intermediatePoints.length} intermediate stops`);
        }
      }, 3000);

    } catch (error) {
      console.error('Error auto-fetching intermediate stops:', error);
    }
  };

  // Auto-fetch intermediate stops (manual trigger)
  const autoFetchIntermediateStops = async () => {
    if (!window.google || !window.google.maps) {
      toast.error('Google Maps is not loaded yet');
      return;
    }

    if (!route?.startingPoint?.coordinates || !route?.endingPoint?.coordinates) {
      toast.error('Invalid route coordinates');
      return;
    }

    try {
      // Use Google Places API to find intermediate points
      const origin = toLatLng(route.startingPoint.coordinates);
      const destination = toLatLng(route.endingPoint.coordinates);
      
      if (!origin || !destination) {
        toast.error('Invalid route coordinates');
        return;
      }
      
      const request = {
        origin: new window.google.maps.LatLng(origin.lat, origin.lng),
        destination: new window.google.maps.LatLng(destination.lat, destination.lng),
        travelMode: window.google.maps.TravelMode.DRIVING
      };

      directionsService.route(request, (result, status) => {
        if (status === 'OK') {
          autoFetchIntermediateStopsFromRoute(result);
        } else {
          toast.error('Failed to generate intermediate stops');
        }
      });
    } catch (error) {
      console.error('Error fetching intermediate stops:', error);
      toast.error('Failed to fetch intermediate stops');
    }
  };

  // Save route with updated stops
  const handleSaveRoute = async () => {
    try {
      // Use auto-detected route if available, otherwise use the provided route
      const currentRoute = autoDetectedRoute || route;
      
      const updatedRoute = {
        ...currentRoute,
        intermediateStops: intermediateStops.map((stop, index) => ({
          coordinates: { lat: stop.lat, lng: stop.lng },
          city: stop.name,
          location: stop.name,
          price: stop.price,
          stopOrder: index + 1
        })),
        totalDistance,
        estimatedDuration
      };

      await onSaveRoute(updatedRoute);
      toast.success('Route saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving route:', error);
      toast.error('Failed to save route');
    }
  };

  // Reset to original route
  const resetRoute = () => {
    if (!window.google || !window.google.maps) {
      toast.error('Google Maps is not loaded yet');
      return;
    }
    
    if (route) {
      loadRouteOnMap(route, directionsService, directionsRenderer);
      setIntermediateStops(route.intermediateStops || []);
      setIsEditing(false);
      toast.success('Route reset to original');
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 lg:inset-y-0 lg:left-64 lg:right-0 bg-black bg-opacity-50 z-[100000] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col"
        >
          {/* Header - Compact */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <MapIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Route Map Editor</h2>
                <p className="text-sm text-gray-600">
                  {getRouteDisplayName(route)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Map Container */}
            <div className="flex-1 relative">
              {mapLoadError ? (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-lg">
                  <div className="text-center">
                    <MapIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">Google Maps failed to load</p>
                    <p className="text-sm text-gray-400">Please check your API key configuration</p>
                      <div className="mt-4">
                        <GoogleMapsDebug />
                      </div>
                  </div>
                </div>
              ) : (
                <div
                  ref={mapRef}
                  className="w-full h-full"
                  style={{ minHeight: '500px' }}
                />
              )}
              
              {/* Map Controls - Moved Down and Smaller */}
              <div className="absolute top-16 left-3 space-y-1.5">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`p-2 rounded-md shadow-md transition-colors ${
                    isEditing 
                      ? 'bg-red-500 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  title={isEditing ? "Exit edit mode" : "Enter edit mode"}
                >
                  <MapPin className="w-4 h-4" />
                </button>
                <button
                  onClick={autoFetchIntermediateStops}
                  className="p-2 bg-white text-gray-700 rounded-md shadow-md hover:bg-gray-50 transition-colors"
                  title="Auto-fetch intermediate stops"
                >
                  <Route className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (intermediateStops.length === 0) {
                      autoFetchIntermediateStops();
                    } else {
                      setIntermediateStops([]);
                      toast.success('Intermediate stops cleared');
                    }
                  }}
                  className={`p-2 rounded-md shadow-md transition-colors ${
                    intermediateStops.length === 0 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                  title={intermediateStops.length === 0 ? "Auto-generate stops" : "Clear all stops"}
                >
                  {intermediateStops.length === 0 ? (
                    <Navigation className="w-4 h-4" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={resetRoute}
                  className="p-2 bg-white text-gray-700 rounded-md shadow-md hover:bg-gray-50 transition-colors"
                  title="Reset route"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Route Info Overlay with Pricing */}
              <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4">
                {isLoadingRoute ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                    <span className="text-sm font-medium">Loading route...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Navigation className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">{totalDistance.toFixed(1)} km</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">{Math.round(estimatedDuration)} min</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium">{intermediateStops.length} stops</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-bold text-green-600">
                        ₹{calculateTotalPrice(route, totalDistance, intermediateStops).toFixed(0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar - Compact */}
            <div className="w-80 border-l border-gray-200 bg-gray-50 flex flex-col">
              {/* Intermediate Stops - Compact */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900">Intermediate Stops</h3>
                  <span className="text-xs text-gray-500">{intermediateStops.length} stops</span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {intermediateStops.map((stop, index) => (
                    <div key={index} className="bg-white rounded-lg p-2 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1 mb-1">
                            <Bus className="w-3 h-3 text-blue-600 flex-shrink-0" />
                            <span className="text-xs font-medium text-gray-900 truncate">
                              {stop.name}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mb-1">
                            {stop.lat.toFixed(3)}, {stop.lng.toFixed(3)}
                          </p>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-3 h-3 text-green-600 flex-shrink-0" />
                            <input
                              type="number"
                              value={stop.price}
                              onChange={(e) => updateStopPrice(index, e.target.value)}
                              className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="0"
                              min="0"
                              step="0.1"
                            />
                            <span className="text-xs text-gray-500">₹</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeIntermediateStop(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors ml-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {intermediateStops.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-xs">No intermediate stops</p>
                    <p className="text-xs">Click on the map to add stops</p>
                  </div>
                )}
              </div>

              {/* Route Summary - Compact with Auto Pricing */}
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Route Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Distance</span>
                    <span className="text-sm font-medium">{totalDistance.toFixed(1)} km</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Duration</span>
                    <span className="text-sm font-medium">{Math.round(estimatedDuration)} min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Stops</span>
                    <span className="text-sm font-medium">{intermediateStops.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Bus Type</span>
                    <span className="text-sm font-medium">
                      {getBusTypeDisplayName(route?.busType || route?.busId?.busType)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Fare per km</span>
                    <span className="text-sm font-medium">
                      ₹{getFarePerKm(route?.busType || route?.busId?.busType).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                    <span className="text-sm font-semibold text-gray-800">Total Price</span>
                    <span className="text-lg font-bold text-green-600">
                      ₹{calculateTotalPrice(route, totalDistance, intermediateStops).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Base: ₹{(totalDistance * getFarePerKm(route?.busType || route?.busId?.busType)).toFixed(2)} + 
                    Stops: ₹{(intermediateStops.length * 5).toFixed(2)} + 
                    Convenience: ₹{totalDistance > 500 ? '50' : totalDistance > 200 ? '25' : '10'}
                  </div>
                </div>
              </div>

              {/* Auto-Detection Section - Compact */}
              {!route && !autoDetectedRoute && (
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Create Route</h3>
                  
                  <div className="space-y-2">
                    <button
                      onClick={autoDetectRoute}
                      disabled={isAutoDetecting || !map || !directionsService}
                      className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {isAutoDetecting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Navigation className="w-4 h-4" />
                      )}
                      <span className="text-sm">{isAutoDetecting ? 'Detecting...' : 'Auto-Detect Route'}</span>
                    </button>
                    
                    <div className="text-center text-xs text-gray-500">
                      OR
                    </div>
                    
                    <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded-lg">
                      <strong>Click Method:</strong> Click on map to set start/end points
                    </div>
                  </div>
                </div>
              )}

              {/* Click Detection Status - Compact */}
              {autoDetectedRoute && !autoDetectedRoute.endingPoint && (
                <div className="p-4 border-b border-gray-200 bg-yellow-50">
                  <h3 className="text-base font-semibold text-yellow-800 mb-2">Route Creation</h3>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-yellow-600" />
                      <span className="text-xs text-yellow-700">
                        <strong>Start:</strong> {autoDetectedRoute.startingPoint.name}
                      </span>
                    </div>
                    <div className="text-xs text-yellow-600 bg-yellow-100 p-2 rounded">
                      Click on the map to set the end point
                    </div>
                  </div>
                </div>
              )}

              {/* Auto-Detected Route Info - Compact */}
              {autoDetectedRoute && autoDetectedRoute.endingPoint && (
                <div className="p-4 border-b border-gray-200 bg-green-50">
                  <h3 className="text-base font-semibold text-green-800 mb-2">Detected Route</h3>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-700">
                        <strong>Start:</strong> {autoDetectedRoute.startingPoint.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-700">
                        <strong>End:</strong> {autoDetectedRoute.endingPoint.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Route className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-700">
                        <strong>Distance:</strong> {autoDetectedRoute.totalDistance.toFixed(1)} km
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-700">
                        <strong>Duration:</strong> {Math.round(autoDetectedRoute.estimatedDuration)} min
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons - Compact */}
              <div className="p-4 space-y-2">
                <button
                  onClick={handleSaveRoute}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span className="text-sm">Save Route Changes</span>
                </button>
                
                {autoDetectedRoute && (
                  <button
                    onClick={() => {
                      setAutoDetectedRoute(null);
                      setTotalDistance(0);
                      setEstimatedDuration(0);
                      if (directionsRenderer) {
                        directionsRenderer.setDirections({ routes: [] });
                      }
                      toast.success('Auto-detected route cleared');
                    }}
                    className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="text-sm">Reset Auto-Detection</span>
                  </button>
                )}
                
                <button
                  onClick={onClose}
                  className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default RouteMapEditor;
