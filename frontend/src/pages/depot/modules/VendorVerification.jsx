import React, { useState, useEffect } from 'react';
import { FileCheck, CheckCircle, XCircle, Fuel, Search, Filter } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import toast from 'react-hot-toast';

const VendorVerification = () => {
  const [vendorLogs, setVendorLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, verified, rejected

  useEffect(() => {
    fetchVendorLogs();
  }, [filter]);

  const fetchVendorLogs = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/depot/vendor/logs?status=${filter}`);
      if (res.ok) {
        const logs = res.data?.logs || res.data || [];
        setVendorLogs(Array.isArray(logs) ? logs : []);
      } else {
        setVendorLogs([]);
      }
    } catch (error) {
      // Handle missing endpoint gracefully
      setVendorLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (logId, action) => {
    try {
      const res = await apiFetch('/api/depot/vendor/verify', {
        method: 'POST',
        body: JSON.stringify({
          log_id: logId,
          action: action, // 'approve' or 'reject'
          verified_by: 'DEPOT_MGR_01'
        }),
        suppressError: true
      });
      if (res.ok) {
        toast.success(action === 'approve' ? 'Vendor log verified successfully!' : 'Vendor log rejected');
        fetchVendorLogs();
      } else {
        toast.error(res.message || `Failed to ${action} vendor log`);
      }
    } catch (error) {
      toast.error(`Error ${action === 'approve' ? 'verifying' : 'rejecting'} vendor log. Please try again.`);
    }
  };

  const handleForwardToAdmin = async (logId) => {
    if (!window.confirm('Forward this vendor log to admin for payment processing?')) return;
    
    try {
      const res = await apiFetch('/api/depot/vendor/forward', {
        method: 'POST',
        body: JSON.stringify({ log_id: logId }),
        suppressError: true
      });
      if (res.ok) {
        toast.success('Vendor log forwarded to admin successfully!');
        fetchVendorLogs();
      } else {
        toast.error(res.message || 'Failed to forward vendor log');
      }
    } catch (error) {
      toast.error('Error forwarding vendor log. Please try again.');
    }
  };

  return (
    <div>
      {/* Filter */}
      <div className="module-card">
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
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
              <option value="pending">Pending Verification</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
              <option value="forwarded">Forwarded to Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vendor Logs */}
      <div className="module-card">
        <div className="module-card-header">
          <h3 className="module-card-title">
            <FileCheck className="icon-md" />
            Vendor Consumption Logs
          </h3>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
            <p>Loading vendor logs...</p>
          </div>
        ) : vendorLogs.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Vendor</th>
                  <th>Trip</th>
                  <th>Fuel Quantity (L)</th>
                  <th>Cost (₹)</th>
                  <th>Trip Usage (L)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendorLogs.map((log, index) => (
                  <tr key={log._id || index}>
                    <td>
                      {log.date
                        ? new Date(log.date).toLocaleDateString('en-IN')
                        : 'N/A'
                      }
                    </td>
                    <td>{log.vendorName || log.vendor?.name || 'N/A'}</td>
                    <td>{log.tripId?.tripNumber || log.trip?.tripNumber || 'N/A'}</td>
                    <td>{log.fuelQuantity || 0}L</td>
                    <td>₹{log.cost || 0}</td>
                    <td>{log.tripUsage || 0}L</td>
                    <td>
                      <span className={`status-badge ${log.status || 'pending'}`}>
                        {log.status || 'pending'}
                      </span>
                    </td>
                    <td>
                      {log.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn btn-success"
                            onClick={() => handleVerify(log._id, 'approve')}
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            <CheckCircle className="icon-xs" />
                            Verify
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleVerify(log._id, 'reject')}
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            <XCircle className="icon-xs" />
                            Reject
                          </button>
                        </div>
                      )}
                      {log.status === 'verified' && (
                        <button
                          className="btn btn-primary"
                          onClick={() => handleForwardToAdmin(log._id)}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Forward to Admin
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <FileCheck className="empty-state-icon" />
            <p className="empty-state-text">No vendor logs found</p>
          </div>
        )}
      </div>

      {/* Verification Summary */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <div className="kpi-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
              <FileCheck className="icon-lg" />
            </div>
          </div>
          <div className="kpi-value">
            {vendorLogs.filter(log => log.status === 'pending').length}
          </div>
          <div className="kpi-label">Pending Verification</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-header">
            <div className="kpi-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
              <CheckCircle className="icon-lg" />
            </div>
          </div>
          <div className="kpi-value">
            {vendorLogs.filter(log => log.status === 'verified').length}
          </div>
          <div className="kpi-label">Verified</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-header">
            <div className="kpi-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}>
              <Fuel className="icon-lg" />
            </div>
          </div>
          <div className="kpi-value">
            {vendorLogs.reduce((sum, log) => sum + (log.fuelQuantity || 0), 0)}L
          </div>
          <div className="kpi-label">Total Fuel Verified</div>
        </div>
      </div>
    </div>
  );
};

export default VendorVerification;
