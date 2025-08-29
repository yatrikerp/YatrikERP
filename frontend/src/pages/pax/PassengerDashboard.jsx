import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, LogOut, Settings, CreditCard } from 'lucide-react';

// Import all the new components
import SearchBar from '../../components/pax/SearchBar';
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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [nextTrip, setNextTrip] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Mock data for demonstration
  useEffect(() => {
    // Simulate fetching next trip data
    setNextTrip({
      id: 1,
      busNumber: 'KL-07-AB-1234',
      route: 'Mumbai → Delhi',
      seatNo: '18',
      departureTime: '14:30',
      date: 'Dec 15, 2024',
      status: 'on-time'
    });
  }, []);

  const handleSearch = (searchData) => {
    console.log('Search initiated:', searchData);
    // Implement search functionality
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
          <SearchBar onSearch={handleSearch} />
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

