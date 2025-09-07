import React, { useEffect, useRef, useState } from 'react';
import * as mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Bus, Navigation, MapPin, Route } from 'lucide-react';

// Set your Mapbox access token here
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN';

const BusMap = ({ buses = [], tracking = {}, selectedBus, onBusSelect, fullscreen = false }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef({});
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [78.9629, 20.5937], // India center
      zoom: 5
    });

    map.current.on('load', () => {
      setMapLoaded(true);
      
      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Add fullscreen control
      if (fullscreen) {
        map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
      }

      // Add geolocate control
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        }),
        'top-right'
      );

      // Add route layer
      map.current.addSource('routes', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      map.current.addLayer({
        id: 'routes',
        type: 'line',
        source: 'routes',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#1976d2',
          'line-width': 4,
          'line-opacity': 0.7
        }
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [fullscreen]);

  // Update bus markers
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    buses.forEach(bus => {
      const busTracking = tracking[bus._id];
      const coordinates = busTracking?.location || bus.lastKnownLocation;

      if (!coordinates?.lat || !coordinates?.lng) return;

      const markerId = `bus-${bus._id}`;

      // Create or update marker
      if (!markersRef.current[markerId]) {
        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'bus-marker';
        el.innerHTML = createBusMarkerHTML(bus, busTracking);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([coordinates.lng, coordinates.lat])
          .setPopup(createBusPopup(bus, busTracking))
          .addTo(map.current);

        // Add click handler
        el.addEventListener('click', () => {
          if (onBusSelect) {
            onBusSelect(bus);
          }
        });

        markersRef.current[markerId] = { marker, element: el, bus };
      } else {
        // Update existing marker
        const { marker, element } = markersRef.current[markerId];
        marker.setLngLat([coordinates.lng, coordinates.lat]);
        element.innerHTML = createBusMarkerHTML(bus, busTracking);
        
        // Update popup content
        const popup = marker.getPopup();
        if (popup) {
          popup.setHTML(createBusPopupHTML(bus, busTracking));
        }
      }

      // Update marker appearance based on status
      const { element } = markersRef.current[markerId];
      element.className = `bus-marker ${bus.status} ${selectedBus?._id === bus._id ? 'selected' : ''}`;
    });

    // Remove markers for buses that no longer exist
    Object.keys(markersRef.current).forEach(markerId => {
      const busId = markerId.replace('bus-', '');
      if (!buses.find(b => b._id === busId)) {
        markersRef.current[markerId].marker.remove();
        delete markersRef.current[markerId];
      }
    });
  }, [buses, tracking, selectedBus, mapLoaded, onBusSelect]);

  // Center on selected bus
  useEffect(() => {
    if (!selectedBus || !map.current) return;

    const busTracking = tracking[selectedBus._id];
    const coordinates = busTracking?.location || selectedBus.lastKnownLocation;

    if (coordinates?.lat && coordinates?.lng) {
      map.current.flyTo({
        center: [coordinates.lng, coordinates.lat],
        zoom: 15,
        duration: 1000
      });
    }
  }, [selectedBus, tracking]);

  const createBusMarkerHTML = (bus, tracking) => {
    const speed = tracking?.speed || 0;
    const isMoving = speed > 5;
    const rotation = tracking?.heading || 0;

    return `
      <div class="bus-marker-icon ${isMoving ? 'moving' : ''}" style="transform: rotate(${rotation}deg)">
        <svg width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="${getBusColor(bus.status)}" opacity="0.8"/>
          <text x="20" y="25" text-anchor="middle" fill="white" font-size="12" font-weight="bold">
            ${bus.busNumber.slice(0, 4)}
          </text>
        </svg>
        ${isMoving ? '<div class="speed-indicator">' + speed + ' km/h</div>' : ''}
      </div>
    `;
  };

  const createBusPopup = (bus, tracking) => {
    return new mapboxgl.Popup({ offset: 25 })
      .setHTML(createBusPopupHTML(bus, tracking));
  };

  const createBusPopupHTML = (bus, tracking) => {
    return `
      <div class="bus-popup">
        <h3 class="font-bold text-lg mb-2">${bus.busNumber}</h3>
        <div class="space-y-1 text-sm">
          <p><strong>Registration:</strong> ${bus.registrationNumber}</p>
          <p><strong>Status:</strong> <span class="status-badge ${bus.status}">${bus.status}</span></p>
          <p><strong>Driver:</strong> ${bus.driver?.name || 'Not assigned'}</p>
          <p><strong>Route:</strong> ${bus.currentRoute?.name || 'Not on route'}</p>
          ${tracking ? `
            <p><strong>Speed:</strong> ${tracking.speed || 0} km/h</p>
            <p><strong>Last Update:</strong> ${new Date(tracking.timestamp).toLocaleTimeString()}</p>
          ` : ''}
          <p><strong>Fuel Level:</strong> ${bus.fuelLevel || 0}%</p>
          <p><strong>Occupancy:</strong> ${bus.occupancy || 0}/${bus.capacity}</p>
        </div>
      </div>
    `;
  };

  const getBusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'maintenance': return '#f59e0b';
      case 'inactive': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <>
      <style>
        {`
          .bus-marker {
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .bus-marker:hover {
            transform: scale(1.1);
          }
          
          .bus-marker.selected {
            transform: scale(1.2);
            z-index: 10;
          }
          
          .bus-marker-icon {
            position: relative;
            transition: transform 0.3s ease;
          }
          
          .bus-marker-icon.moving {
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
          }
          
          .speed-indicator {
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            white-space: nowrap;
          }
          
          .bus-popup {
            padding: 10px;
            min-width: 200px;
          }
          
          .status-badge {
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
          }
          
          .status-badge.active {
            background: #d1fae5;
            color: #065f46;
          }
          
          .status-badge.maintenance {
            background: #fef3c7;
            color: #92400e;
          }
          
          .status-badge.inactive {
            background: #fee2e2;
            color: #991b1b;
          }
        `}
      </style>
      <div 
        ref={mapContainer} 
        className={`w-full ${fullscreen ? 'h-full' : 'h-96'} rounded-lg`}
      />
      
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-bounce" />
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default BusMap;

