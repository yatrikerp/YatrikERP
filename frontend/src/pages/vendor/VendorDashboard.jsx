import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import vendorApiService from '../../services/vendorApiService';
import { apiFetch } from '../../utils/api';
import {
  Building2,
  Wallet,
  FileText,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Package,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  RefreshCw,
  Plus,
  Upload
} from 'lucide-react';
import BulkProductsUpload from '../../components/vendor/BulkProductsUpload';
import './vendor.css';

const VendorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [poStats, setPoStats] = useState(null);
  const [poFilters, setPoFilters] = useState({
    status: '',
    search: '',
    page: 1,
    limit: 20
  });
  const [selectedPO, setSelectedPO] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [products, setProducts] = useState([]);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await vendorApiService.getDashboard();
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await vendorApiService.getProfile();
      if (response.success) {
        setProfile(response.data.vendor);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchPurchaseOrders = async (filters = {}) => {
    try {
      const queryParams = { ...poFilters, ...filters };
      setPoFilters(queryParams);
      
      const response = await vendorApiService.getPurchaseOrders(queryParams);
      if (response.success) {
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
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      });
      
      if (response.success) {
        fetchPurchaseOrders();
        fetchDashboardData(); // Refresh dashboard stats
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
      }
    } catch (error) {
      console.error('Error rejecting PO:', error);
      alert('Failed to reject purchase order. Please try again.');
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await vendorApiService.getInvoices();
      if (response.success) {
        setInvoices(response.data.invoices || []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await vendorApiService.getPayments();
      if (response.success) {
        setPayments(response.data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchPerformance = async () => {
    try {
      const response = await vendorApiService.getPerformance();
      if (response.success) {
        setPerformance(response.data);
      }
    } catch (error) {
      console.error('Error fetching performance:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await apiFetch('/api/products/vendor/my-products');
      if (response.ok && response.data.success) {
        setProducts(response.data.data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'profile') {
      fetchProfile();
    } else if (activeTab === 'purchase-orders') {
      fetchPurchaseOrders();
    } else if (activeTab === 'invoices') {
      fetchInvoices();
    } else if (activeTab === 'payments') {
      fetchPayments();
    } else if (activeTab === 'performance') {
      fetchPerformance();
    } else if (activeTab === 'products') {
      fetchProducts();
    }
  }, [activeTab]);

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

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      expired: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${config.color}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  if (loading && !dashboardData) {
    return (
      <div className="vendor-dashboard-loading">
        <div className="loading-spinner"></div>
        <h3>Loading Vendor Dashboard...</h3>
      </div>
    );
  }

  const vendor = dashboardData?.vendor || {};
  const stats = dashboardData?.stats || {};

  return (
    <div className="vendor-dashboard">
      {/* Sidebar */}
      <div className="vendor-sidebar">
        <div className="sidebar-header">
          <Building2 className="sidebar-logo" />
          <h2>Vendor Portal</h2>
          <div className="company-name">{vendor.companyName || user?.companyName || 'Vendor'}</div>
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
            className={`nav-item ${activeTab === 'purchase-orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('purchase-orders')}
          >
            <Package className="nav-icon" />
            <span>Purchase Orders</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'invoices' ? 'active' : ''}`}
            onClick={() => setActiveTab('invoices')}
          >
            <Receipt className="nav-icon" />
            <span>Invoices</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            <DollarSign className="nav-icon" />
            <span>Payments</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            <TrendingUp className="nav-icon" />
            <span>Performance</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Package className="nav-icon" />
            <span>My Products</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <Settings className="nav-icon" />
            <span>Profile</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="vendor-main-content">
        {/* Header */}
        <div className="vendor-header">
          <div>
            <h1 className="page-title">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'purchase-orders' && 'Purchase Orders'}
              {activeTab === 'invoices' && 'Invoices'}
              {activeTab === 'payments' && 'Payments'}
              {activeTab === 'performance' && 'Performance & SLA'}
              {activeTab === 'products' && 'My Products'}
              {activeTab === 'profile' && 'Profile & Settings'}
            </h1>
            <p className="page-subtitle">Welcome back, {user?.name || vendor.companyName || 'Vendor'}!</p>
          </div>
          <button className="refresh-btn" onClick={fetchDashboardData}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-content">
            {/* Status Alert */}
            {vendor.status && (
              <div className={`status-alert ${vendor.status === 'active' || vendor.status === 'approved' ? 'success' : 'warning'}`}>
                <div className="flex items-center gap-2">
                  {vendor.status === 'active' || vendor.status === 'approved' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                  <div>
                    <strong>Account Status:</strong> {vendor.status}
                    {vendor.status !== 'active' && vendor.status !== 'approved' && (
                      <span className="ml-2">- Pending admin approval</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* KPI Cards */}
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon wallet">
                  <Wallet className="w-6 h-6" />
                </div>
                <div className="kpi-content">
                  <h3>{formatCurrency(vendor.walletBalance || 0)}</h3>
                  <p>Wallet Balance</p>
                  {vendor.escrowBalance > 0 && (
                    <span className="kpi-subtext">Escrow: {formatCurrency(vendor.escrowBalance)}</span>
                  )}
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon orders">
                  <Package className="w-6 h-6" />
                </div>
                <div className="kpi-content">
                  <h3>{stats.pendingPOs || 0}</h3>
                  <p>Pending POs</p>
                  <span className="kpi-subtext">{stats.acceptedPOs || 0} accepted, {stats.inProgressPOs || 0} in progress</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon invoices">
                  <Receipt className="w-6 h-6" />
                </div>
                <div className="kpi-content">
                  <h3>{stats.pendingInvoices || 0}</h3>
                  <p>Pending Invoices</p>
                  <span className="kpi-subtext">{stats.approvedInvoices || 0} approved</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon revenue">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="kpi-content">
                  <h3>{formatCurrency(stats.totalRevenue || 0)}</h3>
                  <p>Total Revenue</p>
                  <span className="kpi-subtext">{formatCurrency(stats.pendingPayments || 0)} pending</span>
                </div>
              </div>
            </div>

            {/* Performance Scores */}
            <div className="scores-section">
              <h2 className="section-title">Performance Scores</h2>
              <div className="scores-grid">
                <div className="score-card">
                  <div className="score-header">
                    <span>Trust Score</span>
                    <span className="score-value">{vendor.trustScore || 0}/100</span>
                  </div>
                  <div className="score-bar">
                    <div className="score-fill" style={{ width: `${vendor.trustScore || 0}%` }}></div>
                  </div>
                </div>
                <div className="score-card">
                  <div className="score-header">
                    <span>Compliance Score</span>
                    <span className="score-value">{vendor.complianceScore || 0}/100</span>
                  </div>
                  <div className="score-bar">
                    <div className="score-fill" style={{ width: `${vendor.complianceScore || 0}%` }}></div>
                  </div>
                </div>
                <div className="score-card">
                  <div className="score-header">
                    <span>Delivery Reliability</span>
                    <span className="score-value">{vendor.deliveryReliabilityScore || 0}/100</span>
                  </div>
                  <div className="score-bar">
                    <div className="score-fill" style={{ width: `${vendor.deliveryReliabilityScore || 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Orders Tab - Flipkart Style */}
        {activeTab === 'purchase-orders' && (
          <div className="tab-content vendor-po-grid">
            {/* Top Filter Bar */}
            <div className="po-filters">
              <input
                type="text"
                placeholder="Search PO / Part name / Part number..."
                className="po-search-input"
                value={poFilters.search}
                onChange={(e) => fetchPurchaseOrders({ search: e.target.value, page: 1 })}
              />
              <select
                className="po-filter-select"
                value={poFilters.status}
                onChange={(e) => fetchPurchaseOrders({ status: e.target.value, page: 1 })}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="in_progress">In Progress</option>
                <option value="partially_delivered">Partially Delivered</option>
                <option value="delivered">Delivered</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {purchaseOrders.length === 0 ? (
              <div className="empty-state">
                <Package className="w-12 h-12 text-gray-400" />
                <h3>No Purchase Orders</h3>
                <p>Purchase orders will appear here when they are issued to you.</p>
              </div>
            ) : (
              <div className="po-layout">
                {/* Left: Summary Panel */}
                {poStats && (
                  <div className="po-summary-panel">
                    <h3>Summary</h3>
                    <div className="po-summary-row">
                      <span>Total POs</span>
                      <strong>{poStats.total || 0}</strong>
                    </div>
                    <div className="po-summary-row">
                      <span>Pending</span>
                      <strong>{poStats.pending || 0}</strong>
                    </div>
                    <div className="po-summary-row">
                      <span>Accepted</span>
                      <strong>{poStats.accepted || 0}</strong>
                    </div>
                    <div className="po-summary-row">
                      <span>In Progress</span>
                      <strong>{poStats.in_progress || 0}</strong>
                    </div>
                    <div className="po-summary-row">
                      <span>Delivered</span>
                      <strong>{poStats.delivered || 0}</strong>
                    </div>
                    <div className="po-summary-row total">
                      <span>Total Value</span>
                      <strong>{formatCurrency(poStats.totalAmount || 0)}</strong>
                    </div>
                  </div>
                )}

                {/* Center: Product-Style Cards Grid */}
                <div className="po-cards-grid">
                  {purchaseOrders.map((po) => (
                    <div key={po._id} className="po-card">
                      <div className="po-card-header">
                        <span className="po-number">{po.poNumber}</span>
                        {getStatusBadge(po.status)}
                      </div>

                      {/* Items Grid - Show first few items like product tiles */}
                      <div className="po-items-grid">
                        {po.items?.slice(0, 4).map((item, idx) => (
                          <div key={idx} className="po-item-tile">
                            <div className="po-item-image">
                              {item.image ? (
                                <img src={item.image} alt={item.partName} />
                              ) : (
                                <Package className="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                            <div className="po-item-info">
                              <div className="po-item-name" title={item.partName}>
                                {item.partName?.length > 20 
                                  ? item.partName.substring(0, 20) + '...' 
                                  : item.partName}
                              </div>
                              <div className="po-item-meta">
                                <span>{item.partNumber}</span>
                                <span>Qty: {item.quantity} {item.unit || 'units'}</span>
                              </div>
                              <div className="po-item-price">
                                {formatCurrency(item.unitPrice)} / {item.unit || 'unit'}
                              </div>
                            </div>
                          </div>
                        ))}
                        {po.items?.length > 4 && (
                          <div className="po-item-more">
                            +{po.items.length - 4} more items
                          </div>
                        )}
                      </div>

                      <div className="po-card-footer">
                        <div className="po-amount">
                          <span>Total Amount</span>
                          <strong>{formatCurrency(po.totalAmount)}</strong>
                        </div>
                        <div className="po-meta">
                          <span>
                            {po.orderDate
                              ? new Date(po.orderDate).toLocaleDateString()
                              : 'N/A'}
                          </span>
                          {po.depotName && <span>Depot: {po.depotName}</span>}
                        </div>
                        {po.expectedDeliveryDate && (
                          <div className="po-delivery-date">
                            Expected: {new Date(po.expectedDeliveryDate).toLocaleDateString()}
                          </div>
                        )}
                        <div className="po-actions">
                          <button
                            className="action-btn primary"
                            onClick={() => setSelectedPO(po)}
                          >
                            View Details
                          </button>
                          {po.status === 'pending' && (
                            <>
                              <button
                                className="action-btn success"
                                onClick={() => handleAcceptPO(po._id)}
                              >
                                Accept
                              </button>
                              <button
                                className="action-btn danger"
                                onClick={() => handleRejectPO(po._id)}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {po.status === 'accepted' && (
                            <button
                              className="action-btn"
                              onClick={() => {
                                const tracking = prompt('Enter tracking number (optional):');
                                if (tracking !== null) {
                                  vendorApiService.updateDeliveryStatus(po._id, {
                                    trackingNumber: tracking,
                                    deliveryStatus: 'in_transit'
                                  }).then(() => fetchPurchaseOrders());
                                }
                              }}
                            >
                              Update Delivery
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PO Details Modal */}
            {selectedPO && (
              <div className="po-modal-overlay" onClick={() => setSelectedPO(null)}>
                <div className="po-modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="po-modal-header">
                    <h2>Purchase Order Details - {selectedPO.poNumber}</h2>
                    <button className="close-btn" onClick={() => setSelectedPO(null)}>×</button>
                  </div>
                  <div className="po-modal-body">
                    <div className="po-details-section">
                      <h3>Order Information</h3>
                      <div className="details-grid">
                        <div><strong>PO Number:</strong> {selectedPO.poNumber}</div>
                        <div><strong>Order Date:</strong> {new Date(selectedPO.orderDate).toLocaleDateString()}</div>
                        <div><strong>Status:</strong> {getStatusBadge(selectedPO.status)}</div>
                        {selectedPO.expectedDeliveryDate && (
                          <div><strong>Expected Delivery:</strong> {new Date(selectedPO.expectedDeliveryDate).toLocaleDateString()}</div>
                        )}
                        {selectedPO.depotName && (
                          <div><strong>Delivery Depot:</strong> {selectedPO.depotName}</div>
                        )}
                      </div>
                    </div>

                    <div className="po-details-section">
                      <h3>Items ({selectedPO.items?.length || 0})</h3>
                      <div className="po-items-list">
                        {selectedPO.items?.map((item, idx) => (
                          <div key={idx} className="po-item-detail">
                            <div className="po-item-detail-image">
                              {item.image ? (
                                <img src={item.image} alt={item.partName} />
                              ) : (
                                <Package className="w-8 h-8 text-gray-400" />
                              )}
                            </div>
                            <div className="po-item-detail-info">
                              <h4>{item.partName}</h4>
                              <p>Part Number: {item.partNumber}</p>
                              <p>Category: {item.category}</p>
                              <p>Quantity: {item.quantity} {item.unit || 'units'}</p>
                              <p>Unit Price: {formatCurrency(item.unitPrice)}</p>
                              <p><strong>Total: {formatCurrency(item.totalPrice)}</strong></p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="po-details-section">
                      <h3>Financial Summary</h3>
                      <div className="financial-summary">
                        <div className="financial-row">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(selectedPO.subtotal)}</span>
                        </div>
                        {selectedPO.tax?.total > 0 && (
                          <div className="financial-row">
                            <span>Tax (GST):</span>
                            <span>{formatCurrency(selectedPO.tax.total)}</span>
                          </div>
                        )}
                        {selectedPO.discount > 0 && (
                          <div className="financial-row">
                            <span>Discount:</span>
                            <span>-{formatCurrency(selectedPO.discount)}</span>
                          </div>
                        )}
                        {selectedPO.shippingCharges > 0 && (
                          <div className="financial-row">
                            <span>Shipping:</span>
                            <span>{formatCurrency(selectedPO.shippingCharges)}</span>
                          </div>
                        )}
                        <div className="financial-row total">
                          <span><strong>Total Amount:</strong></span>
                          <span><strong>{formatCurrency(selectedPO.totalAmount)}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="tab-content">
            {invoices.length === 0 ? (
              <div className="empty-state">
                <Receipt className="w-12 h-12 text-gray-400" />
                <h3>No Invoices</h3>
                <p>Invoices will appear here when they are generated.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice Number</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice._id}>
                        <td>{invoice.invoiceNumber}</td>
                        <td>{new Date(invoice.date).toLocaleDateString()}</td>
                        <td>{formatCurrency(invoice.amount)}</td>
                        <td>{getStatusBadge(invoice.status)}</td>
                        <td>
                          <button className="action-btn">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && payments && (
          <div className="tab-content">
            <div className="payment-summary">
              <div className="summary-card">
                <h3>Wallet Balance</h3>
                <p className="amount">{formatCurrency(payments.walletBalance || 0)}</p>
              </div>
              <div className="summary-card">
                <h3>Escrow Balance</h3>
                <p className="amount">{formatCurrency(payments.escrowBalance || 0)}</p>
              </div>
            </div>
            {payments.payments && payments.payments.length > 0 ? (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Payment ID</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.payments.map((payment) => (
                      <tr key={payment._id}>
                        <td>{payment.paymentId}</td>
                        <td>{new Date(payment.date).toLocaleDateString()}</td>
                        <td>{formatCurrency(payment.amount)}</td>
                        <td>{getStatusBadge(payment.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <DollarSign className="w-12 h-12 text-gray-400" />
                <h3>No Payment History</h3>
                <p>Payment history will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && performance && (
          <div className="tab-content">
            <div className="performance-section">
              <h2 className="section-title">Performance Metrics</h2>
              <div className="scores-grid">
                <div className="score-card">
                  <div className="score-header">
                    <span>Trust Score</span>
                    <span className="score-value">{performance.trustScore || 0}/100</span>
                  </div>
                  <div className="score-bar">
                    <div className="score-fill" style={{ width: `${performance.trustScore || 0}%` }}></div>
                  </div>
                </div>
                <div className="score-card">
                  <div className="score-header">
                    <span>Compliance Score</span>
                    <span className="score-value">{performance.complianceScore || 0}/100</span>
                  </div>
                  <div className="score-bar">
                    <div className="score-fill" style={{ width: `${performance.complianceScore || 0}%` }}></div>
                  </div>
                </div>
                <div className="score-card">
                  <div className="score-header">
                    <span>Delivery Reliability</span>
                    <span className="score-value">{performance.deliveryReliabilityScore || 0}/100</span>
                  </div>
                  <div className="score-bar">
                    <div className="score-fill" style={{ width: `${performance.deliveryReliabilityScore || 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {performance.contractDetails && (
              <div className="contract-section">
                <h2 className="section-title">Contract Details</h2>
                <div className="contract-info">
                  <div className="info-item">
                    <span className="label">Contract Number:</span>
                    <span className="value">{performance.contractDetails.contractNumber || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Validity:</span>
                    <span className="value">{performance.contractDetails.validity || 'N/A'}</span>
                  </div>
                  {performance.contractDetails.slaTerms && (
                    <div className="info-item">
                      <span className="label">SLA Terms:</span>
                      <span className="value">
                        Delivery Timeline: {performance.contractDetails.slaTerms.deliveryTimeline || 'N/A'} hours
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="tab-content">
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title">My Products</h2>
              <button
                onClick={() => setShowBulkUpload(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Upload className="w-4 h-4" />
                Bulk Add Products
              </button>
            </div>

            {products.length === 0 ? (
              <div className="empty-state">
                <Package className="w-12 h-12 text-gray-400" />
                <h3>No Products Yet</h3>
                <p>Start by adding your first product or use bulk upload to add multiple products at once.</p>
                <button
                  onClick={() => setShowBulkUpload(true)}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Products
                </button>
              </div>
            ) : (
              <div className="products-grid">
                {products.map((product) => (
                  <div key={product._id} className="product-card">
                    <div className="product-header">
                      <h3 className="product-name">{product.productName}</h3>
                      {getStatusBadge(product.status)}
                    </div>
                    <div className="product-code">Code: {product.productCode}</div>
                    {product.description && (
                      <p className="product-description">{product.description.substring(0, 100)}...</p>
                    )}
                    <div className="product-details">
                      <div className="detail-item">
                        <span className="label">Category:</span>
                        <span className="value">{product.category?.replace(/_/g, ' ').toUpperCase() || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Price:</span>
                        <span className="value">{formatCurrency(product.finalPrice || product.basePrice)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Stock:</span>
                        <span className="value">{product.stock?.quantity || 0} {product.stock?.unit || 'units'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showBulkUpload && (
              <BulkProductsUpload
                onSuccess={() => {
                  fetchProducts();
                  setShowBulkUpload(false);
                }}
                onClose={() => setShowBulkUpload(false)}
              />
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="tab-content">
            {profile ? (
              <div className="profile-section">
                <h2 className="section-title">Company Information</h2>
                <div className="profile-grid">
                  <div className="profile-item">
                    <label>Company Name</label>
                    <p>{profile.companyName || 'N/A'}</p>
                  </div>
                  <div className="profile-item">
                    <label>Company Type</label>
                    <p>{profile.companyType || 'N/A'}</p>
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
                    <label>PAN Number</label>
                    <p>{profile.panNumber || 'N/A'}</p>
                  </div>
                  <div className="profile-item">
                    <label>GST Number</label>
                    <p>{profile.gstNumber || 'N/A'}</p>
                  </div>
                </div>

                {profile.bankDetails && (
                  <>
                    <h2 className="section-title">Banking Details</h2>
                    <div className="profile-grid">
                      <div className="profile-item">
                        <label>Account Number</label>
                        <p>{profile.bankDetails.accountNumber ? '****' + profile.bankDetails.accountNumber.slice(-4) : 'N/A'}</p>
                      </div>
                      <div className="profile-item">
                        <label>IFSC Code</label>
                        <p>{profile.bankDetails.ifscCode || 'N/A'}</p>
                      </div>
                      <div className="profile-item">
                        <label>Bank Name</label>
                        <p>{profile.bankDetails.bankName || 'N/A'}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <Settings className="w-12 h-12 text-gray-400" />
                <h3>Loading Profile...</h3>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;
