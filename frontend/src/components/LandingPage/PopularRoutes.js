import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Clock, MapPin, ArrowRight } from 'lucide-react';

const PopularRoutes = ({ routes }) => {
  const navigate = useNavigate();

  const handleBook = (route) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const date = `${yyyy}-${mm}-${dd}`;
    const params = new URLSearchParams({ from: route.from || '', to: route.to || '', date });
    navigate(`/redbus-results?${params.toString()}`);
  };

  return (
    <div className="popular-routes">
      <h3 className="popular-routes__title">Popular Routes</h3>
      <div className="popular-routes__list">
        {routes.map((route, index) => (
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
