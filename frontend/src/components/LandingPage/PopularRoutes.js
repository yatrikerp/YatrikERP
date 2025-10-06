import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Clock, MapPin, ArrowRight } from 'lucide-react';

const PopularRoutes = ({ routes }) => {
  const navigate = useNavigate();

  const handleBook = (route) => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    
    // Use tomorrow's date for better trip availability
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const date = `${yyyy}-${mm}-${dd}`;
    
    // Save booking context to localStorage for post-login flow
    const bookingContext = {
      from: route.from || '',
      to: route.to || '',
      date: date,
      routeName: route.routeName || `${route.from} to ${route.to}`,
      fare: route.fare || '',
      source: 'popular_routes_landing',
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('pendingBooking', JSON.stringify(bookingContext));
    localStorage.setItem('fromPopularRoutes', 'true');
    
    // Navigate based on login status
    if (token) {
      // Logged in: Show choice modal (Dashboard or Continue Booking)
      navigate('/booking-choice', { 
        state: { 
          bookingContext,
          fromPopularRoutes: true
        } 
      });
    } else {
      // Not logged in: Go to login with return URL
      navigate(`/login?from=popular_routes&next=/booking-choice`);
    }
  };

  // Always show routes - never show loading state
  const displayRoutes = routes && routes.length > 0 ? routes : [];

  return (
    <div className="popular-routes">
      <h3 className="popular-routes__title">Popular Routes</h3>
      <div className="popular-routes__list">
        {displayRoutes.map((route, index) => (
          <div key={index} className="route-card">
            <div className="route-card__content">
              <div className="route-card__icon">
                <Bus className="w-5 h-5" />
              </div>
              <div className="route-card__info">
                <div className="route-card__route">
                  {route.from} <ArrowRight className="inline w-3 h-3 mx-1" /> {route.to}
                </div>
                <div className="route-card__details">
                  <span className="route-card__frequency">
                    <Clock className="w-3 h-3" />
                    {route.frequency}
                  </span>
                  <span className="route-card__fare">{route.fare}</span>
                </div>
              </div>
            </div>
            <button className="route-card__cta" onClick={() => handleBook(route)}>
              Book
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopularRoutes;
