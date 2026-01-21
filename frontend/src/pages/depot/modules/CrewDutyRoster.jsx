import React, { useState, useEffect } from 'react';
import { Users, Brain, AlertTriangle, Clock, CheckCircle, RefreshCw, User, UserCheck, Calendar, MapPin, Phone, Mail } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import toast from 'react-hot-toast';

const CrewDutyRoster = () => {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'drivers', 'conductors', 'assignments', 'suggestions'
  const [drivers, setDrivers] = useState([]);
  const [conductors, setConductors] = useState([]);
  const [dutyAssignments, setDutyAssignments] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);

  useEffect(() => {
    fetchAllCrewData();
    
    // Real-time refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAllCrewData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchAllCrewData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [driversRes, conductorsRes, dutiesRes, suggestionsRes] = await Promise.all([
        apiFetch('/api/depot/drivers', { suppressError: true }),
        apiFetch('/api/depot/conductors', { suppressError: true }),
        apiFetch('/api/depot/crew', { suppressError: true }),
        fetchCrewSuggestions()
      ]);

      // Set drivers
      if (driversRes.ok) {
        const driversData = driversRes.data?.drivers || driversRes.data?.data?.drivers || driversRes.data || [];
        setDrivers(Array.isArray(driversData) ? driversData : []);
      } else {
        setDrivers([]);
      }

      // Set conductors
      if (conductorsRes.ok) {
        const conductorsData = conductorsRes.data?.conductors || conductorsRes.data?.data?.conductors || conductorsRes.data || [];
        setConductors(Array.isArray(conductorsData) ? conductorsData : []);
      } else {
        setConductors([]);
      }

      // Set duty assignments
      if (dutiesRes.ok) {
        const dutiesData = dutiesRes.data?.duties || dutiesRes.data?.data?.duties || dutiesRes.data || [];
        setDutyAssignments(Array.isArray(dutiesData) ? dutiesData : []);
      } else {
        setDutyAssignments([]);
      }

    } catch (error) {
      console.error('Error fetching crew data:', error);
      setDrivers([]);
      setConductors([]);
      setDutyAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCrewSuggestions = async () => {
    try {
      // Fetch trips that need crew assignment
      const tripsRes = await apiFetch('/api/depot/trips?status=approved', { suppressError: true });
      if (tripsRes.ok) {
        const trips = tripsRes.data?.trips || tripsRes.data?.data?.trips || tripsRes.data || [];
        if (!Array.isArray(trips)) {
          setSuggestions([]);
          return;
        }
        
        // For each trip, get AI suggestions
        const suggestionsData = await Promise.all(
          trips.slice(0, 10).map(async (trip) => {
            try {
              const res = await apiFetch(`/api/depot/crew/suggestions/${trip._id}`, { suppressError: true });
              if (res.ok) {
                return {
                  trip,
                  ...res.data
                };
              }
            } catch (error) {
              // Silently handle missing endpoint
            }
            return null;
          })
        );
        
        setSuggestions(suggestionsData.filter(s => s !== null));
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      setSuggestions([]);
    }
  };

  const handleAssignCrew = async (tripId, driverId, conductorId) => {
    if (!driverId || !conductorId) {
      toast.error('Please select both driver and conductor');
      return;
    }
    
    try {
      const res = await apiFetch('/api/depot/crew/assign', {
        method: 'POST',
        body: JSON.stringify({
          trip_id: tripId,
          driver_id: driverId,
          conductor_id: conductorId
        }),
        suppressError: true
      });
      if (res.ok) {
        toast.success('Crew assigned successfully!');
        fetchAllCrewData();
      } else {
        toast.error(res.data?.message || 'Failed to assign crew');
      }
    } catch (error) {
      toast.error('Error assigning crew. Please try again.');
    }
  };

  const getFatigueColor = (score) => {
    if (score <= 30) return '#10b981'; // Green
    if (score <= 60) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getFatigueLabel = (score) => {
    if (score <= 30) return 'Low';
    if (score <= 60) return 'Medium';
    return 'High';
  };

  const getStatusColor = (status) => {
    const statusMap = {
      'active': '#10b981',
      'available': '#10b981',
      'assigned': '#3b82f6',
      'on_duty': '#3b82f6',
      'off_duty': '#94a3b8',
      'sick': '#ef4444',
      'leave': '#f59e0b',
      'suspended': '#ef4444'
    };
    return statusMap[status?.toLowerCase()] || '#94a3b8';
  };

  const tabs = [
    { id: 'all', label: 'All Crew', icon: Users },
    { id: 'drivers', label: 'Drivers', icon: User, count: drivers.length },
    { id: 'conductors', label: 'Conductors', icon: UserCheck, count: conductors.length },
    { id: 'assignments', label: 'Duty Assignments', icon: Calendar, count: dutyAssignments.length },
    { id: 'suggestions', label: 'AI Suggestions', icon: Brain, count: suggestions.length }
  ];

  if (loading) {
    return (
      <div className="empty-state">
        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
        <p>Loading crew data...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="module-card">
        <div className="module-card-header">
          <h3 className="module-card-title">
            <Users className="icon-md" />
            Crew Duty Roster
          </h3>
          <button className="btn btn-secondary" onClick={fetchAllCrewData}>
            <RefreshCw className="icon-sm" />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: '8px'
        }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: activeTab === tab.id ? '#3b82f6' : 'transparent',
                  color: activeTab === tab.id ? 'white' : '#64748b',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: activeTab === tab.id ? 600 : 500,
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
              >
                <Icon className="icon-sm" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span style={{
                    background: activeTab === tab.id ? 'rgba(255,255,255,0.3)' : '#e2e8f0',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* All Crew Tab */}
        {activeTab === 'all' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {/* Drivers Section */}
              <div>
                <h4 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User className="icon-md" style={{ color: '#3b82f6' }} />
                  Drivers ({drivers.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {drivers.length > 0 ? drivers.map((driver, index) => (
                    <div
                      key={driver._id || driver.id || index}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '16px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div>
                          <h5 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600 }}>
                            {driver.name || driver.driverName || 'Unknown Driver'}
                          </h5>
                          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                            {driver.employeeCode || driver.licenseNumber || driver.id || 'N/A'}
                          </p>
                        </div>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: getStatusColor(driver.status) + '20',
                          color: getStatusColor(driver.status)
                        }}>
                          {driver.status || 'available'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#64748b' }}>
                        {driver.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Phone className="icon-xs" />
                            <span>{driver.phone}</span>
                          </div>
                        )}
                        {driver.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Mail className="icon-xs" />
                            <span>{driver.email}</span>
                          </div>
                        )}
                        {driver.licenseNumber && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <UserCheck className="icon-xs" />
                            <span>License: {driver.licenseNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="empty-state" style={{ padding: '40px' }}>
                      <User className="empty-state-icon" />
                      <p className="empty-state-text">No drivers found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Conductors Section */}
              <div>
                <h4 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck className="icon-md" style={{ color: '#8b5cf6' }} />
                  Conductors ({conductors.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {conductors.length > 0 ? conductors.map((conductor, index) => (
                    <div
                      key={conductor._id || conductor.id || index}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '16px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div>
                          <h5 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600 }}>
                            {conductor.name || conductor.conductorName || 'Unknown Conductor'}
                          </h5>
                          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                            {conductor.employeeId || conductor.employeeCode || conductor.id || 'N/A'}
                          </p>
                        </div>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: getStatusColor(conductor.status) + '20',
                          color: getStatusColor(conductor.status)
                        }}>
                          {conductor.status || 'available'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#64748b' }}>
                        {conductor.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Phone className="icon-xs" />
                            <span>{conductor.phone}</span>
                          </div>
                        )}
                        {conductor.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Mail className="icon-xs" />
                            <span>{conductor.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="empty-state" style={{ padding: '40px' }}>
                      <UserCheck className="empty-state-icon" />
                      <p className="empty-state-text">No conductors found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Drivers Only Tab */}
        {activeTab === 'drivers' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {drivers.length > 0 ? drivers.map((driver, index) => (
              <div
                key={driver._id || driver.id || index}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div>
                    <h5 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 600 }}>
                      {driver.name || driver.driverName || 'Unknown Driver'}
                    </h5>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                      ID: {driver.employeeCode || driver.licenseNumber || driver.id || 'N/A'}
                    </p>
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: getStatusColor(driver.status) + '20',
                    color: getStatusColor(driver.status)
                  }}>
                    {driver.status || 'available'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                  {driver.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b' }}>
                      <Phone className="icon-sm" />
                      <span>{driver.phone}</span>
                    </div>
                  )}
                  {driver.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b' }}>
                      <Mail className="icon-sm" />
                      <span>{driver.email}</span>
                    </div>
                  )}
                  {driver.licenseNumber && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b' }}>
                      <UserCheck className="icon-sm" />
                      <span>License: {driver.licenseNumber}</span>
                    </div>
                  )}
                  {driver.currentDuty && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#3b82f6' }}>
                      <Calendar className="icon-sm" />
                      <span>On Duty</span>
                    </div>
                  )}
                </div>
              </div>
            )) : (
              <div className="empty-state">
                <User className="empty-state-icon" />
                <p className="empty-state-text">No drivers found</p>
              </div>
            )}
          </div>
        )}

        {/* Conductors Only Tab */}
        {activeTab === 'conductors' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {conductors.length > 0 ? conductors.map((conductor, index) => (
              <div
                key={conductor._id || conductor.id || index}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div>
                    <h5 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 600 }}>
                      {conductor.name || conductor.conductorName || 'Unknown Conductor'}
                    </h5>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                      ID: {conductor.employeeId || conductor.employeeCode || conductor.id || 'N/A'}
                    </p>
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: getStatusColor(conductor.status) + '20',
                    color: getStatusColor(conductor.status)
                  }}>
                    {conductor.status || 'available'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                  {conductor.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b' }}>
                      <Phone className="icon-sm" />
                      <span>{conductor.phone}</span>
                    </div>
                  )}
                  {conductor.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b' }}>
                      <Mail className="icon-sm" />
                      <span>{conductor.email}</span>
                    </div>
                  )}
                  {conductor.currentDuty && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#8b5cf6' }}>
                      <Calendar className="icon-sm" />
                      <span>On Duty</span>
                    </div>
                  )}
                </div>
              </div>
            )) : (
              <div className="empty-state">
                <UserCheck className="empty-state-icon" />
                <p className="empty-state-text">No conductors found</p>
              </div>
            )}
          </div>
        )}

        {/* Duty Assignments Tab */}
        {activeTab === 'assignments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {dutyAssignments.length > 0 ? dutyAssignments.map((duty, index) => (
              <div
                key={duty._id || duty.id || index}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 }}>
                      {duty.tripId?.routeId?.routeName || duty.routeName || 'Route Assignment'}
                    </h5>
                    <p style={{ margin: '4px 0', fontSize: '14px', color: '#64748b' }}>
                      Date: {duty.date ? new Date(duty.date).toLocaleDateString('en-IN') : 'N/A'}
                    </p>
                    <p style={{ margin: '4px 0', fontSize: '14px', color: '#64748b' }}>
                      Bus: {duty.busId?.busNumber || duty.busNumber || 'N/A'}
                    </p>
                  </div>
                  <span className={`status-badge ${duty.status || 'assigned'}`}>
                    {duty.status || 'assigned'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#94a3b8' }}>Driver</p>
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>
                      {duty.driverId?.name || duty.driverName || 'Not Assigned'}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#94a3b8' }}>Conductor</p>
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>
                      {duty.conductorId?.name || duty.conductorName || 'Not Assigned'}
                    </p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="empty-state">
                <Calendar className="empty-state-icon" />
                <p className="empty-state-text">No duty assignments found</p>
              </div>
            )}
          </div>
        )}

        {/* AI Suggestions Tab (Original Functionality) */}
        {activeTab === 'suggestions' && (
          suggestions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {suggestions.map((suggestion, index) => {
                const trip = suggestion.trip;
                const driver = suggestion.suggestedDriver || suggestion.driver;
                const conductor = suggestion.suggestedConductor || suggestion.conductor;
                const driverFatigue = suggestion.driverFatigueScore || 25;
                const conductorFatigue = suggestion.conductorFatigueScore || 25;

                return (
                  <div
                    key={trip._id || index}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '20px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 }}>
                          {trip.tripNumber || `Trip ${index + 1}`}
                        </h4>
                        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                          {trip.routeId?.routeName || trip.route?.name || 'Route'}
                        </p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
                          {trip.startTime 
                            ? new Date(trip.startTime).toLocaleString('en-IN')
                            : 'N/A'
                          }
                        </p>
                      </div>
                      <span className={`status-badge ${trip.status || 'pending'}`}>
                        {trip.status || 'pending'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      {/* Driver Suggestion */}
                      <div style={{
                        background: 'white',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <Users className="icon-sm" style={{ color: '#3b82f6' }} />
                          <span style={{ fontWeight: 600, fontSize: '14px' }}>Suggested Driver</span>
                        </div>
                        {driver ? (
                          <>
                            <p style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600 }}>
                              {driver.name || driver.driverName || 'Driver Name'}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <span style={{ fontSize: '12px', color: '#64748b' }}>Fatigue Score:</span>
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: getFatigueColor(driverFatigue) + '20',
                                color: getFatigueColor(driverFatigue),
                                fontSize: '12px',
                                fontWeight: 600
                              }}>
                                {getFatigueLabel(driverFatigue)} ({driverFatigue}%)
                              </div>
                            </div>
                            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                              Rest Hours: {suggestion.driverRestHours || 8}h
                            </p>
                          </>
                        ) : (
                          <p style={{ color: '#94a3b8', fontSize: '14px' }}>No suggestion available</p>
                        )}
                      </div>

                      {/* Conductor Suggestion */}
                      <div style={{
                        background: 'white',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <Users className="icon-sm" style={{ color: '#8b5cf6' }} />
                          <span style={{ fontWeight: 600, fontSize: '14px' }}>Suggested Conductor</span>
                        </div>
                        {conductor ? (
                          <>
                            <p style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600 }}>
                              {conductor.name || conductor.conductorName || 'Conductor Name'}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <span style={{ fontSize: '12px', color: '#64748b' }}>Fatigue Score:</span>
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: getFatigueColor(conductorFatigue) + '20',
                                color: getFatigueColor(conductorFatigue),
                                fontSize: '12px',
                                fontWeight: 600
                              }}>
                                {getFatigueLabel(conductorFatigue)} ({conductorFatigue}%)
                              </div>
                            </div>
                            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                              Rest Hours: {suggestion.conductorRestHours || 8}h
                            </p>
                          </>
                        ) : (
                          <p style={{ color: '#94a3b8', fontSize: '14px' }}>No suggestion available</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {driver && conductor && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-success"
                          onClick={() => handleAssignCrew(trip._id, driver._id || driver.id, conductor._id || conductor.id)}
                          style={{ flex: 1 }}
                        >
                          <CheckCircle className="icon-sm" />
                          Assign Crew
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {/* Manual override */}}
                          style={{ flex: 1 }}
                        >
                          <Users className="icon-sm" />
                          Manual Override
                        </button>
                      </div>
                    )}

                    {driverFatigue > 60 || conductorFatigue > 60 && (
                      <div style={{
                        marginTop: '12px',
                        padding: '12px',
                        background: '#fef3c7',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <AlertTriangle className="icon-sm" style={{ color: '#f59e0b' }} />
                        <span style={{ fontSize: '13px', color: '#92400e' }}>
                          High fatigue detected. Consider assigning alternative crew.
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <Brain className="empty-state-icon" />
              <p className="empty-state-text">No crew assignments needed</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default CrewDutyRoster;
