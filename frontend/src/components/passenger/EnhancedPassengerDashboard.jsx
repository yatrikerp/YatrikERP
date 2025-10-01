import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, TrendingUp, Clock, MapPin, Users, 
  ArrowRight, Star, Zap, Bus, Wallet, Ticket 
} from 'lucide-react';
import useMobileDetection from '../../hooks/useMobileDetection';
import MobilePassengerDashboardEnhanced from './MobilePassengerDashboardEnhanced';

const EnhancedPassengerDashboard = () => {
  const navigate = useNavigate();
  const { isMobile } = useMobileDetection();
  const [dashboardData, setDashboardData] = useState({
    summary: null,
    scheduledTrips: [],
    popularRoutes: [],
    trendingRoutes: [],
    quickSearchSuggestions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Fetch all dashboard data in parallel
      const [summary, scheduled, popular, trending, suggestions] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/passenger-dashboard/dashboard-summary`, config),
        axios.get(`${process.env.REACT_APP_API_URL}/api/passenger-dashboard/scheduled-trips?limit=8`, config),
        axios.get(`${process.env.REACT_APP_API_URL}/api/passenger-dashboard/popular-routes?limit=6`, config),
        axios.get(`${process.env.REACT_APP_API_URL}/api/passenger-dashboard/trending-routes?limit=4`, config),
        axios.get(`${process.env.REACT_APP_API_URL}/api/passenger-dashboard/quick-search-suggestions?limit=6`, config)
      ]);

      setDashboardData({
        summary: summary.data.data,
        scheduledTrips: scheduled.data.data,
        popularRoutes: popular.data.data,
        trendingRoutes: trending.data.data,
        quickSearchSuggestions: suggestions.data.data
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const handleQuickBook = (trip) => {
    navigate(`/passenger/book-trip/${trip.tripId}`);
  };

  const handleQuickSearch = (suggestion) => {
    navigate('/passenger/search', {
      state: {
        from: suggestion.from,
        to: suggestion.to
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Use mobile dashboard on mobile devices
  if (isMobile) {
    return <MobilePassengerDashboardEnhanced />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome Back!</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Find and book your next journey</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <SummaryCard
            icon={<Ticket className="w-6 h-6" />}
            title="Upcoming Trips"
            value={dashboardData.summary?.upcomingBookings || 0}
            color="blue"
          />
          <SummaryCard
            icon={<Bus className="w-6 h-6" />}
            title="Completed Trips"
            value={dashboardData.summary?.completedTrips || 0}
            color="green"
          />
          <SummaryCard
            icon={<Clock className="w-6 h-6" />}
            title="Available Today"
            value={dashboardData.summary?.availableTripsToday || 0}
            color="purple"
          />
          <SummaryCard
            icon={<Wallet className="w-6 h-6" />}
            title="Wallet Balance"
            value={`₹${dashboardData.summary?.walletBalance || 0}`}
            color="orange"
          />
        </div>

        {/* Quick Search Suggestions */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-yellow-500" />
            Quick Search - Popular Routes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {dashboardData.quickSearchSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleQuickSearch(suggestion)}
                className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group"
              >
                <div className="flex-1 text-left">
                  <div className="flex items-center text-gray-900 font-medium">
                    <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                    {suggestion.from}
                  </div>
                  <div className="flex items-center text-gray-600 text-sm mt-1">
                    <ArrowRight className="w-3 h-3 mr-2" />
                    {suggestion.to}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    From ₹{suggestion.averageFare}
                  </div>
                </div>
                <div className="ml-4">
                  {suggestion.availability === 'available' ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      {suggestion.availableTrips} trips
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      Check dates
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          
          {/* Scheduled Trips */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500" />
              Upcoming Scheduled Trips
            </h2>
            <div className="space-y-3">
              {dashboardData.scheduledTrips.length > 0 ? (
                dashboardData.scheduledTrips.map((trip) => (
                  <div
                    key={trip.tripId}
                    className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => handleQuickBook(trip)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {trip.route.from} → {trip.route.to}
                        </h3>
                        <p className="text-sm text-gray-600">{trip.route.name}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        trip.route.category === 'Express' ? 'bg-purple-100 text-purple-700' :
                        trip.route.category === 'Super Fast' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {trip.route.category}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(trip.schedule.date).toLocaleDateString('en-IN', { 
                          day: 'numeric', 
                          month: 'short' 
                        })} • {trip.schedule.departureTime}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Users className="w-4 h-4 mr-1" />
                        {trip.availability.availableSeats} seats
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <div className="text-sm text-gray-600">
                        {trip.bus.type}
                      </div>
                      <div className="flex items-center">
                        <span className="text-lg font-bold text-gray-900">₹{trip.pricing.currentFare}</span>
                        <button className="ml-3 px-4 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Bus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No scheduled trips available</p>
                  <button 
                    onClick={() => navigate('/passenger/search')}
                    className="mt-4 text-blue-600 hover:underline"
                  >
                    Search for trips
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Popular & Trending Routes */}
          <div>
            {/* Popular Routes */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-yellow-500" />
                Most Popular Routes
              </h2>
              <div className="space-y-3">
                {dashboardData.popularRoutes.slice(0, 4).map((routeData, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="w-6 h-6 rounded-full bg-yellow-500 text-white flex items-center justify-center text-xs font-bold mr-3">
                          #{index + 1}
                        </span>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {routeData.route.from} → {routeData.route.to}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {routeData.popularity.totalBookings} bookings
                          </p>
                        </div>
                      </div>
                    </div>
                    {routeData.nextAvailableTrip && (
                      <button
                        onClick={() => handleQuickBook({ tripId: routeData.nextAvailableTrip.tripId })}
                        className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Book
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Routes */}
            {dashboardData.trendingRoutes.length > 0 && (
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-sm p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-orange-500" />
                  Trending Routes 🔥
                </h2>
                <div className="space-y-3">
                  {dashboardData.trendingRoutes.map((routeData, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {routeData.route.from} → {routeData.route.to}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {routeData.trend.growthRate}% growth this week
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded font-medium ${
                          routeData.trend.trending === 'hot' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {routeData.trend.trending === 'hot' ? '🔥 Hot' : '📈 Rising'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* View All Button */}
        <div className="mt-6 sm:mt-8 text-center">
          <button
            onClick={() => navigate('/passenger/search')}
            className="px-6 sm:px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center text-sm sm:text-base"
          >
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            <span className="hidden sm:inline">Search All Routes & Trips</span>
            <span className="sm:hidden">Search Routes</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ icon, title, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3 sm:mb-4`}>
        <div className="w-5 h-5 sm:w-6 sm:h-6">
          {icon}
        </div>
      </div>
      <h3 className="text-gray-600 text-xs sm:text-sm font-medium leading-tight">{title}</h3>
      <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
};

export default EnhancedPassengerDashboard;

