import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Plus, Upload, Download, Search, Filter, 
  Edit, Trash2, Eye, CheckCircle,
  RefreshCw, Users, Clock,
  X, DollarSign, Bus, Play, Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../../utils/api';

const StreamlinedTripManagement = () => {
  const [trips, setTrips] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [conductors, setConductors] = useState([]);
  const [depots, setDepots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const location = useLocation();

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(24);
  const [total, setTotal] = useState(0);
  const [routeFilter, setRouteFilter] = useState('all');
  
  // Form states
  const [showSingleAddModal, setShowSingleAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAutoSchedulerModal, setShowAutoSchedulerModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  
  // Bulk operations
  const [selectedTrips, setSelectedTrips] = useState([]);
  
  // Trip form data
  const [tripForm, setTripForm] = useState({
    routeId: '',
    busId: '',
    driverId: '',
    conductorId: '',
    serviceDate: '',
    startTime: '',
    endTime: '',
    fare: 0,
    capacity: 0,
    status: 'scheduled',
    depotId: '',
    notes: '',
    bookingOpen: true,
    bookingCloseTime: '',
    cancellationPolicy: {
      hoursBeforeDeparture: 2,
      refundPercentage: 80
    }
  });

  // Auto scheduler form
  const [schedulerForm, setSchedulerForm] = useState({
    targetDate: '',
    depotIds: [],
    maxTripsPerRoute: 5,
    timeGap: 30, // minutes between trips
    autoAssignCrew: true,
    autoAssignBuses: true,
    optimizeForDemand: true,
    generateReports: true
  });

  useEffect(() => {
    fetchData();
  }, [page, limit, searchTerm, statusFilter, dateFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (searchTerm) params.set('search', searchTerm.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (dateFilter) {
        params.set('serviceDate', dateFilter);
        params.set('date', dateFilter); // backend compatibility
      }

      // Try with params first
      let tripsRes = await apiFetch('/api/admin/trips?' + params.toString(), { suppressError: true });
      let payload = tripsRes?.data?.data || tripsRes?.data || {};
      let tripsRaw = payload.trips || payload.data || (Array.isArray(payload) ? payload : []);

      // Fallback: plain endpoint (some servers don't support pagination/filters)
      if (!Array.isArray(tripsRaw) || tripsRaw.length === 0 || tripsRes?.ok === false) {
        const plain = await apiFetch('/api/admin/trips', { suppressError: true });
        const fallbackPayload = plain?.data?.data || plain?.data || {};
        const fallbackRaw = fallbackPayload.trips || fallbackPayload.data || (Array.isArray(fallbackPayload) ? fallbackPayload : []);
        if (Array.isArray(fallbackRaw) && fallbackRaw.length) {
          tripsRaw = fallbackRaw;
          payload = fallbackPayload;
        }
      }

      // Normalize trips
      const normalizedTrips = (tripsRaw || []).map(t => ({
        ...t,
        serviceDate: t.serviceDate ? t.serviceDate.split('T')[0] : '',
        fare: Number(t.fare) || 0,
        capacity: Number(t.capacity) || 0
      }));
      setTrips(normalizedTrips);
      const pagination = payload.pagination || payload.meta || {};
      setTotal(pagination.total || normalizedTrips.length);

      // Fetch lookups in parallel
      const [routesRes, busesRes, driversRes, conductorsRes, depotsRes] = await Promise.all([
        apiFetch('/api/admin/routes', { suppressError: true }),
        apiFetch('/api/admin/buses', { suppressError: true }),
        apiFetch('/api/admin/all-drivers', { suppressError: true }),
        apiFetch('/api/admin/conductors', { suppressError: true }),
        apiFetch('/api/admin/depots?showAll=true', { suppressError: true })
      ]);

      // Normalize routes
      const routesRaw = routesRes?.data?.data?.routes || routesRes?.data?.routes || routesRes?.routes || [];
      const normalizedRoutes = routesRaw.map(r => ({
        ...r,
        routeNumber: r.routeNumber || r.code || '',
        routeName: r.routeName || r.name || ''
      }));

      // Normalize buses
      const busesRaw = busesRes?.data?.data?.buses || busesRes?.data?.buses || busesRes?.buses || [];
      const normalizedBuses = busesRaw.map(b => ({
        ...b,
        busNumber: b.busNumber || 'N/A',
        capacity: b.capacity || { total: 0 }
      }));

      // Normalize drivers
      const driversRaw = driversRes?.data?.data?.drivers || driversRes?.data?.drivers || driversRes?.drivers || [];
      const normalizedDrivers = driversRaw.map(d => ({
        _id: d._id || d.id,
        name: d.name || d.fullName || d.employeeName || 'Driver',
        status: d.status || 'active'
      }));

      // Normalize conductors
      const conductorsRaw = conductorsRes?.data?.data?.conductors || conductorsRes?.data?.conductors || conductorsRes?.conductors || [];
      const normalizedConductors = conductorsRaw.map(c => ({
        _id: c._id || c.id,
        name: c.name || c.fullName || c.employeeName || 'Conductor',
        status: c.status || 'active'
      }));

      // Normalize depots
      const depotsRaw = depotsRes?.data?.data?.depots || depotsRes?.data?.depots || depotsRes?.depots || [];
      const normalizedDepots = depotsRaw.map(d => ({
        _id: d._id || d.id,
        depotName: d.depotName || d.name || 'Depot'
      }));

      setRoutes(normalizedRoutes);
      setBuses(normalizedBuses);
      setDrivers(normalizedDrivers);
      setConductors(normalizedConductors);
      setDepots(normalizedDepots);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch trip management data');
    } finally {
      setLoading(false);
    }
  };

  const handleSingleTripAdd = async () => {
    try {
      if (!tripForm.routeId || !tripForm.serviceDate || !tripForm.startTime) {
        toast.error('Route, date, and start time are required');
        return;
      }
      setLoading(true);
      const payload = {
        ...tripForm,
        fare: Number(tripForm.fare) || 0,
        capacity: Number(tripForm.capacity) || 0
      };
      const response = await apiFetch('/api/admin/trips', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response?.ok || response?.success) {
        toast.success('Trip added successfully');
        setShowSingleAddModal(false);
        resetForm();
        fetchData();
      } else {
        toast.error(response?.message || 'Failed to add trip');
      }
    } catch (error) {
      console.error('Error adding trip:', error);
      toast.error('Failed to add trip');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTrip = async () => {
    try {
      if (!selectedTrip?._id) return;
      setLoading(true);

      const isValidObjectId = (v) => typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(v);
      const clean = { ...tripForm };

      // Normalize optional ObjectId fields
      clean.busId = isValidObjectId(clean.busId) ? clean.busId : undefined;
      clean.driverId = isValidObjectId(clean.driverId) ? clean.driverId : undefined;
      clean.conductorId = isValidObjectId(clean.conductorId) ? clean.conductorId : undefined;
      clean.routeId = isValidObjectId(clean.routeId) ? clean.routeId : undefined;

      // Keep serviceDate as YYYY-MM-DD string (backend parses)
      if (typeof clean.serviceDate === 'string') {
        const m = clean.serviceDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        clean.serviceDate = m ? clean.serviceDate : undefined;
      }

      // Coerce time formats HH:MM (strip seconds)
      const toHm = (t) => (typeof t === 'string' && t.length >= 5 ? t.slice(0, 5) : undefined);
      clean.startTime = toHm(clean.startTime);
      clean.endTime = toHm(clean.endTime);

      // Numeric fields
      if (clean.fare !== undefined) clean.fare = Number(clean.fare);
      if (clean.capacity !== undefined) clean.capacity = Number(clean.capacity);

      // Remove empty strings and undefined keys
      const payload = Object.entries(clean).reduce((acc, [k, v]) => {
        if (v !== undefined && v !== '') acc[k] = v;
        return acc;
      }, {});

      const res = await apiFetch(`/api/admin/trips/${selectedTrip._id}`, { method: 'PUT', body: JSON.stringify(payload) });
      if (res?.ok || res?.success) {
        toast.success('Trip updated');
        setShowEditModal(false);
        setSelectedTrip(null);
        fetchData();
      } else {
        toast.error(res?.message || 'Failed to update trip');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to update trip');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId) => {
    try {
      if (!window.confirm('Are you sure you want to delete this trip?')) return;
      setLoading(true);
      const res = await apiFetch(`/api/admin/trips/${tripId}`, { method: 'DELETE' });
      if (res?.ok || res?.success) {
        toast.success('Trip deleted');
      fetchData();
      } else {
        toast.error(res?.message || 'Failed to delete trip');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete trip');
    } finally {
      setLoading(false);
    }
  };

  const handleExportTrips = async () => {
    try {
      const rows = filteredTrips.map(t => {
        const route = routes.find(r => r._id === t.routeId);
        const bus = buses.find(b => b._id === t.busId);
        const driver = drivers.find(d => d._id === t.driverId);
        const conductor = conductors.find(c => c._id === t.conductorId);
        return {
          tripId: t._id,
          routeNumber: route?.routeNumber || '',
          routeName: route?.routeName || '',
          busNumber: bus?.busNumber || '',
          driverName: driver?.name || '',
          conductorName: conductor?.name || '',
          serviceDate: t.serviceDate,
          startTime: t.startTime,
          endTime: t.endTime,
          fare: t.fare,
          capacity: t.capacity,
          status: t.status
        };
      });
      const header = Object.keys(rows[0] || { tripId: '', routeNumber: '', routeName: '', busNumber: '', driverName: '', conductorName: '', serviceDate: '', startTime: '', endTime: '', fare: '', capacity: '', status: '' });
      const csv = [header.join(','), ...rows.map(r => header.map(h => String(r[h] ?? '').replace(/"/g, '""')).map(v => v.includes(',') ? `"${v}"` : v).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'trips.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Trips exported to CSV');
    } catch (e) {
      console.error(e);
      toast.error('Export failed');
    }
  };

  // Removed bulk trip add function - simplified for core CRUD focus

  const handleAutoScheduling = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/auto-scheduler/mass-schedule', {
        method: 'POST',
        body: JSON.stringify({
          ...schedulerForm,
          date: schedulerForm.targetDate
        })
      });

      if (response.success) {
        toast.success(`Auto-scheduling completed: ${response.data.tripsCreated} trips created`);
        setShowAutoSchedulerModal(false);
        resetSchedulerForm();
        fetchData();
      }
    } catch (error) {
      console.error('Error in auto scheduling:', error);
      toast.error('Auto scheduling failed');
    } finally {
      setLoading(false);
    }
  };

  // Removed batch operation function - simplified for core CRUD focus

  // Helper functions
  const calculateEndTime = (startTime, durationMinutes) => {
    if (!startTime || !durationMinutes) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  const resetForm = () => {
    setTripForm({
      routeId: '',
      busId: '',
      driverId: '',
      conductorId: '',
      serviceDate: '',
      startTime: '',
      endTime: '',
      fare: 0,
      capacity: 0,
      status: 'scheduled',
      depotId: '',
      notes: '',
      bookingOpen: true,
      bookingCloseTime: '',
      cancellationPolicy: {
        hoursBeforeDeparture: 2,
        refundPercentage: 80
      }
    });
  };

  // Removed resetBulkForm - not needed for simplified CRUD

  const resetSchedulerForm = () => {
    setSchedulerForm({
      targetDate: '',
      depotIds: [],
      maxTripsPerRoute: 5,
      timeGap: 30,
      autoAssignCrew: true,
      autoAssignBuses: true,
      optimizeForDemand: true,
      generateReports: true
    });
  };

  const openEditModal = (trip) => {
    setSelectedTrip(trip);
    setTripForm({
      ...trip,
      serviceDate: trip.serviceDate ? trip.serviceDate.split('T')[0] : '',
      bookingCloseTime: trip.bookingCloseTime ? trip.bookingCloseTime.split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.routeId ? 
      (routes.find(r => r._id === trip.routeId)?.routeNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (routes.find(r => r._id === trip.routeId)?.routeName || '').toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
    const matchesDate = !dateFilter || trip.serviceDate === dateFilter;
    const matchesRoute = routeFilter === 'all' || trip.routeId === routeFilter;
    
    return matchesSearch && matchesStatus && matchesDate && matchesRoute;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'boarding': return 'bg-yellow-100 text-yellow-800';
      case 'running': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'delayed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const TripCard = ({ trip }) => {
    // Helpers to resolve id or object
    const resolveId = (val) => (val && typeof val === 'object' ? (val._id || val.id) : val);
    const findById = (list, id) => list.find((x) => resolveId(x._id || x.id) === resolveId(id));

    const routeObj = (trip.routeId && typeof trip.routeId === 'object')
      ? trip.routeId
      : findById(routes, trip.routeId);

    const busObj = (trip.busId && typeof trip.busId === 'object')
      ? trip.busId
      : findById(buses, trip.busId);

    const driverObj = (trip.driverId && typeof trip.driverId === 'object')
      ? trip.driverId
      : findById(drivers, trip.driverId);

    const conductorObj = (trip.conductorId && typeof trip.conductorId === 'object')
      ? trip.conductorId
      : findById(conductors, trip.conductorId);

    // Resolve depot: prefer trip.depotId, else route.depotId
    let depotObj = null;
    if (trip.depotId) {
      depotObj = (typeof trip.depotId === 'object') ? trip.depotId : findById(depots, trip.depotId);
    }
    if (!depotObj && routeObj) {
      const routeDepotId = routeObj.depotId || routeObj.depot;
      if (routeDepotId) {
        depotObj = (typeof routeDepotId === 'object') ? routeDepotId : findById(depots, routeDepotId);
      }
    }

    const routeNumber = trip.routeNumber || routeObj?.routeNumber || routeObj?.code || 'N/A';
    const routeName = trip.routeName || routeObj?.routeName || routeObj?.name || 'Unknown Route';

    const busLabel = busObj?.busNumber || 'Unassigned';
    const driverLabel = driverObj?.name || 'No Driver';
    const conductorLabel = conductorObj?.name || 'No Conductor';
    const depotLabel = depotObj?.depotName || depotObj?.name || '';
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between mb-1">
          {depotLabel ? (
            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">{depotLabel}</span>
          ) : <span />}
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedTrips.includes(trip._id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedTrips([...selectedTrips, trip._id]);
                } else {
                  setSelectedTrips(selectedTrips.filter(id => id !== trip._id));
                }
              }}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{routeNumber}</h3>
              <p className="text-sm text-gray-500">{routeName}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
            {trip.status}
          </span>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{trip.startTime} - {trip.endTime}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{new Date(trip.serviceDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Bus className="w-4 h-4" />
            <span>{busLabel} • {trip.capacity} seats</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{driverLabel} • {conductorLabel}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <DollarSign className="w-4 h-4" />
            <span>₹{trip.fare} • {trip.bookedSeats || 0}/{trip.capacity} booked</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex space-x-2">
            <button
              onClick={() => openEditModal(trip)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Trip"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteTrip(trip._id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Trip"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {/* View details */}}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-gray-500">
            {trip.bookingOpen ? 'Booking Open' : 'Booking Closed'}
          </div>
        </div>
      </motion.div>
    );
  };

  const AutoSchedulerModal = () => (
    <AnimatePresence>
      {showAutoSchedulerModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowAutoSchedulerModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  <span>AI-Powered Auto Scheduler</span>
                </h3>
                <button
                  onClick={() => setShowAutoSchedulerModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-2">🚀 Intelligent Scheduling</h4>
                <p className="text-purple-700 text-sm">
                  This will automatically schedule trips for all buses, assign optimal routes, 
                  and allocate drivers/conductors based on demand patterns and efficiency algorithms.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Date *
                  </label>
                  <input
                    type="date"
                    value={schedulerForm.targetDate}
                    onChange={(e) => setSchedulerForm(prev => ({ ...prev, targetDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Trips per Route
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={schedulerForm.maxTripsPerRoute}
                    onChange={(e) => setSchedulerForm(prev => ({ ...prev, maxTripsPerRoute: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Gap (minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="120"
                    value={schedulerForm.timeGap}
                    onChange={(e) => setSchedulerForm(prev => ({ ...prev, timeGap: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Depots
                  </label>
                  <select
                    multiple
                    value={schedulerForm.depotIds}
                    onChange={(e) => setSchedulerForm(prev => ({ 
                      ...prev, 
                      depotIds: Array.from(e.target.selectedOptions, option => option.value)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {depots.map(depot => (
                      <option key={depot._id} value={depot._id}>{depot.depotName}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={schedulerForm.autoAssignCrew}
                    onChange={(e) => setSchedulerForm(prev => ({ ...prev, autoAssignCrew: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Auto-assign drivers and conductors</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={schedulerForm.autoAssignBuses}
                    onChange={(e) => setSchedulerForm(prev => ({ ...prev, autoAssignBuses: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Auto-assign buses to routes</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={schedulerForm.optimizeForDemand}
                    onChange={(e) => setSchedulerForm(prev => ({ ...prev, optimizeForDemand: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Optimize based on historical demand</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={schedulerForm.generateReports}
                    onChange={(e) => setSchedulerForm(prev => ({ ...prev, generateReports: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Generate scheduling reports</span>
                </label>
              </div>
              
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => setShowAutoSchedulerModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAutoScheduling}
                  disabled={loading || !schedulerForm.targetDate}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Start Auto Scheduling</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Streamlined Trip Management</h1>
          <p className="text-gray-600">Intelligent trip scheduling with AI-powered automation</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Trips</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Scheduled</p>
              <p className="text-2xl font-bold text-blue-600">{trips.filter(t => t.status === 'scheduled').length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Running</p>
              <p className="text-2xl font-bold text-green-600">{trips.filter(t => t.status === 'running').length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Play className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-600">{trips.filter(t => t.status === 'completed').length}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          {selectedTrips.length > 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">{selectedTrips.length} trips selected</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => setShowSingleAddModal(true)}
            className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center space-x-3"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-blue-900">Add Single Trip</h4>
              <p className="text-sm text-blue-700">Add one trip with specific details</p>
            </div>
          </button>
          
          <button
            onClick={() => toast('Bulk add trips feature - use AI Auto Scheduler instead')}
            className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors flex items-center space-x-3"
          >
            <div className="p-2 bg-green-100 rounded-lg">
              <Upload className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-green-900">Bulk Add Trips</h4>
              <p className="text-sm text-green-700">Use AI Auto Scheduler for bulk operations</p>
            </div>
          </button>
          
          <button
            onClick={() => setShowAutoSchedulerModal(true)}
            className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors flex items-center space-x-3"
          >
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-purple-900">AI Auto Scheduler</h4>
              <p className="text-sm text-purple-700">Intelligent mass scheduling</p>
            </div>
          </button>
          
          <button
            onClick={handleExportTrips}
            className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors flex items-center space-x-3"
          >
            <div className="p-2 bg-orange-100 rounded-lg">
              <Download className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-orange-900">Export Trips</h4>
              <p className="text-sm text-orange-700">Export trip data for analysis</p>
            </div>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search trips..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="boarding">Boarding</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('');
                setRouteFilter('all');
                setPage(1);
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-600">{total} total · Page {page}</div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 border rounded disabled:opacity-50">Prev</button>
          <select value={limit} onChange={(e) => { setPage(1); setLimit(parseInt(e.target.value) || 24); }} className="px-2 py-1 border rounded">
            {[12,24,48,96].map(n => <option key={n} value={n}>{n}/page</option>)}
          </select>
          <button onClick={() => setPage(p => p + 1)} disabled={trips.length < limit && page * limit >= total} className="px-2 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      </div>

      {/* Trip Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrips.map(trip => (
          <TripCard key={trip._id} trip={trip} />
        ))}
      </div>

      {filteredTrips.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No trips found</h3>
          <p className="text-gray-600">Try adjusting your search or create some trips.</p>
        </div>
      )}

      {/* Modals */}
      <AutoSchedulerModal />
      
      {/* Single Add Trip Modal */}
      {showSingleAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Add Single Trip</h3>
              <button onClick={() => setShowSingleAddModal(false)} className="p-1 text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Route *</label>
                <select value={tripForm.routeId} onChange={e => setTripForm({ ...tripForm, routeId: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                  <option value="">Select route</option>
                  {routes.map(r => <option key={r._id} value={r._id}>{r.routeNumber} - {r.routeName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Bus</label>
                <select value={tripForm.busId} onChange={e => setTripForm({ ...tripForm, busId: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                  <option value="">Select bus</option>
                  {buses.map(b => <option key={b._id} value={b._id}>{b.busNumber} ({b.capacity?.total || 0} seats)</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Driver</label>
                <select value={tripForm.driverId} onChange={e => setTripForm({ ...tripForm, driverId: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                  <option value="">Select driver</option>
                  {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Conductor</label>
                <select value={tripForm.conductorId} onChange={e => setTripForm({ ...tripForm, conductorId: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                  <option value="">Select conductor</option>
                  {conductors.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Service Date *</label>
                <input type="date" value={tripForm.serviceDate} onChange={e => setTripForm({ ...tripForm, serviceDate: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Start Time *</label>
                <input type="time" value={tripForm.startTime} onChange={e => setTripForm({ ...tripForm, startTime: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">End Time</label>
                <input type="time" value={tripForm.endTime} onChange={e => setTripForm({ ...tripForm, endTime: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Fare (₹)</label>
                <input type="number" value={tripForm.fare} onChange={e => setTripForm({ ...tripForm, fare: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Capacity</label>
                <input type="number" value={tripForm.capacity} onChange={e => setTripForm({ ...tripForm, capacity: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Status</label>
                <select value={tripForm.status} onChange={e => setTripForm({ ...tripForm, status: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                  <option value="scheduled">Scheduled</option>
                  <option value="boarding">Boarding</option>
                  <option value="running">Running</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setShowSingleAddModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={handleSingleTripAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Trip</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Trip Modal */}
      {showEditModal && selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Edit Trip</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Route *</label>
                <select value={tripForm.routeId} onChange={e => setTripForm({ ...tripForm, routeId: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                  <option value="">Select route</option>
                  {routes.map(r => <option key={r._id} value={r._id}>{r.routeNumber} - {r.routeName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Bus</label>
                <select value={tripForm.busId} onChange={e => setTripForm({ ...tripForm, busId: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                  <option value="">Select bus</option>
                  {buses.map(b => <option key={b._id} value={b._id}>{b.busNumber} ({b.capacity?.total || 0} seats)</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Driver</label>
                <select value={tripForm.driverId} onChange={e => setTripForm({ ...tripForm, driverId: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                  <option value="">Select driver</option>
                  {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Conductor</label>
                <select value={tripForm.conductorId} onChange={e => setTripForm({ ...tripForm, conductorId: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                  <option value="">Select conductor</option>
                  {conductors.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Service Date *</label>
                <input type="date" value={tripForm.serviceDate} onChange={e => setTripForm({ ...tripForm, serviceDate: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Start Time *</label>
                <input type="time" value={tripForm.startTime} onChange={e => setTripForm({ ...tripForm, startTime: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">End Time</label>
                <input type="time" value={tripForm.endTime} onChange={e => setTripForm({ ...tripForm, endTime: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Fare (₹)</label>
                <input type="number" value={tripForm.fare} onChange={e => setTripForm({ ...tripForm, fare: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Status</label>
                <select value={tripForm.status} onChange={e => setTripForm({ ...tripForm, status: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                  <option value="scheduled">Scheduled</option>
                  <option value="boarding">Boarding</option>
                  <option value="running">Running</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={handleUpdateTrip} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreamlinedTripManagement;

