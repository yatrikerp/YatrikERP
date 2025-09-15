import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Bus, MapPin, User, Plus, Edit, Trash2, Eye, Filter, Search } from 'lucide-react';
import './BusScheduling.css';

const BusScheduling = ({ depotId, user }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    date: ''
  });
  const [formData, setFormData] = useState({
    scheduleName: '',
    description: '',
    busId: '',
    routeId: '',
    departureTime: '',
    arrivalTime: '',
    frequency: 'daily',
    daysOfWeek: [],
    driverId: '',
    conductorId: '',
    baseFare: '',
    maxCapacity: '',
    isRecurring: false,
    specialInstructions: ''
  });

  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [conductors, setConductors] = useState([]);

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.date) params.append('date', filters.date);
      
      // Add depotId parameter for depot users
      if (depotId) {
        params.append('depotId', depotId);
      }

      const token = localStorage.getItem('depotToken') || localStorage.getItem('token');
      const response = await fetch(`/api/bus-schedule?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSchedules(data.data.schedules || []);
      } else {
        console.error('Failed to fetch schedules:', response.status);
        setSchedules([]);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [filters, depotId]);

  useEffect(() => {
    console.log('BusScheduling useEffect - fetching data...');
    console.log('User:', user);
    console.log('DepotId:', depotId);
    fetchSchedules();
    fetchBuses();
    fetchRoutes();
    fetchDrivers();
    fetchConductors();
  }, [filters, depotId, user, fetchSchedules]);

  useEffect(() => {
    console.log('Buses state updated:', buses);
    console.log('Is buses array?', Array.isArray(buses));
    console.log('Buses length:', buses?.length);
  }, [buses]);

  const fetchBuses = async () => {
    try {
      const token = localStorage.getItem('depotToken') || localStorage.getItem('token');
      const response = await fetch('/api/depot/buses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Buses API response:', data);
        // Handle different response structures
        if (data.success && data.data && Array.isArray(data.data.buses)) {
          setBuses(data.data.buses);
        } else if (data.success && Array.isArray(data.data)) {
          setBuses(data.data);
        } else if (Array.isArray(data)) {
          setBuses(data);
        } else if (data.buses && Array.isArray(data.buses)) {
          setBuses(data.buses);
        } else {
          console.warn('Unexpected buses data structure:', data);
          setBuses([]);
        }
      } else {
        console.error('Failed to fetch buses:', response.status);
        setBuses([]);
      }
    } catch (error) {
      console.error('Error fetching buses:', error);
      setBuses([]);
    }
  };

  const fetchRoutes = async () => {
    try {
      const token = localStorage.getItem('depotToken') || localStorage.getItem('token');
      const response = await fetch('/api/depot/routes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Routes API response:', data);
        if (data.success && data.data && Array.isArray(data.data.routes)) {
          setRoutes(data.data.routes);
        } else if (data.success && Array.isArray(data.data)) {
          setRoutes(data.data);
        } else if (Array.isArray(data)) {
          setRoutes(data);
        } else {
          setRoutes([]);
        }
      } else {
        console.error('Failed to fetch routes:', response.status);
        setRoutes([]);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      setRoutes([]);
    }
  };

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem('depotToken') || localStorage.getItem('token');
      const response = await fetch('/api/driver/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Drivers API response:', data);
        if (data.success && Array.isArray(data.data)) {
          setDrivers(data.data);
        } else {
          console.warn('Unexpected drivers data structure:', data);
          setDrivers([]);
        }
      } else {
        console.error('Failed to fetch drivers:', response.status);
        setDrivers([]);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setDrivers([]);
    }
  };

  const fetchConductors = async () => {
    try {
      const token = localStorage.getItem('depotToken') || localStorage.getItem('token');
      const response = await fetch('/api/conductor/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Conductors API response:', data);
        if (data.success && Array.isArray(data.data)) {
          setConductors(data.data);
        } else {
          console.warn('Unexpected conductors data structure:', data);
          setConductors([]);
        }
      } else {
        console.error('Failed to fetch conductors:', response.status);
        setConductors([]);
      }
    } catch (error) {
      console.error('Error fetching conductors:', error);
      setConductors([]);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingSchedule ? `/api/bus-schedule/${editingSchedule._id}` : '/api/bus-schedule';
      const method = editingSchedule ? 'PUT' : 'POST';

      // Add depotId to form data for depot users
      const submitData = {
        ...formData,
        ...(depotId && { depotId })
      };

      const token = localStorage.getItem('depotToken') || localStorage.getItem('token');
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        setShowModal(false);
        setEditingSchedule(null);
        resetForm();
        fetchSchedules();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save schedule');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Failed to save schedule');
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      scheduleName: schedule.scheduleName,
      description: schedule.description || '',
      busId: schedule.busId._id,
      routeId: schedule.routeId._id,
      departureTime: schedule.departureTime,
      arrivalTime: schedule.arrivalTime,
      frequency: schedule.frequency,
      daysOfWeek: schedule.daysOfWeek || [],
      driverId: schedule.driverId?._id || '',
      conductorId: schedule.conductorId?._id || '',
      baseFare: schedule.baseFare,
      maxCapacity: schedule.maxCapacity,
      isRecurring: schedule.isRecurring,
      specialInstructions: schedule.specialInstructions || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const token = localStorage.getItem('depotToken') || localStorage.getItem('token');
      const response = await fetch(`/api/bus-schedule/${scheduleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchSchedules();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete schedule');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Failed to delete schedule');
    }
  };

  const resetForm = () => {
    setFormData({
      scheduleName: '',
      description: '',
      busId: '',
      routeId: '',
      departureTime: '',
      arrivalTime: '',
      frequency: 'daily',
      daysOfWeek: [],
      driverId: '',
      conductorId: '',
      baseFare: '',
      maxCapacity: '',
      isRecurring: false,
      specialInstructions: ''
    });
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingSchedule(null);
    resetForm();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#6b7280';
      case 'suspended': return '#f59e0b';
      case 'completed': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const formatTime = (time) => {
    return time ? time.substring(0, 5) : '';
  };

  const getDaysText = (days) => {
    if (!days || days.length === 0) return 'No days';
    if (days.length === 7) return 'Daily';
    return days.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ');
  };

  return (
    <div className="bus-scheduling">
      <div className="scheduling-header">
        <div className="header-left">
          <h2>Bus Scheduling</h2>
          <p>Manage bus schedules, routes, and timings</p>
        </div>
        <div className="header-right">
          <button 
            className="add-schedule-btn"
            onClick={() => setShowModal(true)}
          >
            <Plus size={20} />
            Add Schedule
          </button>
        </div>
      </div>

      

      <div className="scheduling-filters">
        <div className="filter-group">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search schedules..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <Filter size={20} />
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="filter-group">
          <Calendar size={20} />
          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({...filters, date: e.target.value})}
            className="date-input"
          />
        </div>
      </div>

      <div className="schedules-list">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <span>Loading schedules...</span>
          </div>
        ) : schedules.length === 0 ? (
          <div className="empty-state">
            <Calendar size={48} />
            <h3>No schedules found</h3>
            <p>Create your first bus schedule to get started</p>
          </div>
        ) : (
          <div className="schedules-grid">
            {schedules.map(schedule => (
              <div key={schedule._id} className="schedule-card">
                <div className="schedule-header">
                  <div className="schedule-title">
                    <h3>{schedule.scheduleName}</h3>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(schedule.status) }}
                    >
                      {schedule.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="schedule-actions">
                    <button 
                      className="action-btn view"
                      onClick={() => handleEdit(schedule)}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      className="action-btn edit"
                      onClick={() => handleEdit(schedule)}
                      title="Edit Schedule"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDelete(schedule._id)}
                      title="Delete Schedule"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="schedule-content">
                  <div className="schedule-info">
                    <div className="info-item">
                      <Bus size={16} />
                      <span>{schedule.busId?.busNumber || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <MapPin size={16} />
                      <span>{schedule.routeId?.routeName || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <Clock size={16} />
                      <span>{formatTime(schedule.departureTime)} - {formatTime(schedule.arrivalTime)}</span>
                    </div>
                    <div className="info-item">
                      <User size={16} />
                      <span>{schedule.driverId?.name || 'Unassigned'}</span>
                    </div>
                  </div>

                  <div className="schedule-details">
                    <div className="detail-row">
                      <span className="label">Frequency:</span>
                      <span className="value">{getDaysText(schedule.daysOfWeek)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Capacity:</span>
                      <span className="value">{schedule.maxCapacity} seats</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Base Fare:</span>
                      <span className="value">₹{schedule.baseFare}</span>
                    </div>
                    {schedule.isRecurring && (
                      <div className="detail-row">
                        <span className="label">Recurring:</span>
                        <span className="value">Yes</span>
                      </div>
                    )}
                  </div>

                  {schedule.specialInstructions && (
                    <div className="special-instructions">
                      <strong>Instructions:</strong> {schedule.specialInstructions}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}</h3>
              <button className="close-btn" onClick={handleModalClose}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="schedule-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Schedule Name *</label>
                  <input
                    type="text"
                    value={formData.scheduleName}
                    onChange={(e) => setFormData({...formData, scheduleName: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Bus *</label>
                  <select
                    value={formData.busId}
                    onChange={(e) => setFormData({...formData, busId: e.target.value})}
                    required
                  >
                    <option value="">Select Bus</option>
                    {Array.isArray(buses) && buses.map(bus => (
                      <option key={bus._id} value={bus._id}>
                        {bus.busNumber} - {bus.busType}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Route *</label>
                  <select
                    value={formData.routeId}
                    onChange={(e) => setFormData({...formData, routeId: e.target.value})}
                    required
                  >
                    <option value="">Select Route</option>
                    {Array.isArray(routes) && routes.map(route => (
                      <option key={route._id} value={route._id}>
                        {route.routeName} - {route.routeNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Departure Time *</label>
                  <input
                    type="time"
                    value={formData.departureTime}
                    onChange={(e) => setFormData({...formData, departureTime: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Arrival Time *</label>
                  <input
                    type="time"
                    value={formData.arrivalTime}
                    onChange={(e) => setFormData({...formData, arrivalTime: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Driver</label>
                  <select
                    value={formData.driverId}
                    onChange={(e) => setFormData({...formData, driverId: e.target.value})}
                  >
                    <option value="">Select Driver</option>
                    {Array.isArray(drivers) && drivers.map(driver => (
                      <option key={driver._id} value={driver._id}>
                        {driver.name} - {driver.drivingLicense?.licenseNumber || driver.employeeCode || driver.driverId}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Conductor</label>
                  <select
                    value={formData.conductorId}
                    onChange={(e) => setFormData({...formData, conductorId: e.target.value})}
                  >
                    <option value="">Select Conductor</option>
                    {Array.isArray(conductors) && conductors.map(conductor => (
                      <option key={conductor._id} value={conductor._id}>
                        {conductor.name} - {conductor.employeeCode || conductor.conductorId}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Base Fare</label>
                  <input
                    type="number"
                    value={formData.baseFare}
                    onChange={(e) => setFormData({...formData, baseFare: e.target.value})}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Max Capacity</label>
                  <input
                    type="number"
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData({...formData, maxCapacity: e.target.value})}
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>Frequency</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Days of Week</label>
                  <div className="days-checkboxes">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                      <label key={day} className="day-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.daysOfWeek.includes(day)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                daysOfWeek: [...formData.daysOfWeek, day]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                daysOfWeek: formData.daysOfWeek.filter(d => d !== day)
                              });
                            }
                          }}
                        />
                        <span>{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Special Instructions</label>
                  <textarea
                    value={formData.specialInstructions}
                    onChange={(e) => setFormData({...formData, specialInstructions: e.target.value})}
                    rows={3}
                    placeholder="Any special instructions for this schedule..."
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={handleModalClose} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusScheduling;
