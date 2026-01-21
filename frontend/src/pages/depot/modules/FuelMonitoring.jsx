import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Fuel, TrendingUp, AlertCircle, Plus, BarChart3 } from 'lucide-react';
import { apiFetch } from '../../../utils/api';

const FuelMonitoring = () => {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalFuel: 0,
    averageKML: 0,
    routeComparison: [],
    busWiseUsage: []
  });
  const [loading, setLoading] = useState(true);
  const [showLogForm, setShowLogForm] = useState(false);
  const [logForm, setLogForm] = useState({
    busId: '',
    tripId: '',
    quantity: '',
    cost: '',
    odometerReading: ''
  });

  useEffect(() => {
    fetchFuelLogs();
    fetchAnalytics();
  }, []);

  const fetchFuelLogs = async () => {
    try {
      const res = await apiFetch('/api/depot/fuel/logs');
      if (res.ok) {
        const logs = res.data?.logs || res.data || [];
        setFuelLogs(Array.isArray(logs) ? logs : []);
      } else {
        setFuelLogs([]);
      }
    } catch (error) {
      // Handle missing endpoint gracefully
      setFuelLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await apiFetch('/api/depot/fuel/analytics');
      if (res.ok) {
        setAnalytics(res.data || {
          totalFuel: 0,
          averageKML: 0,
          routeComparison: [],
          busWiseUsage: []
        });
      } else {
        setAnalytics({
          totalFuel: 0,
          averageKML: 0,
          routeComparison: [],
          busWiseUsage: []
        });
      }
    } catch (error) {
      // Handle missing endpoint gracefully
      setAnalytics({
        totalFuel: 0,
        averageKML: 0,
        routeComparison: [],
        busWiseUsage: []
      });
    }
  };

  const handleLogFuel = async (e) => {
    e.preventDefault();
    if (!logForm.busId || !logForm.quantity) {
      toast.error('Please fill all required fields');
      return;
    }
    
    try {
      const res = await apiFetch('/api/depot/fuel/log', {
        method: 'POST',
        body: JSON.stringify(logForm),
        suppressError: true
      });
      if (res.ok) {
        toast.success('Fuel entry logged successfully!');
        setShowLogForm(false);
        setLogForm({ busId: '', tripId: '', quantity: '', cost: '', odometerReading: '' });
        fetchFuelLogs();
        fetchAnalytics();
      } else {
        toast.error(res.message || 'Failed to log fuel entry');
      }
    } catch (error) {
      toast.error('Error logging fuel entry. Please try again.');
      setShowLogForm(false);
      setLogForm({ busId: '', tripId: '', quantity: '', cost: '', odometerReading: '' });
    }
  };

  return (
    <div>
      {/* Fuel Summary Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <div className="kpi-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}>
              <Fuel className="icon-lg" />
            </div>
          </div>
          <div className="kpi-value">{analytics.totalFuel}L</div>
          <div className="kpi-label">Total Fuel Today</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-header">
            <div className="kpi-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
              <TrendingUp className="icon-lg" />
            </div>
          </div>
          <div className="kpi-value">{(analytics.averageKML || 0).toFixed(2)}</div>
          <div className="kpi-label">Average KM/L</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-header">
            <div className="kpi-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
              <AlertCircle className="icon-lg" />
            </div>
          </div>
          <div className="kpi-value">
            {(Array.isArray(fuelLogs) ? fuelLogs.filter(log => log.abnormalUsage).length : 0)}
          </div>
          <div className="kpi-label">Abnormal Usage Detected</div>
        </div>
      </div>

      {/* Log Fuel Button */}
      <div className="module-card">
        <div className="module-card-header">
          <h3 className="module-card-title">
            <Fuel className="icon-md" />
            Fuel Logging
          </h3>
          <button className="btn btn-primary" onClick={() => setShowLogForm(true)}>
            <Plus className="icon-sm" />
            Log Fuel Entry
          </button>
        </div>
      </div>

      {/* Fuel Logs */}
      <div className="module-card">
        <div className="module-card-header">
          <h3 className="module-card-title">
            <BarChart3 className="icon-md" />
            Recent Fuel Logs
          </h3>
        </div>
        {loading ? (
          <div className="empty-state">
            <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
            <p>Loading fuel logs...</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Bus</th>
                  <th>Trip</th>
                  <th>Quantity (L)</th>
                  <th>Cost (₹)</th>
                  <th>Odometer</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(fuelLogs) && fuelLogs.length > 0 ? (
                  fuelLogs.slice(0, 20).map((log, index) => (
                    <tr key={log._id || index}>
                      <td>
                        {log.timestamp
                          ? new Date(log.timestamp).toLocaleString('en-IN')
                          : 'N/A'
                        }
                      </td>
                      <td>{log.busId?.busNumber || log.bus?.busNumber || 'N/A'}</td>
                      <td>{log.tripId?.tripNumber || log.trip?.tripNumber || 'N/A'}</td>
                      <td>{log.quantity || 0}L</td>
                      <td>₹{log.cost || 0}</td>
                      <td>{log.odometerReading || 'N/A'}</td>
                      <td>
                        {log.abnormalUsage ? (
                          <span className="status-badge" style={{ background: '#fee2e2', color: '#991b1b' }}>
                            Abnormal
                          </span>
                        ) : (
                          <span className="status-badge active">Normal</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No fuel logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Route Comparison */}
      {Array.isArray(analytics.routeComparison) && analytics.routeComparison.length > 0 && (
        <div className="module-card">
          <div className="module-card-header">
            <h3 className="module-card-title">
              <BarChart3 className="icon-md" />
              Route vs Fuel Efficiency
            </h3>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Fuel Used (L)</th>
                  <th>Distance (KM)</th>
                  <th>Efficiency (KM/L)</th>
                </tr>
              </thead>
              <tbody>
                {analytics.routeComparison.map((route, index) => (
                  <tr key={index}>
                    <td>{route.routeName || 'N/A'}</td>
                    <td>{route.fuelUsed || 0}L</td>
                    <td>{route.distance || 0}KM</td>
                    <td>{((route.efficiency ?? 0).toFixed(2))} KM/L</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Fuel Modal */}
      {showLogForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 600 }}>
              Log Fuel Entry
            </h3>
            <form onSubmit={handleLogFuel}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  Bus
                </label>
                <input
                  type="text"
                  value={logForm.busId}
                  onChange={(e) => setLogForm({ ...logForm, busId: e.target.value })}
                  placeholder="Bus ID"
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  Trip ID (Optional)
                </label>
                <input
                  type="text"
                  value={logForm.tripId}
                  onChange={(e) => setLogForm({ ...logForm, tripId: e.target.value })}
                  placeholder="Trip ID"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                    Quantity (L)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={logForm.quantity}
                    onChange={(e) => setLogForm({ ...logForm, quantity: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                    Cost (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={logForm.cost}
                    onChange={(e) => setLogForm({ ...logForm, cost: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  Odometer Reading
                </label>
                <input
                  type="number"
                  value={logForm.odometerReading}
                  onChange={(e) => setLogForm({ ...logForm, odometerReading: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowLogForm(false);
                    setLogForm({ busId: '', tripId: '', quantity: '', cost: '', odometerReading: '' });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus className="icon-sm" />
                  Log Fuel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FuelMonitoring;
