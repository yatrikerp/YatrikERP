import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Bus,
  Fuel,
  Package,
  FileCheck,
  MessageSquare,
  BarChart3,
  LogOut,
  Bell,
  Settings,
  MapPin,
  RefreshCw,
  ShoppingCart,
  Gavel,
  CreditCard
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import './depot.complete.css';

// Import module components
import DashboardHome from './modules/DashboardHome';
import TripScheduleManagement from './modules/TripScheduleManagement';
import CrewDutyRoster from './modules/CrewDutyRoster';
import BusMaintenance from './modules/BusMaintenance';
import FuelMonitoring from './modules/FuelMonitoring';
import InventorySpareParts from './modules/InventorySpareParts';
import VendorVerification from './modules/VendorVerification';
import PassengerServices from './modules/PassengerServices';
import ReportsAnalytics from './modules/ReportsAnalytics';
import ProductPurchasing from './modules/ProductPurchasing';
import ProductAuction from './modules/ProductAuction';
import PaymentTracking from './modules/PaymentTracking';

const DepotDashboardComplete = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [depotInfo, setDepotInfo] = useState({
    name: 'Yatrik Depot',
    location: 'Kerala, India',
    code: 'DEP001'
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Navigation items for all modules
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard Home', icon: LayoutDashboard, path: '/depot', exact: true },
    { id: 'trips', label: 'Trip & Schedule', icon: Calendar, path: '/depot/trip-management' },
    { id: 'crew', label: 'Crew Duty Roster', icon: Users, path: '/depot/crew-roster' },
    { id: 'buses', label: 'Bus & Maintenance', icon: Bus, path: '/depot/fleet-management' },
    { id: 'fuel', label: 'Fuel Monitoring', icon: Fuel, path: '/depot/fuel-monitoring' },
    { id: 'inventory', label: 'Inventory & Spares', icon: Package, path: '/depot/inventory' },
    { id: 'purchasing', label: 'Buy Products', icon: ShoppingCart, path: '/depot/product-purchasing' },
    { id: 'auction', label: 'Auction Products', icon: Gavel, path: '/depot/product-auction' },
    { id: 'payments', label: 'Payment Tracking', icon: CreditCard, path: '/depot/payment-tracking' },
    { id: 'vendor', label: 'Vendor Verification', icon: FileCheck, path: '/depot/vendor-verification' },
    { id: 'passenger', label: 'Passenger Services', icon: MessageSquare, path: '/depot/passenger-services' },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, path: '/depot/reports-analytics' }
  ];

  useEffect(() => {
    fetchDepotInfo();
    fetchNotifications();
  }, [user]);

  const fetchDepotInfo = async () => {
    try {
      const depotId = user?.depotId || user?.depot?._id;
      if (depotId) {
        const res = await apiFetch(`/api/depot/dashboard`);
        if (res.ok && res.data) {
          const depot = res.data.depot || res.data;
          setDepotInfo({
            name: depot.depotName || depot.name || 'Yatrik Depot',
            location: depot.location?.city || depot.location || 'Kerala, India',
            code: depot.depotCode || depot.code || 'DEP001'
          });
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching depot info:', error);
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await apiFetch('/api/depot/notifications');
      if (res.ok) {
        setNotifications(res.data?.notifications || []);
      }
    } catch (error) {
      // Silently handle missing endpoint - notifications are optional
      setNotifications([]);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      localStorage.clear();
      navigate('/login');
    }
  };

  const getActiveModule = () => {
    const path = location.pathname;
    if (path === '/depot' || path === '/depot/' || path === '/depot/dashboard' || path === '/dashboard/depot' || path === '/dashboard/depot_manager') return 'dashboard';
    if (path.includes('/trip-management') || path.includes('/trips') || path.includes('/schedule-approval')) return 'trips';
    if (path.includes('/crew-roster') || path.includes('/crew')) return 'crew';
    if (path.includes('/fleet-management') || path.includes('/buses') || path.includes('/maintenance')) return 'buses';
    if (path.includes('/fuel-monitoring') || path.includes('/fuel')) return 'fuel';
    if (path.includes('/inventory') || path.includes('/spare')) return 'inventory';
    if (path.includes('/product-purchasing') || path.includes('/purchasing')) return 'purchasing';
    if (path.includes('/product-auction') || path.includes('/auction')) return 'auction';
    if (path.includes('/payment-tracking') || path.includes('/payments')) return 'payments';
    if (path.includes('/vendor-verification') || path.includes('/vendor')) return 'vendor';
    if (path.includes('/passenger-services') || path.includes('/complaints') || path.includes('/concessions')) return 'passenger';
    if (path.includes('/reports-analytics') || path.includes('/reports')) return 'reports';
    return 'dashboard';
  };

  const activeModule = getActiveModule();

  if (loading) {
    return (
      <div className="depot-loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading Depot Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="depot-complete-container">
      {/* Sidebar - Permanent */}
      <aside className="depot-sidebar-complete">
        <div className="sidebar-header-complete">
          <div className="depot-logo-complete">
            <Bus className="logo-icon-complete" />
            <div>
              <h2>YATRIK ERP</h2>
              <p className="depot-code-complete">DEPOT PANEL • {depotInfo.code}</p>
            </div>
          </div>
        </div>

        <div className="depot-info-complete">
          <h3>{depotInfo.name}</h3>
          <p><MapPin className="icon-xs" /> {depotInfo.location}</p>
        </div>

        <nav className="sidebar-nav-complete">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item-complete ${isActive ? 'active' : ''}`}
                onClick={() => {
                  navigate(item.path);
                }}
              >
                <Icon className="nav-icon-complete" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer-complete">
          <div className="user-profile-complete">
            <div className="user-avatar-complete">
              {user?.name?.charAt(0)?.toUpperCase() || 'D'}
            </div>
            <div className="user-info-complete">
              <p className="user-name-complete">{user?.name || 'Depot Manager'}</p>
              <p className="user-role-complete">Depot Manager</p>
            </div>
          </div>
          <button className="logout-btn-complete" onClick={handleLogout}>
            <LogOut className="icon-sm" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="depot-main-complete">
        {/* Top Header */}
        <header className="depot-header-complete">
          <div className="header-left-complete">
            <div>
              <h1>{navigationItems.find(item => item.id === activeModule)?.label || 'Dashboard'}</h1>
              <p className="header-subtitle-complete">
                {activeModule === 'dashboard' 
                  ? 'Live operational snapshot of your depot'
                  : `Manage ${navigationItems.find(item => item.id === activeModule)?.label.toLowerCase() || 'operations'}`
                }
              </p>
            </div>
          </div>
          <div className="header-actions-complete">
            <button className="header-action-btn" onClick={fetchNotifications}>
              <RefreshCw className="icon-sm" />
            </button>
            <div className="notification-wrapper">
              <button className="header-action-btn notification-btn-complete">
                <Bell className="icon-sm" />
                {notifications.length > 0 && (
                  <span className="notification-badge-complete">{notifications.length}</span>
                )}
              </button>
            </div>
            <button className="header-action-btn">
              <Settings className="icon-sm" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="depot-content-complete">
          {activeModule === 'dashboard' && <DashboardHome />}
          {activeModule === 'trips' && <TripScheduleManagement />}
          {activeModule === 'crew' && <CrewDutyRoster />}
          {activeModule === 'buses' && <BusMaintenance />}
          {activeModule === 'fuel' && <FuelMonitoring />}
          {activeModule === 'inventory' && <InventorySpareParts />}
          {activeModule === 'purchasing' && <ProductPurchasing />}
          {activeModule === 'auction' && <ProductAuction />}
          {activeModule === 'payments' && <PaymentTracking />}
          {activeModule === 'vendor' && <VendorVerification />}
          {activeModule === 'passenger' && <PassengerServices />}
          {activeModule === 'reports' && <ReportsAnalytics />}
        </div>
      </main>
    </div>
  );
};

export default DepotDashboardComplete;
