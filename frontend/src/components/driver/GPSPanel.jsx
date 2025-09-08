import React, { useEffect, useRef, useState } from 'react';
import http from '../../utils/http';

const GPSPanel = ({ dutyId, colors }) => {
  const primary = colors?.primary || '#0088A9';
  const [coords, setCoords] = useState(null);
  const intervalRef = useRef(null);

  const send = async (position) => {
    if (!dutyId) return;
    const { latitude, longitude } = position.coords;
    setCoords({ lat: latitude, lng: longitude });
    await http.post(`/api/duty/${dutyId}/location`, { latitude, longitude, timestamp: Date.now() });
  };

  const start = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(send);
    intervalRef.current = setInterval(() => navigator.geolocation.getCurrentPosition(send), 30000);
  };

  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  useEffect(() => () => stop(), []);

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-100">
      <div className="px-4 py-3 rounded-t-2xl text-white flex items-center justify-between" style={{ background: primary }}>
        <h3 className="font-semibold">Live GPS Tracking</h3>
        <div className="flex gap-2">
          <button onClick={start} className="px-3 py-1.5 text-xs font-semibold bg-white/20 rounded-lg">Start GPS</button>
          <button onClick={stop} className="px-3 py-1.5 text-xs font-semibold bg-white/20 rounded-lg">Stop</button>
        </div>
      </div>
      <div className="p-4">
        <div className="text-sm text-slate-600">Current: {coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : '—'}</div>
        <div className="mt-3 rounded-xl overflow-hidden border">
          <iframe
            title="Live Map"
            className="w-full h-64 border-0"
            src={coords ? `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=14&output=embed` : 'https://maps.google.com/maps?q=Kochi&z=11&output=embed'}
          />
        </div>
      </div>
    </div>
  );
};

export default GPSPanel;


