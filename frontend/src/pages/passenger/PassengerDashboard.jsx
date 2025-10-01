import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Bus, 
  Wallet, 
  Ticket, 
  TrendingUp,
  Search
} from 'lucide-react';
import QuickSearch from '../../components/Common/QuickSearch';
import NotificationButton from '../../components/passenger/NotificationButton';

const PassengerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  
  // Default popular routes for instant display
  const defaultPopularRoutes = [
    { from: 'Kochi', to: 'Thiruvananthapuram', label: 'Kochi → Thiruvananthapuram', route: 'KL-01' },
    { from: 'Kozhikode', to: 'Kochi', label: 'Kozhikode → Kochi', route: 'KL-02' },
    { from: 'Thrissur', to: 'Kochi', label: 'Thrissur → Kochi', route: 'KL-03' },
    { from: 'Kochi', to: 'Kannur', label: 'Kochi → Kannur', route: 'KL-04' },
    { from: 'Palakkad', to: 'Kochi', label: 'Palakkad → Kochi', route: 'KL-05' },
    { from: 'Alappuzha', to: 'Thiruvananthapuram', label: 'Alappuzha → Thiruvananthapuram', route: 'KL-06' }
  ];
  
  const [popularRoutes, setPopularRoutes] = useState(defaultPopularRoutes);

  useEffect(() => {
    fetchDashboardData();
    fetchPopularRoutes();
    // Live refresh every 60 seconds
    const interval = setInterval(() => {
      fetchPopularRoutes();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found for dashboard data');
        return;
      }

      const response = await fetch('/api/passenger/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUpcomingTrips(data.data.upcomingTrips || []);
          setRecentActivity(data.data.recentActivity || []);
          setWalletBalance(data.data.walletBalance || 0);
        }
      } else {
        console.error('Failed to fetch dashboard data:', response.statusText);
        // Keep empty arrays if API fails
        setUpcomingTrips([]);
        setRecentActivity([]);
        setWalletBalance(0);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Keep empty arrays if API fails
      setUpcomingTrips([]);
      setRecentActivity([]);
      setWalletBalance(0);
    }
  };

  const fetchPopularRoutes = async () => {
    try {
      const resp = await fetch(`/api/routes/popular?limit=6`);
      if (!resp.ok) throw new Error('Failed to fetch popular routes');
      const json = await resp.json();
      if (json?.success && Array.isArray(json.data)) {
        const mapped = json.data.map((r) => ({
          from: r.from,
          to: r.to,
          label: `${r.from} → ${r.to}`,
          route: r.routeName || r.routeNumber || ''
        }));
        setPopularRoutes(mapped);
      }
      // Keep default routes on error instead of empty array
    } catch (error) {
      console.error('Error fetching popular routes:', error);
      // Keep default routes on error
    }
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePopularRouteClick = (route) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    
    // Navigate to results with the popular route
    navigate(`/passenger/results?from=${encodeURIComponent(route.from)}&to=${encodeURIComponent(route.to)}&date=${dateString}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.name || 'Passenger'}!
              </h1>
              <p className="text-gray-600">Here's what's happening with your trips today</p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationButton />
            </div>
          </div>
        </div>

        {/* Main Search Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Plan Your Next Journey</h2>
            <p className="text-gray-600">Search and book your bus tickets with intelligent suggestions</p>
          </div>
          <QuickSearch />
          
          {/* Popular Destinations */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">Popular Kerala Routes</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {popularRoutes.length > 0 ? (
                popularRoutes.map((route, index) => (
                  <button
                    key={index}
                    onClick={() => handlePopularRouteClick(route)}
                    className="px-3 py-1 bg-white/80 hover:bg-white text-gray-700 text-xs font-medium rounded-full border border-pink-200 hover:border-pink-300 transition-all duration-200 hover:shadow-sm"
                  >
                    {route.label}
                  </button>
                ))
              ) : (
                <p className="text-gray-500 text-sm">Loading Kerala routes...</p>
              )}
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">Click any route to search for available trips</p>
          </div>
        </div>


        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Book Trip Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Book Trip</h3>
                <p className="text-gray-600 text-sm">Search and book your journey</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-pink-100 to-pink-200 rounded-lg flex items-center justify-center">
                <Bus className="w-6 h-6 text-pink-600" />
              </div>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/passenger/search')}
                className="w-full bg-gradient-to-r from-pink-600 to-pink-700 text-white py-3 px-4 rounded-lg hover:from-pink-700 hover:to-pink-800 transition-all duration-200 flex items-center justify-center space-x-2 font-semibold"
              >
                <Search className="w-5 h-5" />
                <span>Search & Book Trip</span>
              </button>
              <button
                onClick={() => navigate('/passenger/available-trips')}
                className="w-full bg-white border border-pink-300 text-pink-600 py-2 px-4 rounded-lg hover:bg-pink-50 transition-all duration-200 flex items-center justify-center space-x-2 font-medium text-sm"
              >
                <Bus className="w-4 h-4" />
                <span>View All Available Trips</span>
              </button>
            </div>
          </div>

          {/* Wallet Balance Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Wallet Balance</h3>
                <div className="text-3xl font-bold text-gray-900 mb-2">₹{walletBalance}</div>
                <button className="text-sm text-blue-600 hover:underline">View Details →</button>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* My Tickets Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">My Tickets</h3>
                <p className="text-gray-600 text-sm mb-4">View and manage your bookings</p>
                <button className="text-sm text-blue-600 hover:underline">View All →</button>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                <Ticket className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Trips */}
        {upcomingTrips.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Upcoming Trips</h2>
                <p className="text-gray-600">Your confirmed bookings</p>
              </div>
              <button
                onClick={() => navigate('/passenger/tickets')}
                className="text-sm text-blue-600 hover:underline"
              >
                View All →
              </button>
            </div>
            
            <div className="space-y-4">
              {upcomingTrips.slice(0, 3).map((trip) => (
                <div key={trip.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Bus className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{trip.routeName}</h3>
                      <p className="text-sm text-gray-600">{trip.from} → {trip.to}</p>
                      <p className="text-xs text-gray-500">{trip.departureDate} • {trip.departureTime}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">₹{trip.fare}</div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(trip.status)}`}>
                      {trip.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Popular Routes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Popular Routes</h2>
              <p className="text-gray-600">Most booked destinations</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularRoutes.slice(0, 6).map((route, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                   onClick={() => handlePopularRouteClick(route)}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">{route.label}</span>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-sm text-gray-600">Route: {route.route}</p>
                <p className="text-xs text-gray-500 mt-1">Click to search trips</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Your Frequent Trips</h2>
                <p className="text-gray-600">Based on your booking history</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Ticket className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{activity.routeName}</p>
                      <p className="text-sm text-gray-600">{activity.from} → {activity.to}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">₹{activity.fare}</div>
                    <div className="text-xs text-gray-500">{activity.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PassengerDashboard;