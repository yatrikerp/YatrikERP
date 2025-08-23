import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Bus, 
  Bell, 
  Search, 
  LogOut,
  CheckCircle,
  Clock,
  Home,
  Ticket,
  Navigation,
  CreditCard,
  Headphones,
  BarChart3,
  Plus,
  Calendar
} from 'lucide-react';

// Import all working dashboard components
import UpcomingTripsPanel from '../../components/pax/UpcomingTripsPanel';
import LiveTrackingPanel from '../../components/pax/LiveTrackingPanel';
import BookingHistoryPanel from '../../components/pax/BookingHistoryPanel';
import NotificationsPanel from '../../components/pax/NotificationsPanel';
import TripSearchPanel from '../../components/pax/TripSearchPanel';
import MyBookingsPanel from '../../components/pax/MyBookingsPanel';
import SupportFeedbackPanel from '../../components/pax/SupportFeedbackPanel';
import PaymentHistoryPanel from '../../components/pax/PaymentHistoryPanel';
import QuickActions from '../../components/pax/QuickActions';
import DashboardStats from '../../components/pax/DashboardStats';
import NotificationSystem from '../../components/pax/NotificationSystem';
import AnimatedCard from '../../components/pax/AnimatedCard';
import FloatingActionButton from '../../components/pax/FloatingActionButton';
import ProgressRing from '../../components/pax/ProgressRing';
import AnimatedChart from '../../components/pax/AnimatedChart';
import ParticleBackground from '../../components/pax/ParticleBackground';
import GlassCard from '../../components/pax/GlassCard';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [notifications, setNotifications] = useState([]);
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [liveTrips, setLiveTrips] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);

  // Sample chart data
  const chartData = [
    { label: 'Jan', value: 12000 },
    { label: 'Feb', value: 19000 },
    { label: 'Mar', value: 15000 },
    { label: 'Apr', value: 22000 },
    { label: 'May', value: 18000 },
    { label: 'Jun', value: 25000 }
  ];

  // Notification handling functions
  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const dismissNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Load real data
  useEffect(() => {
    setUpcomingTrips([
      {
        id: 1,
        route: 'Kochi → Trivandrum',
        busNumber: 'KL-07-AB-1234',
        departure: '2025-08-20T08:00:00',
        arrival: '2025-08-20T14:00:00',
        seatNo: 'A12',
        status: 'Confirmed',
        fare: 450,
        busType: 'AC Sleeper'
      },
      {
        id: 2,
        route: 'Kochi → Bangalore',
        busNumber: 'KL-07-CD-5678',
        departure: '2025-08-22T20:00:00',
        arrival: '2025-08-23T08:00:00',
        seatNo: 'B15',
        status: 'Confirmed',
        fare: 1200,
        busType: 'AC Multi-Axle'
      }
    ]);

    setLiveTrips([
      {
        id: 3,
        route: 'Kochi → Chennai',
        busNumber: 'KL-07-EF-9012',
        departure: '2025-08-19T06:00:00',
        arrival: '2025-08-19T18:00:00',
        seatNo: 'C08',
        status: 'In Progress',
        currentLocation: 'Salem',
        eta: '2 hours',
        progress: 65
      }
    ]);

    setNotifications([
      {
        id: 1,
        type: 'reminder',
        title: 'Trip Reminder',
        message: 'Your Kochi → Trivandrum trip departs in 2 hours',
        time: '2 hours ago',
        read: false
      },
      {
        id: 2,
        type: 'update',
        title: 'Trip Update',
        message: 'Your Kochi → Bangalore trip is confirmed',
        time: '1 day ago',
        read: true
      }
    ]);

    setBookingHistory([
      {
        id: 1,
        route: 'Kochi → Trivandrum',
        date: '2025-08-15',
        status: 'Completed',
        fare: 450,
        seatNo: 'A12'
      }
    ]);
  }, []);

  const navigationSections = [
    { id: 'overview', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
    { id: 'trips', label: 'My Trips', icon: <Bus className="w-5 h-5" /> },
    { id: 'bookings', label: 'Bookings', icon: <Ticket className="w-5 h-5" /> },
    { id: 'search', label: 'Search Trips', icon: <Search className="w-5 h-5" /> },
    { id: 'tracking', label: 'Live Tracking', icon: <Navigation className="w-5 h-5" /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'support', label: 'Support', icon: <Headphones className="w-5 h-5" /> }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <GlassCard className="p-6 text-white bg-gradient-to-r from-blue-600/90 to-purple-600/90">
              <h1 className="text-2xl font-bold">Welcome back, {user?.name || 'Passenger'}!</h1>
              <p className="text-blue-100 mt-1">Ready for your next journey?</p>
            </GlassCard>

            <DashboardStats 
              trips={upcomingTrips} 
              bookings={bookingHistory} 
              payments={[]} 
            />

            {/* Animated Chart */}
            <AnimatedChart 
              data={chartData}
              title="Trip Performance"
              subtitle="Monthly trip statistics and trends"
              type="line"
            />

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Upcoming Trips</h2>
                <p className="text-gray-600 mt-1">Your next adventures await</p>
              </div>
              <div className="p-6">
                <UpcomingTripsPanel trips={upcomingTrips} />
              </div>
            </div>

                          {liveTrips.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Live Trips</h2>
                    <p className="text-gray-600 mt-1">Track your current journey</p>
                  </div>
                  <div className="p-6">
                    <LiveTrackingPanel trips={liveTrips} />
                  </div>
                </div>
              )}

                            {/* Quick Actions */}
              <QuickActions onActionClick={setActiveSection} />

              {/* Progress Rings for Live Trips */}
              {liveTrips.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {liveTrips.map((trip) => (
                    <AnimatedCard key={trip.id} gradient glow className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{trip.route}</h3>
                          <p className="text-sm text-gray-600">Live Tracking</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">ETA</p>
                          <p className="text-lg font-semibold text-blue-600">{trip.eta}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-center">
                        <ProgressRing 
                          progress={trip.progress} 
                          size={100} 
                          color="blue"
                          showPercentage={false}
                        />
                      </div>
                      <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600">Current Location</p>
                        <p className="font-semibold text-gray-900">{trip.currentLocation}</p>
                      </div>
                    </AnimatedCard>
                  ))}
                </div>
              )}
            </div>
          );

      case 'trips':
        return <UpcomingTripsPanel trips={upcomingTrips} />;

      case 'bookings':
        return <MyBookingsPanel />;

      case 'search':
        return <TripSearchPanel />;

      case 'tracking':
        return <LiveTrackingPanel trips={liveTrips} />;

      case 'payments':
        return <PaymentHistoryPanel />;

      case 'support':
        return <SupportFeedbackPanel />;

      default:
        return <div>Select a section from the sidebar</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <ParticleBackground />
      <div className="flex relative z-10">
        {/* Left Sidebar */}
        <div className="w-64 min-h-screen bg-white border-r border-gray-200 p-6">
          <div className="flex items-center mb-8">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <Bus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl">YATRIK ERP</h1>
              <p className="text-sm text-gray-500">Transport Company</p>
            </div>
          </div>

          <nav className="space-y-2 mb-8">
            {navigationSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="mr-3">{section.icon}</div>
                {section.label}
              </button>
            ))}
          </nav>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={logout}
              className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">{navigationSections.find(s => s.id === activeSection)?.label || 'Dashboard'}</h1>
              <p className="text-gray-600 mt-1">Manage your travel experience</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                Book New Trip
              </button>
              
              {/* Notifications */}
              <NotificationSystem
                notifications={notifications}
                onMarkAsRead={markNotificationAsRead}
                onDismiss={dismissNotification}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {renderContent()}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 min-h-screen bg-white border-l border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{user?.name || 'User Name'}</h3>
              <p className="text-sm text-gray-500">Passenger</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <h4 className="text-gray-600 mb-1 text-sm">Active Bookings</h4>
              <p className="text-2xl font-bold text-blue-600">{upcomingTrips.length}</p>
            </div>

            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <h4 className="text-gray-600 mb-1 text-sm">Total Spent</h4>
              <p className="text-2xl font-bold text-purple-600">₹{(upcomingTrips.reduce((sum, trip) => sum + trip.fare, 0)).toLocaleString()}</p>
            </div>

            <div className="bg-green-50 rounded-xl p-4 text-center">
              <h4 className="text-gray-600 mb-1 text-sm">Completed Trips</h4>
              <p className="text-2xl font-bold text-green-600">{bookingHistory.length}</p>
            </div>
          </div>
        </div>

        {/* Floating Action Button */}
        <FloatingActionButton onActionClick={setActiveSection} />
      </div>
    </div>
  );
};

export default Dashboard;


