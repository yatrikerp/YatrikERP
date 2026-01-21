import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import vendorApiService from '../../services/vendorApiService';
import {
  Building2, Wallet, FileText, TrendingUp, CheckCircle, Clock, AlertCircle,
  DollarSign, Package, Receipt, BarChart3, Settings, LogOut, RefreshCw,
  Search, Filter, Download, Eye, Check, X, Truck, ShoppingCart, Star,
  Activity, Users, Calendar, Bell, Menu, ChevronRight, Plus,
  ArrowRight, MessageCircle, CreditCard, FileDown, ExternalLink
} from 'lucide-react';
import './vendor-ultra.css';

const VendorDashboardUltra = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [poStats, setPoStats] = useState(null);
  const [poFilters, setPoFilters] = useState({ status: '', search: '', page: 1, limit: 20 });
  const [selectedPO, setSelectedPO] = useState(null);
  const [showPOModal, setShowPOModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Add delay to ensure token is stored and auth state is ready
    if (user && user.role === 'vendor') {
      const timer = setTimeout(() => {
        fetchDashboardData();
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [user]);

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

  const fetchPurchaseOrders = async (filters = {}) => {
    try {
      const queryParams = { ...poFilters, ...filters };
      setPoFilters(queryParams);
      const response = await vendorApiService.getPurchaseOrders(queryParams);
      if (response && response.success) {
        setPurchaseOrders(response.data.purchaseOrders || []);
        setPoStats(response.data.stats || null);
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    }
  };

  const handleAcceptPO = async (poId) => {
    try {
      const response = await vendorApiService.acceptPurchaseOrder(poId, {
        message: 'Purchase order accepted',
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
      if (response.success) {
        fetchPurchaseOrders();
        fetchDashboardData();
        setShowPOModal(false);
      }
    } catch (error) {
      console.error('Error accepting PO:', error);
      alert('Failed to accept purchase order. Please try again.');
    }
  };

  const handleRejectPO = async (poId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    try {
      const response = await vendorApiService.rejectPurchaseOrder(poId, reason);
      if (response.success) {
        fetchPurchaseOrders();
        fetchDashboardData();
        setShowPOModal(false);
      }
    } catch (error) {
      console.error('Error rejecting PO:', error);
      alert('Failed to reject purchase order. Please try again.');
    }
  };

  useEffect(() => {
    if (activeTab === 'purchase-orders') {
      fetchPurchaseOrders();
    }
  }, [activeTab]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#F59E0B',
      accepted: '#10B981',
      rejected: '#EF4444',
      in_progress: '#3B82F6',
      delivered: '#8B5CF6',
      completed: '#10B981',
      cancelled: '#6B7280'
    };
    return colors[status] || '#6B7280';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading && !dashboardData) {
    return (
      <div className="vendor-loading">
        <div className="vendor-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const vendor = dashboardData?.vendor || {};

  return (
    <div className="vendor-dashboard-landing">
      {/* Top Navbar */}
      <nav className="vendor-nav">
        <div className="vendor-nav-content">
          <div className="vendor-nav-left">
            <div className="vendor-logo">
              <Building2 className="w-6 h-6" />
              <span>YATRIK ERP</span>
            </div>
            <div className="vendor-nav-menu">
              <button 
                className={`vendor-nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                Dashboard
              </button>
              <button 
                className={`vendor-nav-link ${activeTab === 'purchase-orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('purchase-orders')}
              >
                Orders
                {poStats?.pending > 0 && <span className="vendor-nav-badge">{poStats.pending}</span>}
              </button>
              <button 
                className={`vendor-nav-link ${activeTab === 'invoices' ? 'active' : ''}`}
                onClick={() => setActiveTab('invoices')}
              >
                Invoices
              </button>
              <button 
                className={`vendor-nav-link ${activeTab === 'payments' ? 'active' : ''}`}
                onClick={() => setActiveTab('payments')}
              >
                Payments
              </button>
              <button 
                className={`vendor-nav-link ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                Settings
              </button>
            </div>
          </div>
          <div className="vendor-nav-right">
            <button className="vendor-notification-btn">
              <Bell className="w-5 h-5" />
              <span className="vendor-notification-badge">3</span>
            </button>
            <div className="vendor-user-card">
              <div className="vendor-user-avatar">
                {user?.companyName?.[0] || user?.name?.[0] || 'V'}
              </div>
              <div className="vendor-user-details">
                <span className="vendor-user-name">{user?.companyName || user?.name || 'Vendor'}</span>
                <span className="vendor-user-role">Vendor Account</span>
              </div>
            </div>
            <button 
              className="vendor-logout-btn"
              onClick={async () => { await logout(); navigate('/login'); }}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="vendor-main-content">
        {activeTab === 'dashboard' && (
          <div className="vendor-dashboard-tab">
            {/* Hero Section - Split into Two Zones */}
            <div className="vendor-hero-split">
              <div className="vendor-hero-left">
                <div className="vendor-welcome-card">
                  <h1 className="vendor-greeting">{getGreeting()} 👋</h1>
                  <h2 className="vendor-company-name">{user?.companyName || user?.name || 'Vendor'}</h2>
                  <p className="vendor-welcome-text">Track orders, invoices & payments in one place.</p>
                </div>
              </div>
              <div className="vendor-hero-right">
                <div className="vendor-quick-actions-grid">
                  <button className="vendor-action-card" onClick={() => setActiveTab('invoices')}>
                    <Plus className="w-6 h-6" />
                    <span>Create Invoice</span>
                  </button>
                  <button className="vendor-action-card" onClick={() => setActiveTab('purchase-orders')}>
                    <Package className="w-6 h-6" />
                    <span>View Purchase Orders</span>
                  </button>
                  <button className="vendor-action-card" onClick={() => setActiveTab('payments')}>
                    <CreditCard className="w-6 h-6" />
                    <span>Payment Summary</span>
                  </button>
                  <button className="vendor-action-card">
                    <FileDown className="w-6 h-6" />
                    <span>Download Reports</span>
                  </button>
                </div>
              </div>
            </div>

            {/* KPI Strip */}
            <div className="vendor-kpi-strip">
              <div className="vendor-kpi-card">
                <DollarSign className="vendor-kpi-icon" />
                <div className="vendor-kpi-content">
                  <p className="vendor-kpi-value">{formatCurrency(stats.totalRevenue || 0)}</p>
                  <p className="vendor-kpi-label">Total Revenue</p>
                </div>
              </div>
              <div className="vendor-kpi-card">
                <ShoppingCart className="vendor-kpi-icon" />
                <div className="vendor-kpi-content">
                  <p className="vendor-kpi-value">{stats.totalOrders || 0}</p>
                  <p className="vendor-kpi-label">Total Orders</p>
                </div>
              </div>
              <div className="vendor-kpi-card">
                <Clock className="vendor-kpi-icon" />
                <div className="vendor-kpi-content">
                  <p className="vendor-kpi-value">{stats.pendingOrders || 0}</p>
                  <p className="vendor-kpi-label">Pending Orders</p>
                </div>
              </div>
              <div className="vendor-kpi-card">
                <CheckCircle className="vendor-kpi-icon" />
                <div className="vendor-kpi-content">
                  <p className="vendor-kpi-value">{stats.completedOrders || 0}</p>
                  <p className="vendor-kpi-label">Completed Orders</p>
                </div>
              </div>
            </div>

            {/* Main Content Grid - Two Columns */}
            <div className="vendor-content-grid">
              {/* Left Column (70%) */}
              <div className="vendor-content-left">
                {/* Recent Purchase Orders */}
                <div className="vendor-section-card">
                  <div className="vendor-section-header">
                    <h2>Recent Purchase Orders</h2>
                    <div className="vendor-section-actions">
                      <div className="vendor-filter-tabs">
                        <button className="vendor-filter-tab active">All</button>
                        <button className="vendor-filter-tab">Pending</button>
                        <button className="vendor-filter-tab">Completed</button>
                      </div>
                      <button 
                        className="vendor-view-all-btn"
                        onClick={() => setActiveTab('purchase-orders')}
                      >
                        View All <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="vendor-table-container">
                    <table className="vendor-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseOrders.slice(0, 5).map((po) => (
                          <tr key={po._id}>
                            <td className="vendor-table-order-id">{po.poNumber || 'PO-' + po._id.slice(-6)}</td>
                            <td>{formatDate(po.orderDate)}</td>
                            <td className="vendor-table-amount">{formatCurrency(po.totalAmount)}</td>
                            <td>
                              <span 
                                className="vendor-status-pill"
                                style={{ 
                                  backgroundColor: getStatusColor(po.status) + '20',
                                  color: getStatusColor(po.status)
                                }}
                              >
                                {po.status?.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <button 
                                className="vendor-table-view-btn"
                                onClick={() => {
                                  setSelectedPO(po);
                                  setShowPOModal(true);
                                }}
                              >
                                View <ChevronRight className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {purchaseOrders.length === 0 && (
                          <tr>
                            <td colSpan="5" className="vendor-table-empty">
                              <Package className="w-8 h-8" />
                              <p>No purchase orders yet</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Invoices */}
                <div className="vendor-section-card">
                  <div className="vendor-section-header">
                    <h2>Recent Invoices</h2>
                    <button 
                      className="vendor-view-all-btn"
                      onClick={() => setActiveTab('invoices')}
                    >
                      View All <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="vendor-invoice-list">
                    {[1, 2, 3, 4, 5].map((item, idx) => (
                      <div key={idx} className="vendor-invoice-item">
                        <div className="vendor-invoice-info">
                          <span className="vendor-invoice-number">INV-{String(idx + 1).padStart(6, '0')}</span>
                          <span className="vendor-invoice-amount">{formatCurrency(50000 + idx * 10000)}</span>
                        </div>
                        <div className="vendor-invoice-status">
                          <span className={`vendor-invoice-badge ${idx % 2 === 0 ? 'paid' : 'unpaid'}`}>
                            {idx % 2 === 0 ? 'Paid' : 'Unpaid'}
                          </span>
                          <button className="vendor-download-btn">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column (30%) */}
              <div className="vendor-content-right">
                {/* Smart Insights */}
                <div className="vendor-section-card">
                  <div className="vendor-section-header">
                    <h2>Smart Insights</h2>
                  </div>
                  <div className="vendor-insights-list">
                    <div className="vendor-insight-item">
                      <AlertCircle className="w-5 h-5" />
                      <div>
                        <p className="vendor-insight-text">{poStats?.pending || 0} orders pending approval</p>
                        <p className="vendor-insight-time">Requires attention</p>
                      </div>
                    </div>
                    <div className="vendor-insight-item">
                      <CheckCircle className="w-5 h-5" />
                      <div>
                        <p className="vendor-insight-text">Last payment received 2 days ago</p>
                        <p className="vendor-insight-time">{formatCurrency(50000)}</p>
                      </div>
                    </div>
                    <div className="vendor-insight-item">
                      <TrendingUp className="w-5 h-5" />
                      <div>
                        <p className="vendor-insight-text">{formatCurrency(12000)} expected this week</p>
                        <p className="vendor-insight-time">From pending orders</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="vendor-section-card">
                  <div className="vendor-section-header">
                    <h2>Quick Actions</h2>
                  </div>
                  <div className="vendor-quick-actions-vertical">
                    <button className="vendor-quick-action-btn">
                      <Plus className="w-5 h-5" />
                      <span>Create Invoice</span>
                    </button>
                    <button className="vendor-quick-action-btn">
                      <CreditCard className="w-5 h-5" />
                      <span>Update Bank Details</span>
                    </button>
                    <button className="vendor-quick-action-btn">
                      <MessageCircle className="w-5 h-5" />
                      <span>Contact Support</span>
                    </button>
                    <button className="vendor-quick-action-btn">
                      <BarChart3 className="w-5 h-5" />
                      <span>View Reports</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Orders Tab */}
        {activeTab === 'purchase-orders' && (
          <div className="vendor-po-tab">
            <div className="vendor-page-header">
              <div>
                <h1 className="vendor-page-title">Purchase Orders</h1>
                <p className="vendor-page-subtitle">Manage and track all your purchase orders</p>
              </div>
              <div className="vendor-page-actions">
                <button className="vendor-btn-secondary">
                  <Filter className="w-5 h-5" />
                  Filter
                </button>
                <button className="vendor-btn-secondary">
                  <Download className="w-5 h-5" />
                  Export
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="vendor-search-section">
              <div className="vendor-search-box">
                <Search className="w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by PO number, part name, or part number..."
                  value={poFilters.search}
                  onChange={(e) => {
                    setPoFilters({ ...poFilters, search: e.target.value });
                    fetchPurchaseOrders({ search: e.target.value });
                  }}
                />
              </div>
              <div className="vendor-status-filters">
                {['all', 'pending', 'accepted', 'in_progress', 'delivered', 'completed'].map((status) => (
                  <button
                    key={status}
                    className={`vendor-status-filter ${poFilters.status === status || (status === 'all' && !poFilters.status) ? 'active' : ''}`}
                    onClick={() => {
                      const newStatus = status === 'all' ? '' : status;
                      setPoFilters({ ...poFilters, status: newStatus });
                      fetchPurchaseOrders({ status: newStatus });
                    }}
                  >
                    {status.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Purchase Orders Grid */}
            <div className="vendor-po-grid">
              {purchaseOrders.map((po) => (
                <div 
                  key={po._id} 
                  className="vendor-po-card"
                  onClick={() => {
                    setSelectedPO(po);
                    setShowPOModal(true);
                  }}
                >
                  <div className="vendor-po-card-header">
                    <div className="vendor-po-number">{po.poNumber || 'PO-' + po._id.slice(-6)}</div>
                    <div 
                      className="vendor-po-status-badge"
                      style={{ 
                        backgroundColor: getStatusColor(po.status) + '20',
                        color: getStatusColor(po.status)
                      }}
                    >
                      {po.status?.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                  <div className="vendor-po-card-body">
                    <div className="vendor-po-info">
                      <div className="vendor-po-info-item">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(po.orderDate)}</span>
                      </div>
                      <div className="vendor-po-info-item">
                        <Package className="w-4 h-4" />
                        <span>{po.items?.length || 0} items</span>
                      </div>
                      <div className="vendor-po-info-item">
                        <Building2 className="w-4 h-4" />
                        <span>{po.depotName || 'Depot'}</span>
                      </div>
                    </div>
                    <div className="vendor-po-amount-section">
                      <span className="vendor-po-amount-label">Total Amount</span>
                      <span className="vendor-po-amount-value">{formatCurrency(po.totalAmount)}</span>
                    </div>
                  </div>
                  {po.status === 'pending' && (
                    <div className="vendor-po-card-actions">
                      <button
                        className="vendor-po-action-btn accept"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcceptPO(po._id);
                        }}
                      >
                        <Check className="w-4 h-4" />
                        Accept
                      </button>
                      <button
                        className="vendor-po-action-btn reject"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRejectPO(po._id);
                        }}
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {purchaseOrders.length === 0 && (
                <div className="vendor-empty-state">
                  <ShoppingCart className="w-16 h-16" />
                  <h3>No Purchase Orders Found</h3>
                  <p>You don't have any purchase orders matching your filters.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Other tabs placeholder */}
        {activeTab !== 'dashboard' && activeTab !== 'purchase-orders' && (
          <div className="vendor-coming-soon">
            <h2>Coming Soon</h2>
            <p>This section is under development</p>
          </div>
        )}
      </main>

      {/* Floating Chat Button */}
      <button className="vendor-floating-chat">
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Purchase Order Modal */}
      {showPOModal && selectedPO && (
        <div className="vendor-modal-overlay" onClick={() => setShowPOModal(false)}>
          <div className="vendor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vendor-modal-header">
              <h2>{selectedPO.poNumber || 'PO-' + selectedPO._id.slice(-6)}</h2>
              <button className="vendor-modal-close" onClick={() => setShowPOModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="vendor-modal-body">
              <div className="vendor-po-details-grid">
                <div className="vendor-po-detail-item">
                  <span className="vendor-po-detail-label">Status</span>
                  <span 
                    className="vendor-po-detail-value"
                    style={{ color: getStatusColor(selectedPO.status) }}
                  >
                    {selectedPO.status?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="vendor-po-detail-item">
                  <span className="vendor-po-detail-label">Order Date</span>
                  <span className="vendor-po-detail-value">{formatDate(selectedPO.orderDate)}</span>
                </div>
                <div className="vendor-po-detail-item">
                  <span className="vendor-po-detail-label">Depot</span>
                  <span className="vendor-po-detail-value">{selectedPO.depotName || 'N/A'}</span>
                </div>
                <div className="vendor-po-detail-item">
                  <span className="vendor-po-detail-label">Total Amount</span>
                  <span className="vendor-po-detail-value">{formatCurrency(selectedPO.totalAmount)}</span>
                </div>
              </div>
              <div className="vendor-po-items-section">
                <h3>Items</h3>
                {selectedPO.items?.map((item, idx) => (
                  <div key={idx} className="vendor-po-item-row">
                    <div className="vendor-po-item-info">
                      <h4>{item.partName || 'Part ' + (idx + 1)}</h4>
                      <p>{item.partNumber || 'N/A'}</p>
                    </div>
                    <div className="vendor-po-item-qty">
                      <span>Qty: {item.quantity}</span>
                      <span>{formatCurrency(item.unitPrice)} each</span>
                    </div>
                    <div className="vendor-po-item-total">
                      {formatCurrency(item.totalPrice || item.quantity * item.unitPrice)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {selectedPO.status === 'pending' && (
              <div className="vendor-modal-footer">
                <button
                  className="vendor-modal-btn reject"
                  onClick={() => handleRejectPO(selectedPO._id)}
                >
                  <X className="w-5 h-5" />
                  Reject
                </button>
                <button
                  className="vendor-modal-btn accept"
                  onClick={() => handleAcceptPO(selectedPO._id)}
                >
                  <Check className="w-5 h-5" />
                  Accept Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboardUltra;
