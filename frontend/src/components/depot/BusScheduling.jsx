import React, { useState, useEffect } from 'react';
import './BusScheduling.css';

const BusScheduling = () => {
  const [schedules, setSchedules] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [conductors, setConductors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  const [formData, setFormData] = useState({
    routeId: '',
    busId: '',
    driverId: '',
    conductorId: '',
    serviceDate: '',
    startTime: '',
    endTime: '',
    fare: '',
    capacity: '',
    notes: '',
    status: 'scheduled'
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('depotToken') || localStorage.getItem('token');
      
      // Fetch routes
      const routesResponse = await fetch('/api/depot/routes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const routesData = await routesResponse.json();
      if (routesData.success) {
        setRoutes(routesData.data.routes || []);
      }

      // Fetch buses
      const busesResponse = await fetch('/api/depot/buses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const busesData = await busesResponse.json();
      if (busesData.success) {
        setBuses(busesData.data.buses || []);
      }

      // Fetch drivers from depot endpoint
      const driversResponse = await fetch('/api/depot/drivers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const driversData = await driversResponse.json();
      if (driversData.success) {
        setDrivers(driversData.data.drivers || []);
      }

      // Fetch conductors from depot endpoint
      const conductorsResponse = await fetch('/api/depot/conductors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const conductorsData = await conductorsResponse.json();
      if (conductorsData.success) {
        setConductors(conductorsData.data.conductors || []);
      }

      // Fetch schedules for selected date
      const schedulesResponse = await fetch(`/api/depot/trips?date=${selectedDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const schedulesData = await schedulesResponse.json();
      if (schedulesData.success) {
        setSchedules(schedulesData.data.trips || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('depotToken') || localStorage.getItem('token');
      const isEditing = editingTrip !== null;
      const url = isEditing ? `/api/depot/trips/${editingTrip._id}` : '/api/depot/trips';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        alert(isEditing ? 'Trip updated successfully!' : 'Trip scheduled successfully!');
        setShowForm(false);
        setEditingTrip(null);
        resetForm();
        fetchData(); // Refresh the list
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error scheduling trip:', error);
      alert('Error scheduling trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      routeId: '',
      busId: '',
      driverId: '',
      conductorId: '',
      serviceDate: '',
      startTime: '',
      endTime: '',
      fare: '',
      capacity: '',
      notes: '',
      status: 'scheduled'
    });
  };

  const handleEdit = (trip) => {
    setEditingTrip(trip);
    setFormData({
      routeId: trip.routeId._id || trip.routeId,
      busId: trip.busId._id || trip.busId,
      driverId: trip.driverId?._id || trip.driverId || '',
      conductorId: trip.conductorId?._id || trip.conductorId || '',
      serviceDate: trip.serviceDate ? new Date(trip.serviceDate).toISOString().split('T')[0] : '',
      startTime: trip.startTime || '',
      endTime: trip.endTime || '',
      fare: trip.fare || '',
      capacity: trip.capacity || '',
      notes: trip.notes || '',
      status: trip.status || 'scheduled'
    });
    setShowForm(true);
  };

  const handleView = (trip) => {
    setSelectedTrip(trip);
    setShowDetails(true);
  };

  const handleStatusChange = async (tripId, newStatus) => {
    if (!window.confirm(`Are you sure you want to change status to ${newStatus}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('depotToken') || localStorage.getItem('token');
      
      const response = await fetch(`/api/depot/trips/${tripId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Status updated successfully!');
        fetchData(); // Refresh the list
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status. Please try again.');
    }
  };

  const deleteSchedule = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    try {
      const token = localStorage.getItem('depotToken') || localStorage.getItem('token');
      
      const response = await fetch(`/api/depot/trips/${scheduleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Schedule deleted successfully!');
        fetchData(); // Refresh the list
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Error deleting schedule. Please try again.');
    }
  };

  const getRouteName = (routeId) => {
    const route = routes.find(r => r._id === routeId);
    return route ? `${route.routeNumber} - ${route.routeName}` : 'Unknown Route';
  };

  const getBusNumber = (busId) => {
    const bus = buses.find(b => b._id === busId);
    return bus ? bus.busNumber : 'Unknown Bus';
  };

  const getDriverName = (driverId) => {
    const driver = drivers.find(d => d._id === driverId);
    return driver ? driver.name : 'Unknown Driver';
  };

  const getConductorName = (conductorId) => {
    const conductor = conductors.find(c => c._id === conductorId);
    return conductor ? conductor.name : 'Unknown Conductor';
  };

  return (
    <div className="bus-scheduling">
      <div className="scheduling-header">
        <div className="header-left">
          <h2>Bus Scheduling</h2>
          <p>Manage bus schedules and trip assignments</p>
        </div>
        <div className="header-right">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-picker"
          />
          <button 
            className="btn-primary"
            onClick={() => setShowForm(true)}
          >
            <svg className="btn-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Schedule New Trip
          </button>
        </div>
      </div>

      {/* Schedule Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingTrip ? 'Edit Trip' : 'Schedule New Trip'}</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowForm(false);
                  setEditingTrip(null);
                  resetForm();
                }}
              >
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="schedule-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Route *</label>
                  <select
                    name="routeId"
                    value={formData.routeId}
                    onChange={handleInputChange}
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
                    name="busId"
                    value={formData.busId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Bus</option>
                    {buses.map(bus => (
                      <option key={bus._id} value={bus._id}>
                        {bus.busNumber} ({bus.busType})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Driver *</label>
                  <select
                    name="driverId"
                    value={formData.driverId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Driver</option>
                    {drivers.map(driver => (
                      <option key={driver._id} value={driver._id}>
                        {driver.name} {driver.licenseNumber ? `(License: ${driver.licenseNumber})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Conductor</label>
                  <select
                    name="conductorId"
                    value={formData.conductorId}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Conductor</option>
                    {conductors.map(conductor => (
                      <option key={conductor._id} value={conductor._id}>
                        {conductor.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Service Date *</label>
                  <input
                    type="date"
                    name="serviceDate"
                    value={formData.serviceDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Start Time *</label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Time *</label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Fare (₹)</label>
                  <input
                    type="number"
                    name="fare"
                    value={formData.fare}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Capacity</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="running">Running</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Additional notes or instructions..."
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTrip(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? (editingTrip ? 'Updating...' : 'Scheduling...') : (editingTrip ? 'Update Trip' : 'Schedule Trip')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedules List */}
      <div className="schedules-list">
        <div className="list-header">
          <h3>Scheduled Trips for {new Date(selectedDate).toLocaleDateString()}</h3>
          <div className="schedule-stats">
            <span className="stat-item">
              <span className="stat-label">Total:</span>
              <span className="stat-value">{schedules.length}</span>
            </span>
            <span className="stat-item">
              <span className="stat-label">Active:</span>
              <span className="stat-value">{schedules.filter(s => s.status === 'scheduled' || s.status === 'running').length}</span>
            </span>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading schedules...</p>
          </div>
        ) : schedules.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            <h4>No schedules found</h4>
            <p>No trips are scheduled for this date. Click "Schedule New Trip" to add one.</p>
          </div>
        ) : (
          <div className="schedules-grid">
            {schedules.map(schedule => (
              <div key={schedule._id} className="schedule-card">
                <div className="schedule-header">
                  <div className="schedule-info">
                    <h4>{getRouteName(schedule.routeId)}</h4>
                    <p className="schedule-time">
                      {schedule.startTime} - {schedule.endTime}
                    </p>
                  </div>
                  <div className="schedule-status">
                    <span className={`status-badge ${schedule.status}`}>
                      {schedule.status}
                    </span>
                  </div>
                </div>

                <div className="schedule-details">
                  <div className="detail-row">
                    <span className="detail-label">Bus:</span>
                    <span className="detail-value">{getBusNumber(schedule.busId)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Driver:</span>
                    <span className="detail-value">{getDriverName(schedule.driverId)}</span>
                  </div>
                  {schedule.conductorId && (
                    <div className="detail-row">
                      <span className="detail-label">Conductor:</span>
                      <span className="detail-value">{getConductorName(schedule.conductorId)}</span>
                    </div>
                  )}
                  {schedule.fare && (
                    <div className="detail-row">
                      <span className="detail-label">Fare:</span>
                      <span className="detail-value">₹{schedule.fare}</span>
                    </div>
                  )}
                  {schedule.capacity && (
                    <div className="detail-row">
                      <span className="detail-label">Capacity:</span>
                      <span className="detail-value">{schedule.capacity} seats</span>
                    </div>
                  )}
                </div>

                {schedule.notes && (
                  <div className="schedule-notes">
                    <p>{schedule.notes}</p>
                  </div>
                )}

                <div className="schedule-actions">
                  <div className="action-buttons">
                    <button 
                      className="btn-view btn-sm"
                      onClick={() => handleView(schedule)}
                      title="View Details"
                    >
                      <svg className="btn-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      View
                    </button>
                    
                    {schedule.status === 'scheduled' && (
                      <button 
                        className="btn-edit btn-sm"
                        onClick={() => handleEdit(schedule)}
                        title="Edit Trip"
                      >
                        <svg className="btn-icon" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Edit
                      </button>
                    )}

                    {schedule.status === 'scheduled' && (
                      <button 
                        className="btn-start btn-sm"
                        onClick={() => handleStatusChange(schedule._id, 'running')}
                        title="Start Trip"
                      >
                        <svg className="btn-icon" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        Start
                      </button>
                    )}

                    {schedule.status === 'running' && (
                      <button 
                        className="btn-complete btn-sm"
                        onClick={() => handleStatusChange(schedule._id, 'completed')}
                        title="Complete Trip"
                      >
                        <svg className="btn-icon" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Complete
                      </button>
                    )}

                    {(schedule.status === 'scheduled' || schedule.status === 'running') && (
                      <button 
                        className="btn-cancel btn-sm"
                        onClick={() => handleStatusChange(schedule._id, 'cancelled')}
                        title="Cancel Trip"
                      >
                        <svg className="btn-icon" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Cancel
                      </button>
                    )}

                    {schedule.status === 'scheduled' && (
                      <button 
                        className="btn-danger btn-sm"
                        onClick={() => deleteSchedule(schedule._id)}
                        title="Delete Trip"
                      >
                        <svg className="btn-icon" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trip Details Modal */}
      {showDetails && selectedTrip && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Trip Details</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowDetails(false);
                  setSelectedTrip(null);
                }}
              >
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="trip-details">
              <div className="details-grid">
                <div className="detail-section">
                  <h4>Route Information</h4>
                  <div className="detail-item">
                    <span className="detail-label">Route:</span>
                    <span className="detail-value">{getRouteName(selectedTrip.routeId._id || selectedTrip.routeId)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">From:</span>
                    <span className="detail-value">{selectedTrip.routeId?.startingPoint || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">To:</span>
                    <span className="detail-value">{selectedTrip.routeId?.endingPoint || 'N/A'}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Bus Information</h4>
                  <div className="detail-item">
                    <span className="detail-label">Bus Number:</span>
                    <span className="detail-value">{getBusNumber(selectedTrip.busId._id || selectedTrip.busId)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Bus Type:</span>
                    <span className="detail-value">{selectedTrip.busId?.busType || 'Standard'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Capacity:</span>
                    <span className="detail-value">{selectedTrip.busId?.capacity?.total || selectedTrip.capacity || 'N/A'} seats</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Trip Schedule</h4>
                  <div className="detail-item">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">{new Date(selectedTrip.serviceDate).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Start Time:</span>
                    <span className="detail-value">{selectedTrip.startTime}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">End Time:</span>
                    <span className="detail-value">{selectedTrip.endTime}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className={`status-badge ${selectedTrip.status}`}>{selectedTrip.status}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Crew Information</h4>
                  <div className="detail-item">
                    <span className="detail-label">Driver:</span>
                    <span className="detail-value">{getDriverName(selectedTrip.driverId?._id || selectedTrip.driverId)}</span>
                  </div>
                  {selectedTrip.conductorId && (
                    <div className="detail-item">
                      <span className="detail-label">Conductor:</span>
                      <span className="detail-value">{getConductorName(selectedTrip.conductorId._id || selectedTrip.conductorId)}</span>
                    </div>
                  )}
                </div>

                <div className="detail-section">
                  <h4>Financial Information</h4>
                  <div className="detail-item">
                    <span className="detail-label">Fare:</span>
                    <span className="detail-value">₹{selectedTrip.fare || 'N/A'}</span>
                  </div>
                </div>

                {selectedTrip.notes && (
                  <div className="detail-section full-width">
                    <h4>Notes</h4>
                    <div className="notes-content">
                      <p>{selectedTrip.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedTrip(null);
                  }}
                >
                  Close
                </button>
                {selectedTrip.status === 'scheduled' && (
                  <button 
                    className="btn-primary"
                    onClick={() => {
                      setShowDetails(false);
                      handleEdit(selectedTrip);
                    }}
                  >
                    Edit Trip
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusScheduling;
