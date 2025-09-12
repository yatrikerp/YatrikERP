import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import io from 'socket.io-client';
import './TripManagement.css';
import { apiFetch } from '../../../utils/api';
import { 
  Search, 
  Eye, 
  Trash2, 
  Edit, 
  Clock, 
  MoreVertical,
  CheckSquare,
  Square,
  ArrowUpDown,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Grid3X3,
  List,
  Copy,
  Play,
  Pause,
  Navigation,
  Calendar,
  FileText,
  FileSpreadsheet,
  Filter
} from 'lucide-react';

const TripManagement = () => {
  const { } = useAuth();
  const socketRef = useRef(null);
  const [trips, setTrips] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [conductors, setConductors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [dateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [selectedTrips, setSelectedTrips] = useState([]);
  const [editingTrip, setEditingTrip] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [modalStep, setModalStep] = useState(1);
  const [routeSearch, setRouteSearch] = useState('');
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [showActionsMenu, setShowActionsMenu] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [viewMode, setViewMode] = useState('table');
  const [sortField, setSortField] = useState('departureTime');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterType, setFilterType] = useState('all');

  // Form states
  const [formData, setFormData] = useState({
    routeId: '',
    busId: '',
    driverId: '',
    conductorId: '',
    departureTime: '',
    arrivalTime: '',
    fare: 0,
    notes: ''
  });

  const tripStatuses = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'running', label: 'Running' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'delayed', label: 'Delayed' }
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

  useEffect(() => {
    fetchData();
    
    // Initialize Socket.io connection
    socketRef.current = io('http://localhost:5000');
    
    socketRef.current.on('tripStatusUpdate', (data) => {
      setTrips(prevTrips => 
        prevTrips.map(trip => 
          trip && trip._id && trip._id === data.tripId ? { ...trip, status: data.status } : trip
        ).filter(trip => trip && trip._id)
      );
    });

    socketRef.current.on('tripCreated', (newTrip) => {
      if (newTrip && newTrip._id) {
        setTrips(prevTrips => [newTrip, ...prevTrips]);
      }
    });

    socketRef.current.on('tripUpdated', (updatedTrip) => {
      setTrips(prevTrips => 
        prevTrips.map(trip => 
          trip && trip._id && updatedTrip && updatedTrip._id && trip._id === updatedTrip._id ? updatedTrip : trip
        ).filter(trip => trip && trip._id)
      );
    });

    socketRef.current.on('tripDeleted', (tripId) => {
      setTrips(prevTrips => prevTrips.filter(trip => trip && trip._id && trip._id !== tripId));
    });

    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    
    return () => {
      clearInterval(interval);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

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

  useEffect(() => {
    // Filter routes based on search
    if (routeSearch) {
      setFilteredRoutes(
        routes.filter(route => 
          route.routeName.toLowerCase().includes(routeSearch.toLowerCase()) ||
          route.routeNumber.toLowerCase().includes(routeSearch.toLowerCase())
        )
      );
    } else {
      setFilteredRoutes(routes);
    }
  }, [routeSearch, routes]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tripsRes, busesRes, routesRes, driversRes, conductorsRes] = await Promise.all([
        apiFetch('/api/depot/trips'),
        apiFetch('/api/depot/buses'),
        apiFetch('/api/depot/routes'),
        apiFetch('/api/driver/all'),
        apiFetch('/api/conductor/all')
      ]);

      if (tripsRes.ok) {
        const tripsData = tripsRes.data || {};
        const allTrips = tripsData.data?.trips || tripsData.trips || [];
        // Filter out any trips that might have been soft-deleted or have invalid status
        const activeTrips = allTrips.filter(trip => 
          trip && 
          trip._id && 
          trip.status && 
          !['deleted', 'archived'].includes(trip.status.toLowerCase())
        );
        setTrips(activeTrips);
      }

      if (busesRes.ok) {
        const busesData = busesRes.data || {};
        setBuses(busesData.data?.buses || busesData.buses || []);
      }

      if (routesRes.ok) {
        const routesData = routesRes.data || {};
        setRoutes(routesData.data?.routes || routesData.routes || []);
      }

      if (driversRes.ok) {
        const driversData = driversRes.data || {};
        const driversArr = Array.isArray(driversData) ? driversData : (driversData.data || driversData.drivers);
        setDrivers(Array.isArray(driversArr) ? driversArr : []);
      }

      if (conductorsRes.ok) {
        const conductorsData = conductorsRes.data || {};
        const conductorsArr = Array.isArray(conductorsData) ? conductorsData : (conductorsData.data || conductorsData.conductors);
        setConductors(Array.isArray(conductorsArr) ? conductorsArr : []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrip = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.routeId) {
      alert('Please select a route');
      return;
    }
    if (!formData.busId) {
      alert('Please select a bus');
      return;
    }
    if (!formData.driverId) {
      alert('Please select a driver');
      return;
    }
    if (!formData.conductorId) {
      alert('Please select a conductor');
      return;
    }
    if (!formData.departureTime) {
      alert('Please select departure time');
      return;
    }
    if (!formData.arrivalTime) {
      alert('Please select arrival time');
      return;
    }
    if (formData.fare <= 0) {
      alert('Please enter a valid fare amount');
      return;
    }
    if (new Date(formData.departureTime) >= new Date(formData.arrivalTime)) {
      alert('Arrival time must be after departure time');
      return;
    }

    try {
      setLoading(true);
      
      // Map UI fields to backend contract
      const dep = formData.departureTime ? new Date(formData.departureTime) : null;
      const arr = formData.arrivalTime ? new Date(formData.arrivalTime) : null;
      const toHHMM = (d) => d ? `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` : undefined;
      const toYYYYMMDD = (d) => d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : undefined;

      const payload = {
        routeId: formData.routeId,
        busId: formData.busId,
        driverId: formData.driverId && formData.driverId.trim() !== '' ? formData.driverId : undefined,
        conductorId: formData.conductorId && formData.conductorId.trim() !== '' ? formData.conductorId : undefined,
        serviceDate: toYYYYMMDD(dep),
        startTime: toHHMM(dep),
        endTime: toHHMM(arr),
        fare: formData.fare,
        notes: formData.notes,
        status: 'scheduled'
      };

      const response = await apiFetch('/api/depot/trips', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const newTrip = response.data || {};
        setTrips(prevTrips => [newTrip.data || newTrip, ...prevTrips]);
        setShowAddModal(false);
        resetForm();
        setModalStep(1);
        showNotification('Trip created successfully!', 'success');
        
        // Emit socket event for real-time update
        if (socketRef.current) {
          socketRef.current.emit('tripCreated', newTrip.data || newTrip);
        }
      } else {
        const error = response.data || {};
        console.error('Trip creation error:', error);
        showNotification(`Failed to create trip: ${response.message || error.message || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error creating trip:', error);
      showNotification(`Failed to create trip: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTrip = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.routeId) {
      alert('Please select a route');
      return;
    }
    if (!formData.busId) {
      alert('Please select a bus');
      return;
    }
    if (!formData.departureTime) {
      alert('Please select departure time');
      return;
    }
    if (!formData.arrivalTime) {
      alert('Please select arrival time');
      return;
    }
    if (formData.fare <= 0) {
      alert('Please enter a valid fare amount');
      return;
    }
    if (new Date(formData.departureTime) >= new Date(formData.arrivalTime)) {
      alert('Arrival time must be after departure time');
      return;
    }

    try {
      setLoading(true);
      
      // Map UI fields to backend contract
      const dep = formData.departureTime ? new Date(formData.departureTime) : null;
      const arr = formData.arrivalTime ? new Date(formData.arrivalTime) : null;
      const toHHMM = (d) => d ? `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` : undefined;
      const toYYYYMMDD = (d) => d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : undefined;

      const payload = {
        routeId: formData.routeId,
        busId: formData.busId,
        driverId: formData.driverId && formData.driverId.trim() !== '' ? formData.driverId : undefined,
        conductorId: formData.conductorId && formData.conductorId.trim() !== '' ? formData.conductorId : undefined,
        serviceDate: toYYYYMMDD(dep),
        startTime: toHHMM(dep),
        endTime: toHHMM(arr),
        fare: formData.fare,
        notes: formData.notes
      };

      const response = await apiFetch(`/api/depot/trips/${selectedTrip._id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const updatedTrip = response.data || {};
        setTrips(prevTrips => 
          prevTrips.map(trip => 
            trip._id === selectedTrip._id ? (updatedTrip.data || updatedTrip) : trip
          )
        );
        setShowEditModal(false);
        resetForm();
        setSelectedTrip(null);
        showNotification('Trip updated successfully!', 'success');
        
        // Emit socket event for real-time update
        if (socketRef.current) {
          socketRef.current.emit('tripUpdated', updatedTrip.data || updatedTrip);
        }
      } else {
        showNotification(response.message || 'Failed to update trip', 'error');
      }
    } catch (error) {
      console.error('Error updating trip:', error);
      showNotification('Failed to update trip. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async () => {
    if (!selectedTrip) return;
    
    // Check if trip is in progress
    if (selectedTrip.status === 'running') {
      alert('Cannot delete a trip that is currently running. Please cancel it first.');
      return;
    }

    // Double confirmation for permanent deletion
    const confirmDelete = window.confirm(
      `Are you sure you want to PERMANENTLY DELETE this trip?\n\n` +
      `Route: ${selectedTrip.routeId?.startingPoint?.city} → ${selectedTrip.routeId?.endingPoint?.city}\n` +
      `Date: ${formatDateTime(selectedTrip.departureTime)}\n\n` +
      `This action cannot be undone!`
    );
    
    if (!confirmDelete) return;

    try {
      setLoading(true);
      
      const response = await apiFetch(`/api/depot/trips/${selectedTrip._id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Immediately remove from local state
        setTrips(prevTrips => prevTrips.filter(trip => trip._id !== selectedTrip._id));
        setShowDeleteModal(false);
        setSelectedTrip(null);
        showNotification('Trip permanently deleted!', 'success');
        
        // Emit socket event for real-time update
        if (socketRef.current) {
          socketRef.current.emit('tripDeleted', selectedTrip._id);
        }
        
        // Force refresh to ensure backend deletion
        setTimeout(() => {
          fetchData();
        }, 1000);
      } else {
        showNotification(response.message || 'Failed to delete trip', 'error');
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
      showNotification('Failed to delete trip. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Soft delete (cancel trip)
  const handleCancelTrip = async (tripId) => {
    try {
      const response = await apiFetch(`/api/depot/trips/${tripId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'cancelled' })
      });

      if (response.ok) {
        setTrips(prevTrips => 
          prevTrips.map(trip => 
            trip._id === tripId ? { ...trip, status: 'cancelled' } : trip
          )
        );
        alert('Trip cancelled successfully!');
        
        // Emit socket event for real-time update
        if (socketRef.current) {
          socketRef.current.emit('tripStatusUpdate', { tripId, status: 'cancelled' });
        }
      } else {
        alert(response.message || 'Failed to cancel trip');
      }
    } catch (error) {
      console.error('Error cancelling trip:', error);
      alert('Failed to cancel trip');
    }
  };

  const handleStatusChange = async (tripId, newStatus) => {
    try {
      const response = await apiFetch(`/api/depot/trips/${tripId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchData();
        showNotification(`Trip status updated to ${newStatus}`, 'success');
      } else {
        showNotification(response.message || 'Failed to update trip status', 'error');
      }
    } catch (error) {
      console.error('Error updating trip status:', error);
      showNotification('Failed to update trip status', 'error');
    }
  };

  // New action handlers
  const toggleActionsMenu = (tripId) => {
    setShowActionsMenu(showActionsMenu === tripId ? null : tripId);
  };

  const handleAdditionalAction = (action, trip) => {
    switch (action) {
      case 'duplicate':
        showNotification(`Duplicating trip ${trip.tripNumber}...`, 'info');
        console.log('Duplicate trip:', trip.tripNumber);
        break;
      case 'export':
        showNotification(`Exporting data for trip ${trip.tripNumber}...`, 'info');
        console.log('Export trip data:', trip.tripNumber);
        break;
      case 'schedule':
        showNotification(`Opening schedule for trip ${trip.tripNumber}...`, 'info');
        console.log('View schedule for trip:', trip.tripNumber);
        break;
      case 'track':
        showNotification(`Opening tracking for trip ${trip.tripNumber}...`, 'info');
        console.log('Track trip:', trip.tripNumber);
        break;
      default:
        console.log('Unknown action:', action);
        break;
    }
    setShowActionsMenu(null);
  };

  // Advanced filtering and sorting with useMemo for performance
  const filteredAndSortedTrips = useMemo(() => {
    let filtered = trips.filter(trip => trip && trip._id).filter(trip => {
      const matchesSearch = 
        trip.tripNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.routeId?.routeNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.busId?.busNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.driverId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.conductorId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || trip.status === filterStatus;
      const matchesType = filterType === 'all' || (trip.busId?.busType || '').toLowerCase() === filterType.toLowerCase();
      
      const matchesDate = filterDate === 'all' || (() => {
        if (!trip.departureTime) return false;
        const tripDate = new Date(trip.departureTime);
        if (isNaN(tripDate.getTime())) return false;
        
        const tripDateString = tripDate.toDateString();
        const today = new Date().toDateString();
        const tomorrow = new Date(Date.now() + 86400000).toDateString();
        
        switch (filterDate) {
          case 'today': return tripDateString === today;
          case 'tomorrow': return tripDateString === tomorrow;
          case 'this-week': return tripDate >= new Date(Date.now() - 7 * 86400000);
          default: return true;
        }
      })();

      const matchesDateRange = !startDate || !endDate || (() => {
        if (!trip.departureTime) return false;
        const tripDate = new Date(trip.departureTime);
        if (isNaN(tripDate.getTime())) return false;
        return tripDate >= startDate && tripDate <= endDate;
      })();
      
      return matchesSearch && matchesStatus && matchesType && matchesDate && matchesDateRange;
    });

    // Advanced sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle nested properties
      if (sortField === 'routeId') {
        aValue = a.routeId?.routeNumber || '';
        bValue = b.routeId?.routeNumber || '';
      }
      if (sortField === 'busId') {
        aValue = a.busId?.busNumber || '';
        bValue = b.busId?.busNumber || '';
      }
      if (sortField === 'driverId') {
        aValue = a.driverId?.name || '';
        bValue = b.driverId?.name || '';
      }
      if (sortField === 'conductorId') {
        aValue = a.conductorId?.name || '';
        bValue = b.conductorId?.name || '';
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
  }, [trips, searchTerm, filterStatus, filterDate, startDate, endDate, sortField, sortDirection]);

  // Pagination
  const paginatedTrips = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedTrips.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedTrips, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedTrips.length / itemsPerPage);

  const handleSelectAll = useCallback(() => {
    if (selectedTrips.length === filteredAndSortedTrips.length) {
      setSelectedTrips([]);
    } else {
      setSelectedTrips(filteredAndSortedTrips.filter(trip => trip && trip._id).map(trip => trip._id));
    }
  }, [selectedTrips.length, filteredAndSortedTrips]);

  const handleSelectTrip = useCallback((tripId) => {
    setSelectedTrips(prev => 
      prev.includes(tripId) 
        ? prev.filter(id => id !== tripId)
        : [...prev, tripId]
    );
  }, []);

  const handleBulkAction = useCallback(async (action) => {
    if (selectedTrips.length === 0) return;

    try {
      switch (action) {
        case 'activate':
          const activatePromises = selectedTrips.map(tripId => 
            apiFetch(`/api/depot/trips/${tripId}/status`, {
              method: 'PUT',
              body: JSON.stringify({ status: 'running' })
            })
          );
          await Promise.all(activatePromises);
          showNotification(`${selectedTrips.length} trips activated`, 'success');
          break;
        case 'inactive':
          const deactivatePromises = selectedTrips.map(tripId => 
            apiFetch(`/api/depot/trips/${tripId}/status`, {
              method: 'PUT',
              body: JSON.stringify({ status: 'cancelled' })
            })
          );
          await Promise.all(deactivatePromises);
          showNotification(`${selectedTrips.length} trips cancelled`, 'success');
          break;
        case 'delete':
          const deletePromises = selectedTrips.map(tripId => 
            apiFetch(`/api/depot/trips/${tripId}`, { method: 'DELETE' })
          );
          await Promise.all(deletePromises);
          showNotification(`${selectedTrips.length} trips deleted`, 'success');
          break;
        default:
          break;
      }
      
      setSelectedTrips([]);
      fetchData();
    } catch (error) {
      console.error('Error in bulk action:', error);
      showNotification('Failed to perform bulk action', 'error');
    }
  }, [selectedTrips]);

  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  const resetForm = () => {
    setFormData({
      routeId: '',
      busId: '',
      driverId: '',
      conductorId: '',
      departureTime: '',
      arrivalTime: '',
      fare: 0,
      notes: ''
    });
  };

  const openEditModal = (trip) => {
    if (!trip || !trip._id) {
      console.error('Invalid trip object for editing');
      return;
    }
    setSelectedTrip(trip);
    setFormData({
      routeId: trip.routeId?._id || '',
      busId: trip.busId?._id || '',
      driverId: trip.driverId?._id || '',
      conductorId: trip.conductorId?._id || '',
      departureTime: trip.departureTime ? new Date(trip.departureTime).toISOString().slice(0, 16) : '',
      arrivalTime: trip.arrivalTime ? new Date(trip.arrivalTime).toISOString().slice(0, 16) : '',
      fare: trip.fare || 0,
      notes: trip.notes || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (trip) => {
    if (!trip || !trip._id) {
      console.error('Invalid trip object for deletion');
      return;
    }
    setSelectedTrip(trip);
    setShowDeleteModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'blue';
      case 'running': return 'green';
      case 'completed': return 'purple';
      case 'cancelled': return 'red';
      case 'delayed': return 'orange';
      default: return 'gray';
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'Not set';
    const date = new Date(dateTime);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusLabel = (status) => {
    return tripStatuses.find(s => s.value === status)?.label || status;
  };

  // Inline editing functions
  const startInlineEdit = (tripId, field) => {
    setEditingTrip(tripId);
    setEditingField(field);
  };

  const saveInlineEdit = async (tripId, field, value) => {
    try {
      // Validation based on field type
      if (field === 'fare' && (value <= 0 || isNaN(value))) {
        alert('Please enter a valid fare amount');
        return;
      }
      
      if (field === 'departureTime' || field === 'arrivalTime') {
        if (!value) {
          alert('Please select a valid date and time');
          return;
        }
        
        const trip = trips.find(t => t._id === tripId);
        if (trip) {
          const departureTime = field === 'departureTime' ? value : trip.departureTime;
          const arrivalTime = field === 'arrivalTime' ? value : trip.arrivalTime;
          
          if (departureTime && arrivalTime && new Date(departureTime) >= new Date(arrivalTime)) {
            alert('Arrival time must be after departure time');
            return;
          }
        }
      }

      // Format the value based on field type
      let formattedValue = value;
      if (field === 'departureTime' || field === 'arrivalTime') {
        formattedValue = value.toISOString();
      } else if (field === 'fare') {
        formattedValue = parseFloat(value);
      }

      const response = await apiFetch(`/api/depot/trips/${tripId}`, {
        method: 'PUT',
        body: JSON.stringify({ [field]: formattedValue })
      });

      if (response.ok) {
        const updatedTrip = response.data || {};
        setTrips(prevTrips => 
          prevTrips.map(trip => 
            trip._id === tripId ? (updatedTrip.data || updatedTrip) : trip
          )
        );
        setEditingTrip(null);
        setEditingField(null);
        
        // Emit socket event for real-time update
        if (socketRef.current) {
          socketRef.current.emit('tripUpdated', updatedTrip.data || updatedTrip);
        }
      } else {
        alert(response.message || 'Failed to update trip');
      }
    } catch (error) {
      console.error('Error updating trip:', error);
      alert('Failed to update trip');
    }
  };


  // Export functions (simplified)
  const exportToExcel = () => {
    const exportData = filteredAndSortedTrips.map(trip => ({
      'Trip Number': trip.tripNumber,
      'Route': trip.routeId?.routeName,
      'Bus': trip.busId?.busNumber,
      'Driver': trip.driverId?.name,
      'Conductor': trip.conductorId?.name,
      'Departure': formatDateTime(trip.departureTime),
      'Arrival': formatDateTime(trip.arrivalTime),
      'Fare': trip.fare,
      'Status': getStatusLabel(trip.status)
    }));

    // Simple CSV export
    const csvContent = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trips-export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    showNotification('Trips exported to Excel successfully', 'success');
  };

  const exportToPDF = () => {
    // Simple print functionality
    window.print();
    showNotification('Trips exported to PDF successfully', 'success');
  };

  // Get available resources
  const getAvailableBuses = () => {
    const activeTripBusIds = trips
      .filter(trip => trip && trip.status && ['scheduled', 'running'].includes(trip.status))
      .map(trip => trip.busId?._id)
      .filter(id => id); // Remove undefined/null IDs
    return buses.filter(bus => bus && bus._id && !activeTripBusIds.includes(bus._id) && bus.status === 'active');
  };

  const getAvailableDrivers = () => {
    const activeTripDriverIds = trips
      .filter(trip => trip && trip.status && ['scheduled', 'running'].includes(trip.status))
      .map(trip => trip.driverId?._id)
      .filter(id => id); // Remove undefined/null IDs
    return drivers.filter(driver => driver && driver._id && !activeTripDriverIds.includes(driver._id) && driver.status === 'active');
  };

  const getAvailableConductors = () => {
    const activeTripConductorIds = trips
      .filter(trip => trip && trip.status && ['scheduled', 'running'].includes(trip.status))
      .map(trip => trip.conductorId?._id)
      .filter(id => id); // Remove undefined/null IDs
    return conductors.filter(conductor => conductor && conductor._id && !activeTripConductorIds.includes(conductor._id) && conductor.status === 'active');
  };

  // Progress calculation
  const getTripProgress = (trip) => {
    if (!trip.departureTime || !trip.arrivalTime) return 0;
    
    const now = new Date();
    const departure = new Date(trip.departureTime);
    const arrival = new Date(trip.arrivalTime);
    
    if (isNaN(departure.getTime()) || isNaN(arrival.getTime())) return 0;
    
    if (now < departure) return 0;
    if (now > arrival) return 100;
    
    const totalDuration = arrival - departure;
    const elapsed = now - departure;
    return Math.round((elapsed / totalDuration) * 100);
  };

  if (loading) {
    return (
      <div className="trip-loading">
        <div className="loading-spinner"></div>
        <h3>Loading Trip Management...</h3>
      </div>
    );
  }

  return (
    <div className="trip-management">
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
          <h1>Trip Management</h1>
          <p>Schedule, monitor, and manage all depot trips in real-time</p>
        </div>
        <div className="header-actions">
          <button 
            className="action-btn refresh"
            onClick={fetchData}
            title="Refresh Data"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button 
            className="action-btn"
            onClick={() => setShowAddModal(true)}
          >
            <Calendar size={16} />
            Schedule New Trip
          </button>
        </div>
      </div>



      {/* Compact one-line Search Bar */}
      <div className="search-section" style={{flexWrap:'nowrap'}}>
        <div className="search-input-wrapper" style={{flex:'1 1 auto'}}>
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search buses, routes, registration..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-dropdown"
        >
          <option value="all">All Status</option>
          {tripStatuses.map(status => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="filter-dropdown"
        >
          <option value="all">All Types</option>
          <option value="sleeper">Sleeper</option>
          <option value="seater">Seater</option>
          <option value="ac">AC</option>
          <option value="non-ac">Non-AC</option>
        </select>
        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="filter-dropdown"
        >
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
        </select>
        <div className="quick-chip chip-primary" title="Primary action" />
        <div className="quick-chip" title="Action 2" />
        <div className="quick-chip" title="Action 3" />
        <button className="filter-icon-btn" title="More filters">
          <Filter size={16} />
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedTrips.length > 0 && (
        <div className="bulk-actions-bar">
          <div className="bulk-info">
            <CheckSquare size={16} />
            <span>{selectedTrips.length} trips selected</span>
          </div>
          <div className="bulk-actions">
            <button
              className="bulk-btn activate"
              onClick={() => handleBulkAction('activate')}
            >
              <Play size={14} />
              Activate
            </button>
            <button
              className="bulk-btn inactive"
              onClick={() => handleBulkAction('inactive')}
            >
              <Pause size={14} />
              Cancel
            </button>
            <button
              className="bulk-btn delete"
              onClick={() => handleBulkAction('delete')}
            >
              <Trash2 size={14} />
              Delete
            </button>
            <button
              className="bulk-btn clear"
              onClick={() => setSelectedTrips([])}
            >
              <X size={14} />
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Trips Table */}
      <div className="table-section">
        <div className="table-container">
          <table className="data-table" id="trips-table">
          <thead>
            <tr>
              <th className="select-column">
                <button
                  className="select-all-btn"
                  onClick={handleSelectAll}
                  title={selectedTrips.length === filteredAndSortedTrips.length ? 'Deselect all' : 'Select all'}
                >
                  {selectedTrips.length === filteredAndSortedTrips.length && filteredAndSortedTrips.length > 0 ? (
                    <CheckSquare size={16} />
                  ) : (
                    <Square size={16} />
                  )}
                </button>
              </th>
              <th className="sortable" onClick={() => handleSort('tripNumber')}>
                <div className="th-content">
                  Trip Number
                  <ArrowUpDown size={14} />
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort('routeId')}>
                <div className="th-content">
                  Route
                  <ArrowUpDown size={14} />
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort('busId')}>
                <div className="th-content">
                  Bus
                  <ArrowUpDown size={14} />
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort('driverId')}>
                <div className="th-content">
                  Crew
                  <ArrowUpDown size={14} />
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort('departureTime')}>
                <div className="th-content">
                  Schedule
                  <ArrowUpDown size={14} />
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort('status')}>
                <div className="th-content">
                  Status
                  <ArrowUpDown size={14} />
                </div>
              </th>
              <th>Progress</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTrips.filter(trip => trip && trip._id).map((trip) => (
              <tr key={trip._id} className={selectedTrips.includes(trip._id) ? 'selected' : ''}>
                <td>
                  <button
                    className="select-route-btn"
                    onClick={() => handleSelectTrip(trip._id)}
                    title={selectedTrips.includes(trip._id) ? 'Deselect trip' : 'Select trip'}
                  >
                    {selectedTrips.includes(trip._id) ? (
                      <CheckSquare size={16} />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </td>
                <td>
                  <div className="trip-info">
                    <div className="trip-number">{trip.tripNumber}</div>
                    <div className="trip-id">ID: {trip._id.slice(-6)}</div>
                  </div>
                </td>
                <td>
                  <div className="route-info">
                    <div className="route-number">{trip.routeId?.routeNumber}</div>
                    <div className="route-name">{trip.routeId?.routeName}</div>
                    <div className="route-endpoints">
                      {trip.routeId?.startingPoint?.city} → {trip.routeId?.endingPoint?.city}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="bus-info">
                    {editingTrip === trip._id && editingField === 'busId' ? (
                      <select
                        value={trip.busId?._id || ''}
                        onChange={(e) => saveInlineEdit(trip._id, 'busId', e.target.value)}
                        onBlur={() => setEditingTrip(null)}
                        autoFocus
                      >
                        {getAvailableBuses().map(bus => (
                          <option key={bus._id} value={bus._id}>
                            {bus.busNumber} - {bus.busType}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div onClick={() => startInlineEdit(trip._id, 'busId')} className="editable">
                        <div className="bus-number">{trip.busId?.busNumber}</div>
                        <div className="bus-type">{trip.busId?.busType}</div>
                        <div className="bus-capacity">{trip.busId?.capacity?.total} seats</div>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="crew-info">
                    <div className="crew-driver">
                      <span className="crew-label">Driver:</span>
                      {editingTrip === trip._id && editingField === 'driverId' ? (
                        <select
                          value={trip.driverId?._id || ''}
                          onChange={(e) => saveInlineEdit(trip._id, 'driverId', e.target.value)}
                          onBlur={() => setEditingTrip(null)}
                          autoFocus
                        >
                          <option value="">No Driver</option>
                          {getAvailableDrivers().map(driver => (
                            <option key={driver._id} value={driver._id}>
                              {driver.name} - {driver.licenseNumber}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span 
                          className="crew-name editable"
                          onClick={() => startInlineEdit(trip._id, 'driverId')}
                        >
                          {trip.driverId?.name || 'Not Assigned'}
                        </span>
                      )}
                    </div>
                    <div className="crew-conductor">
                      <span className="crew-label">Conductor:</span>
                      {editingTrip === trip._id && editingField === 'conductorId' ? (
                        <select
                          value={trip.conductorId?._id || ''}
                          onChange={(e) => saveInlineEdit(trip._id, 'conductorId', e.target.value)}
                          onBlur={() => setEditingTrip(null)}
                          autoFocus
                        >
                          <option value="">No Conductor</option>
                          {getAvailableConductors().map(conductor => (
                            <option key={conductor._id} value={conductor._id}>
                              {conductor.name} - {conductor.employeeId}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span 
                          className="crew-name editable"
                          onClick={() => startInlineEdit(trip._id, 'conductorId')}
                        >
                          {trip.conductorId?.name || 'Not Assigned'}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="schedule-info">
                    <div className="departure-time">
                      <span className="time-label">Depart:</span>
                      {editingTrip === trip._id && editingField === 'departureTime' ? (
                        <DatePicker
                          selected={trip.departureTime ? new Date(trip.departureTime) : null}
                          onChange={(date) => saveInlineEdit(trip._id, 'departureTime', date)}
                          showTimeSelect
                          dateFormat="Pp"
                          onBlur={() => setEditingTrip(null)}
                          autoFocus
                        />
                      ) : (
                        <span 
                          className="time-value editable"
                          onClick={() => startInlineEdit(trip._id, 'departureTime')}
                        >
                          {trip.departureTime ? formatDateTime(trip.departureTime) : 'Not set'}
                        </span>
                      )}
                    </div>
                    <div className="arrival-time">
                      <span className="time-label">Arrive:</span>
                      {editingTrip === trip._id && editingField === 'arrivalTime' ? (
                        <DatePicker
                          selected={trip.arrivalTime ? new Date(trip.arrivalTime) : null}
                          onChange={(date) => saveInlineEdit(trip._id, 'arrivalTime', date)}
                          showTimeSelect
                          dateFormat="Pp"
                          onBlur={() => setEditingTrip(null)}
                          autoFocus
                        />
                      ) : (
                        <span 
                          className="time-value editable"
                          onClick={() => startInlineEdit(trip._id, 'arrivalTime')}
                        >
                          {trip.arrivalTime ? formatDateTime(trip.arrivalTime) : 'Not set'}
                        </span>
                      )}
                    </div>
                    <div className="fare-info">
                      {editingTrip === trip._id && editingField === 'fare' ? (
                        <input
                          type="number"
                          value={trip.fare}
                          onChange={(e) => saveInlineEdit(trip._id, 'fare', parseFloat(e.target.value))}
                          onBlur={() => setEditingTrip(null)}
                          autoFocus
                        />
                      ) : (
                        <span 
                          className="editable"
                          onClick={() => startInlineEdit(trip._id, 'fare')}
                        >
                          ₹{trip.fare}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="status-section">
                    <span className={`status-badge ${getStatusColor(trip.status)}`}>
                      {getStatusLabel(trip.status)}
                    </span>
                    <select
                      value={trip.status}
                      onChange={(e) => handleStatusChange(trip._id, e.target.value)}
                      className="status-select"
                    >
                      {tripStatuses.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                </td>
                <td>
                  <div className="progress-section">
                    {trip.status === 'running' && (
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${getTripProgress(trip)}%` }}
                        ></div>
                        <span className="progress-text">{getTripProgress(trip)}%</span>
                      </div>
                    )}
                    {trip.status === 'scheduled' && (
                      <div className="progress-bar scheduled">
                        <div className="progress-fill scheduled"></div>
                        <span className="progress-text">Scheduled</span>
                      </div>
                    )}
                    {trip.status === 'completed' && (
                      <div className="progress-bar completed">
                        <div className="progress-fill completed"></div>
                        <span className="progress-text">Completed</span>
                      </div>
                    )}
                    {trip.status === 'cancelled' && (
                      <div className="progress-bar cancelled">
                        <div className="progress-fill cancelled"></div>
                        <span className="progress-text">Cancelled</span>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="actions-container">
                    <div className="primary-actions">
                      <button
                        className="action-card view"
                        onClick={() => openEditModal(trip)}
                        title="View Details"
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                      <button
                        className="action-card edit"
                        onClick={() => openEditModal(trip)}
                        title="Edit Trip"
                      >
                        <Edit size={14} />
                        <span>Edit</span>
                      </button>
                    </div>
                    <div className="secondary-actions">
                      <div className="actions-dropdown">
                        <button
                          className="action-card more"
                          onClick={() => toggleActionsMenu(trip._id)}
                          title="More Actions"
                        >
                          <MoreVertical size={14} />
                          <span>More</span>
                        </button>
                        {showActionsMenu === trip._id && (
                          <div className="dropdown-menu">
                            <button
                              className="dropdown-item"
                              onClick={() => handleAdditionalAction('duplicate', trip)}
                            >
                              <Copy size={12} />
                              Duplicate
                            </button>
                            <button
                              className="dropdown-item"
                              onClick={() => handleAdditionalAction('export', trip)}
                            >
                              <Download size={12} />
                              Export Data
                            </button>
                            <button
                              className="dropdown-item"
                              onClick={() => handleAdditionalAction('schedule', trip)}
                            >
                              <Clock size={12} />
                              View Schedule
                            </button>
                            <button
                              className="dropdown-item"
                              onClick={() => handleAdditionalAction('track', trip)}
                            >
                              <Navigation size={12} />
                              Track Trip
                            </button>
                            {(trip.status === 'scheduled' || trip.status === 'running') && (
                              <>
                                <div className="dropdown-divider"></div>
                                <button
                                  className="dropdown-item danger"
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to cancel this trip?')) {
                                      handleCancelTrip(trip._id);
                                    }
                                  }}
                                >
                                  <Pause size={12} />
                                  Cancel Trip
                                </button>
                              </>
                            )}
                            <div className="dropdown-divider"></div>
                            <button
                              className="dropdown-item danger"
                              onClick={() => openDeleteModal(trip)}
                            >
                              <Trash2 size={12} />
                              Delete Trip
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

        {filteredAndSortedTrips.length === 0 && (
          <div className="no-data">
            <Play size={48} />
            <h3>No trips found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
        </div>
      </div>

      {/* Pagination */}
      {filteredAndSortedTrips.length > 0 && (
        <div className="pagination-section">
          <div className="pagination-info">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedTrips.length)} of {filteredAndSortedTrips.length} trips
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      )}



      {/* Enhanced Multi-Step Add Trip Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Schedule New Trip</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                  setModalStep(1);
                }}
              >
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Step Indicator */}
            <div className="modal-step-indicator">
              <div className={`step ${modalStep >= 1 ? (modalStep === 1 ? 'active' : 'completed') : 'pending'}`}>
                <div className="step-number">1</div>
                <span>Route</span>
              </div>
              <div className={`step ${modalStep >= 2 ? (modalStep === 2 ? 'active' : 'completed') : 'pending'}`}>
                <div className="step-number">2</div>
                <span>Resources</span>
              </div>
              <div className={`step ${modalStep >= 3 ? (modalStep === 3 ? 'active' : 'completed') : 'pending'}`}>
                <div className="step-number">3</div>
                <span>Schedule</span>
              </div>
              <div className={`step ${modalStep >= 4 ? (modalStep === 4 ? 'active' : 'completed') : 'pending'}`}>
                <div className="step-number">4</div>
                <span>Fare</span>
              </div>
              <div className={`step ${modalStep >= 5 ? (modalStep === 5 ? 'active' : 'completed') : 'pending'}`}>
                <div className="step-number">5</div>
                <span>Confirm</span>
              </div>
            </div>

            <form onSubmit={handleAddTrip} className="trip-form">
              {/* Step 1: Route Selection */}
              {modalStep === 1 && (
                <div className="step-content">
                  <h3>Select Route</h3>
                  <div className="form-group">
                    <label>Search Route</label>
                    <div className="route-search-container">
                      <input
                        type="text"
                        placeholder="Search routes by name or number..."
                        value={routeSearch}
                        onChange={(e) => setRouteSearch(e.target.value)}
                        className="search-input"
                      />
                      {routeSearch && (
                        <div className="route-suggestions">
                          {filteredRoutes.slice(0, 5).map(route => (
                            <div
                              key={route._id}
                              className="route-suggestion"
                              onClick={() => {
                                setFormData({...formData, routeId: route._id});
                                setRouteSearch('');
                                setModalStep(2);
                              }}
                            >
                              <div className="route-number">{route.routeNumber}</div>
                              <div className="route-name">{route.routeName}</div>
                              <div className="route-endpoints">
                                {route.startingPoint?.city} → {route.endingPoint?.city}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Or select from list</label>
                    <select
                      value={formData.routeId}
                      onChange={(e) => setFormData({...formData, routeId: e.target.value})}
                      required
                    >
                      <option value="">Select Route</option>
                      {routes.map(route => (
                        <option key={route._id} value={route._id}>
                          {route.routeNumber} - {route.routeName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Step 2: Resource Selection */}
              {modalStep === 2 && (
                <div className="step-content">
                  <h3>Assign Resources</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Available Bus *</label>
                      <select
                        value={formData.busId}
                        onChange={(e) => setFormData({...formData, busId: e.target.value})}
                        required
                      >
                        <option value="">Select Bus</option>
                        {getAvailableBuses().map(bus => (
                          <option key={bus._id} value={bus._id}>
                            {bus.busNumber} - {bus.busType} ({bus.capacity?.total} seats)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Available Driver *</label>
                      <select
                        value={formData.driverId}
                        onChange={(e) => setFormData({...formData, driverId: e.target.value})}
                        required
                      >
                        <option value="">Select Driver</option>
                        {getAvailableDrivers().map(driver => (
                          <option key={driver._id} value={driver._id}>
                            {driver.name} - {driver.licenseNumber}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Available Conductor *</label>
                      <select
                        value={formData.conductorId}
                        onChange={(e) => setFormData({...formData, conductorId: e.target.value})}
                        required
                      >
                        <option value="">Select Conductor</option>
                        {getAvailableConductors().map(conductor => (
                          <option key={conductor._id} value={conductor._id}>
                            {conductor.name} - {conductor.employeeId}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Schedule */}
              {modalStep === 3 && (
                <div className="step-content">
                  <h3>Set Schedule</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Departure Date & Time *</label>
                      <DatePicker
                        selected={formData.departureTime ? new Date(formData.departureTime) : null}
                        onChange={(date) => setFormData({...formData, departureTime: date})}
                        showTimeSelect
                        dateFormat="Pp"
                        placeholderText="Select departure time"
                        minDate={new Date()}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Arrival Date & Time *</label>
                      <DatePicker
                        selected={formData.arrivalTime ? new Date(formData.arrivalTime) : null}
                        onChange={(date) => setFormData({...formData, arrivalTime: date})}
                        showTimeSelect
                        dateFormat="Pp"
                        placeholderText="Select arrival time"
                        minDate={formData.departureTime ? new Date(formData.departureTime) : new Date()}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Fare */}
              {modalStep === 4 && (
                <div className="step-content">
                  <h3>Set Fare</h3>
                  <div className="form-group">
                    <label>Fare (₹) *</label>
                    <input
                      type="number"
                      value={formData.fare}
                      onChange={(e) => setFormData({...formData, fare: parseFloat(e.target.value)})}
                      required
                      min="0"
                      step="0.01"
                      placeholder="Enter fare amount"
                    />
                    <small>Fare is auto-filled based on route. You can modify if needed.</small>
                  </div>

                  <div className="form-group">
                    <label>Notes (Optional)</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      rows="3"
                      placeholder="Add any special notes or instructions..."
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Confirmation */}
              {modalStep === 5 && (
                <div className="step-content">
                  <h3>Confirm Trip Details</h3>
                  <div className="confirmation-details">
                    <div className="detail-section">
                      <h4>Route Information</h4>
                      <p><strong>Route:</strong> {routes.find(r => r._id === formData.routeId)?.routeNumber} - {routes.find(r => r._id === formData.routeId)?.routeName}</p>
                      <p><strong>From:</strong> {routes.find(r => r._id === formData.routeId)?.startingPoint?.city}</p>
                      <p><strong>To:</strong> {routes.find(r => r._id === formData.routeId)?.endingPoint?.city}</p>
                    </div>

                    <div className="detail-section">
                      <h4>Resources</h4>
                      <p><strong>Bus:</strong> {buses.find(b => b._id === formData.busId)?.busNumber} - {buses.find(b => b._id === formData.busId)?.busType}</p>
                      <p><strong>Driver:</strong> {drivers.find(d => d._id === formData.driverId)?.name}</p>
                      <p><strong>Conductor:</strong> {conductors.find(c => c._id === formData.conductorId)?.name}</p>
                    </div>

                    <div className="detail-section">
                      <h4>Schedule & Fare</h4>
                      <p><strong>Departure:</strong> {formData.departureTime ? new Date(formData.departureTime).toLocaleString() : 'Not set'}</p>
                      <p><strong>Arrival:</strong> {formData.arrivalTime ? new Date(formData.arrivalTime).toLocaleString() : 'Not set'}</p>
                      <p><strong>Fare:</strong> ₹{formData.fare}</p>
                      {formData.notes && <p><strong>Notes:</strong> {formData.notes}</p>}
                    </div>
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => {
                    if (modalStep > 1) {
                      setModalStep(modalStep - 1);
                    } else {
                      setShowAddModal(false);
                      resetForm();
                      setModalStep(1);
                    }
                  }}
                >
                  {modalStep > 1 ? 'Previous' : 'Cancel'}
                </button>
                
                {modalStep < 5 ? (
                  <button 
                    type="button" 
                    className="btn-primary"
                    onClick={() => {
                      if (modalStep === 1 && formData.routeId) {
                        setModalStep(2);
                      } else if (modalStep === 2 && formData.busId && formData.driverId && formData.conductorId) {
                        setModalStep(3);
                      } else if (modalStep === 3 && formData.departureTime && formData.arrivalTime) {
                        setModalStep(4);
                      } else if (modalStep === 4 && formData.fare > 0) {
                        setModalStep(5);
                      }
                    }}
                  >
                    Next
                  </button>
                ) : (
                  <button type="submit" className="btn-primary">
                    Schedule Trip
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Trip Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Trip - {selectedTrip?.tripNumber}</h2>
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
            <form onSubmit={handleEditTrip} className="trip-form">
              <div className="form-grid">
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
                        {route.routeNumber} - {route.routeName}
                      </option>
                    ))}
                  </select>
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
                  <label>Driver (Optional)</label>
                  <select
                    value={formData.driverId}
                    onChange={(e) => setFormData({...formData, driverId: e.target.value})}
                  >
                    <option value="">No Driver Assigned</option>
                    {drivers.map(driver => (
                      <option key={driver._id} value={driver._id}>
                        {driver.name} - {driver.licenseNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Conductor (Optional)</label>
                  <select
                    value={formData.conductorId}
                    onChange={(e) => setFormData({...formData, conductorId: e.target.value})}
                  >
                    <option value="">No Conductor Assigned</option>
                    {conductors.map(conductor => (
                      <option key={conductor._id} value={conductor._id}>
                        {conductor.name} - {conductor.employeeId}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Departure Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.departureTime}
                    onChange={(e) => setFormData({...formData, departureTime: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Arrival Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.arrivalTime}
                    onChange={(e) => setFormData({...formData, arrivalTime: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Fare (₹) *</label>
                  <input
                    type="number"
                    value={formData.fare}
                    onChange={(e) => setFormData({...formData, fare: parseFloat(e.target.value)})}
                    required
                    min="0"
                    step="0.01"
                  />
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
                  Update Trip
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
              <h2>⚠️ Permanent Delete Trip</h2>
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
              <h3>⚠️ WARNING: This action cannot be undone!</h3>
              <p><strong>You are about to permanently delete this trip from the system.</strong></p>
              <p>The trip "{selectedTrip?.tripNumber}" will be completely removed and cannot be recovered.</p>
              
              <div className="trip-details">
                <div className="detail-item">
                  <span className="label">Trip Number:</span>
                  <span className="value">{selectedTrip?.tripNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Route:</span>
                  <span className="value">{selectedTrip?.routeId?.routeNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Bus:</span>
                  <span className="value">{selectedTrip?.busId?.busNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Status:</span>
                  <span className="value">{getStatusLabel(selectedTrip?.status)}</span>
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
                className="btn-danger permanent-delete-btn" 
                onClick={handleDeleteTrip}
              >
                🗑️ Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripManagement;
