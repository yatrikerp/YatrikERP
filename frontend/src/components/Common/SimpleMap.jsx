import React, { useState } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';

const SimpleMap = ({ 
  center = { lat: 10.8505, lng: 76.2711 }, // Default to Kerala, India
  zoom = 10,
  markers = [],
  className = "w-full h-96"
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);

  const generateOpenStreetMapUrl = () => {
    const { lat, lng } = center;
    const bbox = `${lng-0.1},${lat-0.1},${lng+0.1},${lat+0.1}`;
    
    let url = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
    
    // Add additional markers if provided
    if (markers.length > 0) {
      const markerParams = markers.map(marker => `${marker.position[0]},${marker.position[1]}`).join('&marker=');
      if (markerParams) {
        url += `&marker=${markerParams}`;
      }
    }
    
    return url;
  };

  const openInExternalMap = () => {
    const { lat, lng } = center;
    const url = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=${zoom}`;
    window.open(url, '_blank');
  };

  return (
    <div className={`relative ${className} rounded-lg overflow-hidden border-2 border-gray-200`}>
      {/* OpenStreetMap iframe */}
      <iframe
        src={generateOpenStreetMapUrl()}
        className="w-full h-full"
        style={{ border: 0 }}
        allowFullScreen
        title="Map View"
        onLoad={() => setMapLoaded(true)}
      />
      
      {/* Loading Overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-bounce" />
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 bg-white bg-opacity-90 rounded-lg p-2">
        <button
          onClick={openInExternalMap}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          title="Open in new tab"
        >
          <ExternalLink className="w-4 h-4" />
          Open Map
        </button>
      </div>

      {/* Map Attribution */}
      <div className="absolute bottom-2 right-2 bg-white bg-opacity-80 rounded px-2 py-1 text-xs text-gray-600">
        <a 
          href="https://www.openstreetmap.org/copyright" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-blue-600 transition-colors"
        >
          © OpenStreetMap
        </a>
      </div>
    </div>
  );
};

export default SimpleMap;