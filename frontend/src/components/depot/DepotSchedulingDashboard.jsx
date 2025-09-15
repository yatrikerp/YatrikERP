import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, Clock, Bus, MapPin, User, Plus, Edit, Trash2, Eye, 
  Filter, Search, BarChart3, TrendingUp, CheckCircle, AlertCircle,
  RefreshCw, Download, Grid, List, MoreVertical, Users, Play, Pause,
  Settings, Bell, Star, Heart, Share2, Copy, Archive, Zap, Target,
  Activity, Shield, Award, Bookmark, Flag, MessageSquare, Phone,
  Heart as Heartbeat, Target as Bullseye, MessageCircle, PhoneCall,
  Zap as Lightning, BarChart, Users as People, TrendingUp as LineChart,
  AlertTriangle, CheckCircle2, Database, Cloud, Wifi, Bluetooth,
  Smartphone, Tablet, Monitor, Server, Cpu, HardDrive, MemoryStick,
  Router, Satellite, Radar, Navigation, Compass, Map, Globe,
  Layers, Network, WifiOff, Signal, Battery, Power, Plug,
  Lock, Unlock, Key, Fingerprint, Scan, QrCode, Camera,
  Mic, MicOff, Volume2, VolumeX, Headphones, Speaker,
  Video, VideoOff, CameraOff, Image, FileText, File,
  Folder, FolderOpen, Upload, Download as DownloadIcon,
  Send, Mail, PhoneCall as PhoneCallIcon,
  Video as VideoCall, Users as UsersIcon, UserPlus, UserMinus,
  UserCheck, UserX, Crown, Gem, Sparkles, Zap as ZapIcon,
  Flame, Sun, Moon, CloudRain, CloudSnow, Wind, Thermometer,
  Droplets, Waves, Mountain, TreePine, Leaf, Flower2,
  Bug, Shield as ShieldIcon, Sword, Crosshair, Target as TargetIcon,
  Rocket, Plane, Car, Truck, Ship, Train, Bike, Scooter,
  Navigation as NavigationIcon, Route, MapPin as MapPinIcon,
  Compass as CompassIcon, Globe as GlobeIcon, Map as MapIcon
} from 'lucide-react';
import './DepotSchedulingDashboard.css';

const DepotSchedulingDashboard = ({ depotId, user }) => {
  const [schedules, setSchedules] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [conductors, setConductors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    date: '',
    busId: '',
    routeId: ''
  });
  const [viewMode, setViewMode] = useState('grid'); // grid, list, calendar
  const [stats, setStats] = useState({
    totalSchedules: 0,
    activeSchedules: 0,
    todaySchedules: 0,
    assignedBuses: 0
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

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.date) params.append('date', filters.date);
      if (filters.busId) params.append('busId', filters.busId);
      if (filters.routeId) params.append('routeId', filters.routeId);
      
      // Add depotId parameter for depot filtering
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
        
        // Calculate stats
        const schedulesData = data.data.schedules || [];
        const today = new Date().toISOString().split('T')[0];
        const todaySchedules = schedulesData.filter(schedule => {
          const scheduleDate = new Date(schedule.validFrom).toISOString().split('T')[0];
          return scheduleDate === today && schedule.status === 'active';
        });

        setStats({
          totalSchedules: schedulesData.length,
          activeSchedules: schedulesData.filter(s => s.status === 'active').length,
          todaySchedules: todaySchedules.length,
          assignedBuses: new Set(schedulesData.map(s => s.busId?._id)).size
        });
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
        if (data.success && data.data && Array.isArray(data.data.buses)) {
          setBuses(data.data.buses);
        } else if (data.success && Array.isArray(data.data)) {
          setBuses(data.data);
        } else {
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
        if (data.success && data.data && Array.isArray(data.data.routes)) {
          setRoutes(data.data.routes);
        } else if (data.success && Array.isArray(data.data)) {
          setRoutes(data.data);
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
        if (data.success && Array.isArray(data.data)) {
          setDrivers(data.data);
        } else {
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
        if (data.success && Array.isArray(data.data)) {
          setConductors(data.data);
        } else {
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

  useEffect(() => {
    fetchSchedules();
    fetchBuses();
    fetchRoutes();
    fetchDrivers();
    fetchConductors();
  }, [fetchSchedules]);

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
    <div className="depot-scheduling-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h2>Bus Scheduling Dashboard</h2>
          <p>Manage schedules for your depot's assigned buses</p>
        </div>
        <div className="header-right">
          <div className="view-controls">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={16} />
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
            </button>
          </div>
          <button className="refresh-btn" onClick={fetchSchedules}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="export-btn">
            <Download size={16} />
            Export
          </button>
          <button 
            className="add-schedule-btn"
            onClick={() => setShowModal(true)}
          >
            <Plus size={16} />
            Add Schedule
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalSchedules}</h3>
            <p>Total Schedules</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon active">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.activeSchedules}</h3>
            <p>Active Schedules</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon today">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.todaySchedules}</h3>
            <p>Today's Schedules</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon buses">
            <Bus size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.assignedBuses}</h3>
            <p>Assigned Buses</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
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

        <div className="filter-group">
          <Bus size={20} />
          <select
            value={filters.busId}
            onChange={(e) => setFilters({...filters, busId: e.target.value})}
            className="filter-select"
          >
            <option value="">All Buses</option>
            {buses.map(bus => (
              <option key={bus._id} value={bus._id}>
                {bus.busNumber} - {bus.busType}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <MapPin size={20} />
          <select
            value={filters.routeId}
            onChange={(e) => setFilters({...filters, routeId: e.target.value})}
            className="filter-select"
          >
            <option value="">All Routes</option>
            {routes.map(route => (
              <option key={route._id} value={route._id}>
                {route.routeName} - {route.routeNumber}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Schedules List */}
      <div className="schedules-section">
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
            <button 
              className="create-first-btn"
              onClick={() => setShowModal(true)}
            >
              <Plus size={16} />
              Create Schedule
            </button>
          </div>
        ) : (
          <div className={`schedules-container ${viewMode}`}>
            {schedules.map(schedule => (
              <div key={schedule._id} className="schedule-card-advanced">
                {/* Advanced Header with Tech Features */}
                <div className="card-header-advanced">
                  <div className="header-top">
                    <div className="schedule-title-section">
                      <div className="schedule-icon-advanced">
                        <Database size={20} />
                        <div className="icon-glow"></div>
                      </div>
                      <div className="title-info">
                        <h3 className="schedule-title">{schedule.scheduleName}</h3>
                        <p className="schedule-subtitle">{schedule.description || 'Smart Bus Management'}</p>
                      </div>
                    </div>
                    <div className="tech-status-indicator">
                      <div className="status-badge">
                        <div 
                          className="status-dot"
                          style={{ backgroundColor: getStatusColor(schedule.status) }}
                        ></div>
                        <span className="status-text">{schedule.status.toUpperCase()}</span>
                      </div>
                      <div className="tech-indicators">
                        <div className="tech-indicator online">
                          <Wifi size={12} />
                        </div>
                        <div className="tech-indicator gps">
                          <Satellite size={12} />
                        </div>
                        <div className="tech-indicator battery">
                          <Battery size={12} />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Advanced Action Panel */}
                  <div className="advanced-action-panel">
                    <div className="primary-actions">
                      <button className="action-btn-advanced primary" title="Start Smart Schedule">
                        <Play size={16} />
                        <span>Start</span>
                      </button>
                      <button className="action-btn-advanced secondary" title="AI Settings">
                        <Cpu size={16} />
                        <span>AI</span>
                      </button>
                      <button className="action-btn-advanced favorite" title="Smart Analytics">
                        <Sparkles size={16} />
                        <span>Analytics</span>
                      </button>
                    </div>
                    
                    <div className="crud-actions">
                      <button className="crud-btn create" title="Create New Schedule" onClick={() => handleEdit(schedule)}>
                        <Plus size={14} />
                      </button>
                      <button className="crud-btn read" title="View Details" onClick={() => handleEdit(schedule)}>
                        <Eye size={14} />
                      </button>
                      <button className="crud-btn update" title="Edit Schedule" onClick={() => handleEdit(schedule)}>
                        <Edit size={14} />
                      </button>
                      <button className="crud-btn delete" title="Delete Schedule" onClick={() => handleDelete(schedule._id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Advanced Card Body */}
                <div className="card-body-advanced">
                  {/* Smart Info Grid */}
                  <div className="smart-info-grid">
                    <div className="smart-info-item">
                      <div className="info-icon-wrapper">
                        <Truck size={16} />
                        <div className="icon-pulse"></div>
                      </div>
                      <div className="info-content">
                        <span className="info-label">Smart Bus</span>
                        <span className="info-value">{schedule.busId?.busNumber || 'AI-Assigned'}</span>
                      </div>
                    </div>
                    <div className="smart-info-item">
                      <div className="info-icon-wrapper">
                        <NavigationIcon size={16} />
                        <div className="icon-pulse"></div>
                      </div>
                      <div className="info-content">
                        <span className="info-label">Route</span>
                        <span className="info-value">{schedule.routeId?.routeName || 'Dynamic Route'}</span>
                      </div>
                    </div>
                    <div className="smart-info-item">
                      <div className="info-icon-wrapper">
                        <Clock size={16} />
                        <div className="icon-pulse"></div>
                      </div>
                      <div className="info-content">
                        <span className="info-label">Smart Timing</span>
                        <span className="info-value">{formatTime(schedule.departureTime)} - {formatTime(schedule.arrivalTime)}</span>
                      </div>
                    </div>
                    <div className="smart-info-item">
                      <div className="info-icon-wrapper">
                        <UserCheck size={16} />
                        <div className="icon-pulse"></div>
                      </div>
                      <div className="info-content">
                        <span className="info-label">Driver</span>
                        <span className="info-value">{schedule.driverId?.name || 'AI Driver'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Action Bar */}
                  <div className="advanced-action-bar">
                    <button className="advanced-btn live">
                      <Radar size={14} />
                      <span>Live Tracking</span>
                    </button>
                    <button className="advanced-btn gps">
                      <CompassIcon size={14} />
                      <span>GPS</span>
                    </button>
                    <button className="advanced-btn comm">
                      <MessageSquare size={14} />
                      <span>Comm</span>
                    </button>
                    <button className="advanced-btn emergency">
                      <PhoneCallIcon size={14} />
                      <span>Emergency</span>
                    </button>
                    <button className="advanced-btn ai">
                      <ZapIcon size={14} />
                      <span>AI Boost</span>
                    </button>
                  </div>

                  {/* Smart Metrics */}
                  <div className="smart-metrics">
                    <div className="smart-metric-badge">
                      <Server size={14} />
                      <span>{getDaysText(schedule.daysOfWeek)}</span>
                    </div>
                    <div className="smart-metric-badge">
                      <UsersIcon size={14} />
                      <span>{schedule.maxCapacity} Smart Seats</span>
                    </div>
                    <div className="smart-metric-badge">
                      <Gem size={14} />
                      <span>₹{schedule.baseFare}</span>
                    </div>
                    {schedule.isRecurring && (
                      <div className="smart-metric-badge recurring">
                        <RefreshCw size={14} />
                        <span>AI Recurring</span>
                      </div>
                    )}
                  </div>

                  {/* Advanced Performance & Alerts */}
                  <div className="advanced-performance">
                    {schedule.specialInstructions && (
                      <div className="smart-alert-badge">
                        <AlertTriangle size={12} />
                        <span>{schedule.specialInstructions}</span>
                        <div className="alert-pulse"></div>
                      </div>
                    )}
                    <div className="smart-performance-badges">
                      <div className="smart-perf-badge">
                        <TargetIcon size={14} />
                        <span>85%</span>
                        <div className="perf-ring"></div>
                      </div>
                      <div className="smart-perf-badge">
                        <UsersIcon size={14} />
                        <span>72%</span>
                        <div className="perf-ring"></div>
                      </div>
                      <div className="smart-perf-badge">
                        <Cpu size={14} />
                        <span>98%</span>
                        <div className="perf-ring"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced Footer */}
                <div className="advanced-footer">
                  <div className="footer-tech-info">
                    <div className="tech-badge">
                      <Cloud size={12} />
                      <span>Cloud Sync</span>
                    </div>
                    <div className="tech-badge">
                      <Database size={12} />
                      <span>{new Date(schedule.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="tech-badge">
                      <ShieldIcon size={12} />
                      <span>{schedule.status}</span>
                    </div>
                  </div>
                  <div className="footer-actions">
                    <button className="tech-action-btn">
                      <Fingerprint size={14} />
                    </button>
                    <button className="tech-action-btn">
                      <QrCode size={14} />
                    </button>
                    <button className="tech-action-btn primary">
                      <CheckCircle2 size={14} />
                    </button>
                  </div>
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
                    {buses.map(bus => (
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
                    {routes.map(route => (
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
                    {drivers.map(driver => (
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
                    {conductors.map(conductor => (
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

export default DepotSchedulingDashboard;
