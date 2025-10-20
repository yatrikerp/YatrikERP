import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Bus, 
  Route, 
  Calendar, 
  Building2, 
  UserCheck, 
  UserCog, 
  DollarSign, 
  Activity, 
  BarChart3, 
  Settings, 
  Search, 
  Bell, 
  Menu, 
  X, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Database,
  Server,
  Monitor,
  Smartphone,
  Ticket,
  Shield,
  FileText,
  PieChart,
  TrendingUp,
  Zap,
  Layers,
  Globe
} from 'lucide-react';
import LoadingSpinner from '../Common/LoadingSpinner';
import './ProfessionalLayout.css';

const ProfessionalAdminLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isLoggingOut } = useAuth();

  // Navigation items with proper organization
  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      current: location.pathname === '/admin',
      description: 'Overview and analytics'
    },
    {
      name: 'User Management',
      href: '/admin/users',
      icon: Users,
      current: location.pathname === '/admin/users',
      description: 'Manage all users'
    },
    {
      name: 'Bus Management',
      href: '/admin/buses',
      icon: Bus,
      current: location.pathname.startsWith('/admin/buses'),
      description: 'Fleet management',
      badge: 'ENHANCED'
    },
    {
      name: 'Route Management',
      href: '/admin/routes',
      icon: Route,
      current: location.pathname.startsWith('/admin/routes'),
      description: 'Route planning'
    },
    {
      name: 'Trip Management',
      href: '/admin/trips',
      icon: Calendar,
      current: location.pathname.startsWith('/admin/trips'),
      description: 'Schedule management'
    },
    {
      name: 'Depot Management',
      href: '/admin/depot-management',
      icon: Building2,
      current: location.pathname.startsWith('/admin/depot-management'),
      description: 'Depot operations'
    },
    {
      name: 'Driver Management',
      href: '/admin/drivers',
      icon: UserCheck,
      current: location.pathname.startsWith('/admin/drivers'),
      description: 'Driver operations'
    },
    {
      name: 'Conductor Management',
      href: '/admin/conductors',
      icon: UserCog,
      current: location.pathname.startsWith('/admin/conductors'),
      description: 'Conductor operations'
    },
    {
      name: 'Booking Management',
      href: '/admin/bookings',
      icon: Ticket,
      current: location.pathname.startsWith('/admin/bookings'),
      description: 'Reservation system'
    },
    {
      name: 'Fare Policy',
      href: '/admin/fare-policy',
      icon: DollarSign,
      current: location.pathname.startsWith('/admin/fare-policy'),
      description: 'Pricing management'
    },
    {
      name: 'Reports & Analytics',
      href: '/admin/reports',
      icon: BarChart3,
      current: location.pathname.startsWith('/admin/reports'),
      description: 'Business intelligence'
    },
    {
      name: 'System Status',
      href: '/admin/system-status',
      icon: Activity,
      current: location.pathname.startsWith('/admin/system-status'),
      description: 'System monitoring'
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      current: location.pathname.startsWith('/admin/settings'),
      description: 'System configuration'
    }
  ];

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement global search logic
      console.log('Searching for:', searchQuery);
      // You can implement actual search functionality here
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Close mobile sidebar
  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  // Show loading state during logout
  if (isLoggingOut) {
    return <LoadingSpinner fullScreen text="Logging out..." />;
  }

  return (
    <div className="professional-layout">
      <div className="flex h-screen">
        {/* Desktop Sidebar */}
        <div className={`professional-sidebar ${sidebarCollapsed ? 'collapsed' : ''} hidden lg:flex flex-col`}>
          {/* Header */}
          <div className="professional-sidebar-header">
            <Link to="/admin" className="professional-sidebar-logo">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Bus className="w-5 h-5 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <div className="text-sm font-bold">YATRIK ERP</div>
                  <div className="text-xs text-gray-400">Admin Panel</div>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="professional-nav">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`professional-nav-item ${item.current ? 'active' : ''}`}
                title={sidebarCollapsed ? item.name : ''}
              >
                <item.icon className="professional-nav-icon" />
                {!sidebarCollapsed && (
                  <>
                    <span className="professional-nav-text">{item.name}</span>
                    {item.badge && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={toggleSidebar}
              className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={closeMobileSidebar} />
            <div className="professional-sidebar open flex flex-col">
              {/* Mobile Header */}
              <div className="professional-sidebar-header">
                <Link to="/admin" className="professional-sidebar-logo" onClick={closeMobileSidebar}>
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Bus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">YATRIK ERP</div>
                    <div className="text-xs text-gray-400">Admin Panel</div>
                  </div>
                </Link>
                <button
                  onClick={closeMobileSidebar}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <nav className="professional-nav">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`professional-nav-item ${item.current ? 'active' : ''}`}
                    onClick={closeMobileSidebar}
                  >
                    <item.icon className="professional-nav-icon" />
                    <span className="professional-nav-text">{item.name}</span>
                    {item.badge && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="professional-header">
            <div className="professional-header-content">
              <div className="professional-header-left">
                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                >
                  <Menu className="w-6 h-6" />
                </button>

                {/* Page title */}
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {navigation.find(item => item.current)?.name || 'Admin Panel'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {navigation.find(item => item.current)?.description || 'System administration'}
                  </p>
                </div>
              </div>

              <div className="professional-header-right">
                {/* Search */}
                <form onSubmit={handleSearch} className="professional-search">
                  <Search className="professional-search-icon" />
                  <input
                    type="text"
                    placeholder="Search users, trips, routes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="professional-search-input"
                  />
                </form>

                {/* Notifications */}
                <button className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg">
                  <Bell className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* User menu */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</div>
                    <div className="text-xs text-gray-500">{user?.role || 'admin'}</div>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {(user?.name || 'A').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="professional-main">
            <div className="professional-content">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalAdminLayout;
