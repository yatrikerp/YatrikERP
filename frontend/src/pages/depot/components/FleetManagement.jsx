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
  Copy,
  AlertTriangle,
  FileText,
  TrendingUp,
  Archive,
  UserPlus,
  Route,
  Activity,
  BarChart3,
  Save
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

  // Enhanced features state
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showCrewAssignmentModal, setShowCrewAssignmentModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPredictiveInsights, setShowPredictiveInsights] = useState(true);
  const [savedFilters, setSavedFilters] = useState([]);
  const [activeFilterView, setActiveFilterView] = useState('default');
  const [predictiveAlerts, setPredictiveAlerts] = useState([]);
  const [fleetStats, setFleetStats] = useState({
    totalTrips: 0,
    totalKm: 0,
    avgFuelEfficiency: 0,
    downtimeHours: 0
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
    assignedDriver: '',
    assignedConductor: '',
    notes: ''
  });

  // Enhanced filter states
  const [advancedFilters, setAdvancedFilters] = useState({
    status: 'all',
    type: 'all',
    capacityRange: { min: 0, max: 100 },
    depot: 'all',
    lastMaintenance: 'all',
    assignedCrew: 'all'
  });

  // Maintenance form data
  const [maintenanceFormData, setMaintenanceFormData] = useState({
    busId: '',
    problemType: '',
    description: '',
    assignedMechanic: '',
    estimatedReturnTime: '',
    priority: 'medium',
    partsRequired: [],
    estimatedCost: 0
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

  // Enhanced constants
  const problemTypes = [
    { value: 'engine', label: 'Engine Issues' },
    { value: 'tires', label: 'Tire Problems' },
    { value: 'brakes', label: 'Brake System' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'air_conditioning', label: 'Air Conditioning' },
    { value: 'transmission', label: 'Transmission' },
    { value: 'suspension', label: 'Suspension' },
    { value: 'documents', label: 'Documentation' },
    { value: 'other', label: 'Other' }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low', color: 'green' },
    { value: 'medium', label: 'Medium', color: 'orange' },
    { value: 'high', label: 'High', color: 'red' },
    { value: 'critical', label: 'Critical', color: 'red' }
  ];

  const statusColors = {
    active: { bg: '#E8F5E9', color: '#00A86B', icon: '🟢' },
    maintenance: { bg: '#FFF8E1', color: '#FFB300', icon: '🟡' },
    breakdown: { bg: '#FFEBEE', color: '#F44336', icon: '🔴' },
    idle: { bg: '#F5F5F5', color: '#9E9E9E', icon: '⚪' },
    retired: { bg: '#F3F4F6', color: '#6B7280', icon: '⚫' }
  };

  const savedFilterViews = [
    { id: 'default', name: 'All Buses', icon: '📋' },
    { id: 'active_only', name: 'Active Only', icon: '🟢' },
    { id: 'ac_buses', name: 'AC Buses &gt;50 seats', icon: '❄️' },
    { id: 'maintenance_due', name: 'Maintenance Due', icon: '🔧' },
    { id: 'idle_buses', name: 'Idle Buses', icon: '⚪' }
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

  const getBusTypeLabel = useCallback((type) => {
    return busTypes.find(bt => bt.value === type)?.label || type;
  }, [busTypes]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'maintenance': return 'orange';
      case 'retired': return 'red';
      case 'suspended': return 'gray';
      default: return 'gray';
    }
  };

  // Enhanced helper functions
  const generatePredictiveAlerts = useCallback(() => {
    const alerts = [];
    const today = new Date();
    
    buses.forEach(bus => {
      // FC renewal alerts
      if (bus.lastMaintenance) {
        const lastMaintenance = new Date(bus.lastMaintenance);
        const daysSinceMaintenance = Math.floor((today - lastMaintenance) / (1000 * 60 * 60 * 24));
        
        if (daysSinceMaintenance >= 330) { // 11 months
          alerts.push({
            id: `fc-${bus._id}`,
            type: 'warning',
            busId: bus._id,
            busNumber: bus.busNumber,
            message: `Bus ${bus.busNumber} due for FC renewal in ${365 - daysSinceMaintenance} days`,
            icon: '📋',
            priority: daysSinceMaintenance >= 350 ? 'high' : 'medium'
          });
        }
      }

      // Low mileage trend alerts
      if (bus.recentTrips && bus.recentTrips.length >= 3) {
        const avgMileage = bus.recentTrips.reduce((sum, trip) => sum + trip.mileage, 0) / bus.recentTrips.length;
        if (avgMileage < 50) { // Less than 50km per trip
          alerts.push({
            id: `mileage-${bus._id}`,
            type: 'info',
            busId: bus._id,
            busNumber: bus.busNumber,
            message: `Bus ${bus.busNumber} low mileage trend last 3 trips (avg: ${avgMileage.toFixed(1)}km)`,
            icon: '⛽',
            priority: 'medium'
          });
        }
      }

      // Scheduled maintenance alerts
      if (bus.nextMaintenance) {
        const nextMaintenance = new Date(bus.nextMaintenance);
        const daysUntilMaintenance = Math.floor((nextMaintenance - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilMaintenance <= 7) {
          alerts.push({
            id: `scheduled-${bus._id}`,
            type: 'info',
            busId: bus._id,
            busNumber: bus.busNumber,
            message: `Bus ${bus.busNumber} scheduled for maintenance ${daysUntilMaintenance === 0 ? 'today' : `in ${daysUntilMaintenance} days`}`,
            icon: '🛠️',
            priority: daysUntilMaintenance <= 1 ? 'high' : 'medium'
          });
        }
      }
    });

    setPredictiveAlerts(alerts);
  }, [buses]);

  const fetchMaintenanceLogs = useCallback(async () => {
    try {
      // For now, we'll simulate maintenance logs from bus data
      // In the future, this can be replaced with actual API call
      console.log('Maintenance logs would be fetched here');
    } catch (error) {
      console.error('Error fetching maintenance logs:', error);
    }
  }, []);

  const fetchFleetStats = useCallback(async () => {
    try {
      // Calculate fleet stats from existing bus data
      const calculatedStats = {
        totalTrips: buses.filter(bus => bus.status === 'active').length,
        totalKm: buses.reduce((sum, bus) => sum + (bus.totalKm || 0), 0),
        avgFuelEfficiency: buses.length > 0 ? 
          buses.reduce((sum, bus) => sum + (bus.fuelEfficiency || 0), 0) / buses.length : 0,
        downtimeHours: buses.filter(bus => bus.status === 'maintenance').length * 24
      };
      setFleetStats(calculatedStats);
    } catch (error) {
      console.error('Error calculating fleet stats:', error);
    }
  }, [buses]);

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
      console.log('Fleet API Response:', res); // Debug log
      
      if (res.ok) {
        const busesData = res.data?.data?.buses || res.data?.buses || [];
        const statsData = res.data?.data?.stats || res.data?.stats || {};
        
        console.log('Setting buses:', busesData.length); // Debug log
        console.log('Sample bus:', busesData[0]); // Debug log
        
        setBuses(busesData);
        setStats(statsData);
      } else {
        console.error('Failed to load buses:', res.status, res.message);
        setBuses([]);
        setStats({});
      }
    } catch (error) {
      console.error('Error fetching buses:', error);
      setBuses([]);
      setStats({});
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
    fetchMaintenanceLogs();
  }, [fetchBuses, fetchAvailableRoutes, fetchMaintenanceLogs]);

  useEffect(() => {
    fetchFleetStats();
  }, [fetchFleetStats]);

  useEffect(() => {
    generatePredictiveAlerts();
  }, [generatePredictiveAlerts]);

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ routeId })
      });

      if (response.ok) {
        showNotification(`Route assigned to bus ${selectedBus.busNumber} successfully!`, 'success');
        setShowRouteAssignmentModal(false);
        setSelectedBus(null);
        fetchBuses(); // Refresh bus data
      } else {
        const errorData = response.data || response;
        showNotification(errorData.message || 'Failed to assign route', 'error');
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
                           bus.currentRoute?.routeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           bus.currentRoute?.routeNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           bus.assignedDriver?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           bus.assignedConductor?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = advancedFilters.status === 'all' || bus.status === advancedFilters.status;
      const matchesType = advancedFilters.type === 'all' || bus.busType === advancedFilters.type;
      const matchesCapacity = bus.capacity?.total >= advancedFilters.capacityRange.min && 
                             bus.capacity?.total <= advancedFilters.capacityRange.max;
      const matchesDepot = advancedFilters.depot === 'all' || bus.depot === advancedFilters.depot;
      
      // Last maintenance filter
      let matchesMaintenance = true;
      if (advancedFilters.lastMaintenance !== 'all' && bus.lastMaintenance) {
        const lastMaintenance = new Date(bus.lastMaintenance);
        const daysSince = Math.floor((new Date() - lastMaintenance) / (1000 * 60 * 60 * 24));
        
        switch (advancedFilters.lastMaintenance) {
          case 'recent':
            matchesMaintenance = daysSince <= 30;
            break;
          case 'overdue':
            matchesMaintenance = daysSince > 365;
            break;
        case 'due_soon':
          matchesMaintenance = daysSince > 300 && daysSince <= 365;
          break;
        default:
          matchesMaintenance = true;
          break;
      }
      }
      
      // Crew assignment filter
      const matchesCrew = advancedFilters.assignedCrew === 'all' || 
                          (advancedFilters.assignedCrew === 'assigned' && bus.assignedDriver && bus.assignedConductor) ||
                          (advancedFilters.assignedCrew === 'unassigned' && (!bus.assignedDriver || !bus.assignedConductor));
      
      return matchesSearch && matchesStatus && matchesType && matchesCapacity && 
             matchesDepot && matchesMaintenance && matchesCrew;
    });

    // Advanced sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle nested properties
      if (sortField === 'route') {
        aValue = a.currentRoute?.routeName || '';
        bValue = b.currentRoute?.routeName || '';
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
  }, [buses, searchTerm, advancedFilters, sortField, sortDirection]);

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
            apiFetch(`/api/depot/buses/${id}`, {
              method: 'PUT',
              body: JSON.stringify({ status: 'active' })
            })
          ));
          showNotification(`${selectedBuses.length} buses activated successfully!`, 'success');
          break;
        case 'maintenance':
          await Promise.all(selectedBuses.map(id => 
            apiFetch(`/api/depot/buses/${id}`, {
              method: 'PUT',
              body: JSON.stringify({ status: 'maintenance' })
            })
          ));
          showNotification(`${selectedBuses.length} buses sent to maintenance!`, 'success');
          break;
        case 'assign_route':
          if (selectedBuses.length === 1) {
            const bus = buses.find(b => b._id === selectedBuses[0]);
            setSelectedBus(bus);
            setShowRouteAssignmentModal(true);
          } else {
            showNotification('Please select only one bus to assign a route', 'warning');
          }
          break;
        case 'assign_crew':
          setShowCrewAssignmentModal(true);
          break;
        case 'archive':
          await Promise.all(selectedBuses.map(id => 
            apiFetch(`/api/depot/buses/${id}`, {
              method: 'PUT',
              body: JSON.stringify({ status: 'retired' })
            })
          ));
          showNotification(`${selectedBuses.length} buses archived successfully!`, 'success');
          break;
        case 'delete':
          await Promise.all(selectedBuses.map(id => 
            apiFetch(`/api/depot/buses/${id}`, { method: 'DELETE' })
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
      
      await apiFetch(`/api/depot/buses/${busId}`, {
        method: 'PUT',
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

  // Enhanced filtering functions
  const applyFilterView = useCallback((viewId) => {
    setActiveFilterView(viewId);
    
    switch (viewId) {
      case 'active_only':
        setAdvancedFilters(prev => ({ ...prev, status: 'active' }));
        break;
      case 'ac_buses':
        setAdvancedFilters(prev => ({ 
          ...prev, 
          type: 'ac_seater', 
          capacityRange: { min: 50, max: 100 } 
        }));
        break;
      case 'maintenance_due':
        setAdvancedFilters(prev => ({ ...prev, status: 'maintenance' }));
        break;
      case 'idle_buses':
        setAdvancedFilters(prev => ({ ...prev, status: 'idle' }));
        break;
      default:
        setAdvancedFilters({
          status: 'all',
          type: 'all',
          capacityRange: { min: 0, max: 100 },
          depot: 'all',
          lastMaintenance: 'all',
          assignedCrew: 'all'
        });
    }
  }, []);

  const handleMaintenanceSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    try {
      // For now, we'll simulate creating a maintenance log
      // In the future, this can be replaced with actual API call
      console.log('Creating maintenance log:', maintenanceFormData);
      
      // Simulate success
      showNotification('Maintenance log created successfully!', 'success');
      setShowMaintenanceModal(false);
      setMaintenanceFormData({
        busId: '',
        problemType: '',
        description: '',
        assignedMechanic: '',
        estimatedReturnTime: '',
        priority: 'medium',
        partsRequired: [],
        estimatedCost: 0
      });
      
      // Update bus status to maintenance if not already
      if (maintenanceFormData.busId) {
        await handleQuickStatusChange(maintenanceFormData.busId, 'maintenance');
      }
    } catch (error) {
      console.error('Error creating maintenance log:', error);
      showNotification('Failed to create maintenance log. Please try again.', 'error');
    }
  }, [maintenanceFormData, handleQuickStatusChange, buses]);

  const openMaintenanceModal = useCallback((bus) => {
    setMaintenanceFormData(prev => ({
      ...prev,
      busId: bus._id
    }));
    setShowMaintenanceModal(true);
  }, []);

  const exportFleetData = useCallback(async (format) => {
    try {
      // For now, we'll simulate export functionality
      // In the future, this can be replaced with actual API call
      console.log(`Exporting fleet data as ${format}`);
      
      // Create a simple CSV export for now
      if (format === 'excel' && buses.length > 0) {
        const csvData = buses.map(bus => ({
          'Bus Number': bus.busNumber,
          'Registration': bus.registrationNumber,
          'Type': getBusTypeLabel(bus.busType),
          'Capacity': bus.capacity?.total || 0,
          'Status': bus.status,
          'Driver': bus.assignedDriver?.name || 'Unassigned',
          'Conductor': bus.assignedConductor?.name || 'Unassigned',
          'Route': bus.currentRoute?.routeName || 'No Route',
          'Last Maintenance': bus.lastMaintenance ? new Date(bus.lastMaintenance).toLocaleDateString() : 'N/A'
        }));
        
        const csvContent = [
          Object.keys(csvData[0]).join(','),
          ...csvData.map(row => Object.values(row).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `fleet-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else if (format === 'excel') {
        showNotification('No buses available to export', 'warning');
        return;
      }
      
      showNotification(`Fleet report exported successfully!`, 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showNotification('Export failed. Please try again.', 'error');
    }
  }, [buses, getBusTypeLabel]);


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

      {/* Predictive Insights */}
      {showPredictiveInsights && predictiveAlerts.length > 0 && (
        <div className="predictive-insights">
          <div className="insights-header">
            <div className="insights-title">
              <AlertTriangle size={20} />
              <h3>Predictive Insights</h3>
              <span className="alert-count">{predictiveAlerts.length}</span>
            </div>
            <button 
              className="insights-toggle"
              onClick={() => setShowPredictiveInsights(false)}
            >
              <X size={16} />
            </button>
          </div>
          <div className="alerts-grid">
            {predictiveAlerts.slice(0, 6).map((alert) => (
              <div key={alert.id} className={`alert-card ${alert.type} ${alert.priority}`}>
                <div className="alert-icon">{alert.icon}</div>
                <div className="alert-content">
                  <div className="alert-message">{alert.message}</div>
                  <div className="alert-bus">Bus: {alert.busNumber}</div>
                </div>
                <div className="alert-actions">
                  <button 
                    className="alert-action-btn"
                    onClick={() => {
                      const bus = buses.find(b => b._id === alert.busId);
                      if (bus) {
                        if (alert.type === 'warning') {
                          openMaintenanceModal(bus);
                        } else {
                          openEditModal(bus);
                        }
                      }
                    }}
                  >
                    {alert.type === 'warning' ? <Wrench size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {predictiveAlerts.length > 6 && (
            <div className="insights-footer">
              <span className="more-alerts">+{predictiveAlerts.length - 6} more alerts</span>
            </div>
          )}
        </div>
      )}

      {/* Advanced Search and Filters */}
      <div className="search-section">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search buses, routes, registration, crew..."
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
            value={advancedFilters.status}
            onChange={(e) => setAdvancedFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">All Status</option>
            <option value="active">🟢 Active</option>
            <option value="maintenance">🟡 Maintenance</option>
            <option value="breakdown">🔴 Breakdown</option>
            <option value="idle">⚪ Idle</option>
            <option value="retired">⚫ Retired</option>
          </select>
          
          <select
            className="filter-dropdown"
            value={advancedFilters.type}
            onChange={(e) => setAdvancedFilters(prev => ({ ...prev, type: e.target.value }))}
          >
            <option value="all">All Types</option>
            {busTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>

          <select
            className="filter-dropdown"
            value={advancedFilters.assignedCrew}
            onChange={(e) => setAdvancedFilters(prev => ({ ...prev, assignedCrew: e.target.value }))}
          >
            <option value="all">All Crew Status</option>
            <option value="assigned">👥 Assigned</option>
            <option value="unassigned">❌ Unassigned</option>
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
          <div className="filter-views">
            {savedFilterViews.map(view => (
              <button
                key={view.id}
                className={`filter-view-btn ${activeFilterView === view.id ? 'active' : ''}`}
                onClick={() => applyFilterView(view.id)}
                title={view.name}
              >
                <span className="view-icon">{view.icon}</span>
                <span className="view-name">{view.name}</span>
              </button>
            ))}
          </div>

          <div className="view-modes">
            <button 
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <List size={16} />
            </button>
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Card View"
            >
              <Grid3X3 size={16} />
            </button>
          </div>
          
          <button 
            className="refresh-btn"
            onClick={fetchBuses}
            disabled={loading}
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          </button>

          <button 
            className="export-btn"
            onClick={() => setShowExportModal(true)}
            title="Export Data"
          >
            <Download size={16} />
          </button>

          <button 
            className="filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
            title="Advanced Filters"
          >
            <Filter size={16} />
            {showFilters && <span className="filter-count">5</span>}
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="advanced-filters-panel">
          <div className="filters-header">
            <h4>Advanced Filters</h4>
            <button 
              className="close-filters"
              onClick={() => setShowFilters(false)}
            >
              <X size={16} />
            </button>
          </div>
          <div className="filters-grid">
            <div className="filter-group">
              <label>Capacity Range</label>
              <div className="range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={advancedFilters.capacityRange.min}
                  onChange={(e) => setAdvancedFilters(prev => ({
                    ...prev,
                    capacityRange: { ...prev.capacityRange, min: parseInt(e.target.value) || 0 }
                  }))}
                />
                <span>to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={advancedFilters.capacityRange.max}
                  onChange={(e) => setAdvancedFilters(prev => ({
                    ...prev,
                    capacityRange: { ...prev.capacityRange, max: parseInt(e.target.value) || 100 }
                  }))}
                />
              </div>
            </div>

            <div className="filter-group">
              <label>Last Maintenance</label>
              <select
                value={advancedFilters.lastMaintenance}
                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, lastMaintenance: e.target.value }))}
              >
                <option value="all">All</option>
                <option value="recent">Recent (≤30 days)</option>
                <option value="due_soon">Due Soon (300-365 days)</option>
                <option value="overdue">Overdue (&gt;365 days)</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Depot</label>
              <select
                value={advancedFilters.depot}
                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, depot: e.target.value }))}
              >
                <option value="all">All Depots</option>
                <option value="main">Main Depot</option>
                <option value="branch1">Branch 1</option>
                <option value="branch2">Branch 2</option>
              </select>
            </div>
          </div>
          <div className="filters-actions">
            <button 
              className="clear-filters-btn"
              onClick={() => {
                setAdvancedFilters({
                  status: 'all',
                  type: 'all',
                  capacityRange: { min: 0, max: 100 },
                  depot: 'all',
                  lastMaintenance: 'all',
                  assignedCrew: 'all'
                });
                setActiveFilterView('default');
              }}
            >
              Clear All Filters
            </button>
            <button 
              className="save-filter-btn"
              onClick={() => {
                const newFilter = {
                  id: `custom_${Date.now()}`,
                  name: `Custom Filter ${savedFilters.length + 1}`,
                  filters: advancedFilters
                };
                setSavedFilters(prev => [...prev, newFilter]);
                showNotification('Filter saved successfully!', 'success');
              }}
            >
              <Save size={14} />
              Save Filter
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedBuses.length > 0 && (
        <div className="bulk-actions-bar">
          <div className="bulk-info">
            <CheckSquare size={16} />
            <span>{selectedBuses.length} buses selected</span>
            <div className="bulk-stats">
              <span className="stat-item">
                <span className="stat-label">Active:</span>
                <span className="stat-value">
                  {selectedBuses.filter(id => buses.find(b => b._id === id)?.status === 'active').length}
                </span>
              </span>
              <span className="stat-item">
                <span className="stat-label">Maintenance:</span>
                <span className="stat-value">
                  {selectedBuses.filter(id => buses.find(b => b._id === id)?.status === 'maintenance').length}
                </span>
              </span>
            </div>
          </div>
          <div className="bulk-actions">
            <button 
              className="bulk-btn success"
              onClick={() => handleBulkAction('activate')}
              title="Activate Selected Buses"
            >
              <Check size={14} />
              Activate
            </button>
            <button 
              className="bulk-btn warning"
              onClick={() => handleBulkAction('maintenance')}
              title="Send to Maintenance"
            >
              <Wrench size={14} />
              Maintenance
            </button>
            <button 
              className="bulk-btn primary"
              onClick={() => handleBulkAction('assign_route')}
              title="Assign Route"
            >
              <Route size={14} />
              Assign Route
            </button>
            <button 
              className="bulk-btn primary"
              onClick={() => handleBulkAction('assign_crew')}
              title="Assign Crew"
            >
              <UserPlus size={14} />
              Assign Crew
            </button>
            <button 
              className="bulk-btn secondary"
              onClick={() => handleBulkAction('archive')}
              title="Archive Buses"
            >
              <Archive size={14} />
              Archive
            </button>
            <button 
              className="bulk-btn danger"
              onClick={() => handleBulkAction('delete')}
              title="Delete Buses"
            >
              <Trash2 size={14} />
              Delete
            </button>
            <button 
              className="bulk-btn secondary"
              onClick={() => setSelectedBuses([])}
              title="Clear Selection"
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
                <th>Crew Assignment</th>
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
                      {bus.currentRoute?.routeName || (
                        <button 
                          className="assign-route-btn"
                          onClick={() => {
                            setSelectedBus(bus);
                            setShowRouteAssignmentModal(true);
                          }}
                        >
                          <Route size={12} />
                          Assign Route
                        </button>
                      )}
                    </div>
                    <div className="route-detail">
                      {bus.currentRoute?.routeNumber ? `Route: ${bus.currentRoute.routeNumber}` : 'No Route Assigned'}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="crew-info">
                    <div className="crew-member">
                      <span className="crew-label">Driver:</span>
                      <span className="crew-name">
                        {bus.assignedDriver?.name || (
                          <button 
                            className="assign-crew-btn"
                            onClick={() => {
                              setSelectedBus(bus);
                              setShowCrewAssignmentModal(true);
                            }}
                          >
                            <UserPlus size={10} />
                            Assign
                          </button>
                        )}
                      </span>
                    </div>
                    <div className="crew-member">
                      <span className="crew-label">Conductor:</span>
                      <span className="crew-name">
                        {bus.assignedConductor?.name || (
                          <button 
                            className="assign-crew-btn"
                            onClick={() => {
                              setSelectedBus(bus);
                              setShowCrewAssignmentModal(true);
                            }}
                          >
                            <UserPlus size={10} />
                            Assign
                          </button>
                        )}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="status-container">
                    <span className={`status-badge ${getStatusColor(bus.status)}`}>
                      <span className="status-icon">{statusColors[bus.status]?.icon || '⚪'}</span>
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
                          onClick={() => openMaintenanceModal(bus)}
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
                      {selectedBus.currentRoute?.routeName || 'No Route Assigned'}
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

      {/* Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create Maintenance Log</h2>
              <button 
                className="modal-close"
                onClick={() => setShowMaintenanceModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleMaintenanceSubmit} className="maintenance-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Bus *</label>
                  <select
                    value={maintenanceFormData.busId}
                    onChange={(e) => setMaintenanceFormData(prev => ({ ...prev, busId: e.target.value }))}
                    required
                  >
                    <option value="">Select Bus</option>
                    {buses.map(bus => (
                      <option key={bus._id} value={bus._id}>
                        {bus.busNumber} - {bus.registrationNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Problem Type *</label>
                  <select
                    value={maintenanceFormData.problemType}
                    onChange={(e) => setMaintenanceFormData(prev => ({ ...prev, problemType: e.target.value }))}
                    required
                  >
                    <option value="">Select Problem Type</option>
                    {problemTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority *</label>
                  <select
                    value={maintenanceFormData.priority}
                    onChange={(e) => setMaintenanceFormData(prev => ({ ...prev, priority: e.target.value }))}
                    required
                  >
                    {priorityLevels.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Assigned Mechanic</label>
                  <input
                    type="text"
                    value={maintenanceFormData.assignedMechanic}
                    onChange={(e) => setMaintenanceFormData(prev => ({ ...prev, assignedMechanic: e.target.value }))}
                    placeholder="Enter mechanic name"
                  />
                </div>

                <div className="form-group">
                  <label>Estimated Return Time</label>
                  <input
                    type="datetime-local"
                    value={maintenanceFormData.estimatedReturnTime}
                    onChange={(e) => setMaintenanceFormData(prev => ({ ...prev, estimatedReturnTime: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Estimated Cost (₹)</label>
                  <input
                    type="number"
                    value={maintenanceFormData.estimatedCost}
                    onChange={(e) => setMaintenanceFormData(prev => ({ ...prev, estimatedCost: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={maintenanceFormData.description}
                  onChange={(e) => setMaintenanceFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows="4"
                  placeholder="Describe the problem and required repairs..."
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowMaintenanceModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Maintenance Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Crew Assignment Modal */}
      {showCrewAssignmentModal && selectedBus && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Assign Crew to Bus - {selectedBus.busNumber}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowCrewAssignmentModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="crew-assignment-content">
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
                </div>
              </div>

              <div className="crew-selection">
                <h3>Select Crew Members</h3>
                <div className="crew-grid">
                  <div className="crew-section">
                    <h4>Driver</h4>
                    {selectedBus.assignedDriver?.name && (
                      <div className="current-assignment">
                        <span className="current-label">Currently assigned:</span>
                        <span className="current-name">{selectedBus.assignedDriver.name}</span>
                      </div>
                    )}
                    <select
                      className="crew-select"
                      value={selectedBus.assignedDriver?._id || selectedBus.assignedDriver || ''}
                      onChange={async (e) => {
                        try {
                          const response = await apiFetch(`/api/depot/buses/${selectedBus._id}/assign-crew`, {
                            method: 'POST',
                            body: JSON.stringify({ 
                              driverId: e.target.value,
                              conductorId: selectedBus.assignedConductor?._id || selectedBus.assignedConductor || null
                            })
                          });

                          if (response.ok) {
                            showNotification('Driver assigned successfully!', 'success');
                            // Update selectedBus state immediately with populated data
                            const selectedDriver = drivers.find(d => d._id === e.target.value);
                            setSelectedBus(prev => ({
                              ...prev,
                              assignedDriver: selectedDriver || e.target.value
                            }));
                            fetchBuses();
                          } else {
                            showNotification(response.message || 'Failed to assign driver', 'error');
                          }
                        } catch (error) {
                          console.error('Error assigning driver:', error);
                          showNotification('Failed to assign driver', 'error');
                        }
                      }}
                    >
                      <option value="">Select Driver</option>
                      {drivers.map(driver => (
                        <option key={driver._id} value={driver._id}>
                          {driver.name} ({driver.driverId || driver.employeeCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="crew-section">
                    <h4>Conductor</h4>
                    {selectedBus.assignedConductor?.name && (
                      <div className="current-assignment">
                        <span className="current-label">Currently assigned:</span>
                        <span className="current-name">{selectedBus.assignedConductor.name}</span>
                      </div>
                    )}
                    <select
                      className="crew-select"
                      value={selectedBus.assignedConductor?._id || selectedBus.assignedConductor || ''}
                      onChange={async (e) => {
                        try {
                          const response = await apiFetch(`/api/depot/buses/${selectedBus._id}/assign-crew`, {
                            method: 'POST',
                            body: JSON.stringify({ 
                              driverId: selectedBus.assignedDriver?._id || selectedBus.assignedDriver || null,
                              conductorId: e.target.value
                            })
                          });

                          if (response.ok) {
                            showNotification('Conductor assigned successfully!', 'success');
                            // Update selectedBus state immediately with populated data
                            const selectedConductor = conductors.find(c => c._id === e.target.value);
                            setSelectedBus(prev => ({
                              ...prev,
                              assignedConductor: selectedConductor || e.target.value
                            }));
                            fetchBuses();
                          } else {
                            showNotification(response.message || 'Failed to assign conductor', 'error');
                          }
                        } catch (error) {
                          console.error('Error assigning conductor:', error);
                          showNotification('Failed to assign conductor', 'error');
                        }
                      }}
                    >
                      <option value="">Select Conductor</option>
                      {conductors.map(conductor => (
                        <option key={conductor._id} value={conductor._id}>
                          {conductor.name} ({conductor.conductorId || conductor.employeeCode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setShowCrewAssignmentModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="modal-overlay">
          <div className="modal-content export-modal">
            <div className="modal-header">
              <h2>Export Fleet Data</h2>
              <button 
                className="modal-close"
                onClick={() => setShowExportModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="export-content">
              <div className="export-options">
                <h3>Export Format</h3>
                <div className="format-buttons">
                  <button 
                    className="format-btn excel"
                    onClick={() => exportFleetData('excel')}
                  >
                    <FileText size={24} />
                    <span>Excel (.xlsx)</span>
                    <small>Detailed spreadsheet with all data</small>
                  </button>
                  <button 
                    className="format-btn pdf"
                    onClick={() => exportFleetData('pdf')}
                  >
                    <FileText size={24} />
                    <span>PDF Report</span>
                    <small>Formatted report for printing</small>
                  </button>
                </div>
              </div>

              <div className="export-stats">
                <h3>Report Summary</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">
                      <BarChart3 size={20} />
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{fleetStats.totalTrips}</div>
                      <div className="stat-label">Total Trips</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <Activity size={20} />
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{fleetStats.totalKm} km</div>
                      <div className="stat-label">Total Distance</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <TrendingUp size={20} />
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{fleetStats.avgFuelEfficiency}</div>
                      <div className="stat-label">Avg Fuel Efficiency</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <Clock size={20} />
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{fleetStats.downtimeHours}h</div>
                      <div className="stat-label">Downtime</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setShowExportModal(false)}
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
