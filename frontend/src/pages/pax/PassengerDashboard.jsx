import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, LogOut, Settings, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/api';

// Import all the new components
import SearchBar from '../../components/pax/SearchBar';
import EnhancedSearchBar from '../../components/pax/EnhancedSearchBar';
import NextTripCard from '../../components/pax/NextTripCard';
import WalletCard from '../../components/pax/WalletCard';
import RefundCard from '../../components/pax/RefundCard';
import TicketsCard from '../../components/pax/TicketsCard';
import UpcomingTripsList from '../../components/pax/UpcomingTripsList';
import LiveTrackingMap from '../../components/pax/LiveTrackingMap';
import NotificationsPanel from '../../components/pax/NotificationsPanel';
import StatsRow from '../../components/pax/StatsRow';

const PassengerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [nextTrip, setNextTrip] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [updatedRoutes, setUpdatedRoutes] = useState([]);
  const [routesLoading, setRoutesLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    // Simulate fetching next trip data
    setNextTrip({
      id: 1,
      busNumber: 'KL-07-AB-1234',
      route: 'Kochi → Thiruvananthapuram',
      seatNo: '18',
      departureTime: '14:30',
      date: 'Dec 15, 2024',
      status: 'on-time'
    });
  }, []);

  // Load recently updated active routes
  const loadUpdatedRoutes = async () => {
    try {
      setRoutesLoading(true);
      const res = await apiFetch('/api/routes?status=active&sortBy=updatedAt&sortOrder=desc&limit=6');
      if (res.ok) {
        const list = res.data?.data || res.data || [];
        setUpdatedRoutes(Array.isArray(list) ? list : []);
      }
    } finally {
      setRoutesLoading(false);
    }
  };

  useEffect(() => {
    loadUpdatedRoutes();
    const t = setInterval(loadUpdatedRoutes, 30000);
    return () => clearInterval(t);
  }, []);

  const handleSearch = (searchData) => {
    console.log('🔍 Search data received:', searchData);
    const params = new URLSearchParams();
    if (searchData.fromCity) params.set('fromCity', searchData.fromCity);
    if (searchData.toCity) params.set('toCity', searchData.toCity);
    if (searchData.journeyDate) params.set('date', searchData.journeyDate);
    console.log('🔍 Navigation URL:', `/pax/results?${params.toString()}`);
    navigate(`/pax/results?${params.toString()}`);
  };

  const handleViewTicket = (trip) => {
    console.log('View ticket for:', trip);
    // Implement ticket viewing
  };

  const handleTrackBus = (trip) => {
    console.log('Track bus for:', trip);
    // Implement bus tracking
  };

  const handleShowQRPass = () => {
    console.log('Show QR pass');
    // Implement QR pass display
  };

  const handleAddMoney = () => {
    console.log('Add money to wallet');
    // Implement wallet top-up
  };

  const handleViewRefundDetails = () => {
    console.log('View refund details');
    // Implement refund details view
  };

  const handleViewTicketDetails = (ticket) => {
    console.log('View ticket details:', ticket);
    // Implement ticket details view
  };

  const handleDownloadTicket = (ticket) => {
    console.log('Download ticket:', ticket);
    // Implement ticket download
  };

  const handleShowQR = (ticket) => {
    console.log('Show QR for ticket:', ticket);
    // Implement QR display
  };

  const handleViewTrip = (trip) => {
    console.log('View trip details:', trip);
    // Implement trip details view
  };

  const handleCancelTrip = (trip) => {
    console.log('Cancel trip:', trip);
    // Implement trip cancellation
  };

  const handleDismissNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleMarkNotificationAsRead = (notificationId) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">Y</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">YATRIK ERP</h1>
                <p className="text-sm text-gray-500">Passenger Portal</p>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <NotificationsPanel 
                notificationsData={notifications}
                onDismiss={handleDismissNotification}
                onMarkAsRead={handleMarkNotificationAsRead}
              />

              {/* Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.name?.charAt(0) || 'P'}
                    </span>
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {user?.name || 'Passenger'}
                  </span>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.name || 'Passenger'}</p>
                      <p className="text-xs text-gray-500">{user?.email || 'passenger@example.com'}</p>
                    </div>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      My Account
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Wallet
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button 
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section - Trip Search */}
        <div className="mb-12">
          <EnhancedSearchBar onSearch={handleSearch} />
        </div>

        {/* Recently Updated Routes */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recently updated routes</h2>
            <button onClick={loadUpdatedRoutes} className="text-sm text-blue-600 hover:text-blue-700">Refresh</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {routesLoading && (
              <div className="col-span-full text-gray-500">Loading routes...</div>
            )}
            {!routesLoading && updatedRoutes.map((r) => (
              <div key={r._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="text-sm text-gray-500 mb-1">{r.routeNumber}</div>
                <div className="text-base font-semibold text-gray-900">{r.routeName}</div>
                <div className="text-sm text-gray-600 mt-1">{r.startingPoint?.city} → {r.endingPoint?.city}</div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-gray-500">Updated</span>
                  <span className="text-gray-700">{new Date(r.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {!routesLoading && updatedRoutes.length === 0 && (
              <div className="col-span-full text-gray-600">No active routes found.</div>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <StatsRow />

        {/* Next Trip Card */}
        <div className="mb-8">
          <NextTripCard 
            nextTrip={nextTrip}
            onViewTicket={handleViewTicket}
            onTrackBus={handleTrackBus}
          />
        </div>

        {/* Quick Access Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <WalletCard 
            onAddMoney={handleAddMoney}
            onShowQRPass={handleShowQRPass}
          />
          <RefundCard 
            onViewDetails={handleViewRefundDetails}
          />
          <TicketsCard 
            onViewTicket={handleViewTicketDetails}
            onDownloadTicket={handleDownloadTicket}
            onShowQR={handleShowQR}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Upcoming Trips */}
          <div className="xl:col-span-2">
            <UpcomingTripsList 
              onViewTrip={handleViewTrip}
              onCancelTrip={handleCancelTrip}
              onTrackTrip={handleTrackBus}
              onViewTicket={handleViewTicket}
            />
          </div>

          {/* Right Column - Live Tracking */}
          <div className="xl:col-span-1">
            <LiveTrackingMap 
              onTrackBus={handleTrackBus}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default PassengerDashboard;

