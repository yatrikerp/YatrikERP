import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bus, Plus, Upload, Download, Search, Filter, 
  Edit, Eye, CheckCircle, XCircle, AlertTriangle,
  RefreshCw, X, Trash2, Type, Settings
} from 'lucide-react';
import EnhancedBusTypeManager from '../../components/Admin/EnhancedBusTypeManager.jsx';
import FarePolicyManager from '../../components/Admin/FarePolicyManager.jsx';
import { toast } from 'react-hot-toast';
import { apiFetch, clearApiCache } from '../../utils/api';

const StreamlinedBusManagement = () => {
  const [buses, setBuses] = useState([]);
  const [depots, setDepots] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [depotFilter, setDepotFilter] = useState('all');
  const [analytics, setAnalytics] = useState({ totalBuses: 0, activeBuses: 0, maintenanceBuses: 0, unassigned: 0 });
  
  // Form states
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [showSingleAddModal, setShowSingleAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedBusId, setSelectedBusId] = useState(null);
  const [selectedBusView, setSelectedBusView] = useState(null);
  
  // Bus Types Management
  const [showEnhancedBusTypeManager, setShowEnhancedBusTypeManager] = useState(false);
  
  // Fare Policy Management
  const [showFarePolicyManager, setShowFarePolicyManager] = useState(false);
  
  // Bulk operations
  const [selectedBuses, setSelectedBuses] = useState([]);
  const [bulkOperation, setBulkOperation] = useState('');
  
  // Form data
  const [busForm, setBusForm] = useState({
    busNumber: '',
    registrationNumber: '',
    depotId: '',
    busType: 'ac_sleeper',
    capacity: {
      total: 45,
      sleeper: 30,
      seater: 15,
      ladies: 5,
      disabled: 2
    },
    amenities: [],
    specifications: {
      manufacturer: '',
      model: '',
      year: new Date().getFullYear(),
      engine: '',
      fuelType: 'diesel',
      mileage: 8,
      maxSpeed: 80,
      length: 12,
      width: 2.5,
      height: 3.5
    },
    status: 'active',
    notes: ''
  });

  // Bulk add form
  const [bulkForm, setBulkForm] = useState({
    depotId: '',
    busType: 'ac_sleeper',
    count: 10,
    startNumber: 1,
    prefix: 'BUS',
    targetDate: new Date().toISOString().slice(0, 10), // Default to today
    specifications: {
      manufacturer: 'Ashok Leyland',
      model: 'Viking',
      year: new Date().getFullYear(),
      fuelType: 'diesel',
      mileage: 8,
      maxSpeed: 80
    }
  });

  // Assignment form (minimal)
  const [assignForm] = useState({
    driverId: '',
    conductorId: '',
    status: 'active',
    depotId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Clear API cache to ensure fresh data
      clearApiCache();
      
      // Fetch core datasets in parallel with multiple fallbacks where needed
      const [busesRes, depotsRes, driversRes, altDriversRes, analyticsRes] = await Promise.all([
        apiFetch(`/api/admin/buses?limit=500&page=1&_t=${Date.now()}`), // Added limit=500 and cache busting
        apiFetch('/api/admin/depots?showAll=true'),
        apiFetch('/api/admin/all-drivers', { suppressError: true }),
        apiFetch('/api/admin/drivers', { suppressError: true }),
        apiFetch('/api/admin/buses/analytics', { suppressError: true })
      ]);

      console.log('🚌 Buses API Response:', busesRes); // Debug log

      // Normalize lists
      const depotsListRaw = depotsRes.data?.data?.depots || depotsRes.data?.depots || depotsRes.depots || [];
      const depotsList = depotsListRaw.map(d => ({
        _id: d._id || d.id,
        depotName: d.depotName || d.name || d.code || 'Depot'
      }));

      let driversListRaw = driversRes?.data?.data?.drivers || driversRes?.data?.drivers || driversRes?.drivers || [];
      if (!Array.isArray(driversListRaw) || driversListRaw.length === 0) {
        const alt = altDriversRes?.data || {};
        driversListRaw = alt.drivers || alt.data?.drivers || alt.data || [];
      }
      const driversList = (driversListRaw || []).map(d => ({ _id: d._id || d.id, name: d.name || d.fullName || d.employeeName || 'Driver' }));

      const busesRaw = busesRes.data?.data?.buses || busesRes.data?.buses || busesRes.buses || [];
      console.log('🚌 Raw buses fetched:', busesRaw.length); // Debug log
      
      const normalizedBuses = (busesRaw || []).map(b => {
        const depotRef = b.depotId;
        const depotId = depotRef && typeof depotRef === 'object' ? depotRef._id : depotRef || null;
        const depotName = depotRef && typeof depotRef === 'object' ? (depotRef.depotName || depotRef.name || depotRef.code) : (depotsList.find(d => d._id === depotId)?.depotName);
        return {
          ...b,
          depotId,
          depotName,
          busType: b.busType || 'ac_seater',
          capacity: b.capacity || { total: 0 }
        };
      });

      console.log('🚌 Normalized buses:', normalizedBuses.length); // Debug log
      
      // Log depot distribution
      const depotCounts = {};
      normalizedBuses.forEach(bus => {
        const depotName = bus.depotName || 'Unknown';
        depotCounts[depotName] = (depotCounts[depotName] || 0) + 1;
      });
      console.log('🚌 Depot distribution:', depotCounts);

      // Filter depots to only show those that have buses
      const depotsWithBuses = depotsList.filter(depot => 
        normalizedBuses.some(bus => bus.depotId === depot._id)
      );
      console.log('🚌 Depots with buses:', depotsWithBuses.length);

      setDepots(depotsWithBuses); // Use filtered depots instead of all depots
      setDrivers(driversList);
      setBuses(normalizedBuses);

      // Analytics: prefer backend, else compute client-side
      const aData = analyticsRes?.data?.analytics || analyticsRes?.data?.data || null;
      if (aData && (aData.totalBuses || aData.activeBuses !== undefined)) {
        setAnalytics({
          totalBuses: aData.totalBuses,
          activeBuses: aData.activeBuses,
          maintenanceBuses: aData.maintenanceBuses,
          unassigned: normalizedBuses.filter(b => !b.assignedDriver).length
        });
      } else {
        setAnalytics({
          totalBuses: normalizedBuses.length,
          activeBuses: normalizedBuses.filter(b => b.status === 'active').length,
          maintenanceBuses: normalizedBuses.filter(b => b.status === 'maintenance').length,
          unassigned: normalizedBuses.filter(b => !b.assignedDriver).length
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data for Streamlined Buses');
    } finally {
      setLoading(false);
    }
  };

  const handleSingleBusAdd = async () => {
    try {
      if (!busForm.busNumber || !busForm.registrationNumber) {
        toast.error('Bus number and registration are required');
        return;
      }
      setLoading(true);
      const response = await apiFetch('/api/admin/buses', {
        method: 'POST',
        body: JSON.stringify({
          ...busForm,
          capacity: { ...busForm.capacity, total: Number(busForm.capacity.total) || 0 },
          specifications: { ...busForm.specifications, mileage: Number(busForm.specifications.mileage) || 0 }
        })
      });

      if (response?.ok || response?.success) {
        toast.success('Bus added successfully');
        setShowSingleAddModal(false);
        resetForm();
        fetchData();
      } else {
        toast.error(response?.message || 'Failed to add bus');
      }
    } catch (error) {
      console.error('Error adding bus:', error);
      toast.error('Failed to add bus');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBus = async () => {
    try {
      if (!selectedBusId) return;
      setLoading(true);
      const payload = {
        status: busForm.status,
        depotId: busForm.depotId || null,
        busType: busForm.busType,
        capacity: { ...busForm.capacity, total: Number(busForm.capacity.total) || 0 },
        specifications: { ...busForm.specifications, mileage: Number(busForm.specifications.mileage) || 0 }
      };
      const res = await apiFetch(`/api/admin/buses/${selectedBusId}`, { method: 'PUT', body: JSON.stringify(payload) });
      if (res?.ok || res?.success) {
        toast.success('Bus updated');
        setShowEditModal(false);
        setSelectedBusId(null);
        fetchData();
      } else {
        toast.error(res?.message || 'Failed to update bus');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to update bus');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBus = async () => {
    try {
      if (!selectedBusId) return;
      setLoading(true);
      const res = await apiFetch(`/api/admin/buses/${selectedBusId}`, { method: 'DELETE' });
      if (res?.ok || res?.success) {
        toast.success('Bus deleted');
        setShowDeleteModal(false);
        setSelectedBusId(null);
        fetchData();
      } else {
        toast.error(res?.message || 'Failed to delete bus');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete bus');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkBusAdd = async () => {
    try {
      setLoading(true);
      const busesToAdd = [];
      for (let i = 0; i < bulkForm.count; i++) {
        const busNumber = `${bulkForm.prefix}-${String(bulkForm.startNumber + i).padStart(3, '0')}`;
        const registrationNumber = `KL-${Math.floor(Math.random() * 100)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${Math.floor(Math.random() * 10000)}`;
        busesToAdd.push({
          ...bulkForm,
          busNumber,
          registrationNumber,
          capacity: getDefaultCapacity(bulkForm.busType)
        });
      }
      const batchSize = 10;
      for (let i = 0; i < busesToAdd.length; i += batchSize) {
        const batch = busesToAdd.slice(i, i + batchSize);
        await Promise.all(batch.map(bus => apiFetch('/api/admin/buses', { method: 'POST', body: JSON.stringify(bus), suppressError: true })));
      }
      toast.success(`${bulkForm.count} buses added successfully`);
      setShowBulkAddModal(false);
      resetBulkForm();
      fetchData();
    } catch (error) {
      console.error('Error adding bulk buses:', error);
      toast.error('Failed to add buses');
    } finally {
      setLoading(false);
    }
  };

  const resetBulkForm = () => {
    setBulkForm({
      depotId: '',
      busType: 'ac_sleeper',
      count: 10,
      startNumber: 1,
      prefix: 'BUS',
      specifications: {
        manufacturer: 'Ashok Leyland',
        model: 'Viking',
        year: new Date().getFullYear(),
        fuelType: 'diesel',
        mileage: 8,
        maxSpeed: 80
      }
    });
  };

  const handleExport = async () => {
    try {
      await apiFetch('/api/admin/buses/export/excel', { method: 'GET', suppressError: true });
      const rows = buses.map(b => ({
        busNumber: b.busNumber,
        registrationNumber: b.registrationNumber,
        status: b.status,
        depotId: b.depotId || '',
        capacityTotal: b.capacity?.total || 0,
        busType: b.busType || ''
      }));
      const header = Object.keys(rows[0] || { busNumber: '', registrationNumber: '', status: '', depotId: '', capacityTotal: '', busType: '' });
      const csv = [header.join(','), ...rows.map(r => header.map(h => String(r[h] ?? '').replace(/"/g, '""')).map(v => v.includes(',') ? `"${v}"` : v).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'streamlined-buses.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast.error('Export failed');
    }
  };

  const handleBulkOperation = async () => {
    if (selectedBuses.length === 0) {
      toast.error('Please select buses for bulk operation');
      return;
    }
    try {
      setLoading(true);
      switch (bulkOperation) {
        case 'assign_driver':
          await Promise.all(selectedBuses.map(busId => apiFetch(`/api/admin/buses/${busId}/assign`, { method: 'POST', body: JSON.stringify({ driverId: assignForm.driverId, conductorId: assignForm.conductorId }) }))); break;
        case 'change_status':
          await Promise.all(selectedBuses.map(busId => apiFetch(`/api/admin/buses/${busId}`, { method: 'PUT', body: JSON.stringify({ status: assignForm.status || 'active' }) }))); break;
        case 'assign_depot':
          await Promise.all(selectedBuses.map(busId => apiFetch(`/api/admin/buses/${busId}`, { method: 'PUT', body: JSON.stringify({ depotId: assignForm.depotId }) }))); break;
        case 'schedule_trips':
          await handleBulkScheduleTrips(); break;
        default:
          toast.error('Select a bulk operation');
      }
      toast.success('Bulk operation completed');
      setSelectedBuses([]);
      setBulkOperation('');
      fetchData();
    } catch (error) {
      console.error('Error in bulk operation:', error);
      toast.error('Bulk operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkScheduleTrips = async () => {
    if (!bulkForm.targetDate) {
      toast.error('Please select a target date for scheduling');
      return;
    }

    try {
      const response = await apiFetch('/api/auto-scheduler/mass-schedule', {
        method: 'POST',
        body: JSON.stringify({
          date: bulkForm.targetDate,
          depotIds: bulkForm.depotId ? [bulkForm.depotId] : [],
          maxTripsPerRoute: 5,
          timeGap: 30,
          autoAssignCrew: true,
          autoAssignBuses: true,
          generateReports: true,
          busIds: selectedBuses // Schedule trips specifically for selected buses
        })
      });

      if (response?.success || response?.ok) {
        const tripsCreated = response.data?.tripsCreated || response.tripsCreated || 0;
        const successRate = response.data?.successRate || response.successRate || '0%';
        toast.success(`Bulk scheduling completed! ${tripsCreated} trips created for selected buses (${successRate} success rate)`);
      } else {
        const errorMessage = response?.message || response?.error || 'Bulk scheduling failed';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error in bulk scheduling:', error);
      toast.error('Bulk scheduling failed');
    }
  };

  const getDefaultCapacity = (busType) => {
    const capacities = {
      'ac_sleeper': { total: 45, sleeper: 30, seater: 15, ladies: 5, disabled: 2 },
      'ac_seater': { total: 50, sleeper: 0, seater: 50, ladies: 8, disabled: 2 },
      'non_ac_sleeper': { total: 48, sleeper: 35, seater: 13, ladies: 5, disabled: 2 },
      'non_ac_seater': { total: 52, sleeper: 0, seater: 52, ladies: 8, disabled: 2 },
      'volvo': { total: 40, sleeper: 40, seater: 0, ladies: 4, disabled: 2 },
      'mini': { total: 20, sleeper: 0, seater: 20, ladies: 3, disabled: 1 }
    };
    return capacities[busType] || capacities['ac_sleeper'];
  };

  const resetForm = () => {
    setBusForm({
      busNumber: '',
      registrationNumber: '',
      depotId: '',
      busType: 'ac_sleeper',
      capacity: getDefaultCapacity('ac_sleeper'),
      amenities: [],
      specifications: {
        manufacturer: '',
        model: '',
        year: new Date().getFullYear(),
        engine: '',
        fuelType: 'diesel',
        mileage: 8,
        maxSpeed: 80,
        length: 12,
        width: 2.5,
        height: 3.5
      },
      status: 'active',
      notes: ''
    });
  };

  const openEdit = (bus) => {
    setSelectedBusId(bus._id);
    setBusForm({
      busNumber: bus.busNumber || '',
      registrationNumber: bus.registrationNumber || '',
      depotId: bus.depotId || '',
      busType: bus.busType || 'ac_sleeper',
      capacity: { total: bus.capacity?.total || 40, sleeper: bus.capacity?.sleeper || 0, seater: bus.capacity?.seater || (bus.capacity?.total || 40), ladies: bus.capacity?.ladies || 0, disabled: bus.capacity?.disabled || 0 },
      amenities: bus.amenities || [],
      specifications: { ...bus.specifications, mileage: bus.specifications?.mileage || 0 },
      status: bus.status || 'active',
      notes: bus.notes || ''
    });
    setShowEditModal(true);
  };

  const getDepotName = (bus) => {
    if (!bus) return 'Unassigned';
    if (bus.depotName) return bus.depotName;
    const depot = depots.find(d => d._id === bus.depotId);
    return depot?.depotName || 'Unassigned';
  };

  const BusCard = ({ bus }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={selectedBuses.includes(bus._id)}
            onChange={(e) => {
              if (e.target.checked) setSelectedBuses([...selectedBuses, bus._id]);
              else setSelectedBuses(selectedBuses.filter(id => id !== bus._id));
            }}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bus className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{bus.busNumber}</h3>
            <p className="text-sm text-gray-500">{bus.registrationNumber}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          bus.status === 'active' ? 'bg-green-100 text-green-800' :
          bus.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
          bus.status === 'retired' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {bus.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Type</p>
          <p className="font-medium text-gray-900">{(bus.busType || '').replace('_', ' ').toUpperCase()}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Capacity</p>
          <p className="font-medium text-gray-900">{bus.capacity?.total || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Depot</p>
          <p className="font-medium text-gray-900">{getDepotName(bus)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Driver</p>
          <p className="font-medium text-gray-900">{bus.assignedDriver ? (drivers.find(d => d._id === bus.assignedDriver)?.name || 'Unknown') : 'Unassigned'}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <button onClick={() => openEdit(bus)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Bus"><Edit className="w-4 h-4" /></button>
          <button onClick={() => { setSelectedBusId(bus._id); setShowDeleteModal(true); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Bus"><Trash2 className="w-4 h-4" /></button>
          <button onClick={() => { setSelectedBusView(bus); setShowViewModal(true); }} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="View Details"><Eye className="w-4 h-4" /></button>
        </div>
        <div className="text-xs text-gray-500">Updated {new Date(bus.updatedAt).toLocaleDateString()}</div>
      </div>
    </motion.div>
  );

  const BulkAddModal = () => (
    <AnimatePresence>
      {showBulkAddModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowBulkAddModal(false)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Bulk Add Buses</h3>
                <button onClick={() => setShowBulkAddModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* simplified fields kept */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Depot *</label>
                  <select value={bulkForm.depotId} onChange={(e) => setBulkForm(prev => ({ ...prev, depotId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Select Depot</option>
                    {depots.map(depot => (<option key={depot._id} value={depot._id}>{depot.depotName || depot.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bus Type *</label>
                  <select value={bulkForm.busType} onChange={(e) => setBulkForm(prev => ({ ...prev, busType: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="ac_sleeper">AC Sleeper</option>
                    <option value="ac_seater">AC Seater</option>
                    <option value="non_ac_sleeper">Non-AC Sleeper</option>
                    <option value="non_ac_seater">Non-AC Seater</option>
                    <option value="volvo">Volvo</option>
                    <option value="mini">Mini Bus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Buses *</label>
                  <input type="number" min="1" max="100" value={bulkForm.count} onChange={(e) => setBulkForm(prev => ({ ...prev, count: parseInt(e.target.value) }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Number</label>
                  <input type="number" min="1" value={bulkForm.startNumber} onChange={(e) => setBulkForm(prev => ({ ...prev, startNumber: parseInt(e.target.value) }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Date for Scheduling</label>
                  <input 
                    type="date" 
                    value={bulkForm.targetDate} 
                    onChange={(e) => setBulkForm(prev => ({ ...prev, targetDate: e.target.value }))} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Preview:</h4>
                <p className="text-blue-700 text-sm">Will create buses: {bulkForm.prefix}-{String(bulkForm.startNumber).padStart(3, '0')} to {bulkForm.prefix}-{String(bulkForm.startNumber + bulkForm.count - 1).padStart(3, '0')}</p>
              </div>
              <div className="flex items-center justify-end space-x-4">
                <button onClick={() => setShowBulkAddModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                <button onClick={handleBulkBusAdd} disabled={loading || !bulkForm.depotId} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2">{loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}<span>Add {bulkForm.count} Buses</span></button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const SingleAddModal = () => (
    <AnimatePresence>
      {showSingleAddModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowSingleAddModal(false)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between"><h3 className="text-xl font-semibold text-gray-900">Add Single Bus</h3><button onClick={() => setShowSingleAddModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button></div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm text-gray-600 mb-1">Bus Number</label><input value={busForm.busNumber} onChange={e => setBusForm({ ...busForm, busNumber: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="BUS-1001" /></div>
              <div><label className="block text-sm text-gray-600 mb-1">Registration Number</label><input value={busForm.registrationNumber} onChange={e => setBusForm({ ...busForm, registrationNumber: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="KL-01-AB-1234" /></div>
              <div><label className="block text-sm text-gray-600 mb-1">Depot</label><select value={busForm.depotId} onChange={e => setBusForm({ ...busForm, depotId: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="">Select depot</option>{depots.map(d => <option key={d._id} value={d._id}>{d.depotName || d.name}</option>)}</select></div>
              <div><label className="block text-sm text-gray-600 mb-1">Status</label><select value={busForm.status} onChange={e => setBusForm({ ...busForm, status: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="active">Active</option><option value="maintenance">Maintenance</option><option value="retired">Retired</option><option value="suspended">Suspended</option></select></div>
              <div><label className="block text-sm text-gray-600 mb-1">Bus Type</label><input value={busForm.busType} onChange={e => setBusForm({ ...busForm, busType: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="ac_sleeper" /></div>
              <div><label className="block text-sm text-gray-600 mb-1">Capacity Total</label><input type="number" value={busForm.capacity.total} onChange={e => setBusForm({ ...busForm, capacity: { ...busForm.capacity, total: e.target.value } })} className="w-full border rounded-lg px-3 py-2" /></div>
            </div>
            <div className="p-6 flex justify-end space-x-3"><button onClick={() => setShowSingleAddModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button><button onClick={handleSingleBusAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Bus</button></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const EditModal = () => (
    <AnimatePresence>
      {showEditModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowEditModal(false)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between"><h3 className="text-xl font-semibold text-gray-900">Edit Bus</h3><button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button></div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm text-gray-600 mb-1">Depot</label><select value={busForm.depotId} onChange={e => setBusForm({ ...busForm, depotId: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="">Select depot</option>{depots.map(d => <option key={d._id} value={d._id}>{d.depotName || d.name}</option>)}</select></div>
              <div><label className="block text-sm text-gray-600 mb-1">Status</label><select value={busForm.status} onChange={e => setBusForm({ ...busForm, status: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="active">Active</option><option value="maintenance">Maintenance</option><option value="retired">Retired</option><option value="suspended">Suspended</option></select></div>
              <div><label className="block text-sm text-gray-600 mb-1">Bus Type</label><input value={busForm.busType} onChange={e => setBusForm({ ...busForm, busType: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-sm text-gray-600 mb-1">Mileage (km/l)</label><input type="number" value={busForm.specifications.mileage} onChange={e => setBusForm({ ...busForm, specifications: { ...busForm.specifications, mileage: e.target.value } })} className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-sm text-gray-600 mb-1">Capacity Total</label><input type="number" value={busForm.capacity.total} onChange={e => setBusForm({ ...busForm, capacity: { ...busForm.capacity, total: e.target.value } })} className="w-full border rounded-lg px-3 py-2" /></div>
            </div>
            <div className="p-6 flex justify-end space-x-3"><button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button><button onClick={handleUpdateBus} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const DeleteConfirm = () => (
    <AnimatePresence>
      {showDeleteModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDeleteModal(false)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Bus</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this bus? This will retire the bus.</p>
              <div className="flex justify-end space-x-3">
                <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                <button onClick={handleDeleteBus} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const ViewModal = () => (
    <AnimatePresence>
      {showViewModal && selectedBusView && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowViewModal(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Bus Details - {selectedBusView.busNumber}</h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Registration</p>
                <p className="font-medium text-gray-900">{selectedBusView.registrationNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium text-gray-900 capitalize">{selectedBusView.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium text-gray-900">{(selectedBusView.busType || '').replace('_',' ').toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Depot</p>
                <p className="font-medium text-gray-900">{selectedBusView.depotId ? getDepotName(selectedBusView) : 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Capacity</p>
                <p className="font-medium text-gray-900">{selectedBusView.capacity?.total || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Mileage (km/l)</p>
                <p className="font-medium text-gray-900">{selectedBusView.specifications?.mileage || 0}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Notes</p>
                <p className="font-medium text-gray-900">{selectedBusView.notes || '—'}</p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end">
              <button onClick={() => setShowViewModal(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200">Close</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const filteredBuses = buses.filter(bus => {
    const matchesSearch = (bus.busNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (bus.registrationNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bus.status === statusFilter;
    const matchesDepot = depotFilter === 'all' || bus.depotId === depotFilter;
    return matchesSearch && matchesStatus && matchesDepot;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Streamlined Bus Management</h1>
          <p className="text-gray-600">Efficient bus fleet management with bulk operations</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => {
              clearApiCache();
              fetchData();
            }} 
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Force Refresh</span>
          </button>
          <button onClick={fetchData} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"><RefreshCw className="w-4 h-4" /><span>Refresh</span></button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Total Buses</p><p className="text-2xl font-bold text-gray-900">{analytics.totalBuses}</p></div><div className="p-3 bg-blue-100 rounded-lg"><Bus className="w-6 h-6 text-blue-600" /></div></div></div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Active Buses</p><p className="text-2xl font-bold text-green-600">{analytics.activeBuses}</p></div><div className="p-3 bg-green-100 rounded-lg"><CheckCircle className="w-6 h-6 text-green-600" /></div></div></div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Maintenance</p><p className="text-2xl font-bold text-yellow-600">{analytics.maintenanceBuses}</p></div><div className="p-3 bg-yellow-100 rounded-lg"><AlertTriangle className="w-6 h-6 text-yellow-600" /></div></div></div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Unassigned</p><p className="text-2xl font-bold text-red-600">{analytics.unassigned}</p></div><div className="p-3 bg-red-100 rounded-lg"><XCircle className="w-6 h-6 text-red-600" /></div></div></div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          {selectedBuses.length > 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">{selectedBuses.length} buses selected</span>
              <select value={bulkOperation} onChange={(e) => setBulkOperation(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Bulk Operation</option>
                <option value="assign_driver">Assign Crew</option>
                <option value="change_status">Change Status</option>
                <option value="assign_depot">Assign Depot</option>
                <option value="schedule_trips">Schedule Trips</option>
              </select>
              <button onClick={handleBulkOperation} disabled={!bulkOperation} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">Execute</button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <button onClick={() => setShowSingleAddModal(true)} className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center space-x-3"><div className="p-2 bg-blue-100 rounded-lg"><Plus className="w-5 h-5 text-blue-600" /></div><div className="text-left"><h4 className="font-semibold text-blue-900">Add Single Bus</h4><p className="text-sm text-blue-700">Add one bus with detailed specifications</p></div></button>
          <button onClick={() => setShowBulkAddModal(true)} className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors flex items-center space-x-3"><div className="p-2 bg-green-100 rounded-lg"><Upload className="w-5 h-5 text-green-600" /></div><div className="text-left"><h4 className="font-semibold text-green-900">Bulk Add Buses</h4><p className="text-sm text-green-700">Add multiple buses at once (up to 100)</p></div></button>
          <button onClick={handleExport} className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors flex items-center space-x-3"><div className="p-2 bg-purple-100 rounded-lg"><Download className="w-5 h-5 text-purple-600" /></div><div className="text-left"><h4 className="font-semibold text-purple-900">Export Data</h4><p className="text-sm text-purple-700">Export bus data for external use</p></div></button>
          
          {/* Bus Types Button - NEW */}
          <button 
            onClick={() => {
              console.log('🚌 Bus Types button clicked!');
              setShowEnhancedBusTypeManager(true);
            }} 
            className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg hover:from-indigo-100 hover:to-purple-100 transition-all duration-200 border-2 border-indigo-200 hover:border-indigo-300 shadow-sm hover:shadow-lg flex items-center space-x-3 relative"
          >
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              NEW
            </div>
            <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg"><Type className="w-5 h-5 text-indigo-600" /></div>
            <div className="text-left">
              <h4 className="font-semibold text-indigo-900">Bus Types</h4>
              <p className="text-sm text-indigo-700">Manage KSRTC bus types</p>
            </div>
          </button>
          
          {/* Fare Policy Button - NEW */}
          <button 
            onClick={() => {
              console.log('💰 Fare Policy button clicked!');
              setShowFarePolicyManager(true);
            }} 
            className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg hover:from-green-100 hover:to-emerald-100 transition-all duration-200 border-2 border-green-200 hover:border-green-300 shadow-sm hover:shadow-lg flex items-center space-x-3 relative"
          >
            <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              NEW
            </div>
            <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg"><Settings className="w-5 h-5 text-green-600" /></div>
            <div className="text-left">
              <h4 className="font-semibold text-green-900">Fare Policy</h4>
              <p className="text-sm text-green-700">Set pricing rules & rates</p>
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
              <input type="text" placeholder="Search buses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Depot</label>
            <select value={depotFilter} onChange={(e) => setDepotFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="all">All Depots</option>
              {depots.map(depot => (<option key={depot._id} value={depot._id}>{depot.depotName || depot.name}</option>))}
            </select>
          </div>
          <div className="flex items-end space-x-2">
            <button onClick={() => { setSearchTerm(''); setStatusFilter('all'); setDepotFilter('all'); }} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Clear Filters</span>
            </button>
            <button 
              onClick={() => { 
                setSearchTerm(''); 
                setStatusFilter('all'); 
                setDepotFilter('all'); 
                clearApiCache();
                fetchData();
              }} 
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              disabled={loading}
            >
              <Bus className="w-4 h-4" />
              <span>Show All Buses</span>
            </button>
          </div>
        </div>
      </div>

      {/* Depot Distribution Summary */}
      {filteredBuses.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Depot Distribution Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {(() => {
              const depotCounts = {};
              filteredBuses.forEach(bus => {
                const depotName = bus.depotName || 'Unknown';
                depotCounts[depotName] = (depotCounts[depotName] || 0) + 1;
              });
              return Object.entries(depotCounts).map(([depot, count]) => (
                <div key={depot} className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-sm font-medium text-gray-600">{depot}</p>
                  <p className="text-lg font-bold text-gray-900">{count}</p>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Bus Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredBuses.map(bus => (<BusCard key={bus._id} bus={bus} />))}
      </div>

      {filteredBuses.length === 0 && (
        <div className="text-center py-12">
          <Bus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No buses found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search or add some buses.</p>
          {depotFilter !== 'all' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-yellow-800 text-sm">
                <strong>Tip:</strong> The selected depot "{depots.find(d => d._id === depotFilter)?.depotName || 'Unknown'}" might not have any buses assigned to it.
              </p>
              <button 
                onClick={() => { setDepotFilter('all'); clearApiCache(); fetchData(); }} 
                className="mt-2 px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
              >
                Show All Depots
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <BulkAddModal />
      <SingleAddModal />
      <EditModal />
      <DeleteConfirm />
      <ViewModal />
      
      {/* Enhanced Bus Type Manager Modal */}
      <EnhancedBusTypeManager 
        isOpen={showEnhancedBusTypeManager}
        onClose={() => setShowEnhancedBusTypeManager(false)}
        onSave={(busTypes) => {
          console.log('Enhanced bus types saved:', busTypes);
          setShowEnhancedBusTypeManager(false);
          toast.success('Bus types updated successfully!');
        }}
        onScheduleUpdate={(activeTypes) => {
          console.log('Scheduling updated with active bus types:', activeTypes);
          toast.success('Bus type scheduling rules updated successfully');
        }}
      />
      
      {/* Fare Policy Manager Modal */}
      <FarePolicyManager 
        isOpen={showFarePolicyManager}
        onClose={() => setShowFarePolicyManager(false)}
        onSave={(farePolicies) => {
          console.log('Fare policies saved:', farePolicies);
          setShowFarePolicyManager(false);
          toast.success('Fare policies updated successfully!');
        }}
      />
    </div>
  );
};

export default StreamlinedBusManagement;


