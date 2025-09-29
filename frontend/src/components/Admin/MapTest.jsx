import React, { useEffect } from 'react';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapTest = () => {
  useEffect(() => {
    // Initialize a simple map to test Leaflet integration
    const map = L.map('map-test').setView([10.8505, 76.2711], 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add a marker
    L.marker([10.8505, 76.2711]).addTo(map)
      .bindPopup('Kerala, India')
      .openPopup();

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div className="w-full h-64 border border-gray-300 rounded-lg">
      <div id="map-test" className="w-full h-full rounded-lg"></div>
    </div>
  );
};

export default MapTest;
