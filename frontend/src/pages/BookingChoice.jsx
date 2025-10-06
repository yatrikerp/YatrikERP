import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, ArrowRight, Bus, Calendar, MapPin, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BookingChoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [bookingContext, setBookingContext] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only show this page if coming from popular routes
    const referrer = document.referrer;
    const fromPopularRoutes = location.state?.fromPopularRoutes || 
                             localStorage.getItem('fromPopularRoutes') === 'true' ||
                             referrer.includes('popular') ||
                             location.search.includes('from=popular_routes');
    
    if (!fromPopularRoutes) {
      // Not from popular routes, redirect to dashboard
      navigate('/passenger/dashboard');
      return;
    }

    // Get booking context from state or localStorage
    const contextFromState = location.state?.bookingContext;
    const contextFromStorage = localStorage.getItem('pendingBooking');
    
    if (contextFromState) {
      setBookingContext(contextFromState);
      setIsLoading(false);
    } else if (contextFromStorage) {
      setBookingContext(JSON.parse(contextFromStorage));
      setIsLoading(false);
    } else {
      // No booking context, redirect to home
      navigate('/');
    }
  }, [location, navigate]);

  const handleDashboard = () => {
    // Clear pending booking and popular routes flag
    localStorage.removeItem('pendingBooking');
    localStorage.removeItem('fromPopularRoutes');
    // Navigate to passenger dashboard
    navigate('/passenger/dashboard');
  };

  const handleContinueBooking = () => {
    if (!bookingContext) return;

    // Keep booking context for the flow
    // Navigate to trip search/results
    const params = new URLSearchParams({
      from: bookingContext.from,
      to: bookingContext.to,
      date: bookingContext.date
    });
    
    navigate(`/passenger/results?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-pink-200 border-t-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your booking options...</p>
        </div>
      </div>
    );
  }

  if (!bookingContext) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Bus className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Booking Found</h2>
          <p className="text-gray-600 mb-4">We couldn't find your selected route.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 overflow-x-hidden relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-20 h-20 bg-pink-300 rounded-full"></div>
        <div className="absolute top-32 right-16 w-16 h-16 bg-purple-300 rounded-full"></div>
        <div className="absolute bottom-20 left-20 w-12 h-12 bg-pink-400 rounded-full"></div>
        <div className="absolute bottom-32 right-10 w-24 h-24 bg-purple-200 rounded-full"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-4">
        {/* Welcome Message */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name || 'Traveler'}! 👋
          </h1>
          <p className="text-gray-600 leading-relaxed">
            You're logged in successfully. What would you like to do?
          </p>
        </div>

        {/* Booking Context Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6 transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              <div className="bg-gradient-to-br from-pink-100 to-purple-100 p-3 rounded-xl flex-shrink-0 shadow-sm">
                <Bus className="w-6 h-6 text-pink-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-gray-900 text-lg mb-2">Your Selected Route</h3>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <MapPin className="w-4 h-4 mr-2 flex-shrink-0 text-pink-500" />
                  <span className="truncate font-medium">{bookingContext.from} → {bookingContext.to}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2 flex-shrink-0 text-purple-500" />
                  <span className="font-medium">{new Date(bookingContext.date).toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}</span>
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <div className="text-xs text-gray-500 mb-1">Starting from</div>
              <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
                {bookingContext.fare}
              </div>
            </div>
          </div>
        </div>

        {/* Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Continue Booking */}
          <button
            onClick={handleContinueBooking}
            className="group bg-gradient-to-br from-pink-500 via-pink-600 to-purple-600 hover:from-pink-600 hover:via-pink-700 hover:to-purple-700 text-white rounded-2xl p-6 text-left transition-all duration-300 w-full shadow-xl hover:shadow-2xl transform hover:scale-105 relative overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full"></div>
              <div className="absolute bottom-4 left-4 w-6 h-6 bg-white rounded-full"></div>
            </div>
            
            <div className="relative z-10">
              <div className="bg-white/20 backdrop-blur-sm w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/30 transition-all duration-300 shadow-lg">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Continue Booking</h2>
              <p className="text-pink-100 mb-6 text-base leading-relaxed">
                Proceed with your trip booking for <span className="font-semibold">{bookingContext.from} to {bookingContext.to}</span>
              </p>
              <div className="flex items-center text-white font-bold text-lg">
                Book Now <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          {/* Go to Dashboard */}
          <button
            onClick={handleDashboard}
            className="group bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-pink-300 rounded-2xl p-6 text-left transition-all duration-300 w-full shadow-lg hover:shadow-xl transform hover:scale-105 relative overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-4 right-4 w-8 h-8 bg-pink-300 rounded-full"></div>
              <div className="absolute bottom-4 left-4 w-6 h-6 bg-purple-300 rounded-full"></div>
            </div>
            
            <div className="relative z-10">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-pink-100 group-hover:to-purple-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 shadow-lg">
                <Home className="w-8 h-8 text-gray-700 group-hover:text-pink-600 transition-colors" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Go to Dashboard</h2>
              <p className="text-gray-600 mb-6 text-base leading-relaxed">
                View your bookings, manage trips, and explore more features
              </p>
              <div className="flex items-center text-gray-700 group-hover:text-pink-600 font-bold text-lg">
                View Dashboard <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>
        </div>

        {/* Skip Option */}
        <div className="text-center mt-8">
          <button
            onClick={() => {
              localStorage.removeItem('pendingBooking');
              localStorage.removeItem('fromPopularRoutes');
              navigate('/');
            }}
            className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors duration-200"
          >
            Cancel and go back to home
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingChoice;

