import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, ArrowRight, Bus, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BookingChoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [bookingContext, setBookingContext] = useState(null);

  useEffect(() => {
    // Get booking context from state or localStorage
    const contextFromState = location.state?.bookingContext;
    const contextFromStorage = localStorage.getItem('pendingBooking');
    
    if (contextFromState) {
      setBookingContext(contextFromState);
    } else if (contextFromStorage) {
      setBookingContext(JSON.parse(contextFromStorage));
    } else {
      // No booking context, redirect to home
      navigate('/');
    }
  }, [location, navigate]);

  const handleDashboard = () => {
    // Clear pending booking
    localStorage.removeItem('pendingBooking');
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

  if (!bookingContext) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 overflow-x-hidden">
      <div className="w-full max-w-full px-3 py-6">
        {/* Welcome Message */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-900 mb-2 truncate">
            Welcome back, {user?.name || 'Traveler'}! 👋
          </h1>
          <p className="text-sm text-gray-600">
            You're logged in successfully. What would you like to do?
          </p>
        </div>

        {/* Booking Context Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="bg-pink-100 p-2 rounded-lg flex-shrink-0">
                <Bus className="w-5 h-5 text-pink-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">Your Selected Route</h3>
                <div className="flex items-center text-xs text-gray-600 mt-1">
                  <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{bookingContext.from} → {bookingContext.to}</span>
                </div>
                <div className="flex items-center text-xs text-gray-600 mt-1">
                  <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span>{new Date(bookingContext.date).toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}</span>
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <div className="text-xs text-gray-500">Starting from</div>
              <div className="text-sm font-bold text-pink-600">{bookingContext.fare}</div>
            </div>
          </div>
        </div>

        {/* Choice Cards */}
        <div className="space-y-4">
          {/* Continue Booking */}
          <button
            onClick={handleContinueBooking}
            className="group bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-lg p-4 text-left transition-all duration-300 w-full shadow-lg hover:shadow-xl"
          >
            <div className="bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold mb-2">Continue Booking</h2>
            <p className="text-pink-100 mb-4 text-sm">
              Proceed with your trip booking for {bookingContext.from} to {bookingContext.to}
            </p>
            <div className="flex items-center text-white font-semibold text-sm">
              Book Now <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </button>

          {/* Go to Dashboard */}
          <button
            onClick={handleDashboard}
            className="group bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-pink-300 rounded-lg p-4 text-left transition-all duration-300 w-full shadow-sm hover:shadow-lg"
          >
            <div className="bg-gray-100 group-hover:bg-pink-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors">
              <Home className="w-6 h-6 text-gray-700 group-hover:text-pink-600 transition-colors" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Go to Dashboard</h2>
            <p className="text-gray-600 mb-4 text-sm">
              View your bookings, manage trips, and explore more features
            </p>
            <div className="flex items-center text-gray-700 group-hover:text-pink-600 font-semibold text-sm">
              View Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </button>
        </div>

        {/* Skip Option */}
        <div className="text-center mt-4">
          <button
            onClick={() => {
              localStorage.removeItem('pendingBooking');
              navigate('/');
            }}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Cancel and go back to home
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingChoice;

