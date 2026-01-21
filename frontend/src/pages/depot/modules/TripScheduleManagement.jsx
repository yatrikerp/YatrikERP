import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Bus, Clock, MapPin, Search, Filter } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import toast from 'react-hot-toast';

const TripScheduleManagement = () => {
  const [trips, setTrips] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

  useEffect(() => {
    fetchTrips();
    fetchBuses();
    
    // Real-time refresh every 30 seconds
    const interval = setInterval(() => {
      fetchTrips();
      fetchBuses();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [selectedDate, filter]);

  const fetchBuses = async () => {
    try {
      const res = await apiFetch('/api/depot/buses');
      if (res.ok) {
        const busesData = res.data?.buses || res.data || [];
        setBuses(Array.isArray(busesData) ? busesData : []);
      }
    } catch (error) {
      // Handle gracefully
      setBuses([]);
    }
  };

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/depot/trips?date=${selectedDate}`, { suppressError: true });
      if (res.ok) {
        // Handle different response structures
        let tripsData = res.data?.data?.trips || res.data?.trips || res.data || [];
        if (!Array.isArray(tripsData)) {
          tripsData = [];
        }
        
        // Filter trips
        if (filter !== 'all') {
          tripsData = tripsData.filter(trip => trip.status === filter);
        }
        
        // Sort by start time
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

  const handleApprove = async (tripId) => {
    try {
      const res = await apiFetch('/api/depot/trips/approve', {
        method: 'POST',
        body: JSON.stringify({
          trip_id: tripId,
          approved_by: 'DEPOT_MGR_01'
        }),
        suppressError: true
      });
      if (res.ok) {
        toast.success('Trip approved successfully!');
        fetchTrips();
      } else {
        toast.error(res.message || 'Failed to approve trip');
      }
    } catch (error) {
      toast.error('Error approving trip. Please try again.');
    }
  };

  const handleReject = async (tripId) => {
    if (!window.confirm('Are you sure you want to reject this trip?')) return;
    
    try {
      const res = await apiFetch('/api/depot/trips/reject', {
        method: 'POST',
        body: JSON.stringify({ trip_id: tripId }),
        suppressError: true
      });
      if (res.ok) {
        toast.success('Trip rejected');
        fetchTrips();
      } else {
        toast.error(res.message || 'Failed to reject trip');
      }
    } catch (error) {
      toast.error('Error rejecting trip. Please try again.');
    }
  };

  const handleAssignBus = async (tripId, busId) => {
    if (!busId) {
      toast.error('Please select a bus');
      return;
    }
    
    try {
      const res = await apiFetch('/api/depot/trips/assign-bus', {
        method: 'PUT',
        body: JSON.stringify({ trip_id: tripId, bus_id: busId }),
        suppressError: true
      });
      if (res.ok) {
        toast.success('Bus assigned successfully!');
        fetchTrips();
      } else {
        toast.error(res.message || 'Failed to assign bus');
      }
    } catch (error) {
      toast.error('Error assigning bus. Please try again.');
    }
  };

  const handleStartTrip = async (tripId) => {
    try {
      const res = await apiFetch('/api/depot/trips/start', {
        method: 'PUT',
        body: JSON.stringify({ trip_id: tripId }),
        suppressError: true
      });
      if (res.ok) {
        toast.success('Trip started successfully!');
        fetchTrips();
      } else {
        toast.error(res.message || 'Failed to start trip');
      }
    } catch (error) {
      toast.error('Error starting trip. Please try again.');
    }
  };

  const handleCloseTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to close this trip?')) return;
    
    try {
      const res = await apiFetch('/api/depot/trips/close', {
        method: 'PUT',
        body: JSON.stringify({ trip_id: tripId }),
        suppressError: true
      });
      if (res.ok) {
        toast.success('Trip closed successfully!');
        fetchTrips();
      } else {
        toast.error(res.message || 'Failed to close trip');
      }
    } catch (error) {
      toast.error('Error closing trip. Please try again.');
    }
  };

  return (
    <div>
      {/* Header with Filters */}
      <div className="module-card">
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>
              Filter by Status
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px'
              }}
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
        </div>
      </div>

      {/* Trips List */}
      <div className="module-card">
        <div className="module-card-header">
          <h3 className="module-card-title">
            <Calendar className="icon-md" />
            AI-Generated Trips
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
                  <th>Trip Number</th>
                  <th>Route</th>
                  <th>Departure Time</th>
                  <th>Arrival Time</th>
                  <th>Bus</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip, index) => (
                  <tr key={trip._id || index}>
                    <td>{trip.tripNumber || `TRIP-${index + 1}`}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin className="icon-xs" />
                        {trip.routeId?.routeName || trip.route?.name || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock className="icon-xs" />
                        {trip.startTime 
                          ? new Date(trip.startTime).toLocaleTimeString('en-IN', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })
                          : 'N/A'
                        }
                      </div>
                    </td>
                    <td>
                      {trip.endTime 
                        ? new Date(trip.endTime).toLocaleTimeString('en-IN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })
                        : 'N/A'
                      }
                    </td>
                    <td>
                      {trip.busId?.busNumber || trip.bus?.busNumber || trip.bus?.number || (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAssignBus(trip._id, e.target.value);
                            }
                          }}
                          style={{
                            padding: '6px 10px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            fontSize: '13px',
                            minWidth: '120px'
                          }}
                        >
                          <option value="">Assign Bus</option>
                          {Array.isArray(buses) && buses
                            .filter(bus => bus.status === 'available' || bus.status === 'active' || bus.status === 'idle')
                            .map(bus => (
                              <option key={bus._id} value={bus._id}>
                                {bus.busNumber || bus.number || `BUS-${bus._id}`}
                              </option>
                            ))}
                        </select>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${trip.status || 'pending'}`}>
                        {trip.status || 'pending'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {trip.status === 'scheduled' && (
                          <>
                            <button
                              className="btn btn-primary"
                              onClick={() => handleStartTrip(trip._id)}
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              <Bus className="icon-xs" />
                              Start Trip
                            </button>
                          </>
                        )}
                        {trip.status === 'boarding' && (
                          <button
                            className="btn btn-primary"
                            onClick={() => handleStartTrip(trip._id)}
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            <Bus className="icon-xs" />
                            Start Trip
                          </button>
                        )}
                        {trip.status === 'running' && (
                          <button
                            className="btn btn-warning"
                            onClick={() => handleCloseTrip(trip._id)}
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            <XCircle className="icon-xs" />
                            Complete Trip
                          </button>
                        )}
                        {trip.status === 'completed' && (
                          <span style={{ fontSize: '12px', color: '#10b981' }}>Completed</span>
                        )}
                        {trip.status === 'cancelled' && (
                          <span style={{ fontSize: '12px', color: '#ef4444' }}>Cancelled</span>
                        )}
                        {trip.status === 'delayed' && (
                          <span style={{ fontSize: '12px', color: '#f59e0b' }}>Delayed</span>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default TripScheduleManagement;
