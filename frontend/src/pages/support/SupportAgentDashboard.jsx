import React, { useState, useEffect } from 'react';
import {
  Search,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  User,
  Filter,
  Download,
  RefreshCw,
  Clock,
  FileText,
  TrendingUp,
  Users
} from 'lucide-react';
import axios from 'axios';

const SupportAgentDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [searchType, setSearchType] = useState('pnr');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refundBookingId, setRefundBookingId] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundNotes, setRefundNotes] = useState('');
  const [bookings, setBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardStats();
    }
  }, [activeTab]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/support/dashboard/stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setDashboardStats(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter a search query');
      return;
    }

    try {
      setLoading(true);
      let endpoint = '';
      
      if (searchType === 'pnr') {
        endpoint = `/api/support/booking/pnr/${searchQuery}`;
      } else if (searchType === 'phone') {
        endpoint = `/api/support/booking/phone/${searchQuery}`;
      } else if (searchType === 'email') {
        endpoint = `/api/support/booking/email/${searchQuery}`;
      }

      const response = await axios.get(`http://localhost:5000${endpoint}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setSearchResults(response.data.data);
    } catch (error) {
      console.error('Error searching booking:', error);
      alert(error.response?.data?.message || 'Error searching booking');
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!refundBookingId || !refundReason) {
      alert('Booking ID and reason are required');
      return;
    }

    if (!window.confirm('Are you sure you want to initiate this refund?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5000/api/support/refund/initiate', {
        bookingId: refundBookingId,
        reason: refundReason,
        refundAmount: refundAmount ? parseFloat(refundAmount) : undefined,
        notes: refundNotes
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      alert('Refund initiated successfully!');
      setRefundBookingId('');
      setRefundReason('');
      setRefundAmount('');
      setRefundNotes('');
      fetchDashboardStats();
    } catch (error) {
      console.error('Error initiating refund:', error);
      alert(error.response?.data?.message || 'Error initiating refund');
    } finally {
      setLoading(false);
    }
  };

  const searchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (filterStatus) params.append('status', filterStatus);

      const response = await axios.get(`http://localhost:5000/api/support/bookings/search?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setBookings(response.data.data.bookings);
    } catch (error) {
      console.error('Error searching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Today</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {dashboardStats?.today?.bookings || 0}
          </h3>
          <p className="text-sm text-gray-600">Total Bookings</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Today</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            ₹{(dashboardStats?.today?.revenue || 0).toLocaleString()}
          </h3>
          <p className="text-sm text-gray-600">Revenue</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm text-gray-500">Today</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {dashboardStats?.today?.refunds || 0}
          </h3>
          <p className="text-sm text-gray-600">Refunds Processed</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-sm text-gray-500">Pending</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {dashboardStats?.pendingRefunds || 0}
          </h3>
          <p className="text-sm text-gray-600">Pending Refunds</p>
        </div>
      </div>

      {/* Recent Issues */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Recent Issues (24 hours)</h3>
          <p className="text-sm text-gray-600 mt-1">Latest customer support tickets and refunds</p>
        </div>
        <div className="p-6">
          {dashboardStats?.recentIssues && dashboardStats.recentIssues.length > 0 ? (
            <div className="space-y-3">
              {dashboardStats.recentIssues.map((issue, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className={`w-5 h-5 ${
                      issue.severity === 'high' ? 'text-red-600' :
                      issue.severity === 'medium' ? 'text-orange-600' :
                      'text-blue-600'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">{issue.action}</p>
                      <p className="text-sm text-gray-600">{issue.userId}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(issue.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent issues</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderBookingLookup = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Booking Lookup</h3>
          <p className="text-sm text-gray-600 mt-1">Search for bookings by PNR, phone, or email</p>
        </div>
        <div className="p-6">
          <div className="flex gap-4 mb-6">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="pnr">PNR</option>
              <option value="phone">Phone Number</option>
              <option value="email">Email</option>
            </select>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Enter ${searchType.toUpperCase()}...`}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>

          {searchResults && (
            <div className="mt-6 p-6 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-4">Search Results</h4>
              {Array.isArray(searchResults) ? (
                <div className="space-y-4">
                  {searchResults.map((booking, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Passenger</p>
                          <p className="font-medium text-gray-900">{booking.passengerName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Seat</p>
                          <p className="font-medium text-gray-900">{booking.seatNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Fare</p>
                          <p className="font-medium text-gray-900">₹{booking.fareAmount}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            booking.status === 'paid' ? 'bg-green-100 text-green-800' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">PNR</p>
                      <p className="font-medium text-gray-900">{searchResults.pnr}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Passenger</p>
                      <p className="font-medium text-gray-900">{searchResults.passengerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Seat</p>
                      <p className="font-medium text-gray-900">{searchResults.seatNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Fare</p>
                      <p className="font-medium text-gray-900">₹{searchResults.fareAmount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Boarding</p>
                      <p className="font-medium text-gray-900">{searchResults.boardingStop}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Destination</p>
                      <p className="font-medium text-gray-900">{searchResults.destinationStop}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        searchResults.status === 'active' ? 'bg-green-100 text-green-800' :
                        searchResults.status === 'validated' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {searchResults.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderRefundManagement = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Initiate Refund</h3>
          <p className="text-sm text-gray-600 mt-1">Process refund requests for customers</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booking ID <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={refundBookingId}
                onChange={(e) => setRefundBookingId(e.target.value)}
                placeholder="Enter booking ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refund Reason <span className="text-red-600">*</span>
              </label>
              <select
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select reason</option>
                <option value="trip_cancelled">Trip Cancelled</option>
                <option value="bus_breakdown">Bus Breakdown</option>
                <option value="customer_request">Customer Request</option>
                <option value="duplicate_booking">Duplicate Booking</option>
                <option value="payment_issue">Payment Issue</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refund Amount (Optional - leave empty for full refund)
              </label>
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="Enter custom refund amount"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={refundNotes}
                onChange={(e) => setRefundNotes(e.target.value)}
                rows={3}
                placeholder="Enter any additional notes..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setRefundBookingId('');
                  setRefundReason('');
                  setRefundAmount('');
                  setRefundNotes('');
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleRefund}
                disabled={loading || !refundBookingId || !refundReason}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Initiate Refund
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Support Agent Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage customer support and bookings</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Dashboard</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('lookup')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                activeTab === 'lookup'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Search className="w-4 h-4" />
                <span>Booking Lookup</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('refund')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                activeTab === 'refund'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" />
                <span>Refund Management</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'lookup' && renderBookingLookup()}
        {activeTab === 'refund' && renderRefundManagement()}
      </div>
    </div>
  );
};

export default SupportAgentDashboard;

