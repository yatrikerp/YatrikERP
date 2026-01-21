import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Bus, Wrench, AlertTriangle, CheckCircle, Plus, Search } from 'lucide-react';
import { apiFetch } from '../../../utils/api';

const BusMaintenance = () => {
  const [buses, setBuses] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogForm, setShowLogForm] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);
  const [logForm, setLogForm] = useState({
    type: 'routine',
    description: '',
    cost: '',
    nextServiceDate: ''
  });

  useEffect(() => {
    fetchBuses();
    fetchMaintenanceLogs();
    fetchAlerts();
    
    // Real-time refresh every 30 seconds
    const interval = setInterval(() => {
      fetchBuses();
      fetchMaintenanceLogs();
      fetchAlerts();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchBuses = async () => {
    try {
      const res = await apiFetch('/api/depot/buses');
      if (res.ok) {
        // Ensure buses is always an array
        let busesData = res.data?.buses || res.data || [];
        if (!Array.isArray(busesData)) {
          busesData = [];
        }
        setBuses(busesData);
      } else {
        // If API call fails, ensure buses is still an array
        setBuses([]);
      }
    } catch (error) {
      console.error('Error fetching buses:', error);
      setBuses([]); // Set to empty array on error
    }
  };

  const fetchMaintenanceLogs = async () => {
    try {
      const res = await apiFetch('/api/depot/maintenance/logs');
      if (res.ok) {
        const logs = res.data?.logs || res.data || [];
        setMaintenanceLogs(Array.isArray(logs) ? logs : []);
      } else {
        setMaintenanceLogs([]);
      }
    } catch (error) {
      // Handle missing endpoint gracefully
      setMaintenanceLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await apiFetch('/api/depot/maintenance/alerts');
      if (res.ok) {
        const alertsData = res.data?.alerts || res.data || [];
        setAlerts(Array.isArray(alertsData) ? alertsData : []);
      } else {
        setAlerts([]);
      }
    } catch (error) {
      // Handle missing endpoint gracefully
      setAlerts([]);
    }
  };

  const handleLogMaintenance = async (e) => {
    e.preventDefault();
    if (!selectedBus?._id) {
      toast.error('Please select a bus');
      return;
    }
    
    try {
      const res = await apiFetch('/api/depot/maintenance/log', {
        method: 'POST',
        body: JSON.stringify({
          bus_id: selectedBus?._id,
          ...logForm
        }),
        suppressError: true
      });
      if (res.ok) {
        toast.success('Maintenance logged successfully!');
        setShowLogForm(false);
        setLogForm({ type: 'routine', description: '', cost: '', nextServiceDate: '' });
        fetchMaintenanceLogs();
        fetchBuses();
      } else {
        toast.error(res.message || 'Failed to log maintenance');
      }
    } catch (error) {
      toast.error('Error logging maintenance. Please try again.');
      setShowLogForm(false);
      setLogForm({ type: 'routine', description: '', cost: '', nextServiceDate: '' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'idle': return '#64748b';
      case 'maintenance': return '#f59e0b';
      case 'out_of_service': return '#ef4444';
      default: return '#64748b';
    }
  };

  return (
    <div>
      {/* AI Alerts */}
      {alerts.length > 0 && (
        <div className="module-card" style={{ background: '#fef3c7', border: '1px solid #f59e0b' }}>
          <div className="module-card-header">
            <h3 className="module-card-title" style={{ color: '#92400e' }}>
              <AlertTriangle className="icon-md" />
              AI Maintenance Alerts
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {alerts.map((alert, index) => (
              <div
                key={index}
                style={{
                  padding: '12px',
                  background: 'white',
                  borderRadius: '8px',
                  borderLeft: '4px solid #f59e0b'
                }}
              >
                <p style={{ margin: '0 0 4px 0', fontWeight: 600, fontSize: '14px' }}>
                  {alert.busNumber || alert.bus?.busNumber}: {alert.message}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                  Predicted service date: {alert.predictedServiceDate || 'N/A'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bus Status Grid */}
      <div className="module-card">
        <div className="module-card-header">
          <h3 className="module-card-title">
            <Bus className="icon-md" />
            Bus Status
          </h3>
          <button className="btn btn-primary" onClick={() => setShowLogForm(true)}>
            <Plus className="icon-sm" />
            Log Maintenance
          </button>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
            <p>Loading buses...</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bus Number</th>
                  <th>Model</th>
                  <th>Status</th>
                  <th>Last Service</th>
                  <th>Next Service</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(buses) && buses.length > 0 ? (
                  buses.map((bus, index) => (
                    <tr key={bus._id || index}>
                    <td style={{ fontWeight: 600 }}>{bus.busNumber || bus.number || `BUS-${index + 1}`}</td>
                    <td>{bus.model || bus.busModel || 'N/A'}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          background: getStatusColor(bus.status) + '20',
                          color: getStatusColor(bus.status)
                        }}
                      >
                        {bus.status || 'active'}
                      </span>
                    </td>
                    <td>
                      {bus.lastServiceDate
                        ? new Date(bus.lastServiceDate).toLocaleDateString('en-IN')
                        : 'N/A'
                      }
                    </td>
                    <td>
                      {bus.nextServiceDate
                        ? new Date(bus.nextServiceDate).toLocaleDateString('en-IN')
                        : 'N/A'
                      }
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setSelectedBus(bus);
                          setShowLogForm(true);
                        }}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        <Wrench className="icon-xs" />
                        Service
                      </button>
                    </td>
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No buses found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Maintenance Logs */}
      <div className="module-card">
        <div className="module-card-header">
          <h3 className="module-card-title">
            <Wrench className="icon-md" />
            Recent Maintenance Logs
          </h3>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Bus</th>
                <th>Type</th>
                <th>Description</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {maintenanceLogs.length > 0 ? (
                maintenanceLogs.slice(0, 10).map((log, index) => (
                  <tr key={log._id || index}>
                    <td>
                      {log.date
                        ? new Date(log.date).toLocaleDateString('en-IN')
                        : 'N/A'
                      }
                    </td>
                    <td>{log.busId?.busNumber || log.bus?.busNumber || 'N/A'}</td>
                    <td>
                      <span className="status-badge">{log.type || 'routine'}</span>
                    </td>
                    <td>{log.description || 'N/A'}</td>
                    <td>₹{log.cost || 0}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No maintenance logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Maintenance Modal */}
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
              Log Maintenance
            </h3>
            <form onSubmit={handleLogMaintenance}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  Bus
                </label>
                <select
                  value={selectedBus?._id || ''}
                  onChange={(e) => {
                    const bus = Array.isArray(buses) ? buses.find(b => b._id === e.target.value) : null;
                    setSelectedBus(bus);
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                >
                  <option value="">Select Bus</option>
                  {Array.isArray(buses) && buses.map(bus => (
                    <option key={bus._id} value={bus._id}>
                      {bus.busNumber || bus.number}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  Type
                </label>
                <select
                  value={logForm.type}
                  onChange={(e) => setLogForm({ ...logForm, type: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                >
                  <option value="routine">Routine</option>
                  <option value="repair">Repair</option>
                  <option value="inspection">Inspection</option>
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  Description
                </label>
                <textarea
                  value={logForm.description}
                  onChange={(e) => setLogForm({ ...logForm, description: e.target.value })}
                  required
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                    Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={logForm.cost}
                    onChange={(e) => setLogForm({ ...logForm, cost: e.target.value })}
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
                    Next Service Date
                  </label>
                  <input
                    type="date"
                    value={logForm.nextServiceDate}
                    onChange={(e) => setLogForm({ ...logForm, nextServiceDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowLogForm(false);
                    setSelectedBus(null);
                    setLogForm({ type: 'routine', description: '', cost: '', nextServiceDate: '' });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle className="icon-sm" />
                  Log Maintenance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusMaintenance;
