import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Bus, Clock, MapPin, Star, Filter, SortAsc, SortDesc, Search, Calendar, 
  Wifi, Snowflake, Users, Shield, ArrowLeft, RefreshCw, AlertCircle,
  CheckCircle, Zap, Heart, Eye, BookOpen, Route, TrendingUp, Grid, List
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import './TripResults.css';

const TripResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('departure');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [filters, setFilters] = useState({
    busType: [],
    departureTime: [],
    amenities: [],
    rating: 0,
    priceRange: [0, 1000]
  });

  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const date = searchParams.get('date');
  const tripType = searchParams.get('tripType') || 'oneWay';

  // No mock data - using live database data only

  useEffect(() => {
    searchTrips();
  }, [from, to, date, tripType]);

  const searchTrips = async () => {
    try {
      setLoading(true);
      setError('');

      // Make actual API call to search for trips using passenger API
      const response = await fetch(`/api/passenger/trips/search?${new URLSearchParams({
        from: from,
        to: to,
        date: date
      })}`);
      
      const data = await response.json();
      
      if (data.success && data.data.trips) {
        setTrips(data.data.trips);
        setError('');
      } else {
        setTrips([]);
        setError(data.message || 'No trips found for the specified cities. Please try different cities or dates.');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search trips. Please try again.');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    searchTrips();
  };

  const handleBookNow = (trip) => {
    if (!user) {
      navigate(`/login?next=/pax/booking/${trip.id}`);
      return;
    }
    navigate(`/pax/booking/${trip.id}`);
  };

  const filteredAndSortedTrips = useMemo(() => {
    let filtered = [...trips];

    // Apply filters
    if (filters.busType.length > 0) {
      filtered = filtered.filter(trip => 
        filters.busType.some(type => trip.busType.toLowerCase().includes(type.toLowerCase()))
      );
    }

    if (filters.departureTime.length > 0) {
      filtered = filtered.filter(trip => {
        const hour = parseInt(trip.departure.split(':')[0]);
        return filters.departureTime.some(timeRange => {
          if (timeRange === '06:00 - 12:00') return hour >= 6 && hour < 12;
          if (timeRange === '18:00 - 24:00') return hour >= 18 && hour < 24;
          return true;
        });
      });
    }

    if (filters.amenities.length > 0) {
      filtered = filtered.filter(trip =>
        filters.amenities.some(amenity => 
          trip.amenities.some(a => a.toLowerCase().includes(amenity.toLowerCase()))
        )
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'departure':
        filtered.sort((a, b) => a.departure.localeCompare(b.departure));
        break;
      case 'price':
        filtered.sort((a, b) => a.fare - b.fare);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'duration':
        filtered.sort((a, b) => {
          const aDuration = parseInt(a.duration.split('h')[0]);
          const bDuration = parseInt(b.duration.split('h')[0]);
          return aDuration - bDuration;
        });
        break;
      default:
        break;
    }

    return filtered;
  }, [trips, filters, sortBy]);

  const getBusTypeIcon = (busType) => {
    if (busType.includes('Sleeper')) return <Users className="w-4 h-4" />;
    if (busType.includes('AC')) return <Snowflake className="w-4 h-4" />;
    return <Bus className="w-4 h-4" />;
  };

  const getAmenityIcon = (amenity) => {
    switch (amenity.toLowerCase()) {
      case 'wifi': return <Wifi className="w-3 h-3" />;
      case 'ac': return <Snowflake className="w-3 h-3" />;
      case 'usb charging': return <Zap className="w-3 h-3" />;
      default: return <CheckCircle className="w-3 h-3" />;
    }
  };

  if (loading) {
    return (
      <div className="trip-results-container">
        <div className="loading-container">
          <LoadingSpinner />
          <p>Searching for the best routes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trip-results-container">
      {/* Header */}
      <div className="results-header">
        <div className="header-left">
          <button onClick={() => navigate(-1)} className="back-button">
            <ArrowLeft className="w-4 h-4" />
            Back
                </button>
          <div className="search-info">
            <h1>Search Results</h1>
            <div className="route-info">
              <MapPin className="w-4 h-4" />
              <span>{from} → {to}</span>
              <Calendar className="w-4 h-4" />
              <span>{new Date(date).toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
          </div>
        </div>
        <div className="header-right">
          <div className="view-toggle">
            <button 
              className={viewMode === 'grid' ? 'active' : ''} 
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              className={viewMode === 'list' ? 'active' : ''} 
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
              </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="error-container">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <div className="error-content">
            <h3>No buses found</h3>
            <p>{error}</p>
            <button onClick={handleRetry} className="retry-button">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Success State */}
      {!error && filteredAndSortedTrips.length > 0 && (
        <div className="results-content">
          {/* Filters and Sort */}
          <div className="filters-section">
            <div className="filters-left">
              <div className="filter-group">
                <label>Bus Type:</label>
                <div className="filter-options">
                  {['AC', 'Sleeper', 'Seater'].map(type => (
                    <label key={type} className="filter-option">
                      <input
                        type="checkbox"
                        checked={filters.busType.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({
                              ...prev,
                              busType: [...prev.busType, type]
                            }));
                          } else {
                            setFilters(prev => ({
                              ...prev,
                              busType: prev.busType.filter(t => t !== type)
                            }));
                          }
                        }}
                      />
                      {type}
                  </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="filters-right">
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="departure">Sort by Departure</option>
                <option value="price">Sort by Price</option>
                <option value="rating">Sort by Rating</option>
                <option value="duration">Sort by Duration</option>
                  </select>
                </div>
              </div>

          {/* Results Count */}
          <div className="results-count">
            <p>{filteredAndSortedTrips.length} buses found</p>
            <span className="search-stats">50,000+ searches on this route last month</span>
            </div>

          {/* Trip Cards */}
          <div className={`trips-grid ${viewMode}`}>
            {filteredAndSortedTrips.map((trip) => (
              <div key={trip.id} className="trip-card">
                <div className="trip-header">
                  <div className="trip-route">
                    <h3>{trip.routeName}</h3>
                    <span className="route-number">{trip.routeNumber}</span>
              </div>
                  <div className="trip-rating">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{trip.rating}</span>
                    <span className="reviews">({trip.reviews})</span>
                              </div>
                            </div>
                            
                <div className="trip-details">
                  <div className="time-details">
                    <div className="departure">
                      <span className="time">{trip.departure}</span>
                      <span className="city">{trip.from}</span>
                              </div>
                    <div className="duration">
                      <Route className="w-4 h-4" />
                      <span>{trip.duration}</span>
                            </div>
                    <div className="arrival">
                      <span className="time">{trip.arrival}</span>
                      <span className="city">{trip.to}</span>
                          </div>
                        </div>

                  <div className="bus-info">
                    <div className="bus-type">
                      {getBusTypeIcon(trip.busType)}
                      <span>{trip.busType}</span>
                            </div>
                    <div className="operator">{trip.operator}</div>
                        </div>

                  <div className="amenities">
                    {trip.amenities.slice(0, 3).map((amenity, index) => (
                      <span key={index} className="amenity">
                        {getAmenityIcon(amenity)}
                              {amenity}
                            </span>
                          ))}
                        </div>

                  <div className="features">
                    {trip.features.map((feature, index) => (
                      <span key={index} className="feature-badge">
                        {feature}
                      </span>
                    ))}
                          </div>
                        </div>

                <div className="trip-footer">
                  <div className="price-section">
                    <span className="price">₹{trip.fare}</span>
                    <span className="seats">{trip.availableSeats} seats left</span>
                  </div>
                  <button
                    onClick={() => handleBookNow(trip)}
                    className="book-button"
                  >
                    <BookOpen className="w-4 h-4" />
                    Book Now
                  </button>
                </div>

                {trip.popular && (
                  <div className="popular-badge">
                    <TrendingUp className="w-3 h-3" />
                    Popular
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TripResults;
