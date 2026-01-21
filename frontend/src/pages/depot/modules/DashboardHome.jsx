import React, { useState, useEffect } from 'react';
import {
  Bus,
  Calendar,
  Users,
  Fuel,
  Wrench,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  Package,
  ShoppingCart,
  CreditCard,
  Gavel,
  AlertTriangle
} from 'lucide-react';
import { apiFetch } from '../../../utils/api';

const DashboardHome = () => {
  const [stats, setStats] = useState({
    totalBuses: 0,
    activeTrips: 0,
    availableDrivers: 0,
    availableConductors: 0,
    fuelToday: 0,
    pendingMaintenance: 0,
    complaints: 0,
    // Vendor & Product Stats
    vendorProducts: 0,
    pendingPurchaseOrders: 0,
    totalSpent: 0,
    pendingPayments: 0,
    activeAuctions: 0,
    lowStockItems: 0,
    // Inventory Stats
    totalInventoryParts: 0,
    inventoryLowStock: 0,
    inventoryOutOfStock: 0,
    inventoryTotalValue: 0
  });
  const [activeTrips, setActiveTrips] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
    // Real-time refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch main dashboard data
      const res = await apiFetch('/api/depot/dashboard', { suppressError: true });
      console.log('📊 Dashboard API Response:', res);
      
      // Fetch vendor/product related data (all with suppressError to prevent blocking)
      const [productsRes, poRes, paymentsRes, auctionsRes, inventoryRes] = await Promise.all([
        apiFetch('/api/products?status=active&isActive=true&limit=100', { suppressError: true }),
        apiFetch('/api/products/purchase-orders/all', { suppressError: true }),
        apiFetch('/api/depot/payments', { suppressError: true }),
        apiFetch('/api/depot/auctions', { suppressError: true }),
        apiFetch('/api/depot/inventory', { suppressError: true })
      ]);
      
      // Always try to set stats, even if main API fails
      if (res.ok && res.data) {
        const data = res.data;
        console.log('📊 Dashboard Data:', data);
        console.log('📊 Stats:', data.stats);
        
        // Calculate vendor/product stats
        const products = productsRes.ok ? (productsRes.data?.data?.products || productsRes.data?.products || []) : [];
        const purchaseOrders = poRes.ok ? (poRes.data?.data?.purchaseOrders || poRes.data?.purchaseOrders || []) : [];
        const payments = paymentsRes.ok ? (paymentsRes.data?.data?.payments || paymentsRes.data?.payments || []) : [];
        const auctions = auctionsRes.ok ? (auctionsRes.data?.data?.auctions || auctionsRes.data?.auctions || []) : [];
        const inventory = inventoryRes.ok ? (inventoryRes.data?.data?.parts || inventoryRes.data?.parts || []) : [];
        
        const pendingPOs = purchaseOrders.filter(po => 
          po.status === 'pending' || po.status === 'pending_approval' || po.adminApprovalStatus === 'pending'
        );
        const totalSpent = payments
          .filter(p => p.status === 'paid' || p.invoiceStatus === 'paid')
          .reduce((sum, p) => sum + (p.amount || p.totalAmount || 0), 0);
        const pendingPayments = payments
          .filter(p => p.status === 'pending' || p.dueAmount > 0)
          .reduce((sum, p) => sum + (p.dueAmount || 0), 0);
        const activeAuctions = auctions.filter(a => 
          a.status === 'active' || a.status === 'open'
        );
        
        // Calculate inventory stats
        const totalParts = inventory.length;
        const lowStockCount = inventory.filter(item => 
          (item.currentStock || 0) <= (item.minStock || 10) && (item.currentStock || 0) > 0
        ).length;
        const outOfStockCount = inventory.filter(item => 
          (item.currentStock || 0) === 0
        ).length;
        const totalInventoryValue = inventory.reduce((sum, item) => 
          sum + ((item.currentStock || 0) * (item.basePrice || 0)), 0
        );
        
        setStats({
          totalBuses: data.stats?.totalBuses || 0,
          activeTrips: data.stats?.activeTrips || 0,
          availableDrivers: data.stats?.availableDrivers || 0,
          availableConductors: data.stats?.availableConductors || 0,
          fuelToday: data.stats?.fuelToday || 0,
          pendingMaintenance: data.stats?.pendingMaintenance || 0,
          complaints: data.stats?.complaints || 0,
          // Vendor & Product Stats
          vendorProducts: products.length,
          pendingPurchaseOrders: pendingPOs.length,
          totalSpent: totalSpent,
          pendingPayments: pendingPayments,
          activeAuctions: activeAuctions.length,
          lowStockItems: lowStockCount + products.filter(p => (p.stock?.quantity || 0) < 10).length,
          // Inventory Stats
          totalInventoryParts: totalParts,
          inventoryLowStock: lowStockCount,
          inventoryOutOfStock: outOfStockCount,
          inventoryTotalValue: totalInventoryValue
        });
        
        const trips = data.recentTrips || [];
        const alertsData = data.alerts || [];
        setActiveTrips(Array.isArray(trips) ? trips : []);
        setAlerts(Array.isArray(alertsData) ? alertsData : []);
        
        // Set recent purchases and payments
        setRecentPurchases(purchaseOrders.slice(0, 5));
        setRecentPayments(payments.slice(0, 5));
      } else {
        console.warn('⚠️ Dashboard API response not OK:', res);
        // Try to fetch buses directly if dashboard endpoint fails
        try {
          const busesRes = await apiFetch('/api/depot/buses', { suppressError: true });
          if (busesRes.ok && busesRes.data) {
            const buses = busesRes.data?.buses || busesRes.data?.data?.buses || [];
            const totalBuses = buses.length;
            const activeBuses = buses.filter(b => b.status === 'active' || b.status === 'available').length;
            
            setStats({
              totalBuses: totalBuses,
              activeTrips: 0,
              availableDrivers: 0,
              availableConductors: 0,
              fuelToday: 0,
              pendingMaintenance: buses.filter(b => b.status === 'maintenance').length,
              complaints: 0,
              vendorProducts: 0,
              pendingPurchaseOrders: 0,
              totalSpent: 0,
              pendingPayments: 0,
              activeAuctions: 0,
              lowStockItems: 0,
              totalInventoryParts: 0,
              inventoryLowStock: 0,
              inventoryOutOfStock: 0,
              inventoryTotalValue: 0
            });
          } else {
            // Set defaults if all APIs fail
            setStats({
              totalBuses: 0,
              activeTrips: 0,
              availableDrivers: 0,
              availableConductors: 0,
              fuelToday: 0,
              pendingMaintenance: 0,
              complaints: 0,
              vendorProducts: 0,
              pendingPurchaseOrders: 0,
              totalSpent: 0,
              pendingPayments: 0,
              activeAuctions: 0,
              lowStockItems: 0,
              totalInventoryParts: 0,
              inventoryLowStock: 0,
              inventoryOutOfStock: 0,
              inventoryTotalValue: 0
            });
          }
        } catch (busError) {
          console.error('Error fetching buses:', busError);
          // Set defaults
          setStats({
            totalBuses: 0,
            activeTrips: 0,
            availableDrivers: 0,
            availableConductors: 0,
            fuelToday: 0,
            pendingMaintenance: 0,
            complaints: 0,
            vendorProducts: 0,
            pendingPurchaseOrders: 0,
            totalSpent: 0,
            pendingPayments: 0,
            activeAuctions: 0,
            lowStockItems: 0,
            totalInventoryParts: 0,
            inventoryLowStock: 0,
            inventoryOutOfStock: 0,
            inventoryTotalValue: 0
          });
        }
        setActiveTrips([]);
        setAlerts([]);
        setRecentPurchases([]);
        setRecentPayments([]);
      }
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Handle missing endpoint gracefully - set defaults
      setStats({
        totalBuses: 0,
        activeTrips: 0,
        availableDrivers: 0,
        availableConductors: 0,
        fuelToday: 0,
        pendingMaintenance: 0,
        complaints: 0,
        vendorProducts: 0,
        pendingPurchaseOrders: 0,
        totalSpent: 0,
        pendingPayments: 0,
        activeAuctions: 0,
        lowStockItems: 0
      });
      setActiveTrips([]);
      setAlerts([]);
      setRecentPurchases([]);
      setRecentPayments([]);
    } finally {
      setLoading(false);
      setLastUpdate(new Date());
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const kpiCards = [
    {
      title: 'Total Buses Today',
      value: stats.totalBuses,
      icon: Bus,
      color: '#3b82f6',
      bgColor: '#dbeafe'
    },
    {
      title: 'Active Trips',
      value: stats.activeTrips,
      icon: Calendar,
      color: '#10b981',
      bgColor: '#d1fae5'
    },
    {
      title: 'Available Crew',
      value: `${stats.availableDrivers || 0}D / ${stats.availableConductors || 0}C`,
      icon: Users,
      color: '#8b5cf6',
      bgColor: '#e9d5ff'
    },
    {
      title: 'Fuel Consumed Today',
      value: `${stats.fuelToday}L`,
      icon: Fuel,
      color: '#f59e0b',
      bgColor: '#fef3c7'
    },
    {
      title: 'Pending Maintenance',
      value: stats.pendingMaintenance,
      icon: Wrench,
      color: '#ef4444',
      bgColor: '#fee2e2'
    },
    {
      title: 'Passenger Complaints',
      value: stats.complaints,
      icon: MessageSquare,
      color: '#ec4899',
      bgColor: '#fce7f3'
    },
    // Vendor & Product KPIs
    {
      title: 'Vendor Products',
      value: stats.vendorProducts,
      icon: Package,
      color: '#06b6d4',
      bgColor: '#cffafe'
    },
    {
      title: 'Pending Purchase Orders',
      value: stats.pendingPurchaseOrders,
      icon: ShoppingCart,
      color: '#f97316',
      bgColor: '#ffedd5'
    },
    {
      title: 'Total Spent',
      value: formatCurrency(stats.totalSpent),
      icon: CreditCard,
      color: '#10b981',
      bgColor: '#d1fae5'
    },
    {
      title: 'Pending Payments',
      value: formatCurrency(stats.pendingPayments),
      icon: AlertTriangle,
      color: '#f59e0b',
      bgColor: '#fef3c7'
    },
    {
      title: 'Active Auctions',
      value: stats.activeAuctions,
      icon: Gavel,
      color: '#8b5cf6',
      bgColor: '#e9d5ff'
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems,
      icon: AlertCircle,
      color: '#ef4444',
      bgColor: '#fee2e2'
    }
  ];

  if (loading) {
    return (
      <div className="empty-state">
        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Real-time Indicator */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity className="icon-sm" style={{ color: '#10b981' }} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
            Real-time Data
          </span>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#10b981',
            animation: 'pulse 2s infinite'
          }} />
        </div>
        <span style={{ fontSize: '12px', color: '#64748b' }}>
          Last updated: {lastUpdate.toLocaleTimeString('en-IN')}
        </span>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div key={index} className="kpi-card">
              <div className="kpi-card-header">
                <div className="kpi-icon" style={{ background: kpi.bgColor, color: kpi.color }}>
                  <Icon className="icon-lg" />
                </div>
              </div>
              <div className="kpi-value">{kpi.value}</div>
              <div className="kpi-label">{kpi.title}</div>
            </div>
          );
        })}
      </div>

      {/* Active Trips & Alerts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Active Trips */}
        <div className="module-card">
          <div className="module-card-header">
            <h3 className="module-card-title">
              <Activity className="icon-md" />
              Active Trips
            </h3>
          </div>
          <div>
            {activeTrips.length > 0 ? (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Trip</th>
                      <th>Route</th>
                      <th>Status</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTrips.slice(0, 5).map((trip, index) => (
                      <tr key={trip._id || index}>
                        <td>{trip.tripNumber || `Trip ${index + 1}`}</td>
                        <td>{trip.routeId?.routeName || trip.route?.name || 'N/A'}</td>
                        <td>
                          <span className={`status-badge ${trip.status || 'pending'}`}>
                            {trip.status || 'pending'}
                          </span>
                        </td>
                        <td>
                          {trip.startTime 
                            ? new Date(trip.startTime).toLocaleTimeString('en-IN', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })
                            : 'N/A'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <Calendar className="empty-state-icon" />
                <p className="empty-state-text">No active trips</p>
              </div>
            )}
          </div>
        </div>

        {/* Live Alerts */}
        <div className="module-card">
          <div className="module-card-header">
            <h3 className="module-card-title">
              <AlertCircle className="icon-md" />
              Live Alerts
            </h3>
          </div>
          <div>
            {alerts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {alerts.slice(0, 5).map((alert, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '12px',
                      background: alert.severity === 'high' ? '#fee2e2' : '#fef3c7',
                      borderRadius: '8px',
                      borderLeft: `4px solid ${alert.severity === 'high' ? '#ef4444' : '#f59e0b'}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      {alert.severity === 'high' ? (
                        <AlertCircle className="icon-sm" style={{ color: '#ef4444' }} />
                      ) : (
                        <Clock className="icon-sm" style={{ color: '#f59e0b' }} />
                      )}
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{alert.title}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{alert.message}</p>
                    <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <CheckCircle className="empty-state-icon" style={{ color: '#10b981' }} />
                <p className="empty-state-text">All systems operational</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fuel Summary Chart Placeholder */}
      <div className="module-card">
        <div className="module-card-header">
          <h3 className="module-card-title">
            <TrendingUp className="icon-md" />
            Fuel Summary (Today)
          </h3>
        </div>
        <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
          <p>Fuel consumption: <strong>{stats.fuelToday}L</strong></p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>
            Chart visualization will be implemented with chart library
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
