import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import vendorApiService from '../../services/vendorApiService';
import productApiService from '../../services/productApiService';
import sparePartsApiService from '../../services/sparePartsApiService';
import {
  Building2, Wallet, FileText, TrendingUp, CheckCircle, Clock, AlertCircle,
  DollarSign, Package, Receipt, BarChart3, Settings, LogOut, RefreshCw,
  Search, Filter, Download, Eye, Check, X, Truck, ShoppingCart, Star,
  Activity, Users, Calendar, Bell, Menu, ChevronRight, Plus,
  ArrowRight, MessageCircle, CreditCard, FileDown, ExternalLink,
  Gavel, List, Award, AlertTriangle, TrendingDown, LineChart, PieChart,
  Zap, Target, Shield, Wrench, ShoppingBag, Minus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Line, Doughnut } from 'react-chartjs-2';
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

// Register Chart.js components
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

const VendorDashboardEnhanced = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [spareParts, setSpareParts] = useState([]);
  const [sparePartsLoading, setSparePartsLoading] = useState(false);
  const [sparePartsQuantities, setSparePartsQuantities] = useState({}); // Track quantities for bulk purchase

  useEffect(() => {
    if (user && user.role === 'vendor') {
      fetchDashboardData();
      fetchCart();
      fetchSpareParts();
    }
  }, [user]);

  const fetchSpareParts = async () => {
    try {
      setSparePartsLoading(true);
      const response = await sparePartsApiService.getSpareParts({ 
        limit: 8, 
        status: 'active',
        page: 1
      });
      if (response && response.success) {
        setSpareParts(response.data.data?.spareParts || response.data.spareParts || []);
      }
    } catch (error) {
      console.error('Error fetching spare parts:', error);
    } finally {
      setSparePartsLoading(false);
    }
  };

  const handleQuantityChange = (partId, delta) => {
    setSparePartsQuantities(prev => {
      const current = prev[partId] || 1;
      const newQuantity = Math.max(1, current + delta);
      return { ...prev, [partId]: newQuantity };
    });
  };

  const handleBulkPurchase = async (sparePart) => {
    const quantity = sparePartsQuantities[sparePart._id] || 1;
    // For now, show a message - in production, this would add to cart or create purchase request
    toast.success(`Added ${quantity} x ${sparePart.partName} to purchase request`);
    // TODO: Implement actual purchase order creation
  };

  const fetchCart = async () => {
    try {
      const response = await productApiService.getCart();
      if (response && response.success) {
        setCartCount(response.data.cart?.summary?.itemCount || 0);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await vendorApiService.getDashboard();
      if (response && response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getPerformanceColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBgColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const vendor = dashboardData?.vendor || {};
  const performance = dashboardData?.performance || {};
  const alerts = dashboardData?.alerts || [];

  // Prepare chart data
  const performanceChartData = {
    labels: performance.graphData?.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }) || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Orders',
        data: performance.graphData?.map(d => d.orders) || [0, 0, 0, 0, 0, 0, 0],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      },
      {
        label: 'Revenue (₹K)',
        data: performance.graphData?.map(d => d.revenue / 1000) || [0, 0, 0, 0, 0, 0, 0],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        yAxisID: 'y1'
      }
    ]
  };

  const revenueChartData = {
    labels: ['Pending', 'Completed'],
    datasets: [
      {
        data: [stats.paymentsPending || 0, stats.paymentsCompleted || 0],
        backgroundColor: [
          'rgba(239, 68, 68, 0.9)',
          'rgba(16, 185, 129, 0.9)'
        ],
        borderWidth: 3,
        borderColor: '#fff',
        hoverOffset: 8
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      {/* Top Navigation Bar - Enhanced Flipkart Style */}
      <nav className="bg-white shadow-lg border-b-2 border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left Side - Logo & Search */}
            <div className="flex items-center space-x-8 flex-1">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                    YATRIK ERP
                  </div>
                  <div className="text-xs text-gray-500 font-medium">Vendor Portal</div>
                </div>
              </div>
              
              {/* Search Bar - Enhanced */}
              <div className="hidden lg:flex items-center flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search orders, invoices, payments..."
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Right Side - User & Actions */}
            <div className="flex items-center space-x-4">
              {/* Cart Button */}
              <Link
                to="/vendor/cart"
                className="relative p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:shadow-md"
                title="Shopping Cart"
              >
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 block bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              <button 
                className="relative p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:shadow-md"
                title="Notifications"
              >
                <Bell className="w-6 h-6" />
                {alerts.length > 0 && (
                  <span className="absolute top-1 right-1 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                )}
              </button>
              
              <div className="hidden md:flex items-center space-x-3 px-4 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-white">
                  {user?.companyName?.[0] || user?.name?.[0] || 'V'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{user?.companyName || user?.name || 'Vendor'}</p>
                  <p className="text-xs text-gray-500">Vendor Account</p>
                </div>
              </div>

              <button
                onClick={async () => { await logout(); navigate('/login'); }}
                className="p-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:shadow-md"
                title="Logout"
              >
                <LogOut className="w-6 h-6" />
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section - Enhanced */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <span>{getGreeting()},</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  {user?.companyName || 'Vendor'}
                </span>
                <span>👋</span>
              </h1>
              <p className="text-gray-600 text-lg">Here's your complete business overview and performance metrics</p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 text-gray-700 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Alerts Section - Enhanced */}
        {alerts.length > 0 && (
          <div className="mb-6 space-y-3">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`flex items-start space-x-4 p-5 rounded-2xl border-l-4 shadow-lg backdrop-blur-sm ${
                  alert.type === 'error'
                    ? 'bg-gradient-to-r from-red-50 to-red-100/50 border-red-500'
                    : alert.type === 'warning'
                    ? 'bg-gradient-to-r from-yellow-50 to-yellow-100/50 border-yellow-500'
                    : 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-500'
                }`}
              >
                <div className="mt-0.5">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${
                    alert.type === 'error'
                      ? 'text-red-900'
                      : alert.type === 'warning'
                      ? 'text-yellow-900'
                      : 'text-blue-900'
                  }`}>
                    {alert.message}
                  </p>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* KPI Cards - Enhanced Flipkart Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Active Listings */}
          <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                  <List className="w-7 h-7 text-white" />
                </div>
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                {stats.totalActiveListings || 0}
              </h3>
              <p className="text-sm font-medium text-gray-600">Total Active Listings</p>
              <div className="mt-3 flex items-center text-xs text-green-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>Active</span>
              </div>
            </div>
          </div>

          {/* Active Auctions */}
          <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
                  <Gavel className="w-7 h-7 text-white" />
                </div>
                <Activity className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                {stats.activeAuctionsParticipated || 0}
              </h3>
              <p className="text-sm font-medium text-gray-600">Active Auctions Participated</p>
              <div className="mt-3 flex items-center text-xs text-purple-600">
                <Activity className="w-3 h-3 mr-1" />
                <span>Ongoing</span>
              </div>
            </div>
          </div>

          {/* Orders Received */}
          <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-green-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg">
                  <ShoppingCart className="w-7 h-7 text-white" />
                </div>
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                {stats.ordersReceived || 0}
              </h3>
              <p className="text-sm font-medium text-gray-600">Orders Received</p>
              <div className="mt-3 flex items-center text-xs text-green-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>All Time</span>
              </div>
            </div>
          </div>

          {/* Payments Pending */}
          <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <TrendingDown className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {formatCurrency(stats.paymentsPending || 0)}
              </h3>
              <p className="text-sm font-medium text-gray-600">Payments Pending</p>
              <div className="mt-3 flex items-center text-xs text-orange-600">
                <Clock className="w-3 h-3 mr-1" />
                <span>Awaiting</span>
              </div>
            </div>
          </div>

          {/* Payments Completed */}
          <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <TrendingUp className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {formatCurrency(stats.paymentsCompleted || 0)}
              </h3>
              <p className="text-sm font-medium text-gray-600">Payments Completed</p>
              <div className="mt-3 flex items-center text-xs text-emerald-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                <span>Received</span>
              </div>
            </div>
          </div>

          {/* Trust Score */}
          <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg">
                  <Award className="w-7 h-7 text-white" />
                </div>
                <Star className={`w-6 h-6 ${getPerformanceColor(vendor.trustScore || 0)}`} />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                {vendor.trustScore || 0}
                <span className="text-lg text-gray-400">/100</span>
              </h3>
              <p className="text-sm font-medium text-gray-600">Trust Score</p>
              <div className="mt-3 flex items-center text-xs text-indigo-600">
                <Shield className="w-3 h-3 mr-1" />
                <span>Verified</span>
              </div>
            </div>
          </div>

          {/* Performance Rating */}
          <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl shadow-lg">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <BarChart3 className={`w-6 h-6 ${getPerformanceColor(performance.rating || 0)}`} />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                {performance.rating || 0}
                <span className="text-lg text-gray-400">/100</span>
              </h3>
              <p className="text-sm font-medium text-gray-600">Performance Rating</p>
              <div className="mt-3 flex items-center text-xs text-yellow-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>Overall</span>
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {formatCurrency(stats.totalRevenue || 0)}
              </h3>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <div className="mt-3 flex items-center text-xs text-blue-600">
                <Zap className="w-3 h-3 mr-1" />
                <span>Lifetime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Graphs Section - Enhanced */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Trend Chart */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <LineChart className="w-5 h-5 text-blue-600" />
                  </div>
                  Performance Trend
                </h2>
                <p className="text-sm text-gray-500 mt-1">Last 7 days overview</p>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                View Details
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {performance.graphData && performance.graphData.length > 0 ? (
              <div className="h-80">
                <Line
                  data={performanceChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                        labels: {
                          usePointStyle: true,
                          padding: 15,
                          font: {
                            size: 12,
                            weight: 'bold'
                          }
                        }
                      },
                      tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#374151',
                        bodyColor: '#374151',
                        borderColor: '#E5E7EB',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: true
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        position: 'left',
                        grid: {
                          color: 'rgba(229, 231, 235, 0.5)'
                        },
                        ticks: {
                          font: {
                            size: 11
                          }
                        }
                      },
                      y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                          drawOnChartArea: false,
                        },
                        ticks: {
                          font: {
                            size: 11
                          }
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        },
                        ticks: {
                          font: {
                            size: 11
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
                <div className="text-center">
                  <LineChart className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm font-medium">No performance data available</p>
                  <p className="text-xs text-gray-400 mt-1">Data will appear as orders are received</p>
                </div>
              </div>
            )}
          </div>

          {/* Revenue Distribution Chart */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <PieChart className="w-5 h-5 text-green-600" />
                  </div>
                  Payment Status
                </h2>
                <p className="text-sm text-gray-500 mt-1">Revenue distribution</p>
              </div>
              <button className="text-sm text-green-600 hover:text-green-700 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                View Details
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="h-80 flex items-center justify-center">
              <Doughnut
                data={revenueChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                          size: 12,
                          weight: 'bold'
                        }
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      titleColor: '#374151',
                      bodyColor: '#374151',
                      borderColor: '#E5E7EB',
                      borderWidth: 1,
                      padding: 12,
                      cornerRadius: 8,
                      callbacks: {
                        label: function(context) {
                          const label = context.label || '';
                          const value = formatCurrency(context.parsed || 0);
                          return `${label}: ${value}`;
                        }
                      }
                    }
                  }
                }}
              />
            </div>
            <div className="mt-6 flex justify-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-red-500 shadow-md"></div>
                <span className="text-sm font-medium text-gray-700">Pending: {formatCurrency(stats.paymentsPending || 0)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-green-500 shadow-md"></div>
                <span className="text-sm font-medium text-gray-700">Completed: {formatCurrency(stats.paymentsCompleted || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Scores Section - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Trust Score</h3>
              </div>
              <Star className={`w-5 h-5 ${getPerformanceColor(vendor.trustScore || 0)}`} />
            </div>
            <div className="flex items-end space-x-2 mb-4">
              <span className={`text-4xl font-bold ${getPerformanceColor(vendor.trustScore || 0)}`}>
                {vendor.trustScore || 0}
              </span>
              <span className="text-xl text-gray-400 mb-1">/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getPerformanceBgColor(vendor.trustScore || 0)}`}
                style={{ width: `${vendor.trustScore || 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-3">Based on delivery performance and customer satisfaction</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Compliance Score</h3>
              </div>
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex items-end space-x-2 mb-4">
              <span className={`text-4xl font-bold ${getPerformanceColor(vendor.complianceScore || 0)}`}>
                {vendor.complianceScore || 0}
              </span>
              <span className="text-xl text-gray-400 mb-1">/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getPerformanceBgColor(vendor.complianceScore || 0)}`}
                style={{ width: `${vendor.complianceScore || 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-3">Based on document verification and regulatory compliance</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Delivery Reliability</h3>
              </div>
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex items-end space-x-2 mb-4">
              <span className={`text-4xl font-bold ${getPerformanceColor(vendor.deliveryReliabilityScore || 0)}`}>
                {vendor.deliveryReliabilityScore || 0}
              </span>
              <span className="text-xl text-gray-400 mb-1">/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getPerformanceBgColor(vendor.deliveryReliabilityScore || 0)}`}
                style={{ width: `${vendor.deliveryReliabilityScore || 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-3">Based on on-time delivery and order fulfillment rate</p>
          </div>
        </div>

        {/* Spare Parts Section - Bus Parts for Purchase */}
        <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Wrench className="w-6 h-6 text-blue-600" />
                Bus Spare Parts
              </h2>
              <p className="text-sm text-gray-500 mt-1">Purchase spare parts in bulk with payment options</p>
            </div>
          </div>

          {sparePartsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
            </div>
          ) : spareParts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No spare parts available at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {spareParts.slice(0, 8).map((part) => {
                const quantity = sparePartsQuantities[part._id] || 1;
                const totalPrice = part.basePrice * quantity;
                const stockAvailable = part.stock?.current || 0;
                
                return (
                  <div
                    key={part._id}
                    className="bg-white rounded-xl shadow-md border border-gray-200 p-4 hover:shadow-lg transition-all duration-200"
                  >
                    {/* Part Image */}
                    <div className="relative h-40 w-full bg-gray-100 rounded-lg mb-3 overflow-hidden">
                      {part.images && part.images.length > 0 ? (
                        <img
                          src={part.images.find(img => img.isPrimary)?.url || part.images[0]?.url}
                          alt={part.partName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Wrench className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      {part.category && (
                        <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                          {part.category}
                        </span>
                      )}
                    </div>

                    {/* Part Info */}
                    <div className="mb-3">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">
                        {part.partName}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2">Part #: {part.partNumber}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-blue-600">
                          {formatCurrency(part.basePrice)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          stockAvailable > 0 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {stockAvailable > 0 ? `${stockAvailable} in stock` : 'Out of stock'}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Selector & Purchase */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-1">
                        <button
                          onClick={() => handleQuantityChange(part._id, -1)}
                          disabled={quantity <= 1}
                          className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="font-semibold text-gray-900 px-3">{quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(part._id, 1)}
                          disabled={quantity >= stockAvailable}
                          className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                        <span>Total:</span>
                        <span className="font-bold text-gray-900">{formatCurrency(totalPrice)}</span>
                      </div>

                      <button
                        onClick={() => handleBulkPurchase(part)}
                        disabled={stockAvailable <= 0}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Bulk Buy
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions - Enhanced */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-500" />
                Quick Actions
              </h2>
              <p className="text-sm text-gray-500 mt-1">Access frequently used features</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to="/vendor/marketplace"
              className="group flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-3 group-hover:scale-110 transition-transform shadow-lg">
                <ShoppingCart className="w-7 h-7 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-700">Browse Marketplace</span>
            </Link>
            <Link
              to="/vendor/cart"
              className="group flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-2xl hover:border-green-500 hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100 transition-all duration-300 hover:shadow-lg hover:scale-105 relative"
            >
              <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mb-3 group-hover:scale-110 transition-transform shadow-lg">
                <Package className="w-7 h-7 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-green-700">My Cart</span>
              {cartCount > 0 && (
                <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <button className="group flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-2xl hover:border-purple-500 hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100 transition-all duration-300 hover:shadow-lg hover:scale-105">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl mb-3 group-hover:scale-110 transition-transform shadow-lg">
                <Receipt className="w-7 h-7 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-purple-700">My Orders</span>
            </button>
            <button className="group flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-2xl hover:border-orange-500 hover:bg-gradient-to-br hover:from-orange-50 hover:to-orange-100 transition-all duration-300 hover:shadow-lg hover:scale-105">
              <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl mb-3 group-hover:scale-110 transition-transform shadow-lg">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-700">View Reports</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VendorDashboardEnhanced;
