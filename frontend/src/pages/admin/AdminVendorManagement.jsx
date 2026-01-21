import React, { useState, useEffect } from 'react';
import {
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Ban,
  TrendingUp,
  DollarSign,
  FileText,
  Package,
  ShoppingCart,
  AlertTriangle,
  RefreshCw,
  Plus,
  FileCheck,
  CreditCard,
  BarChart3,
  Settings
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

const AdminVendorManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    suspended: 0,
    totalInvoices: 0,
    pendingPayments: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchVendors();
    fetchStats();
  }, [statusFilter, typeFilter]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') queryParams.append('status', statusFilter);
      if (typeFilter && typeFilter !== 'all') queryParams.append('type', typeFilter);
      
      const queryString = queryParams.toString();
      const url = `/api/admin/vendors${queryString ? '?' + queryString : ''}`;
      
      const res = await apiFetch(url);
      if (res.ok && res.data) {
        // Backend returns: { success: true, data: { vendors: [], pagination: {} } }
        // apiFetch returns: { ok: true, data: { success: true, data: { vendors: [] } } }
        let vendorsData = [];
        if (res.data?.data?.vendors) {
          vendorsData = res.data.data.vendors;
        } else if (res.data?.vendors) {
          vendorsData = res.data.vendors;
        } else if (Array.isArray(res.data?.data)) {
          vendorsData = res.data.data;
        } else if (Array.isArray(res.data)) {
          vendorsData = res.data;
        }
        setVendors(Array.isArray(vendorsData) ? vendorsData : []);
      } else {
        console.error('Failed to fetch vendors:', res.message || 'Unknown error');
        setVendors([]);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await apiFetch('/api/admin/vendors/stats');
      if (res.ok && res.data) {
        // Backend returns: { success: true, data: { total, pending, ... } }
        // apiFetch returns: { ok: true, data: { success: true, data: { total, ... } } }
        const statsData = res.data?.data || res.data || {};
        setStats(prevStats => ({
          total: statsData.total ?? prevStats.total,
          pending: statsData.pending ?? prevStats.pending,
          approved: statsData.approved ?? prevStats.approved,
          rejected: statsData.rejected ?? prevStats.rejected,
          suspended: statsData.suspended ?? prevStats.suspended,
          totalInvoices: statsData.totalInvoices ?? prevStats.totalInvoices,
          pendingPayments: statsData.pendingPayments ?? prevStats.pendingPayments,
          totalRevenue: statsData.totalRevenue ?? prevStats.totalRevenue
        }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprove = async (vendorId) => {
    if (!window.confirm('Are you sure you want to approve this vendor?')) {
      return;
    }
    try {
      const res = await apiFetch(`/api/admin/vendors/${vendorId}/approve`, {
        method: 'POST'
      });
      if (res.ok) {
        alert('Vendor approved successfully!');
        fetchVendors();
        fetchStats();
        setShowVendorModal(false);
      } else {
        alert(`Failed to approve vendor: ${res.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error approving vendor:', error);
      alert('Error approving vendor. Please try again.');
    }
  };

  const handleReject = async (vendorId, reason) => {
    if (!reason || !reason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }
    try {
      const res = await apiFetch(`/api/admin/vendors/${vendorId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason.trim() })
      });
      if (res.ok) {
        alert('Vendor rejected successfully!');
        fetchVendors();
        fetchStats();
        setShowVendorModal(false);
      } else {
        alert(`Failed to reject vendor: ${res.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error rejecting vendor:', error);
      alert('Error rejecting vendor. Please try again.');
    }
  };

  const handleSuspend = async (vendorId) => {
    if (!window.confirm('Are you sure you want to suspend this vendor?')) {
      return;
    }
    try {
      const res = await apiFetch(`/api/admin/vendors/${vendorId}/suspend`, {
        method: 'POST'
      });
      if (res.ok) {
        alert('Vendor suspended successfully!');
        fetchVendors();
        fetchStats();
        setShowVendorModal(false);
      } else {
        alert(`Failed to suspend vendor: ${res.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error suspending vendor:', error);
      alert('Error suspending vendor. Please try again.');
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = 
      vendor.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.panNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.businessDetails?.gstNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'registration', name: 'Registration & Verification', icon: FileCheck },
    { id: 'ledger', name: 'Vendor Ledger', icon: FileText },
    { id: 'payments', name: 'Payments', icon: CreditCard },
    { id: 'spare-parts', name: 'Spare Parts', icon: Package },
    { id: 'auctions', name: 'Auctions', icon: ShoppingCart },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-gray-600 mt-1">Manage vendors, approvals, payments, and inventory</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Vendor</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Vendors"
          value={stats.total}
          icon={Building2}
          color="bg-blue-500"
          subtitle={`${stats.approved} approved, ${stats.pending} pending`}
        />
        <StatCard
          title="Pending Approval"
          value={stats.pending}
          icon={Clock}
          color="bg-yellow-500"
          subtitle="Awaiting verification"
        />
        <StatCard
          title="Pending Payments"
          value={`₹${stats.pendingPayments.toLocaleString()}`}
          icon={DollarSign}
          color="bg-green-500"
          subtitle={`${stats.totalInvoices} invoices`}
        />
        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          icon={TrendingUp}
          color="bg-purple-500"
          subtitle="All vendor transactions"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search vendors by name, email, PAN, or GST..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="suspended">Suspended</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="fuel">Fuel</option>
                  <option value="spare_parts">Spare Parts</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="auction_buyer">Auction Buyer</option>
                </select>
                <button
                  onClick={fetchVendors}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Vendors Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PAN / GST
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trust Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        </td>
                      </tr>
                    ) : filteredVendors.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                          No vendors found
                        </td>
                      </tr>
                    ) : (
                      filteredVendors.map((vendor) => (
                        <tr key={vendor._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {vendor.companyName || vendor.businessDetails?.vendorName || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">{vendor.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{vendor.panNumber || vendor.businessDetails?.panNumber || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{vendor.businessDetails?.gstNumber || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {vendor.companyType || 'other'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                vendor.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : vendor.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : vendor.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {vendor.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    vendor.trustScore >= 70
                                      ? 'bg-green-500'
                                      : vendor.trustScore >= 50
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                  }`}
                                  style={{ width: `${vendor.trustScore || 0}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-900">{vendor.trustScore || 0}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedVendor(vendor);
                                  setShowVendorModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {vendor.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(vendor._id)}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      const reason = prompt('Rejection reason:');
                                      if (reason) handleReject(vendor._id, reason);
                                    }}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {vendor.status === 'approved' && (
                                <button
                                  onClick={() => handleSuspend(vendor._id)}
                                  className="text-orange-600 hover:text-orange-900"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'registration' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Vendor Registration & Verification</h3>
                <p className="text-blue-700">
                  Review and verify vendor registrations. System automatically validates PAN format and GST structure.
                  Duplicate detection prevents multiple registrations with same PAN/GST.
                </p>
              </div>
              {/* Registration content will be shown in overview tab */}
            </div>
          )}

          {activeTab === 'ledger' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-900 mb-2">Auto-Generated Vendor Ledger</h3>
                <p className="text-green-700">
                  Invoices are automatically generated from trip logs, fuel logs, and maintenance records.
                  No manual billing required. System links bus trips → fuel usage → vendor → invoice.
                </p>
              </div>
              {/* Ledger content */}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">Payment Control & Audit</h3>
                <p className="text-purple-700">
                  Set payment cycles (weekly/monthly), auto-pay rules, threshold limits, and generate GST reports.
                  System detects abnormal fuel usage and duplicate invoices.
                </p>
              </div>
              {/* Payments content */}
            </div>
          )}

          {activeTab === 'spare-parts' && (
            <div className="space-y-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-orange-900 mb-2">Spare Parts Integration</h3>
                <p className="text-orange-700">
                  QR-based spare parts tagging. Track vendor → depot → bus movement. AI predicts part failure,
                  suggests reorder, and selects best vendor based on price + reliability score.
                </p>
              </div>
              {/* Spare parts content */}
            </div>
          )}

          {activeTab === 'auctions' && (
            <div className="space-y-6">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-indigo-900 mb-2">Auction Platform</h3>
                <p className="text-indigo-700">
                  Manage used assets (buses, engines, parts). Control vendor eligibility, bidding windows,
                  and final approval. Revenue flows directly into finance dashboard.
                </p>
              </div>
              {/* Auctions content */}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Vendor Settings</h3>
                <p className="text-gray-700">
                  Configure vendor categories, payment rules, fraud detection thresholds, and auto-approval criteria.
                </p>
              </div>
              {/* Settings content */}
            </div>
          )}
        </div>
      </div>

      {/* Vendor Detail Modal */}
      {showVendorModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Vendor Details</h2>
                <button
                  onClick={() => setShowVendorModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Vendor details will be shown here */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Company Name</label>
                  <p className="text-gray-900">{selectedVendor.companyName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{selectedVendor.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">PAN Number</label>
                  <p className="text-gray-900">{selectedVendor.panNumber || selectedVendor.businessDetails?.panNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">GST Number</label>
                  <p className="text-gray-900">{selectedVendor.businessDetails?.gstNumber || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVendorManagement;
