import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import studentApiService from '../../services/studentApiService';
import {
  GraduationCap, QrCode, Calendar, TrendingUp, Wallet, Clock,
  CheckCircle, AlertCircle, RefreshCw, LogOut, History, CreditCard,
  User, FileText, Bell, HelpCircle, Settings, MapPin, Bus,
  Upload, Download, Edit, X, Send, Plus, Search, Filter,
  Shield, Award, BarChart3, Receipt, FileCheck, Ticket
} from 'lucide-react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

const StudentDashboardIndustry = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pass');
  const [passData, setPassData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [usageHistory, setUsageHistory] = useState([]);
  const [availableRoutes, setAvailableRoutes] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    route: '',
    date: '',
    boardingPoint: '',
    destinationPoint: ''
  });

  useEffect(() => {
    if (user && user.role === 'student') {
      fetchPass();
      fetchDashboard();
      fetchUsageHistory();
      fetchRoutes();
    }
  }, [user]);

  const fetchPass = async () => {
    try {
      const response = await studentApiService.getPass();
      if (response && response.success) {
        setPassData(response.data.pass);
      }
    } catch (error) {
      console.error('Error fetching pass:', error);
      toast.error('Failed to load digital pass');
    }
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await studentApiService.getDashboard();
      if (response && response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageHistory = async () => {
    try {
      const response = await studentApiService.getUsageHistory();
      if (response && response.success) {
        setUsageHistory(response.data.usageHistory || []);
      }
    } catch (error) {
      console.error('Error fetching usage history:', error);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await studentApiService.getRoutes();
      if (response && response.success) {
        setAvailableRoutes(response.data.routes || []);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const handleBookTrip = async () => {
    try {
      if (!bookingForm.route || !bookingForm.date) {
        toast.error('Please select route and date');
        return;
      }

      // Auto-apply concession (50% off)
      const selectedRoute = availableRoutes.find(r => r._id === bookingForm.route);
      const baseFare = selectedRoute?.fare || 0;
      const concessionFare = baseFare * 0.5; // 50% concession

      const response = await studentApiService.bookTrip({
        ...bookingForm,
        fare: concessionFare,
        subsidyAmount: baseFare - concessionFare
      });

      if (response && response.success) {
        toast.success('Trip booked successfully with 50% concession!');
        setShowBookingModal(false);
        fetchUsageHistory();
        fetchDashboard();
      }
    } catch (error) {
      toast.error('Failed to book trip');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const studentPass = dashboardData?.studentPass || passData || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
                <p className="text-sm text-gray-500">Digital Pass & Concession Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Pass Status</p>
                <p className={`text-lg font-semibold ${
                  studentPass.status === 'approved' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {studentPass.status === 'approved' ? 'Active' : 'Pending'}
                </p>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {['pass', 'book-trip', 'history', 'concession'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Digital Pass Tab */}
        {activeTab === 'pass' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Digital Student Pass</h2>
                <p className="text-gray-600">Pass #{studentPass.passNumber || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* QR Code */}
                <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
                  {passData?.qrCode ? (
                    <>
                      <img src={passData.qrCode} alt="QR Code" className="w-64 h-64 mb-4" />
                      <p className="text-sm text-gray-600 text-center mb-4">
                        Show this QR code to the conductor when boarding
                      </p>
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = passData.qrCode;
                          link.download = `student-pass-${studentPass.passNumber}.png`;
                          link.click();
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download QR Code</span>
                      </button>
                    </>
                  ) : (
                    <div className="text-center">
                      <QrCode className="w-32 h-32 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">QR code will be generated after pass approval</p>
                    </div>
                  )}
                </div>

                {/* Pass Details */}
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Student Information</h3>
                    <p className="text-sm text-gray-600">Name: {studentPass.student?.name || 'N/A'}</p>
                    <p className="text-sm text-gray-600">Institution: {studentPass.student?.institution || 'N/A'}</p>
                    <p className="text-sm text-gray-600">Course: {studentPass.student?.course || 'N/A'}</p>
                    <p className="text-sm text-gray-600">Roll Number: {studentPass.student?.rollNumber || 'N/A'}</p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Concession Details</h3>
                    <p className="text-lg font-bold text-green-600">{studentPass.concessionRate || '50%'} Concession</p>
                    <p className="text-sm text-gray-600">Applied automatically on all bookings</p>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Validity Status</h3>
                    {studentPass.validity?.isActive ? (
                      <>
                        <p className="text-sm text-gray-600">
                          Valid from: {new Date(studentPass.validity.startDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Valid until: {new Date(studentPass.validity.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm font-semibold text-green-600 mt-2">
                          {studentPass.validity.remainingDays} days remaining
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-red-600">Pass is not active</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Trips</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalTrips || 0}</p>
                  </div>
                  <Bus className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Savings</p>
                    <p className="text-2xl font-bold text-gray-900">₹{(stats.subsidy?.totalSavings || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pass Expiry</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.passExpiryDays || 0} days</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Book Trip Tab */}
        {activeTab === 'book-trip' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Book Trip with Auto-Concession</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Route</label>
                  <select
                    value={bookingForm.route}
                    onChange={(e) => setBookingForm({ ...bookingForm, route: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Select a route</option>
                    {availableRoutes.map((route) => (
                      <option key={route._id} value={route._id}>
                        {route.from} → {route.to} (Base Fare: ₹{route.fare}, Concession: ₹{route.concessionFare || route.fare * 0.5})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Travel Date</label>
                  <input
                    type="date"
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Boarding Point</label>
                  <input
                    type="text"
                    value={bookingForm.boardingPoint}
                    onChange={(e) => setBookingForm({ ...bookingForm, boardingPoint: e.target.value })}
                    placeholder="Enter boarding point"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Destination Point</label>
                  <input
                    type="text"
                    value={bookingForm.destinationPoint}
                    onChange={(e) => setBookingForm({ ...bookingForm, destinationPoint: e.target.value })}
                    placeholder="Enter destination point"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                {bookingForm.route && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Selected Route:</p>
                    {(() => {
                      const selectedRoute = availableRoutes.find(r => r._id === bookingForm.route);
                      return selectedRoute ? (
                        <div className="mt-2">
                          <p className="font-semibold">{selectedRoute.from} → {selectedRoute.to}</p>
                          <p className="text-sm text-gray-600">Base Fare: ₹{selectedRoute.fare}</p>
                          <p className="text-sm font-semibold text-green-600">
                            Concession Applied: ₹{selectedRoute.concessionFare || selectedRoute.fare * 0.5} (50% off)
                          </p>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
                <button
                  onClick={handleBookTrip}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                >
                  Book Trip with Concession
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Travel History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Travel History</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fare</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subsidy</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usageHistory.map((trip, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(trip.travelDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {trip.route || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{trip.fare || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          ₹{trip.subsidyAmount || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            Completed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Concession Details Tab */}
        {activeTab === 'concession' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Concession Details</h2>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Concession Rate</h3>
                  <p className="text-3xl font-bold text-blue-600">50%</p>
                  <p className="text-sm text-gray-600 mt-2">Applied automatically on all bookings</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Total Savings</h3>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{(stats.subsidy?.totalSavings || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">This month: ₹{(stats.subsidy?.savingsThisMonth || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Important Notes</h3>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>Concession is automatically applied - no manual input required</li>
                    <li>Show your digital pass QR code to the conductor when boarding</li>
                    <li>Concession is valid only on approved routes</li>
                    <li>Pass must be active and not expired</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboardIndustry;
