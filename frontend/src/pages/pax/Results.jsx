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
        <div key={t._id} className="bg-white rounded-2xl shadow-soft p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">{t.routeName}</div>
              <div className="text-sm text-gray-600">Start {t.startTime} • {new Date(t.serviceDate).toDateString()}</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-green-100 text-green-800 text-sm font-bold px-3 py-1 rounded-full">₹{t.fare}</div>
              <button onClick={()=>{
                if(!user){
                  navigate(`/login?next=/pax/booking/${t._id}`);
                } else {
                  navigate(`/pax/booking/${t._id}`);
                }
              }} className="bg-primary-600 text-white rounded-full px-4 py-2">Select Berth</button>
            </div>
          </div>
        </div>
      ))}
      {trips.length===0 && <div className="text-gray-600">No trips found.</div>}
    </div>
  );
};

export default PaxResults;


