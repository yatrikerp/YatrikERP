import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
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
  MapPin,
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
  Layers,
  TrendingUp,
  GraduationCap,
  Brain,
  Package,
  Gavel,
  Clock,
  LineChart,
  ShoppingCart
} from 'lucide-react';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [authValidated, setAuthValidated] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isLoggingOut, loading: authLoading } = useAuth();

  // Comprehensive authentication validation
  useEffect(() => {
    const validateAuth = () => {
      if (authLoading) {
        return; // Wait for auth context to load
      }

      // Check token
      let token = localStorage.getItem('token') || localStorage.getItem('depotToken');
      
      // Clean token if it has Bearer prefix
      if (token && token.startsWith('Bearer ')) {
        token = token.replace('Bearer ', '').trim();
        // Update stored token
        if (localStorage.getItem('depotToken')) {
          localStorage.setItem('depotToken', token);
        } else if (localStorage.getItem('token')) {
          localStorage.setItem('token', token);
        }
      }
      
      if (!token || token.trim() === '') {
        console.warn('⚠️ [AdminLayout] No token found');
        console.warn('⚠️ [AdminLayout] Available localStorage keys:', Object.keys(localStorage));
        setAuthValidated(false);
        // Redirect to login
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
        return;
      }

      // Validate token
      try {
        const cleanToken = token.replace('Bearer ', '').trim();
        const parts = cleanToken.split('.');
        if (parts.length !== 3) {
          console.warn('⚠️ [AdminLayout] Invalid token format:', {
            partsLength: parts.length,
            tokenPreview: cleanToken.substring(0, 30)
          });
          localStorage.clear();
          setAuthValidated(false);
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
          return;
        }

        const payload = JSON.parse(atob(parts[1]));
        
        // Check expiration
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          console.warn('⚠️ [AdminLayout] Token expired:', {
            exp: new Date(payload.exp * 1000).toISOString(),
            now: new Date().toISOString()
          });
          localStorage.clear();
          setAuthValidated(false);
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
          return;
        }

        // Check admin role - be more flexible
        const role = (payload.role || '').toLowerCase();
        const roleUpper = String(payload.role || '').toUpperCase();
        const isDepotManager = roleUpper === 'DEPOT_MANAGER' || roleUpper === 'DEPOT_SUPERVISOR' || roleUpper === 'DEPOT_OPERATOR';
        const isAdmin = role === 'admin' || role === 'administrator' || roleUpper === 'ADMIN' || roleUpper === 'ADMINISTRATOR';
        const allowedRoles = ['admin', 'administrator', 'depot_manager', 'depot_supervisor', 'depot_operator'];
        
        if (!allowedRoles.includes(role) && !isAdmin && !isDepotManager) {
          console.warn('⚠️ [AdminLayout] User does not have admin role:', {
            role: payload.role,
            normalizedRole: role,
            roleUpper
          });
          setAuthValidated(false);
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          return;
        }

        console.log('✅ [AdminLayout] Authentication validated:', { 
          role: payload.role, 
          email: payload.email,
          userId: payload.userId,
          exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'No expiration'
        });
        setAuthValidated(true);
      } catch (e) {
        console.error('❌ [AdminLayout] Error validating token:', e);
        localStorage.clear();
        setAuthValidated(false);
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }
    };

    validateAuth();
  }, [authLoading, user]);

  // Show loading while validating
  if (authLoading || !authValidated) {
    return (
      <LoadingSpinner 
        fullScreen 
        text="Verifying authentication..." 
      />
    );
  }

  // Check if user exists and has admin role
  const token = localStorage.getItem('token') || localStorage.getItem('depotToken');
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = (user?.role || '').toLowerCase();
  const allowedRoles = ['admin', 'administrator', 'depot_manager', 'depot_supervisor', 'depot_operator'];
  if (!allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <h1 className="text-xl font-bold mb-2 text-red-600">Access Denied</h1>
          <p className="text-gray-600 mb-4">You do not have permission to access the admin panel.</p>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const navigationSections = [
    {
      name: '',
      items: [
        {
          name: 'Dashboard',
          href: '/admin',
          icon: BarChart3,
          current: (location.pathname === '/admin' || location.pathname === '/admin/dashboard') && location.pathname !== '/admin/command-dashboard'
        }
      ]
    },
    {
      name: 'Core Operations',
      items: [
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
          name: 'Booking Management',
          href: '/admin/bookings',
          icon: Ticket,
          current: location.pathname === '/admin/bookings'
        },
        {
          name: 'User Management',
          href: '/admin/users',
          icon: Users,
          current: location.pathname === '/admin/users'
        },
        {
          name: 'Student Concession',
          href: '/admin/student-concession',
          icon: GraduationCap,
          current: location.pathname === '/admin/student-concession'
        }
      ]
    },
    {
      name: 'Vendor & Inventory',
      items: [
        {
          name: 'Vendor Management',
          href: '/admin/vendors',
          icon: Building2,
          current: location.pathname === '/admin/vendors'
        },
        {
          name: 'Bulk Cart',
          href: '/admin/bulk-cart',
          icon: ShoppingCart,
          current: location.pathname === '/admin/bulk-cart'
        },
        {
          name: 'Spare Parts & Inventory',
          href: '/admin/spare-parts',
          icon: Package,
          current: location.pathname === '/admin/spare-parts'
        },
        {
          name: 'Vendor Invoicing',
          href: '/admin/vendor-invoicing',
          icon: FileText,
          current: location.pathname === '/admin/vendor-invoicing'
        },
        {
          name: 'Asset Auction',
          href: '/admin/asset-auction',
          icon: Gavel,
          current: location.pathname === '/admin/asset-auction'
        }
      ]
    },
    {
      name: 'AI & Analytics',
      items: [
        {
          name: 'AI Command Dashboard',
          href: '/admin/command-dashboard',
          icon: Brain,
          current: location.pathname === '/admin/command-dashboard'
        },
        {
          name: 'Autonomous Scheduling',
          href: '/admin/autonomous-scheduling',
          icon: Brain,
          current: location.pathname === '/admin/autonomous-scheduling'
        },
        {
          name: 'ML/AI Dashboard',
          href: '/admin/ml-dashboard',
          icon: Brain,
          current: location.pathname === '/admin/ml-dashboard'
        },
        {
          name: 'Predictive Analytics',
          href: '/admin/predictive-analytics',
          icon: TrendingUp,
          current: location.pathname === '/admin/predictive-analytics'
        },
        {
          name: 'Crew Fatigue Management',
          href: '/admin/crew-fatigue',
          icon: Users,
          current: location.pathname === '/admin/crew-fatigue'
        },
        {
          name: 'ML Analytics',
          href: '/admin/ml-analytics',
          icon: BarChart3,
          current: location.pathname === '/admin/ml-analytics'
        }
      ]
    },
    {
      name: 'Fleet & Operations',
      items: [
        {
          name: 'Fleet GPS Monitoring',
          href: '/admin/fleet-monitoring',
          icon: MapPin,
          current: location.pathname === '/admin/fleet-monitoring'
        },
        {
          name: 'Depot Management',
          href: '/admin/depot-management',
          icon: Building2,
          current: location.pathname === '/admin/depot-management'
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
        }
      ]
    },
    {
      name: 'Financial & Reports',
      items: [
        {
          name: 'Financial Control',
          href: '/admin/financial-control',
          icon: DollarSign,
          current: location.pathname === '/admin/financial-control'
        },
        {
          name: 'Fare Policy',
          href: '/admin/fare-policy',
          icon: DollarSign,
          current: location.pathname === '/admin/fare-policy'
        },
        {
          name: 'Reports',
          href: '/admin/reports',
          icon: PieChart,
          current: location.pathname === '/admin/reports'
        }
      ]
    },
    {
      name: 'System',
      items: [
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
          name: 'Notifications & Alerts',
          href: '/admin/notifications-alerts',
          icon: Bell,
          current: location.pathname === '/admin/notifications-alerts'
        },
        {
          name: 'System Config & Policies',
          href: '/admin/system-config-policies',
          icon: Settings,
          current: location.pathname === '/admin/system-config-policies'
        },
        {
          name: 'Settings',
          href: '/admin/settings',
          icon: Settings,
          current: location.pathname === '/admin/settings' && location.pathname !== '/admin/system-config-policies'
        }
      ]
    }
  ];

  const quickActions = [
    { name: 'Buses', href: '/admin/streamlined-buses', icon: Bus, color: 'bg-blue-500' },
    { name: 'Routes', href: '/admin/streamlined-routes', icon: Route, color: 'bg-green-500' },
    { name: 'Trips', href: '/admin/streamlined-trips', icon: Calendar, color: 'bg-orange-500' },
    { name: 'Support', href: '/admin/support-agents', icon: Users, color: 'bg-purple-500' },
    { name: 'Data', href: '/admin/data-collectors', icon: Database, color: 'bg-indigo-500' }
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
          
          <nav className="flex-1 space-y-4 px-3 py-4 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
            {navigationSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="space-y-1.5">
                {section.name && (
                  <div className="px-3 py-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {section.name}
                    </h3>
                  </div>
                )}
                {section.items.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                      item.current
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100'
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 hover:shadow-sm'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 transition-transform duration-200 ${
                      item.current 
                        ? 'text-blue-600' 
                        : 'text-gray-500 group-hover:text-gray-700 group-hover:scale-110'
                    }`} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col z-50">
        <div className="flex flex-col h-full bg-white shadow-xl border-r border-gray-200">
          {/* Logo */}
          <div className="flex h-16 items-center px-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Admin Panel
            </h2>
          </div>

          {/* Navigation - Scrollable */}
          <nav className="flex-1 space-y-4 px-3 py-4 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
            {navigationSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="space-y-1.5">
                {section.name && (
                  <div className="px-3 py-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {section.name}
                    </h3>
                  </div>
                )}
                {section.items.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                      item.current
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100'
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 hover:shadow-sm'
                    }`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 transition-transform duration-200 ${
                      item.current 
                        ? 'text-blue-600' 
                        : 'text-gray-500 group-hover:text-gray-700 group-hover:scale-110'
                    }`} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                ))}
              </div>
            ))}
          </nav>
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
              <div className="relative flex items-center space-x-2">
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
                
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  data-testid="logout-btn"
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 hover:shadow-lg rounded-lg transition-all duration-200 ease-in-out btn-transition border border-red-600"
                  title="Logout"
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  <span className="font-medium">Logout</span>
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
                {navigationSections
                  .flatMap(section => section.items)
                  .find(item => item.current)?.name || 'Admin Dashboard'}
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
                          {navigationSections
                            .flatMap(section => section.items)
                            .find(item => item.current)?.name || 'Page'}
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
