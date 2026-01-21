import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import studentApiService from '../../services/studentApiService';
import {
  GraduationCap,
  QrCode,
  Calendar,
  TrendingUp,
  Wallet,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  LogOut,
  History,
  CreditCard,
  User,
  FileText,
  Bell,
  HelpCircle,
  Settings,
  MapPin,
  Bus,
  Upload,
  Download,
  Edit,
  X,
  Send,
  Plus,
  Search,
  Filter,
  BellRing,
  MessageSquare,
  Shield,
  Award,
  BarChart3,
  Receipt,
  FileCheck
} from 'lucide-react';
import './student.css';

const StudentDashboard = () => {
  // Debug: Verify component is loading
  useEffect(() => {
    console.log('✅ StudentDashboard component loaded - Version 2.0');
  }, []);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [usageHistory, setUsageHistory] = useState([]);
  const [renewing, setRenewing] = useState(false);
  
  // New state for additional features
  const [concessionStatus, setConcessionStatus] = useState(null);
  const [availableRoutes, setAvailableRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [showConcessionForm, setShowConcessionForm] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationMessage, setNotificationMessage] = useState(null);
  const [notificationType, setNotificationType] = useState('success'); // success, error, warning, info
  const [showToast, setShowToast] = useState(false);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);
  
  // Form states
  const [concessionForm, setConcessionForm] = useState({
    institutionName: '',
    course: '',
    year: '',
    studentId: '',
    idProof: null,
    idProofFile: null
  });
  
  const [bookingForm, setBookingForm] = useState({
    route: '',
    date: '',
    time: '',
    boardingPoint: '',
    destinationPoint: ''
  });
  
  const [supportForm, setSupportForm] = useState({
    subject: '',
    category: 'general',
    message: '',
    attachments: []
  });

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
    fetchConcessionStatus();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await studentApiService.getDashboard();
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConcessionStatus = async () => {
    try {
      const response = await studentApiService.getConcessionStatus();
      if (response.success) {
        setConcessionStatus(response.data);
      }
    } catch (error) {
      console.error('Error fetching concession status:', error);
    }
  };

  const fetchAvailableRoutes = async () => {
    try {
      setLoadingRoutes(true);
      const response = await studentApiService.getAvailableRoutes();
      if (response.success) {
        setAvailableRoutes(response.data.routes || []);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      showNotification('Failed to load routes. Please try again.', 'error');
    } finally {
      setLoadingRoutes(false);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoadingPayments(true);
      const response = await studentApiService.getPayments();
      if (response.success) {
        setPayments(response.data.payments || []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      showNotification('Failed to load payments. Please try again.', 'error');
    } finally {
      setLoadingPayments(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await studentApiService.getNotifications();
      if (response.success) {
        setNotifications(response.data.notifications || []);
        const unread = (response.data.notifications || []).filter(n => !n.read).length;
        setUnreadNotifications(unread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchSupportTickets = async () => {
    try {
      setLoadingTickets(true);
      const response = await studentApiService.getSupportTickets();
      if (response.success) {
        setSupportTickets(response.data.tickets || []);
      }
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      showNotification('Failed to load support tickets. Please try again.', 'error');
    } finally {
      setLoadingTickets(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await studentApiService.getProfile();
      if (response.success) {
        setProfile(response.data.studentPass);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchUsageHistory = async () => {
    try {
      const response = await studentApiService.getUsageHistory();
      if (response.success) {
        setUsageHistory(response.data.usageHistory || []);
      }
    } catch (error) {
      console.error('Error fetching usage history:', error);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  const handleRenew = async () => {
    try {
      setRenewing(true);
      const response = await studentApiService.renewPass();
      if (response.success) {
        showNotification('Pass renewed successfully!', 'success');
        fetchDashboardData();
      } else {
        showNotification(response.message || 'Failed to renew pass. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error renewing pass:', error);
      showNotification('Failed to renew pass. Please try again.', 'error');
    } finally {
      setRenewing(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'profile') {
      fetchProfile();
    } else if (activeTab === 'history') {
      fetchUsageHistory();
    } else if (activeTab === 'booking') {
      fetchAvailableRoutes();
    } else if (activeTab === 'payments') {
      fetchPayments();
    } else if (activeTab === 'support') {
      fetchSupportTickets();
    }
  }, [activeTab]);

  const handleConcessionSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('institutionName', concessionForm.institutionName);
      formData.append('course', concessionForm.course);
      formData.append('year', concessionForm.year);
      formData.append('studentId', concessionForm.studentId);
      if (concessionForm.idProofFile) {
        formData.append('idProof', concessionForm.idProofFile);
      }

      const response = await studentApiService.applyForConcession(formData);
      if (response.success) {
        showNotification('Concession application submitted successfully!', 'success');
        setShowConcessionForm(false);
        setConcessionForm({
          institutionName: '',
          course: '',
          year: '',
          studentId: '',
          idProof: null,
          idProofFile: null
        });
        fetchConcessionStatus();
        fetchDashboardData();
      } else {
        showNotification(response.message || 'Failed to submit application', 'error');
      }
    } catch (error) {
      console.error('Error submitting concession:', error);
      showNotification('Failed to submit application. Please try again.', 'error');
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoute && !bookingForm.route) {
      showNotification('Please select a route', 'warning');
      return;
    }
    try {
      const bookingData = {
        ...bookingForm,
        route: selectedRoute?._id || selectedRoute?.name || bookingForm.route,
        fare: selectedRoute?.concessionFare || selectedRoute?.fare * 0.5 || 0
      };
      const response = await studentApiService.bookTrip(bookingData);
      if (response.success) {
        showNotification('Trip booked successfully!', 'success');
        setShowBookingModal(false);
        setSelectedRoute(null);
        setBookingForm({
          route: '',
          date: '',
          time: '',
          boardingPoint: '',
          destinationPoint: ''
        });
        fetchAvailableRoutes();
        fetchUsageHistory();
        fetchDashboardData();
      } else {
        showNotification(response.message || 'Failed to book trip', 'error');
      }
    } catch (error) {
      console.error('Error booking trip:', error);
      showNotification('Failed to book trip. Please try again.', 'error');
    }
  };

  const handlePayment = async (paymentMethod) => {
    try {
      const response = await studentApiService.processPayment({
        amount: dashboardData?.pendingAmount || 0,
        method: paymentMethod
      });
      if (response.success) {
        showNotification('Payment processed successfully!', 'success');
        setShowPaymentModal(false);
        fetchPayments();
        fetchDashboardData();
      } else {
        showNotification(response.message || 'Payment failed', 'error');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      showNotification('Payment failed. Please try again.', 'error');
    }
  };

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await studentApiService.createSupportTicket(supportForm);
      if (response.success) {
        showNotification('Support ticket created successfully!', 'success');
        setShowSupportModal(false);
        setSupportForm({ subject: '', category: 'general', message: '', attachments: [] });
        fetchSupportTickets();
      } else {
        showNotification(response.message || 'Failed to create ticket', 'error');
      }
    } catch (error) {
      console.error('Error creating support ticket:', error);
      showNotification('Failed to create ticket. Please try again.', 'error');
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await studentApiService.markNotificationRead(notificationId);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (endDate) => {
    if (!endDate) return 0;
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const isPassExpired = (endDate) => {
    if (!endDate) return true;
    return new Date(endDate) < new Date();
  };

  const isPassExpiringSoon = (endDate) => {
    const daysRemaining = getDaysRemaining(endDate);
    return daysRemaining > 0 && daysRemaining <= 30;
  };

  if (loading && !dashboardData) {
    return (
      <div className="student-dashboard-loading">
        <div className="loading-spinner"></div>
        <h3>Loading Student Dashboard...</h3>
      </div>
    );
  }

  const studentPass = dashboardData?.studentPass || {};
  const stats = dashboardData?.stats || {};
  const subsidy = dashboardData?.subsidy || {};
  const validityPeriod = studentPass.validityPeriod || {};
  const daysRemaining = getDaysRemaining(validityPeriod.endDate);
  const expired = isPassExpired(validityPeriod.endDate);
  const expiringSoon = isPassExpiringSoon(validityPeriod.endDate);

  return (
    <div className="student-dashboard">
      {/* Sidebar */}
      <div className="student-sidebar">
        <div className="sidebar-header">
          <GraduationCap className="sidebar-logo" />
          <h2>Student Portal</h2>
          <div className="student-name">{studentPass.name || user?.name || 'Student'}</div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <BarChart3 className="nav-icon" />
            <span>Dashboard</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'concession' ? 'active' : ''}`}
            onClick={() => setActiveTab('concession')}
          >
            <Award className="nav-icon" />
            <span>Concession</span>
            {concessionStatus?.status === 'pending' && (
              <span className="nav-badge">Pending</span>
            )}
          </button>
          <button
            className={`nav-item ${activeTab === 'pass' ? 'active' : ''}`}
            onClick={() => setActiveTab('pass')}
          >
            <QrCode className="nav-icon" />
            <span>Digital Pass</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'booking' ? 'active' : ''}`}
            onClick={() => setActiveTab('booking')}
          >
            <Bus className="nav-icon" />
            <span>Trip Booking</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History className="nav-icon" />
            <span>Travel History</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            <CreditCard className="nav-icon" />
            <span>Payments</span>
            {dashboardData?.pendingAmount > 0 && (
              <span className="nav-badge">!</span>
            )}
          </button>
          <button
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User className="nav-icon" />
            <span>Profile</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => setActiveTab('support')}
          >
            <HelpCircle className="nav-icon" />
            <span>Support</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings className="nav-icon" />
            <span>Settings</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout} title="Logout from Student Portal">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && notificationMessage && (
        <div className={`toast-notification ${notificationType}`}>
          <div className="toast-content">
            {notificationType === 'success' && <CheckCircle className="w-5 h-5" />}
            {notificationType === 'error' && <AlertCircle className="w-5 h-5" />}
            {notificationType === 'warning' && <Clock className="w-5 h-5" />}
            {notificationType === 'info' && <Bell className="w-5 h-5" />}
            <span>{notificationMessage}</span>
            <button onClick={() => setShowToast(false)} className="toast-close">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="student-main-content">
        {/* Header */}
        <div className="student-header">
          <div>
            <h1 className="page-title">
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'concession' && 'Concession Application'}
              {activeTab === 'pass' && 'My Digital Pass'}
              {activeTab === 'booking' && 'Trip Booking'}
              {activeTab === 'history' && 'Travel History'}
              {activeTab === 'payments' && 'Payments & Wallet'}
              {activeTab === 'profile' && 'Profile & Verification'}
              {activeTab === 'support' && 'Support & Grievances'}
              {activeTab === 'settings' && 'Settings'}
            </h1>
            <p className="page-subtitle">Welcome back, {studentPass.name || user?.name || 'Student'}!</p>
          </div>
          <div className="header-actions">
            <button 
              className="notification-btn" 
              onClick={() => setShowNotificationPanel(!showNotificationPanel)}
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="notification-badge">{unreadNotifications}</span>
              )}
            </button>
            <button className="refresh-btn" onClick={fetchDashboardData}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button className="logout-header-btn" onClick={handleLogout} title="Logout">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Notifications Panel */}
        {showNotificationPanel && (
          <div className="notifications-panel">
            <div className="notifications-header">
              <h3>Notifications</h3>
              <button onClick={() => setShowNotificationPanel(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="notifications-list">
              {notifications.length === 0 ? (
                <div className="empty-notifications">
                  <Bell className="w-8 h-8" />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map((notification, index) => (
                  <div 
                    key={index} 
                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                    onClick={() => markNotificationAsRead(notification._id)}
                  >
                    <div className="notification-icon">
                      {notification.type === 'approval' && <CheckCircle className="w-4 h-4" />}
                      {notification.type === 'rejection' && <AlertCircle className="w-4 h-4" />}
                      {notification.type === 'reminder' && <Clock className="w-4 h-4" />}
                      {notification.type === 'payment' && <CreditCard className="w-4 h-4" />}
                      {!['approval', 'rejection', 'reminder', 'payment'].includes(notification.type) && <BellRing className="w-4 h-4" />}
                    </div>
                    <div className="notification-content">
                      <h4>{notification.title}</h4>
                      <p>{notification.message}</p>
                      <span className="notification-time">{formatDate(notification.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Dashboard Overview Tab */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-content">
            {/* Quick Stats Cards */}
            <div className="quick-stats-grid">
              <div className="quick-stat-card">
                <div className="quick-stat-icon active">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div className="quick-stat-content">
                  <h3>Concession Status</h3>
                  <p className={`status-text ${concessionStatus?.status || 'pending'}`}>
                    {concessionStatus?.status === 'approved' ? 'Approved' : 
                     concessionStatus?.status === 'rejected' ? 'Rejected' : 
                     concessionStatus?.status === 'pending' ? 'Pending' : 'Not Applied'}
                  </p>
                </div>
              </div>
              <div className="quick-stat-card">
                <div className="quick-stat-icon trips">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="quick-stat-content">
                  <h3>Total Trips</h3>
                  <p>{stats.totalTrips || 0}</p>
                  <span className="stat-subtext">{stats.tripsThisMonth || 0} this month</span>
                </div>
              </div>
              <div className="quick-stat-card">
                <div className="quick-stat-icon savings">
                  <Wallet className="w-6 h-6" />
                </div>
                <div className="quick-stat-content">
                  <h3>Total Savings</h3>
                  <p>{formatCurrency(subsidy.totalSavings || 0)}</p>
                  <span className="stat-subtext">{formatCurrency(subsidy.savingsThisMonth || 0)} this month</span>
                </div>
              </div>
              <div className="quick-stat-card">
                <div className="quick-stat-icon distance">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="quick-stat-content">
                  <h3>Distance Traveled</h3>
                  <p>{stats.totalDistance || 0} km</p>
                  <span className="stat-subtext">{stats.distanceThisMonth || 0} km this month</span>
                </div>
              </div>
            </div>

            {/* Pass Status Alert */}
            {/* Pass Status Alert */}
            {expired && (
              <div className="status-alert error">
                <AlertCircle className="w-5 h-5" />
                <div>
                  <strong>Pass Expired</strong>
                  <p>Your pass has expired. Please renew to continue using the service.</p>
                </div>
                <button className="renew-btn" onClick={handleRenew} disabled={renewing}>
                  {renewing ? 'Renewing...' : 'Renew Now'}
                </button>
              </div>
            )}

            {expiringSoon && !expired && (
              <div className="status-alert warning">
                <Clock className="w-5 h-5" />
                <div>
                  <strong>Pass Expiring Soon</strong>
                  <p>Your pass will expire in {daysRemaining} days. Renew now to avoid interruption.</p>
                </div>
                <button className="renew-btn" onClick={handleRenew} disabled={renewing}>
                  {renewing ? 'Renewing...' : 'Renew Now'}
                </button>
              </div>
            )}

            {!expired && !expiringSoon && (
              <div className="status-alert success">
                <CheckCircle className="w-5 h-5" />
                <div>
                  <strong>Pass Active</strong>
                  <p>Your pass is valid for {daysRemaining} more days.</p>
                </div>
              </div>
            )}

            {/* QR Code Card */}
            <div className="qr-card">
              <div className="qr-header">
                <h2>Digital Pass</h2>
                <span className="pass-number">Pass #{studentPass.passNumber || 'N/A'}</span>
              </div>
              <div className="qr-content">
                {studentPass.qrCode ? (
                  <div className="qr-code-container">
                    <img src={studentPass.qrCode} alt="QR Code" className="qr-code-image" />
                    <p className="qr-instruction">Show this QR code to the conductor when boarding</p>
                  </div>
                ) : (
                  <div className="qr-placeholder">
                    <QrCode className="w-16 h-16 text-gray-400" />
                    <p>QR code will be generated after pass approval</p>
                  </div>
                )}
              </div>
              <div className="qr-footer">
                <div className="pass-info">
                  <div className="info-item">
                    <span className="label">Pass Type:</span>
                    <span className="value">{studentPass.passType?.replace('_', ' ').toUpperCase() || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Valid Until:</span>
                    <span className="value">{formatDate(validityPeriod.endDate)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Status:</span>
                    <span className={`value status ${studentPass.status || 'pending'}`}>
                      {studentPass.status || 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon trips">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="stat-content">
                  <h3>{stats.totalTrips || 0}</h3>
                  <p>Total Trips</p>
                  <span className="stat-subtext">{stats.tripsThisMonth || 0} this month</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon savings">
                  <Wallet className="w-6 h-6" />
                </div>
                <div className="stat-content">
                  <h3>{formatCurrency(subsidy.totalSavings || 0)}</h3>
                  <p>Total Savings</p>
                  <span className="stat-subtext">{formatCurrency(subsidy.savingsThisMonth || 0)} this month</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon distance">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="stat-content">
                  <h3>{stats.totalDistance || 0} km</h3>
                  <p>Distance Traveled</p>
                  <span className="stat-subtext">{stats.distanceThisMonth || 0} km this month</span>
                </div>
              </div>
            </div>

            {/* Recent Trips */}
            {dashboardData?.recentTrips && dashboardData.recentTrips.length > 0 && (
              <div className="recent-trips-section">
                <h2 className="section-title">Recent Trips</h2>
                <div className="trips-list">
                  {dashboardData.recentTrips.slice(0, 5).map((trip, index) => (
                    <div key={index} className="trip-item">
                      <div className="trip-icon">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div className="trip-details">
                        <div className="trip-route">{trip.route || 'N/A'}</div>
                        <div className="trip-date">{formatDate(trip.travelDate)}</div>
                      </div>
                      <div className="trip-amount">
                        {formatCurrency(trip.fare || 0)}
                        {trip.subsidyAmount > 0 && (
                          <span className="subsidy-badge">Saved {formatCurrency(trip.subsidyAmount)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="tab-content">
            {usageHistory.length === 0 ? (
              <div className="empty-state">
                <History className="w-12 h-12 text-gray-400" />
                <h3>No Travel History</h3>
                <p>Your travel history will appear here once you start using your pass.</p>
              </div>
            ) : (
              <div className="history-list">
                {usageHistory.map((trip, index) => (
                  <div key={index} className="history-item">
                    <div className="history-icon">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="history-details">
                      <div className="history-route">{trip.route || 'N/A'}</div>
                      <div className="history-date">{formatDate(trip.travelDate)}</div>
                      {trip.boardingPoint && trip.destinationPoint && (
                        <div className="history-stops">
                          {trip.boardingPoint} → {trip.destinationPoint}
                        </div>
                      )}
                    </div>
                    <div className="history-amount">
                      <div className="fare">{formatCurrency(trip.fare || 0)}</div>
                      {trip.subsidyAmount > 0 && (
                        <div className="subsidy">Saved {formatCurrency(trip.subsidyAmount)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="tab-content">
            {profile ? (
              <div className="profile-section">
                <h2 className="section-title">Personal Information</h2>
                <div className="profile-grid">
                  <div className="profile-item">
                    <label>Name</label>
                    <p>{profile.name || 'N/A'}</p>
                  </div>
                  <div className="profile-item">
                    <label>Aadhaar Number</label>
                    <p>{profile.aadhaarNumber ? '****' + profile.aadhaarNumber.slice(-4) : 'N/A'}</p>
                  </div>
                  <div className="profile-item">
                    <label>Date of Birth</label>
                    <p>{formatDate(profile.dateOfBirth)}</p>
                  </div>
                  <div className="profile-item">
                    <label>Email</label>
                    <p>{profile.email || 'N/A'}</p>
                  </div>
                  <div className="profile-item">
                    <label>Phone</label>
                    <p>{profile.phone || 'N/A'}</p>
                  </div>
                  <div className="profile-item">
                    <label>Pass Number</label>
                    <p>{profile.passNumber || 'N/A'}</p>
                  </div>
                </div>

                {profile.institution && (
                  <>
                    <h2 className="section-title">Institution Details</h2>
                    <div className="profile-grid">
                      <div className="profile-item">
                        <label>Institution Name</label>
                        <p>{profile.institution.name || 'N/A'}</p>
                      </div>
                      <div className="profile-item">
                        <label>Institution Type</label>
                        <p>{profile.institution.type || 'N/A'}</p>
                      </div>
                      {profile.course && (
                        <>
                          <div className="profile-item">
                            <label>Course</label>
                            <p>{profile.course.name || 'N/A'}</p>
                          </div>
                          <div className="profile-item">
                            <label>Year</label>
                            <p>{profile.course.year || 'N/A'}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}

                <h2 className="section-title">Pass Details</h2>
                <div className="profile-grid">
                  <div className="profile-item">
                    <label>Pass Type</label>
                    <p>{profile.passType?.replace('_', ' ').toUpperCase() || 'N/A'}</p>
                  </div>
                  <div className="profile-item">
                    <label>Eligibility Status</label>
                    <span className={`status-badge ${profile.eligibilityStatus || 'pending'}`}>
                      {profile.eligibilityStatus || 'Pending'}
                    </span>
                  </div>
                  <div className="profile-item">
                    <label>Valid From</label>
                    <p>{formatDate(profile.validityPeriod?.startDate)}</p>
                  </div>
                  <div className="profile-item">
                    <label>Valid Until</label>
                    <p>{formatDate(profile.validityPeriod?.endDate)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <User className="w-12 h-12 text-gray-400" />
                <h3>Loading Profile...</h3>
              </div>
            )}
          </div>
        )}

        {/* Concession Application Tab */}
        {activeTab === 'concession' && (
          <div className="tab-content">
            {concessionStatus?.status === 'approved' ? (
              <div className="concession-approved">
                <div className="approval-badge">
                  <CheckCircle className="w-16 h-16" />
                  <h2>Concession Approved</h2>
                  <p>Your concession application has been approved. You can now use your digital pass.</p>
                  <div className="approval-details">
                    <div className="detail-item">
                      <span className="label">Approved On:</span>
                      <span className="value">{formatDate(concessionStatus.approvedAt)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Concession Rate:</span>
                      <span className="value">{concessionStatus.concessionRate || '50%'}</span>
                    </div>
                    {concessionStatus.reason && (
                      <div className="detail-item">
                        <span className="label">Notes:</span>
                        <span className="value">{concessionStatus.reason}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : concessionStatus?.status === 'rejected' ? (
              <div className="concession-rejected">
                <div className="rejection-badge">
                  <AlertCircle className="w-16 h-16" />
                  <h2>Concession Rejected</h2>
                  <p>{concessionStatus.reason || 'Your concession application has been rejected.'}</p>
                  <button className="btn-primary" onClick={() => setShowConcessionForm(true)}>
                    Reapply for Concession
                  </button>
                </div>
              </div>
            ) : concessionStatus?.status === 'pending' ? (
              <div className="concession-pending">
                <div className="pending-badge">
                  <Clock className="w-16 h-16" />
                  <h2>Application Under Review</h2>
                  <p>Your concession application is being reviewed. You will be notified once a decision is made.</p>
                  <div className="pending-details">
                    <div className="detail-item">
                      <span className="label">Applied On:</span>
                      <span className="value">{formatDate(concessionStatus.appliedAt)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Status:</span>
                      <span className="value status-pending">Pending Review</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="concession-apply">
                <div className="apply-section">
                  <h2>Apply for Student Concession</h2>
                  <p>Fill out the form below to apply for student bus travel concession. Your application will be reviewed and you'll be notified of the decision.</p>
                  <button className="btn-primary" onClick={() => setShowConcessionForm(true)}>
                    <Plus className="w-4 h-4" />
                    Apply for Concession
                  </button>
                </div>
              </div>
            )}

            {/* Concession Application Form Modal */}
            {showConcessionForm && (
              <div className="modal-overlay" onClick={() => setShowConcessionForm(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>Apply for Concession</h2>
                    <button onClick={() => setShowConcessionForm(false)}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <form onSubmit={handleConcessionSubmit} className="concession-form">
                    <div className="form-group">
                      <label>Institution Name *</label>
                      <input
                        type="text"
                        required
                        value={concessionForm.institutionName}
                        onChange={(e) => setConcessionForm({...concessionForm, institutionName: e.target.value})}
                        placeholder="Enter your institution name"
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Course *</label>
                        <input
                          type="text"
                          required
                          value={concessionForm.course}
                          onChange={(e) => setConcessionForm({...concessionForm, course: e.target.value})}
                          placeholder="e.g., B.Tech, B.Sc"
                        />
                      </div>
                      <div className="form-group">
                        <label>Year *</label>
                        <select
                          required
                          value={concessionForm.year}
                          onChange={(e) => setConcessionForm({...concessionForm, year: e.target.value})}
                        >
                          <option value="">Select Year</option>
                          <option value="1">1st Year</option>
                          <option value="2">2nd Year</option>
                          <option value="3">3rd Year</option>
                          <option value="4">4th Year</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Student ID Number *</label>
                      <input
                        type="text"
                        required
                        value={concessionForm.studentId}
                        onChange={(e) => setConcessionForm({...concessionForm, studentId: e.target.value})}
                        placeholder="Enter your student ID"
                      />
                    </div>
                    <div className="form-group">
                      <label>ID Proof Document *</label>
                      <div className="file-upload">
                        <input
                          type="file"
                          required
                          accept="image/*,.pdf"
                          onChange={(e) => setConcessionForm({
                            ...concessionForm, 
                            idProofFile: e.target.files[0],
                            idProof: e.target.files[0]?.name
                          })}
                        />
                        <div className="file-upload-label">
                          <Upload className="w-4 h-4" />
                          {concessionForm.idProof || 'Upload ID Proof (Image/PDF)'}
                        </div>
                      </div>
                    </div>
                    <div className="form-actions">
                      <button type="button" className="btn-secondary" onClick={() => setShowConcessionForm(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary">
                        Submit Application
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Digital Pass Tab */}
        {activeTab === 'pass' && (
          <div className="tab-content">
            {/* Pass Status Alert */}
            {expired && (
              <div className="status-alert error">
                <AlertCircle className="w-5 h-5" />
                <div>
                  <strong>Pass Expired</strong>
                  <p>Your pass has expired. Please renew to continue using the service.</p>
                </div>
                <button className="renew-btn" onClick={handleRenew} disabled={renewing}>
                  {renewing ? 'Renewing...' : 'Renew Now'}
                </button>
              </div>
            )}

            {expiringSoon && !expired && (
              <div className="status-alert warning">
                <Clock className="w-5 h-5" />
                <div>
                  <strong>Pass Expiring Soon</strong>
                  <p>Your pass will expire in {daysRemaining} days. Renew now to avoid interruption.</p>
                </div>
                <button className="renew-btn" onClick={handleRenew} disabled={renewing}>
                  {renewing ? 'Renewing...' : 'Renew Now'}
                </button>
              </div>
            )}

            {!expired && !expiringSoon && (
              <div className="status-alert success">
                <CheckCircle className="w-5 h-5" />
                <div>
                  <strong>Pass Active</strong>
                  <p>Your pass is valid for {daysRemaining} more days.</p>
                </div>
              </div>
            )}

            {/* QR Code Card */}
            <div className="qr-card">
              <div className="qr-header">
                <h2>Digital Pass</h2>
                <span className="pass-number">Pass #{studentPass.passNumber || 'N/A'}</span>
              </div>
              <div className="qr-content">
                {studentPass.qrCode ? (
                  <div className="qr-code-container">
                    <img src={studentPass.qrCode} alt="QR Code" className="qr-code-image" />
                    <p className="qr-instruction">Show this QR code to the conductor when boarding</p>
                    <button className="btn-secondary" onClick={() => {
                      const link = document.createElement('a');
                      link.href = studentPass.qrCode;
                      link.download = `pass-${studentPass.passNumber}.png`;
                      link.click();
                    }}>
                      <Download className="w-4 h-4" />
                      Download QR Code
                    </button>
                  </div>
                ) : (
                  <div className="qr-placeholder">
                    <QrCode className="w-16 h-16 text-gray-400" />
                    <p>QR code will be generated after pass approval</p>
                  </div>
                )}
              </div>
              <div className="qr-footer">
                <div className="pass-info">
                  <div className="info-item">
                    <span className="label">Pass Type:</span>
                    <span className="value">{studentPass.passType?.replace('_', ' ').toUpperCase() || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Valid Until:</span>
                    <span className="value">{formatDate(validityPeriod.endDate)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Status:</span>
                    <span className={`value status ${studentPass.status || 'pending'}`}>
                      {studentPass.status || 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trip Booking Tab */}
        {activeTab === 'booking' && (
          <div className="tab-content">
            <div className="booking-section">
              <div className="section-header">
                <h2>Book a Trip</h2>
                <button className="btn-primary" onClick={() => {
                  setShowBookingModal(true);
                  if (availableRoutes.length === 0) {
                    fetchAvailableRoutes();
                  }
                }}>
                  <Plus className="w-4 h-4" />
                  New Booking
                </button>
              </div>

              {loadingRoutes && (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading routes...</p>
                </div>
              )}

              {!loadingRoutes && availableRoutes.length === 0 && (
                <div className="empty-state">
                  <Bus className="w-12 h-12 text-gray-400" />
                  <h3>No Routes Available</h3>
                  <p>Routes will appear here once they are added by the admin.</p>
                </div>
              )}

              {!loadingRoutes && availableRoutes.length > 0 && (
                <div className="routes-list">
                  <h3>Available Routes</h3>
                  <div className="routes-grid">
                    {availableRoutes.map((route, index) => (
                      <div key={index} className="route-card">
                        <div className="route-header">
                          <Bus className="w-5 h-5" />
                          <h4>{route.name}</h4>
                        </div>
                        <div className="route-details">
                          <div className="route-stop">
                            <MapPin className="w-4 h-4" />
                            <span>{route.from} → {route.to}</span>
                          </div>
                          <div className="route-fare">
                            <span className="original-fare">{formatCurrency(route.fare)}</span>
                            <span className="concession-fare">{formatCurrency(route.concessionFare || route.fare * 0.5)}</span>
                          </div>
                          <div className="route-timings">
                            <Clock className="w-4 h-4" />
                            <span>{route.departureTime} - {route.arrivalTime}</span>
                          </div>
                        </div>
                        <button 
                          className="btn-primary btn-sm"
                          onClick={() => {
                            setSelectedRoute(route);
                            setBookingForm({
                              ...bookingForm,
                              route: route._id || route.name,
                              boardingPoint: route.from,
                              destinationPoint: route.to
                            });
                            setShowBookingModal(true);
                          }}
                        >
                          Book Now
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Booking Modal */}
            {showBookingModal && (
              <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>Book a Trip</h2>
                    <button onClick={() => setShowBookingModal(false)}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <form onSubmit={handleBookingSubmit} className="booking-form">
                    <div className="form-group">
                      <label>Route *</label>
                      <select
                        required
                        value={bookingForm.route}
                        onChange={(e) => {
                          const route = availableRoutes.find(r => (r._id || r.name) === e.target.value);
                          setBookingForm({
                            ...bookingForm,
                            route: e.target.value,
                            boardingPoint: route?.from || '',
                            destinationPoint: route?.to || ''
                          });
                        }}
                      >
                        <option value="">Select Route</option>
                        {availableRoutes.map((route, index) => (
                          <option key={index} value={route._id || route.name}>
                            {route.from} → {route.to}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Travel Date *</label>
                        <input
                          type="date"
                          required
                          min={new Date().toISOString().split('T')[0]}
                          value={bookingForm.date}
                          onChange={(e) => setBookingForm({...bookingForm, date: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Preferred Time *</label>
                        <select
                          required
                          value={bookingForm.time}
                          onChange={(e) => setBookingForm({...bookingForm, time: e.target.value})}
                        >
                          <option value="">Select Time</option>
                          <option value="morning">Morning (6 AM - 12 PM)</option>
                          <option value="afternoon">Afternoon (12 PM - 6 PM)</option>
                          <option value="evening">Evening (6 PM - 10 PM)</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Boarding Point *</label>
                        <input
                          type="text"
                          required
                          value={bookingForm.boardingPoint}
                          onChange={(e) => setBookingForm({...bookingForm, boardingPoint: e.target.value})}
                          placeholder="Enter boarding point"
                        />
                      </div>
                      <div className="form-group">
                        <label>Destination Point *</label>
                        <input
                          type="text"
                          required
                          value={bookingForm.destinationPoint}
                          onChange={(e) => setBookingForm({...bookingForm, destinationPoint: e.target.value})}
                          placeholder="Enter destination"
                        />
                      </div>
                    </div>
                    <div className="booking-summary">
                      <h4>Booking Summary</h4>
                      <div className="summary-item">
                        <span>Estimated Fare:</span>
                        <span>{formatCurrency(selectedRoute?.concessionFare || selectedRoute?.fare * 0.5 || 0)}</span>
                      </div>
                      <div className="summary-item">
                        <span>Concession Applied:</span>
                        <span className="savings">-{formatCurrency(selectedRoute?.fare * 0.5 || 0)}</span>
                      </div>
                    </div>
                    <div className="form-actions">
                      <button type="button" className="btn-secondary" onClick={() => setShowBookingModal(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary">
                        Confirm Booking
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="tab-content">
            <div className="payments-section">
              {dashboardData?.pendingAmount > 0 && (
                <div className="pending-payment-alert">
                  <AlertCircle className="w-5 h-5" />
                  <div>
                    <strong>Pending Payment</strong>
                    <p>You have a pending payment of {formatCurrency(dashboardData.pendingAmount)}</p>
                  </div>
                  <button className="btn-primary" onClick={() => setShowPaymentModal(true)}>
                    Pay Now
                  </button>
                </div>
              )}

              <div className="wallet-section">
                <h2>Wallet Balance</h2>
                <div className="wallet-card">
                  <Wallet className="w-8 h-8" />
                  <div className="wallet-amount">
                    <h3>{formatCurrency(dashboardData?.walletBalance || 0)}</h3>
                    <p>Available Balance</p>
                  </div>
                  <button className="btn-secondary">Add Money</button>
                </div>
              </div>

              <div className="transactions-section">
                <h2>Transaction History</h2>
                {loadingPayments && (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading transactions...</p>
                  </div>
                )}
                {!loadingPayments && payments.length === 0 ? (
                  <div className="empty-state">
                    <Receipt className="w-12 h-12 text-gray-400" />
                    <h3>No Transactions</h3>
                    <p>Your payment history will appear here.</p>
                  </div>
                ) : !loadingPayments && (
                  <div className="transactions-list">
                    {payments.map((payment, index) => (
                      <div key={index} className="transaction-item">
                        <div className="transaction-icon">
                          {payment.status === 'success' ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : payment.status === 'pending' ? (
                            <Clock className="w-5 h-5" />
                          ) : (
                            <AlertCircle className="w-5 h-5" />
                          )}
                        </div>
                        <div className="transaction-details">
                          <h4>{payment.description || 'Payment'}</h4>
                          <p>{formatDate(payment.date)}</p>
                          <span className={`transaction-status ${payment.status}`}>
                            {payment.status}
                          </span>
                        </div>
                        <div className="transaction-amount">
                          <span className={payment.type === 'credit' ? 'credit' : 'debit'}>
                            {payment.type === 'credit' ? '+' : '-'}{formatCurrency(payment.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
              <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>Make Payment</h2>
                    <button onClick={() => setShowPaymentModal(false)}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="payment-modal-content">
                    <div className="payment-amount">
                      <h3>Amount to Pay</h3>
                      <p className="amount-value">{formatCurrency(dashboardData?.pendingAmount || 0)}</p>
                    </div>
                    <div className="payment-methods">
                      <h4>Select Payment Method</h4>
                      <div className="payment-methods-grid">
                        <button className="payment-method-card" onClick={() => handlePayment('upi')}>
                          <CreditCard className="w-6 h-6" />
                          <span>UPI</span>
                        </button>
                        <button className="payment-method-card" onClick={() => handlePayment('card')}>
                          <CreditCard className="w-6 h-6" />
                          <span>Card</span>
                        </button>
                        <button className="payment-method-card" onClick={() => handlePayment('wallet')}>
                          <Wallet className="w-6 h-6" />
                          <span>Wallet</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Support Tab */}
        {activeTab === 'support' && (
          <div className="tab-content">
            <div className="support-section">
              <div className="section-header">
                <h2>Support & Grievances</h2>
                <button className="btn-primary" onClick={() => setShowSupportModal(true)}>
                  <Plus className="w-4 h-4" />
                  New Ticket
                </button>
              </div>

              {loadingTickets && (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading tickets...</p>
                </div>
              )}

              {!loadingTickets && supportTickets.length === 0 ? (
                <div className="empty-state">
                  <HelpCircle className="w-12 h-12 text-gray-400" />
                  <h3>No Support Tickets</h3>
                  <p>Create a support ticket if you need assistance.</p>
                </div>
              ) : !loadingTickets && (
                <div className="tickets-list">
                  {supportTickets.map((ticket, index) => (
                    <div key={index} className="ticket-item">
                      <div className="ticket-header">
                        <h4>{ticket.subject}</h4>
                        <span className={`ticket-status ${ticket.status}`}>
                          {ticket.status}
                        </span>
                      </div>
                      <p className="ticket-message">{ticket.message}</p>
                      <div className="ticket-footer">
                        <span className="ticket-date">{formatDate(ticket.createdAt)}</span>
                        <span className="ticket-category">{ticket.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Support Ticket Modal */}
            {showSupportModal && (
              <div className="modal-overlay" onClick={() => setShowSupportModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>Create Support Ticket</h2>
                    <button onClick={() => setShowSupportModal(false)}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <form onSubmit={handleSupportSubmit} className="support-form">
                    <div className="form-group">
                      <label>Subject *</label>
                      <input
                        type="text"
                        required
                        value={supportForm.subject}
                        onChange={(e) => setSupportForm({...supportForm, subject: e.target.value})}
                        placeholder="Enter subject"
                      />
                    </div>
                    <div className="form-group">
                      <label>Category *</label>
                      <select
                        required
                        value={supportForm.category}
                        onChange={(e) => setSupportForm({...supportForm, category: e.target.value})}
                      >
                        <option value="general">General</option>
                        <option value="technical">Technical Issue</option>
                        <option value="payment">Payment Issue</option>
                        <option value="pass">Pass Related</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Message *</label>
                      <textarea
                        required
                        rows="5"
                        value={supportForm.message}
                        onChange={(e) => setSupportForm({...supportForm, message: e.target.value})}
                        placeholder="Describe your issue..."
                      />
                    </div>
                    <div className="form-actions">
                      <button type="button" className="btn-secondary" onClick={() => setShowSupportModal(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary">
                        <Send className="w-4 h-4" />
                        Submit Ticket
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="tab-content">
            <div className="settings-section">
              <h2>Account Settings</h2>
              <div className="settings-grid">
                <div className="settings-card">
                  <User className="w-6 h-6" />
                  <h3>Profile Settings</h3>
                  <p>Update your personal information and preferences</p>
                  <button className="btn-secondary">Edit Profile</button>
                </div>
                <div className="settings-card">
                  <Bell className="w-6 h-6" />
                  <h3>Notifications</h3>
                  <p>Manage your notification preferences</p>
                  <button className="btn-secondary">Configure</button>
                </div>
                <div className="settings-card">
                  <Shield className="w-6 h-6" />
                  <h3>Security</h3>
                  <p>Change password and security settings</p>
                  <button className="btn-secondary">Update</button>
                </div>
                <div className="settings-card">
                  <FileText className="w-6 h-6" />
                  <h3>Documents</h3>
                  <p>View and manage your uploaded documents</p>
                  <button className="btn-secondary">View</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;

