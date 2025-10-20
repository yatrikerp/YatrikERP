import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Home,
  MapPin,
  Clock,
  Users,
  Bell,
  Menu,
  X,
  ArrowLeft,
  LogOut,
  Settings,
  HelpCircle,
  ChevronRight,
  Bus,
  Navigation,
  AlertTriangle,
  CheckCircle,
  Activity,
  FileText,
  Phone
} from 'lucide-react';
import LoadingSpinner from '../Common/LoadingSpinner';

const ProfessionalDriverLayout = ({ children, title, showBackButton = false, onBack }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentDuty, setCurrentDuty] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isLoggingOut } = useAuth();

  // Driver navigation items
  const navigation = [
    {
      name: 'Dashboard',
      href: '/driver',
      icon: Home,
      current: location.pathname === '/driver',
      description: 'Overview and status'
    },
    {
      name: 'Current Duty',
      href: '/driver/duty',
      icon: Activity,
      current: location.pathname.startsWith('/driver/duty'),
      description: 'Active duty management'
    },
    {
      name: 'Navigation',
      href: '/driver/navigation',
      icon: Navigation,
      current: location.pathname.startsWith('/driver/navigation'),
      description: 'Route navigation'
    },
    {
      name: 'Passengers',
      href: '/driver/passengers',
      icon: Users,
      current: location.pathname.startsWith('/driver/passengers'),
      description: 'Passenger management'
    },
    {
      name: 'Reports',
      href: '/driver/reports',
      icon: FileText,
      current: location.pathname.startsWith('/driver/reports'),
      description: 'Trip reports'
    },
    {
      name: 'Settings',
      href: '/driver/settings',
      icon: Settings,
      current: location.pathname.startsWith('/driver/settings'),
      description: 'Driver settings'
    },
    {
      name: 'Help & Support',
      href: '/driver/help',
      icon: HelpCircle,
      current: location.pathname.startsWith('/driver/help'),
      description: 'Support center'
    }
  ];

  // Fetch current duty status
  useEffect(() => {
    const fetchCurrentDuty = async () => {
      try {
        // This would be an actual API call
        // const response = await apiFetch('/api/driver/duties/current');
        // setCurrentDuty(response.data);
        
        // Mock data for now
        setCurrentDuty({
          id: 'DUTY001',
          status: 'in-progress',
          route: 'Kochi - Thiruvananthapuram',
          busNumber: 'KL-01-AB-1234',
          conductor: 'John Doe',
          startTime: '08:00',
          estimatedEndTime: '12:00'
        });
      } catch (error) {
        console.error('Error fetching current duty:', error);
      }
    };

    fetchCurrentDuty();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  // Close sidebar
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Get duty status color
  const getDutyStatusColor = (status) => {
    switch (status) {
      case 'in-progress':
        return 'text-green-600 bg-green-50';
      case 'on-break':
        return 'text-yellow-600 bg-yellow-50';
      case 'completed':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Show loading state during logout
  if (isLoggingOut) {
    return <LoadingSpinner fullScreen text="Logging out..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left side */}
          <div className="flex items-center gap-3">
            {showBackButton ? (
              <button
                onClick={handleBack}
                className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{title || 'Driver Portal'}</h1>
              <p className="text-xs text-gray-500">YATRIK ERP</p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Duty Status */}
            {currentDuty && (
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${getDutyStatusColor(currentDuty.status)}`}>
                {currentDuty.status.replace('-', ' ').toUpperCase()}
              </div>
            )}

            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[18px] h-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* User avatar */}
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {(user?.name || 'D').charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={closeSidebar} />
          <div className="fixed inset-y-0 left-0 flex w-80 max-w-sm flex-col bg-white shadow-xl">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Bus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Driver Portal</h2>
                  <p className="text-sm text-gray-500">YATRIK ERP</p>
                </div>
              </div>
              <button
                onClick={closeSidebar}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Info */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg font-medium">
                    {(user?.name || 'D').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{user?.name || 'Driver'}</div>
                  <div className="text-sm text-gray-500">Driver ID: {user?.driverId || 'DRV001'}</div>
                </div>
              </div>
            </div>

            {/* Current Duty Status */}
            {currentDuty && (
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">Current Duty</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>Route: {currentDuty.route}</div>
                    <div>Bus: {currentDuty.busNumber}</div>
                    <div>Time: {currentDuty.startTime} - {currentDuty.estimatedEndTime}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={closeSidebar}
                  className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                    item.current
                      ? 'bg-green-50 text-green-700 border-r-2 border-green-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${
                    item.current ? 'text-green-700' : 'text-gray-400'
                  }`} />
                  {item.name}
                  <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
                </Link>
              ))}
            </nav>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pb-20">
        <div className="px-4 py-4">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-around">
          {navigation.slice(0, 4).map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                item.current
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default ProfessionalDriverLayout;
