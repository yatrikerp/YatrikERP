import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Users, Clock, Bus, Star, Filter } from 'lucide-react';
import './TripSearch.css';

const TripSearch = () => {
  const navigate = useNavigate();
  const [searchData, setSearchData] = useState({
    from: '',
    to: '',
    date: '',
    passengers: 1,
    tripType: 'oneWay'
  });
  
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState({ from: [], to: [] });
  const [showSuggestions, setShowSuggestions] = useState({ from: false, to: false });
  const [filters, setFilters] = useState({
    priceRange: [0, 2000],
    busType: 'all',
    departureTime: 'all',
    amenities: []
  });

  const fromInputRef = useRef(null);
  const toInputRef = useRef(null);

  // Popular cities for quick selection
  const popularCities = [
    'Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Alappuzha', 'Kollam', 'Thrissur', 'Kottayam', 'Palakkad'
  ];

  // Bus types for filtering
  const busTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'ac_sleeper', label: 'AC Sleeper' },
    { value: 'ac_seater', label: 'AC Seater' },
    { value: 'non_ac_sleeper', label: 'Non-AC Sleeper' },
    { value: 'non_ac_seater', label: 'Non-AC Seater' }
  ];

  // Amenities for filtering
  const availableAmenities = [
    'wifi', 'charging', 'ac', 'refreshments', 'toilet', 'entertainment'
  ];

  useEffect(() => {
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSearchData(prev => ({
      ...prev,
      date: tomorrow.toISOString().split('T')[0]
    }));
  }, []);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setSearchData(prev => ({ ...prev, [field]: value }));
    
    // Show suggestions for from/to fields
    if ((field === 'from' || field === 'to') && value.length >= 1) {
      fetchSuggestions(field, value);
      setShowSuggestions(prev => ({ ...prev, [field]: true }));
    } else if ((field === 'from' || field === 'to') && value.length === 0) {
      setShowSuggestions(prev => ({ ...prev, [field]: false }));
    }
  };

  // Fetch autocomplete suggestions
  const fetchSuggestions = async (field, query) => {
    try {
      const response = await fetch(`/api/booking/autocomplete?query=${query}&type=${field}`);
      const data = await response.json();
      
      if (data.ok) {
        setSuggestions(prev => ({
          ...prev,
          [field]: data.data.suggestions.slice(0, 5)
        }));
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  // Handle suggestion selection
  const selectSuggestion = (field, suggestion) => {
    setSearchData(prev => ({
      ...prev,
      [field]: suggestion.city
    }));
    setShowSuggestions(prev => ({ ...prev, [field]: false }));
    
    // Focus on next input
    if (field === 'from') {
      toInputRef.current?.focus();
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchData.from || !searchData.to || !searchData.date) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/booking/search?${new URLSearchParams({
        from: searchData.from,
        to: searchData.to,
        date: searchData.date,
        tripType: searchData.tripType
      })}`);
      
      const data = await response.json();
      
      if (data.ok) {
        setSearchResults(data.data.trips || []);
      } else {
        setSearchResults([]);
        alert(data.message || 'No trips found');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to search trips');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const applyFilters = (trips) => {
    return trips.filter(trip => {
      // Price filter
      if (trip.fare.current < filters.priceRange[0] || trip.fare.current > filters.priceRange[1]) {
        return false;
      }
      
      // Bus type filter
      if (filters.busType !== 'all' && trip.bus.type !== filters.busType) {
        return false;
      }
      
      // Amenities filter
      if (filters.amenities.length > 0) {
        const hasAllAmenities = filters.amenities.every(amenity => 
          trip.bus.amenities.includes(amenity)
        );
        if (!hasAllAmenities) return false;
      }
      
      return true;
    });
  };

  // Get filtered results
  const filteredResults = applyFilters(searchResults);

  // Handle quick city selection
  const selectQuickCity = (field, city) => {
    setSearchData(prev => ({ ...prev, [field]: city }));
    setShowSuggestions(prev => ({ ...prev, [field]: false }));
  };

  return (
    <div className="trip-search-container">
      {/* Search Form */}
      <div className="search-form">
        <div className="search-header">
          <h2>Search Bus Tickets</h2>
          <p>Find and book your perfect journey</p>
        </div>

        <div className="search-inputs">
          {/* From Location */}
          <div className="input-group">
            <label htmlFor="from">From</label>
            <div className="input-with-suggestions">
              <div className="input-wrapper">
                <MapPin className="input-icon" />
                <input
                  ref={fromInputRef}
                  type="text"
                  id="from"
                  placeholder="Enter departure city"
                  value={searchData.from}
                  onChange={(e) => handleInputChange('from', e.target.value)}
                  onFocus={() => setShowSuggestions(prev => ({ ...prev, from: true }))}
                />
              </div>
              
              {/* From Suggestions */}
              {showSuggestions.from && (
                <div className="suggestions-dropdown">
                  {suggestions.from.length > 0 ? (
                    suggestions.from.map((suggestion, index) => (
                      <div
                        key={index}
                        className="suggestion-item"
                        onClick={() => selectSuggestion('from', suggestion)}
                      >
                        <MapPin className="suggestion-icon" />
                        <div className="suggestion-content">
                          <div className="suggestion-city">{suggestion.city}</div>
                          <div className="suggestion-location">{suggestion.location}</div>
                          <div className="suggestion-routes">{suggestion.totalRoutes} routes available</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="suggestion-item no-results">
                      <div>No suggestions found</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* To Location */}
          <div className="input-group">
            <label htmlFor="to">To</label>
            <div className="input-with-suggestions">
              <div className="input-wrapper">
                <MapPin className="input-icon" />
                <input
                  ref={toInputRef}
                  type="text"
                  id="to"
                  placeholder="Enter destination city"
                  value={searchData.to}
                  onChange={(e) => handleInputChange('to', e.target.value)}
                  onFocus={() => setShowSuggestions(prev => ({ ...prev, to: true }))}
                />
              </div>
              
              {/* To Suggestions */}
              {showSuggestions.to && (
                <div className="suggestions-dropdown">
                  {suggestions.to.length > 0 ? (
                    suggestions.to.map((suggestion, index) => (
                      <div
                        key={index}
                        className="suggestion-item"
                        onClick={() => selectSuggestion('to', suggestion)}
                      >
                        <MapPin className="suggestion-icon" />
                        <div className="suggestion-content">
                          <div className="suggestion-city">{suggestion.city}</div>
                          <div className="suggestion-location">{suggestion.location}</div>
                          <div className="suggestion-routes">{suggestion.totalRoutes} routes available</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="suggestion-item no-results">
                      <div>No suggestions found</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="input-group">
            <label htmlFor="date">Date of Journey</label>
            <div className="input-wrapper">
              <Calendar className="input-icon" />
              <input
                type="date"
                id="date"
                value={searchData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Passengers */}
          <div className="input-group">
            <label htmlFor="passengers">Passengers</label>
            <div className="input-wrapper">
              <Users className="input-icon" />
              <select
                id="passengers"
                value={searchData.passengers}
                onChange={(e) => handleInputChange('passengers', parseInt(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <option key={num} value={num}>{num} {num === 1 ? 'Passenger' : 'Passengers'}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quick City Selection */}
        <div className="quick-cities">
          <label>Quick Select:</label>
          <div className="city-buttons">
            {popularCities.map(city => (
              <button
                key={city}
                type="button"
                className="city-btn"
                onClick={() => {
                  if (!searchData.from) {
                    selectQuickCity('from', city);
                  } else if (!searchData.to) {
                    selectQuickCity('to', city);
                  }
                }}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Search Button */}
        <button
          className="search-btn"
          onClick={handleSearch}
          disabled={loading || !searchData.from || !searchData.to || !searchData.date}
        >
          {loading ? (
            <div className="loading-spinner"></div>
          ) : (
            <>
              <Search className="search-icon" />
              Search Buses
            </>
          )}
        </button>
      </div>

      {/* Filters */}
      {searchResults.length > 0 && (
        <div className="search-filters">
          <div className="filters-header">
            <Filter className="filter-icon" />
            <h3>Filters</h3>
          </div>
          
          <div className="filters-content">
            {/* Price Range */}
            <div className="filter-group">
              <label>Price Range (₹)</label>
              <div className="price-range">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.priceRange[0]}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    priceRange: [parseInt(e.target.value) || 0, prev.priceRange[1]]
                  }))}
                />
                <span>to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.priceRange[1]}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    priceRange: [prev.priceRange[0], parseInt(e.target.value) || 2000]
                  }))}
                />
              </div>
            </div>

            {/* Bus Type */}
            <div className="filter-group">
              <label>Bus Type</label>
              <select
                value={filters.busType}
                onChange={(e) => setFilters(prev => ({ ...prev, busType: e.target.value }))}
              >
                {busTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Amenities */}
            <div className="filter-group">
              <label>Amenities</label>
              <div className="amenities-checkboxes">
                {availableAmenities.map(amenity => (
                  <label key={amenity} className="amenity-checkbox">
                    <input
                      type="checkbox"
                      checked={filters.amenities.includes(amenity)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({
                            ...prev,
                            amenities: [...prev.amenities, amenity]
                          }));
                        } else {
                          setFilters(prev => ({
                            ...prev,
                            amenities: prev.amenities.filter(a => a !== amenity)
                          }));
                        }
                      }}
                    />
                    <span className="amenity-label">{amenity.charAt(0).toUpperCase() + amenity.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="search-results">
          <div className="results-header">
            <h3>Found {filteredResults.length} trips</h3>
            <div className="results-summary">
              <span>From: {searchData.from}</span>
              <span>To: {searchData.to}</span>
              <span>Date: {new Date(searchData.date).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="trips-list">
            {filteredResults.map((trip, index) => (
              <div key={index} className="trip-card">
                <div className="trip-header">
                  <div className="trip-route">
                    <h4>{trip.route.name}</h4>
                    <span className="trip-number">{trip.tripNumber}</span>
                  </div>
                  <div className="trip-price">
                    <span className="price-amount">₹{trip.fare.current}</span>
                    {trip.fare.discount > 0 && (
                      <span className="price-discount">Save ₹{trip.fare.discount}</span>
                    )}
                  </div>
                </div>

                <div className="trip-details">
                  <div className="trip-timing">
                    <div className="departure">
                      <Clock className="timing-icon" />
                      <div>
                        <span className="time">{trip.departure}</span>
                        <span className="city">{trip.from}</span>
                      </div>
                    </div>
                    
                    <div className="journey-info">
                      <div className="duration">{trip.duration}</div>
                      <div className="distance">{trip.distance} km</div>
                    </div>
                    
                    <div className="arrival">
                      <Clock className="timing-icon" />
                      <div>
                        <span className="time">{trip.arrival}</span>
                        <span className="city">{trip.to}</span>
                      </div>
                    </div>
                  </div>

                  <div className="trip-bus-info">
                    <div className="bus-details">
                      <Bus className="bus-icon" />
                      <div>
                        <span className="bus-number">{trip.bus.number}</span>
                        <span className="bus-type">{trip.bus.type}</span>
                      </div>
                    </div>
                    
                    <div className="seat-availability">
                      <span className="available-seats">{trip.seatAvailability.available} seats available</span>
                      <span className="total-seats">out of {trip.seatAvailability.total}</span>
                    </div>
                  </div>

                  <div className="trip-amenities">
                    {trip.bus.amenities.map((amenity, idx) => (
                      <span key={idx} className="amenity-tag">{amenity}</span>
                    ))}
                  </div>
                </div>

                <div className="trip-actions">
                  <button className="view-seats-btn">View Seats</button>
                  <button 
                    className="book-now-btn"
                    onClick={() => {
                      const id = trip?.id || trip?._id || trip?.tripId;
                      if (id) navigate(`/pax/board-drop/${id}`, { state: { trip: trip } });
                    }}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredResults.length === 0 && (
            <div className="no-results">
              <p>No trips match your current filters. Try adjusting your search criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* No Results Message */}
      {searchResults.length === 0 && !loading && (
        <div className="no-search-results">
          <div className="no-results-icon">🚌</div>
          <h3>Ready to Search?</h3>
          <p>Enter your journey details above to find available bus trips</p>
        </div>
      )}
    </div>
  );
};

export default TripSearch;
