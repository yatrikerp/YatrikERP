import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import './RouteNetwork.css';

const RouteNetwork = () => {
  const { user } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    totalRoutes: 0,
    activeRoutes: 0,
    inactiveRoutes: 0,
    totalDistance: 0
  });

  // Form states
  const [formData, setFormData] = useState({
    routeNumber: '',
    routeName: '',
    startingPoint: '',
    endingPoint: '',
    totalDistance: 0,
    estimatedDuration: 0,
    intermediateStops: [],
    baseFare: 0,
    features: [],
    notes: ''
  });

  const routeFeatures = [
    { value: 'ac', label: 'Air Conditioned' },
    { value: 'express', label: 'Express Service' },
    { value: 'night', label: 'Night Service' },
    { value: 'premium', label: 'Premium Service' },
    { value: 'accessible', label: 'Wheelchair Accessible' },
    { value: 'wifi', label: 'WiFi Available' }
  ];

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/depot/routes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRoutes(data.data.routes || []);
        setStats(data.data.stats || {});
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoute = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/depot/routes', {
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
        fetchRoutes();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to add route');
      }
    } catch (error) {
      console.error('Error adding route:', error);
      alert('Failed to add route');
    }
  };

  const handleEditRoute = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/depot/routes/${selectedRoute._id}`, {
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
        fetchRoutes();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update route');
      }
    } catch (error) {
      console.error('Error updating route:', error);
      alert('Failed to update route');
    }
  };

  const handleDeleteRoute = async () => {
    try {
      const response = await fetch(`/api/depot/routes/${selectedRoute._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setSelectedRoute(null);
        fetchRoutes();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete route');
      }
    } catch (error) {
      console.error('Error deleting route:', error);
      alert('Failed to delete route');
    }
  };

  const resetForm = () => {
    setFormData({
      routeNumber: '',
      routeName: '',
      startingPoint: '',
      endingPoint: '',
      totalDistance: 0,
      estimatedDuration: 0,
      intermediateStops: [],
      baseFare: 0,
      features: [],
      notes: ''
    });
  };

  const openEditModal = (route) => {
    setSelectedRoute(route);
    setFormData({
      routeNumber: route.routeNumber,
      routeName: route.routeName,
      startingPoint: route.startingPoint,
      endingPoint: route.endingPoint,
      totalDistance: route.totalDistance,
      estimatedDuration: route.estimatedDuration,
      intermediateStops: route.intermediateStops || [],
      baseFare: route.baseFare,
      features: route.features || [],
      notes: route.notes || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (route) => {
    setSelectedRoute(route);
    setShowDeleteModal(true);
  };

  const addIntermediateStop = () => {
    setFormData({
      ...formData,
      intermediateStops: [...formData.intermediateStops, { name: '', distance: 0 }]
    });
  };

  const removeIntermediateStop = (index) => {
    const newStops = formData.intermediateStops.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      intermediateStops: newStops
    });
  };

  const updateIntermediateStop = (index, field, value) => {
    const newStops = [...formData.intermediateStops];
    newStops[index] = { ...newStops[index], [field]: value };
    setFormData({
      ...formData,
      intermediateStops: newStops
    });
  };

  const filteredRoutes = routes.filter(route => {
    const matchesSearch = route.routeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.startingPoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.endingPoint.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || route.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'red';
      case 'maintenance': return 'orange';
      default: return 'gray';
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="route-loading">
        <div className="loading-spinner"></div>
        <h3>Loading Route Network...</h3>
      </div>
    );
  }

  return (
    <div className="route-network">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Route Network</h1>
          <p>Manage your depot's route network, stops, and fare structures</p>
        </div>
        <div className="header-actions">
          <button 
            className="action-btn"
            onClick={() => setShowAddModal(true)}
          >
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add New Route
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-section">
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{stats.totalRoutes}</div>
              <div className="kpi-label">Total Routes</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{stats.activeRoutes}</div>
              <div className="kpi-label">Active Routes</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{stats.inactiveRoutes}</div>
              <div className="kpi-label">Inactive Routes</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{stats.totalDistance} km</div>
              <div className="kpi-label">Total Distance</div>
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
            placeholder="Search routes, stops, or destinations..."
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Routes Table */}
      <div className="table-section">
        <div className="table-container">
          <table className="data-table">
          <thead>
            <tr>
              <th>Route Number</th>
              <th>Route Name</th>
              <th>Start - End</th>
              <th>Distance</th>
              <th>Duration</th>
              <th>Base Fare</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoutes.map((route) => (
              <tr key={route._id}>
                <td>
                  <div className="route-info">
                    <div className="route-number">{route.routeNumber}</div>
                    <div className="route-id">ID: {route._id.slice(-6)}</div>
                  </div>
                </td>
                <td>
                  <div className="route-name">{route.routeName}</div>
                  <div className="route-features">
                    {route.features?.slice(0, 2).map(feature => (
                      <span key={feature} className="feature-badge">
                        {feature}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="route-endpoints">
                    <div className="start-point">{route.startingPoint}</div>
                    <div className="end-point">{route.endingPoint}</div>
                  </div>
                </td>
                <td>
                  <div className="distance-info">
                    <span className="distance-value">{route.totalDistance}km</span>
                    <span className="stops-count">
                      {route.intermediateStops?.length || 0} stops
                    </span>
                  </div>
                </td>
                <td>
                  <div className="duration-info">
                    {formatDuration(route.estimatedDuration)}
                  </div>
                </td>
                <td>
                  <div className="fare-info">
                    ₹{route.baseFare}
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${getStatusColor(route.status)}`}>
                    {route.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="action-btn view"
                      onClick={() => openEditModal(route)}
                      title="View/Edit"
                    >
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => openDeleteModal(route)}
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

        {filteredRoutes.length === 0 && (
          <div className="no-data">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <h3>No routes found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
        </div>
      </div>

      {/* Add Route Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Route</h2>
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
            <form onSubmit={handleAddRoute} className="route-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Route Number *</label>
                  <input
                    type="text"
                    value={formData.routeNumber}
                    onChange={(e) => setFormData({...formData, routeNumber: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Route Name *</label>
                  <input
                    type="text"
                    value={formData.routeName}
                    onChange={(e) => setFormData({...formData, routeName: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Starting Point *</label>
                  <input
                    type="text"
                    value={formData.startingPoint}
                    onChange={(e) => setFormData({...formData, startingPoint: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Ending Point *</label>
                  <input
                    type="text"
                    value={formData.endingPoint}
                    onChange={(e) => setFormData({...formData, endingPoint: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Total Distance (km) *</label>
                  <input
                    type="number"
                    value={formData.totalDistance}
                    onChange={(e) => setFormData({...formData, totalDistance: parseFloat(e.target.value)})}
                    required
                    min="0"
                    step="0.1"
                  />
                </div>

                <div className="form-group">
                  <label>Estimated Duration (minutes) *</label>
                  <input
                    type="number"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData({...formData, estimatedDuration: parseInt(e.target.value)})}
                    required
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Base Fare (₹) *</label>
                  <input
                    type="number"
                    value={formData.baseFare}
                    onChange={(e) => setFormData({...formData, baseFare: parseFloat(e.target.value)})}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Route Features</h3>
                <div className="features-grid">
                  {routeFeatures.map(feature => (
                    <label key={feature.value} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.features.includes(feature.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              features: [...formData.features, feature.value]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              features: formData.features.filter(f => f !== feature.value)
                            });
                          }
                        }}
                      />
                      <span>{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <h3>Intermediate Stops</h3>
                  <button 
                    type="button" 
                    className="add-stop-btn"
                    onClick={addIntermediateStop}
                  >
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Stop
                  </button>
                </div>
                
                {formData.intermediateStops.map((stop, index) => (
                  <div key={index} className="stop-item">
                    <div className="stop-inputs">
                      <input
                        type="text"
                        placeholder="Stop name"
                        value={stop.name}
                        onChange={(e) => updateIntermediateStop(index, 'name', e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Distance from start (km)"
                        value={stop.distance}
                        onChange={(e) => updateIntermediateStop(index, 'distance', parseFloat(e.target.value))}
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <button
                      type="button"
                      className="remove-stop-btn"
                      onClick={() => removeIntermediateStop(index)}
                    >
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
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
                  Add Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Route Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Route - {selectedRoute?.routeNumber}</h2>
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
            <form onSubmit={handleEditRoute} className="route-form">
              {/* Same form fields as Add Modal */}
              <div className="form-grid">
                <div className="form-group">
                  <label>Route Number *</label>
                  <input
                    type="text"
                    value={formData.routeNumber}
                    onChange={(e) => setFormData({...formData, routeNumber: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Route Name *</label>
                  <input
                    type="text"
                    value={formData.routeName}
                    onChange={(e) => setFormData({...formData, routeName: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Starting Point *</label>
                  <input
                    type="text"
                    value={formData.startingPoint}
                    onChange={(e) => setFormData({...formData, startingPoint: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Ending Point *</label>
                  <input
                    type="text"
                    value={formData.endingPoint}
                    onChange={(e) => setFormData({...formData, endingPoint: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Total Distance (km) *</label>
                  <input
                    type="number"
                    value={formData.totalDistance}
                    onChange={(e) => setFormData({...formData, totalDistance: parseFloat(e.target.value)})}
                    required
                    min="0"
                    step="0.1"
                  />
                </div>

                <div className="form-group">
                  <label>Estimated Duration (minutes) *</label>
                  <input
                    type="number"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData({...formData, estimatedDuration: parseInt(e.target.value)})}
                    required
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Base Fare (₹) *</label>
                  <input
                    type="number"
                    value={formData.baseFare}
                    onChange={(e) => setFormData({...formData, baseFare: parseFloat(e.target.value)})}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Route Features</h3>
                <div className="features-grid">
                  {routeFeatures.map(feature => (
                    <label key={feature.value} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.features.includes(feature.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              features: [...formData.features, feature.value]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              features: formData.features.filter(f => f !== feature.value)
                            });
                          }
                        }}
                      />
                      <span>{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <h3>Intermediate Stops</h3>
                  <button 
                    type="button" 
                    className="add-stop-btn"
                    onClick={addIntermediateStop}
                  >
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Stop
                  </button>
                </div>
                
                {formData.intermediateStops.map((stop, index) => (
                  <div key={index} className="stop-item">
                    <div className="stop-inputs">
                      <input
                        type="text"
                        placeholder="Stop name"
                        value={stop.name}
                        onChange={(e) => updateIntermediateStop(index, 'name', e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Distance from start (km)"
                        value={stop.distance}
                        onChange={(e) => updateIntermediateStop(index, 'distance', parseFloat(e.target.value))}
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <button
                      type="button"
                      className="remove-stop-btn"
                      onClick={() => removeIntermediateStop(index)}
                    >
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
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
                  Update Route
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
              <h2>Delete Route</h2>
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
              <h3>Are you sure you want to delete this route?</h3>
              <p>This action cannot be undone. The route "{selectedRoute?.routeNumber}" will be permanently removed from your network.</p>
              
              <div className="route-details">
                <div className="detail-item">
                  <span className="label">Route Number:</span>
                  <span className="value">{selectedRoute?.routeNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Route Name:</span>
                  <span className="value">{selectedRoute?.routeName}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Distance:</span>
                  <span className="value">{selectedRoute?.totalDistance}km</span>
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
                onClick={handleDeleteRoute}
              >
                Delete Route
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteNetwork;
