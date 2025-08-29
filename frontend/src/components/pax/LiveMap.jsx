import React from 'react';
import { Navigation } from 'lucide-react';

const LiveMap = ({ mapUrl }) => {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3 font-semibold text-gray-800">
        <Navigation className="w-5 h-5 text-gray-600" /> Track My Bus
      </div>
      <div className="rounded-lg overflow-hidden border">
        <iframe
          title="Live Map"
          src={mapUrl || 'https://maps.google.com/maps?q=Kochi&t=&z=11&ie=UTF8&iwloc=&output=embed'}
          className="w-full h-64 border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
};

export default LiveMap;


