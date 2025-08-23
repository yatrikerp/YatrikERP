import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHashSection } from '../../hooks/useHashSection';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Bus, 
  User, 
  Phone, 
  Mail, 
  Bell, 
  Search, 
  Filter,
  Download,
  Eye,
  Star,
  MessageSquare,
  HelpCircle,
  Settings,
  LogOut,
  TrendingUp,
  Award,
  Shield,
  Zap,
  Navigation,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Pause,
  Square
} from 'lucide-react';

// Dashboard Components
import UpcomingTripsPanel from '../../components/pax/UpcomingTripsPanel';
import LiveTrackingPanel from '../../components/pax/LiveTrackingPanel';
import BookingHistoryPanel from '../../components/pax/BookingHistoryPanel';
import NotificationsPanel from '../../components/pax/NotificationsPanel';
import TripSearchPanel from '../../components/pax/TripSearchPanel';
import MyBookingsPanel from '../../components/pax/MyBookingsPanel';
import SupportFeedbackPanel from '../../components/pax/SupportFeedbackPanel';
import PaymentHistoryPanel from '../../components/pax/PaymentHistoryPanel';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { section, setSection } = useHashSection();
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState([]);
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [liveTrips, setLiveTrips] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);

  // Mock data for demonstration
  useEffect(() => {
    // Simulate loading data
    setUpcomingTrips([
      {
        id: 1,
        route: 'Kochi → Trivandrum',
        busNumber: 'KL-07-AB-1234',
        departure: '2025-08-20T08:00:00',
        arrival: '2025-08-20T14:00:00',
        seatNo: 'A12',
        status: 'Not Started',
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
        status: 'Not Started',
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
  }, []);

  const handleLogout = () => {
    logout();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Not Started': return 'text-blue-600 bg-blue-50';
      case 'In Progress': return 'text-green-600 bg-green-50';
      case 'Completed': return 'text-gray-600 bg-gray-50';
      case 'Cancelled': return 'text-red-600 bg-red-50';
      case 'Delayed': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Not Started': return <Clock className="w-4 h-4" />;
      case 'In Progress': return <Play className="w-4 h-4" />;
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
      case 'Cancelled': return <XCircle className="w-4 h-4" />;
      case 'Delayed': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'trips', label: 'My Trips', icon: <Bus className="w-5 h-5" /> },
    { id: 'bookings', label: 'Bookings', icon: <Calendar className="w-5 h-5" /> },
    { id: 'tracking', label: 'Live Tracking', icon: <Navigation className="w-5 h5" /> },
    { id: 'payments', label: 'Payments', icon: <Shield className="w-5 h-5" /> },
    { id: 'support', label: 'Support', icon: <HelpCircle className="w-5 h-5" /> }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
              <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.name}!</h1>
            <p className="text-blue-100 mt-1">Ready for your next journey?</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{upcomingTrips.length}</div>
            <div className="text-blue-100">Upcoming Trips</div>
          </div>
              </div>
            </div>
            
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bus className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Trips</p>
              <p className="text-xl font-bold text-gray-900">{upcomingTrips.length + liveTrips.length + bookingHistory.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-xl font-bold text-gray-900">{bookingHistory.filter(trip => trip.status === 'Completed').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Upcoming</p>
              <p className="text-xl font-bold text-gray-900">{upcomingTrips.length}</p>
            </div>
          </div>
              </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bell className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Notifications</p>
              <p className="text-xl font-bold text-gray-900">{notifications.filter(n => !n.read).length}</p>
                </div>
                </div>
                </div>
              </div>

      {/* Upcoming Trips */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Upcoming Trips</h2>
          <p className="text-gray-600 mt-1">Your next adventures await</p>
        </div>
        <div className="p-6">
          {upcomingTrips.length > 0 ? (
            <div className="space-y-4">
              {upcomingTrips.map((trip) => (
                <div key={trip.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{trip.route}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                          {trip.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Bus:</span> {trip.busNumber}
                        </div>
                        <div>
                          <span className="font-medium">Seat:</span> {trip.seatNo}
                        </div>
                        <div>
                          <span className="font-medium">Departure:</span> {new Date(trip.departure).toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Fare:</span> ₹{trip.fare}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No upcoming trips</p>
              <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Book Your First Trip
              </button>
            </div>
          )}
                </div>
              </div>

      {/* Live Trips */}
      {liveTrips.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Live Trips</h2>
            <p className="text-gray-600 mt-1">Track your current journey</p>
          </div>
          <div className="p-6">
            {liveTrips.map((trip) => (
              <div key={trip.id} className="border border-green-200 rounded-xl p-4 bg-green-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{trip.route}</h3>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        {trip.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Current:</span> {trip.currentLocation}
                      </div>
                      <div>
                        <span className="font-medium">ETA:</span> {trip.eta}
                        </div>
                        <div>
                        <span className="font-medium">Progress:</span> {trip.progress}%
                        </div>
                      <div>
                        <span className="font-medium">Seat:</span> {trip.seatNo}
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${trip.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Track Live
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
            
            {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
          <p className="text-gray-600 mt-1">What would you like to do?</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all text-center">
              <Search className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Search Trips</span>
            </button>
            <button className="p-4 border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all text-center">
              <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Book Ticket</span>
            </button>
            <button className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all text-center">
              <Navigation className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Live Track</span>
            </button>
            <button className="p-4 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all text-center">
              <MessageSquare className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Get Support</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'trips':
        return <UpcomingTripsPanel trips={upcomingTrips} />;
      case 'bookings':
        return <MyBookingsPanel />;
      case 'tracking':
        return <LiveTrackingPanel />;
      case 'payments':
        return <PaymentHistoryPanel />;
      case 'support':
        return <SupportFeedbackPanel />;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-blue-600">YATRIK ERP</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-500">
                <Bell className="w-6 h-6" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
                )}
              </button>
              
              {/* User Menu */}
              <div className="relative">
                <button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">{user?.name?.charAt(0)}</span>
                    </div>
                  <span className="hidden md:block font-medium">{user?.name}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
              </div>
              
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-8">
          <div className="flex space-x-1 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;


