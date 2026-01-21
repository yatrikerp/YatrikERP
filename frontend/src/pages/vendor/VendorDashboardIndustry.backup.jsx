import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import vendorApiService from '../../services/vendorApiService';
import BulkSparePartsUpload from '../../components/vendor/BulkSparePartsUpload';
import {
  Building2, Wallet, FileText, TrendingUp, CheckCircle, Clock, AlertCircle,
  DollarSign, Package, Receipt, BarChart3, Settings, LogOut, RefreshCw,
  Search, Filter, Download, Eye, Check, X, Truck, ShoppingCart, Star,
  Activity, Users, User, Calendar, Bell, Menu, ChevronRight, Plus,
  ArrowRight, MessageCircle, CreditCard, FileDown, ExternalLink,
  Gavel, List, Award, AlertTriangle, TrendingDown, LineChart, PieChart,
  Zap, Target, Shield, Wrench, ShoppingBag, Minus, FileCheck, Receipt as ReceiptIcon,
  History, Lock, Unlock, Upload, CheckCircle2, XCircle, Timer, AlertCircle as AlertIcon,
  Info, Mail, Phone, MapPin, Building, FileText as FileTextIcon, ClipboardCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const VendorDashboardIndustry = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [trustScore, setTrustScore] = useState(null);
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPODetail, setShowPODetail] = useState(false);
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingPOId, setRejectingPOId] = useState(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryData, setDeliveryData] = useState({ status: '', trackingNumber: '' });
  const [updatingPOId, setUpdatingPOId] = useState(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [filters, setFilters] = useState({
    poStatus: 'all',
    invoiceStatus: 'all',
    paymentStatus: 'all',
    sparePartsCategory: 'all',
    sparePartsStatus: 'all'
  });

  useEffect(() => {
    if (user && (user.role === 'vendor' || user.role === 'VENDOR')) {
      fetchAllData();
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchAllData();
      }, 30000);
      return () => clearInterval(interval);
    } else if (user && user.role !== 'vendor' && user.role !== 'VENDOR') {
      // Redirect if not a vendor
      navigate('/login');
    }
  }, [user]);

  // Fetch spare parts when filters change
  useEffect(() => {
    if (user && (user.role === 'vendor' || user.role === 'VENDOR') && activeTab === 'spare-parts') {
      fetchSpareParts();
    }
  }, [filters.sparePartsCategory, filters.sparePartsStatus]);

  const fetchAllData = async () => {
    await Promise.all([
      fetchDashboardData(),
      fetchProfile(),
      fetchPurchaseOrders(),
      fetchInvoices(),
      fetchPayments(),
      fetchTrustScore(),
      fetchNotifications(),
      fetchAuditLog(),
      fetchSpareParts()
    ]);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await vendorApiService.getDashboard();
      if (response && response.success) {
        setDashboardData(response.data);
      } else {
        // If no data, set empty dashboard
        setDashboardData({
          stats: {
            activeWorkOrders: 0,
            pendingPOs: 0,
            totalRevenue: 0,
            pendingPayments: 0,
            ordersReceived: 0,
            completedPOs: 0,
            inProgressPOs: 0,
            totalActiveListings: 0
          },
          alerts: []
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      // Set empty dashboard on error
      setDashboardData({
        stats: {
          activeWorkOrders: 0,
          pendingPOs: 0,
          totalRevenue: 0,
          pendingPayments: 0,
          ordersReceived: 0,
          completedPOs: 0,
          inProgressPOs: 0,
          totalActiveListings: 0
        },
        alerts: []
      });
      // Only show toast for non-404 errors
      if (error.response?.status !== 404 && error.response?.status !== 401) {
        toast.error('Failed to load dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await vendorApiService.getProfile();
      if (response && response.success) {
        setProfile(response.data.vendor);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const params = {};
      if (filters.poStatus && filters.poStatus !== 'all') {
        params.status = filters.poStatus;
      }
      const response = await vendorApiService.getPurchaseOrders(params);
      if (response && response.success) {
        setPurchaseOrders(response.data.purchaseOrders || response.data || []);
      } else {
        setPurchaseOrders([]);
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      setPurchaseOrders([]);
      // Only show toast for non-404/401 errors
      if (error.response?.status !== 404 && error.response?.status !== 401) {
        toast.error('Failed to load purchase orders');
      }
    }
  };

  const fetchInvoices = async () => {
    try {
      const params = {};
      if (filters.invoiceStatus && filters.invoiceStatus !== 'all') {
        params.status = filters.invoiceStatus;
      }
      const response = await vendorApiService.getInvoices(params);
      if (response && response.success) {
        setInvoices(response.data.invoices || response.data || []);
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoices([]);
      // Only show toast for non-404/401 errors
      if (error.response?.status !== 404 && error.response?.status !== 401) {
        toast.error('Failed to load invoices');
      }
    }
  };

  const fetchPayments = async () => {
    try {
      const params = {};
      if (filters.paymentStatus && filters.paymentStatus !== 'all') {
        params.status = filters.paymentStatus;
      }
      const response = await vendorApiService.getPayments(params);
      if (response && response.success) {
        setPayments(response.data || { payments: [], summary: {} });
      } else {
        setPayments({ payments: [], summary: {} });
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setPayments({ payments: [], summary: {} });
      // Only show toast for non-404/401 errors
      if (error.response?.status !== 404 && error.response?.status !== 401) {
        toast.error('Failed to load payments');
      }
    }
  };

  const fetchTrustScore = async () => {
    try {
      const response = await vendorApiService.getTrustScore();
      if (response && response.success) {
        setTrustScore(response.data);
      } else {
        setTrustScore(null);
      }
    } catch (error) {
      console.error('Error fetching trust score:', error);
      setTrustScore(null);
      // Silently fail for trust score
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await vendorApiService.getNotifications();
      if (response && response.success) {
        setNotifications(response.data.notifications || []);
      } else {
        // Fallback to empty array if API fails
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    }
  };

  const fetchAuditLog = async () => {
    try {
      const response = await vendorApiService.getAuditLog();
      if (response && response.success) {
        setAuditLog(response.data.auditLog || []);
      } else {
        // Fallback to empty array if API fails
        setAuditLog([]);
      }
    } catch (error) {
      console.error('Error fetching audit log:', error);
      setAuditLog([]);
    }
  };

  const fetchSpareParts = async () => {
    try {
      const { apiFetch } = await import('../../utils/api');
      const params = new URLSearchParams();
      if (filters.sparePartsCategory && filters.sparePartsCategory !== 'all') {
        params.append('category', filters.sparePartsCategory);
      }
      if (filters.sparePartsStatus && filters.sparePartsStatus !== 'all') {
        params.append('status', filters.sparePartsStatus);
      }
      
      const response = await apiFetch(`/api/products/vendor/my-products?${params.toString()}`);
      if (response && response.ok && response.data.success) {
        setSpareParts(response.data.data.products || []);
      } else {
        setSpareParts([]);
      }
    } catch (error) {
      console.error('Error fetching spare parts:', error);
      setSpareParts([]);
    }
  };

  const handleAcceptPO = async (poId) => {
    try {
      const response = await vendorApiService.acceptPurchaseOrder(poId, {
        message: 'Purchase order accepted',
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
      if (response && response.success) {
        toast.success('Purchase order accepted successfully');
        fetchPurchaseOrders();
        fetchAuditLog();
      }
    } catch (error) {
      toast.error('Failed to accept purchase order');
      console.error('Error accepting PO:', error);
    }
  };

  const handleRejectPO = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      const response = await vendorApiService.rejectPurchaseOrder(rejectingPOId, { reason: rejectReason });
      if (response && response.success) {
        toast.success('Purchase order rejected');
        setShowRejectModal(false);
        setRejectReason('');
        setRejectingPOId(null);
        fetchPurchaseOrders();
        fetchAuditLog();
      }
    } catch (error) {
      toast.error('Failed to reject purchase order');
      console.error('Error rejecting PO:', error);
    }
  };

  const handleUpdateDelivery = async () => {
    if (!deliveryData.status) {
      toast.error('Please select delivery status');
      return;
    }
    try {
      const response = await vendorApiService.updateDeliveryStatus(updatingPOId, {
        deliveryStatus: deliveryData.status,
        trackingNumber: deliveryData.trackingNumber,
        shippingMethod: 'Courier'
      });
      if (response && response.success) {
        toast.success('Delivery status updated successfully');
        setShowDeliveryModal(false);
        setDeliveryData({ status: '', trackingNumber: '' });
        setUpdatingPOId(null);
        fetchPurchaseOrders();
        fetchAuditLog();
      }
    } catch (error) {
      toast.error('Failed to update delivery status');
      console.error('Error updating delivery:', error);
    }
  };

  const downloadInvoice = async (invoiceId) => {
    try {
      const response = await vendorApiService.downloadInvoice(invoiceId);
      if (response && response.success) {
        if (response.data.pdfUrl) {
          window.open(response.data.pdfUrl, '_blank');
        } else {
          toast.info('PDF generation in progress...');
        }
      }
    } catch (error) {
      toast.error('Failed to download invoice');
      console.error('Error downloading invoice:', error);
    }
  };

  // Show loading only on initial load
  if (loading && !dashboardData && !profile) {
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
  const vendor = dashboardData?.vendor || profile || user || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Building2 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{vendor.companyName || 'Vendor Dashboard'}</h1>
                <p className="text-sm text-gray-500">Industry-Grade ERP Supply Chain Interface</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm text-gray-500">Trust Score</p>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${vendor.trustScore || 0}%` }}
                    />
                  </div>
                  <p className="text-lg font-semibold text-blue-600">{vendor.trustScore || 0}/100</p>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setActiveTab(activeTab === 'notifications' ? 'dashboard' : 'notifications')}
                  className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <Bell className="w-6 h-6" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
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
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'profile', label: 'Profile & Compliance', icon: User },
              { id: 'purchase-orders', label: 'Purchase Orders', icon: Package },
              { id: 'delivery', label: 'Delivery Tracking', icon: Truck },
              { id: 'invoices', label: 'Invoices', icon: Receipt },
              { id: 'payments', label: 'Payments & Ledger', icon: CreditCard },
              { id: 'spare-parts', label: 'Spare Parts', icon: Wrench },
              { id: 'performance', label: 'Performance', icon: Award },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'audit', label: 'Audit Log', icon: History }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Purchase Orders</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activeWorkOrders || 0}</p>
                    <p className="text-xs text-gray-400 mt-1">Pending: {stats.pendingPOs || 0}</p>
                  </div>
                  <Package className="w-10 h-10 text-blue-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">₹{(stats.totalRevenue || 0).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-400 mt-1">This month</p>
                  </div>
                  <DollarSign className="w-10 h-10 text-green-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pending Payments</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">₹{(stats.pendingPayments || 0).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-400 mt-1">Awaiting approval</p>
                  </div>
                  <Clock className="w-10 h-10 text-yellow-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Performance Rating</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{vendor.performanceRating || 0}/100</p>
                    <p className="text-xs text-gray-400 mt-1">Trust: {vendor.trustScore || 0}</p>
                  </div>
                  <Award className="w-10 h-10 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Trust Score Breakdown */}
            {trustScore && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Trust Score Breakdown</h2>
                  <button
                    onClick={fetchTrustScore}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Base Score</span>
                      <span className="font-semibold">{trustScore.breakdown?.baseScore || 50}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-gray-600">On-Time Delivery Bonus</span>
                      <span className="font-semibold text-green-600">+{trustScore.breakdown?.onTimeBonus || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <span className="text-sm text-gray-600">Delay Penalty</span>
                      <span className="font-semibold text-red-600">-{trustScore.breakdown?.delayPenalty || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-gray-600">Invoice Accuracy</span>
                      <span className="font-semibold text-green-600">+{trustScore.breakdown?.invoiceAccuracy || 10}</span>
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold">Total Trust Score</span>
                        <span className="text-2xl font-bold text-blue-600">{trustScore.trustScore}/100</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Delivery Performance</p>
                      <p className="text-sm text-gray-600">
                        On-Time: <span className="font-semibold">{trustScore.onTimePercentage}%</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Total Deliveries: <span className="font-semibold">{trustScore.totalDeliveries}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        On-Time: <span className="font-semibold text-green-600">{trustScore.onTimeDeliveries}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Delayed: <span className="font-semibold text-red-600">{trustScore.delayedDeliveries}</span>
                      </p>
                      {trustScore.avgDelayDays > 0 && (
                        <p className="text-sm text-gray-600 mt-2">
                          Average Delay: <span className="font-semibold">{trustScore.avgDelayDays} days</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activity & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Alerts */}
              {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center">
                    <AlertIcon className="w-5 h-5 mr-2 text-yellow-600" />
                    Alerts & Notifications
                  </h2>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {dashboardData.alerts.map((alert, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border ${
                          alert.type === 'error' ? 'bg-red-50 border-red-200' :
                          alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                          'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-start">
                          {alert.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" /> :
                           alert.type === 'warning' ? <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" /> :
                           <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />}
                          <p className="ml-2 text-sm text-gray-700">{alert.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Quick Statistics</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Total Orders Received</span>
                    <span className="font-semibold">{stats.ordersReceived || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Completed Orders</span>
                    <span className="font-semibold text-green-600">{stats.completedPOs || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">In Progress</span>
                    <span className="font-semibold text-blue-600">{stats.inProgressPOs || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Active Listings</span>
                    <span className="font-semibold">{stats.totalActiveListings || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile & Compliance Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Vendor Profile (Read-Only Critical Fields)</h2>
              {profile && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Company Name</label>
                      <p className="text-lg font-semibold text-gray-900">{profile.companyName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-lg text-gray-900">{profile.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-lg text-gray-900">{profile.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">PAN Number</label>
                      <p className="text-lg text-gray-900">{profile.panNumber || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">GST Number</label>
                      <p className="text-lg text-gray-900">{profile.gstNumber || profile.businessDetails?.gstNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Company Type</label>
                      <p className="text-lg text-gray-900 capitalize">{profile.companyType || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        profile.status === 'approved' ? 'bg-green-100 text-green-800' :
                        profile.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {profile.status || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Verification Status</label>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        profile.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {profile.verificationStatus || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Compliance Status */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-md font-semibold mb-4">Compliance Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">GST Status</span>
                      {profile?.gstNumber ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{profile?.gstNumber ? 'Valid' : 'Not Provided'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">PAN Status</span>
                      {profile?.panNumber ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{profile?.panNumber ? 'Valid' : 'Not Provided'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Contract Validity</span>
                      {profile?.contractDetails?.validity === 'active' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {profile?.contractDetails?.validity === 'active' ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Orders Tab */}
        {activeTab === 'purchase-orders' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Purchase Orders (ERP-Generated)</h2>
                <div className="flex items-center space-x-4">
                  <select
                    value={filters.poStatus}
                    onChange={(e) => {
                      setFilters({ ...filters, poStatus: e.target.value });
                    }}
                    className="border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="in_progress">In Progress</option>
                    <option value="delivered">Delivered</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button
                    onClick={fetchPurchaseOrders}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {purchaseOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No purchase orders found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Depot</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {purchaseOrders.map((po) => (
                        <tr key={po._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{po.poNumber}</div>
                            <div className="text-xs text-gray-500">{po.items?.length || 0} items</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(po.orderDate || po.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {po.depotId?.depotName || po.depotName || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            ₹{po.totalAmount?.toLocaleString('en-IN') || '0'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                              po.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              po.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                              po.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                              po.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              po.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {po.status?.replace('_', ' ').toUpperCase() || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                            <button
                              onClick={() => {
                                setSelectedPO(po);
                                setShowPODetail(true);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {po.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleAcceptPO(po._id)}
                                  className="text-green-600 hover:text-green-800"
                                  title="Accept PO"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectingPOId(po._id);
                                    setShowRejectModal(true);
                                  }}
                                  className="text-red-600 hover:text-red-800"
                                  title="Reject PO"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {['accepted', 'in_progress'].includes(po.status) && (
                              <button
                                onClick={() => {
                                  setUpdatingPOId(po._id);
                                  setShowDeliveryModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-800"
                                title="Update Delivery"
                              >
                                <Truck className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delivery Tracking Tab */}
        {activeTab === 'delivery' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Delivery & Fulfillment Tracking</h2>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Update delivery status for accepted purchase orders. Delivery confirmation controls payment eligibility.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {purchaseOrders
                      .filter(po => ['accepted', 'in_progress', 'delivered'].includes(po.status))
                      .map((po) => (
                        <tr key={po._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{po.poNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {po.expectedDeliveryDate 
                              ? new Date(po.expectedDeliveryDate).toLocaleDateString()
                              : 'Not set'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              po.deliveryStatus?.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              po.deliveryStatus?.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {po.deliveryStatus?.status || po.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {po.trackingNumber || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setUpdatingPOId(po._id);
                                setDeliveryData({
                                  status: po.deliveryStatus?.status || 'in_transit',
                                  trackingNumber: po.trackingNumber || ''
                                });
                                setShowDeliveryModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Update Status
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Auto-Generated Invoices (ERP-Controlled)</h2>
                  <p className="text-sm text-gray-500 mt-1">Invoices are automatically generated from delivered POs. You cannot edit amounts.</p>
                </div>
                <div className="flex items-center space-x-4">
                  <select
                    value={filters.invoiceStatus}
                    onChange={(e) => {
                      setFilters({ ...filters, invoiceStatus: e.target.value });
                    }}
                    className="border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="generated">Generated</option>
                    <option value="approved">Approved</option>
                    <option value="paid">Paid</option>
                  </select>
                  <button
                    onClick={fetchInvoices}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {invoices.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No invoices found</p>
                  <p className="text-sm text-gray-400 mt-2">Invoices are auto-generated when POs are delivered</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GST</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoices.map((invoice) => (
                        <tr key={invoice._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{invoice.invoiceNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {invoice.purchaseOrderId?.poNumber || invoice.poNumber || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{invoice.subtotal?.toLocaleString('en-IN') || '0'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="text-xs">
                              <div>CGST: ₹{invoice.tax?.cgst?.toLocaleString('en-IN') || 0}</div>
                              <div>SGST: ₹{invoice.tax?.sgst?.toLocaleString('en-IN') || 0}</div>
                              <div className="font-semibold">Total: ₹{invoice.tax?.total?.toLocaleString('en-IN') || 0}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            ₹{invoice.totalAmount?.toLocaleString('en-IN') || '0'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                              invoice.status === 'approved' ? 'bg-green-100 text-green-800' :
                              invoice.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                              invoice.status === 'generated' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {invoice.status?.toUpperCase() || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowInvoiceDetail(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 mr-3"
                            >
                              <Eye className="w-4 h-4 inline" />
                            </button>
                            <button
                              onClick={() => downloadInvoice(invoice._id)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Download className="w-4 h-4 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Payment Ledger & Tracking</h2>
                  <p className="text-sm text-gray-500 mt-1">Payment Flow: Invoice Approved → Payment Scheduled → Paid</p>
                </div>
                <div className="flex items-center space-x-4">
                  <select
                    value={filters.paymentStatus}
                    onChange={(e) => {
                      setFilters({ ...filters, paymentStatus: e.target.value });
                    }}
                    className="border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </select>
                  <button
                    onClick={fetchPayments}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Payment Summary */}
              {payments?.summary && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Invoiced</p>
                      <p className="text-xl font-bold text-gray-900">
                        ₹{payments.summary.totalInvoiced?.toLocaleString('en-IN') || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Paid</p>
                      <p className="text-xl font-bold text-green-600">
                        ₹{payments.summary.totalPaid?.toLocaleString('en-IN') || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Pending</p>
                      <p className="text-xl font-bold text-yellow-600">
                        ₹{payments.summary.totalPending?.toLocaleString('en-IN') || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Paid Invoices</p>
                      <p className="text-xl font-bold text-blue-600">
                        {payments.summary.paidCount || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {payments?.payments && payments.payments.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No payment records found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments?.payments?.map((payment, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{payment.invoiceNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.poNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            ₹{payment.amount?.toLocaleString('en-IN') || '0'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                            ₹{payment.paidAmount?.toLocaleString('en-IN') || '0'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-yellow-600">
                            ₹{payment.dueAmount?.toLocaleString('en-IN') || '0'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                              payment.stage === 'Paid' ? 'bg-green-100 text-green-800' :
                              payment.stage === 'Payment Scheduled' ? 'bg-blue-100 text-blue-800' :
                              payment.stage === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {payment.stage || 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Spare Parts Tab */}
        {activeTab === 'spare-parts' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">My Spare Parts Catalog</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage your spare parts inventory and pricing</p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowBulkUpload(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Upload className="w-4 h-4" />
                    Bulk Upload Parts
                  </button>
                  <select
                    value={filters.sparePartsCategory}
                    onChange={(e) => {
                      setFilters({ ...filters, sparePartsCategory: e.target.value });
                    }}
                    className="border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">All Categories</option>
                    <option value="engine">Engine</option>
                    <option value="transmission">Transmission</option>
                    <option value="brakes">Brakes</option>
                    <option value="suspension">Suspension</option>
                    <option value="electrical">Electrical</option>
                    <option value="filters">Filters</option>
                    <option value="fluids">Fluids</option>
                    <option value="belts">Belts</option>
                    <option value="lights">Lights</option>
                    <option value="battery">Battery</option>
                  </select>
                  <select
                    value={filters.sparePartsStatus}
                    onChange={(e) => {
                      setFilters({ ...filters, sparePartsStatus: e.target.value });
                    }}
                    className="border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending Approval</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="rejected">Rejected</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                  <button
                    onClick={fetchSpareParts}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {spareParts.length === 0 ? (
                <div className="text-center py-12">
                  <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No spare parts found</p>
                  <p className="text-sm text-gray-400 mt-2">Upload your spare parts using bulk upload to get started</p>
                  <button
                    onClick={() => setShowBulkUpload(true)}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Spare Parts
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {spareParts.map((part) => (
                    <div key={part._id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{part.partName}</h3>
                          <p className="text-xs text-gray-500 mt-1">{part.partNumber}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          part.status === 'active' ? 'bg-green-100 text-green-800' :
                          part.status === 'out_of_stock' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {part.status}
                        </span>
                      </div>
                      
                      {part.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{part.description}</p>
                      )}
                      
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Category:</span>
                          <span className="font-medium capitalize">{part.category}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Stock:</span>
                          <span className={`font-semibold ${
                            part.stock?.current <= (part.stock?.minimum || 0) ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {part.stock?.current || 0} {part.stock?.unit || 'units'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Price:</span>
                          <span className="font-bold text-blue-600">
                            ₹{part.vendorPrice?.toLocaleString('en-IN') || part.basePrice?.toLocaleString('en-IN') || '0'}
                          </span>
                        </div>
                        {part.leadTime && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Lead Time:</span>
                            <span className="font-medium">{part.leadTime} days</span>
                          </div>
                        )}
                      </div>
                      
                      {part.compatibleVehicles && part.compatibleVehicles.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-gray-500 mb-1">Compatible with:</p>
                          <div className="flex flex-wrap gap-1">
                            {part.compatibleVehicles.slice(0, 2).map((vehicle, idx) => (
                              <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                {vehicle.make} {vehicle.model}
                              </span>
                            ))}
                            {part.compatibleVehicles.length > 2 && (
                              <span className="text-xs text-gray-500">+{part.compatibleVehicles.length - 2} more</span>
                            )}
                          </div>
                        </div>
                      )}
                      {part.status === 'pending' && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded">
                            <Clock className="w-4 h-4" />
                            <span>Pending Admin Approval</span>
                          </div>
                        </div>
                      )}
                      {part.status === 'rejected' && part.approvalStatus?.rejectionReason && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded">
                            <div className="flex items-center gap-2 mb-1">
                              <XCircle className="w-4 h-4" />
                              <span className="font-semibold">Rejected</span>
                            </div>
                            <p className="text-xs mt-1">Reason: {part.approvalStatus.rejectionReason}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {showBulkUpload && (
              <BulkSparePartsUpload
                onSuccess={() => {
                  fetchSpareParts();
                  setShowBulkUpload(false);
                }}
                onClose={() => setShowBulkUpload(false)}
              />
            )}
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Performance Metrics (Read-Only Analytics)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <Target className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-1">Trust Score</p>
                  <p className="text-4xl font-bold text-blue-600">{vendor.trustScore || 0}</p>
                  <p className="text-xs text-gray-500 mt-2">/ 100</p>
                </div>
                <div className="text-center p-6 bg-green-50 rounded-lg border-2 border-green-200">
                  <Shield className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-1">Compliance Score</p>
                  <p className="text-4xl font-bold text-green-600">{vendor.complianceScore || 0}</p>
                  <p className="text-xs text-gray-500 mt-2">/ 100</p>
                </div>
                <div className="text-center p-6 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <Truck className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-1">Delivery Reliability</p>
                  <p className="text-4xl font-bold text-purple-600">{vendor.deliveryReliabilityScore || 0}%</p>
                  <p className="text-xs text-gray-500 mt-2">On-time delivery</p>
                </div>
              </div>
              
              {trustScore && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-md font-semibold mb-4">Performance Breakdown</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">On-Time Delivery Rate</span>
                        <span className="font-semibold">{trustScore.onTimePercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${trustScore.onTimePercentage}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Total Deliveries</span>
                        <span className="font-semibold">{trustScore.totalDeliveries}</span>
                      </div>
                      <div className="flex space-x-4 text-xs text-gray-500 mt-1">
                        <span>✅ On-Time: {trustScore.onTimeDeliveries}</span>
                        <span>⏰ Delayed: {trustScore.delayedDeliveries}</span>
                      </div>
                    </div>
                    {trustScore.avgDelayDays > 0 && (
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          ⚠️ Average Delay: <span className="font-semibold">{trustScore.avgDelayDays} days</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">System-Triggered Notifications</h2>
                <button
                  onClick={fetchNotifications}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${
                      !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                          {!notification.read && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">New</span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                            notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {notification.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Audit Log Tab */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Audit & Compliance Log</h2>
                  <p className="text-sm text-gray-500 mt-1">Immutable activity history - All actions are logged for audit purposes</p>
                </div>
                <button
                  onClick={fetchAuditLog}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auditLog.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-semibold">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{log.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.poNumber || log.invoiceNumber || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {log.amount ? `₹${log.amount.toLocaleString('en-IN')}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* PO Detail Modal */}
      {showPODetail && selectedPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Purchase Order Details</h2>
                <button
                  onClick={() => {
                    setShowPODetail(false);
                    setSelectedPO(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">PO Number</label>
                  <p className="text-lg font-semibold">{selectedPO.poNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-lg">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedPO.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedPO.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                      selectedPO.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedPO.status}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Order Date</label>
                  <p className="text-lg">{new Date(selectedPO.orderDate || selectedPO.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Expected Delivery</label>
                  <p className="text-lg">
                    {selectedPO.expectedDeliveryDate 
                      ? new Date(selectedPO.expectedDeliveryDate).toLocaleDateString()
                      : 'Not set'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Depot</label>
                  <p className="text-lg">{selectedPO.depotId?.depotName || selectedPO.depotName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Amount</label>
                  <p className="text-lg font-semibold">₹{selectedPO.totalAmount?.toLocaleString('en-IN') || '0'}</p>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Part Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Unit Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedPO.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm">{item.partName || 'N/A'}</td>
                          <td className="px-4 py-2 text-sm">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm">₹{item.unitPrice?.toLocaleString('en-IN') || '0'}</td>
                          <td className="px-4 py-2 text-sm font-semibold">₹{item.totalPrice?.toLocaleString('en-IN') || '0'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {selectedPO.status === 'pending' && (
                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => handleAcceptPO(selectedPO._id)}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center space-x-2"
                  >
                    <Check className="w-5 h-5" />
                    <span>Accept PO</span>
                  </button>
                  <button
                    onClick={() => {
                      setRejectingPOId(selectedPO._id);
                      setShowRejectModal(true);
                      setShowPODetail(false);
                    }}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 flex items-center justify-center space-x-2"
                  >
                    <X className="w-5 h-5" />
                    <span>Reject PO</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject PO Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Reject Purchase Order</h2>
            <p className="text-sm text-gray-600 mb-4">Please provide a reason for rejection. This will be sent to the depot.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full border rounded-lg px-3 py-2 h-24 mb-4"
            />
            <div className="flex space-x-3">
              <button
                onClick={handleRejectPO}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700"
              >
                Reject PO
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setRejectingPOId(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Update Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Update Delivery Status</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Status</label>
                <select
                  value={deliveryData.status}
                  onChange={(e) => setDeliveryData({ ...deliveryData, status: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select status</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="partial">Partially Delivered</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tracking Number (Optional)</label>
                <input
                  type="text"
                  value={deliveryData.trackingNumber}
                  onChange={(e) => setDeliveryData({ ...deliveryData, trackingNumber: e.target.value })}
                  placeholder="Enter tracking number"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleUpdateDelivery}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
                >
                  Update Status
                </button>
                <button
                  onClick={() => {
                    setShowDeliveryModal(false);
                    setDeliveryData({ status: '', trackingNumber: '' });
                    setUpdatingPOId(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {showInvoiceDetail && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Invoice Details</h2>
                <button
                  onClick={() => {
                    setShowInvoiceDetail(false);
                    setSelectedInvoice(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Invoice Number</label>
                  <p className="text-lg font-semibold">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">PO Number</label>
                  <p className="text-lg">{selectedInvoice.purchaseOrderId?.poNumber || selectedInvoice.poNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Invoice Date</label>
                  <p className="text-lg">{new Date(selectedInvoice.invoiceDate || selectedInvoice.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-lg">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedInvoice.status === 'approved' ? 'bg-green-100 text-green-800' :
                      selectedInvoice.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedInvoice.status}
                    </span>
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Financial Breakdown</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">₹{selectedInvoice.subtotal?.toLocaleString('en-IN') || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">CGST</span>
                    <span className="font-semibold">₹{selectedInvoice.tax?.cgst?.toLocaleString('en-IN') || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">SGST</span>
                    <span className="font-semibold">₹{selectedInvoice.tax?.sgst?.toLocaleString('en-IN') || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">IGST</span>
                    <span className="font-semibold">₹{selectedInvoice.tax?.igst?.toLocaleString('en-IN') || '0'}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">Total Amount</span>
                      <span className="text-lg font-bold text-blue-600">₹{selectedInvoice.totalAmount?.toLocaleString('en-IN') || '0'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => downloadInvoice(selectedInvoice._id)}
                  className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Invoice PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboardIndustry;
