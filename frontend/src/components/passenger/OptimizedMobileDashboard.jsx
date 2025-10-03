import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import { 
  Bus, Ticket, Wallet, Star, Search, User, 
  MapPin, Zap, LogOut, Menu, X, Bell
} from 'lucide-react';
import VerticalSearchCard from './VerticalSearchCard';
import PopularRoutesCard from './PopularRoutesCard';
import './OptimizedMobileDashboard.css';

const OptimizedMobileDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMenu, setShowMenu] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      upcoming: 2,
      balance: 1250
    },
    quickRoutes: [
      { from: 'Kochi', to: 'Bangalore', fare: 850 },
      { from: 'Kochi', to: 'Chennai', fare: 750 },
      { from: 'Kochi', to: 'Thiruvananthapuram', fare: 450 }
    ]
  });

  // Fetch real popular routes data
  useEffect(() => {
    const fetchPopularRoutes = async () => {
      try {
        const response = await apiFetch('/api/routes/popular?limit=8');
        if (response && response.ok && response.data && response.data.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
          setDashboardData(prev => ({
            ...prev,
            quickRoutes: response.data.data.map(route => ({
              from: route.from || route.fromCity,
              to: route.to || route.toCity,
              fare: route.minFare || route.price || route.fare || route.averageFare
            }))
          }));
        }
      } catch (error) {
        console.error('Error fetching popular routes:', error);
        // Keep default routes on error
      }
    };

    fetchPopularRoutes();
  }, []);

  // Memoized tabs configuration
  const tabs = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', icon: Bus },
    { id: 'trips', label: 'My Trips', icon: Ticket },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'profile', label: 'Profile', icon: User }
  ], []);

  // Optimized handlers with useCallback
  const handleQuickSearch = useCallback((route) => {
    navigate('/mobile', { 
      state: { from: route.from, to: route.to } 
    });
  }, [navigate]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  // Render dashboard content
  const renderDashboard = () => (
    <div className="py-3 space-y-4">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] rounded-lg p-4 text-white">
        <h1 className="text-lg font-bold truncate">Welcome, {user?.name || 'User'}!</h1>
        <p className="text-sm opacity-90">Book your next journey</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-4 border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Ticket className="w-5 h-5 text-[#FF416C]" />
            <span className="text-xs text-[#4B5563]">Upcoming</span>
          </div>
          <p className="text-2xl font-bold text-[#1A1A1A]">{dashboardData.stats.upcoming}</p>
          <p className="text-xs text-[#4B5563]">Trips</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Wallet className="w-5 h-5 text-[#00BFA6]" />
            <span className="text-xs text-[#4B5563]">Balance</span>
          </div>
          <p className="text-2xl font-bold text-[#1A1A1A]">₹{dashboardData.stats.balance}</p>
          <p className="text-xs text-[#4B5563]">Available</p>
        </div>
      </div>

      {/* Vertical Search Card */}
      <VerticalSearchCard />

      {/* Popular Routes Card */}
      <PopularRoutesCard />

      {/* Quick Actions */}
      <div className="bg-white rounded-lg p-3 border border-[#E5E7EB] shadow-sm">
        <h2 className="font-semibold text-[#1A1A1A] mb-2 text-sm">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate('/mobile/bookings')}
            className="p-2.5 border border-[#E5E7EB] rounded-lg hover:border-[#FF416C] hover:shadow-md transition-all duration-200"
          >
            <Ticket className="w-5 h-5 text-[#FF416C] mx-auto mb-1.5" />
            <span className="text-xs font-medium text-[#1A1A1A]">My Bookings</span>
          </button>
          <button
            onClick={() => navigate('/mobile/track')}
            className="p-2.5 border border-[#E5E7EB] rounded-lg hover:border-[#FF416C] hover:shadow-md transition-all duration-200"
          >
            <Bus className="w-5 h-5 text-[#FF416C] mx-auto mb-1.5" />
            <span className="text-xs font-medium text-[#1A1A1A]">Track Bus</span>
          </button>
          <button
            onClick={() => navigate('/mobile/wallet')}
            className="p-2.5 border border-[#E5E7EB] rounded-lg hover:border-[#00BFA6] hover:shadow-md transition-all duration-200"
          >
            <Wallet className="w-5 h-5 text-[#00BFA6] mx-auto mb-1.5" />
            <span className="text-xs font-medium text-[#1A1A1A]">Wallet</span>
          </button>
          <button
            onClick={() => navigate('/mobile/offers')}
            className="p-2.5 border border-[#E5E7EB] rounded-lg hover:border-[#F59E0B] hover:shadow-md transition-all duration-200"
          >
            <Star className="w-5 h-5 text-[#F59E0B] mx-auto mb-1.5" />
            <span className="text-xs font-medium text-[#1A1A1A]">Offers</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Render trips content
  const renderTrips = () => (
    <div className="py-3">
      <div className="bg-white rounded-lg p-3 border border-[#E5E7EB] shadow-sm">
        <h2 className="font-semibold text-[#1A1A1A] mb-2 text-sm">My Trips</h2>
        <div className="text-center py-6">
          <Ticket className="w-10 h-10 text-[#4B5563] mx-auto mb-2" />
          <p className="text-[#4B5563] mb-2 text-sm">No trips found</p>
          <button
            onClick={() => handleTabChange('search')}
            className="text-[#FF416C] text-xs font-medium hover:text-[#FF4B2B] transition-colors duration-200"
          >
            Search for trips
          </button>
        </div>
      </div>
    </div>
  );

  // Render search content
  const renderSearch = () => (
    <div className="py-3">
      <div className="bg-white rounded-lg p-3 border border-[#E5E7EB] shadow-sm">
        <h2 className="font-semibold text-[#1A1A1A] mb-2 text-sm">Search Buses</h2>
        <button
          onClick={() => navigate('/mobile')}
          className="w-full bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white py-2.5 rounded-lg font-semibold flex items-center justify-center space-x-2 text-sm hover:shadow-lg transition-all duration-200"
        >
          <Search className="w-4 h-4" />
          <span>Search Buses</span>
        </button>
      </div>
    </div>
  );

  // Render profile content
  const renderProfile = () => (
    <div className="py-3">
      <div className="bg-white rounded-lg p-3 border border-[#E5E7EB] shadow-sm">
        <h2 className="font-semibold text-[#1A1A1A] mb-2 text-sm">Profile</h2>
        <div className="space-y-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[#1A1A1A] text-sm truncate">{user?.name || 'User Name'}</p>
              <p className="text-xs text-[#4B5563] truncate">{user?.email || 'user@example.com'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-[#EF4444] py-2 px-3 border border-[#EF4444] rounded-lg hover:bg-red-50 transition-colors text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );

  // Main render function
  return (
    <div className="min-h-screen bg-[#F9FAFB] overflow-x-hidden mobile-dashboard">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-[#E5E7EB] sticky top-0 z-50">
        <div className="flex items-center justify-between px-3 py-2 max-w-full">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg hover:bg-[#F9FAFB] flex-shrink-0 transition-colors duration-200"
            >
              <Menu className="w-4 h-4 text-[#4B5563]" />
            </button>
            <div className="flex items-center space-x-1.5 min-w-0">
              <div className="w-6 h-6 bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                <Bus className="w-3 h-3 text-white" />
              </div>
              <span className="font-bold text-[#1A1A1A] text-sm truncate">YATRIK ERP</span>
            </div>
          </div>
          <div className="flex items-center space-x-1 flex-shrink-0">
            <button className="p-1.5 rounded-lg hover:bg-[#F9FAFB] relative transition-colors duration-200">
              <Bell className="w-4 h-4 text-[#4B5563]" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#EF4444] rounded-full"></span>
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-[#F9FAFB] transition-colors duration-200"
            >
              <LogOut className="w-4 h-4 text-[#4B5563]" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-[48px] z-40">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-2 whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
                activeTab === tab.id
                  ? 'border-[#FF416C] text-[#FF416C] bg-[#F9FAFB]'
                  : 'border-transparent text-[#4B5563] hover:text-[#1A1A1A] hover:bg-[#F9FAFB]'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowMenu(false)}>
          <div className="bg-white h-full w-72 max-w-[85vw] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 border-b border-[#E5E7EB]">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#1A1A1A]">Menu</h2>
                <button onClick={() => setShowMenu(false)}>
                  <X className="w-4 h-4 text-[#4B5563]" />
                </button>
              </div>
            </div>
            <div className="p-3 space-y-1">
              <button className="w-full text-left p-2.5 rounded-lg hover:bg-gray-100 flex items-center space-x-2.5">
                <Wallet className="w-4 h-4 text-gray-600" />
                <span className="text-sm">My Wallet</span>
              </button>
              <button className="w-full text-left p-2.5 rounded-lg hover:bg-gray-100 flex items-center space-x-2.5">
                <Ticket className="w-4 h-4 text-gray-600" />
                <span className="text-sm">My Tickets</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left p-2.5 rounded-lg hover:bg-gray-100 flex items-center space-x-2.5 text-red-600"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="w-full max-w-full px-3">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'trips' && renderTrips()}
        {activeTab === 'search' && renderSearch()}
        {activeTab === 'profile' && renderProfile()}
      </div>
    </div>
  );
};

export default OptimizedMobileDashboard;
