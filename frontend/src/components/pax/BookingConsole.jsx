import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import { Search, Calendar, MapPin } from 'lucide-react';

const BookingConsole = () => {
  const navigate = useNavigate();
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  const canSearch = useMemo(() => fromCity && toCity, [fromCity, toCity]);

  const runSearch = (e) => {
    e?.preventDefault?.();
    if (!canSearch) return;
    const params = new URLSearchParams({ from: fromCity, to: toCity });
    if (date) params.set('date', date);
    navigate(`/pax/results?${params.toString()}`);
  };

  // PNR lookup removed from header

  return (
    <div className="rounded-md border border-gray-200 bg-white overflow-hidden">
      {/* Top control bar (navy/orange style) */}
      <div className="bg-[#0b1e46] text-white rounded-md">
        <form onSubmit={runSearch} className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 items-center">
          {/* From */}
          <div className="lg:col-span-3 flex items-center gap-2">
            <span className="px-3 h-10 inline-flex items-center text-xs font-semibold rounded bg-[#ff7a1a]">From</span>
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none"><MapPin className="w-4 h-4 text-gray-400" /></div>
              <input value={fromCity} onChange={(e)=>setFromCity(e.target.value)} className="w-full pl-7 pr-2 h-10 rounded bg-white text-gray-900 placeholder-gray-400" placeholder="City" />
            </div>
          </div>
          {/* To */}
          <div className="lg:col-span-3 flex items-center gap-2">
            <span className="px-3 h-10 inline-flex items-center text-xs font-semibold rounded bg-[#ff7a1a]">To</span>
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none"><MapPin className="w-4 h-4 text-gray-400" /></div>
              <input value={toCity} onChange={(e)=>setToCity(e.target.value)} className="w-full pl-7 pr-2 h-10 rounded bg-white text-gray-900 placeholder-gray-400" placeholder="City" />
            </div>
          </div>
          {/* Date */}
          <div className="lg:col-span-2 flex items-center gap-2">
            <span className="px-3 h-10 inline-flex items-center text-xs font-semibold rounded bg-[#ff7a1a]">Date</span>
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none"><Calendar className="w-4 h-4 text-gray-400" /></div>
              <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="w-full pl-7 pr-2 h-10 rounded bg-white text-gray-900" />
            </div>
          </div>
          {/* Buttons */}
          <div className="lg:col-span-4 flex gap-2 justify-end">
            <button type="submit" disabled={!canSearch || loading} className="inline-flex items-center justify-center gap-2 px-4 h-10 rounded bg-[#ff7a1a] text-white disabled:opacity-60">
              <Search className="w-4 h-4" /> Search
            </button>
          </div>
        </form>
      </div>

      {/* Results table */}
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-gray-600">
                <th className="px-3 py-2">Coach</th>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">AC</th>
                <th className="px-3 py-2">Route</th>
                <th className="px-3 py-2">Available</th>
                <th className="px-3 py-2">Fare</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t)=> (
                <tr key={t._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2 text-blue-600">{t.busNumber || t.coachNo || '-'}</td>
                  <td className="px-3 py-2">{t.startTime} → {t.endTime}</td>
                  <td className="px-3 py-2">{t.busType || t.type || '-'}</td>
                  <td className="px-3 py-2">{t.isAC ? 'AC' : 'Non-AC'}</td>
                  <td className="px-3 py-2">{t.fromCity} → {t.toCity}</td>
                  <td className="px-3 py-2">{t.availableSeats ?? '-'}</td>
                  <td className="px-3 py-2">₹{t.fare}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={()=> navigate(`/pax/booking/${t._id}`)} className="px-3 py-1.5 rounded bg-[#ff7a1a] text-white text-xs">View Seat</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BookingConsole;


