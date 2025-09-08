import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import io from 'socket.io-client';
import './TripManagement.css';

const TripManagement = () => {
  const { user: _unusedUser } = useAuth();
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
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [selectedTrips, setSelectedTrips] = useState([]);
  const [editingTrip, setEditingTrip] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [modalStep, setModalStep] = useState(1);
  const [routeSearch, setRouteSearch] = useState('');
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [stats, setStats] = useState({
    totalTrips: 0,
    activeTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0,
    totalRevenue: 0,
    onTimePercentage: 0,
    busUtilizationRate: 0
  });

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

  useEffect(() => {
    fetchData();
    
    // Initialize Socket.io connection
    socketRef.current = io('http://localhost:5000');
    
    socketRef.current.on('tripStatusUpdate', (data) => {
      setTrips(prevTrips => 
        prevTrips.map(trip => 
          trip._id === data.tripId ? { ...trip, status: data.status } : trip
        )
      );
    });

    socketRef.current.on('tripCreated', (newTrip) => {
      setTrips(prevTrips => [newTrip, ...prevTrips]);
    });

    socketRef.current.on('tripUpdated', (updatedTrip) => {
      setTrips(prevTrips => 
        prevTrips.map(trip => 
          trip._id === updatedTrip._id ? updatedTrip : trip
        )
      );
    });

    socketRef.current.on('tripDeleted', (tripId) => {
      setTrips(prevTrips => prevTrips.filter(trip => trip._id !== tripId));
    });

    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    
    return () => {
      clearInterval(interval);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

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
        fetch('/api/depot/trips', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/depot/buses', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/depot/routes', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/driver/all', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/conductor/all', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (tripsRes.ok) {
        const tripsData = await tripsRes.json();
        const allTrips = tripsData.data.trips || [];
        // Filter out any trips that might have been soft-deleted or have invalid status
        const activeTrips = allTrips.filter(trip => 
          trip && 
          trip._id && 
          trip.status && 
          !['deleted', 'archived'].includes(trip.status.toLowerCase())
        );
        setTrips(activeTrips);
        setStats(tripsData.data.stats || {});
      }

      if (busesRes.ok) {
        const busesData = await busesRes.json();
        setBuses(busesData.data.buses || []);
      }

      if (routesRes.ok) {
        const routesData = await routesRes.json();
        setRoutes(routesData.data.routes || []);
      }

      if (driversRes.ok) {
        const driversData = await driversRes.json();
        setDrivers(Array.isArray(driversData.data) ? driversData.data : (driversData.data?.drivers || []));
      }

      if (conductorsRes.ok) {
        const conductorsData = await conductorsRes.json();
        setConductors(Array.isArray(conductorsData.data) ? conductorsData.data : (conductorsData.data?.conductors || []));
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

      const response = await fetch('/api/depot/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const newTrip = await response.json();
        setTrips(prevTrips => [newTrip.data || newTrip, ...prevTrips]);
        setShowAddModal(false);
        resetForm();
        setModalStep(1);
        alert('Trip created successfully!');
        
        // Emit socket event for real-time update
        if (socketRef.current) {
          socketRef.current.emit('tripCreated', newTrip.data || newTrip);
        }
      } else {
        const error = await response.json();
        console.error('Trip creation error:', error);
        alert(`Failed to create trip: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating trip:', error);
      alert(`Failed to create trip: ${error.message}`);
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

      const response = await fetch(`/api/depot/trips/${selectedTrip._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const updatedTrip = await response.json();
        setTrips(prevTrips => 
          prevTrips.map(trip => 
            trip._id === selectedTrip._id ? (updatedTrip.data || updatedTrip) : trip
          )
        );
        setShowEditModal(false);
        resetForm();
        setSelectedTrip(null);
        alert('Trip updated successfully!');
        
        // Emit socket event for real-time update
        if (socketRef.current) {
          socketRef.current.emit('tripUpdated', updatedTrip.data || updatedTrip);
        }
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update trip');
      }
    } catch (error) {
      console.error('Error updating trip:', error);
      alert('Failed to update trip');
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
      
      const response = await fetch(`/api/depot/trips/${selectedTrip._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Immediately remove from local state
        setTrips(prevTrips => prevTrips.filter(trip => trip._id !== selectedTrip._id));
        setShowDeleteModal(false);
        setSelectedTrip(null);
        alert('Trip permanently deleted!');
        
        // Emit socket event for real-time update
        if (socketRef.current) {
          socketRef.current.emit('tripDeleted', selectedTrip._id);
        }
        
        // Force refresh to ensure backend deletion
        setTimeout(() => {
          fetchData();
        }, 1000);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete trip');
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert('Failed to delete trip');
    } finally {
      setLoading(false);
    }
  };

  // Soft delete (cancel trip)
  const handleCancelTrip = async (tripId) => {
    try {
      const response = await fetch(`/api/depot/trips/${tripId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
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
        const error = await response.json();
        alert(error.message || 'Failed to cancel trip');
      }
    } catch (error) {
      console.error('Error cancelling trip:', error);
      alert('Failed to cancel trip');
    }
  };

  const handleStatusChange = async (tripId, newStatus) => {
    try {
      const response = await fetch(`/api/depot/trips/${tripId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchData();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update trip status');
      }
    } catch (error) {
      console.error('Error updating trip status:', error);
      alert('Failed to update trip status');
    }
  };

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
    setSelectedTrip(trip);
    setShowDeleteModal(true);
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = 
      trip.tripNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.routeId?.routeNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.busId?.busNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.driverId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || trip.status === filterStatus;
    
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
    
    return matchesSearch && matchesStatus && matchesDate && matchesDateRange;
  });

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

      const response = await fetch(`/api/depot/trips/${tripId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ [field]: formattedValue })
      });

      if (response.ok) {
        const updatedTrip = await response.json();
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
        const error = await response.json();
        alert(error.message || 'Failed to update trip');
      }
    } catch (error) {
      console.error('Error updating trip:', error);
      alert('Failed to update trip');
    }
  };

  // Bulk operations
  const handleBulkSelect = (tripId) => {
    setSelectedTrips(prev => 
      prev.includes(tripId) 
        ? prev.filter(id => id !== tripId)
        : [...prev, tripId]
    );
  };

  const handleBulkStatusChange = async (newStatus) => {
    try {
      const promises = selectedTrips.map(tripId => 
        fetch(`/api/depot/trips/${tripId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ status: newStatus })
        })
      );

      await Promise.all(promises);
      setSelectedTrips([]);
      fetchData();
    } catch (error) {
      console.error('Error updating bulk status:', error);
    }
  };

  // Export functions (simplified)
  const exportToExcel = () => {
    const exportData = filteredTrips.map(trip => ({
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
  };

  const exportToPDF = () => {
    // Simple print functionality
    window.print();
  };

  // Get available resources
  const getAvailableBuses = () => {
    const activeTripBusIds = trips
      .filter(trip => ['scheduled', 'running'].includes(trip.status))
      .map(trip => trip.busId?._id);
    return buses.filter(bus => !activeTripBusIds.includes(bus._id) && bus.status === 'active');
  };

  const getAvailableDrivers = () => {
    const activeTripDriverIds = trips
      .filter(trip => ['scheduled', 'running'].includes(trip.status))
      .map(trip => trip.driverId?._id);
    return drivers.filter(driver => !activeTripDriverIds.includes(driver._id) && driver.status === 'active');
  };

  const getAvailableConductors = () => {
    const activeTripConductorIds = trips
      .filter(trip => ['scheduled', 'running'].includes(trip.status))
      .map(trip => trip.conductorId?._id);
    return conductors.filter(conductor => !activeTripConductorIds.includes(conductor._id) && conductor.status === 'active');
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
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Refresh
          </button>
          <button 
            className="action-btn"
            onClick={() => setShowAddModal(true)}
          >
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Schedule New Trip
          </button>
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
            placeholder="Search trips, routes, buses, or drivers..."
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
            {tripStatuses.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>

          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="this-week">This Week</option>
          </select>

          <DatePicker
            selectsRange={true}
            startDate={startDate}
            endDate={endDate}
            onChange={(update) => {
              setDateRange(update);
            }}
            isClearable={true}
            placeholderText="Select date range"
            className="date-range-picker"
          />

          <div className="export-buttons">
            <button onClick={exportToExcel} className="export-btn excel">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Excel
            </button>
            <button onClick={exportToPDF} className="export-btn pdf">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedTrips.length > 0 && (
        <div className="bulk-actions">
          <div className="bulk-info">
            <span>{selectedTrips.length} trips selected</span>
          </div>
          <div className="bulk-controls">
            <select
              onChange={(e) => handleBulkStatusChange(e.target.value)}
              className="bulk-select"
            >
              <option value="">Change Status</option>
              {tripStatuses.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
            <button 
              onClick={() => setSelectedTrips([])}
              className="clear-selection-btn"
            >
              Clear Selection
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
              <th>
                <input
                  type="checkbox"
                  checked={selectedTrips.length === filteredTrips.length && filteredTrips.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTrips(filteredTrips.map(trip => trip._id));
                    } else {
                      setSelectedTrips([]);
                    }
                  }}
                />
              </th>
              <th>Trip Number</th>
              <th>Route</th>
              <th>Bus</th>
              <th>Crew</th>
              <th>Schedule</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrips.map((trip) => (
              <tr key={trip._id} className={selectedTrips.includes(trip._id) ? 'selected' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedTrips.includes(trip._id)}
                    onChange={() => handleBulkSelect(trip._id)}
                  />
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
                  <div className="action-buttons">
                    <button
                      className="action-btn view"
                      onClick={() => openEditModal(trip)}
                      title="View/Edit"
                    >
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      className="action-btn track"
                      title="Track Trip"
                    >
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {(trip.status === 'scheduled' || trip.status === 'running') && (
                      <button
                        className="action-btn cancel"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to cancel this trip?')) {
                            handleCancelTrip(trip._id);
                          }
                        }}
                        title="Cancel Trip"
                      >
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                    <button
                      className="action-btn delete"
                      onClick={() => openDeleteModal(trip)}
                      title="Delete Trip"
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

        {filteredTrips.length === 0 && (
          <div className="no-data">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            <h3>No trips found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-section">
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{stats.totalTrips}</div>
              <div className="kpi-label">Total Trips</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{stats.activeTrips}</div>
              <div className="kpi-label">Active Trips</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{stats.completedTrips}</div>
              <div className="kpi-label">Completed</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{stats.cancelledTrips}</div>
              <div className="kpi-label">Cancelled</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">₹{stats.totalRevenue?.toLocaleString()}</div>
              <div className="kpi-label">Total Revenue</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{stats.onTimePercentage}%</div>
              <div className="kpi-label">On-Time %</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{stats.busUtilizationRate}%</div>
              <div className="kpi-label">Bus Utilization</div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="analytics-section">
        <div className="analytics-summary">
          <div className="summary-card">
            <h3>Trip Status Summary</h3>
            <div className="status-summary">
              <div className="status-item">
                <div className="status-dot blue"></div>
                <span>Scheduled: {stats.totalTrips - stats.activeTrips - stats.completedTrips - stats.cancelledTrips}</span>
              </div>
              <div className="status-item">
                <div className="status-dot green"></div>
                <span>Active: {stats.activeTrips}</span>
              </div>
              <div className="status-item">
                <div className="status-dot purple"></div>
                <span>Completed: {stats.completedTrips}</span>
              </div>
              <div className="status-item">
                <div className="status-dot red"></div>
                <span>Cancelled: {stats.cancelledTrips}</span>
              </div>
            </div>
          </div>
          
          <div className="summary-card">
            <h3>Performance Metrics</h3>
            <div className="metrics-grid">
              <div className="metric-item">
                <div className="metric-value">{stats.onTimePercentage}%</div>
                <div className="metric-label">On-Time Performance</div>
              </div>
              <div className="metric-item">
                <div className="metric-value">{stats.busUtilizationRate}%</div>
                <div className="metric-label">Bus Utilization</div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
