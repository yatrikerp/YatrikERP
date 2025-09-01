import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import './TripManagement.css';

const TripManagement = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [conductors, setConductors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [stats, setStats] = useState({
    totalTrips: 0,
    activeTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0
  });

  // Form states
  const [formData, setFormData] = useState({
    routeId: '',
    busId: '',
    driverId: '',
    conductorId: '',
    departureTime: '',
    arrivalTime: '',
    fare: 0,
    notes: ''
  });

  const tripStatuses = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'running', label: 'Running' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'delayed', label: 'Delayed' }
  ];

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tripsRes, busesRes, routesRes, driversRes, conductorsRes] = await Promise.all([
        fetch('/api/depot/trips', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/depot/buses', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/depot/routes', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/depot/drivers', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/depot/conductors', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (tripsRes.ok) {
        const tripsData = await tripsRes.json();
        setTrips(tripsData.data.trips || []);
        setStats(tripsData.data.stats || {});
      }

      if (busesRes.ok) {
        const busesData = await busesRes.json();
        setBuses(busesData.data.buses || []);
      }

      if (routesRes.ok) {
        const routesData = await routesRes.json();
        setRoutes(routesData.data.routes || []);
      }

      if (driversRes.ok) {
        const driversData = await driversRes.json();
        setDrivers(driversData.data.drivers || []);
      }

      if (conductorsRes.ok) {
        const conductorsData = await conductorsRes.json();
        setConductors(conductorsData.data.conductors || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrip = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/depot/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowAddModal(false);
        resetForm();
        fetchData();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to add trip');
      }
    } catch (error) {
      console.error('Error adding trip:', error);
      alert('Failed to add trip');
    }
  };

  const handleEditTrip = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/depot/trips/${selectedTrip._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowEditModal(false);
        resetForm();
        fetchData();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update trip');
      }
    } catch (error) {
      console.error('Error updating trip:', error);
      alert('Failed to update trip');
    }
  };

  const handleDeleteTrip = async () => {
    try {
      const response = await fetch(`/api/depot/trips/${selectedTrip._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setSelectedTrip(null);
        fetchData();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete trip');
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert('Failed to delete trip');
    }
  };

  const handleStatusChange = async (tripId, newStatus) => {
    try {
      const response = await fetch(`/api/depot/trips/${tripId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchData();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update trip status');
      }
    } catch (error) {
      console.error('Error updating trip status:', error);
      alert('Failed to update trip status');
    }
  };

  const resetForm = () => {
    setFormData({
      routeId: '',
      busId: '',
      driverId: '',
      conductorId: '',
      departureTime: '',
      arrivalTime: '',
      fare: 0,
      notes: ''
    });
  };

  const openEditModal = (trip) => {
    setSelectedTrip(trip);
    setFormData({
      routeId: trip.routeId?._id || '',
      busId: trip.busId?._id || '',
      driverId: trip.driverId?._id || '',
      conductorId: trip.conductorId?._id || '',
      departureTime: trip.departureTime ? new Date(trip.departureTime).toISOString().slice(0, 16) : '',
      arrivalTime: trip.arrivalTime ? new Date(trip.arrivalTime).toISOString().slice(0, 16) : '',
      fare: trip.fare || 0,
      notes: trip.notes || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (trip) => {
    setSelectedTrip(trip);
    setShowDeleteModal(true);
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = 
      trip.tripNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.routeId?.routeNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.busId?.busNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.driverId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || trip.status === filterStatus;
    
    const matchesDate = filterDate === 'all' || (() => {
      const tripDate = new Date(trip.departureTime).toDateString();
      const today = new Date().toDateString();
      const tomorrow = new Date(Date.now() + 86400000).toDateString();
      
      switch (filterDate) {
        case 'today': return tripDate === today;
        case 'tomorrow': return tripDate === tomorrow;
        case 'this-week': return new Date(trip.departureTime) >= new Date(Date.now() - 7 * 86400000);
        default: return true;
      }
    })();
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'blue';
      case 'running': return 'green';
      case 'completed': return 'purple';
      case 'cancelled': return 'red';
      case 'delayed': return 'orange';
      default: return 'gray';
    }
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusLabel = (status) => {
    return tripStatuses.find(s => s.value === status)?.label || status;
  };

  if (loading) {
    return (
      <div className="trip-loading">
        <div className="loading-spinner"></div>
        <h3>Loading Trip Management...</h3>
      </div>
    );
  }

  return (
    <div className="trip-management">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Trip Management</h1>
          <p>Schedule, monitor, and manage all depot trips in real-time</p>
        </div>
        <div className="header-actions">
          <button 
            className="action-btn"
            onClick={() => setShowAddModal(true)}
          >
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Schedule New Trip
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-section">
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{stats.totalTrips}</div>
              <div className="kpi-label">Total Trips</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{stats.activeTrips}</div>
              <div className="kpi-label">Active Trips</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{stats.completedTrips}</div>
              <div className="kpi-label">Completed</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{stats.cancelledTrips}</div>
              <div className="kpi-label">Cancelled</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-section">
        <div className="search-input-wrapper">
          <svg className="search-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414L10.89 9.89A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder="Search trips, routes, buses, or drivers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            {tripStatuses.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>

          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="this-week">This Week</option>
          </select>
        </div>
      </div>

      {/* Trips Table */}
      <div className="table-section">
        <div className="table-container">
          <table className="data-table">
          <thead>
            <tr>
              <th>Trip Number</th>
              <th>Route</th>
              <th>Bus</th>
              <th>Crew</th>
              <th>Schedule</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrips.map((trip) => (
              <tr key={trip._id}>
                <td>
                  <div className="trip-info">
                    <div className="trip-number">{trip.tripNumber}</div>
                    <div className="trip-id">ID: {trip._id.slice(-6)}</div>
                  </div>
                </td>
                <td>
                  <div className="route-info">
                    <div className="route-number">{trip.routeId?.routeNumber}</div>
                    <div className="route-name">{trip.routeId?.routeName}</div>
                    <div className="route-endpoints">
                      {trip.routeId?.startingPoint} → {trip.routeId?.endingPoint}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="bus-info">
                    <div className="bus-number">{trip.busId?.busNumber}</div>
                    <div className="bus-type">{trip.busId?.busType}</div>
                    <div className="bus-capacity">{trip.busId?.capacity?.total} seats</div>
                  </div>
                </td>
                <td>
                  <div className="crew-info">
                    <div className="crew-driver">
                      <span className="crew-label">Driver:</span>
                      <span className="crew-name">{trip.driverId?.name}</span>
                    </div>
                    <div className="crew-conductor">
                      <span className="crew-label">Conductor:</span>
                      <span className="crew-name">{trip.conductorId?.name}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="schedule-info">
                    <div className="departure-time">
                      <span className="time-label">Depart:</span>
                      <span className="time-value">{formatDateTime(trip.departureTime)}</span>
                    </div>
                    <div className="arrival-time">
                      <span className="time-label">Arrive:</span>
                      <span className="time-value">{formatDateTime(trip.arrivalTime)}</span>
                    </div>
                    <div className="fare-info">₹{trip.fare}</div>
                  </div>
                </td>
                <td>
                  <div className="status-section">
                    <span className={`status-badge ${getStatusColor(trip.status)}`}>
                      {getStatusLabel(trip.status)}
                    </span>
                    <select
                      value={trip.status}
                      onChange={(e) => handleStatusChange(trip._id, e.target.value)}
                      className="status-select"
                    >
                      {tripStatuses.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="action-btn view"
                      onClick={() => openEditModal(trip)}
                      title="View/Edit"
                    >
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      className="action-btn track"
                      title="Track Trip"
                    >
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => openDeleteModal(trip)}
                      title="Delete"
                    >
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTrips.length === 0 && (
          <div className="no-data">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            <h3>No trips found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
        </div>
      </div>

      {/* Add Trip Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Schedule New Trip</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddTrip} className="trip-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Route *</label>
                  <select
                    value={formData.routeId}
                    onChange={(e) => setFormData({...formData, routeId: e.target.value})}
                    required
                  >
                    <option value="">Select Route</option>
                    {routes.map(route => (
                      <option key={route._id} value={route._id}>
                        {route.routeNumber} - {route.routeName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Bus *</label>
                  <select
                    value={formData.busId}
                    onChange={(e) => setFormData({...formData, busId: e.target.value})}
                    required
                  >
                    <option value="">Select Bus</option>
                    {buses.filter(bus => bus.status === 'active').map(bus => (
                      <option key={bus._id} value={bus._id}>
                        {bus.busNumber} - {bus.busType}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Driver *</label>
                  <select
                    value={formData.driverId}
                    onChange={(e) => setFormData({...formData, driverId: e.target.value})}
                    required
                  >
                    <option value="">Select Driver</option>
                    {drivers.filter(driver => driver.status === 'active').map(driver => (
                      <option key={driver._id} value={driver._id}>
                        {driver.name} - {driver.licenseNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Conductor *</label>
                  <select
                    value={formData.conductorId}
                    onChange={(e) => setFormData({...formData, conductorId: e.target.value})}
                    required
                  >
                    <option value="">Select Conductor</option>
                    {conductors.filter(conductor => conductor.status === 'active').map(conductor => (
                      <option key={conductor._id} value={conductor._id}>
                        {conductor.name} - {conductor.employeeId}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Departure Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.departureTime}
                    onChange={(e) => setFormData({...formData, departureTime: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Arrival Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.arrivalTime}
                    onChange={(e) => setFormData({...formData, arrivalTime: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Fare (₹) *</label>
                  <input
                    type="number"
                    value={formData.fare}
                    onChange={(e) => setFormData({...formData, fare: parseFloat(e.target.value)})}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Schedule Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Trip Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Trip - {selectedTrip?.tripNumber}</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
              >
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditTrip} className="trip-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Route *</label>
                  <select
                    value={formData.routeId}
                    onChange={(e) => setFormData({...formData, routeId: e.target.value})}
                    required
                  >
                    <option value="">Select Route</option>
                    {routes.map(route => (
                      <option key={route._id} value={route._id}>
                        {route.routeNumber} - {route.routeName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Bus *</label>
                  <select
                    value={formData.busId}
                    onChange={(e) => setFormData({...formData, busId: e.target.value})}
                    required
                  >
                    <option value="">Select Bus</option>
                    {buses.map(bus => (
                      <option key={bus._id} value={bus._id}>
                        {bus.busNumber} - {bus.busType}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Driver *</label>
                  <select
                    value={formData.driverId}
                    onChange={(e) => setFormData({...formData, driverId: e.target.value})}
                    required
                  >
                    <option value="">Select Driver</option>
                    {drivers.map(driver => (
                      <option key={driver._id} value={driver._id}>
                        {driver.name} - {driver.licenseNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Conductor *</label>
                  <select
                    value={formData.conductorId}
                    onChange={(e) => setFormData({...formData, conductorId: e.target.value})}
                    required
                  >
                    <option value="">Select Conductor</option>
                    {conductors.map(conductor => (
                      <option key={conductor._id} value={conductor._id}>
                        {conductor.name} - {conductor.employeeId}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Departure Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.departureTime}
                    onChange={(e) => setFormData({...formData, departureTime: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Arrival Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.arrivalTime}
                    onChange={(e) => setFormData({...formData, arrivalTime: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Fare (₹) *</label>
                  <input
                    type="number"
                    value={formData.fare}
                    onChange={(e) => setFormData({...formData, fare: parseFloat(e.target.value)})}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <div className="modal-header">
              <h2>Delete Trip</h2>
              <button 
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="delete-content">
              <div className="delete-icon">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3>Are you sure you want to delete this trip?</h3>
              <p>This action cannot be undone. The trip "{selectedTrip?.tripNumber}" will be permanently removed.</p>
              
              <div className="trip-details">
                <div className="detail-item">
                  <span className="label">Trip Number:</span>
                  <span className="value">{selectedTrip?.tripNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Route:</span>
                  <span className="value">{selectedTrip?.routeId?.routeNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Bus:</span>
                  <span className="value">{selectedTrip?.busId?.busNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Status:</span>
                  <span className="value">{getStatusLabel(selectedTrip?.status)}</span>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-danger" 
                onClick={handleDeleteTrip}
              >
                Delete Trip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripManagement;
