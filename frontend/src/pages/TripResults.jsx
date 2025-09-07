import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Bus, Clock, MapPin, Star, Filter, SortAsc, SortDesc, Search, Calendar, 
  Wifi, Snowflake, Users, Shield, ArrowLeft, RefreshCw, AlertCircle,
  CheckCircle, Zap, Heart, Eye, BookOpen, Route, TrendingUp, Grid, List
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
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
  const [viewMode, setViewMode] = useState('list'); // grid or list
  const [filters, setFilters] = useState({
    busType: [],
    departureTime: [],
    amenities: [],
    rating: 0,
    priceRange: [0, 1000]
  });

  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
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

      // If from/to provided, use city search; else list all trips for the date
      let res;
      if (from && to) {
        // Try search-proxy first, then fallback to POST search
        res = await apiFetch(`/api/booking/search-proxy?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`);
        
        if (!res.ok && res.status === 404) {
          res = await apiFetch('/api/booking/search', {
            method: 'POST',
            body: JSON.stringify({ from, to, departureDate: date, passengers: 1 })
          });
        }
      } else {
        // List all trips for the date
        res = await apiFetch(`/api/booking/list?date=${encodeURIComponent(date)}`);
        
        if (!res.ok && res.status === 404) {
          res = await apiFetch('/api/booking/search', {
            method: 'POST',
            body: JSON.stringify({ departureDate: date, passengers: 1 })
          });
        }
      }
      if (res.ok) {
        const payload = res.data;
        const rawTrips = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload?.data?.trips) ? payload.data.trips : (Array.isArray(payload?.trips) ? payload.trips : []));

        // Normalize trips coming from admin/depot so UI is consistent
        const normalized = rawTrips.map((t, idx) => {
          const route = t.routeId || t.route || {};
          const bus = t.busId || t.bus || {};
          const operator = t.operator || bus.operatorName || bus.operator || '';
          const startingPoint = route.startingPoint || route.from || {};
          const endingPoint = route.endingPoint || route.to || {};

          const fromCity = typeof startingPoint === 'string' ? startingPoint : (startingPoint.city || startingPoint.location || startingPoint.name || from);
          const toCity = typeof endingPoint === 'string' ? endingPoint : (endingPoint.city || endingPoint.location || endingPoint.name || to);

          const dep = t.startTime || t.departureTime || t.departure || '';
          const arr = t.endTime || t.arrivalTime || t.arrival || '';
          const toHHMM = (time) => {
            if (!time) return '';
            if (typeof time === 'string' && time.length >= 4) {
              return time.slice(0,5);
            }
            return time;
          };

          const duration = (() => {
            if (t.duration) return t.duration;
            // estimate if we have HH:MM strings
            const d = toHHMM(dep);
            const a = toHHMM(arr);
            if (d && a && d.includes(':') && a.includes(':')) {
              const [dh, dm] = d.split(':').map(Number);
              const [ah, am] = a.split(':').map(Number);
              let minutes = (ah * 60 + am) - (dh * 60 + dm);
              if (minutes < 0) minutes += 24 * 60;
              const h = Math.floor(minutes / 60);
              const m = minutes % 60;
              return `${h}h ${m.toString().padStart(2, '0')}m`;
            }
            return '';
          })();

          return {
            id: t._id || t.id || String(idx),
            routeName: route.routeName || route.name || `${fromCity} → ${toCity}`,
            routeNumber: route.routeNumber || route.code || route.number || '',
            from: fromCity,
            to: toCity,
            departure: toHHMM(dep),
            arrival: toHHMM(arr),
            duration,
            busType: bus.busType || t.busType || '',
            operator,
            amenities: Array.isArray(bus.amenities) ? bus.amenities : (Array.isArray(t.amenities) ? t.amenities : []),
            features: Array.isArray(route.features) ? route.features : (Array.isArray(t.features) ? t.features : []),
            fare: Number(t.fare || t.baseFare || t.pricing?.baseFare || 0),
            availableSeats: Number(t.availableSeats || t.seatsAvailable || bus.availableSeats || 0),
            rating: typeof t.rating === 'number' ? t.rating : undefined,
            reviews: typeof t.reviews === 'number' ? t.reviews : undefined
          };
        });

        setTrips(normalized);
        setError('');
      } else {
        setTrips([]);
        setError(res.message || 'No routes found for the specified cities. Please try different cities or dates.');
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
    // Store trip data in sessionStorage for seat selection page
    sessionStorage.setItem('selectedTrip', JSON.stringify(trip));
    
    if (!user) {
      navigate(`/login?next=/seat-selection/${trip.id}`);
      return;
    }
    navigate(`/seat-selection/${trip.id}`);
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
        <div className="results-content">
          <div className="empty-state">
            <div className="empty-hero">
              <AlertCircle className="w-10 h-10" color="#E91E63" />
            </div>
            <div className="empty-title">No trips found for your selection</div>
            <div className="empty-text">{error || 'Try a nearby city pair or choose another date. Make sure trips are scheduled and booking is open.'}</div>
            <button onClick={handleRetry} className="empty-cta">Refresh Results</button>
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

          {/* Toolbar + Count */}
          <div className="results-toolbar">
            <div className="pill-group">
              <button className={`pill ${viewMode==='list'?'active':''}`} onClick={()=>setViewMode('list')}>List</button>
              <button className={`pill ${viewMode==='grid'?'active':''}`} onClick={()=>setViewMode('grid')}>Grid</button>
            </div>
            <div className="results-count"><p>{filteredAndSortedTrips.length} trips</p></div>
          </div>

          {/* Trip Cards */}
          <div className={`trips-grid ${viewMode}`}>
            {filteredAndSortedTrips.map((trip) => (
              <div key={trip.id} className="trip-card">
                <div className="trip-header">
                  <div className="trip-route">
                    <h3>{trip.routeName}</h3>
                    {trip.routeNumber && <span className="route-number">{trip.routeNumber}</span>}
                  </div>
                  {typeof trip.rating === 'number' && (
                    <div className="trip-rating">
                      <Star className="w-4 h-4 fill-current" />
                      <span>{trip.rating}</span>
                      {typeof trip.reviews === 'number' && (
                        <span className="reviews">({trip.reviews})</span>
                      )}
                    </div>
                  )}
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
                      {getBusTypeIcon(trip.busType || '')}
                      <span>{trip.busType || '—'}</span>
                    </div>
                    {trip.operator && <div className="operator">{trip.operator}</div>}
                  </div>

                  {Array.isArray(trip.amenities) && trip.amenities.length > 0 && (
                    <div className="amenities">
                      {trip.amenities.slice(0, 3).map((amenity, index) => (
                        <span key={index} className="amenity">
                          {getAmenityIcon(amenity)}
                          {amenity}
                        </span>
                      ))}
                    </div>
                  )}

                  {Array.isArray(trip.features) && trip.features.length > 0 && (
                    <div className="features">
                      {trip.features.map((feature, index) => (
                        <span key={index} className="feature-badge">
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="trip-footer">
                  <div className="price-section">
                    <span className="price">₹{trip.fare}</span>
                    <span className="seats">{trip.availableSeats} seats left</span>
                  </div>
                  <button
                    onClick={() => handleBookNow(trip)}
                    className="book-button"
                    aria-label="Select seats for this trip"
                    title="Select seats"
                  >
                    <BookOpen className="w-4 h-4" />
                    Select Seats
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TripResults;
