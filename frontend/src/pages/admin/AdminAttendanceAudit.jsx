import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, Calendar, User, Building2, RefreshCw, Download, X } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import toast from 'react-hot-toast';

const AdminAttendanceAudit = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    depotId: '',
    staffId: '',
    actionType: '',
    startDate: '',
    endDate: ''
  });
  const [depots, setDepots] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchDepots();
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [filters]);

  const fetchDepots = async () => {
    try {
      const res = await apiFetch('/api/admin/depots');
      if (res.ok && Array.isArray(res.data)) {
        setDepots(res.data);
      }
    } catch (error) {
      console.error('Error fetching depots:', error);
    }
  };

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.depotId) params.append('depotId', filters.depotId);
      if (filters.staffId) params.append('staffId', filters.staffId);
      if (filters.actionType) params.append('actionType', filters.actionType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('limit', '500');

      const res = await apiFetch(`/api/admin/attendance/audit?${params.toString()}`);
      if (res.ok && res.data?.success) {
        const logs = res.data.data?.auditLogs || res.data.auditLogs || [];
        setAuditLogs(logs);
        setTotal(res.data.data?.total || res.data.total || logs.length);
      } else {
        toast.error('Failed to fetch audit logs');
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Error fetching audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionTypeColor = (actionType) => {
    switch (actionType) {
      case 'MARK_PRESENT': return { bg: '#d1fae5', color: '#10b981' };
      case 'MARK_ABSENT': return { bg: '#fee2e2', color: '#ef4444' };
      case 'CONVERT_TO_LEAVE': return { bg: '#fef3c7', color: '#f59e0b' };
      case 'UPDATE': return { bg: '#dbeafe', color: '#3b82f6' };
      default: return { bg: '#f1f5f9', color: '#64748b' };
    }
  };

  const getStatusLabel = (status) => {
    if (!status) return 'N/A';
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Attendance Audit Log</h1>
          <p className="text-gray-600 mt-2">
            Complete audit trail of all attendance actions across all depots
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="w-4 h-4 inline mr-1" />
                Depot
              </label>
              <select
                value={filters.depotId}
                onChange={(e) => setFilters({ ...filters, depotId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Depots</option>
                {depots.map(depot => (
                  <option key={depot._id} value={depot._id}>
                    {depot.depotName || depot.depotCode}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Action Type
              </label>
              <select
                value={filters.actionType}
                onChange={(e) => setFilters({ ...filters, actionType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Actions</option>
                <option value="MARK_PRESENT">Mark Present</option>
                <option value="MARK_ABSENT">Mark Absent</option>
                <option value="CONVERT_TO_LEAVE">Convert to Leave</option>
                <option value="UPDATE">Update</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchAuditLogs}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Clear Filters */}
          {(filters.depotId || filters.staffId || filters.actionType || filters.startDate || filters.endDate) && (
            <button
              onClick={() => setFilters({ depotId: '', staffId: '', actionType: '', startDate: '', endDate: '' })}
              className="mt-4 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Audit Records</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">Immutable Audit Trail</span>
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading audit logs...</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Depot</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Old Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performed By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditLogs.map((log, index) => {
                    const actionColors = getActionTypeColor(log.actionType);
                    return (
                      <tr key={log._id || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {log.staffId?.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {log.staffType || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {log.depotId?.depotName || log.depotId?.depotCode || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className="px-2 py-1 text-xs font-semibold rounded-full"
                            style={{ backgroundColor: actionColors.bg, color: actionColors.color }}
                          >
                            {log.actionType?.replace(/_/g, ' ') || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getStatusLabel(log.oldStatus)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getStatusLabel(log.newStatus)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {log.reason || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {log.performedBy?.name || 'System'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {log.performedRole || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.performedAt
                            ? new Date(log.performedAt).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })
                            : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAttendanceAudit;
