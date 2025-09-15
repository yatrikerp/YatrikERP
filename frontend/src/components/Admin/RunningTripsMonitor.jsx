import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';

const RunningTripsMonitor = ({ userRole, depotId }) => {
  const [runningTrips, setRunningTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Brand Colors
  const colors = {
    primary: '#E91E63',
    secondary: '#00BCD4',
    success: '#00A86B',
    danger: '#F44336',
    warning: '#FFB300',
    info: '#1976D2',
    dark: '#212121',
    light: '#F7F8FA',
    white: '#FFFFFF'
  };

  const fetchRunningTrips = async () => {
    try {
      const response = await apiFetch('/api/admin/running-trips');
      if (response.ok) {
        setRunningTrips(response.data || []);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching running trips:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRunningTrips();

    // Refresh every 30 seconds
    const interval = setInterval(fetchRunningTrips, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px',
        background: colors.white,
        borderRadius: '12px'
      }}>
        <div>Loading running trips...</div>
      </div>
    );
  }

  return (
    <div style={{
      background: colors.white,
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: '700',
          color: colors.dark
        }}>
          🚌 Running Trips Monitor
        </h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: colors.success,
            color: colors.white,
            padding: '4px 12px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {runningTrips.length} Active
          </div>
          
          <button
            onClick={fetchRunningTrips}
            style={{
              background: colors.info,
              color: colors.white,
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            🔄 Refresh
          </button>
          
          <div style={{
            fontSize: '12px',
            color: '#6B7280'
          }}>
            Updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {runningTrips.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#6B7280'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚌</div>
          <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            No Running Trips
          </div>
          <div style={{ fontSize: '14px' }}>
            All buses are currently off duty
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '16px'
        }}>
          {runningTrips.map((trip) => (
            <div
              key={trip._id}
              style={{
                background: `linear-gradient(135deg, ${colors.light} 0%, ${colors.white} 100%)`,
                border: `1px solid #E5E7EB`,
                borderRadius: '8px',
                padding: '16px',
                transition: 'all 0.3s ease'
              }}
            >
              {/* Trip Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <div style={{
                  background: trip.isDelayed ? colors.danger : colors.success,
                  color: colors.white,
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  {trip.isDelayed ? '⚠️ Delayed' : '✅ On Time'}
                </div>
                
                <div style={{
                  fontSize: '12px',
                  color: '#6B7280',
                  fontWeight: '600'
                }}>
                  {trip.progress}% Complete
                </div>
              </div>

              {/* Driver Info */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: colors.dark,
                  marginBottom: '4px'
                }}>
                  {trip.driverId?.name || 'Unknown Driver'}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6B7280'
                }}>
                  {trip.busId?.busNumber} • {trip.driverId?.employeeCode}
                </div>
              </div>

              {/* Route Info */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: colors.info,
                  marginBottom: '4px'
                }}>
                  {trip.routeId?.routeName}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6B7280'
                }}>
                  {trip.routeId?.origin} → {trip.routeId?.destination}
                </div>
              </div>

              {/* Trip Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <div style={{
                  background: colors.light,
                  padding: '8px',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: colors.info
                  }}>
                    {trip.elapsedTime}min
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: '#6B7280'
                  }}>
                    Running Time
                  </div>
                </div>
                
                <div style={{
                  background: colors.light,
                  padding: '8px',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: colors.success
                  }}>
                    {trip.distanceCovered || 0}km
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: '#6B7280'
                  }}>
                    Distance
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{
                width: '100%',
                height: '6px',
                background: '#E5E7EB',
                borderRadius: '3px',
                overflow: 'hidden',
                marginBottom: '8px'
              }}>
                <div style={{
                  width: `${trip.progress}%`,
                  height: '100%',
                  background: trip.isDelayed ? 
                    `linear-gradient(90deg, ${colors.danger} 0%, ${colors.warning} 100%)` :
                    `linear-gradient(90deg, ${colors.success} 0%, ${colors.info} 100%)`,
                  transition: 'width 0.3s ease'
                }} />
              </div>

              {/* Location Info */}
              {trip.currentLocation && (
                <div style={{
                  fontSize: '11px',
                  color: '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  📍 Lat: {trip.currentLocation.latitude?.toFixed(4)}, 
                  Lng: {trip.currentLocation.longitude?.toFixed(4)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RunningTripsMonitor;
