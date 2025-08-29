import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TripSearchBanner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const todayStr = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState(todayStr);
  const [errors, setErrors] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState({ from: [], to: [] });
  const [showSug, setShowSug] = useState({ from: false, to: false });
  const abortRef = useRef(null);
  const fromInputRef = useRef(null);
  const toInputRef = useRef(null);
  const [popularRoutes, setPopularRoutes] = useState([]);

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
  };

  const validate = () => {
    const newErrors = {};
    if (!from?.trim()) newErrors.from = 'Please enter origin';
    if (!to?.trim()) newErrors.to = 'Please enter destination';
    if (from && to && from.trim().toLowerCase() === to.trim().toLowerCase()) newErrors.to = 'Origin and destination must differ';
    if (!date) newErrors.date = 'Please select a date';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSearch = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const qs = new URLSearchParams({ from, to, date }).toString();
    navigate(`/pax/results?${qs}`, { state: { from: location.pathname } });
  };

  // Debounced suggestions fetch
  const debounce = (fn, delay) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), delay);
    };
  };

  const fetchSuggestions = async (q, field) => {
    if (!q || q.length < 2) {
      setSuggestions((s) => ({ ...s, [field]: [] }));
      return;
    }
    try {
      // Prefer local filter of popular routes (no dedicated suggestions endpoint)
      if (popularRoutes.length > 0) {
        const options = popularRoutes
          .filter(r => {
            const text = (r.from + ' ' + r.to + ' ' + (r.name||'')).toLowerCase();
            return text.includes(q.toLowerCase());
          })
          .slice(0, 6)
          .map(r => ({ name: r.name, city: field === 'from' ? r.from : r.to, routeName: r.name }));
        setSuggestions((s) => ({ ...s, [field]: options }));
        return;
      }
      // Fallback: fetch popular routes once
      const res = await fetch('/api/booking/popular-routes');
      const data = await res.json();
      if (data?.ok && Array.isArray(data.data?.routes)) {
        setPopularRoutes(data.data.routes);
        const options = data.data.routes
          .filter(r => {
            const text = (r.from + ' ' + r.to + ' ' + (r.name||'')).toLowerCase();
            return text.includes(q.toLowerCase());
          })
          .slice(0, 6)
          .map(r => ({ name: r.name, city: field === 'from' ? r.from : r.to, routeName: r.name }));
        setSuggestions((s) => ({ ...s, [field]: options }));
      }
    } catch (_) {
      // ignore abort or network error
    }
  };

  const debouncedFetch = useMemo(() => debounce(fetchSuggestions, 250), []);

  useEffect(() => {
    if (from) debouncedFetch(from, 'from');
  }, [from]);

  useEffect(() => {
    if (to) debouncedFetch(to, 'to');
  }, [to]);

  // Preload popular routes on mount for instant suggestions
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/booking/popular-routes');
        const data = await res.json();
        if (data?.ok && Array.isArray(data.data?.routes)) setPopularRoutes(data.data.routes);
      } catch (_) {}
    })();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
      <form onSubmit={onSearch} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-start">
        <div className="col-span-2 relative">
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input
            ref={fromInputRef}
            value={from}
            onFocus={()=>setShowSug(s=>({...s,from:true}))}
            onBlur={()=>setTimeout(()=>setShowSug(s=>({...s,from:false})),150)}
            onChange={(e)=>{ setFrom(e.target.value); setErrors(prev=>({...prev,from:undefined})); }}
            placeholder="Bangalore"
            className={`w-full px-3 py-3 border rounded-lg ${errors.from? 'border-red-400' : 'border-gray-300'}`}
            autoComplete="off"
          />
          {errors.from && <div className="text-xs text-red-600 mt-1">{errors.from}</div>}
          {showSug.from && suggestions.from.length > 0 && (
            <ul className="absolute z-10 bg-white border border-gray-200 rounded-lg mt-1 w-full max-h-56 overflow-auto shadow-sm">
              {suggestions.from.map((s, idx) => (
                <li key={`from-${idx}`}>
                  <button type="button" className="w-full text-left px-3 py-2 hover:bg-gray-50" onMouseDown={()=>{ setFrom(s.name || s.city || s.routeName || s); setShowSug(v=>({...v,from:false})); toInputRef.current?.focus(); }}>
                    {s.name || s.city || s.routeName || s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-end md:items-center md:mt-6">
          <button type="button" onClick={handleSwap} className="px-3 py-3 border rounded-lg text-gray-600">↔</button>
        </div>
        <div className="col-span-2 relative">
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input
            ref={toInputRef}
            value={to}
            onFocus={()=>setShowSug(s=>({...s,to:true}))}
            onBlur={()=>setTimeout(()=>setShowSug(s=>({...s,to:false})),150)}
            onChange={(e)=>{ setTo(e.target.value); setErrors(prev=>({...prev,to:undefined})); }}
            placeholder="Chennai"
            className={`w-full px-3 py-3 border rounded-lg ${errors.to? 'border-red-400' : 'border-gray-300'}`}
            autoComplete="off"
          />
          {errors.to && <div className="text-xs text-red-600 mt-1">{errors.to}</div>}
          {showSug.to && suggestions.to.length > 0 && (
            <ul className="absolute z-10 bg-white border border-gray-200 rounded-lg mt-1 w-full max-h-56 overflow-auto shadow-sm">
              {suggestions.to.map((s, idx) => (
                <li key={`to-${idx}`}>
                  <button type="button" className="w-full text-left px-3 py-2 hover:bg-gray-50" onMouseDown={()=>{ setTo(s.name || s.city || s.routeName || s); setShowSug(v=>({...v,to:false})); }}>
                    {s.name || s.city || s.routeName || s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Date of Journey</label>
          <input type="date" value={date} min={todayStr} onChange={(e)=>{setDate(e.target.value); setErrors(prev=>({...prev,date:undefined}));}} className={`w-full px-3 py-3 border rounded-lg ${errors.date? 'border-red-400' : 'border-gray-300'}`} />
          {errors.date && <div className="text-xs text-red-600 mt-1">{errors.date}</div>}
        </div>
        <div className="md:col-span-1">
          <button type="submit" disabled={isSearching} className="w-full px-4 py-3 bg-rose-600 text-white rounded-lg font-semibold disabled:opacity-70">
            {isSearching ? 'Searching…' : 'Search buses'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TripSearchBanner;


