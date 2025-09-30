import React, { useState, useEffect, useRef } from 'react';
import { Navigation, MapPin, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';

const LiveMap = ({ busData, center = { lat: 10.8505, lng: 76.2711 }, zoom = 12 }) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(false);
  const mapRef = useRef(null);
  const map = useRef(null);
  const markersRef = useRef({});

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
      center: center,
      zoom: zoom,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    // Add bus markers if busData is provided
    if (busData && Array.isArray(busData)) {
      busData.forEach((bus, index) => {
        const marker = new window.google.maps.Marker({
          position: bus.coordinates || center,
          map: map.current,
          title: `Bus ${bus.busNumber || index + 1}`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: bus.status === 'active' ? '#1976d2' : '#666',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          },
          animation: window.google.maps.Animation.DROP
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div class="p-2">
              <h3 class="font-semibold">Bus ${bus.busNumber || `#${index + 1}`}</h3>
              <p class="text-sm text-gray-600">Route: ${bus.route || 'N/A'}</p>
              <p class="text-sm text-gray-600">Status: ${bus.status || 'Unknown'}</p>
              <p class="text-sm text-gray-600">Speed: ${bus.speed || 'N/A'}</p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map.current, marker);
        });

        markersRef.current[bus.id || index] = { marker, infoWindow };
      });
    }

    map.current.addListener('tilesloaded', () => {
      setMapLoaded(true);
    });
  };

  useEffect(() => {
    loadGoogleMapsAPI();
    
    return () => {
      Object.values(markersRef.current).forEach(({ marker }) => {
        if (marker.setMap) marker.setMap(null);
      });
      markersRef.current = {};
      if (map.current) {
        map.current = null;
      }
    };
  }, []);

  // Update markers when busData changes
  useEffect(() => {
    if (!map.current || !mapLoaded || !busData) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(({ marker }) => {
      if (marker.setMap) marker.setMap(null);
    });
    markersRef.current = {};

    // Add new markers
    if (Array.isArray(busData)) {
      busData.forEach((bus, index) => {
        const marker = new window.google.maps.Marker({
          position: bus.coordinates || center,
          map: map.current,
          title: `Bus ${bus.busNumber || index + 1}`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: bus.status === 'active' ? '#1976d2' : '#666',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div class="p-2">
              <h3 class="font-semibold">Bus ${bus.busNumber || `#${index + 1}`}</h3>
              <p class="text-sm text-gray-600">Route: ${bus.route || 'N/A'}</p>
              <p class="text-sm text-gray-600">Status: ${bus.status || 'Unknown'}</p>
              <p class="text-sm text-gray-600">Speed: ${bus.speed || 'N/A'}</p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map.current, marker);
        });

        markersRef.current[bus.id || index] = { marker, infoWindow };
      });
    }
  }, [busData, center, mapLoaded]);

  const openInExternalMap = () => {
    const { lat, lng } = center;
    const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(googleMapsUrl, '_blank');
  };

  if (mapLoadError) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3 font-semibold text-gray-800">
          <Navigation className="w-5 h-5 text-gray-600" /> Track My Bus
        </div>
        <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Google Maps failed to load</p>
            <button
              onClick={openInExternalMap}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1 mx-auto"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in Google Maps</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 font-semibold text-gray-800">
          <Navigation className="w-5 h-5 text-gray-600" /> Track My Bus
        </div>
        <button
          onClick={openInExternalMap}
          className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
          title="Open in Google Maps"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
      
      <div className="relative rounded-lg overflow-hidden border">
        <div
          ref={mapRef}
          className="w-full h-64"
        />
        
        {/* Loading Overlay */}
        {!mapLoaded && !mapLoadError && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Loading map...</p>
            </div>
          </div>
        )}
      </div>
      
      {busData && Array.isArray(busData) && (
        <div className="mt-3 text-sm text-gray-600">
          <span className="font-medium">{busData.length}</span> buses tracked
        </div>
      )}
    </div>
  );
};

export default LiveMap;