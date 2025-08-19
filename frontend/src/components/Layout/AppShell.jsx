import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  MapPin, Bus, Clock, Shield, Activity, LogOut, 
  Menu, X, LayoutDashboard, Route, Settings, Users, Building2
} from 'lucide-react';

const NavItem = ({ to, children, icon: Icon, active }) => (
  <Link 
    to={to} 
    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
      active 
        ? 'bg-accent text-white shadow-sm' 
        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
    }`}
  >
    {Icon && <Icon className="w-4 h-4" />}
    {children}
  </Link>
);

export default function AppShell({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Admin navigation items
  const adminNavItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/fare', label: 'Fare Policy', icon: Route },
    { to: '/admin/config', label: 'Config', icon: Settings },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/passengers', label: 'Passengers', icon: Users },
    { to: '/admin/duties', label: 'Conductors', icon: Clock },
    { to: '/admin/drivers', label: 'Drivers', icon: Bus },
    { to: '/admin/depots', label: 'Depots', icon: Building2 },
    { to: '/admin/routes', label: 'Routes', icon: Route },
    { to: '/admin/stops', label: 'Stops', icon: MapPin },
    { to: '/admin/trips', label: 'Trips', icon: Bus },
    { to: '/admin/audits', label: 'Audits', icon: Shield },
    { to: '/admin/status', label: 'System Status', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile menu button for admin */}
            {user?.role === 'admin' && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
            
            {/* Logo */}
            <Link to="/" className="flex items-center hover:opacity-80 transition-opacity duration-200">
              <span className="text-lg font-bold text-gray-900">YATRIK ERP</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Role-based navigation for non-admin */}
            {user?.role !== 'admin' && (
              <>
                {user?.role === 'passenger' && (
                  <>
                    <NavItem to="/dashboard">Dashboard</NavItem>
                    <NavItem to="/wallet">Wallet</NavItem>
                  </>
                )}
                {user?.role === 'conductor' && (
                  <>
                    <NavItem to="/conductor">Duties</NavItem>
                  </>
                )}
                {user?.role === 'driver' && (
                  <>
                    <NavItem to="/driver">Trips</NavItem>
                  </>
                )}
                {user?.role === 'depot_manager' && (
                  <>
                    <NavItem to="/depot">Depot Dashboard</NavItem>
                  </>
                )}
              </>
            )}

            <button 
              onClick={handleLogout} 
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Admin Sidebar */}
        {user?.role === 'admin' && (
          <>
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Sidebar */}
            <div className={`
              fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
              <div className="flex flex-col h-full">
                {/* Sidebar Header */}
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Admin Console</h2>
                  <p className="text-sm text-gray-600">Master Control Panel</p>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                  {adminNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.to;
                    return (
                      <NavItem
                        key={item.to}
                        to={item.to}
                        icon={Icon}
                        active={isActive}
                      >
                        {item.label}
                      </NavItem>
                    );
                  })}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    <p>YATRIK ERP v1.0</p>
                    <p>Admin Panel</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Main Content */}
        <main className={`flex-1 ${user?.role === 'admin' ? 'lg:ml-0' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}


