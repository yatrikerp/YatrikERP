import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, ArrowRight, Bus, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './MobileBookingChoice.css';

const MobileBookingChoice = () => {
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
    <div className="min-h-screen bg-gray-50 mobile-booking-choice" style={{ width: '100vw', maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Mobile Viewport Container */}
      <div className="w-full max-w-full mx-auto" style={{ maxWidth: '100vw' }}>
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="px-4 py-3">
            <h1 className="text-lg font-bold text-gray-900 text-center truncate">
              Welcome back, {user?.name || 'Traveler'}! 👋
            </h1>
            <p className="text-sm text-gray-600 text-center mt-1">
              What would you like to do?
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 space-y-4">
          {/* Booking Context Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-start space-x-3">
              <div className="bg-pink-100 p-2 rounded-lg flex-shrink-0">
                <Bus className="w-5 h-5 text-pink-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm mb-2">Your Selected Route</h3>
                <div className="space-y-1">
                  <div className="flex items-center text-xs text-gray-600">
                    <MapPin className="w-3 h-3 mr-2 flex-shrink-0" />
                    <span className="truncate">{bookingContext.from} → {bookingContext.to}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <Calendar className="w-3 h-3 mr-2 flex-shrink-0" />
                    <span>{new Date(bookingContext.date).toLocaleDateString('en-IN', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <span className="font-medium text-pink-600">Starting from {bookingContext.fare}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Continue Booking Card */}
          <button
            onClick={handleContinueBooking}
            className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-lg p-4 text-left transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-white/20 w-10 h-10 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold">Continue Booking</h2>
            </div>
            <p className="text-pink-100 text-sm mb-3">
              Proceed with your trip booking for {bookingContext.from} to {bookingContext.to}
            </p>
            <div className="flex items-center text-white font-semibold text-sm">
              Book Now <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </button>

          {/* Go to Dashboard Card */}
          <button
            onClick={handleDashboard}
            className="w-full bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-pink-300 rounded-lg p-4 text-left transition-all duration-300 shadow-sm hover:shadow-lg"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-gray-100 hover:bg-pink-100 w-10 h-10 rounded-lg flex items-center justify-center transition-colors">
                <Home className="w-5 h-5 text-gray-700 group-hover:text-pink-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Go to Dashboard</h2>
            </div>
            <p className="text-gray-600 text-sm mb-3">
              View your bookings, manage trips, and explore more features
            </p>
            <div className="flex items-center text-gray-700 hover:text-pink-600 font-semibold text-sm">
              View Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </button>

          {/* Cancel Option */}
          <div className="text-center pt-2">
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
    </div>
  );
};

export default MobileBookingChoice;
