import React, { useEffect, useMemo, useState } from 'react';
import './depot.css';
import { useAuth } from '../context/AuthContext';

// Small utility helpers
const formatCurrency = (n) => `₹${(Number(n || 0)).toLocaleString('en-IN')}`;
const formatTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const formatDate = (d) => new Date(d).toLocaleDateString();

// Map panel renders a simple SVG map with pins based on lat/lng
const MiniMap = ({ points = [], width = 840, height = 360 }) => {
	// naive projection into viewBox; expects lat ∈ [8, 21], lng ∈ [74, 77] for Kerala-ish demo
	const projected = useMemo(() => {
		const pts = Array.isArray(points) ? points : [];
		const minLat = 8, maxLat = 21, minLng = 74, maxLng = 77;
		return pts.map((p) => ({
			x: ((p.lng - minLng) / (maxLng - minLng)) * width,
			y: height - ((p.lat - minLat) / (maxLat - minLat)) * height,
			status: p.status || 'running',
			label: p.label,
			speed: p.speed || 0
		}));
	}, [points, width, height]);

	return (
		<svg viewBox={`0 0 ${width} ${height}`} className="depot-map">
			{/* abstract roads */}
			<path d={`M 10 ${height - 30} C ${width / 4} ${height - 90}, ${(width * 3) / 4} ${height - 90}, ${width - 10} ${height - 30}`}
				fill="none" stroke="#bcd9ff" strokeWidth="8" strokeLinecap="round" />
			<path d={`M 10 30 C ${width / 3} 90, ${(width * 2) / 3} 90, ${width - 10} 30`}
				fill="none" stroke="#cce8ff" strokeWidth="8" strokeLinecap="round" />
			{projected.map((p, idx) => (
				<g key={idx} className="depot-map-pin">
					<circle cx={p.x} cy={p.y} r={8} fill={p.status === 'running' ? '#26C281' : p.status === 'in_use' ? '#FF9800' : '#E53935'} />
					<text x={p.x + 12} y={p.y + 4} fontSize="11" fill="#0f172a">{p.label} • {Math.round(p.speed)}km/h</text>
				</g>
			))}
		</svg>
	);
};

