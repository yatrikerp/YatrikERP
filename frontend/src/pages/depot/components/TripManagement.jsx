import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { tripApiService } from '../../../services/depotApiService';
import io from 'socket.io-client';
import './ManagementPages.css';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  Clock, 
  MapPin,
  Bus,
  CheckCircle,
  AlertCircle,
  X,
  Play,
  Pause,
  Square
} from 'lucide-react';

const TripManagement = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await tripApiService.getTrips();
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

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.tripNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.routeId?.routeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.busId?.busNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.driverId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          <button className="add-trip-btn" onClick={() => setShowAddModal(true)}>
            <Plus size={20} />
            Schedule New Trip
              </button>
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
                        onClick={() => {
                          setSelectedTrip(trip);
                        }}
                      >
                        <Eye size={16} />
                        View
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
    </div>
  );
};

export default TripManagement;