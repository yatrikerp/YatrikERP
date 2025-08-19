import React, { useEffect, useMemo, useState } from 'react';

// Small utility helpers
const formatCurrency = (n) => `₹${(Number(n || 0)).toLocaleString('en-IN')}`;
const formatTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const formatDate = (d) => new Date(d).toLocaleDateString();

// Map panel renders a simple SVG map with pins based on lat/lng
const MiniMap = ({ points = [], width = 360, height = 180 }) => {
  // naive projection into viewBox; expects lat ∈ [8, 21], lng ∈ [74, 77] for Kerala-ish demo
  const projected = useMemo(() => {
    const minLat = 8, maxLat = 21, minLng = 74, maxLng = 77;
    return points.map((p) => ({
      x: ((p.lng - minLng) / (maxLng - minLng)) * width,
      y: height - ((p.lat - minLat) / (maxLat - minLat)) * height,
      status: p.status || 'running',
      label: p.label,
      speed: p.speed || 0
    }));
  }, [points, width, height]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto rounded-xl bg-blue-50 border border-blue-100">
      {/* abstract roads */}
      <path d={`M 10 ${height - 20} C ${width / 4} ${height - 60}, ${(width * 3) / 4} ${height - 60}, ${width - 10} ${height - 20}`}
        fill="none" stroke="#93C5FD" strokeWidth="6" strokeLinecap="round" />
      <path d={`M 10 20 C ${width / 3} 60, ${(width * 2) / 3} 60, ${width - 10} 20`}
        fill="none" stroke="#A7F3D0" strokeWidth="6" strokeLinecap="round" />
      {projected.map((p, idx) => (
        <g key={idx}>
          <circle cx={p.x} cy={p.y} r={7} fill={p.status === 'running' ? '#22C55E' : p.status === 'delayed' ? '#F59E0B' : '#EF4444'} />
          <text x={p.x + 10} y={p.y + 4} fontSize="10" fill="#0f172a">{p.label} • {Math.round(p.speed)}km/h</text>
        </g>
      ))}
    </svg>
  );
};

const DepotDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [buses, setBuses] = useState([]);
  const [staff, setStaff] = useState({ drivers: [], conductors: [] });
  const [trips, setTrips] = useState([]);
  const [live, setLive] = useState([]);

  // Modals
  const [showSchedule, setShowSchedule] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showIncident, setShowIncident] = useState(false);

  const [scheduleForm, setScheduleForm] = useState({ routeFrom: '', routeTo: '', busId: '', depart: '', arrive: '', fare: '' });
  const [assignForm, setAssignForm] = useState({ tripId: '', driverId: '', conductorId: '' });
  const [incidentForm, setIncidentForm] = useState({ tripId: '', type: 'delay', description: '' });

  const fetchJSON = async (url, fallback) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('bad');
      return await res.json();
    } catch (e) {
      return fallback;
    }
  };

  const loadAll = async () => {
    setLoading(true);
    const ov = await fetchJSON('/api/depot/overview', {
      depot: { name: 'Kochi Depot', address: 'Kaloor, Kochi, Kerala', phone: '+91 98xxx 12xxx', manager: 'Anita Varma' },
      kpis: { revenueToday: 125000, activeTrips: 5, idleBuses: 2, delays: 1, loadFactor: 0.76, onTime: 0.8 }
    });
    const bs = await fetchJSON('/api/depot/buses', [
      { _id: '101', number: 'KL-07-AB-101', type: 'AC Seater 2+2', capacity: 40, status: 'active' },
      { _id: '102', number: 'KL-07-AB-102', type: 'Non-AC Seater 2+3', capacity: 50, status: 'in_use' },
      { _id: '103', number: 'KL-07-AB-103', type: 'Sleeper 2+1', capacity: 30, status: 'maintenance' }
    ]);
    const st = await fetchJSON('/api/depot/staff', {
      drivers: [ { _id: 'd1', name: 'Driver A', status: 'available' }, { _id: 'd2', name: 'Driver B', status: 'on_trip' } ],
      conductors: [ { _id: 'c1', name: 'Conductor A', status: 'available' }, { _id: 'c2', name: 'Conductor B', status: 'on_trip' } ]
    });
    const tp = await fetchJSON('/api/depot/trips?date=today', [
      { _id: 't1', bus: '101', route: 'Kochi → Kottayam', depart: new Date().setHours(7,0,0,0), arrive: new Date().setHours(9,0,0,0), status: 'scheduled', fare: 220 },
      { _id: 't2', bus: '102', route: 'Kochi → Thrissur', depart: new Date().setHours(8,0,0,0), arrive: new Date().setHours(10,0,0,0), status: 'running', fare: 180 }
    ]);
    const lv = await fetchJSON('/api/depot/tracking/live', [
      { label: 'Bus 102', lat: 10.02, lng: 76.31, speed: 46, status: 'running' },
      { label: 'Bus 104', lat: 9.98, lng: 76.35, speed: 0, status: 'stopped' }
    ]);

    setOverview(ov);
    setBuses(bs);
    setStaff(st);
    setTrips(tp);
    setLive(lv);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // light polling for live map
    const id = setInterval(async () => {
      const lv = await fetchJSON('/api/depot/tracking/live', live);
      setLive(lv);
    }, 15000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleTrip = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/depot/trips', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(scheduleForm) });
      if (!res.ok) throw new Error();
    } catch (_) {}
    setShowSchedule(false);
    setScheduleForm({ routeFrom: '', routeTo: '', busId: '', depart: '', arrive: '', fare: '' });
    loadAll();
  };

  const assignStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/depot/assignments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(assignForm) });
      if (!res.ok) throw new Error();
    } catch (_) {}
    setShowAssign(false);
    setAssignForm({ tripId: '', driverId: '', conductorId: '' });
    loadAll();
  };

  const logIncident = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/depot/incidents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(incidentForm) });
      if (!res.ok) throw new Error();
    } catch (_) {}
    setShowIncident(false);
    setIncidentForm({ tripId: '', type: 'delay', description: '' });
    loadAll();
  };

  if (loading || !overview) {
    return (
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="animate-pulse h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="animate-pulse h-4 bg-gray-100 rounded w-2/3" />
      </div>
    );
  }

  const d = overview.depot;
  const k = overview.kpis;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow p-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">{d.name}</h1>
          <p className="text-gray-600 mt-1">{d.address} • {d.phone}</p>
          <p className="text-gray-600">Manager: <span className="font-semibold">{d.manager || '—'}</span></p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowSchedule(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">Schedule Trip</button>
          <button onClick={() => setShowAssign(true)} className="px-4 py-2 bg-cyan-600 text-white rounded-lg">Assign Staff</button>
          <button onClick={() => setShowIncident(true)} className="px-4 py-2 bg-rose-600 text-white rounded-lg">Log Incident</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4 shadow">
          <div className="text-xs text-gray-500">Revenue (Today)</div>
          <div className="text-xl font-bold">{formatCurrency(k.revenueToday)}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow">
          <div className="text-xs text-gray-500">Active Trips</div>
          <div className="text-xl font-bold">{k.activeTrips}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow">
          <div className="text-xs text-gray-500">Idle Buses</div>
          <div className="text-xl font-bold">{k.idleBuses}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow">
          <div className="text-xs text-gray-500">Delays</div>
          <div className="text-xl font-bold">{k.delays}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow">
          <div className="text-xs text-gray-500">Load Factor</div>
          <div className="text-xl font-bold">{Math.round(k.loadFactor * 100)}%</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow">
          <div className="text-xs text-gray-500">On‑Time</div>
          <div className="text-xl font-bold">{Math.round(k.onTime * 100)}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Live Map & Monitoring */}
        <div className="bg-white rounded-2xl shadow p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Live Trips</h2>
            <button onClick={loadAll} className="text-sm px-3 py-1 rounded bg-gray-100">Refresh</button>
          </div>
          <MiniMap points={live} />
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {trips.slice(0,4).map((t) => (
              <div key={t._id} className="rounded-lg border p-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{t.route}</div>
                  <div className="text-gray-500 text-sm">Bus {t.bus} • {formatTime(t.depart)} → {formatTime(t.arrive)}</div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-semibold ${t.status === 'running' ? 'text-emerald-600' : t.status === 'scheduled' ? 'text-cyan-600' : 'text-rose-600'}`}>{t.status}</div>
                  <div className="text-gray-500 text-xs">Fare {formatCurrency(t.fare)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: quick lists */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Bus Status</h2>
            <div className="space-y-2 max-h-64 overflow-auto pr-1">
              {buses.map((b) => (
                <div key={b._id} className="flex items-center justify-between border rounded-lg p-2">
                  <div>
                    <div className="font-semibold text-gray-900">{b.number}</div>
                    <div className="text-gray-500 text-xs">{b.type} • {b.capacity} seats</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${b.status === 'active' ? 'bg-emerald-50 text-emerald-700' : b.status === 'in_use' ? 'bg-amber-50 text-amber-700' : b.status === 'maintenance' ? 'bg-rose-50 text-rose-700' : 'bg-gray-50 text-gray-700'}`}>{b.status.replace('_',' ')}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Staff Roster (Today)</h2>
            <div className="text-sm text-gray-700">Drivers</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {staff.drivers.map((s) => (
                <span key={s._id} className={`text-xs px-2 py-1 rounded-full border ${s.status === 'available' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>{s.name} • {s.status}</span>
              ))}
            </div>
            <div className="text-sm text-gray-700 mt-2">Conductors</div>
            <div className="flex flex-wrap gap-2">
              {staff.conductors.map((s) => (
                <span key={s._id} className={`text-xs px-2 py-1 rounded-full border ${s.status === 'available' ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>{s.name} • {s.status}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sales & Bookings */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Bookings (Today)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2">Trip</th>
                  <th className="py-2">Depart</th>
                  <th className="py-2">Seats</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {trips.map((t) => (
                  <tr key={t._id}>
                    <td className="py-2">{t.route}</td>
                    <td className="py-2">{formatTime(t.depart)}</td>
                    <td className="py-2">{Math.round((overview.kpis.loadFactor || 0.7) * 100)}%</td>
                    <td className="py-2 capitalize">{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Sales & Refunds (Today)</h2>
          <ul className="text-sm text-gray-700 space-y-2">
            <li className="flex items-center justify-between"><span>Tickets Sold</span><span className="font-semibold">{Math.round(k.loadFactor * 200)}</span></li>
            <li className="flex items-center justify-between"><span>Cash Bookings</span><span className="font-semibold">{Math.round(k.loadFactor * 20)}</span></li>
            <li className="flex items-center justify-between"><span>Refunds</span><span className="font-semibold">{Math.round(k.delays)}</span></li>
            <li className="flex items-center justify-between"><span>Revenue</span><span className="font-semibold">{formatCurrency(k.revenueToday)}</span></li>
          </ul>
        </div>
      </div>

      {/* Modals */}
      {showSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <form onSubmit={scheduleTrip} className="bg-white rounded-xl shadow-xl w-full max-w-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Schedule Trip</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">From</label>
                <input value={scheduleForm.routeFrom} onChange={(e)=>setScheduleForm((s)=>({...s, routeFrom:e.target.value}))} className="w-full border rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">To</label>
                <input value={scheduleForm.routeTo} onChange={(e)=>setScheduleForm((s)=>({...s, routeTo:e.target.value}))} className="w-full border rounded-lg px-3 py-2" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Bus</label>
                <select value={scheduleForm.busId} onChange={(e)=>setScheduleForm((s)=>({...s, busId:e.target.value}))} className="w-full border rounded-lg px-3 py-2" required>
                  <option value="">Select Bus</option>
                  {buses.filter(b=>b.status!=='maintenance').map(b=> <option key={b._id} value={b._id}>{b.number} • {b.type}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Fare</label>
                <input type="number" value={scheduleForm.fare} onChange={(e)=>setScheduleForm((s)=>({...s, fare:e.target.value}))} className="w-full border rounded-lg px-3 py-2" placeholder="e.g. 220" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Departure</label>
                <input type="datetime-local" value={scheduleForm.depart} onChange={(e)=>setScheduleForm((s)=>({...s, depart:e.target.value}))} className="w-full border rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Arrival</label>
                <input type="datetime-local" value={scheduleForm.arrive} onChange={(e)=>setScheduleForm((s)=>({...s, arrive:e.target.value}))} className="w-full border rounded-lg px-3 py-2" required />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={()=>setShowSchedule(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600 text-white">Create</button>
            </div>
          </form>
        </div>
      )}

      {showAssign && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <form onSubmit={assignStaff} className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Assign Driver & Conductor</h3>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Trip</label>
              <select value={assignForm.tripId} onChange={(e)=>setAssignForm((s)=>({...s, tripId:e.target.value}))} className="w-full border rounded-lg px-3 py-2" required>
                <option value="">Select Trip</option>
                {trips.map(t=> <option key={t._id} value={t._id}>{t.route} • {formatTime(t.depart)}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Driver</label>
                <select value={assignForm.driverId} onChange={(e)=>setAssignForm((s)=>({...s, driverId:e.target.value}))} className="w-full border rounded-lg px-3 py-2" required>
                  <option value="">Select Driver</option>
                  {staff.drivers.map(d=> <option key={d._id} value={d._id}>{d.name} • {d.status}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Conductor</label>
                <select value={assignForm.conductorId} onChange={(e)=>setAssignForm((s)=>({...s, conductorId:e.target.value}))} className="w-full border rounded-lg px-3 py-2" required>
                  <option value="">Select Conductor</option>
                  {staff.conductors.map(c=> <option key={c._id} value={c._id}>{c.name} • {c.status}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={()=>setShowAssign(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-cyan-600 text-white">Assign</button>
            </div>
          </form>
        </div>
      )}

      {showIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <form onSubmit={logIncident} className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Log Incident / Delay</h3>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Trip</label>
              <select value={incidentForm.tripId} onChange={(e)=>setIncidentForm((s)=>({...s, tripId:e.target.value}))} className="w-full border rounded-lg px-3 py-2" required>
                <option value="">Select Trip</option>
                {trips.map(t=> <option key={t._id} value={t._id}>{t.route} • {formatTime(t.depart)}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Type</label>
                <select value={incidentForm.type} onChange={(e)=>setIncidentForm((s)=>({...s, type:e.target.value}))} className="w-full border rounded-lg px-3 py-2">
                  <option value="delay">Delay</option>
                  <option value="breakdown">Breakdown</option>
                  <option value="route_change">Route Change</option>
                  <option value="accident">Accident</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Timestamp</label>
                <input value={formatDate(Date.now())} readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Description</label>
              <textarea value={incidentForm.description} onChange={(e)=>setIncidentForm((s)=>({...s, description:e.target.value}))} rows={3} className="w-full border rounded-lg px-3 py-2" placeholder="Add details..." />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={()=>setShowIncident(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-rose-600 text-white">Log</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DepotDashboard;
