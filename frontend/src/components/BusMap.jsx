import React, { useEffect, useRef, useState } from 'react';
import { Bus, Navigation, MapPin, Route } from 'lucide-react';
import { toast } from 'react-hot-toast';

const BusMap = ({ buses = [], tracking = {}, selectedBus, onBusSelect, fullscreen = false }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(false);

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
      existing.addEventListener('error', () => {
        toast.error('Failed to load Google Maps');
        setMapLoadError(true);
      }, { once: true });
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
      toast.error('Failed to load Google Maps. Please check your API key and network connection.');
      setMapLoadError(true);
    };
    document.head.appendChild(script);
  };

  // Initialize Google Maps
  const initializeMap = () => {
    if (!mapContainer.current || map.current) return;

    map.current = new window.google.maps.Map(mapContainer.current, {
      center: { lat: 20.5937, lng: 78.9629 }, // India center
      zoom: 5,
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
    });
  };

  useEffect(() => {
    loadGoogleMapsAPI();
    
    return () => {
      // Clean up markers
      Object.values(markersRef.current).forEach(marker => {
        if (marker.setMap) marker.setMap(null);
      });
      markersRef.current = {};
    };
  }, []);

  // Update bus markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => {
      if (marker.setMap) marker.setMap(null);
    });
    markersRef.current = {};

    // Add new markers
    buses.forEach(bus => {
      const position = tracking[bus._id] || { lat: 10.8505, lng: 76.2711 }; // Default to Kerala
      
      const marker = new window.google.maps.Marker({
        position: { lat: position.lat, lng: position.lng },
        map: map.current,
        title: `Bus ${bus.busNumber}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: selectedBus === bus._id ? '#ff4444' : '#1976d2',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        },
        animation: window.google.maps.Animation.DROP
      });

      // Create info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-semibold text-lg">Bus ${bus.busNumber}</h3>
            <p class="text-sm text-gray-600">Route: ${bus.route || 'N/A'}</p>
            <p class="text-sm text-gray-600">Status: ${bus.status || 'Active'}</p>
            <p class="text-sm text-gray-600">Last Update: ${new Date().toLocaleTimeString()}</p>
          </div>
        `
      });

      // Add click listener
      marker.addListener('click', () => {
        infoWindow.open(map.current, marker);
        if (onBusSelect) {
          onBusSelect(bus);
        }
      });

      markersRef.current[bus._id] = { marker, infoWindow };
    });

    // Fit map to show all buses
    if (buses.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      buses.forEach(bus => {
        const position = tracking[bus._id] || { lat: 10.8505, lng: 76.2711 };
        bounds.extend({ lat: position.lat, lng: position.lng });
      });
      map.current.fitBounds(bounds);
    }
  }, [buses, tracking, selectedBus, mapLoaded, onBusSelect]);

  // Update marker position for real-time tracking
  useEffect(() => {
    Object.entries(tracking).forEach(([busId, position]) => {
      const markerData = markersRef.current[busId];
      if (markerData && markerData.marker) {
        markerData.marker.setPosition({ lat: position.lat, lng: position.lng });
        
        // Add animation for movement
        markerData.marker.setAnimation(window.google.maps.Animation.BOUNCE);
        setTimeout(() => {
          markerData.marker.setAnimation(null);
        }, 1000);
      }
    });
  }, [tracking]);

  if (mapLoadError) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-lg">
        <div className="text-center">
          <Bus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Google Maps failed to load</p>
          <p className="text-sm text-gray-400">Please check your API key configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${fullscreen ? 'fixed inset-0 z-50' : 'w-full h-full'}`}>
      <div
        ref={mapContainer}
        className="w-full h-full"
        style={{ minHeight: fullscreen ? '100vh' : '400px' }}
      />
      
      {/* Map Controls Overlay */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <button
          onClick={() => {
            if (map.current) {
              map.current.setCenter({ lat: 20.5937, lng: 78.9629 });
              map.current.setZoom(5);
            }
          }}
          className="bg-white p-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
          title="Reset View"
        >
          <Navigation className="w-5 h-5 text-gray-600" />
        </button>
        
        {buses.length > 0 && (
          <button
            onClick={() => {
              if (map.current && buses.length > 0) {
                const bounds = new window.google.maps.LatLngBounds();
                buses.forEach(bus => {
                  const position = tracking[bus._id] || { lat: 10.8505, lng: 76.2711 };
                  bounds.extend({ lat: position.lat, lng: position.lng });
                });
                map.current.fitBounds(bounds);
              }
            }}
            className="bg-white p-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
            title="Fit All Buses"
          >
            <Route className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      {/* Bus Count Overlay */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg">
        <div className="flex items-center space-x-2">
          <Bus className="w-5 h-5 text-blue-600" />
          <span className="font-semibold">{buses.length} Buses</span>
        </div>
        <div className="text-sm text-gray-600 mt-1">
          {Object.keys(tracking).length} Active
        </div>
      </div>

      {/* Loading Overlay */}
      {!mapLoaded && !mapLoadError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading Google Maps...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusMap;