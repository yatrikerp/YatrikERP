import React, { useState, useEffect } from 'react';
import { 
  Bus, 
  Route, 
  Clock, 
  MapPin, 
  Play, 
  Square, 
  Pause,
  Navigation,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Settings,
  RefreshCw,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  ChevronRight,
  ChevronDown,
  Star,
  StarOff,
  TrendingUp,
  Activity,
  Search
} from 'lucide-react';

const TripManagement = () => {
  const [trips, setTrips] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [viewMode, setViewMode] = useState('assigned');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedTrips, setExpandedTrips] = useState(new Set());

  // Mock trips data
  useEffect(() => {
    const mockTrips = [
      {
        id: 'T001',
        route: 'Kochi-Thiruvananthapuram Express',
        routeCode: 'KL001',
        bus: 'KL-BUS-001',
        driver: 'Amit Singh',
        conductor: 'Priya Patel',
        departure: '08:00',
        arrival: '12:00',
        status: 'assigned',
        startLocation: 'Kochi Central',
        endLocation: 'Thiruvananthapuram Central',
        distance: '220 km',
        duration: '4h 00m',
        passengers: 42,
        capacity: 45,
        fare: '₹350',
        assignedDate: '2024-01-15',
        priority: 'high',
        notes: 'Express route with limited stops',
        waypoints: [
          { name: 'Alappuzha', time: '09:20', status: 'completed' },
          { name: 'Kollam', time: '10:40', status: 'completed' },
          { name: 'Thiruvananthapuram Central', time: '12:00', status: 'pending' }
        ]
      },
      {
        id: 'T002',
        route: 'Kozhikode-Kochi Coastal Route',
        routeCode: 'KL002',
        bus: 'KL-BUS-002',
        driver: 'Vikram Mehta',
        conductor: 'Rahul Sharma',
        departure: '10:00',
        arrival: '13:30',
        status: 'scheduled',
        startLocation: 'Kozhikode Central',
        endLocation: 'Kochi Central',
        distance: '180 km',
        duration: '3h 30m',
        passengers: 38,
        capacity: 45,
        fare: '₹280',
        assignedDate: '2024-01-15',
        priority: 'medium',
        notes: 'Coastal route with scenic views',
        waypoints: [
          { name: 'Thrissur', time: '11:15', status: 'pending' },
          { name: 'Ernakulam', time: '12:45', status: 'pending' },
          { name: 'Kochi Central', time: '13:30', status: 'pending' }
        ]
      },
      {
        id: 'T003',
        route: 'Thiruvananthapuram-Kozhikode Mountain Express',
        routeCode: 'KL003',
        bus: 'KL-BUS-003',
        driver: 'Sanjay Verma',
        conductor: 'Meera Iyer',
        departure: '06:00',
        arrival: '13:00',
        status: 'completed',
        startLocation: 'Thiruvananthapuram Central',
        endLocation: 'Kozhikode Central',
        distance: '380 km',
        duration: '7h 00m',
        passengers: 45,
        capacity: 45,
        fare: '₹550',
        assignedDate: '2024-01-14',
        priority: 'low',
        notes: 'Long distance route with meal break',
        waypoints: [
          { name: 'Kottayam', time: '07:30', status: 'completed' },
          { name: 'Thrissur', time: '10:00', status: 'completed' },
          { name: 'Palakkad', time: '11:30', status: 'completed' },
          { name: 'Kozhikode Central', time: '13:00', status: 'completed' }
        ]
      }
    ];

    setTrips(mockTrips);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'assigned': return Clock;
      case 'scheduled': return Calendar;
      case 'in-progress': return Play;
      case 'completed': return CheckCircle;
      case 'cancelled': return XCircle;
      default: return Info;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned': return 'var(--erp-blue)';
      case 'scheduled': return 'var(--erp-amber)';
      case 'in-progress': return 'var(--erp-green)';
      case 'completed': return 'var(--erp-green)';
      case 'cancelled': return 'var(--erp-red)';
      default: return 'var(--erp-gray-500)';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'var(--erp-red)';
      case 'medium': return 'var(--erp-amber)';
      case 'low': return 'var(--erp-green)';
      default: return 'var(--erp-gray-500)';
    }
  };

  const getWaypointStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'var(--erp-green)';
      case 'in-progress': return 'var(--erp-blue)';
      case 'pending': return 'var(--erp-gray-400)';
      default: return 'var(--erp-gray-500)';
    }
  };

  const startTrip = (tripId) => {
    setTrips(prev => 
      prev.map(trip => 
        trip.id === tripId 
          ? { ...trip, status: 'in-progress' }
          : trip
      )
    );
    setActiveTrip(tripId);
  };

  const pauseTrip = (tripId) => {
    setTrips(prev => 
      prev.map(trip => 
        trip.id === tripId 
          ? { ...trip, status: 'paused' }
          : trip
      )
    );
  };

  const endTrip = (tripId) => {
    setTrips(prev => 
      prev.map(trip => 
        trip.id === tripId 
          ? { ...trip, status: 'completed' }
          : trip
      )
    );
    setActiveTrip(null);
  };

  const toggleExpanded = (tripId) => {
    const newExpanded = new Set(expandedTrips);
    if (newExpanded.has(tripId)) {
      newExpanded.delete(tripId);
    } else {
      newExpanded.add(tripId);
    }
    setExpandedTrips(newExpanded);
  };

  const filteredTrips = trips.filter(trip => {
    const matchesView = viewMode === 'all' || trip.status === viewMode;
    const matchesSearch = trip.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.routeCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || trip.priority === filterStatus;
    return matchesView && matchesSearch && matchesFilter;
  });

  const getPassengerPercentage = (current, capacity) => {
    return Math.round((current / capacity) * 100);
  };

  return (
    <div className="trip-management-container">
      {/* Header */}
      <div className="trip-header">
        <div className="header-left">
          <h3>Trip Management System</h3>
          <p>Manage assigned trips, track progress, and monitor performance</p>
        </div>
        <div className="header-actions">
          <button className="erp-btn-primary">
            <Plus className="h-4 w-4" />
            New Trip
          </button>
          <button className="erp-btn-primary">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="erp-btn-primary">
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="view-mode-tabs">
        <button 
          className={`view-tab ${viewMode === 'all' ? 'active' : ''}`}
          onClick={() => setViewMode('all')}
        >
          All Trips
        </button>
        <button 
          className={`view-tab ${viewMode === 'assigned' ? 'active' : ''}`}
          onClick={() => setViewMode('assigned')}
        >
          Assigned
        </button>
        <button 
          className={`view-tab ${viewMode === 'scheduled' ? 'active' : ''}`}
          onClick={() => setViewMode('scheduled')}
        >
          Scheduled
        </button>
        <button 
          className={`view-tab ${viewMode === 'in-progress' ? 'active' : ''}`}
          onClick={() => setViewMode('in-progress')}
        >
          In Progress
        </button>
        <button 
          className={`view-tab ${viewMode === 'completed' ? 'active' : ''}`}
          onClick={() => setViewMode('completed')}
        >
          Completed
        </button>
      </div>

      {/* Search and Filter */}
      <div className="search-filter-bar">
        <div className="search-box">
          <Search className="h-4 w-4" />
          <input
            type="text"
            placeholder="Search trips by route or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
        <button className="erp-btn-primary" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Active Trip Banner */}
      {activeTrip && (
        <div className="active-trip-banner">
          <div className="banner-content">
            <div className="banner-icon">
              <Play className="h-6 w-6" />
            </div>
            <div className="banner-text">
              <h4>Active Trip: {trips.find(t => t.id === activeTrip)?.route}</h4>
              <p>Currently in progress - Monitor location and status</p>
            </div>
            <div className="banner-actions">
              <button className="erp-btn-primary">
                <Pause className="h-4 w-4" />
                Pause
              </button>
              <button className="erp-btn-primary" onClick={() => endTrip(activeTrip)}>
                <Square className="h-4 w-4" />
                End Trip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trips Grid */}
      <div className="trips-grid">
        {filteredTrips.length === 0 ? (
          <div className="empty-state">
            <Bus className="h-12 w-12" />
            <h4>No trips found</h4>
            <p>No trips match your current filters.</p>
          </div>
        ) : (
          filteredTrips.map(trip => {
            const StatusIcon = getStatusIcon(trip.status);
            const isExpanded = expandedTrips.has(trip.id);
            const passengerPercentage = getPassengerPercentage(trip.passengers, trip.capacity);
            
            return (
              <div key={trip.id} className={`trip-card ${trip.status} ${trip.id === activeTrip ? 'active' : ''}`}>
                <div className="trip-header">
                  <div className="trip-status">
                    <StatusIcon className="h-5 w-5" style={{ color: getStatusColor(trip.status) }} />
                    <span className="status-text">{trip.status.replace('-', ' ')}</span>
                  </div>
                  <div className="trip-priority" style={{ color: getPriorityColor(trip.priority) }}>
                    {trip.priority} Priority
                  </div>
                </div>

                <div className="trip-content">
                  <div className="trip-route">
                    <h4>{trip.route}</h4>
                    <span className="route-code">{trip.routeCode}</span>
                  </div>
                  
                  <div className="trip-details">
                    <div className="detail-row">
                      <span className="detail-label">Bus:</span>
                      <span className="detail-value">{trip.bus}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Driver:</span>
                      <span className="detail-value">{trip.driver}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Conductor:</span>
                      <span className="detail-value">{trip.conductor}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Departure:</span>
                      <span className="detail-value">{trip.departure}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Arrival:</span>
                      <span className="detail-value">{trip.arrival}</span>
                    </div>
                  </div>

                  <div className="trip-metrics">
                    <div className="metric-item">
                      <span className="metric-label">Distance</span>
                      <span className="metric-value">{trip.distance}</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Duration</span>
                      <span className="metric-value">{trip.duration}</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Passengers</span>
                      <span className="metric-value">
                        {trip.passengers}/{trip.capacity} ({passengerPercentage}%)
                      </span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Fare</span>
                      <span className="metric-value">{trip.fare}</span>
                    </div>
                  </div>

                  <div className="trip-location">
                    <div className="location-item">
                      <MapPin className="h-4 w-4" />
                      <span>{trip.startLocation}</span>
                    </div>
                    <div className="location-arrow">→</div>
                    <div className="location-item">
                      <MapPin className="h-4 w-4" />
                      <span>{trip.endLocation}</span>
                    </div>
                  </div>
                </div>

                <div className="trip-actions">
                  {trip.status === 'assigned' && (
                    <button 
                      className="erp-btn-primary start-btn"
                      onClick={() => startTrip(trip.id)}
                    >
                      <Play className="h-4 w-4" />
                      Start Trip
                    </button>
                  )}
                  
                  {trip.status === 'in-progress' && (
                    <div className="action-buttons">
                      <button className="erp-btn-primary">
                        <Pause className="h-4 w-4" />
                        Pause
                      </button>
                      <button className="erp-btn-primary" onClick={() => endTrip(trip.id)}>
                        <Square className="h-4 w-4" />
                        End Trip
                      </button>
                    </div>
                  )}

                  <button 
                    className="expand-btn"
                    onClick={() => toggleExpanded(trip.id)}
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    {isExpanded ? 'Less' : 'More'}
                  </button>
                </div>

                {isExpanded && (
                  <div className="trip-expanded">
                    <div className="expanded-section">
                      <h5>Waypoints</h5>
                      <div className="waypoints-list">
                        {trip.waypoints.map((waypoint, index) => (
                          <div key={index} className="waypoint-item">
                            <div className="waypoint-status" style={{ backgroundColor: getWaypointStatusColor(waypoint.status) }}>
                              {waypoint.status === 'completed' && <CheckCircle className="h-3 w-3" />}
                              {waypoint.status === 'in-progress' && <Activity className="h-3 w-3" />}
                              {waypoint.status === 'pending' && <Clock className="h-3 w-3" />}
                            </div>
                            <span className="waypoint-name">{waypoint.name}</span>
                            <span className="waypoint-time">{waypoint.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="expanded-section">
                      <h5>Notes</h5>
                      <p>{trip.notes}</p>
                    </div>

                    <div className="expanded-section">
                      <h5>Actions</h5>
                      <div className="expanded-actions">
                        <button className="erp-btn-primary">
                          <Eye className="h-4 w-4" />
                          View Details
                        </button>
                        <button className="erp-btn-primary">
                          <Edit className="h-4 w-4" />
                          Edit Trip
                        </button>
                        <button className="erp-btn-primary">
                          <Navigation className="h-4 w-4" />
                          Track Location
                        </button>
                        <button className="erp-btn-primary">
                          <Users className="h-4 w-4" />
                          Passenger List
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Trip Statistics */}
      <div className="trip-statistics">
        <h4>Trip Statistics</h4>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Bus className="h-6 w-6" />
            </div>
            <div className="stat-content">
              <h5>Total Trips</h5>
              <span className="stat-value">{trips.length}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Play className="h-6 w-6" />
            </div>
            <div className="stat-content">
              <h5>Active Trips</h5>
              <span className="stat-value">{trips.filter(t => t.status === 'in-progress').length}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="stat-content">
              <h5>Completed Today</h5>
              <span className="stat-value">{trips.filter(t => t.status === 'completed').length}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="stat-content">
              <h5>On-Time Rate</h5>
              <span className="stat-value">94%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripManagement;
