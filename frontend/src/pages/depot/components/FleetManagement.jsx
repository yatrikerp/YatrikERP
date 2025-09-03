import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import SmartNotifications from '../../../components/Common/SmartNotifications';
import './FleetManagement.css';
import { apiFetch } from '../../../utils/api';

const FleetManagement = () => {
  const { user } = useAuth();
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [stats, setStats] = useState({
    totalBuses: 0,
    availableBuses: 0,
    maintenanceBuses: 0,
    activeBuses: 0
  });

  // Form states
  const [formData, setFormData] = useState({
    busNumber: '',
    registrationNumber: '',
    busType: 'ac_seater',
    capacity: {
      total: 0,
      sleeper: 0,
      seater: 0,
      ladies: 0,
      disabled: 0
    },
    amenities: [],
    specifications: {
      manufacturer: '',
      model: '',
      year: new Date().getFullYear(),
      engine: '',
      fuelType: 'diesel',
      mileage: 0,
      maxSpeed: 0,
      length: 0,
      width: 0,
      height: 0
    },
    notes: ''
  });

  const busTypes = [
    { value: 'ac_sleeper', label: 'AC Sleeper' },
    { value: 'ac_seater', label: 'AC Seater' },
    { value: 'non_ac_sleeper', label: 'Non-AC Sleeper' },
    { value: 'non_ac_seater', label: 'Non-AC Seater' },
    { value: 'volvo', label: 'Volvo' },
    { value: 'mini', label: 'Mini Bus' }
  ];

  const amenities = [
    { value: 'wifi', label: 'WiFi' },
    { value: 'charging', label: 'Charging Points' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'refreshments', label: 'Refreshments' },
    { value: 'toilet', label: 'Toilet' },
    { value: 'ac', label: 'Air Conditioning' },
    { value: 'heating', label: 'Heating' }
  ];

  const fuelTypes = [
    { value: 'diesel', label: 'Diesel' },
    { value: 'petrol', label: 'Petrol' },
    { value: 'cng', label: 'CNG' },
    { value: 'electric', label: 'Electric' },
    { value: 'hybrid', label: 'Hybrid' }
  ];

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/depot/buses');
      if (res.ok) {
        setBuses(res.data?.data?.buses || []);
        setStats(res.data?.data?.stats || {});
      } else {
        console.error('Failed to load buses:', res.status, res.message);
      }
    } catch (error) {
      console.error('Error fetching buses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBus = async (e) => {
    e.preventDefault();
    
    // Validate form data before sending
    if (!formData.busNumber || !formData.registrationNumber || !formData.busType || !formData.capacity.total) {
      alert('Please fill in all required fields: Bus Number, Registration Number, Bus Type, and Total Capacity');
      return;
    }
    
    try {
      const response = await apiFetch('/api/depot/buses', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowAddModal(false);
        resetForm();
        fetchBuses();
        alert('Bus added successfully!');
      } else {
        const err = response.message || 'Failed to add bus';
        alert(err);
      }
    } catch (error) {
      console.error('Error adding bus:', error);
      alert('Failed to add bus');
    }
  };

  const handleEditBus = async (e) => {
    e.preventDefault();
    try {
      const response = await apiFetch(`/api/depot/buses/${selectedBus._id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowEditModal(false);
        resetForm();
        fetchBuses();
      } else {
        alert(response.message || 'Failed to update bus');
      }
    } catch (error) {
      console.error('Error updating bus:', error);
      alert('Failed to update bus');
    }
  };

  const handleDeleteBus = async () => {
    try {
      const response = await apiFetch(`/api/depot/buses/${selectedBus._id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setSelectedBus(null);
        fetchBuses();
      } else {
        alert(response.message || 'Failed to delete bus');
      }
    } catch (error) {
      console.error('Error deleting bus:', error);
      alert('Failed to delete bus');
    }
  };

  const resetForm = () => {
    setFormData({
      busNumber: '',
      registrationNumber: '',
      busType: 'ac_seater',
      capacity: {
        total: 0,
        sleeper: 0,
        seater: 0,
        ladies: 0,
        disabled: 0
      },
      amenities: [],
      specifications: {
        manufacturer: '',
        model: '',
        year: new Date().getFullYear(),
        engine: '',
        fuelType: 'diesel',
        mileage: 0,
        maxSpeed: 0,
        length: 0,
        width: 0,
        height: 0
      },
      notes: ''
    });
  };

  const openEditModal = (bus) => {
    setSelectedBus(bus);
    setFormData({
      busNumber: bus.busNumber,
      registrationNumber: bus.registrationNumber,
      busType: bus.busType,
      capacity: bus.capacity || { total: 0, sleeper: 0, seater: 0, ladies: 0, disabled: 0 },
      amenities: bus.amenities || [],
      specifications: bus.specifications || {
        manufacturer: '',
        model: '',
        year: new Date().getFullYear(),
        engine: '',
        fuelType: 'diesel',
        mileage: 0,
        maxSpeed: 0,
        length: 0,
        width: 0,
        height: 0
      },
      notes: bus.notes || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (bus) => {
    setSelectedBus(bus);
    setShowDeleteModal(true);
  };

  const filteredBuses = buses.filter(bus => {
    const matchesSearch = bus.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bus.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || bus.status === filterStatus;
    const matchesType = filterType === 'all' || bus.busType === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'maintenance': return 'orange';
      case 'retired': return 'red';
      case 'suspended': return 'gray';
      default: return 'gray';
    }
  };

  const getBusTypeLabel = (type) => {
    return busTypes.find(bt => bt.value === type)?.label || type;
  };

  if (loading) {
    return (
      <div className="fleet-loading">
        <div className="loading-spinner"></div>
        <h3>Loading Fleet Management...</h3>
      </div>
    );
  }

  return (
    <div className="fleet-management">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Fleet Management</h1>
          <p>Manage your depot's bus fleet, track maintenance, and monitor vehicle status</p>
        </div>
        <div className="header-actions">
          <button 
            className="action-btn"
            onClick={() => setShowAddModal(true)}
          >
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add New Bus
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-section">
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{stats.totalBuses}</div>
              <div className="kpi-label">Total Buses</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{stats.availableBuses}</div>
              <div className="kpi-label">Available</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{stats.maintenanceBuses}</div>
              <div className="kpi-label">In Maintenance</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{stats.activeBuses}</div>
              <div className="kpi-label">Active Trips</div>
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
            placeholder="Search by bus number or registration..."
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
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            {busTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Buses Table */}
      <div className="table-section">
        <div className="table-container">
          <table className="data-table">
          <thead>
            <tr>
              <th>Bus Number</th>
              <th>Registration</th>
              <th>Type</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Last Maintenance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBuses.map((bus) => (
              <tr key={bus._id}>
                <td>
                  <div className="bus-info">
                    <div className="bus-number">{bus.busNumber}</div>
                    <div className="bus-id">ID: {bus._id.slice(-6)}</div>
                  </div>
                </td>
                <td>{bus.registrationNumber}</td>
                <td>
                  <span className="bus-type-badge">
                    {getBusTypeLabel(bus.busType)}
                  </span>
                </td>
                <td>
                  <div className="capacity-info">
                    <span className="capacity-total">{bus.capacity?.total || 0}</span>
                    <span className="capacity-detail">
                      {bus.capacity?.seater || 0}S / {bus.capacity?.sleeper || 0}SL
                    </span>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${getStatusColor(bus.status)}`}>
                    {bus.status}
                  </span>
                </td>
                <td>
                  {bus.lastMaintenance ? 
                    new Date(bus.lastMaintenance).toLocaleDateString() : 
                    'N/A'
                  }
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="action-btn view"
                      onClick={() => openEditModal(bus)}
                      title="View/Edit"
                    >
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => openDeleteModal(bus)}
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

        {filteredBuses.length === 0 && (
          <div className="no-data">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
            <h3>No buses found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
        </div>
      </div>

      {/* Add Bus Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Bus</h2>
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
            <form onSubmit={handleAddBus} className="bus-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Bus Number *</label>
                  <input
                    type="text"
                    value={formData.busNumber}
                    onChange={(e) => setFormData({...formData, busNumber: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Registration Number *</label>
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Bus Type *</label>
                  <select
                    value={formData.busType}
                    onChange={(e) => setFormData({...formData, busType: e.target.value})}
                    required
                  >
                    {busTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Total Capacity *</label>
                  <input
                    type="number"
                    value={formData.capacity.total}
                    onChange={(e) => setFormData({
                      ...formData, 
                      capacity: {...formData.capacity, total: parseInt(e.target.value)}
                    })}
                    required
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>Seater Capacity</label>
                  <input
                    type="number"
                    value={formData.capacity.seater}
                    onChange={(e) => setFormData({
                      ...formData, 
                      capacity: {...formData.capacity, seater: parseInt(e.target.value)}
                    })}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Sleeper Capacity</label>
                  <input
                    type="number"
                    value={formData.capacity.sleeper}
                    onChange={(e) => setFormData({
                      ...formData, 
                      capacity: {...formData.capacity, sleeper: parseInt(e.target.value)}
                    })}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Amenities</h3>
                <div className="amenities-grid">
                  {amenities.map(amenity => (
                    <label key={amenity.value} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(amenity.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              amenities: [...formData.amenities, amenity.value]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              amenities: formData.amenities.filter(a => a !== amenity.value)
                            });
                          }
                        }}
                      />
                      <span>{amenity.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <h3>Specifications</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Manufacturer</label>
                    <input
                      type="text"
                      value={formData.specifications.manufacturer}
                      onChange={(e) => setFormData({
                        ...formData,
                        specifications: {...formData.specifications, manufacturer: e.target.value}
                      })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Model</label>
                    <input
                      type="text"
                      value={formData.specifications.model}
                      onChange={(e) => setFormData({
                        ...formData,
                        specifications: {...formData.specifications, model: e.target.value}
                      })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Year</label>
                    <input
                      type="number"
                      value={formData.specifications.year}
                      onChange={(e) => setFormData({
                        ...formData,
                        specifications: {...formData.specifications, year: parseInt(e.target.value)}
                      })}
                      min="1900"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>

                  <div className="form-group">
                    <label>Fuel Type</label>
                    <select
                      value={formData.specifications.fuelType}
                      onChange={(e) => setFormData({
                        ...formData,
                        specifications: {...formData.specifications, fuelType: e.target.value}
                      })}
                    >
                      {fuelTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
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
                  Add Bus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Bus Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Bus - {selectedBus?.busNumber}</h2>
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
            <form onSubmit={handleEditBus} className="bus-form">
              {/* Same form fields as Add Modal */}
              <div className="form-grid">
                <div className="form-group">
                  <label>Bus Number *</label>
                  <input
                    type="text"
                    value={formData.busNumber}
                    onChange={(e) => setFormData({...formData, busNumber: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Registration Number *</label>
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Bus Type *</label>
                  <select
                    value={formData.busType}
                    onChange={(e) => setFormData({...formData, busType: e.target.value})}
                    required
                  >
                    {busTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Total Capacity *</label>
                  <input
                    type="number"
                    value={formData.capacity.total}
                    onChange={(e) => setFormData({
                      ...formData, 
                      capacity: {...formData.capacity, total: parseInt(e.target.value)}
                    })}
                    required
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>Seater Capacity</label>
                  <input
                    type="number"
                    value={formData.capacity.seater}
                    onChange={(e) => setFormData({
                      ...formData, 
                      capacity: {...formData.capacity, seater: parseInt(e.target.value)}
                    })}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Sleeper Capacity</label>
                  <input
                    type="number"
                    value={formData.capacity.sleeper}
                    onChange={(e) => setFormData({
                      ...formData, 
                      capacity: {...formData.capacity, sleeper: parseInt(e.target.value)}
                    })}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Amenities</h3>
                <div className="amenities-grid">
                  {amenities.map(amenity => (
                    <label key={amenity.value} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(amenity.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              amenities: [...formData.amenities, amenity.value]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              amenities: formData.amenities.filter(a => a !== amenity.value)
                            });
                          }
                        }}
                      />
                      <span>{amenity.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <h3>Specifications</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Manufacturer</label>
                    <input
                      type="text"
                      value={formData.specifications.manufacturer}
                      onChange={(e) => setFormData({
                        ...formData,
                        specifications: {...formData.specifications, manufacturer: e.target.value}
                      })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Model</label>
                    <input
                      type="text"
                      value={formData.specifications.model}
                      onChange={(e) => setFormData({
                        ...formData,
                        specifications: {...formData.specifications, model: e.target.value}
                      })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Year</label>
                    <input
                      type="number"
                      value={formData.specifications.year}
                      onChange={(e) => setFormData({
                        ...formData,
                        specifications: {...formData.specifications, year: parseInt(e.target.value)}
                      })}
                      min="1900"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>

                  <div className="form-group">
                    <label>Fuel Type</label>
                    <select
                      value={formData.specifications.fuelType}
                      onChange={(e) => setFormData({
                        ...formData,
                        specifications: {...formData.specifications, fuelType: e.target.value}
                      })}
                    >
                      {fuelTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
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
                  Update Bus
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
              <h2>Delete Bus</h2>
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
              <h3>Are you sure you want to delete this bus?</h3>
              <p>This action cannot be undone. The bus "{selectedBus?.busNumber}" will be permanently removed from your fleet.</p>
              
              <div className="bus-details">
                <div className="detail-item">
                  <span className="label">Bus Number:</span>
                  <span className="value">{selectedBus?.busNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Registration:</span>
                  <span className="value">{selectedBus?.registrationNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Type:</span>
                  <span className="value">{getBusTypeLabel(selectedBus?.busType)}</span>
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
                onClick={handleDeleteBus}
              >
                Delete Bus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetManagement;
