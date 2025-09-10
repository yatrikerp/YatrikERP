import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const PaxResults = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    async function load(){
      const raw = Object.fromEntries(params.entries());
      const mapped = new URLSearchParams({
        from: raw.from || raw.fromCity || '',
        to: raw.to || raw.toCity || '',
        date: raw.date || ''
      });
      const res = await apiFetch(`/api/trips/search?${mapped.toString()}`);
      if (res.ok) setTrips(res.data.data?.trips || res.data.trips || []);
    }
    load();
  }, [params]);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Available Trips</h1>
      {trips.map(t => (
        <div key={t._id} className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-lg font-semibold text-gray-900">{t.routeName}</div>
              <div className="text-sm text-gray-600 mb-2">
                {t.fromCity} → {t.toCity}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                {t.startTime} - {t.endTime} • {new Date(t.serviceDate).toDateString()}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Capacity: {t.capacity}</span>
                <span>Available: {t.availableSeats}</span>
                <span>Distance: {t.distanceKm} km</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="bg-green-100 text-green-800 text-lg font-bold px-4 py-2 rounded-full">₹{t.fare}</div>
                <div className="text-xs text-gray-500 mt-1">per seat</div>
              </div>
              <button 
                onClick={()=>{
                  console.log('🚌 Booking trip:', t._id, t.routeName);
                  if(!user){
                    navigate(`/login?next=/pax/booking/${t._id}`);
                  } else {
                    navigate(`/pax/booking/${t._id}`);
                  }
                }} 
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-3 font-semibold transition-colors"
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      ))}
      {trips.length===0 && (
        <div className="text-center py-12">
          <div className="text-gray-600 text-lg">No trips found for your search.</div>
          <div className="text-gray-500 text-sm mt-2">Try searching for different cities or dates.</div>
        </div>
      )}
    </div>
  );
};

export default PaxResults;


