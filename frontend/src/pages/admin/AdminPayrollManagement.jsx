import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, Building2, User, CheckCircle, XCircle, Clock, RefreshCw, Download, Plus, Filter } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import toast from 'react-hot-toast';

const AdminPayrollManagement = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filters, setFilters] = useState({
    depotId: '',
    month: '',
    year: new Date().getFullYear(),
    status: ''
  });
  const [depots, setDepots] = useState([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    depotId: ''
  });
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchDepots();
    fetchPayrolls();
  }, []);

  useEffect(() => {
    fetchPayrolls();
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

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.depotId) params.append('depotId', filters.depotId);
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', filters.year);
      if (filters.status) params.append('status', filters.status);

      const res = await apiFetch(`/api/admin/payroll?${params.toString()}`);
      if (res.ok && res.data?.success) {
        const payrollList = res.data.data?.payrolls || res.data.payrolls || [];
        setPayrolls(payrollList);
        setTotal(res.data.data?.total || res.data.total || payrollList.length);
      } else {
        toast.error('Failed to fetch payroll records');
      }
    } catch (error) {
      console.error('Error fetching payroll:', error);
      toast.error('Error fetching payroll records');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayroll = async () => {
    if (!generateForm.month || !generateForm.year) {
      toast.error('Month and year are required');
      return;
    }

    setGenerating(true);
    try {
      const res = await apiFetch('/api/admin/payroll/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: parseInt(generateForm.month),
          year: parseInt(generateForm.year),
          depotId: generateForm.depotId || undefined
        })
      });

      if (res.ok && res.data?.success) {
        toast.success(`Payroll generated: ${res.data.data?.generated || 0} records created`);
        setShowGenerateModal(false);
        fetchPayrolls();
      } else {
        toast.error(res.data?.error || 'Failed to generate payroll');
      }
    } catch (error) {
      console.error('Error generating payroll:', error);
      toast.error('Error generating payroll');
    } finally {
      setGenerating(false);
    }
  };

  const handleFinalize = async (payrollId) => {
    if (!confirm('Are you sure you want to finalize this payroll? It cannot be modified after finalization.')) {
      return;
    }

    try {
      const res = await apiFetch(`/api/admin/payroll/${payrollId}/finalize`, {
        method: 'PUT'
      });

      if (res.ok && res.data?.success) {
        toast.success('Payroll finalized successfully');
        fetchPayrolls();
      } else {
        toast.error(res.data?.error || 'Failed to finalize payroll');
      }
    } catch (error) {
      console.error('Error finalizing payroll:', error);
      toast.error('Error finalizing payroll');
    }
  };

  const handleMarkPaid = async (payrollId) => {
    if (!confirm('Mark this payroll as paid?')) {
      return;
    }

    try {
      const res = await apiFetch(`/api/admin/payroll/${payrollId}/mark-paid`, {
        method: 'PUT'
      });

      if (res.ok && res.data?.success) {
        toast.success('Payroll marked as paid');
        fetchPayrolls();
      } else {
        toast.error(res.data?.error || 'Failed to mark payroll as paid');
      }
    } catch (error) {
      console.error('Error marking payroll as paid:', error);
      toast.error('Error marking payroll as paid');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT': return { bg: '#fef3c7', color: '#f59e0b' };
      case 'FINALIZED': return { bg: '#dbeafe', color: '#3b82f6' };
      case 'PAID': return { bg: '#d1fae5', color: '#10b981' };
      default: return { bg: '#f1f5f9', color: '#64748b' };
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
            <p className="text-gray-600 mt-2">
              Generate and manage monthly payroll based on attendance records
            </p>
          </div>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Generate Payroll
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <Calendar className="w-4 h-4 inline mr-1" />
                Month
              </label>
              <select
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Months</option>
                {months.map((month, index) => (
                  <option key={index + 1} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <input
                type="number"
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="2020"
                max={new Date().getFullYear() + 1}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="FINALIZED">Finalized</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Payroll Records</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
            <button
              onClick={fetchPayrolls}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Payroll Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading payroll records...</p>
            </div>
          ) : payrolls.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No payroll records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Depot</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payrolls.map((payroll, index) => {
                    const statusColors = getStatusColor(payroll.status);
                    return (
                      <tr key={payroll._id || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {payroll.staffId?.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {payroll.staffType || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payroll.depotId?.depotName || payroll.depotId?.depotCode || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {months[payroll.month - 1]} {payroll.year}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div>Present: {payroll.presentDays}</div>
                            <div>Absent: {payroll.absentDays}</div>
                            <div>Leave: {payroll.leaveDays}</div>
                            <div className="font-medium">Payable: {payroll.payableDays}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              ₹{payroll.netSalary?.toLocaleString('en-IN') || '0'}
                            </div>
                            <div className="text-gray-500">
                              (₹{payroll.perDayRate}/day)
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className="px-2 py-1 text-xs font-semibold rounded-full"
                            style={{ backgroundColor: statusColors.bg, color: statusColors.color }}
                          >
                            {payroll.status || 'DRAFT'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            {payroll.status === 'DRAFT' && (
                              <button
                                onClick={() => handleFinalize(payroll._id)}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                              >
                                Finalize
                              </button>
                            )}
                            {payroll.status === 'FINALIZED' && (
                              <button
                                onClick={() => handleMarkPaid(payroll._id)}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                              >
                                Mark Paid
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Generate Payroll Modal */}
        {showGenerateModal && (
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
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 className="text-lg font-semibold mb-4">Generate Payroll</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                  <select
                    value={generateForm.month}
                    onChange={(e) => setGenerateForm({ ...generateForm, month: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {months.map((month, index) => (
                      <option key={index + 1} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                  <input
                    type="number"
                    value={generateForm.year}
                    onChange={(e) => setGenerateForm({ ...generateForm, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="2020"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Depot (Optional - Leave empty for all)</label>
                  <select
                    value={generateForm.depotId}
                    onChange={(e) => setGenerateForm({ ...generateForm, depotId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">All Depots</option>
                    {depots.map(depot => (
                      <option key={depot._id} value={depot._id}>
                        {depot.depotName || depot.depotCode}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleGeneratePayroll}
                    disabled={generating}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {generating ? 'Generating...' : 'Generate'}
                  </button>
                  <button
                    onClick={() => setShowGenerateModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPayrollManagement;
