import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import './FleetManagement.css';
import { apiFetch } from '../../../utils/api';
import { 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  Edit, 
  Wrench, 
  Clock, 
  MapPin,
  MoreVertical,
  CheckSquare,
  Square,
  ArrowUpDown,
  Download,
  RefreshCw,
  Play,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Grid3X3,
  List,
  Copy
} from 'lucide-react';

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
  const [sortField, setSortField] = useState('busNumber');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedBuses, setSelectedBuses] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // table, grid, list
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    totalBuses: 0,
    availableBuses: 0,
    maintenanceBuses: 0,
    activeBuses: 0
  });
  const [showActionsMenu, setShowActionsMenu] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showRouteAssignmentModal, setShowRouteAssignmentModal] = useState(false);
  const [availableRoutes, setAvailableRoutes] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  // Staff data
  const [drivers, setDrivers] = useState([]);
  const [conductors, setConductors] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

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
    assignedDriver: '',
    assignedConductor: '',
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

  // Notification helper functions
  const showNotification = (message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto remove notification after duration
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const fetchBuses = useCallback(async () => {
    try {
      setLoading(true);
      
      // Debug: Check what token is being used
      const depotToken = localStorage.getItem('depotToken');
      const token = localStorage.getItem('token');
      console.log('Debug - Tokens available:', {
        depotToken: !!depotToken,
        token: !!token,
        user: user
      });
      
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
  }, [user]);

  const fetchStaffData = async () => {
    setLoadingStaff(true);
    try {
      // Fetch drivers and conductors from admin API
      const [driversResponse, conductorsResponse] = await Promise.all([
        apiFetch('/api/admin/all-drivers'),
        apiFetch('/api/admin/all-conductors')
      ]);

      console.log('Drivers response:', driversResponse);
      console.log('Conductors response:', conductorsResponse);

      // Handle drivers response - the API returns { success: true, data: { drivers: [...] } }
      if (driversResponse?.ok && driversResponse.data?.data?.drivers) {
        setDrivers(driversResponse.data.data.drivers);
      } else if (driversResponse?.data?.drivers) {
        setDrivers(driversResponse.data.drivers);
      } else {
        console.warn('No drivers data found in response');
        setDrivers([]);
      }

      // Handle conductors response - the API returns { success: true, data: { conductors: [...] } }
      if (conductorsResponse?.ok && conductorsResponse.data?.data?.conductors) {
        setConductors(conductorsResponse.data.data.conductors);
      } else if (conductorsResponse?.data?.conductors) {
        setConductors(conductorsResponse.data.conductors);
      } else {
        console.warn('No conductors data found in response');
        setConductors([]);
      }
    } catch (error) {
      console.error('Error fetching staff data:', error);
      setDrivers([]);
      setConductors([]);
    } finally {
      setLoadingStaff(false);
    }
  };

  const fetchAvailableRoutes = useCallback(async () => {
    setLoadingRoutes(true);
    try {
      const response = await apiFetch('/api/admin/routes?status=active');
      if (response.ok && response.data?.data?.routes) {
        setAvailableRoutes(response.data.data.routes);
      } else if (response.ok && Array.isArray(response.data)) {
        setAvailableRoutes(response.data);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      showNotification('Failed to load routes', 'error');
    } finally {
      setLoadingRoutes(false);
    }
  }, []);

  useEffect(() => {
    fetchBuses();
    fetchStaffData();
    fetchAvailableRoutes();
  }, [fetchBuses, fetchAvailableRoutes]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showActionsMenu && !event.target.closest('.actions-dropdown')) {
        setShowActionsMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActionsMenu]);

  const handleAddBus = async (e) => {
    e.preventDefault();
    
    // Validate form data before sending
    if (!formData.busNumber || !formData.registrationNumber || !formData.busType || !formData.capacity.total) {
      showNotification('Please fill in all required fields: Bus Number, Registration Number, Bus Type, and Total Capacity', 'error');
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
        showNotification(`Bus ${formData.busNumber} added successfully!`, 'success');
      } else {
        const err = response.message || 'Failed to add bus';
        showNotification(err, 'error');
      }
    } catch (error) {
      console.error('Error adding bus:', error);
      showNotification('Failed to add bus. Please try again.', 'error');
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
        showNotification(`Bus ${formData.busNumber} updated successfully!`, 'success');
      } else {
        showNotification(response.message || 'Failed to update bus', 'error');
      }
    } catch (error) {
      console.error('Error updating bus:', error);
      showNotification('Failed to update bus. Please try again.', 'error');
    }
  };

  const handleDeleteBus = async () => {
    try {
      const response = await apiFetch(`/api/depot/buses/${selectedBus._id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setShowDeleteModal(false);
        const busNumber = selectedBus.busNumber;
        setSelectedBus(null);
        fetchBuses();
        showNotification(`Bus ${busNumber} deleted successfully!`, 'success');
      } else {
        showNotification(response.message || 'Failed to delete bus', 'error');
      }
    } catch (error) {
      console.error('Error deleting bus:', error);
      showNotification('Failed to delete bus. Please try again.', 'error');
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
      assignedDriver: '',
      assignedConductor: '',
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
      assignedDriver: bus.assignedDriver || '',
      assignedConductor: bus.assignedConductor || '',
      notes: bus.notes || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (bus) => {
    setSelectedBus(bus);
    setShowDeleteModal(true);
  };

  const toggleActionsMenu = (busId) => {
    setShowActionsMenu(showActionsMenu === busId ? null : busId);
  };

  const handleAdditionalAction = (action, bus) => {
    switch (action) {
      case 'duplicate':
        // Duplicate bus functionality
        showNotification(`Duplicating bus ${bus.busNumber}...`, 'info');
        console.log('Duplicate bus:', bus.busNumber);
        break;
      case 'export':
        // Export bus data
        showNotification(`Exporting data for bus ${bus.busNumber}...`, 'info');
        console.log('Export bus data:', bus.busNumber);
        break;
      case 'history':
        // View maintenance history
        showNotification(`Loading maintenance history for bus ${bus.busNumber}...`, 'info');
        console.log('View maintenance history:', bus.busNumber);
        break;
      case 'assign_route':
        // Assign route to bus
        setSelectedBus(bus);
        setShowRouteAssignmentModal(true);
        break;
      default:
        console.log('Unknown action:', action);
        break;
    }
    setShowActionsMenu(null);
  };

  const handleRouteAssignment = async (routeId) => {
    if (!selectedBus || !routeId) {
      showNotification('Please select a bus and route', 'error');
      return;
    }

    try {
      const response = await apiFetch(`/api/depot/buses/${selectedBus._id}/assign-route`, {
        method: 'POST',
        body: JSON.stringify({ routeId })
      });

      if (response.ok) {
        showNotification(`Route assigned to bus ${selectedBus.busNumber} successfully!`, 'success');
        setShowRouteAssignmentModal(false);
        fetchBuses(); // Refresh bus data
      } else {
        showNotification(response.message || 'Failed to assign route', 'error');
      }
    } catch (error) {
      console.error('Error assigning route:', error);
      showNotification('Failed to assign route. Please try again.', 'error');
    }
  };

  // Advanced filtering and sorting with useMemo for performance
  const filteredAndSortedBuses = useMemo(() => {
    let filtered = buses.filter(bus => {
      const matchesSearch = bus.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           bus.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           bus.currentTrip?.route?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || bus.status === filterStatus;
      const matchesType = filterType === 'all' || bus.busType === filterType;
      return matchesSearch && matchesStatus && matchesType;
    });

    // Advanced sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle nested properties
      if (sortField === 'route') {
        aValue = a.currentTrip?.route?.name || '';
        bValue = b.currentTrip?.route?.name || '';
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [buses, searchTerm, filterStatus, filterType, sortField, sortDirection]);

  // Pagination
  const paginatedBuses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedBuses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedBuses, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedBuses.length / itemsPerPage);

  // Bulk operations
  const handleSelectAll = useCallback(() => {
    if (selectedBuses.length === paginatedBuses.length) {
      setSelectedBuses([]);
    } else {
      setSelectedBuses(paginatedBuses.map(bus => bus._id));
    }
  }, [selectedBuses.length, paginatedBuses]);

  const handleSelectBus = useCallback((busId) => {
    setSelectedBuses(prev => 
      prev.includes(busId) 
        ? prev.filter(id => id !== busId)
        : [...prev, busId]
    );
  }, []);

  const handleBulkAction = useCallback(async (action) => {
    if (selectedBuses.length === 0) return;
    
    try {
      switch (action) {
        case 'activate':
          await Promise.all(selectedBuses.map(id => 
            apiFetch(`/api/buses/${id}`, {
              method: 'PATCH',
              body: JSON.stringify({ status: 'active' })
            })
          ));
          showNotification(`${selectedBuses.length} buses activated successfully!`, 'success');
          break;
        case 'maintenance':
          await Promise.all(selectedBuses.map(id => 
            apiFetch(`/api/buses/${id}`, {
              method: 'PATCH',
              body: JSON.stringify({ status: 'maintenance' })
            })
          ));
          showNotification(`${selectedBuses.length} buses sent to maintenance!`, 'success');
          break;
        case 'delete':
          await Promise.all(selectedBuses.map(id => 
            apiFetch(`/api/buses/${id}`, { method: 'DELETE' })
          ));
          showNotification(`${selectedBuses.length} buses deleted successfully!`, 'success');
          break;
        default:
          console.log('Unknown bulk action:', action);
          break;
      }
      setSelectedBuses([]);
      fetchBuses();
    } catch (error) {
      console.error('Bulk action failed:', error);
      showNotification('Bulk action failed. Please try again.', 'error');
    }
  }, [selectedBuses, fetchBuses]);

  // Sorting handlers
  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  // Quick status change
  const handleQuickStatusChange = useCallback(async (busId, newStatus) => {
    try {
      const bus = buses.find(b => b._id === busId);
      const busNumber = bus ? bus.busNumber : 'Unknown';
      
      await apiFetch(`/api/buses/${busId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      fetchBuses();
      
      const statusText = newStatus === 'active' ? 'activated' : 'sent to maintenance';
      showNotification(`Bus ${busNumber} ${statusText} successfully!`, 'success');
    } catch (error) {
      console.error('Status change failed:', error);
      showNotification('Failed to change bus status. Please try again.', 'error');
    }
  }, [fetchBuses, buses]);

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
      {/* Notification Container */}
      <div className="notification-container">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`notification notification-${notification.type}`}
            onClick={() => removeNotification(notification.id)}
          >
            <div className="notification-content">
              <div className="notification-icon">
                {notification.type === 'success' && <Check size={16} />}
                {notification.type === 'error' && <X size={16} />}
                {notification.type === 'info' && <Clock size={16} />}
              </div>
              <div className="notification-message">{notification.message}</div>
              <button 
                className="notification-close"
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(notification.id);
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-header">
        <div className="header-left">
          <h1>Fleet Management</h1>
        </div>
        <div className="header-actions">
          <button 
            className="action-btn blue"
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

      {/* Advanced Search and Filters */}
      <div className="search-section">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search buses, routes, registration..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="clear-search"
              onClick={() => setSearchTerm('')}
            >
              <X size={14} />
            </button>
          )}
        </div>
        
        <div className="filter-dropdowns">
          <select
            className="filter-dropdown"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
            <option value="suspended">Suspended</option>
          </select>
          
          <select
            className="filter-dropdown"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            {busTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>

          <select
            className="filter-dropdown"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>

        <div className="view-controls">
          <div className="view-modes">
            <button 
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              <List size={16} />
            </button>
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 size={16} />
            </button>
          </div>
          
          <button 
            className="refresh-btn"
            onClick={fetchBuses}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          </button>

          <button 
            className="filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            {showFilters && <span className="filter-count">3</span>}
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedBuses.length > 0 && (
        <div className="bulk-actions-bar">
          <div className="bulk-info">
            <CheckSquare size={16} />
            <span>{selectedBuses.length} selected</span>
          </div>
          <div className="bulk-actions">
            <button 
              className="bulk-btn success"
              onClick={() => handleBulkAction('activate')}
            >
              <Check size={14} />
              Activate
            </button>
            <button 
              className="bulk-btn warning"
              onClick={() => handleBulkAction('maintenance')}
            >
              <Wrench size={14} />
              Maintenance
            </button>
            <button 
              className="bulk-btn danger"
              onClick={() => handleBulkAction('delete')}
            >
              <Trash2 size={14} />
              Delete
            </button>
            <button 
              className="bulk-btn secondary"
              onClick={() => setSelectedBuses([])}
            >
              <X size={14} />
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Buses Table */}
      <div className="table-section">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th className="select-column">
                  <button 
                    className="select-all-btn"
                    onClick={handleSelectAll}
                  >
                    {selectedBuses.length === paginatedBuses.length ? 
                      <CheckSquare size={16} /> : 
                      <Square size={16} />
                    }
                  </button>
                </th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('busNumber')}
                >
                  <div className="th-content">
                    Bus Number
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('registrationNumber')}
                >
                  <div className="th-content">
                    Registration
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('busType')}
                >
                  <div className="th-content">
                    Type
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('capacity')}
                >
                  <div className="th-content">
                    Capacity
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('route')}
                >
                  <div className="th-content">
                    Route
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('status')}
                >
                  <div className="th-content">
                    Status
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th>Last Maintenance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBuses.map((bus) => (
              <tr key={bus._id} className={selectedBuses.includes(bus._id) ? 'selected' : ''}>
                <td className="select-column">
                  <button 
                    className="select-bus-btn"
                    onClick={() => handleSelectBus(bus._id)}
                  >
                    {selectedBuses.includes(bus._id) ? 
                      <CheckSquare size={14} /> : 
                      <Square size={14} />
                    }
                  </button>
                </td>
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
                  <div className="route-info">
                    <div className="route-name">
                      {bus.currentTrip?.route?.name || 'No Active Route'}
                    </div>
                    <div className="route-detail">
                      {bus.currentTrip?.route?.from?.name || 'N/A'} → {bus.currentTrip?.route?.to?.name || 'N/A'}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="status-container">
                    <span className={`status-badge ${getStatusColor(bus.status)}`}>
                      {bus.status}
                    </span>
                    <div className="quick-status-actions">
                      {bus.status !== 'active' && (
                        <button 
                          className="quick-action-btn success"
                          onClick={() => handleQuickStatusChange(bus._id, 'active')}
                          title="Activate"
                        >
                          <Play size={12} />
                        </button>
                      )}
                      {bus.status !== 'maintenance' && (
                        <button 
                          className="quick-action-btn warning"
                          onClick={() => handleQuickStatusChange(bus._id, 'maintenance')}
                          title="Maintenance"
                        >
                          <Wrench size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  {bus.lastMaintenance ? 
                    new Date(bus.lastMaintenance).toLocaleDateString() : 
                    'N/A'
                  }
                </td>
                <td>
                  <div className="actions-container">
                    <div className="primary-actions">
                      <button
                        className="action-card view"
                        onClick={() => openEditModal(bus)}
                        title="View Details"
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                      <button
                        className="action-card edit"
                        onClick={() => openEditModal(bus)}
                        title="Edit Bus"
                      >
                        <Edit size={14} />
                        <span>Edit</span>
                      </button>
                    </div>
                    <div className="secondary-actions">
                      <button
                        className="action-card maintenance"
                        onClick={() => handleQuickStatusChange(bus._id, 'maintenance')}
                        title="Send to Maintenance"
                      >
                        <Wrench size={14} />
                        <span>Maintenance</span>
                      </button>
                      <div className="actions-dropdown">
                        <button
                          className="action-card more"
                          onClick={() => toggleActionsMenu(bus._id)}
                          title="More Actions"
                        >
                          <MoreVertical size={14} />
                          <span>More</span>
                        </button>
                        {showActionsMenu === bus._id && (
                          <div className="dropdown-menu">
                            <button
                              className="dropdown-item"
                              onClick={() => handleAdditionalAction('duplicate', bus)}
                            >
                              <Copy size={12} />
                              Duplicate
                            </button>
                            <button
                              className="dropdown-item"
                              onClick={() => handleAdditionalAction('export', bus)}
                            >
                              <Download size={12} />
                              Export Data
                            </button>
                            <button
                              className="dropdown-item"
                              onClick={() => handleAdditionalAction('history', bus)}
                            >
                              <Clock size={12} />
                              Maintenance History
                            </button>
                            <button
                              className="dropdown-item"
                              onClick={() => handleAdditionalAction('assign_route', bus)}
                            >
                              <MapPin size={12} />
                              Assign Route
                            </button>
                            <div className="dropdown-divider"></div>
                            <button
                              className="dropdown-item danger"
                              onClick={() => openDeleteModal(bus)}
                            >
                              <Trash2 size={12} />
                              Delete Bus
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="pagination-section">
          <div className="pagination-info">
            <span>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedBuses.length)} of {filteredAndSortedBuses.length} buses
            </span>
          </div>
          
          <div className="pagination-controls">
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronUp size={16} />
              Previous
            </button>
            
            <div className="pagination-numbers">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && (
                <>
                  <span className="pagination-ellipsis">...</span>
                  <button
                    className={`pagination-number ${currentPage === totalPages ? 'active' : ''}`}
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronDown size={16} />
            </button>
          </div>
        </div>

        {filteredAndSortedBuses.length === 0 && (
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

              <div className="form-section">
                <h3>Staff Assignment</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Assigned Driver</label>
                    <select
                      value={formData.assignedDriver}
                      onChange={(e) => setFormData({...formData, assignedDriver: e.target.value})}
                      disabled={loadingStaff}
                    >
                      <option value="">Select Driver</option>
                      {drivers.map(driver => (
                        <option key={driver._id} value={driver._id}>
                          {driver.name} ({driver.driverId || driver.employeeCode}) - {driver.drivingLicense?.licenseType || 'N/A'}
                        </option>
                      ))}
                    </select>
                    {loadingStaff && <div className="text-sm text-gray-500">Loading drivers...</div>}
                  </div>

                  <div className="form-group">
                    <label>Assigned Conductor</label>
                    <select
                      value={formData.assignedConductor}
                      onChange={(e) => setFormData({...formData, assignedConductor: e.target.value})}
                      disabled={loadingStaff}
                    >
                      <option value="">Select Conductor</option>
                      {conductors.map(conductor => (
                        <option key={conductor._id} value={conductor._id}>
                          {conductor.name} ({conductor.conductorId || conductor.employeeCode}) - {conductor.badgeNumber || 'N/A'}
                        </option>
                      ))}
                    </select>
                    {loadingStaff && <div className="text-sm text-gray-500">Loading conductors...</div>}
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

              <div className="form-section">
                <h3>Staff Assignment</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Assigned Driver</label>
                    <select
                      value={formData.assignedDriver}
                      onChange={(e) => setFormData({...formData, assignedDriver: e.target.value})}
                      disabled={loadingStaff}
                    >
                      <option value="">Select Driver</option>
                      {drivers.map(driver => (
                        <option key={driver._id} value={driver._id}>
                          {driver.name} ({driver.driverId || driver.employeeCode}) - {driver.drivingLicense?.licenseType || 'N/A'}
                        </option>
                      ))}
                    </select>
                    {loadingStaff && <div className="text-sm text-gray-500">Loading drivers...</div>}
                  </div>

                  <div className="form-group">
                    <label>Assigned Conductor</label>
                    <select
                      value={formData.assignedConductor}
                      onChange={(e) => setFormData({...formData, assignedConductor: e.target.value})}
                      disabled={loadingStaff}
                    >
                      <option value="">Select Conductor</option>
                      {conductors.map(conductor => (
                        <option key={conductor._id} value={conductor._id}>
                          {conductor.name} ({conductor.conductorId || conductor.employeeCode}) - {conductor.badgeNumber || 'N/A'}
                        </option>
                      ))}
                    </select>
                    {loadingStaff && <div className="text-sm text-gray-500">Loading conductors...</div>}
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

      {/* Route Assignment Modal */}
      {showRouteAssignmentModal && selectedBus && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Assign Route to Bus - {selectedBus.busNumber}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowRouteAssignmentModal(false)}
              >
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="route-assignment-content">
              <div className="bus-info-card">
                <h3>Bus Information</h3>
                <div className="bus-details">
                  <div className="detail-row">
                    <span className="label">Bus Number:</span>
                    <span className="value">{selectedBus.busNumber}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Registration:</span>
                    <span className="value">{selectedBus.registrationNumber}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Type:</span>
                    <span className="value">{getBusTypeLabel(selectedBus.busType)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Current Route:</span>
                    <span className="value">
                      {selectedBus.currentTrip?.route?.name || 'No Active Route'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="route-selection">
                <h3>Select Route to Assign</h3>
                {loadingRoutes ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading available routes...</p>
                  </div>
                ) : availableRoutes.length === 0 ? (
                  <div className="no-routes">
                    <p>No active routes available. Please create routes first.</p>
                    <button 
                      className="btn-primary"
                      onClick={() => {
                        setShowRouteAssignmentModal(false);
                        // Navigate to routes management or show create route modal
                        window.open('/admin/routes', '_blank');
                      }}
                    >
                      Go to Routes Management
                    </button>
                  </div>
                ) : (
                  <div className="routes-grid">
                    {availableRoutes.map((route) => (
                      <div 
                        key={route._id} 
                        className="route-card"
                        onClick={() => handleRouteAssignment(route._id)}
                      >
                        <div className="route-header">
                          <h4>{route.routeName}</h4>
                          <span className="route-number">{route.routeNumber}</span>
                        </div>
                        <div className="route-details">
                          <div className="route-path">
                            <span className="from">{route.startingPoint?.city || route.startingPoint}</span>
                            <span className="arrow">→</span>
                            <span className="to">{route.endingPoint?.city || route.endingPoint}</span>
                          </div>
                          <div className="route-info">
                            <span className="distance">{route.totalDistance} km</span>
                            <span className="duration">{Math.floor(route.estimatedDuration / 60)}h {route.estimatedDuration % 60}m</span>
                            <span className="fare">₹{route.baseFare}</span>
                          </div>
                          <div className="route-features">
                            {route.features?.slice(0, 3).map((feature, idx) => (
                              <span key={idx} className="feature-tag">{feature}</span>
                            ))}
                            {route.features?.length > 3 && (
                              <span className="feature-tag">+{route.features.length - 3}</span>
                            )}
                          </div>
                        </div>
                        <div className="assign-button">
                          <button className="btn-assign">
                            Assign Route
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setShowRouteAssignmentModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetManagement;