const DepotDashboard = () => {
	const { logout } = useAuth();
	const [loading, setLoading] = useState(true);
	const [overview, setOverview] = useState(null);
	const [buses, setBuses] = useState([]);
	const [staff, setStaff] = useState({ drivers: [], conductors: [] });
	const [trips, setTrips] = useState([]);
	const [live, setLive] = useState([]);

	// New state for redesigned dashboard
	const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
	const [alerts, setAlerts] = useState([]);
	const [bookings, setBookings] = useState([]);
	const [sales, setSales] = useState({ cash: 0, online: 0, refunds: 0, yesterday: 0, today: 0 });
	const [fuel, setFuel] = useState({ stock: 0, usageToday: 0, nextRefuel: '', costPerLitre: 0 });
	const [filters, setFilters] = useState({ route: '', status: '' });

	// Modals (kept for feature parity)
	const [showSchedule, setShowSchedule] = useState(false);
	const [showAssign, setShowAssign] = useState(false);
	const [showIncident, setShowIncident] = useState(false);

	const [scheduleForm, setScheduleForm] = useState({ routeFrom: '', routeTo: '', busId: '', depart: '', arrive: '', fare: '' });
	const [assignForm, setAssignForm] = useState({ tripId: '', driverId: '', conductorId: '' });
	const [incidentForm, setIncidentForm] = useState({ tripId: '', type: 'delay', description: '' });

	const fetchJSON = async (url, fallback) => {
		try {
			const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }});
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
		const tp = await fetchJSON(`/api/depot/trips?date=${selectedDate}`, [
			{ _id: 't1', bus: '101', route: 'Kochi → Kottayam', depart: new Date().setHours(7,0,0,0), arrive: new Date().setHours(9,0,0,0), status: 'scheduled', fare: 220 },
			{ _id: 't2', bus: '102', route: 'Kochi → Thrissur', depart: new Date().setHours(8,0,0,0), arrive: new Date().setHours(10,0,0,0), status: 'running', fare: 180 }
		]);
		const lv = await fetchJSON('/api/depot/tracking/live', [
			{ label: 'Bus 102', lat: 10.02, lng: 76.31, speed: 46, status: 'running' },
			{ label: 'Bus 104', lat: 9.98, lng: 76.35, speed: 0, status: 'in_use' }
		]);
		const al = await fetchJSON('/api/depot/alerts', [
			{ id: 'a1', type: 'delay', message: 'Bus 102 delayed by 12 mins', severity: 'warning', at: new Date() },
			{ id: 'a2', type: 'breakdown', message: 'Bus 103 reported breakdown', severity: 'danger', at: new Date() }
		]);
		const bk = await fetchJSON(`/api/depot/bookings?date=${selectedDate}`, [
			{ id: 'b1', route: 'Kochi → Kottayam', pax: 2, status: 'confirmed', time: '08:15', amount: 440 },
			{ id: 'b2', route: 'Kochi → Thrissur', pax: 1, status: 'refunded', time: '09:10', amount: 180 }
		]);
		const sl = await fetchJSON(`/api/depot/sales?date=${selectedDate}`, { cash: 42000, online: 83000, refunds: 5000, yesterday: 100000, today: 120000 });
		const fl = await fetchJSON('/api/depot/fuel', { stock: 1800, usageToday: 220, nextRefuel: 'Tomorrow 07:30', costPerLitre: 98 });

		// Normalize varying API shapes: sometimes backend returns { success, data }
		const ovNorm = ov?.data ? ov.data : ov;
		const bsNorm = bs?.data ? bs.data : bs;
		const stNorm = st?.data ? st.data : st;
		const tpNorm = tp?.data ? tp.data : tp;
		const lvNorm = lv?.data ? lv.data : lv;
		const alNorm = al?.data ? al.data : al;
		const bkNorm = bk?.data ? bk.data : bk;
		const slNorm = sl?.data ? sl.data : sl;
		const flNorm = fl?.data ? fl.data : fl;

		setOverview(ovNorm);
		setBuses(bsNorm);
		setStaff(stNorm);
		setTrips(tpNorm);
		setLive(Array.isArray(lvNorm) ? lvNorm : []);
		setAlerts(alNorm);
		setBookings(bkNorm);
		setSales(slNorm);
		setFuel(flNorm);
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
	}, [selectedDate]);

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

	const exportCSV = () => {
		const rows = [['Route', 'Pax', 'Status', 'Time', 'Amount'], ...bookings.map(b => [b.route, b.pax, b.status, b.time, b.amount])];
		const csv = rows.map(r => r.join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `report-${selectedDate}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	if (loading || !overview || !overview.depot || !overview.kpis) {
		return (
			<div className="depot-card">
				<div className="depot-skeleton heading" />
				<div className="depot-skeleton" />
			</div>
		);
	}

	const d = overview.depot || { name: '', address: '', phone: '', manager: '' };
	const k = overview.kpis || { revenueToday: 0, activeTrips: 0, idleBuses: 0, delays: 0, loadFactor: 0, onTime: 0 };

  return (
		<div className="depot-root">
			{/* Header */}
			<div className="depot-card depot-header">
				<div>
					<h1 className="depot-title">{d.name}</h1>
					<p className="depot-subtitle">{d.address} • {d.phone}</p>
					<p className="depot-subtitle">Manager: <span className="depot-strong">{d.manager || '—'}</span></p>
				</div>
				<div className="depot-actions">
					<button onClick={() => setShowSchedule(true)} className="btn btn-primary">Schedule Trip</button>
					<button onClick={() => setShowAssign(true)} className="btn btn-secondary">Assign Staff</button>
					<button onClick={() => setShowIncident(true)} className="btn btn-danger">Log Incident</button>
					<button onClick={logout} className="btn btn-outline">Logout</button>
				</div>
			</div>

			{/* KPI Cards */}
			<div className="depot-kpis">
				<div className="kpi-card">
					<div className="kpi-label">Revenue (Today)</div>
					<div className="kpi-value">{formatCurrency(k.revenueToday)}</div>
				</div>
				<div className="kpi-card">
					<div className="kpi-label">Active Trips</div>
					<div className="kpi-value">{k.activeTrips}</div>
				</div>
				<div className="kpi-card">
					<div className="kpi-label">Idle Buses</div>
					<div className="kpi-value">{k.idleBuses}</div>
				</div>
				<div className="kpi-card">
					<div className="kpi-label">Delays</div>
					<div className="kpi-value">{k.delays}</div>
				</div>
				<div className="kpi-card">
					<div className="kpi-label">Load Factor</div>
					<div className="kpi-value">{Math.round(k.loadFactor * 100)}%</div>
				</div>
				<div className="kpi-card">
					<div className="kpi-label">On‑Time</div>
					<div className="kpi-value">{Math.round(k.onTime * 100)}%</div>
				</div>
			</div>

			<div className="depot-main">
				{/* Center: Calendar + Map + History */}
				<div className="depot-center">
					<div className="depot-card depot-calendar">
						<label className="field-label">Select Date</label>
						<input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="field-input" />
						<div className="spacer" />
						<button className="btn btn-outline" onClick={exportCSV}>Download CSV</button>
					</div>
					<div className="depot-card depot-map-wrap">
						<MiniMap points={live} />
					</div>
					<div className="depot-card depot-history">
						<h3 className="section-title">Trips on {formatDate(selectedDate)}</h3>
						<div className="history-list">
							{trips.map(t => (
								<div key={t._id} className="history-item">
									<div className="history-route">{t.route}</div>
									<div className="history-meta">{formatTime(t.depart)} – {formatTime(t.arrive)} • {t.status}</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Right Panels */}
				<div className="depot-right">
					<div className="depot-card">
						<h3 className="section-title">Alerts</h3>
						<div className="alerts">
							{alerts.map(a => (
								<div key={a.id} className={`alert ${a.severity}`}>
									<div className="alert-msg">{a.message}</div>
									<div className="alert-time">{formatTime(a.at)}</div>
								</div>
							))}
						</div>
					</div>
					<div className="depot-card">
						<h3 className="section-title">Bus Status</h3>
						<div className="bus-list">
							{buses.map(b => (
								<div key={b._id} className="bus-item">
									<div className="bus-id">{b.number}</div>
									<div className={`bus-badge ${b.status}`}>{b.status}</div>
								</div>
							))}
						</div>
					</div>
					<div className="depot-card">
						<h3 className="section-title">Staff Roster</h3>
						<div className="roster">
							{[...staff.drivers.map(s => ({...s, role: 'Driver'})), ...staff.conductors.map(s => ({...s, role: 'Conductor'}))].map(s => (
								<div key={s._id} className="roster-item">
									<div className="avatar">{(s.name || '?').split(' ').map(x => x[0]).slice(0,2).join('')}</div>
									<div className="roster-info">
										<div className="roster-name">{s.name}</div>
										<div className="roster-meta">{s.role} • {s.status}</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Bottom Row */}
			<div className="depot-bottom">
				<div className="depot-card">
					<div className="card-header">
						<h3 className="section-title">Bookings</h3>
						<div className="filters">
							<input placeholder="Filter by route" className="field-input" value={filters.route} onChange={(e) => setFilters(v => ({ ...v, route: e.target.value }))} />
							<select className="field-input" value={filters.status} onChange={(e) => setFilters(v => ({ ...v, status: e.target.value }))}>
								<option value="">All</option>
								<option value="confirmed">Confirmed</option>
								<option value="refunded">Refunded</option>
							</select>
						</div>
					</div>
					<div className="table">
						<div className="thead">
							<div>Route</div>
							<div>Pax</div>
							<div>Status</div>
							<div>Time</div>
							<div>Amount</div>
						</div>
						<div className="tbody">
							{bookings.filter(b => (!filters.route || b.route.toLowerCase().includes(filters.route.toLowerCase())) && (!filters.status || b.status === filters.status)).map(b => (
								<div key={b.id} className="trow">
									<div>{b.route}</div>
									<div>{b.pax}</div>
									<div className={`pill ${b.status}`}>{b.status}</div>
									<div>{b.time}</div>
									<div>{formatCurrency(b.amount)}</div>
								</div>
							))}
						</div>
					</div>
				</div>

				<div className="depot-card">
					<h3 className="section-title">Sales & Refunds</h3>
					<div className="sales">
						<div className="sales-row">
							<div>Cash</div><div className="sales-value">{formatCurrency(sales.cash)}</div>
						</div>
						<div className="sales-row">
							<div>Online</div><div className="sales-value">{formatCurrency(sales.online)}</div>
						</div>
						<div className="sales-row">
							<div>Refunds</div><div className="sales-value refund">{formatCurrency(sales.refunds)}</div>
						</div>
						<div className="barchart">
							<div className="bar y" style={{ height: Math.max(20, Math.min(180, (sales.yesterday / Math.max(1, Math.max(sales.yesterday, sales.today))) * 180)) }} title={`Yesterday: ${formatCurrency(sales.yesterday)}`} />
							<div className="bar t" style={{ height: Math.max(20, Math.min(180, (sales.today / Math.max(1, Math.max(sales.yesterday, sales.today))) * 180)) }} title={`Today: ${formatCurrency(sales.today)}`} />
							<div className="legend"><span className="dot y" />Yesterday <span className="dot t" />Today</div>
						</div>
					</div>
				</div>

				<div className="depot-card">
					<h3 className="section-title">Fuel Management</h3>
					<div className="fuel">
						<div>Stock</div><div className="fuel-value">{fuel.stock} L</div>
						<div>Usage Today</div><div className="fuel-value">{fuel.usageToday} L</div>
						<div>Next Refuel</div><div className="fuel-value">{fuel.nextRefuel}</div>
						<div>Cost/Litre</div><div className="fuel-value">₹{fuel.costPerLitre}</div>
					</div>
				</div>

				<div className="depot-card">
					<h3 className="section-title">Setup & Configuration</h3>
					<div className="setup">
						<button className="btn btn-outline">Depot Setup</button>
						<button className="btn btn-outline">Vehicle Assignment</button>
						<button className="btn btn-outline">Staff Assignment</button>
						<button className="btn btn-outline">Maintenance Scheduling</button>
					</div>
				</div>
			</div>
    </div>
  );
};

export default DepotDashboard;
