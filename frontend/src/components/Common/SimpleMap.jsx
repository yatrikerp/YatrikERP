import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';

const SimpleMap = ({ 
  center = { lat: 10.8505, lng: 76.2711 }, // Default to Kerala, India
  zoom = 10,
  markers = [],
  className = "w-full h-96"
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(false);
  const mapRef = useRef(null);
  const map = useRef(null);

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

    // Add markers
    markers.forEach((marker, index) => {
      new window.google.maps.Marker({
        position: marker.position || marker,
        map: map.current,
        title: marker.title || `Marker ${index + 1}`,
        icon: marker.icon || {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
        }
      });
    });

    map.current.addListener('tilesloaded', () => {
      setMapLoaded(true);
    });
  };

  useEffect(() => {
    loadGoogleMapsAPI();
    
    return () => {
      if (map.current) {
        map.current = null;
      }
    };
  }, []);

  const openInExternalMap = () => {
    const { lat, lng } = center;
    const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(googleMapsUrl, '_blank');
  };

  if (mapLoadError) {
    return (
      <div className={`${className} bg-gray-200 flex items-center justify-center rounded-lg`}>
        <div className="text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Google Maps failed to load</p>
          <button
            onClick={openInExternalMap}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open in Google Maps</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      <div
        ref={mapRef}
        className="w-full h-full rounded-lg"
      />
      
      {/* External Map Link */}
      <button
        onClick={openInExternalMap}
        className="absolute top-2 right-2 bg-white p-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
        title="Open in Google Maps"
      >
        <ExternalLink className="w-4 h-4 text-gray-600" />
      </button>

      {/* Loading Overlay */}
      {!mapLoaded && !mapLoadError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleMap;