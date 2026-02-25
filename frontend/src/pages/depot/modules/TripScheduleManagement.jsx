import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Bus, Clock, MapPin, Search, Filter, Plus, Edit, Trash2, DollarSign, CreditCard, Ticket, X } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import toast from 'react-hot-toast';

const TripScheduleManagement = () => {
  const [trips, setTrips] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filter, setFilter] = useState('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  // Helper function to safely extract location string from object
  const getLocationString = (location) => {
    if (!location) return '';
    if (typeof location === 'string') return location;
    if (typeof location === 'number') return String(location);
    if (typeof location === 'object') {
      // Handle object with city, location, coordinates structure
      if (location.city && typeof location.city === 'string') return location.city;
      if (location.location && typeof location.location === 'string') return location.location;
      if (location.name && typeof location.name === 'string') return location.name;
      if (location.address && typeof location.address === 'string') return location.address;
      if (location.label && typeof location.label === 'string') return location.label;
      // If it's an array (coordinates), return empty
      if (Array.isArray(location)) return '';
      // For any other object structure, return empty string to avoid rendering objects
      return '';
    }
    return String(location || '');
  };
  
  // Form states
  const [tripForm, setTripForm] = useState({
    routeId: '',
    busId: '',
    serviceDate: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '10:00',
    fare: 50,
    capacity: 50,
    notes: ''
  });
  
  const [paymentForm, setPaymentForm] = useState({
    passengerName: '',
    passengerPhone: '',
    amount: '',
    paymentMethod: 'cash',
    seatNumber: '',
    boardingStop: '',
    destinationStop: ''
  });

  useEffect(() => {
    fetchTrips();
    fetchBuses();
    fetchRoutes();
    
    const interval = setInterval(() => {
      fetchTrips();
      fetchBuses();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [selectedDate, filter]);

  const fetchRoutes = async () => {
    try {
      const res = await apiFetch('/api/depot/routes');
      if (res.ok) {
        const routesData = res.data?.routes || res.data?.data?.routes || res.data || [];
        setRoutes(Array.isArray(routesData) ? routesData : []);
      }
    } catch (error) {
      setRoutes([]);
    }
  };

  const fetchBuses = async () => {
    try {
      const res = await apiFetch('/api/depot/buses');
      if (res.ok) {
        const busesData = res.data?.buses || res.data || [];
        setBuses(Array.isArray(busesData) ? busesData : []);
      }
    } catch (error) {
      setBuses([]);
    }
  };

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/depot/trips?date=${selectedDate}`, { suppressError: true });
      if (res.ok) {
        let tripsData = res.data?.data?.trips || res.data?.trips || res.data || [];
        if (!Array.isArray(tripsData)) {
          tripsData = [];
        }
        
        if (filter !== 'all') {
          tripsData = tripsData.filter(trip => trip.status === filter);
        }
        
        tripsData.sort((a, b) => {
          const timeA = a.startTime || '00:00';
          const timeB = b.startTime || '00:00';
          return timeA.localeCompare(timeB);
        });
        
        setTrips(tripsData);
      } else {
        setTrips([]);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrip = async () => {
    if (!tripForm.routeId || !tripForm.serviceDate || !tripForm.startTime) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Optimistic update - show instantly
    const newTrip = {
      ...tripForm,
      _id: `temp_${Date.now()}`,
      status: 'scheduled',
      _isUpdating: true,
      _lastUpdated: Date.now()
    };
    setTrips(prevTrips => [...prevTrips, newTrip].sort((a, b) => {
      const timeA = a.startTime || '00:00';
      const timeB = b.startTime || '00:00';
      return timeA.localeCompare(timeB);
    }));
    
    try {
      const res = await apiFetch('/api/depot/trips/create', {
        method: 'POST',
        body: JSON.stringify(tripForm),
        suppressError: true
      });
      
      if (res.ok) {
        toast.success('Trip created successfully!');
        setShowCreateModal(false);
        resetTripForm();
        // Update with server response
        fetchTrips();
      } else {
        // Revert optimistic update on error
        fetchTrips();
        toast.error(res.message || 'Failed to create trip');
      }
    } catch (error) {
      // Revert optimistic update on error
      fetchTrips();
      toast.error('Error creating trip. Please try again.');
    }
  };

  const handleUpdateTrip = async () => {
    if (!selectedTrip) return;
    
    // Optimistic update - show instantly
    setTrips(prevTrips =>
      prevTrips.map(trip =>
        trip._id === selectedTrip._id
          ? {
              ...trip,
              ...tripForm,
              _isUpdating: true,
              _lastUpdated: Date.now()
            }
          : trip
      )
    );
    
    try {
      const res = await apiFetch(`/api/depot/trips/update/${selectedTrip._id}`, {
        method: 'PUT',
        body: JSON.stringify(tripForm),
        suppressError: true
      });
      
      if (res.ok) {
        toast.success('Trip updated successfully!');
        setShowEditModal(false);
        setSelectedTrip(null);
        resetTripForm();
        // Update with server response
        fetchTrips();
      } else {
        // Revert optimistic update on error
        fetchTrips();
        toast.error(res.message || 'Failed to update trip');
      }
    } catch (error) {
      // Revert optimistic update on error
      fetchTrips();
      toast.error('Error updating trip. Please try again.');
    }
  };

  const handleCancelTrip = async (tripId) => {
    const reason = window.prompt('Enter cancellation reason:');
    if (reason === null) return;
    
    // Optimistic update - show instantly
    setTrips(prevTrips =>
      prevTrips.map(trip =>
        trip._id === tripId
          ? {
              ...trip,
              status: 'cancelled',
              cancellationReason: reason,
              _isUpdating: true,
              _lastUpdated: Date.now()
            }
          : trip
      )
    );
    
    try {
      const res = await apiFetch('/api/depot/trips/cancel', {
        method: 'PUT',
        body: JSON.stringify({ trip_id: tripId, reason }),
        suppressError: true
      });
      
      if (res.ok) {
        toast.success('Trip cancelled successfully!');
        // Update with server response
        fetchTrips();
      } else {
        // Revert optimistic update on error
        fetchTrips();
        toast.error(res.message || 'Failed to cancel trip');
      }
    } catch (error) {
      // Revert optimistic update on error
      fetchTrips();
      toast.error('Error cancelling trip. Please try again.');
    }
  };

  const handleAssignBus = async (tripId, busId) => {
    if (!busId) {
      toast.error('Please select a bus');
      return;
    }
    
    // Find bus name for optimistic update
    const bus = buses.find(b => b._id === busId);
    
    // Optimistic update - show instantly
    setTrips(prevTrips =>
      prevTrips.map(trip =>
        trip._id === tripId
          ? {
              ...trip,
              busId: busId,
              bus: bus || { _id: busId },
              _isUpdating: true,
              _lastUpdated: Date.now()
            }
          : trip
      )
    );
    
    try {
      const res = await apiFetch('/api/depot/trips/assign-bus', {
        method: 'PUT',
        body: JSON.stringify({ trip_id: tripId, bus_id: busId }),
        suppressError: true
      });
      if (res.ok) {
        toast.success('Bus assigned successfully!');
        // Update with server response
        fetchTrips();
      } else {
        // Revert optimistic update on error
        fetchTrips();
        toast.error(res.message || 'Failed to assign bus');
      }
    } catch (error) {
      // Revert optimistic update on error
      fetchTrips();
      toast.error('Error assigning bus. Please try again.');
    }
  };

  const handleStartTrip = async (tripId) => {
    if (!tripId) {
      toast.error('Invalid trip ID');
      return;
    }
    
    // Optimistic update - show instantly
    setTrips(prevTrips =>
      prevTrips.map(trip =>
        trip._id === tripId
          ? {
              ...trip,
              status: 'in_progress',
              startTime: new Date().toISOString(),
              _isUpdating: true,
              _lastUpdated: Date.now()
            }
          : trip
      )
    );
    
    try {
      const res = await apiFetch('/api/depot/trips/start', {
        method: 'PUT',
        body: JSON.stringify({ trip_id: tripId }),
        suppressError: true
      });
      if (res.ok) {
        toast.success('Trip started successfully!');
        // Update with server response
        fetchTrips();
      } else {
        // Revert optimistic update on error
        fetchTrips();
        toast.error(res.message || res.error || 'Failed to start trip');
      }
    } catch (error) {
      console.error('Start trip error:', error);
      // Revert optimistic update on error
      fetchTrips();
      toast.error('Error starting trip. Please try again.');
    }
  };

  const handleCloseTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to complete this trip?')) return;
    
    // Optimistic update - show instantly
    setTrips(prevTrips =>
      prevTrips.map(trip =>
        trip._id === tripId
          ? {
              ...trip,
              status: 'completed',
              endTime: new Date().toISOString(),
              _isUpdating: true,
              _lastUpdated: Date.now()
            }
          : trip
      )
    );
    
    try {
      const res = await apiFetch('/api/depot/trips/close', {
        method: 'PUT',
        body: JSON.stringify({ trip_id: tripId }),
        suppressError: true
      });
      if (res.ok) {
        toast.success('Trip completed successfully!');
        fetchTrips();
      } else {
        toast.error(res.message || 'Failed to complete trip');
      }
    } catch (error) {
      toast.error('Error completing trip. Please try again.');
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedTrip || !paymentForm.amount) {
      toast.error('Please enter payment amount');
      return;
    }
    
    try {
      const res = await apiFetch('/api/depot/trips/payment', {
        method: 'POST',
        body: JSON.stringify({
          trip_id: selectedTrip._id,
          amount: parseFloat(paymentForm.amount),
          paymentMethod: paymentForm.paymentMethod,
          passengerName: paymentForm.passengerName,
          passengerPhone: paymentForm.passengerPhone,
          seatNumber: paymentForm.seatNumber,
          boardingStop: paymentForm.boardingStop,
          destinationStop: paymentForm.destinationStop
        }),
        suppressError: true
      });
      
      if (res.ok) {
        const ticket = res.data?.ticket;
        toast.success(`Ticket issued! ${ticket?.ticketNumber || ''}`);
        setShowPaymentModal(false);
        setSelectedTrip(null);
        resetPaymentForm();
        fetchTrips();
      } else {
        toast.error(res.message || 'Failed to record payment');
      }
    } catch (error) {
      toast.error('Error recording payment. Please try again.');
    }
  };

  const openEditModal = (trip) => {
    setSelectedTrip(trip);
    setTripForm({
      routeId: trip.routeId?._id || trip.routeId || '',
      busId: trip.busId?._id || trip.busId || '',
      serviceDate: trip.serviceDate ? new Date(trip.serviceDate).toISOString().split('T')[0] : selectedDate,
      startTime: trip.startTime || '08:00',
      endTime: trip.endTime || '10:00',
      fare: trip.fare || 50,
      capacity: trip.capacity || 50,
      notes: trip.notes || ''
    });
    setShowEditModal(true);
  };

  const openPaymentModal = (trip) => {
    setSelectedTrip(trip);
    setPaymentForm({
      passengerName: '',
      passengerPhone: '',
      amount: trip.fare || 50,
      paymentMethod: 'cash',
      seatNumber: '',
      boardingStop: getLocationString(trip.routeId?.startingPoint) || '',
      destinationStop: getLocationString(trip.routeId?.endingPoint) || ''
    });
    setShowPaymentModal(true);
  };

  const resetTripForm = () => {
    setTripForm({
      routeId: '',
      busId: '',
      serviceDate: selectedDate,
      startTime: '08:00',
      endTime: '10:00',
      fare: 50,
      capacity: 50,
      notes: ''
    });
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      passengerName: '',
      passengerPhone: '',
      amount: '',
      paymentMethod: 'cash',
      seatNumber: '',
      boardingStop: '',
      destinationStop: ''
    });
  };

  // Modal Component
  const Modal = ({ show, onClose, title, children }) => {
    if (!show) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{title}</h3>
            <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}>
              <X size={20} />
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '16px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#475569'
  };

  return (
    <div>
      {/* Header with Filters */}
      <div className="module-card">
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={labelStyle}>Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ ...inputStyle, marginBottom: 0 }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={labelStyle}>Filter by Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ ...inputStyle, marginBottom: 0 }}
            >
              <option value="all">All Trips</option>
              <option value="scheduled">Scheduled</option>
              <option value="boarding">Boarding</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="delayed">Delayed</option>
            </select>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              resetTripForm();
              setTripForm(prev => ({ ...prev, serviceDate: selectedDate }));
              setShowCreateModal(true);
            }}
            style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} />
            Create Trip
          </button>
        </div>
      </div>

      {/* Trips List */}
      <div className="module-card">
        <div className="module-card-header">
          <h3 className="module-card-title">
            <Calendar className="icon-md" />
            Trip Schedule ({trips.length} trips)
          </h3>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
            <p>Loading trips...</p>
          </div>
        ) : trips.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Time</th>
                  <th>Bus</th>
                  <th>Seats</th>
                  <th>Fare</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip, index) => (
                  <tr key={trip._id || index}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin className="icon-xs" style={{ color: '#6366f1' }} />
                        <div>
                          <div style={{ fontWeight: 500 }}>
                            {typeof trip.routeId?.routeName === 'string' ? trip.routeId.routeName : 
                             typeof trip.routeId?.routeName === 'object' ? trip.routeId?.routeName?.name || 'N/A' : 
                             'N/A'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {getLocationString(trip.routeId?.startingPoint) || 'Origin'} → {getLocationString(trip.routeId?.endingPoint) || 'Destination'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock className="icon-xs" style={{ color: '#10b981' }} />
                        <div>
                          <div>{trip.startTime || 'N/A'}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>to {trip.endTime || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {(() => {
                        const busNumber = trip.busId?.busNumber;
                        const displayBusNumber = typeof busNumber === 'string' ? busNumber : 
                                                typeof busNumber === 'object' ? busNumber?.number || busNumber?.name || '' : 
                                                '';
                        return displayBusNumber || (
                          <select
                            onChange={(e) => e.target.value && handleAssignBus(trip._id, e.target.value)}
                            style={{
                              padding: '6px 10px',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              fontSize: '13px',
                              minWidth: '110px'
                            }}
                            defaultValue=""
                          >
                            <option value="">Assign Bus</option>
                            {buses
                              .filter(bus => ['available', 'active', 'idle'].includes(bus.status))
                              .map(bus => (
                                <option key={bus._id} value={bus._id}>
                                  {typeof bus.busNumber === 'string' ? bus.busNumber : bus.busNumber?.number || `BUS-${bus._id}`}
                                </option>
                              ))}
                          </select>
                        );
                      })()}
                    </td>
                    <td>
                      <div>
                        <span style={{ fontWeight: 500 }}>{trip.bookedSeats || 0}</span>
                        <span style={{ color: '#64748b' }}>/{trip.capacity || 50}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500, color: '#059669' }}>₹{trip.fare || 0}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${trip.status || 'scheduled'}`}>
                        {trip.status || 'scheduled'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {/* Edit button for scheduled trips */}
                        {trip.status === 'scheduled' && (
                          <>
                            <button
                              className="btn btn-secondary"
                              onClick={() => openEditModal(trip)}
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                              title="Edit Trip"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              className="btn btn-primary"
                              onClick={() => handleStartTrip(trip._id)}
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                            >
                              Start
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => handleCancelTrip(trip._id)}
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                              title="Cancel Trip"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                        
                        {/* Running trip actions */}
                        {trip.status === 'running' && (
                          <>
                            <button
                              className="btn btn-success"
                              onClick={() => openPaymentModal(trip)}
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                              title="Collect Payment"
                            >
                              <CreditCard size={14} />
                              Pay
                            </button>
                            <button
                              className="btn btn-warning"
                              onClick={() => handleCloseTrip(trip._id)}
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                            >
                              Complete
                            </button>
                          </>
                        )}
                        
                        {/* Boarding trip actions */}
                        {trip.status === 'boarding' && (
                          <>
                            <button
                              className="btn btn-success"
                              onClick={() => openPaymentModal(trip)}
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                            >
                              <CreditCard size={14} />
                              Pay
                            </button>
                            <button
                              className="btn btn-primary"
                              onClick={() => handleStartTrip(trip._id)}
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                            >
                              Start
                            </button>
                          </>
                        )}
                        
                        {/* Completed/Cancelled status */}
                        {trip.status === 'completed' && (
                          <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 500 }}>
                            ✓ Completed
                          </span>
                        )}
                        {trip.status === 'cancelled' && (
                          <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 500 }}>
                            ✕ Cancelled
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Calendar className="empty-state-icon" />
            <p className="empty-state-text">No trips found for selected date</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                resetTripForm();
                setTripForm(prev => ({ ...prev, serviceDate: selectedDate }));
                setShowCreateModal(true);
              }}
              style={{ marginTop: '16px' }}
            >
              <Plus size={18} style={{ marginRight: '8px' }} />
              Create New Trip
            </button>
          </div>
        )}
      </div>

      {/* Create Trip Modal */}
      <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Trip">
        <div>
          <label style={labelStyle}>Route *</label>
          <select
            value={tripForm.routeId}
            onChange={(e) => setTripForm({ ...tripForm, routeId: e.target.value })}
            style={inputStyle}
          >
            <option value="">Select Route</option>
            {routes.map(route => {
              const routeName = typeof route.routeName === 'string' ? route.routeName : 
                                typeof route.routeName === 'object' ? route.routeName?.name || 'Route' : 
                                'Route';
              return (
                <option key={route._id} value={route._id}>
                  {routeName} ({getLocationString(route.startingPoint) || 'Origin'} → {getLocationString(route.endingPoint) || 'Destination'})
                </option>
              );
            })}
          </select>

          <label style={labelStyle}>Bus (Optional)</label>
          <select
            value={tripForm.busId}
            onChange={(e) => setTripForm({ ...tripForm, busId: e.target.value })}
            style={inputStyle}
          >
            <option value="">Select Bus</option>
            {buses.map(bus => {
              const busNumber = typeof bus.busNumber === 'string' ? bus.busNumber : 
                                typeof bus.busNumber === 'object' ? bus.busNumber?.number || `BUS-${bus._id}` : 
                                `BUS-${bus._id}`;
              const busType = typeof bus.busType === 'string' ? bus.busType : 
                              typeof bus.busType === 'object' ? bus.busType?.name || 'Standard' : 
                              'Standard';
              return (
                <option key={bus._id} value={bus._id}>
                  {busNumber} - {busType}
                </option>
              );
            })}
          </select>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Service Date *</label>
              <input
                type="date"
                value={tripForm.serviceDate}
                onChange={(e) => setTripForm({ ...tripForm, serviceDate: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Start Time *</label>
              <input
                type="time"
                value={tripForm.startTime}
                onChange={(e) => setTripForm({ ...tripForm, startTime: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>End Time</label>
              <input
                type="time"
                value={tripForm.endTime}
                onChange={(e) => setTripForm({ ...tripForm, endTime: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Fare (₹)</label>
              <input
                type="number"
                value={tripForm.fare}
                onChange={(e) => setTripForm({ ...tripForm, fare: parseFloat(e.target.value) || 0 })}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Capacity</label>
              <input
                type="number"
                value={tripForm.capacity}
                onChange={(e) => setTripForm({ ...tripForm, capacity: parseInt(e.target.value) || 50 })}
                style={inputStyle}
              />
            </div>
          </div>

          <label style={labelStyle}>Notes</label>
          <textarea
            value={tripForm.notes}
            onChange={(e) => setTripForm({ ...tripForm, notes: e.target.value })}
            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
            placeholder="Optional notes..."
          />

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowCreateModal(false)}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreateTrip}
              style={{ flex: 1 }}
            >
              Create Trip
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Trip Modal */}
      <Modal show={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Trip">
        <div>
          <label style={labelStyle}>Bus</label>
          <select
            value={tripForm.busId}
            onChange={(e) => setTripForm({ ...tripForm, busId: e.target.value })}
            style={inputStyle}
          >
            <option value="">Select Bus</option>
            {buses.map(bus => {
              const busNumber = typeof bus.busNumber === 'string' ? bus.busNumber : 
                                typeof bus.busNumber === 'object' ? bus.busNumber?.number || `BUS-${bus._id}` : 
                                `BUS-${bus._id}`;
              const busType = typeof bus.busType === 'string' ? bus.busType : 
                              typeof bus.busType === 'object' ? bus.busType?.name || 'Standard' : 
                              'Standard';
              return (
                <option key={bus._id} value={bus._id}>
                  {busNumber} - {busType}
                </option>
              );
            })}
          </select>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Start Time</label>
              <input
                type="time"
                value={tripForm.startTime}
                onChange={(e) => setTripForm({ ...tripForm, startTime: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>End Time</label>
              <input
                type="time"
                value={tripForm.endTime}
                onChange={(e) => setTripForm({ ...tripForm, endTime: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Fare (₹)</label>
              <input
                type="number"
                value={tripForm.fare}
                onChange={(e) => setTripForm({ ...tripForm, fare: parseFloat(e.target.value) || 0 })}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Capacity</label>
              <input
                type="number"
                value={tripForm.capacity}
                onChange={(e) => setTripForm({ ...tripForm, capacity: parseInt(e.target.value) || 50 })}
                style={inputStyle}
              />
            </div>
          </div>

          <label style={labelStyle}>Notes</label>
          <textarea
            value={tripForm.notes}
            onChange={(e) => setTripForm({ ...tripForm, notes: e.target.value })}
            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
            placeholder="Optional notes..."
          />

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowEditModal(false)}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleUpdateTrip}
              style={{ flex: 1 }}
            >
              Update Trip
            </button>
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal show={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Collect Payment / Issue Ticket">
        <div>
          {selectedTrip && (
            <div style={{ 
              backgroundColor: '#f1f5f9', 
              padding: '12px', 
              borderRadius: '8px', 
              marginBottom: '16px' 
            }}>
              <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                {typeof selectedTrip.routeId?.routeName === 'string' ? selectedTrip.routeId.routeName : 
                 typeof selectedTrip.routeId?.routeName === 'object' ? selectedTrip.routeId?.routeName?.name || 'Trip' : 
                 'Trip'}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                {selectedTrip.startTime || 'N/A'} - {selectedTrip.endTime || 'N/A'} | Bus: {
                  typeof selectedTrip.busId?.busNumber === 'string' ? selectedTrip.busId.busNumber :
                  typeof selectedTrip.busId?.busNumber === 'object' ? selectedTrip.busId?.busNumber?.number || 'N/A' :
                  'N/A'
                }
              </div>
            </div>
          )}

          <label style={labelStyle}>Passenger Name</label>
          <input
            type="text"
            value={paymentForm.passengerName}
            onChange={(e) => setPaymentForm({ ...paymentForm, passengerName: e.target.value })}
            style={inputStyle}
            placeholder="Enter passenger name"
          />

          <label style={labelStyle}>Phone Number</label>
          <input
            type="tel"
            value={paymentForm.passengerPhone}
            onChange={(e) => setPaymentForm({ ...paymentForm, passengerPhone: e.target.value })}
            style={inputStyle}
            placeholder="Enter phone number"
          />

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Boarding Stop</label>
              <input
                type="text"
                value={paymentForm.boardingStop}
                onChange={(e) => setPaymentForm({ ...paymentForm, boardingStop: e.target.value })}
                style={inputStyle}
                placeholder="From"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Destination</label>
              <input
                type="text"
                value={paymentForm.destinationStop}
                onChange={(e) => setPaymentForm({ ...paymentForm, destinationStop: e.target.value })}
                style={inputStyle}
                placeholder="To"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Amount (₹) *</label>
              <input
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                style={inputStyle}
                placeholder="Fare amount"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Seat Number</label>
              <input
                type="text"
                value={paymentForm.seatNumber}
                onChange={(e) => setPaymentForm({ ...paymentForm, seatNumber: e.target.value })}
                style={inputStyle}
                placeholder="Auto-assigned"
              />
            </div>
          </div>

          <label style={labelStyle}>Payment Method</label>
          <select
            value={paymentForm.paymentMethod}
            onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
            style={inputStyle}
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="wallet">Wallet</option>
          </select>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowPaymentModal(false)}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              className="btn btn-success"
              onClick={handleRecordPayment}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Ticket size={18} />
              Issue Ticket
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TripScheduleManagement;
