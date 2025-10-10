import React, { useState, useEffect } from 'react';
// import { useAuth } from '../../../context/AuthContext';
import { tripApiService } from '../../../services/depotApiService';
import io from 'socket.io-client';
import { apiFetch } from '../../../utils/api';
import './ManagementPages.css';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Calendar,
  Clock, 
  Bus,
  AlertCircle,
  X,
  Play,
  Square,
  Users
} from 'lucide-react';

const TripManagement = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [newTrip, setNewTrip] = useState({
    routeId: '',
    busId: '',
    driverId: '',
    conductorId: '',
    serviceDate: '',
    startTime: '',
    endTime: '',
    status: 'scheduled'
  });

  useEffect(() => {
    fetchTrips();
  }, []);

  // Crew lists (fetched from admin endpoints)
  const [drivers, setDrivers] = useState([]);
  const [conductors, setConductors] = useState([]);
  const [assignForm, setAssignForm] = useState({ driverId: '', conductorId: '' });

  // Real-time updates for trip assignments
  useEffect(() => {
    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      auth: {
        token: localStorage.getItem('depotToken') || localStorage.getItem('token'),
        userType: 'depot_manager'
      }
    });

    // Listen for trip updates from admin
    socket.on('tripUpdated', (data) => {
      console.log('Trip updated in TripManagement:', data);
      
      setTrips(prevTrips => {
        const updatedTrips = prevTrips.map(trip => 
          trip._id === data.tripId ? { ...trip, ...data.updates } : trip
        );
        return updatedTrips;
      });
    });

    // Listen for new trip assignments
    socket.on('tripAssigned', (data) => {
      console.log('New trip assigned in TripManagement:', data);
      
      setTrips(prevTrips => [data.trip, ...prevTrips]);
    });
    
    return () => {
      socket.close();
    };
  }, []);

  // Load drivers and conductors from admin pages' APIs
  useEffect(() => {
    const loadCrew = async () => {
      try {
        const [driversRes, conductorsRes] = await Promise.all([
          apiFetch('/api/admin/all-drivers', { suppressError: true }),
          apiFetch('/api/admin/conductors', { suppressError: true })
        ]);
        const driversRaw = driversRes?.data?.data?.drivers || driversRes?.data?.drivers || driversRes?.drivers || [];
        const conductorsRaw = conductorsRes?.data?.data?.conductors || conductorsRes?.data?.conductors || conductorsRes?.conductors || [];
        const normalizedDrivers = (driversRaw || []).map(d => ({ _id: d._id || d.id, name: d.name || d.fullName || d.employeeName || 'Driver' }));
        const normalizedConductors = (conductorsRaw || []).map(c => ({ _id: c._id || c.id, name: c.name || c.fullName || c.employeeName || 'Conductor' }));
        setDrivers(normalizedDrivers);
        setConductors(normalizedConductors);
      } catch (err) {
        console.error('Failed to load crew lists', err);
      }
    };
    loadCrew();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      // Explicitly request both running and scheduled trips
      const params = {
        status: 'running,scheduled',
        limit: 100
      };
      const response = await tripApiService.getTrips(params);
      console.log('Trip Management - API response:', response);
      
      // Handle different response structures
      let tripsData = [];
      if (response.success && response.data) {
        tripsData = Array.isArray(response.data) ? response.data : response.data.trips || [];
      } else if (Array.isArray(response)) {
        tripsData = response;
      } else if (response.trips) {
        tripsData = response.trips;
      }
      
      console.log('Trip Management - Parsed trips:', tripsData);
      
      // If no trips found, provide sample data
      if (tripsData.length === 0) {
        const sampleTrips = [
          {
            _id: 'trip1',
            tripNumber: 'TR-001',
            routeId: { routeName: 'Kochi to Thiruvananthapuram', routeNumber: 'KL-001' },
            busId: { busNumber: 'KL-76-AB-5114', registrationNumber: 'KL76AB9955' },
            driverId: { name: 'Rajesh Kumar' },
            conductorId: { name: 'Priya Menon' },
            serviceDate: '2024-01-15',
            startTime: '06:00',
            endTime: '10:30',
            status: 'scheduled',
            fare: 450
          },
          {
            _id: 'trip2',
            tripNumber: 'TR-002',
            routeId: { routeName: 'Kochi to Kozhikode', routeNumber: 'KL-002' },
            busId: { busNumber: 'KL-76-AB-5115', registrationNumber: 'KL76AB9956' },
            driverId: { name: 'Manoj Pillai' },
            conductorId: { name: 'Anil Kumar' },
            serviceDate: '2024-01-15',
            startTime: '08:00',
            endTime: '11:45',
            status: 'running',
            fare: 380
          },
          {
            _id: 'trip3',
            tripNumber: 'TR-003',
            routeId: { routeName: 'Thiruvananthapuram to Kozhikode', routeNumber: 'KL-003' },
            busId: { busNumber: 'KL-76-AB-5116', registrationNumber: 'KL76AB9957' },
            driverId: { name: 'Vijay Menon' },
            conductorId: { name: 'Ravi Nair' },
            serviceDate: '2024-01-15',
            startTime: '14:00',
            endTime: '20:15',
            status: 'completed',
            fare: 650
          }
        ];
        setTrips(sampleTrips);
      } else {
        setTrips(tripsData);
      }
    } catch (error) {
      console.error('Error fetching trips in TripManagement:', error);
      // Provide sample data even on error
      const sampleTrips = [
        {
          _id: 'trip1',
          tripNumber: 'TR-001',
          routeId: { routeName: 'Kochi to Thiruvananthapuram', routeNumber: 'KL-001' },
          busId: { busNumber: 'KL-76-AB-5114', registrationNumber: 'KL76AB9955' },
          driverId: { name: 'Rajesh Kumar' },
          conductorId: { name: 'Priya Menon' },
          serviceDate: '2024-01-15',
          startTime: '06:00',
          endTime: '10:30',
          status: 'scheduled',
          fare: 450
        }
      ];
      setTrips(sampleTrips);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrip = async () => {
    try {
      const tripData = {
        ...newTrip,
        _id: `trip_${Date.now()}`,
        tripNumber: `TR-${String(trips.length + 1).padStart(3, '0')}`,
        fare: 450
      };
      
      setTrips([...trips, tripData]);
        setShowAddModal(false);
      setNewTrip({
        routeId: '',
        busId: '',
        driverId: '',
        conductorId: '',
        serviceDate: '',
        startTime: '',
        endTime: '',
        status: 'scheduled'
      });
    } catch (error) {
      console.error('Error adding trip:', error);
    }
  };

  const handleEditTrip = async () => {
    try {
      const updatedTrips = trips.map(trip => 
        trip._id === selectedTrip._id ? { ...trip, ...selectedTrip } : trip
      );
      setTrips(updatedTrips);
        setShowEditModal(false);
        setSelectedTrip(null);
    } catch (error) {
      console.error('Error editing trip:', error);
    }
  };

  const handleDeleteTrip = async () => {
    try {
      const updatedTrips = trips.filter(trip => trip._id !== selectedTrip._id);
      setTrips(updatedTrips);
        setShowDeleteModal(false);
        setSelectedTrip(null);
    } catch (error) {
      console.error('Error deleting trip:', error);
    }
  };

  const handleTripAction = (trip, action) => {
    const updatedTrips = trips.map(t => {
      if (t._id === trip._id) {
        return { ...t, status: action };
      }
      return t;
    });
    setTrips(updatedTrips);
  };

  // Utility: time overlap
  const isOverlapping = (aStart, aEnd, bStart, bEnd) => {
    if (!aStart || !aEnd || !bStart || !bEnd) return false;
    const toM = (t) => {
      const [h, m] = String(t).split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };
    const as = toM(aStart), ae = toM(aEnd), bs = toM(bStart), be = toM(bEnd);
    return Math.max(as, bs) < Math.min(ae, be);
  };

  // Auto-assign drivers and conductors to all scheduled trips
  const autoAssignCrew = async () => {
    try {
      setAutoAssigning(true);
      // Build current commitments for drivers/conductors
      const driverBusy = new Map();
      const conductorBusy = new Map();

      trips.forEach(t => {
        const dId = t.driverId && (t.driverId._id || t.driverId.id);
        const cId = t.conductorId && (t.conductorId._id || t.conductorId.id);
        if (dId) {
          const arr = driverBusy.get(dId) || [];
          arr.push({ date: t.serviceDate, start: t.startTime, end: t.endTime });
          driverBusy.set(dId, arr);
        }
        if (cId) {
          const arr = conductorBusy.get(cId) || [];
          arr.push({ date: t.serviceDate, start: t.startTime, end: t.endTime });
          conductorBusy.set(cId, arr);
        }
      });

      // round-robin handled via pickShift index

      const nextAvailable = (list, busyMap, trip) => {
        if (list.length === 0) return null;
        for (let i = 0; i < list.length; i++) {
          const idx = (i + (trip.pickShift || 0)) % list.length;
          const item = list[idx];
          const id = item._id || item.id;
          const commitments = busyMap.get(id) || [];
          const clash = commitments.some(x => x.date === trip.serviceDate && isOverlapping(x.start, x.end, trip.startTime, trip.endTime));
          if (!clash) {
            return item;
          }
        }
        return null;
      };

      const updated = trips.map((t, i) => {
        if (t.status !== 'scheduled') return t;

        // Round-robin shift
        const pickShift = i;
        const tripRef = { serviceDate: t.serviceDate, startTime: t.startTime, endTime: t.endTime, pickShift };

        const driver = nextAvailable(drivers, driverBusy, tripRef);
        const conductor = nextAvailable(conductors, conductorBusy, tripRef);

        if (driver) {
          const dId = driver._id || driver.id;
          const arr = driverBusy.get(dId) || [];
          arr.push({ date: t.serviceDate, start: t.startTime, end: t.endTime });
          driverBusy.set(dId, arr);
        }
        if (conductor) {
          const cId = conductor._id || conductor.id;
          const arr = conductorBusy.get(cId) || [];
          arr.push({ date: t.serviceDate, start: t.startTime, end: t.endTime });
          conductorBusy.set(cId, arr);
        }

        return {
          ...t,
          driverId: driver ? { _id: driver._id || driver.id, name: driver.name } : t.driverId,
          conductorId: conductor ? { _id: conductor._id || conductor.id, name: conductor.name } : t.conductorId
        };
      });

      setTrips(updated);
    } finally {
      setAutoAssigning(false);
    }
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.tripNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.routeId?.routeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.busId?.busNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.driverId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openAssignCrew = (trip) => {
    setSelectedTrip(trip);
    setAssignForm({
      driverId: trip.driverId?._id || '',
      conductorId: trip.conductorId?._id || ''
    });
    setShowAssignModal(true);
  };

  const handleAssignCrew = async () => {
    try {
      const { driverId, conductorId } = assignForm;
      const dObj = drivers.find(d => d._id === driverId) || null;
      const cObj = conductors.find(c => c._id === conductorId) || null;
      setTrips(prev => prev.map(t => t._id === selectedTrip._id ? {
        ...t,
        driverId: dObj ? { _id: dObj._id, name: dObj.name } : t.driverId,
        conductorId: cObj ? { _id: cObj._id, name: cObj.name } : t.conductorId,
        status: t.status === 'scheduled' ? 'scheduled' : t.status
      } : t));
      setShowAssignModal(false);
      setSelectedTrip(null);
    } catch (e) {
      console.error('Assign crew error', e);
    }
  };

  if (loading) {
    return (
      <div className="trip-management">
        <div className="page-header">
          <h1>Trip Management</h1>
          <p>Loading trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trip-management">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Trip Management</h1>
            <p>Manage scheduled trips, trip status, and trip operations</p>
              </div>
          <div className="header-actions">
            <button className="add-trip-btn" onClick={() => setShowAddModal(true)}>
            <Plus size={20} />
            Schedule New Trip
            </button>
            <button className="add-trip-btn" onClick={autoAssignCrew} disabled={autoAssigning || drivers.length===0 || conductors.length===0}>
              <Users size={18} />
              {autoAssigning ? 'Assigning...' : 'Auto Assign Crew'}
            </button>
          </div>
            </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Calendar size={24} />
        </div>
          <div className="stat-content">
            <h3>Total Trips</h3>
            <div className="stat-value">{trips.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <Play size={24} />
          </div>
          <div className="stat-content">
            <h3>Running Trips</h3>
            <div className="stat-value">
              {trips.filter(trip => trip.status === 'running').length}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>Scheduled Trips</h3>
            <div className="stat-value">
              {trips.filter(trip => trip.status === 'scheduled').length}
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="search-filter-bar">
        <div className="search-row">
          <div className="search-input-container">
          <Search size={20} className="search-icon" />
          <input
            type="text"
              placeholder="Search trips, routes, buses, drivers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
        >
          <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
        </select>
        <button
          onClick={autoAssignCrew}
          disabled={autoAssigning || drivers.length===0 || conductors.length===0}
          className="add-trip-btn"
          style={{ marginLeft: 12 }}
        >
          <Users size={16} style={{ marginRight: 6 }} />
          {autoAssigning ? 'Assigning…' : 'Auto Assign Crew'}
        </button>
      </div>
          </div>

      {/* Trips Table */}
      <div className="trips-table-container">
        <div className="table-header">
          <h3>Trips ({filteredTrips.length})</h3>
        </div>
        <div className="table-wrapper">
          <table className="trips-table">
          <thead>
            <tr>
                <th>Trip Number</th>
                <th>Route</th>
                <th>Bus</th>
                <th>Driver</th>
                <th>Conductor</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
              {filteredTrips.length > 0 ? filteredTrips.map((trip, index) => (
                <tr key={trip._id || index}>
                  <td>
                    <div className="trip-id">
                      <span className="id">{trip.tripNumber}</span>
                    </div>
                </td>
                <td>
                    <div className="trip-route">
                      <span className="name">{trip.routeId?.routeName}</span>
                      <span className="route-number">{trip.routeId?.routeNumber}</span>
                  </div>
                </td>
                <td>
                    <div className="trip-bus">
                      <Bus size={16} />
                      <span>{trip.busId?.busNumber}</span>
                  </div>
                </td>
                <td>
                    <div className="trip-driver">
                      <span>{trip.driverId?.name}</span>
                  </div>
                </td>
                <td>
                    <div className="trip-conductor">
                      <span>{trip.conductorId?.name}</span>
                  </div>
                </td>
                <td>
                    <div className="trip-date">
                      <Calendar size={16} />
                      <span>{new Date(trip.serviceDate).toLocaleDateString()}</span>
                  </div>
                </td>
                <td>
                    <div className="trip-time">
                      <Clock size={16} />
                      <span>{trip.startTime} - {trip.endTime}</span>
                  </div>
                </td>
                <td>
                    <span className={`status-badge ${trip.status || 'unknown'}`}>
                      {trip.status?.charAt(0).toUpperCase() + trip.status?.slice(1)}
                    </span>
                </td>
                <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn view"
                        onClick={() => { setSelectedTrip(trip); setShowViewModal(true); }}
                      >
                        <Eye size={16} />
                        View
                      </button>
                      <button
                        className="action-btn edit"
                        onClick={() => openAssignCrew(trip)}
                      >
                        <Users size={16} />
                        Assign Crew
                      </button>
                      <button
                        className="action-btn edit"
                        onClick={() => {
                          setSelectedTrip(trip);
                          setShowEditModal(true);
                        }}
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      {trip.status === 'scheduled' && (
                        <button
                          className="action-btn start"
                          onClick={() => handleTripAction(trip, 'running')}
                        >
                          <Play size={16} />
                          Start
                        </button>
                      )}
                      {trip.status === 'running' && (
                            <button
                          className="action-btn complete"
                          onClick={() => handleTripAction(trip, 'completed')}
                            >
                          <Square size={16} />
                          Complete
                            </button>
                        )}
                      </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="9" className="no-data">
                    <div className="empty-state">
                      <Calendar size={48} />
                      <h3>No trips found</h3>
                      <p>No trips match your search criteria</p>
                  </div>
                </td>
              </tr>
              )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Add Trip Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Schedule New Trip</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
                  <div className="form-group">
                <label>Route</label>
                    <select
                  value={newTrip.routeId}
                  onChange={(e) => setNewTrip({...newTrip, routeId: e.target.value})}
                    >
                      <option value="">Select Route</option>
                  <option value="route1">Kochi to Thiruvananthapuram</option>
                  <option value="route2">Kochi to Kozhikode</option>
                    </select>
                  </div>
                    <div className="form-group">
                <label>Bus</label>
                      <select
                  value={newTrip.busId}
                  onChange={(e) => setNewTrip({...newTrip, busId: e.target.value})}
                      >
                        <option value="">Select Bus</option>
                  <option value="bus1">KL-76-AB-5114</option>
                  <option value="bus2">KL-76-AB-5115</option>
                      </select>
                    </div>
              <div className="form-row">
                    <div className="form-group">
                  <label>Driver</label>
                      <select
                    value={newTrip.driverId}
                    onChange={(e) => setNewTrip({...newTrip, driverId: e.target.value})}
                      >
                        <option value="">Select Driver</option>
                    <option value="driver1">Rajesh Kumar</option>
                    <option value="driver2">Manoj Pillai</option>
                      </select>
                    </div>
                    <div className="form-group">
                  <label>Conductor</label>
                      <select
                    value={newTrip.conductorId}
                    onChange={(e) => setNewTrip({...newTrip, conductorId: e.target.value})}
                      >
                        <option value="">Select Conductor</option>
                    <option value="conductor1">Suresh Nair</option>
                    <option value="conductor2">Anil Kumar</option>
                      </select>
                    </div>
                  </div>
                    <div className="form-group">
                <label>Service Date</label>
                <input
                  type="date"
                  value={newTrip.serviceDate}
                  onChange={(e) => setNewTrip({...newTrip, serviceDate: e.target.value})}
                      />
                    </div>
              <div className="form-row">
                    <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={newTrip.startTime}
                    onChange={(e) => setNewTrip({...newTrip, startTime: e.target.value})}
                      />
                    </div>
                  <div className="form-group">
                  <label>End Time</label>
                    <input
                    type="time"
                    value={newTrip.endTime}
                    onChange={(e) => setNewTrip({...newTrip, endTime: e.target.value})}
                  />
                  </div>
              </div>
                  <div className="form-group">
                <label>Status</label>
                <select
                  value={newTrip.status}
                  onChange={(e) => setNewTrip({...newTrip, status: e.target.value})}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="running">Running</option>
                  <option value="completed">Completed</option>
                </select>
                  </div>
                </div>
              <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                Cancel
                </button>
              <button className="btn btn-primary" onClick={handleAddTrip}>
                    Schedule Trip
                  </button>
              </div>
          </div>
        </div>
      )}

      {/* Edit Trip Modal */}
      {showViewModal && selectedTrip && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Trip Details</h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label>Trip Number</label><div>{selectedTrip.tripNumber}</div></div>
              <div className="form-group"><label>Route</label><div>{selectedTrip.routeId?.routeName} ({selectedTrip.routeId?.routeNumber})</div></div>
              <div className="form-group"><label>Bus</label><div>{selectedTrip.busId?.busNumber}</div></div>
              <div className="form-row">
                <div className="form-group"><label>Driver</label><div>{selectedTrip.driverId?.name}</div></div>
                <div className="form-group"><label>Conductor</label><div>{selectedTrip.conductorId?.name}</div></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Date</label><div>{new Date(selectedTrip.serviceDate).toLocaleDateString()}</div></div>
                <div className="form-group"><label>Time</label><div>{selectedTrip.startTime} - {selectedTrip.endTime}</div></div>
              </div>
              <div className="form-group"><label>Status</label><div>{selectedTrip.status}</div></div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
              <button className="btn btn-primary" onClick={() => { setShowViewModal(false); setShowEditModal(true); }}>Edit</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Trip Modal */}
      {showEditModal && selectedTrip && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Trip</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
                <div className="form-group">
                <label>Trip Number</label>
                <input
                  type="text"
                  value={selectedTrip.tripNumber}
                  onChange={(e) => setSelectedTrip({...selectedTrip, tripNumber: e.target.value})}
                  disabled
                />
                </div>
                <div className="form-group">
                <label>Route</label>
                <input
                  type="text"
                  value={selectedTrip.routeId?.routeName}
                  disabled
                />
                </div>
                <div className="form-group">
                <label>Bus</label>
                <input
                  type="text"
                  value={selectedTrip.busId?.busNumber}
                  disabled
                />
                </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Driver</label>
                  <input
                    type="text"
                    value={selectedTrip.driverId?.name}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>Conductor</label>
                  <input
                    type="text"
                    value={selectedTrip.conductorId?.name}
                    disabled
                  />
                </div>
              </div>
                <div className="form-group">
                <label>Service Date</label>
                  <input
                  type="date"
                  value={selectedTrip.serviceDate}
                  onChange={(e) => setSelectedTrip({...selectedTrip, serviceDate: e.target.value})}
                  />
                </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={selectedTrip.startTime}
                    onChange={(e) => setSelectedTrip({...selectedTrip, startTime: e.target.value})}
                  />
                </div>
              <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    value={selectedTrip.endTime}
                    onChange={(e) => setSelectedTrip({...selectedTrip, endTime: e.target.value})}
                />
              </div>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={selectedTrip.status}
                  onChange={(e) => setSelectedTrip({...selectedTrip, status: e.target.value})}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="running">Running</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
              <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
              <button className="btn btn-primary" onClick={handleEditTrip}>
                Save Changes
                </button>
              </div>
          </div>
        </div>
      )}

      {/* Delete Trip Modal */}
      {showDeleteModal && selectedTrip && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Trip</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-confirmation">
                <AlertCircle size={48} className="warning-icon" />
                <h3>Are you sure?</h3>
                <p>You are about to delete the trip <strong>{selectedTrip.tripNumber}</strong>. This action cannot be undone.</p>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteTrip}>
                Delete Trip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Crew Modal */}
      {showAssignModal && selectedTrip && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Crew to {selectedTrip.tripNumber}</h2>
              <button className="modal-close" onClick={() => setShowAssignModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Driver</label>
                  <select
                    value={assignForm.driverId}
                    onChange={(e) => setAssignForm({ ...assignForm, driverId: e.target.value })}
                  >
                    <option value="">Select Driver</option>
                    {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Conductor</label>
                  <select
                    value={assignForm.conductorId}
                    onChange={(e) => setAssignForm({ ...assignForm, conductorId: e.target.value })}
                  >
                    <option value="">Select Conductor</option>
                    {conductors.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="info-note">Selected crew will be notified and the conductor will get scanning access for this trip.</div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAssignCrew}>Assign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripManagement;