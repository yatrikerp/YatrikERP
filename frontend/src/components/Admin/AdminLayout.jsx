import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../Common/LoadingSpinner';
import { 
  Users, 
  Bus, 
  Route, 
  Calendar, 
  Settings, 
  BarChart3, 
  Shield,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  User,
  Building2,
  FileText,
  DollarSign,
  PieChart,
  Activity,
  Database,
  Server,
  Globe,
  Smartphone,
  Ticket,
  Zap,
  Sparkles,
  Layers,
  TrendingUp
} from 'lucide-react';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isLoggingOut } = useAuth();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: BarChart3,
      current: location.pathname === '/admin'
    },
    {
      name: 'Mass Scheduling',
      href: '/admin/mass-scheduling',
      icon: Sparkles,
      current: location.pathname === '/admin/mass-scheduling'
    },
    {
      name: 'Bus Management',
      href: '/admin/streamlined-buses',
      icon: Bus,
      current: location.pathname === '/admin/streamlined-buses'
    },
    {
      name: 'Route Management',
      href: '/admin/streamlined-routes',
      icon: Route,
      current: location.pathname === '/admin/streamlined-routes'
    },
    {
      name: 'Trip Management',
      href: '/admin/streamlined-trips',
      icon: Calendar,
      current: location.pathname === '/admin/streamlined-trips'
    },
    {
      name: 'User Management',
      href: '/admin/users',
      icon: Users,
      current: location.pathname === '/admin/users'
    },
    {
      name: 'Booking Management',
      href: '/admin/bookings',
      icon: Ticket,
      current: location.pathname === '/admin/bookings'
    },
    {
      name: 'Depot Management',
      href: '/admin/depots',
      icon: Building2,
      current: location.pathname === '/admin/depots'
    },
    {
      name: 'Driver Management',
      href: '/admin/drivers',
      icon: User,
      current: location.pathname === '/admin/drivers'
    },
    {
      name: 'Conductor Management',
      href: '/admin/conductors',
      icon: Shield,
      current: location.pathname === '/admin/conductors'
    },
    {
      name: 'Fare Policy',
      href: '/admin/fare-policy',
      icon: DollarSign,
      current: location.pathname === '/admin/fare-policy'
    },
    {
      name: 'System Status',
      href: '/admin/system-status',
      icon: Activity,
      current: location.pathname === '/admin/system-status'
    },
    {
      name: 'RBAC',
      href: '/admin/rbac',
      icon: Shield,
      current: location.pathname === '/admin/rbac'
    },
    {
      name: 'Reports',
      href: '/admin/reports',
      icon: PieChart,
      current: location.pathname === '/admin/reports'
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      current: location.pathname === '/admin/settings'
    }
  ];

  const quickActions = [
    { name: 'Mass Scheduling', href: '/admin/mass-scheduling', icon: Sparkles, color: 'bg-purple-500' },
    { name: 'Buses', href: '/admin/streamlined-buses', icon: Bus, color: 'bg-blue-500' },
    { name: 'Routes', href: '/admin/streamlined-routes', icon: Route, color: 'bg-green-500' },
    { name: 'Trips', href: '/admin/streamlined-trips', icon: Calendar, color: 'bg-orange-500' }
  ];

  const systemMetrics = [
    { name: 'Database', status: 'healthy', icon: Database, color: 'text-green-500' },
    { name: 'API Server', status: 'healthy', icon: Server, color: 'text-green-500' },
    { name: 'Frontend', status: 'healthy', icon: Globe, color: 'text-green-500' },
    { name: 'Mobile App', status: 'warning', icon: Smartphone, color: 'text-yellow-500' }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation even if logout fails
      navigate('/login', { replace: true });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log('Searching for:', searchQuery);
    }
  };

  // Show loading state during logout
  if (isLoggingOut) {
    return <LoadingSpinner fullScreen text="Logging out..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 layout-stable">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ease-in-out ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity duration-300" onClick={() => setSidebarOpen(false)} />
        <div className={`fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex h-16 items-center justify-end px-6 border-b border-gray-200">
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <nav className="flex-1 space-y-1 px-4 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  item.current
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <div className="flex items-center">
                  <item.icon className={`mr-3 h-5 w-5 ${
                    item.current ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  {item.name}
                </div>
                {item.badge && (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    item.badge === 'NEW' ? 'bg-purple-100 text-purple-800' :
                    item.badge === 'IMPROVED' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col z-50">
        <div className="flex flex-col flex-grow bg-white shadow-xl border-r border-gray-200">
          {/* Logo */}
          <div className="flex h-16 items-center px-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-4 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  item.current
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center">
                  <item.icon className={`mr-3 h-5 w-5 ${
                    item.current ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  {item.name}
                </div>
                {item.badge && (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    item.badge === 'NEW' ? 'bg-purple-100 text-purple-800' :
                    item.badge === 'IMPROVED' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'E'}
                </span>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name || 'ERP Admin'}
                </p>
                <p className="text-xs text-gray-500">{user?.role || 'admin'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-gray-600 p-1 rounded transition-all duration-200 ease-in-out hover:bg-gray-100 btn-transition"
                title="Logout"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 relative z-10">
        {/* Top header */}
        <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Left side - Mobile menu only */}
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-lg mx-4 lg:mx-8">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users, trips, routes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </form>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* System Status */}
              <div className="hidden md:flex items-center space-x-2">
                {systemMetrics.map((metric) => (
                  <div key={metric.name} className="flex items-center space-x-1">
                    <metric.icon className={`w-4 h-4 ${metric.color}`} />
                    <span className="text-xs text-gray-600">{metric.name}</span>
                  </div>
                ))}
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
                )}
              </button>

              {/* User menu */}
              <div className="relative">
                <button 
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 ease-in-out btn-transition"
                  disabled={isLoggingOut}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.name?.charAt(0)?.toUpperCase() || 'E'}
                    </span>
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-900">
                    {user?.name || 'ERP Admin'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page header with breadcrumbs */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Page Title and Breadcrumbs */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {navigation.find(item => item.current)?.name || 'Admin Dashboard'}
              </h1>
              <nav className="flex mt-2" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2">
                  <li>
                    <Link to="/admin" className="text-gray-500 hover:text-gray-700 text-sm">
                      Dashboard
                    </Link>
                  </li>
                  {location.pathname !== '/admin' && (
                    <>
                      <li>
                        <span className="text-gray-400 mx-2">/</span>
                      </li>
                      <li>
                        <span className="text-gray-900 text-sm">
                          {navigation.find(item => item.current)?.name || 'Page'}
                        </span>
                      </li>
                    </>
                  )}
                </ol>
              </nav>
            </div>

            {/* Quick Actions */}
            <div className="hidden md:flex items-center space-x-2">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  to={action.href}
                  className={`${action.color} text-white px-3 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center space-x-2`}
                >
                  <action.icon className="w-4 h-4" />
                  <span>{action.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
