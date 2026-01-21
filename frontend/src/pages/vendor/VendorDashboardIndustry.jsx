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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
  const [editingProduct, setEditingProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockUpdateData, setStockUpdateData] = useState({ productId: '', quantity: '', operation: 'set' });
  const [editingStockId, setEditingStockId] = useState(null);
  const [editingStockValue, setEditingStockValue] = useState('');
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

  // Fetch spare parts when filters change or when dashboard/spare-parts tab is active
  useEffect(() => {
    if (user && (user.role === 'vendor' || user.role === 'VENDOR') && (activeTab === 'spare-parts' || activeTab === 'dashboard')) {
      fetchSpareParts();
    }
  }, [filters.sparePartsCategory, filters.sparePartsStatus, activeTab]);

  // Fetch data when tabs change
  useEffect(() => {
    if (!user || (user.role !== 'vendor' && user.role !== 'VENDOR')) return;

    switch (activeTab) {
      case 'dashboard':
        fetchDashboardData();
        fetchSpareParts();
        break;
      case 'profile':
        fetchProfile();
        break;
      case 'spare-parts':
        fetchSpareParts();
        break;
      case 'purchase-orders':
        fetchPurchaseOrders();
        break;
      case 'delivery':
        fetchPurchaseOrders(); // Delivery uses PO data
        break;
      case 'invoices':
        fetchInvoices();
        break;
      case 'payments':
        fetchPayments();
        break;
      case 'performance':
        fetchTrustScore();
        break;
      default:
        break;
    }
  }, [activeTab]);

  // Debug: Log when spare parts change
  useEffect(() => {
    console.log('📦 Spare parts state updated:', spareParts.length, 'items');
    if (spareParts.length > 0) {
      console.log('📦 Sample part:', spareParts[0]);
    }
  }, [spareParts]);

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
      console.log('📊 Dashboard API Response:', response);
      
      // Handle apiFetch response structure: { ok: true, data: { success: true, data: {...} } }
      if (response && response.ok && response.data && response.data.success) {
        console.log('✅ Dashboard data received:', response.data.data);
        setDashboardData(response.data.data);
      } else if (response && response.success) {
        // Fallback for direct response structure
        console.log('✅ Dashboard data received (fallback):', response.data);
        setDashboardData(response.data);
      } else {
        console.warn('⚠️ No dashboard data, using defaults');
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
      console.error('❌ Error fetching dashboard:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
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
      
      const response = await apiFetch(`/api/products/vendor/my-products?${params.toString()}`, {
        suppressError: true // Suppress 404 errors
      });
      if (response && response.ok && response.data.success) {
        const parts = response.data.data.products || [];
        console.log('📦 Fetched spare parts:', parts.length, 'items');
        setSpareParts(parts);
      } else {
        console.log('⚠️ No spare parts data received');
        setSpareParts([]);
      }
    } catch (error) {
      console.error('Error fetching spare parts:', error);
      setSpareParts([]);
    }
  };

  const handleUpdateProduct = async (productData) => {
    try {
      const { apiFetch } = await import('../../utils/api');
      const response = await apiFetch(`/api/products/${editingProduct._id}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
      });
      if (response && response.ok && response.data.success) {
        toast.success('Product updated successfully');
        setShowEditModal(false);
        setEditingProduct(null);
        fetchSpareParts();
      } else {
        toast.error('Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }
    try {
      const { apiFetch } = await import('../../utils/api');
      const response = await apiFetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });
      if (response && response.ok && response.data.success) {
        toast.success('Product deleted successfully');
        fetchSpareParts();
      } else {
        toast.error('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleUpdateStock = async (productId, quantity, operation = 'set') => {
    if (!quantity || quantity < 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    try {
      const { apiFetch } = await import('../../utils/api');
      const response = await apiFetch(`/api/products/${productId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quantity: parseInt(quantity),
          operation: operation
        })
      });
      if (response && response.ok && response.data.success) {
        const message = response.data.message || 'Stock updated successfully. Price recalculated automatically.';
        toast.success(message);
        setEditingStockId(null);
        setEditingStockValue('');
        // Refresh spare parts to show updated price
        await fetchSpareParts();
      } else {
        const errorMsg = response?.data?.message || 'Failed to update stock';
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to update stock';
      toast.error(errorMsg);
    }
  };

  const handleInlineStockUpdate = (productId, currentStock) => {
    setEditingStockId(productId);
    setEditingStockValue(currentStock.toString());
  };

  const handleSaveInlineStock = (productId) => {
    if (editingStockValue !== '') {
      handleUpdateStock(productId, editingStockValue, 'set');
    } else {
      setEditingStockId(null);
      setEditingStockValue('');
    }
  };

  const handleCancelInlineStock = () => {
    setEditingStockId(null);
    setEditingStockValue('');
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

  // Handle different data structures from API
  const stats = dashboardData?.stats || {};
  const vendor = dashboardData?.vendor || profile || user || {};
  
  // Debug logging
  useEffect(() => {
    if (dashboardData) {
      console.log('📊 VendorDashboardIndustry - dashboardData:', dashboardData);
      console.log('📊 VendorDashboardIndustry - stats:', stats);
      console.log('📊 VendorDashboardIndustry - vendor:', vendor);
    }
  }, [dashboardData, stats, vendor]);

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

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'profile', label: 'Profile & Compliance', icon: User },
    { id: 'spare-parts', label: 'Spare Parts', icon: Wrench },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: Package },
    { id: 'delivery', label: 'Delivery Tracking', icon: Truck },
    { id: 'invoices', label: 'Invoices', icon: Receipt },
    { id: 'payments', label: 'Payments & Ledger', icon: CreditCard },
    { id: 'performance', label: 'Performance & Trust Score', icon: Award }
  ];

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg border-r border-gray-200 fixed h-screen transition-all duration-300 z-50 flex flex-col ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center space-x-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">YATRIK ERP</h1>
                <p className="text-xs text-gray-500">Vendor Portal</p>
              </div>
            </div>
          )}
          {!sidebarOpen && (
            <Building2 className="w-8 h-8 text-blue-600 mx-auto" />
          )}
          <button
            onClick={() => {
              setSidebarOpen(!sidebarOpen);
              if (window.innerWidth < 1024) {
                setMobileMenuOpen(false);
              }
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden lg:block"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Vendor Info */}
        {sidebarOpen && (
          <div className="p-4 border-b border-gray-200">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm font-semibold text-gray-900 truncate">{vendor.companyName || 'Vendor'}</p>
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Trust Score</span>
                  <span className="text-xs font-semibold text-blue-600">{vendor.trustScore || 0}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${vendor.trustScore || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navigationItems.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (window.innerWidth < 1024) {
                    setMobileMenuOpen(false);
                  }
                }}
                className={`w-full flex items-center ${
                  sidebarOpen ? 'px-4' : 'px-2 justify-center'
                } py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                }`}
                title={!sidebarOpen ? tab.label : ''}
              >
                <Icon className={`${sidebarOpen ? 'w-5 h-5 mr-3' : 'w-6 h-6'}`} />
                {sidebarOpen && <span>{tab.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={() => {
              setActiveTab(activeTab === 'notifications' ? 'dashboard' : 'notifications');
              if (window.innerWidth < 1024) {
                setMobileMenuOpen(false);
              }
            }}
            className={`w-full flex items-center ${
              sidebarOpen ? 'px-4' : 'px-2 justify-center'
            } py-3 text-sm font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
            }`}
            title={!sidebarOpen ? 'Notifications' : ''}
          >
            <Bell className={`${sidebarOpen ? 'w-5 h-5 mr-3' : 'w-6 h-6'}`} />
            {sidebarOpen && (
              <>
                <span>Notifications</span>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </>
            )}
            {!sidebarOpen && notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute ml-4 bg-red-500 text-white text-xs rounded-full w-3 h-3"></span>
            )}
          </button>
          <button
            onClick={logout}
            className={`w-full flex items-center ${
              sidebarOpen ? 'px-4' : 'px-2 justify-center'
            } py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors`}
            title={!sidebarOpen ? 'Logout' : ''}
          >
            <LogOut className={`${sidebarOpen ? 'w-5 h-5 mr-3' : 'w-6 h-6'}`} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} transition-all duration-300 flex flex-col overflow-hidden`}>
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b z-40 flex-shrink-0">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {navigationItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">Industry-Grade ERP Supply Chain Interface</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="hidden md:flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Performance Rating</p>
                    <p className="text-lg font-semibold text-gray-900">{vendor.performanceRating || 0}/100</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg lg:hidden"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
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

            {/* Stock Insights Card */}
            {spareParts.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Stock Insights</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600">Total Products</div>
                    <div className="text-2xl font-bold text-gray-900">{spareParts.length}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600">In Stock</div>
                    <div className="text-2xl font-bold text-green-600">
                      {spareParts.filter(p => (p.stock?.quantity || 0) > 0).length}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600">Low Stock</div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {spareParts.filter(p => {
                        const qty = p.stock?.quantity || 0;
                        const minQty = p.stock?.minQuantity || 2;
                        return qty > 0 && qty <= minQty;
                      }).length}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600">Stock Value</div>
                    <div className="text-2xl font-bold text-blue-600">
                      ₹{spareParts.reduce((sum, p) => {
                        const qty = p.stock?.quantity || 0;
                        const price = p.finalPrice || p.basePrice || 0;
                        return sum + (qty * price);
                      }, 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Spare Parts Overview Table */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">All Spare Parts Details</h2>
                  <p className="text-sm text-gray-500 mt-1">Complete inventory with all specifications</p>
                </div>
                <button
                  onClick={() => setActiveTab('spare-parts')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-2"
                >
                  View Full Details
                  <ArrowRight className="w-4 h-4" />
                </button>
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
                <div className="w-full">
                  <table className="w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">Img</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">Part Name</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price (₹)</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">Compatibility</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lead</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">Warr</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">MOQ</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">GST</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">Desc</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {spareParts.map((part) => {
                        const imageUrl = part.images?.[0]?.url || part.imageUrl || part.images?.[0] || null;
                        const partCode = part.productCode || part.partNumber || part.ksrcPartCode || 'N/A';
                        const partName = part.productName || part.partName || 'N/A';
                        const category = part.category || 'N/A';
                        const basePrice = part.basePrice || 0;
                        const finalPrice = part.finalPrice || part.vendorPrice || basePrice;
                        const busModelCompatibility = part.compatibleVehicles?.length > 0 
                          ? part.compatibleVehicles.map(v => `${v.make || ''} ${v.model || ''}`).join(', ') 
                          : part.compatibleWith?.[0]?.vehicleModel || (part.specifications?.busModelCompatibility || (part.specifications?.get ? part.specifications.get('busModelCompatibility') : null)) || part.busModelCompatibility || part.compatibleBusModel || 'All Models';
                        // Get leadTime, warranty, and moq from specifications Map or direct fields
                        const specs = part.specifications || {};
                        const leadTime = part.leadTime || part.leadTimeDays || specs.leadTime || (specs.get ? specs.get('leadTime') : null) || 0;
                        const warranty = part.warranty?.period || part.warrantyMonths || specs.warrantyMonths || (specs.get ? specs.get('warrantyMonths') : null) || 0;
                        const moq = part.moq || part.minimumOrderQuantity || specs.moq || (specs.get ? specs.get('moq') : null) || 0;
                        const gstRate = part.gstRate || part.taxRate || 0;
                        const stockQuantity = part.stock?.quantity || part.stock?.current || part.stockQuantity || 0;
                        const stockUnit = part.stock?.unit || part.stockUnit || 'pieces';
                        const description = part.description || 'N/A';
                        
                        return (
                          <tr key={part._id} className="hover:bg-gray-50">
                            <td className="px-1 py-2 whitespace-nowrap">
                              {imageUrl && !imageUrl.includes('placeholder.com') && !imageUrl.includes('via.placeholder') ? (
                                <img
                                  src={imageUrl}
                                  alt={partName}
                                  className="w-10 h-10 object-cover rounded border border-gray-200"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextElementSibling?.style?.display === 'none' && (e.target.nextElementSibling.style.display = 'flex');
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                  <Package className="w-4 h-4 text-gray-400" />
                                </div>
                              )}
                            </td>
                            <td className="px-1 py-2 whitespace-nowrap text-xs font-medium text-gray-900">{partCode}</td>
                            <td className="px-1 py-2 text-xs text-gray-900 max-w-[120px]">
                              <div className="font-medium truncate" title={partName}>{partName}</div>
                            </td>
                            <td className="px-1 py-2 whitespace-nowrap text-xs text-gray-500 capitalize">{category}</td>
                            <td className="px-1 py-2 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-gray-900">
                                  ₹{finalPrice.toLocaleString('en-IN')}
                                </span>
                                {finalPrice !== basePrice && (
                                  <span className="text-[10px] text-blue-600" title={`Base: ₹${basePrice.toLocaleString('en-IN')}, Auto-calculated based on stock`}>
                                    Base: ₹{basePrice.toLocaleString('en-IN')}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-1 py-2 text-xs text-gray-500 max-w-[80px]">
                              <div className="truncate" title={busModelCompatibility}>{busModelCompatibility}</div>
                            </td>
                            <td className="px-1 py-2 whitespace-nowrap text-xs text-gray-500">{leadTime}d</td>
                            <td className="px-1 py-2 whitespace-nowrap text-xs text-gray-500">{warranty}m</td>
                            <td className="px-1 py-2 whitespace-nowrap text-xs text-gray-500">{moq}</td>
                            <td className="px-1 py-2 whitespace-nowrap text-xs text-gray-500">{gstRate}%</td>
                            <td className="px-1 py-2 whitespace-nowrap">
                              {editingStockId === part._id ? (
                                <div className="flex items-center gap-0.5">
                                  <input
                                    type="number"
                                    min="0"
                                    value={editingStockValue}
                                    onChange={(e) => setEditingStockValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleSaveInlineStock(part._id);
                                      } else if (e.key === 'Escape') {
                                        handleCancelInlineStock();
                                      }
                                    }}
                                    className="w-16 px-1 py-0.5 text-xs border rounded border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleSaveInlineStock(part._id)}
                                    className="text-green-600 hover:text-green-800"
                                    title="Save"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={handleCancelInlineStock}
                                    className="text-red-600 hover:text-red-800"
                                    title="Cancel"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <div className="flex flex-col">
                                    <span className={`text-xs font-semibold ${stockQuantity <= (part.stock?.minQuantity || 2) ? 'text-red-600' : stockQuantity <= 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                                      {stockQuantity}
                                    </span>
                                    {stockQuantity <= (part.stock?.minQuantity || 2) && (
                                      <span className="text-[8px] text-red-500">Low!</span>
                                    )}
                                    {part.finalPrice && part.finalPrice !== part.basePrice && (
                                      <span className="text-[8px] text-blue-500" title={`Price: ₹${part.finalPrice.toFixed(2)} (Auto-calculated)`}>
                                        ₹{part.finalPrice.toFixed(0)}
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleInlineStockUpdate(part._id, stockQuantity)}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Edit Stock"
                                  >
                                    <Settings className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="px-1 py-2 whitespace-nowrap text-xs text-gray-500">{stockUnit}</td>
                            <td className="px-1 py-2 text-xs text-gray-500 max-w-[100px]">
                              <div className="truncate" title={description}>{description}</div>
                            </td>
                            <td className="px-1 py-2 whitespace-nowrap">
                              <span className={`px-1 py-0.5 text-xs rounded-full font-semibold ${
                                part.status === 'active' ? 'bg-green-100 text-green-800' :
                                part.status === 'out_of_stock' ? 'bg-red-100 text-red-800' :
                                part.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                part.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {part.status || 'N/A'}
                              </span>
                            </td>
                            <td className="px-1 py-2 whitespace-nowrap">
                              <div className="flex items-center gap-0.5">
                                <button
                                  onClick={() => {
                                    setEditingProduct(part);
                                    setShowEditModal(true);
                                  }}
                                  className="text-green-600 hover:text-green-800"
                                  title="Edit Product"
                                >
                                  <Settings className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(part._id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete Product"
                                >
                                  <X className="w-3 h-3" />
                                </button>
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
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
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
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
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
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-500 mb-1">Total Invoiced</p>
                      <p className="text-xl font-bold text-gray-900">
                        ₹{payments.summary.totalInvoiced?.toLocaleString('en-IN') || 0}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">All invoices</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-500 mb-1">Total Paid</p>
                      <p className="text-xl font-bold text-green-600">
                        ₹{payments.summary.totalPaid?.toLocaleString('en-IN') || 0}
                      </p>
                      <p className="text-xs text-green-600 mt-1">{payments.summary.paidCount || 0} paid</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-500 mb-1">Pending Payment</p>
                      <p className="text-xl font-bold text-orange-600">
                        ₹{payments.summary.totalPending?.toLocaleString('en-IN') || 0}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">{payments.summary.pendingCount || 0} pending</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-500 mb-1">Payment Rate</p>
                      <p className="text-xl font-bold text-purple-600">
                        {payments.summary.totalInvoiced > 0 
                          ? `${((payments.summary.totalPaid / payments.summary.totalInvoiced) * 100).toFixed(1)}%`
                          : '0%'}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">Collection rate</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-500 mb-1">Outstanding</p>
                      <p className="text-xl font-bold text-red-600">
                        ₹{((payments.summary.totalInvoiced || 0) - (payments.summary.totalPaid || 0)).toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-red-600 mt-1">To be received</p>
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
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tax (GST)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Overdue</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments?.payments?.map((payment, idx) => (
                        <tr key={payment._id || payment.invoiceId || idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">{payment.invoiceNumber}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{payment.poNumber}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {payment.invoiceDate ? new Date(payment.invoiceDate).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            ₹{payment.subtotal?.toLocaleString('en-IN') || payment.amount?.toLocaleString('en-IN') || '0'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            <div className="text-xs">
                              <div>CGST: ₹{payment.cgst?.toLocaleString('en-IN') || '0'}</div>
                              <div>SGST: ₹{payment.sgst?.toLocaleString('en-IN') || '0'}</div>
                              <div className="font-semibold">Total: ₹{payment.taxAmount?.toLocaleString('en-IN') || '0'}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                            ₹{payment.amount?.toLocaleString('en-IN') || '0'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">
                            ₹{payment.paidAmount?.toLocaleString('en-IN') || '0'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-red-600">
                            ₹{payment.dueAmount?.toLocaleString('en-IN') || '0'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                              payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                              payment.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                              payment.status === 'overdue' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {payment.status?.toUpperCase() || payment.stage || 'PENDING'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono text-xs">
                            {payment.transactionId || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {payment.paymentMethod || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {payment.daysOverdue > 0 ? (
                              <span className="text-red-600 font-semibold">{payment.daysOverdue} days</span>
                            ) : (
                              <span className="text-gray-500">-</span>
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

        {/* Spare Parts Tab */}
        {activeTab === 'spare-parts' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">My Spare Parts Catalog</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage your spare parts inventory and pricing</p>
                  {/* Stock Summary */}
                  {spareParts.length > 0 && (
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className="text-gray-600">
                        Total Products: <span className="font-semibold">{spareParts.length}</span>
                      </span>
                      <span className="text-green-600">
                        In Stock: <span className="font-semibold">{spareParts.filter(p => (p.stock?.quantity || 0) > 0).length}</span>
                      </span>
                      <span className="text-red-600">
                        Low Stock: <span className="font-semibold">{spareParts.filter(p => (p.stock?.quantity || 0) > 0 && (p.stock?.quantity || 0) <= (p.stock?.minQuantity || 2)).length}</span>
                      </span>
                      <span className="text-gray-600">
                        Total Stock Value: <span className="font-semibold">₹{spareParts.reduce((sum, p) => sum + ((p.stock?.quantity || 0) * (p.finalPrice || p.basePrice || 0)), 0).toLocaleString('en-IN')}</span>
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={async () => {
                      if (window.confirm('Update all products to 5 pieces stock? This will recalculate prices automatically.')) {
                        try {
                          const { apiFetch } = await import('../../utils/api');
                          const response = await apiFetch('/api/products/vendor/bulk-stock-update', {
                            method: 'POST',
                            body: JSON.stringify({ quantity: 5 }),
                            headers: { 'Content-Type': 'application/json' }
                          });
                          if (response && response.ok && response.data.success) {
                            toast.success('All products updated to 5 pieces. Prices recalculated!');
                            await fetchSpareParts();
                          } else {
                            toast.error('Failed to update stock');
                          }
                        } catch (error) {
                          toast.error('Failed to update stock');
                        }
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    title="Set all products to 5 pieces stock"
                  >
                    <Package className="w-4 h-4" />
                    Set All to 5
                  </button>
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
                <div className="w-full">
                  <table className="w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">Img</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">Part Name</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price (₹)</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">Compatibility</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lead</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">Warr</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">MOQ</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">GST</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">Desc</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {spareParts.map((part) => {
                        const imageUrl = part.images?.[0]?.url || part.imageUrl || part.images?.[0] || null;
                        const partCode = part.productCode || part.partNumber || part.ksrcPartCode || 'N/A';
                        const partName = part.productName || part.partName || 'N/A';
                        const category = part.category || 'N/A';
                        const basePrice = part.basePrice || 0;
                        const finalPrice = part.finalPrice || part.vendorPrice || basePrice;
                        const busModelCompatibility = part.compatibleVehicles?.length > 0 
                          ? part.compatibleVehicles.map(v => `${v.make || ''} ${v.model || ''}`).join(', ') 
                          : part.compatibleWith?.[0]?.vehicleModel || (part.specifications?.busModelCompatibility || (part.specifications?.get ? part.specifications.get('busModelCompatibility') : null)) || part.busModelCompatibility || part.compatibleBusModel || 'All Models';
                        // Get leadTime, warranty, and moq from specifications Map or direct fields
                        const specs = part.specifications || {};
                        const leadTime = part.leadTime || part.leadTimeDays || specs.leadTime || (specs.get ? specs.get('leadTime') : null) || 0;
                        const warranty = part.warranty?.period || part.warrantyMonths || specs.warrantyMonths || (specs.get ? specs.get('warrantyMonths') : null) || 0;
                        const moq = part.moq || part.minimumOrderQuantity || specs.moq || (specs.get ? specs.get('moq') : null) || 0;
                        const gstRate = part.gstRate || part.taxRate || 0;
                        const stockQuantity = part.stock?.quantity || part.stock?.current || part.stockQuantity || 0;
                        const stockUnit = part.stock?.unit || part.stockUnit || 'pieces';
                        const description = part.description || 'N/A';
                        
                        return (
                          <tr key={part._id} className="hover:bg-gray-50">
                            <td className="px-1 py-2 whitespace-nowrap">
                              {imageUrl && !imageUrl.includes('placeholder.com') && !imageUrl.includes('via.placeholder') ? (
                                <img
                                  src={imageUrl}
                                  alt={partName}
                                  className="w-10 h-10 object-cover rounded border border-gray-200"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextElementSibling?.style?.display === 'none' && (e.target.nextElementSibling.style.display = 'flex');
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                  <Package className="w-4 h-4 text-gray-400" />
                                </div>
                              )}
                            </td>
                            <td className="px-1 py-2 whitespace-nowrap text-xs font-medium text-gray-900">{partCode}</td>
                            <td className="px-1 py-2 text-xs text-gray-900 max-w-[120px]">
                              <div className="font-medium truncate" title={partName}>{partName}</div>
                            </td>
                            <td className="px-1 py-2 whitespace-nowrap text-xs text-gray-500 capitalize">{category}</td>
                            <td className="px-1 py-2 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-gray-900">
                                  ₹{finalPrice.toLocaleString('en-IN')}
                                </span>
                                {finalPrice !== basePrice && (
                                  <span className="text-[10px] text-blue-600" title={`Base: ₹${basePrice.toLocaleString('en-IN')}, Auto-calculated based on stock`}>
                                    Base: ₹{basePrice.toLocaleString('en-IN')}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-1 py-2 text-xs text-gray-500 max-w-[80px]">
                              <div className="truncate" title={busModelCompatibility}>{busModelCompatibility}</div>
                            </td>
                            <td className="px-1 py-2 whitespace-nowrap text-xs text-gray-500">{leadTime}d</td>
                            <td className="px-1 py-2 whitespace-nowrap text-xs text-gray-500">{warranty}m</td>
                            <td className="px-1 py-2 whitespace-nowrap text-xs text-gray-500">{moq}</td>
                            <td className="px-1 py-2 whitespace-nowrap text-xs text-gray-500">{gstRate}%</td>
                            <td className="px-1 py-2 whitespace-nowrap">
                              {editingStockId === part._id ? (
                                <div className="flex items-center gap-0.5">
                                  <input
                                    type="number"
                                    min="0"
                                    value={editingStockValue}
                                    onChange={(e) => setEditingStockValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleSaveInlineStock(part._id);
                                      } else if (e.key === 'Escape') {
                                        handleCancelInlineStock();
                                      }
                                    }}
                                    className="w-16 px-1 py-0.5 text-xs border rounded border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleSaveInlineStock(part._id)}
                                    className="text-green-600 hover:text-green-800"
                                    title="Save"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={handleCancelInlineStock}
                                    className="text-red-600 hover:text-red-800"
                                    title="Cancel"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <div className="flex flex-col">
                                    <span className={`text-xs font-semibold ${stockQuantity <= (part.stock?.minQuantity || 2) ? 'text-red-600' : stockQuantity <= 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                                      {stockQuantity}
                                    </span>
                                    {stockQuantity <= (part.stock?.minQuantity || 2) && (
                                      <span className="text-[8px] text-red-500">Low!</span>
                                    )}
                                    {part.finalPrice && part.finalPrice !== part.basePrice && (
                                      <span className="text-[8px] text-blue-500" title={`Price: ₹${part.finalPrice.toFixed(2)} (Auto-calculated)`}>
                                        ₹{part.finalPrice.toFixed(0)}
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleInlineStockUpdate(part._id, stockQuantity)}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Edit Stock"
                                  >
                                    <Settings className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="px-1 py-2 whitespace-nowrap text-xs text-gray-500">{stockUnit}</td>
                            <td className="px-1 py-2 text-xs text-gray-500 max-w-[100px]">
                              <div className="truncate" title={description}>{description}</div>
                            </td>
                            <td className="px-1 py-2 whitespace-nowrap">
                              <span className={`px-1 py-0.5 text-xs rounded-full font-semibold ${
                                part.status === 'active' ? 'bg-green-100 text-green-800' :
                                part.status === 'out_of_stock' ? 'bg-red-100 text-red-800' :
                                part.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                part.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {part.status || 'N/A'}
                              </span>
                            </td>
                            <td className="px-1 py-2 whitespace-nowrap">
                              <div className="flex items-center gap-0.5">
                                <button
                                  onClick={() => {
                                    setEditingProduct(part);
                                    setShowEditModal(true);
                                  }}
                                  className="text-green-600 hover:text-green-800"
                                  title="Edit Product"
                                >
                                  <Settings className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(part._id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete Product"
                                >
                                  <X className="w-3 h-3" />
                                </button>
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
      </div>

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
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
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

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Edit Product</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProduct(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                <input
                  type="text"
                  value={editingProduct.productName || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, productName: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Base Price (₹)</label>
                <input
                  type="number"
                  value={editingProduct.basePrice || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, basePrice: parseFloat(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 h-24"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleUpdateProduct(editingProduct)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
                >
                  Update Product
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProduct(null);
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

      {/* Update Stock Modal */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Update Stock Quantity</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Operation</label>
                <select
                  value={stockUpdateData.operation}
                  onChange={(e) => setStockUpdateData({ ...stockUpdateData, operation: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="set">Set Quantity</option>
                  <option value="add">Add to Stock</option>
                  <option value="subtract">Subtract from Stock</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={stockUpdateData.quantity}
                  onChange={(e) => setStockUpdateData({ ...stockUpdateData, quantity: e.target.value })}
                  placeholder="Enter quantity"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleUpdateStock}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
                >
                  Update Stock
                </button>
                <button
                  onClick={() => {
                    setShowStockModal(false);
                    setStockUpdateData({ productId: '', quantity: '', operation: 'set' });
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
    </div>
  );
};

export default VendorDashboardIndustry;
