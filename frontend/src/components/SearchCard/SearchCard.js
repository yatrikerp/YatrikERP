import React, { useState, useEffect } from 'react';
import { Bus, Link, MapPin, Calendar, Search, ArrowRight, Clock, Users, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './search-card.css';

const SearchCard = ({ onSearchResults, showResults = false }) => {
  const [activeTab, setActiveTab] = useState('book');
  const [tripType, setTripType] = useState('oneWay');
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    journeyDate: '',
    returnDate: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [popularRoutes, setPopularRoutes] = useState([]);

  // Load cities and popular routes on component mount
  useEffect(() => {
    loadCities();
    loadPopularRoutes();
  }, []);

  const loadCities = async () => {
    try {
      const response = await fetch('/api/booking/cities');
      if (response.ok) {
        const data = await response.json();
        setCities(data.data.cities || []);
      }
    } catch (error) {
      console.error('Failed to load cities:', error);
    }
  };

  const loadPopularRoutes = async () => {
    try {
      const response = await fetch('/api/booking/popular-routes');
      if (response.ok) {
        const data = await response.json();
        setPopularRoutes(data.data.routes || []);
      }
    } catch (error) {
      console.error('Failed to load popular routes:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.from || !formData.to || !formData.journeyDate) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    
    try {
      const queryParams = new URLSearchParams({
        from: formData.from,
        to: formData.to,
        date: formData.journeyDate,
        tripType: tripType
      });

      if (tripType === 'roundTrip' && formData.returnDate) {
        queryParams.append('returnDate', formData.returnDate);
      }

      const response = await fetch(`/api/booking/search?${queryParams}`);
      const data = await response.json();

      if (data.ok) {
        setSearchResults(data.data.trips || []);
        if (onSearchResults) {
          onSearchResults(data.data.trips);
        }
        toast.success(`Found ${data.data.trips.length} trips`);
      } else {
        toast.error(data.message || 'Search failed');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = (city, field) => {
    setFormData(prev => ({ ...prev, [field]: city }));
  };

  const handleQuickRoute = (from, to) => {
    setFormData(prev => ({ ...prev, from, to }));
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time.length === 5 ? time : time.slice(0, 5);
  };

  const formatDuration = (duration) => {
    if (!duration) return '';
    return duration;
  };

  return (
    <div className="searchCard">
      {/* Tabs */}
      <div className="tabs">
        <button
          onClick={() => setActiveTab('book')}
          className={`tab ${activeTab === 'book' ? 'tab--active' : ''}`}
        >
          <Bus className="tab__icon" />
          <span className="hide-sm">Book Bus Ticket</span>
          <span className="show-sm">Book</span>
        </button>
        <button
          onClick={() => setActiveTab('link')}
          className={`tab ${activeTab === 'link' ? 'tab--active' : ''}`}
        >
          <Link className="tab__icon" />
          <span className="hide-sm">Link Ticket</span>
          <span className="show-sm">Link</span>
        </button>
      </div>

      {/* Trip Type Toggle */}
      <div className="toggle">
        <button
          onClick={() => setTripType('oneWay')}
          className={`toggle__btn ${tripType === 'oneWay' ? 'is-active' : ''}`}
        >
          One Way
        </button>
        <button
          onClick={() => setTripType('roundTrip')}
          className={`toggle__btn ${tripType === 'roundTrip' ? 'is-active' : ''}`}
        >
          Round Trip
        </button>
      </div>

      <form onSubmit={handleSubmit} className="form">
        {/* From Location */}
        <div>
          <label className="label">
            From
          </label>
          <div className="field">
            <MapPin className="field__icon" />
            <input
              type="text"
              value={formData.from}
              onChange={(e) => setFormData({...formData, from: e.target.value})}
              placeholder="Enter departure location"
              className="input"
              required
              list="cities-from"
            />
            <datalist id="cities-from">
              {cities.map((city, index) => (
                <option key={index} value={city} />
              ))}
            </datalist>
          </div>
        </div>

        {/* To Location */}
        <div>
          <label className="label">
            To
          </label>
          <div className="field">
            <MapPin className="field__icon" />
            <input
              type="text"
              value={formData.to}
              onChange={(e) => setFormData({...formData, to: e.target.value})}
              placeholder="Enter destination location"
              className="input"
              required
              list="cities-to"
            />
            <datalist id="cities-to">
              {cities.map((city, index) => (
                <option key={index} value={city} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Date Fields */}
        <div className="row-2">
          <div>
            <label className="label">
              Journey Date
            </label>
            <div className="field">
              <Calendar className="field__icon" />
              <input
                type="date"
                value={formData.journeyDate}
                onChange={(e) => setFormData({...formData, journeyDate: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                className="input"
                required
              />
            </div>
          </div>

          {tripType === 'roundTrip' && (
            <div>
              <label className="label">
                Return Date
              </label>
              <div className="field">
                <Calendar className="field__icon" />
                <input
                  type="date"
                  value={formData.returnDate}
                  onChange={(e) => setFormData({...formData, returnDate: e.target.value})}
                  min={formData.journeyDate || new Date().toISOString().split('T')[0]}
                  className="input"
                  required
                />
              </div>
            </div>
          )}
        </div>

        {/* Search Button */}
        <button type="submit" className="btnSearch" disabled={loading}>
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Searching...
            </>
          ) : (
            <>
              <Search className="btnSearch__icon" />
              Search buses
            </>
          )}
        </button>
      </form>

      {/* Popular Routes Suggestions */}
      {popularRoutes.length > 0 && (
        <div className="popular-routes">
          <h4 className="popular-routes__title">Popular Routes</h4>
          <div className="popular-routes__grid">
            {popularRoutes.slice(0, 6).map((route, index) => (
              <button
                key={index}
                onClick={() => handleQuickRoute(route.from, route.to)}
                className="popular-route"
              >
                <div className="popular-route__cities">
                  <span>{route.from}</span>
                  <ArrowRight className="w-4 h-4" />
                  <span>{route.to}</span>
                </div>
                <div className="popular-route__details">
                  <span className="popular-route__fare">₹{route.fare}</span>
                  <span className="popular-route__distance">{route.distance}km</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {showResults && searchResults.length > 0 && (
        <div className="search-results">
          <h4 className="search-results__title">Available Trips ({searchResults.length})</h4>
          <div className="search-results__list">
            {searchResults.map((trip, index) => (
              <div key={index} className="trip-card">
                <div className="trip-card__header">
                  <div className="trip-card__route">
                    <h5>{trip.routeName}</h5>
                    <p className="trip-card__depot">{trip.depot}</p>
                  </div>
                  <div className="trip-card__price">
                    <span className="trip-card__fare">₹{trip.fare}</span>
                    <span className="trip-card__seats">{trip.availableSeats} seats</span>
                  </div>
                </div>
                
                <div className="trip-card__details">
                  <div className="trip-card__time">
                    <div className="trip-card__departure">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(trip.departure)}</span>
                    </div>
                    <div className="trip-card__duration">
                      <span>{formatDuration(trip.duration)}</span>
                    </div>
                    <div className="trip-card__arrival">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(trip.arrival)}</span>
                    </div>
                  </div>
                  
                  <div className="trip-card__info">
                    <div className="trip-card__bus">
                      <Bus className="w-4 h-4" />
                      <span>{trip.busType}</span>
                    </div>
                    <div className="trip-card__amenities">
                      {trip.amenities?.map((amenity, idx) => (
                        <span key={idx} className="amenity-tag">{amenity}</span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="trip-card__actions">
                  <button className="btn-book">
                    Book Now
                  </button>
                  <button className="btn-details">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {showResults && searchResults.length === 0 && !loading && (
        <div className="no-results">
          <p>No trips found for the selected criteria.</p>
          <p>Try adjusting your search parameters or check back later.</p>
        </div>
      )}
    </div>
  );
};

export default SearchCard;
