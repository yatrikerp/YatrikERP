import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, XCircle, UserCheck, Search, Filter } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import toast from 'react-hot-toast';

const PassengerServices = () => {
  const [complaints, setComplaints] = useState([]);
  const [concessions, setConcessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('complaints'); // complaints, concessions
  const [filter, setFilter] = useState('all'); // all, pending, resolved

  useEffect(() => {
    if (activeTab === 'complaints') {
      fetchComplaints();
    } else {
      fetchConcessions();
    }
  }, [activeTab, filter]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/depot/complaints?status=${filter === 'all' ? '' : filter}`);
      if (res.ok) {
        const complaintsData = res.data?.complaints || res.data || [];
        setComplaints(Array.isArray(complaintsData) ? complaintsData : []);
      } else {
        setComplaints([]);
      }
    } catch (error) {
      // Handle missing endpoint gracefully
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchConcessions = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/depot/concessions?status=${filter === 'all' ? '' : filter}`);
      if (res.ok) {
        const concessionsData = res.data?.concessions || res.data || [];
        setConcessions(Array.isArray(concessionsData) ? concessionsData : []);
      } else {
        setConcessions([]);
      }
    } catch (error) {
      // Handle missing endpoint gracefully
      setConcessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveComplaint = async (complaintId) => {
    try {
      const res = await apiFetch('/api/depot/complaints/resolve', {
        method: 'PUT',
        body: JSON.stringify({ complaint_id: complaintId }),
        suppressError: true
      });
      if (res.ok) {
        toast.success('Complaint resolved successfully!');
        fetchComplaints();
      } else {
        toast.error(res.message || 'Failed to resolve complaint');
      }
    } catch (error) {
      toast.error('Error resolving complaint. Please try again.');
    }
  };

  const handleApproveConcession = async (concessionId) => {
    try {
      const res = await apiFetch('/api/depot/concession/approve', {
        method: 'POST',
        body: JSON.stringify({ concession_id: concessionId }),
        suppressError: true
      });
      if (res.ok) {
        toast.success('Concession approved successfully!');
        fetchConcessions();
      } else {
        toast.error(res.message || 'Failed to approve concession');
      }
    } catch (error) {
      toast.error('Error approving concession. Please try again.');
    }
  };

  const handleRejectConcession = async (concessionId) => {
    if (!window.confirm('Are you sure you want to reject this concession request?')) return;
    
    try {
      const res = await apiFetch('/api/depot/concession/reject', {
        method: 'POST',
        body: JSON.stringify({ concession_id: concessionId }),
        suppressError: true
      });
      if (res.ok) {
        toast.success('Concession rejected');
        fetchConcessions();
      } else {
        toast.error(res.message || 'Failed to reject concession');
      }
    } catch (error) {
      toast.error('Error rejecting concession. Please try again.');
    }
  };

  return (
    <div>
      {/* Tabs */}
      <div className="module-card">
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('complaints')}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'complaints' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'complaints' ? '#3b82f6' : '#64748b',
              fontWeight: activeTab === 'complaints' ? 600 : 500,
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            <MessageSquare className="icon-sm" style={{ display: 'inline', marginRight: '8px' }} />
            Complaints
          </button>
          <button
            onClick={() => setActiveTab('concessions')}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'concessions' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'concessions' ? '#3b82f6' : '#64748b',
              fontWeight: activeTab === 'concessions' ? 600 : 500,
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            <UserCheck className="icon-sm" style={{ display: 'inline', marginRight: '8px' }} />
            Concession Requests
          </button>
        </div>

        {/* Filter */}
        <div style={{ marginBottom: '20px' }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '10px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Complaints Tab */}
      {activeTab === 'complaints' && (
        <div className="module-card">
          <div className="module-card-header">
            <h3 className="module-card-title">
              <MessageSquare className="icon-md" />
              Passenger Complaints
            </h3>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
              <p>Loading complaints...</p>
            </div>
          ) : complaints.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Passenger</th>
                    <th>Trip</th>
                    <th>Complaint</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((complaint, index) => (
                    <tr key={complaint._id || index}>
                      <td>
                        {complaint.date
                          ? new Date(complaint.date).toLocaleDateString('en-IN')
                          : 'N/A'
                        }
                      </td>
                      <td>{complaint.passengerName || complaint.passenger?.name || 'N/A'}</td>
                      <td>{complaint.tripId?.tripNumber || complaint.trip?.tripNumber || 'N/A'}</td>
                      <td>
                        <div style={{ maxWidth: '300px' }}>
                          <p style={{ margin: 0, fontSize: '14px' }}>
                            {complaint.description || complaint.message || 'N/A'}
                          </p>
                          {complaint.category && (
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              Category: {complaint.category}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${complaint.status || 'pending'}`}>
                          {complaint.status || 'pending'}
                        </span>
                      </td>
                      <td>
                        {complaint.status === 'pending' && (
                          <button
                            className="btn btn-success"
                            onClick={() => handleResolveComplaint(complaint._id)}
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            <CheckCircle className="icon-xs" />
                            Resolve
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
              <MessageSquare className="empty-state-icon" />
              <p className="empty-state-text">No complaints found</p>
            </div>
          )}
        </div>
      )}

      {/* Concessions Tab */}
      {activeTab === 'concessions' && (
        <div className="module-card">
          <div className="module-card-header">
            <h3 className="module-card-title">
              <UserCheck className="icon-md" />
              Concession Requests
            </h3>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
              <p>Loading concession requests...</p>
            </div>
          ) : concessions.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Passenger</th>
                    <th>Type</th>
                    <th>Document</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {concessions.map((concession, index) => (
                    <tr key={concession._id || index}>
                      <td>
                        {concession.date
                          ? new Date(concession.date).toLocaleDateString('en-IN')
                          : 'N/A'
                        }
                      </td>
                      <td>{concession.passengerName || concession.passenger?.name || 'N/A'}</td>
                      <td>
                        <span className="status-badge">
                          {concession.type || 'Student'}
                        </span>
                      </td>
                      <td>
                        {concession.documentUrl ? (
                          <a
                            href={concession.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#3b82f6', textDecoration: 'none' }}
                          >
                            View Document
                          </a>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${concession.status || 'pending'}`}>
                          {concession.status || 'pending'}
                        </span>
                      </td>
                      <td>
                        {concession.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="btn btn-success"
                              onClick={() => handleApproveConcession(concession._id)}
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              <CheckCircle className="icon-xs" />
                              Approve
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => handleRejectConcession(concession._id)}
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              <XCircle className="icon-xs" />
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <UserCheck className="empty-state-icon" />
              <p className="empty-state-text">No concession requests found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PassengerServices;
