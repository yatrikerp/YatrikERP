import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Timer, Map } from 'lucide-react';

// Dynamic import for leaflet and react-leaflet to handle potential loading issues
let L, MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents;

try {
  L = require('leaflet');
  const ReactLeaflet = require('react-leaflet');
  MapContainer = ReactLeaflet.MapContainer;
  TileLayer = ReactLeaflet.TileLayer;
  Marker = ReactLeaflet.Marker;
  Popup = ReactLeaflet.Popup;
  Polyline = ReactLeaflet.Polyline;
  useMapEvents = ReactLeaflet.useMapEvents;
} catch (error) {
  console.warn('Leaflet or React-Leaflet not available, using fallback');
}

// Fix for default markers in react-leaflet (only if L is available)
if (L && L.Icon && L.Icon.Default) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

// Custom icons (only if L is available)
let startIcon, endIcon, stopIcon;

if (L && L.Icon) {
  startIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMxMGJ5ODUiLz4KPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI0IiB5PSI0Ij4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  endIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNlZjQ0NDQiLz4KPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI0IiB5PSI0Ij4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  stopIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMzYjgyZjYiLz4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });
}

// Map click handler component - only rendered when useMapEvents is available
function MapClickHandler({ onMapClick, isSelectingStart }) {
  // This component only renders when useMapEvents is available, so we can safely call it
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  
  return null;
}

// Wrapper component that conditionally renders MapClickHandler
function ConditionalMapClickHandler({ onMapClick, isSelectingStart }) {
  // Only render the component that uses the hook if the hook is available
  if (!useMapEvents) {
    return null;
  }
  
  return <MapClickHandler onMapClick={onMapClick} isSelectingStart={isSelectingStart} />;
}

const MapRouteCreator = ({ 
  mapState, 
  onMapClick, 
  onRouteGenerated,
  className = "w-full h-full"
}) => {
  const mapRef = useRef(null);

  // Use routeCoordinates from mapState if available
  const routeCoordinates = mapState.routeCoordinates || [];

  // Fallback UI if React-Leaflet is not available
  if (!MapContainer) {
    return (
      <div className={className}>
        <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <Map className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Map Loading...</p>
            <p className="text-sm text-gray-400">Click to select start and end points</p>
            <button
              onClick={() => onMapClick(10.8505, 76.2711)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Test Click (Kerala Center)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <MapContainer
        center={mapState.mapCenter}
        zoom={mapState.zoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <ConditionalMapClickHandler onMapClick={onMapClick} isSelectingStart={mapState.isSelectingStart} />
        
        {/* Start Marker */}
        {mapState.startLocation && (
          <Marker
            position={[mapState.startLocation.lat, mapState.startLocation.lng]}
            icon={startIcon}
          >
            <Popup>
              <div className="p-2">
                <div className="flex items-center space-x-2 mb-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-green-600">Start Location</span>
                </div>
                <p className="text-sm text-gray-700">{mapState.startLocation.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {mapState.startLocation.lat.toFixed(4)}, {mapState.startLocation.lng.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* End Marker */}
        {mapState.endLocation && (
          <Marker
            position={[mapState.endLocation.lat, mapState.endLocation.lng]}
            icon={endIcon}
          >
            <Popup>
              <div className="p-2">
                <div className="flex items-center space-x-2 mb-2">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span className="font-semibold text-red-600">End Location</span>
                </div>
                <p className="text-sm text-gray-700">{mapState.endLocation.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {mapState.endLocation.lat.toFixed(4)}, {mapState.endLocation.lng.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Intermediate Stops */}
        {mapState.intermediateStops.map((stop, index) => (
          <Marker
            key={stop.stopId}
            position={[stop.lat, stop.lng]}
            icon={stopIcon}
          >
            <Popup>
              <div className="p-2">
                <div className="flex items-center space-x-2 mb-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-blue-600">Stop {stop.sequence}</span>
                </div>
                <p className="text-sm text-gray-700">{stop.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Distance: {stop.distanceFromStart.toFixed(1)} km from start
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates}
            color="#3b82f6"
            weight={4}
            opacity={0.8}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapRouteCreator;
