import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar, Clock, MapPin, Users,
  Star, Zap, Bus, Wallet, Ticket,
  Menu, X, Bell, Search, User, Settings, LogOut,
  ChevronRight, Filter
} from 'lucide-react';

const MobilePassengerDashboardFixed = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [myTrips, setMyTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [dashboardData] = useState({
    summary: {
      upcomingBookings: 2,
      completedTrips: 15,
      availableTripsToday: 8,
      walletBalance: 1250
    },
    quickSearchSuggestions: [
      { from: 'Kochi', to: 'Bangalore', averageFare: 850 },
      { from: 'Kochi', to: 'Chennai', averageFare: 750 },
      { from: 'Kochi', to: 'Thiruvananthapuram', averageFare: 450 },
      { from: 'Kochi', to: 'Mumbai', averageFare: 1200 }
    ]
  });

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Calendar },
    { id: 'trips', label: 'My Trips', icon: Ticket },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  useEffect(() => {
    async function fetchMyTrips() {
      try {
        setTripsLoading(true);
        const token = localStorage.getItem('token');
        const resp = await fetch('/api/passenger/dashboard', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        });
        if (resp.ok) {
          const json = await resp.json();
          const upcoming = json?.data?.upcomingTrips || [];
          setMyTrips(Array.isArray(upcoming) ? upcoming : []);
        } else {
          setMyTrips([]);
        }
      } catch (e) {
        setMyTrips([]);
      } finally {
        setTripsLoading(false);
      }
    }

    if (activeTab === 'trips') {
      fetchMyTrips();
    }
  }, [activeTab]);

  const handleQuickSearch = (suggestion) => {
    navigate('/mobile', {
      state: {
        from: suggestion.from,
        to: suggestion.to
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4 max-w-md mx-auto">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#FF416C] rounded-lg flex items-center justify-center">
                <Bus className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">YATRIK ERP</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-lg hover:bg-gray-100 relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-[56px] z-40">
        <div className="flex overflow-x-auto scrollbar-hide max-w-md mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#FF416C] text-[#FF416C] bg-pink-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowMobileMenu(false)}>
          <div className="bg-white h-full w-80 max-w-[85vw] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button onClick={() => setShowMobileMenu(false)}>
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-100 flex items-center space-x-3">
                <Wallet className="w-5 h-5 text-gray-600" />
                <span>My Wallet</span>
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-100 flex items-center space-x-3">
                <Ticket className="w-5 h-5 text-gray-600" />
                <span>My Tickets</span>
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-100 flex items-center space-x-3">
                <Users className="w-5 h-5 text-gray-600" />
                <span>Support</span>
              </button>
              <button
                onClick={() => { setShowMobileMenu(false); logout(); navigate('/login'); }}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-100 flex items-center space-x-3 text-red-600"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      {activeTab === 'dashboard' && (
        <div className="p-4 space-y-4 max-w-md mx-auto min-h-[60vh]">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] rounded-xl p-4 text-white">
            <h1 className="text-xl font-bold mb-1">Welcome back, {user?.name || 'User'}!</h1>
            <p className="text-blue-100 text-sm">Find and book your next journey</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-[#E5E7EB]">
              <div className="flex items-center justify-between mb-2">
                <Ticket className="w-5 h-5 text-[#FF416C]" />
                <span className="text-xs text-[#4B5563]">Upcoming</span>
              </div>
              <p className="text-2xl font-bold text-[#1A1A1A]">{dashboardData.summary.upcomingBookings}</p>
              <p className="text-xs text-[#4B5563]">Trips</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-[#E5E7EB]">
              <div className="flex items-center justify-between mb-2">
                <Wallet className="w-5 h-5 text-[#00BFA6]" />
                <span className="text-xs text-[#4B5563]">Balance</span>
              </div>
              <p className="text-2xl font-bold text-[#1A1A1A]">₹{dashboardData.summary.walletBalance}</p>
              <p className="text-xs text-[#4B5563]">Available</p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E5E7EB]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-[#1A1A1A] flex items-center">
                <Zap className="w-4 h-4 mr-2 text-[#00BFA6]" />
                Quick Search
              </h2>
            </div>
            <div className="space-y-3">
              {dashboardData.quickSearchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickSearch(suggestion)}
                  className="w-full p-3 border border-[#E5E7EB] rounded-lg hover:border-[#FF416C] hover:shadow-sm transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-[#FF416C]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#1A1A1A] text-sm">
                          {suggestion.from} → {suggestion.to}
                        </p>
                        <p className="text-xs text-[#4B5563]">From ₹{suggestion.averageFare}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E5E7EB]">
            <h2 className="font-semibold text-[#1A1A1A] mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/mobile/bookings')}
                className="p-3 border border-[#E5E7EB] rounded-lg hover:border-[#FF416C] hover:shadow-sm transition-all"
              >
                <Ticket className="w-6 h-6 text-[#FF416C] mx-auto mb-2" />
                <span className="text-sm font-medium text-[#1A1A1A]">My Bookings</span>
              </button>
              <button
                onClick={() => navigate('/mobile/track')}
                className="p-3 border border-[#E5E7EB] rounded-lg hover:border-[#FF416C] hover:shadow-sm transition-all"
              >
                <Bus className="w-6 h-6 text-[#FF416C] mx-auto mb-2" />
                <span className="text-sm font-medium text-[#1A1A1A]">Track Bus</span>
              </button>
              <button
                onClick={() => navigate('/mobile/wallet')}
                className="p-3 border border-[#E5E7EB] rounded-lg hover:border-[#FF416C] hover:shadow-sm transition-all"
              >
                <Wallet className="w-6 h-6 text-[#FF416C] mx-auto mb-2" />
                <span className="text-sm font-medium text-[#1A1A1A]">Wallet</span>
              </button>
              <button
                onClick={() => navigate('/mobile/offers')}
                className="p-3 border border-[#E5E7EB] rounded-lg hover:border-[#FF416C] hover:shadow-sm transition-all"
              >
                <Star className="w-6 h-6 text-[#FF416C] mx-auto mb-2" />
                <span className="text-sm font-medium text-[#1A1A1A]">Offers</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* My Trips Tab */}
      {activeTab === 'trips' && (
        <div className="p-4 space-y-4 max-w-md mx-auto min-h-[60vh]">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E5E7EB]">
            <h2 className="font-semibold text-[#1A1A1A] mb-3">My Trips</h2>
            {tripsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF416C] mx-auto"></div>
                <p className="text-[#4B5563] mt-2">Loading trips...</p>
              </div>
            ) : myTrips.length > 0 ? (
              <div className="space-y-3">
                {myTrips.map((trip, index) => (
                  <div key={index} className="p-3 border border-[#E5E7EB] rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-[#1A1A1A]">{trip.route || 'Trip Route'}</p>
                        <p className="text-sm text-[#4B5563]">{trip.date || 'Date'}</p>
                      </div>
                      <span className="text-sm font-medium text-[#FF416C]">{trip.status || 'Confirmed'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-[#4B5563]">No trips found</p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="mt-3 text-[#FF416C] text-sm font-medium"
                >
                  Search for trips
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="p-4 space-y-4 max-w-md mx-auto min-h-[60vh]">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E5E7EB]">
            <h2 className="font-semibold text-[#1A1A1A] mb-3">Search Buses</h2>
            <button
              onClick={() => navigate('/mobile')}
              className="w-full bg-[#FF416C] text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2"
            >
              <Search className="w-5 h-5" />
              <span>Search Buses</span>
            </button>
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="p-4 space-y-4 max-w-md mx-auto min-h-[60vh]">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E5E7EB]">
            <h2 className="font-semibold text-[#1A1A1A] mb-3">Profile</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-[#FF416C] rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-[#1A1A1A]">{user?.name || 'User Name'}</p>
                  <p className="text-sm text-[#4B5563]">{user?.email || 'user@example.com'}</p>
                </div>
              </div>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="w-full text-red-600 py-2 px-4 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobilePassengerDashboardFixed;

