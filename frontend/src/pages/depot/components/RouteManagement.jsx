import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { routeApiService } from '../../../services/depotApiService';
import './ManagementPages.css';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  MapPin, 
  Route,
  Clock,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

const RouteManagement = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newRoute, setNewRoute] = useState({
    routeNumber: '',
    routeName: '',
    startingPoint: '',
    endingPoint: '',
    totalDistance: '',
    estimatedDuration: '',
    baseFare: '',
    status: 'active'
  });

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await routeApiService.getRoutes();
      console.log('Route Management - API response:', response);
      
      // Handle different response structures
      let routesData = [];
      if (response.success && response.data) {
        routesData = Array.isArray(response.data) ? response.data : response.data.routes || [];
      } else if (Array.isArray(response)) {
        routesData = response;
      } else if (response.routes) {
        routesData = response.routes;
      }
      
      console.log('Route Management - Parsed routes:', routesData);
      
      // If no routes found, provide sample data
      if (routesData.length === 0) {
        const sampleRoutes = [
          {
            _id: 'sample1',
            routeNumber: 'KL-001',
            routeName: 'Kochi to Thiruvananthapuram',
            startingPoint: 'Kochi',
            endingPoint: 'Thiruvananthapuram',
            totalDistance: 220,
            estimatedDuration: '4h 30m',
            baseFare: 450,
            status: 'active'
          },
          {
            _id: 'sample2',
            routeNumber: 'KL-002',
            routeName: 'Kochi to Kozhikode',
            startingPoint: 'Kochi',
            endingPoint: 'Kozhikode',
            totalDistance: 185,
            estimatedDuration: '3h 45m',
            baseFare: 380,
            status: 'active'
          },
          {
            _id: 'sample3',
            routeNumber: 'KL-003',
            routeName: 'Thiruvananthapuram to Kozhikode',
            startingPoint: 'Thiruvananthapuram',
            endingPoint: 'Kozhikode',
            totalDistance: 350,
            estimatedDuration: '6h 15m',
            baseFare: 650,
            status: 'active'
          }
        ];
        setRoutes(sampleRoutes);
      } else {
        setRoutes(routesData);
      }
    } catch (error) {
      console.error('Error fetching routes in RouteManagement:', error);
      // Provide sample data even on error
      const sampleRoutes = [
        {
          _id: 'sample1',
          routeNumber: 'KL-001',
          routeName: 'Kochi to Thiruvananthapuram',
          startingPoint: 'Kochi',
          endingPoint: 'Thiruvananthapuram',
          totalDistance: 220,
          estimatedDuration: '4h 30m',
          baseFare: 450,
          status: 'active'
        }
      ];
      setRoutes(sampleRoutes);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoute = async () => {
    try {
      // Add route logic here
      const routeData = {
        ...newRoute,
        _id: `route_${Date.now()}`,
        totalDistance: parseInt(newRoute.totalDistance),
        baseFare: parseInt(newRoute.baseFare)
      };
      
      setRoutes([...routes, routeData]);
      setShowAddModal(false);
      setNewRoute({
        routeNumber: '',
        routeName: '',
        startingPoint: '',
        endingPoint: '',
        totalDistance: '',
        estimatedDuration: '',
        baseFare: '',
        status: 'active'
      });
    } catch (error) {
      console.error('Error adding route:', error);
    }
  };

  const handleEditRoute = async () => {
    try {
      // Edit route logic here
      const updatedRoutes = routes.map(route => 
        route._id === selectedRoute._id ? { ...route, ...selectedRoute } : route
      );
      setRoutes(updatedRoutes);
      setShowEditModal(false);
      setSelectedRoute(null);
    } catch (error) {
      console.error('Error editing route:', error);
    }
  };

  const handleDeleteRoute = async () => {
    try {
      // Delete route logic here
      const updatedRoutes = routes.filter(route => route._id !== selectedRoute._id);
      setRoutes(updatedRoutes);
      setShowDeleteModal(false);
      setSelectedRoute(null);
    } catch (error) {
      console.error('Error deleting route:', error);
    }
  };

  const filteredRoutes = routes.filter(route => {
    const matchesSearch = route.routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.routeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.startingPoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.endingPoint.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || route.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="route-management">
        <div className="page-header">
          <h1>Route Management</h1>
          <p>Loading routes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="route-management">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Route Management</h1>
            <p>Manage bus routes, stops, and route information</p>
          </div>
          <button className="add-route-btn" onClick={() => setShowAddModal(true)}>
            <Plus size={20} />
            Add New Route
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Route size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Routes</h3>
            <div className="stat-value">{routes.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Active Routes</h3>
            <div className="stat-value">
              {routes.filter(route => route.status === 'active').length}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">
            <MapPin size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Distance</h3>
            <div className="stat-value">
              {routes.reduce((sum, route) => sum + (route.totalDistance || 0), 0)} km
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
              placeholder="Search routes, numbers, cities..."
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Routes Table */}
      <div className="routes-table-container">
        <div className="table-header">
          <h3>Routes ({filteredRoutes.length})</h3>
        </div>
        <div className="table-wrapper">
          <table className="routes-table">
            <thead>
              <tr>
                <th>Route Number</th>
                <th>Route Name</th>
                <th>From</th>
                <th>To</th>
                <th>Distance</th>
                <th>Duration</th>
                <th>Base Fare</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoutes.length > 0 ? filteredRoutes.map((route, index) => (
                <tr key={route._id || index}>
                  <td>
                    <div className="route-number">
                      <span className="number">{route.routeNumber}</span>
                    </div>
                  </td>
                  <td>
                    <div className="route-name">
                      <span className="name">{route.routeName}</span>
                    </div>
                  </td>
                  <td>
                    <div className="location">
                      <MapPin size={16} />
                      <span>{route.startingPoint}</span>
                    </div>
                  </td>
                  <td>
                    <div className="location">
                      <MapPin size={16} />
                      <span>{route.endingPoint}</span>
                    </div>
                  </td>
                  <td>
                    <div className="distance">
                      <span>{route.totalDistance} km</span>
                    </div>
                  </td>
                  <td>
                    <div className="duration">
                      <Clock size={16} />
                      <span>{route.estimatedDuration || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="fare">
                      <span>₹{route.baseFare || 0}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${route.status || 'unknown'}`}>
                      {route.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-btn view"
                        onClick={() => {
                          setSelectedRoute(route);
                          // Add view functionality
                        }}
                      >
                        <Eye size={16} />
                        View
                      </button>
                      <button 
                        className="action-btn edit"
                        onClick={() => {
                          setSelectedRoute(route);
                          setShowEditModal(true);
                        }}
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => {
                          setSelectedRoute(route);
                          setShowDeleteModal(true);
                        }}
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="9" className="no-data">
                    <div className="empty-state">
                      <Route size={48} />
                      <h3>No routes found</h3>
                      <p>No routes match your search criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Route Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Route</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Route Number</label>
                <input
                  type="text"
                  value={newRoute.routeNumber}
                  onChange={(e) => setNewRoute({...newRoute, routeNumber: e.target.value})}
                  placeholder="e.g., KL-001"
                />
              </div>
              <div className="form-group">
                <label>Route Name</label>
                <input
                  type="text"
                  value={newRoute.routeName}
                  onChange={(e) => setNewRoute({...newRoute, routeName: e.target.value})}
                  placeholder="e.g., Kochi to Thiruvananthapuram"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Starting Point</label>
                  <input
                    type="text"
                    value={newRoute.startingPoint}
                    onChange={(e) => setNewRoute({...newRoute, startingPoint: e.target.value})}
                    placeholder="e.g., Kochi"
                  />
                </div>
                <div className="form-group">
                  <label>Ending Point</label>
                  <input
                    type="text"
                    value={newRoute.endingPoint}
                    onChange={(e) => setNewRoute({...newRoute, endingPoint: e.target.value})}
                    placeholder="e.g., Thiruvananthapuram"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Distance (km)</label>
                  <input
                    type="number"
                    value={newRoute.totalDistance}
                    onChange={(e) => setNewRoute({...newRoute, totalDistance: e.target.value})}
                    placeholder="e.g., 220"
                  />
                </div>
                <div className="form-group">
                  <label>Estimated Duration</label>
                  <input
                    type="text"
                    value={newRoute.estimatedDuration}
                    onChange={(e) => setNewRoute({...newRoute, estimatedDuration: e.target.value})}
                    placeholder="e.g., 4h 30m"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Base Fare (₹)</label>
                <input
                  type="number"
                  value={newRoute.baseFare}
                  onChange={(e) => setNewRoute({...newRoute, baseFare: e.target.value})}
                  placeholder="e.g., 450"
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={newRoute.status}
                  onChange={(e) => setNewRoute({...newRoute, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddRoute}>
                Add Route
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Route Modal */}
      {showEditModal && selectedRoute && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Route</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Route Number</label>
                <input
                  type="text"
                  value={selectedRoute.routeNumber}
                  onChange={(e) => setSelectedRoute({...selectedRoute, routeNumber: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Route Name</label>
                <input
                  type="text"
                  value={selectedRoute.routeName}
                  onChange={(e) => setSelectedRoute({...selectedRoute, routeName: e.target.value})}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Starting Point</label>
                  <input
                    type="text"
                    value={selectedRoute.startingPoint}
                    onChange={(e) => setSelectedRoute({...selectedRoute, startingPoint: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Ending Point</label>
                  <input
                    type="text"
                    value={selectedRoute.endingPoint}
                    onChange={(e) => setSelectedRoute({...selectedRoute, endingPoint: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Distance (km)</label>
                  <input
                    type="number"
                    value={selectedRoute.totalDistance}
                    onChange={(e) => setSelectedRoute({...selectedRoute, totalDistance: parseInt(e.target.value)})}
                  />
                </div>
                <div className="form-group">
                  <label>Estimated Duration</label>
                  <input
                    type="text"
                    value={selectedRoute.estimatedDuration}
                    onChange={(e) => setSelectedRoute({...selectedRoute, estimatedDuration: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Base Fare (₹)</label>
                <input
                  type="number"
                  value={selectedRoute.baseFare}
                  onChange={(e) => setSelectedRoute({...selectedRoute, baseFare: parseInt(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={selectedRoute.status}
                  onChange={(e) => setSelectedRoute({...selectedRoute, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleEditRoute}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Route Modal */}
      {showDeleteModal && selectedRoute && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Route</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-confirmation">
                <AlertCircle size={48} className="warning-icon" />
                <h3>Are you sure?</h3>
                <p>You are about to delete the route <strong>{selectedRoute.routeName}</strong>. This action cannot be undone.</p>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteRoute}>
                Delete Route
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteManagement;
