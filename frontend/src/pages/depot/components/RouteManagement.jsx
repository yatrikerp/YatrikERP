import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { routeApiService } from '../../../services/depotApiService';
import './ManagementPages.css';
import { 
  Plus, 
  Search, 
  Trash2, 
  Route,
  CheckCircle,
  AlertCircle,
  X,
  Download,
  Upload,
  RefreshCw,
  BarChart3,
  Star,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Loader2,
  Target,
  Activity
} from 'lucide-react';

const RouteManagement = () => {
  // Core state
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Selection and editing
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedRoutes, setSelectedRoutes] = useState([]);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [distanceFilter, setDistanceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('routeName');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Analytics
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // New route form
  const [newRoute, setNewRoute] = useState({
    routeNumber: '',
    routeName: '',
    startingPoint: '',
    endingPoint: '',
    totalDistance: '',
    estimatedDuration: '',
    baseFare: '',
    status: 'active',
    description: '',
    stops: [],
    amenities: [],
    frequency: 'hourly',
    capacity: 50
  });
  
  // Advanced features
  const [isBulkMode, setIsBulkMode] = useState(false);
  
  // Real-time updates
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [connectionStatus] = useState('connected');

  useEffect(() => {
    fetchRoutes();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Computed properties with useMemo for performance
  const routeStats = useMemo(() => {
    const totalRoutes = routes.length;
    const activeRoutes = routes.filter(route => route.status === 'active').length;
    const totalDistance = routes.reduce((sum, route) => sum + (route.totalDistance || 0), 0);
    const averageFare = routes.length > 0 
      ? routes.reduce((sum, route) => sum + (route.baseFare || 0), 0) / routes.length 
      : 0;
    const popularRoutes = routes
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 3);
    
    return {
      totalRoutes,
      activeRoutes,
      totalDistance,
      averageFare,
      popularRoutes,
      inactiveRoutes: totalRoutes - activeRoutes
    };
  }, [routes]);

  // Enhanced filtered and sorted routes
  const filteredRoutes = useMemo(() => {
    let filtered = routes.filter(route => {
      const matchesSearch = route.routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           route.routeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           route.startingPoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           route.endingPoint.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || route.status === statusFilter;
      
      const matchesDistance = (() => {
        if (distanceFilter === 'all') return true;
        const distance = route.totalDistance || 0;
        switch (distanceFilter) {
          case 'short': return distance < 100;
          case 'medium': return distance >= 100 && distance <= 300;
          case 'long': return distance > 300;
          default: return true;
        }
      })();
      
      return matchesSearch && matchesStatus && matchesDistance;
    });

    // Sort routes
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [routes, searchTerm, statusFilter, distanceFilter, sortBy, sortOrder]);

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
      
      // If no routes found, provide enhanced sample data
      if (routesData.length === 0) {
        const sampleRoutes = [
          {
            _id: 'route_7dfe62',
            routeNumber: 'RT1001',
            routeName: 'National Express',
            routeId: '7dfe62',
            startingPoint: 'Kochi Central',
            endingPoint: 'Thiruvananthapuram Central',
            totalDistance: 220,
            estimatedDuration: '4h 30m',
            baseFare: 450,
            status: 'active',
            description: 'Premium express service connecting major cities',
            popularity: 95,
            rating: 4.8,
            amenities: ['AC', 'WiFi', 'Charging Points', 'Snacks'],
            frequency: 'Every 30 minutes',
            capacity: 50,
            stops: ['Alleppey', 'Kollam', 'Varkala'],
            lastUpdated: new Date(),
            bookings: 1250,
            revenue: 562500,
            totalStops: 8,
            routeType: 'Express',
            busType: 'AC Seater',
            lastMaintenance: '2024-01-15',
            nextMaintenance: '2024-02-15',
            assignedBuses: ['KL-76-AB-5114', 'KL-76-BC-9076'],
            driver: 'Rajesh Kumar',
            conductor: 'Anil Kumar',
            crewStatus: 'assigned'
          },
          {
            _id: 'route_7dfe64',
            routeNumber: 'RT1002',
            routeName: 'Kochi to Kozhikode',
            routeId: '7dfe64',
            startingPoint: 'Kochi Central',
            endingPoint: 'Kozhikode Central',
            totalDistance: 185,
            estimatedDuration: '3h 45m',
            baseFare: 380,
            status: 'active',
            description: 'Fast intercity connection with scenic views',
            popularity: 88,
            rating: 4.6,
            amenities: ['AC', 'WiFi', 'Refreshments'],
            frequency: 'Every 45 minutes',
            capacity: 45,
            stops: ['Thrissur', 'Palakkad', 'Malappuram'],
            lastUpdated: new Date(),
            bookings: 980,
            revenue: 372400,
            totalStops: 6,
            routeType: 'Semi-Express',
            busType: 'AC Sleeper',
            lastMaintenance: '2024-01-10',
            nextMaintenance: '2024-02-10',
            assignedBuses: ['KL-76-CD-9722'],
            driver: 'Nidhin Shijo',
            conductor: 'Sunitha Raj',
            crewStatus: 'assigned'
          },
          {
            _id: 'route_7dfe66',
            routeNumber: 'RT1003',
            routeName: 'Mumbai-Nagpur Direct',
            routeId: '7dfe66',
            startingPoint: 'Mumbai Central',
            endingPoint: 'Nagpur Central',
            totalDistance: 850,
            estimatedDuration: '12h 30m',
            baseFare: 1200,
            status: 'maintenance',
            description: 'Long distance overnight service',
            popularity: 82,
            rating: 4.4,
            amenities: ['AC', 'WiFi', 'Refreshments', 'Restroom'],
            frequency: 'Daily 2 trips',
            capacity: 40,
            stops: ['Pune', 'Aurangabad', 'Akola'],
            lastUpdated: new Date(),
            bookings: 750,
            revenue: 900000,
            totalStops: 5,
            routeType: 'Deluxe',
            busType: 'AC Sleeper',
            lastMaintenance: '2024-01-20',
            nextMaintenance: '2024-01-25',
            assignedBuses: ['KL-76-EF-1234'],
            driver: 'Ramesh Kumar',
            conductor: 'Suresh Kumar',
            crewStatus: 'maintenance'
          },
          {
            _id: 'route_7dfe68',
            routeNumber: 'RT1004',
            routeName: 'Mountain Express',
            routeId: '7dfe68',
            startingPoint: 'Munnar',
            endingPoint: 'Kochi',
            totalDistance: 130,
            estimatedDuration: '3h 15m',
            baseFare: 320,
            status: 'active',
            description: 'Picturesque mountain route with scenic views',
            popularity: 75,
            rating: 4.7,
            amenities: ['AC', 'WiFi', 'Scenic Views'],
            frequency: 'Every 2 hours',
            capacity: 35,
            stops: ['Devikulam', 'Mattupetty', 'Top Station'],
            lastUpdated: new Date(),
            bookings: 420,
            revenue: 134400,
            totalStops: 4,
            routeType: 'Tourist',
            busType: 'Non-AC Seater',
            lastMaintenance: '2024-01-12',
            nextMaintenance: '2024-02-12',
            assignedBuses: ['KL-76-GH-5678'],
            driver: 'Assign',
            conductor: 'Assign',
            crewStatus: 'unassigned'
          },
          {
            _id: 'route_7dfe70',
            routeNumber: 'RT1005',
            routeName: 'Coastal Highway',
            routeId: '7dfe70',
            startingPoint: 'Kannur',
            endingPoint: 'Kochi',
            totalDistance: 280,
            estimatedDuration: '5h 30m',
            baseFare: 520,
            status: 'inactive',
            description: 'Long coastal journey with multiple stops',
            popularity: 65,
            rating: 4.2,
            amenities: ['AC', 'WiFi', 'Refreshments'],
            frequency: 'Every 90 minutes',
            capacity: 50,
            stops: ['Thalassery', 'Kozhikode', 'Thrissur'],
            lastUpdated: new Date(),
            bookings: 320,
            revenue: 166400,
            totalStops: 7,
            routeType: 'Regular',
            busType: 'AC Seater',
            lastMaintenance: '2024-01-08',
            nextMaintenance: '2024-02-08',
            assignedBuses: [],
            driver: 'N/A',
            conductor: 'N/A',
            crewStatus: 'unassigned'
          },
          {
            _id: 'route_7dfe72',
            routeNumber: 'RT1006',
            routeName: 'Bangalore Express',
            routeId: '7dfe72',
            startingPoint: 'Bangalore',
            endingPoint: 'Chennai',
            totalDistance: 350,
            estimatedDuration: '6h 15m',
            baseFare: 650,
            status: 'active',
            description: 'High-speed interstate connection',
            popularity: 92,
            rating: 4.9,
            amenities: ['AC', 'WiFi', 'Charging Points', 'Meals'],
            frequency: 'Every 2 hours',
            capacity: 48,
            stops: ['Kolar', 'Vellore', 'Kanchipuram'],
            lastUpdated: new Date(),
            bookings: 1100,
            revenue: 715000,
            totalStops: 6,
            routeType: 'Premium',
            busType: 'AC Seater',
            lastMaintenance: '2024-01-18',
            nextMaintenance: '2024-02-18',
            assignedBuses: ['KL-76-IJ-9012'],
            driver: 'Vijay Kumar',
            conductor: 'Manoj Kumar',
            crewStatus: 'assigned'
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

  // Modern callback functions with useCallback for performance
  const handleAddRoute = useCallback(async () => {
    try {
      setLoading(true);
      const routeData = {
        ...newRoute,
        _id: `route_${Date.now()}`,
        totalDistance: parseInt(newRoute.totalDistance),
        baseFare: parseInt(newRoute.baseFare),
        popularity: Math.floor(Math.random() * 100),
        rating: 4.0 + Math.random() * 1,
        bookings: 0,
        revenue: 0,
        lastUpdated: new Date()
      };
      
      setRoutes(prev => [...prev, routeData]);
      setShowAddModal(false);
      setNewRoute({
        routeNumber: '',
        routeName: '',
        startingPoint: '',
        endingPoint: '',
        totalDistance: '',
        estimatedDuration: '',
        baseFare: '',
        status: 'active',
        description: '',
        stops: [],
        amenities: [],
        frequency: 'hourly',
        capacity: 50
      });
    } catch (error) {
      console.error('Error adding route:', error);
    } finally {
      setLoading(false);
    }
  }, [newRoute]);

  const handleEditRoute = useCallback(async () => {
    try {
      setLoading(true);
      const updatedRoutes = routes.map(route => 
        route._id === selectedRoute._id 
          ? { ...route, ...selectedRoute, lastUpdated: new Date() } 
          : route
      );
      setRoutes(updatedRoutes);
      setShowEditModal(false);
      setSelectedRoute(null);
    } catch (error) {
      console.error('Error editing route:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedRoute, routes]);

  const handleDeleteRoute = useCallback(async () => {
    try {
      setLoading(true);
      const updatedRoutes = routes.filter(route => route._id !== selectedRoute._id);
      setRoutes(updatedRoutes);
      setShowDeleteModal(false);
      setSelectedRoute(null);
    } catch (error) {
      console.error('Error deleting route:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedRoute, routes]);

  const handleBulkDelete = useCallback(async () => {
    try {
      setLoading(true);
      const updatedRoutes = routes.filter(route => !selectedRoutes.includes(route._id));
      setRoutes(updatedRoutes);
      setSelectedRoutes([]);
      setIsBulkMode(false);
    } catch (error) {
      console.error('Error bulk deleting routes:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedRoutes, routes]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRoutes();
    setRefreshing(false);
  }, []);

  const handleSort = useCallback((column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  }, [sortBy, sortOrder]);

  const handleRouteSelect = useCallback((route, checked) => {
    if (checked) {
      setSelectedRoutes(prev => [...prev, route._id]);
    } else {
      setSelectedRoutes(prev => prev.filter(id => id !== route._id));
    }
  }, []);

  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      setSelectedRoutes(filteredRoutes.map(route => route._id));
    } else {
      setSelectedRoutes([]);
    }
  }, [filteredRoutes]);

  // Remove old filteredRoutes definition as it's now computed with useMemo above

  if (loading) {
    return (
      <div className="route-management">
        <div className="page-header">
          <div className="header-content">
            <div className="header-text">
              <h1>Route Management</h1>
              <p>Loading routes...</p>
            </div>
          </div>
        </div>
        <div className="loading-container">
          <Loader2 className="animate-spin" size={48} />
          <p>Fetching route data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="route-management modern-ui">
      {/* Enhanced Page Header */}
      <div className="page-header enhanced">
        <div className="header-content">
          <div className="header-text">
            <div className="header-title">
              <h1>
                <Route className="header-icon" size={32} />
                Route Management
              </h1>
              <div className="header-subtitle">
                <p>Manage bus routes, stops, and route information with advanced analytics</p>
                <div className="header-meta">
                  <span className="last-updated">
                    <Activity size={14} />
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                  <span className={`connection-status ${connectionStatus}`}>
                    <div className="status-indicator"></div>
                    {connectionStatus === 'connected' ? 'Live' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <div className="action-group">
              <button 
                className="action-btn secondary"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={refreshing ? 'animate-spin' : ''} size={16} />
                Refresh
              </button>
              <button 
                className="action-btn secondary"
                onClick={() => console.log('Import functionality coming soon')}
              >
                <Upload size={16} />
                Import
              </button>
              <button 
                className="action-btn secondary"
                onClick={() => console.log('Export functionality coming soon')}
              >
                <Download size={16} />
                Export
              </button>
              <button 
                className="action-btn primary"
                onClick={() => setShowAddModal(true)}
              >
                <Plus size={16} />
                Add New Route
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid - Fleet Management Style */}
      <div className="stats-grid enhanced">
        <div className="stat-card primary">
          <div className="stat-icon-container">
            <div className="stat-icon blue">
              <Route size={24} />
            </div>
          </div>
          <div className="stat-content">
            <h3>Total Routes</h3>
            <div className="stat-value">{routeStats.totalRoutes}</div>
          </div>
        </div>
        
        <div className="stat-card success">
          <div className="stat-icon-container">
            <div className="stat-icon green">
              <CheckCircle size={24} />
            </div>
          </div>
          <div className="stat-content">
            <h3>Active Routes</h3>
            <div className="stat-value">{routeStats.activeRoutes}</div>
          </div>
        </div>
        
        <div className="stat-card warning">
          <div className="stat-icon-container">
            <div className="stat-icon yellow">
              <AlertCircle size={24} />
            </div>
          </div>
          <div className="stat-content">
            <h3>In Maintenance</h3>
            <div className="stat-value">
              {routes.filter(route => route.status === 'maintenance').length}
            </div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon-container">
            <div className="stat-icon purple">
              <BarChart3 size={24} />
            </div>
          </div>
          <div className="stat-content">
            <h3>Active Trips</h3>
            <div className="stat-value">
              {routes.filter(route => route.status === 'active' && route.assignedBuses?.length > 0).length}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filter Bar - Fleet Management Style */}
      <div className="search-filter-bar enhanced">
        <div className="search-section">
          <div className="search-input-container">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search routes, registration, crew..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search"
                onClick={() => setSearchTerm('')}
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <div className="filter-controls">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
            
            <select
              value={distanceFilter}
              onChange={(e) => setDistanceFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="express">Express</option>
              <option value="semi-express">Semi-Express</option>
              <option value="regular">Regular</option>
              <option value="deluxe">Deluxe</option>
              <option value="tourist">Tourist</option>
            </select>
            
            <select className="filter-select">
              <option value="all">All Crew Status</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
              <option value="maintenance">Maintenance</option>
            </select>
            
            <select className="filter-select">
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
          </div>
        </div>
        
        <div className="view-controls">
          <div className="toggle-buttons">
            <button className={`toggle-btn ${statusFilter === 'all' ? 'active' : ''}`}>
              All Routes
            </button>
            <button className={`toggle-btn ${statusFilter === 'active' ? 'active' : ''}`}>
              Active Only
            </button>
            <button className="toggle-btn">
              <Star size={16} />
            </button>
          </div>
          
          <div className="bulk-actions">
            {isBulkMode && selectedRoutes.length > 0 && (
              <div className="bulk-controls">
                <span className="selected-count">
                  {selectedRoutes.length} selected
                </span>
                <button 
                  className="bulk-action-btn danger"
                  onClick={handleBulkDelete}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            )}
            <button 
              className={`bulk-toggle ${isBulkMode ? 'active' : ''}`}
              onClick={() => {
                setIsBulkMode(!isBulkMode);
                setSelectedRoutes([]);
              }}
            >
              <Target size={16} />
              Bulk Select
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Routes Table */}
      <div className="routes-table-container enhanced">
        <div className="table-header">
          <div className="table-title">
            <h3>Routes ({filteredRoutes.length})</h3>
            <div className="table-subtitle">
              <span>Showing {filteredRoutes.length} of {routes.length} routes</span>
              {searchTerm && (
                <span className="search-indicator">
                  Filtered by: "{searchTerm}"
                </span>
              )}
            </div>
          </div>
          <div className="table-actions">
            <button 
              className="analytics-btn"
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              <BarChart3 size={16} />
              Analytics
            </button>
          </div>
        </div>
        
        {showAnalytics && (
          <div className="analytics-panel">
            <div className="analytics-grid">
              <div className="analytics-card">
                <h4>Popular Routes</h4>
                <div className="popular-routes">
                  {routeStats.popularRoutes.map((route, index) => (
                    <div key={route._id} className="popular-route">
                      <span className="rank">#{index + 1}</span>
                      <span className="name">{route.routeName}</span>
                      <span className="popularity">{route.popularity}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="analytics-card">
                <h4>Revenue Summary</h4>
                <div className="revenue-stats">
                  <div className="revenue-item">
                    <span className="label">Total Revenue</span>
                    <span className="value">
                      ₹{routes.reduce((sum, route) => sum + (route.revenue || 0), 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="revenue-item">
                    <span className="label">Avg. per Route</span>
                    <span className="value">
                      ₹{Math.round(routes.reduce((sum, route) => sum + (route.revenue || 0), 0) / routes.length).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="table-wrapper">
          <table className="routes-table enhanced">
            <thead>
              <tr>
                {isBulkMode && (
                  <th className="select-column">
                    <input
                      type="checkbox"
                      checked={selectedRoutes.length === filteredRoutes.length && filteredRoutes.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                )}
                <th 
                  className="sortable"
                  onClick={() => handleSort('routeNumber')}
                >
                  ROUTE NUMBER
                  {sortBy === 'routeNumber' && (
                    <span className="sort-indicator">
                      {sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  )}
                </th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('routeName')}
                >
                  ROUTE NAME
                  {sortBy === 'routeName' && (
                    <span className="sort-indicator">
                      {sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  )}
                </th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('routeType')}
                >
                  TYPE
                  {sortBy === 'routeType' && (
                    <span className="sort-indicator">
                      {sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  )}
                </th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('capacity')}
                >
                  CAPACITY
                  {sortBy === 'capacity' && (
                    <span className="sort-indicator">
                      {sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  )}
                </th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('routeNumber')}
                >
                  ROUTE
                  {sortBy === 'routeNumber' && (
                    <span className="sort-indicator">
                      {sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  )}
                </th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('driver')}
                >
                  CREW ASSIGNMENT
                  {sortBy === 'driver' && (
                    <span className="sort-indicator">
                      {sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  )}
                </th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('status')}
                >
                  STATUS
                  {sortBy === 'status' && (
                    <span className="sort-indicator">
                      {sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  )}
                </th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('lastMaintenance')}
                >
                  LAST MAINTENANCE
                  {sortBy === 'lastMaintenance' && (
                    <span className="sort-indicator">
                      {sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  )}
                </th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoutes.length > 0 ? filteredRoutes.map((route, index) => (
                <tr key={route._id || index} className="route-row">
                  {isBulkMode && (
                    <td className="select-column">
                      <input
                        type="checkbox"
                        checked={selectedRoutes.includes(route._id)}
                        onChange={(e) => handleRouteSelect(route, e.target.checked)}
                      />
                    </td>
                  )}
                  <td>
                    <div className="route-number">
                      <span className="number">{route.routeNumber}</span>
                      <span className="id">ID: {route.routeId}</span>
                    </div>
                  </td>
                  <td>
                    <div className="route-name">
                      <span className="name">{route.routeName}</span>
                    </div>
                  </td>
                  <td>
                    <div className="route-type">
                      <span className="type">{route.routeType}</span>
                      <span className="bus-type">{route.busType}</span>
                    </div>
                  </td>
                  <td>
                    <div className="capacity">
                      <span>{route.capacity} ({route.capacity}S / 0SL)</span>
                    </div>
                  </td>
                  <td>
                    <div className="route-info">
                      <span className="route-name">{route.routeName}</span>
                      <span className="route-id">Route: {route.routeNumber}</span>
                    </div>
                  </td>
                  <td>
                    <div className="crew-assignment">
                      <div className="driver">
                        <span className="label">Driver:</span>
                        {route.driver === 'Assign' ? (
                          <button className="assign-btn">+ Assign</button>
                        ) : (
                          <span className="name">{route.driver}</span>
                        )}
                      </div>
                      <div className="conductor">
                        <span className="label">Conductor:</span>
                        {route.conductor === 'Assign' ? (
                          <button className="assign-btn">+ Assign</button>
                        ) : (
                          <span className="name">{route.conductor}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="status-container">
                      <span className={`status-badge ${route.status || 'unknown'}`}>
                        {route.status === 'active' ? 'ACTIVE' : 
                         route.status === 'maintenance' ? 'MAINTENANCE' : 'INACTIVE'}
                      </span>
                      {route.status === 'maintenance' && (
                        <button className="status-action-btn">
                          <CheckCircle size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="maintenance-info">
                      <span>{route.lastMaintenance || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-btn view"
                        onClick={() => {
                          setSelectedRoute(route);
                          console.log('View details for:', route.routeName);
                        }}
                        title="View Details"
                      >
                        VIEW
                      </button>
                      <button 
                        className="action-btn edit"
                        onClick={() => {
                          setSelectedRoute(route);
                          setShowEditModal(true);
                        }}
                        title="Edit Route"
                      >
                        EDIT
                      </button>
                      <button 
                        className="action-btn maintenance"
                        onClick={() => {
                          setSelectedRoute(route);
                          console.log('Maintenance for:', route.routeName);
                        }}
                        title="Maintenance"
                      >
                        MAINTENANCE
                      </button>
                      <button 
                        className="action-btn more"
                        title="More Options"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={isBulkMode ? "11" : "10"} className="no-data">
                    <div className="empty-state">
                      <Route size={48} />
                      <h3>No routes found</h3>
                      <p>No routes match your search criteria</p>
                      <button 
                        className="clear-filters-btn"
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                          setDistanceFilter('all');
                        }}
                      >
                        Clear Filters
                      </button>
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

