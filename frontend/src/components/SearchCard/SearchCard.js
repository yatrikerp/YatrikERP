import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Link, MapPin, Calendar, Search, Clock, Navigation } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './search-card.css';
import useMobileDetection from '../../hooks/useMobileDetection';
import MobileSearchCard from './MobileSearchCard';

const SearchCard = ({ onSearchResults, showResults = false }) => {
  const { isMobile } = useMobileDetection();
  const [activeTab, setActiveTab] = useState('book');
  const [tripType, setTripType] = useState('oneWay');
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    journeyDate: '',
    returnDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  
  // Autocomplete states
  const [suggestions, setSuggestions] = useState({ from: [], to: [] });
  const [showSuggestions, setShowSuggestions] = useState({ from: false, to: false });
  const [selectedIndex, setSelectedIndex] = useState({ from: -1, to: -1 });
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState({ from: false, to: false });
  
  // Refs
  const fromInputRef = useRef(null);
  const toInputRef = useRef(null);
  const suggestionTimeoutRef = useRef(null);
  const navigate = useNavigate();

  // Load cities on component mount
  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const response = await fetch('/api/routes/cities');
      if (response.ok) {
        const data = await response.json();
        setCities(data.data.cities || []);
      }
    } catch (error) {
      console.error('Failed to load cities:', error);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback((query, field) => {
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }
    
    suggestionTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(query, field);
    }, 300);
  }, []);

  // Fetch autocomplete suggestions
  const fetchSuggestions = async (query, field) => {
    if (!query || query.length < 1) {
      setSuggestions(prev => ({ ...prev, [field]: [] }));
      setShowSuggestions(prev => ({ ...prev, [field]: false }));
      return;
    }

    setIsLoadingSuggestions(prev => ({ ...prev, [field]: true }));

    try {
      const response = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuggestions(prev => ({ ...prev, [field]: data.data.suggestions }));
          setShowSuggestions(prev => ({ ...prev, [field]: true }));
          setSelectedIndex(prev => ({ ...prev, [field]: -1 }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setIsLoadingSuggestions(prev => ({ ...prev, [field]: false }));
    }
  };

  // Handle input change with autocomplete
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (value.length >= 1) {
      debouncedSearch(value, field);
    } else {
      setSuggestions(prev => ({ ...prev, [field]: [] }));
      setShowSuggestions(prev => ({ ...prev, [field]: false }));
    }
  };

  // Handle suggestion selection
  const selectSuggestion = (suggestion, field) => {
    setFormData(prev => ({ ...prev, [field]: suggestion.city }));
    setShowSuggestions(prev => ({ ...prev, [field]: false }));
    setSelectedIndex(prev => ({ ...prev, [field]: -1 }));
    
    // Focus on next input
    if (field === 'from') {
      toInputRef.current?.focus();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e, field) => {
    const currentSuggestions = suggestions[field];
    const currentIndex = selectedIndex[field];
    
    if (!showSuggestions[field] || currentSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => ({
          ...prev,
          [field]: Math.min(currentIndex + 1, currentSuggestions.length - 1)
        }));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => ({
          ...prev,
          [field]: Math.max(currentIndex - 1, -1)
        }));
        break;
      case 'Enter':
        e.preventDefault();
        if (currentIndex >= 0 && currentIndex < currentSuggestions.length) {
          selectSuggestion(currentSuggestions[currentIndex], field);
        }
        break;
      case 'Escape':
        setShowSuggestions(prev => ({ ...prev, [field]: false }));
        setSelectedIndex(prev => ({ ...prev, [field]: -1 }));
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!fromInputRef.current?.contains(event.target) && !toInputRef.current?.contains(event.target)) {
        setShowSuggestions({ from: false, to: false });
        setSelectedIndex({ from: -1, to: -1 });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.from || !formData.to || !formData.journeyDate) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    
    try {
      // First validate that trips exist for this search
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add auth header only if user is logged in
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const searchResponse = await fetch(`/api/passenger/trips/search?from=${encodeURIComponent(formData.from)}&to=${encodeURIComponent(formData.to)}&date=${formData.journeyDate}`, {
        headers
      });

      const queryParams = new URLSearchParams({
        from: formData.from,
        to: formData.to,
        date: formData.journeyDate,
        tripType: tripType
      });

      if (tripType === 'roundTrip' && formData.returnDate) {
        queryParams.append('returnDate', formData.returnDate);
      }

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.success && searchData.data.trips.length > 0) {
          toast.success(`Found ${searchData.data.trips.length} trips available!`);
        } else {
          toast('No trips found for your search criteria, but you can still view all available trips.', {
            icon: 'ℹ️',
            style: {
              background: '#3B82F6',
              color: '#fff',
            }
          });
        }
      }

      // Unified navigation to RedBus-style results page
      navigate(`/redbus-results?${queryParams.toString()}`);
      
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = (city, field) => {
    setFormData(prev => ({ ...prev, [field]: city }));
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time.length === 5 ? time : time.slice(0, 5);
  };

  const formatDuration = (duration) => {
    if (!duration) return '';
    return duration;
  };

  // Use mobile search card on mobile devices
  if (isMobile) {
    return <MobileSearchCard onSearchResults={onSearchResults} showResults={showResults} />;
  }

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
        <div className="autocomplete-container">
          <label className="label">
            From
          </label>
          <div className="field">
            <MapPin className="field__icon" />
            <input
              ref={fromInputRef}
              type="text"
              value={formData.from}
              onChange={(e) => handleInputChange('from', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'from')}
              placeholder="Enter departure location"
              className="input"
              required
              autoComplete="off"
            />
            {isLoadingSuggestions.from && (
              <div className="loading-spinner">
                <div className="spinner"></div>
              </div>
            )}
          </div>
          
          {/* Suggestions Dropdown */}
          {showSuggestions.from && suggestions.from.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.from.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  className={`suggestion-item ${selectedIndex.from === index ? 'selected' : ''}`}
                  onClick={() => selectSuggestion(suggestion, 'from')}
                  onMouseEnter={() => setSelectedIndex(prev => ({ ...prev, from: index }))}
                >
                  <div className="suggestion-icon">
                    {suggestion.type === 'stop' ? (
                      <Navigation className="w-4 h-4" />
                    ) : suggestion.type === 'city' ? (
                      <MapPin className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <div className="suggestion-content">
                    <div className="suggestion-name">{suggestion.name}</div>
                    <div className="suggestion-details">
                      {suggestion.city !== suggestion.name && suggestion.city}
                      {suggestion.state && `, ${suggestion.state}`}
                      {suggestion.routeCount && ` • ${suggestion.routeCount} routes`}
                    </div>
                  </div>
                  <div className="suggestion-type">
                    {suggestion.type === 'stop' ? 'Stop' : 
                     suggestion.type === 'city' ? 'City' : 'Route'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* To Location */}
        <div className="autocomplete-container">
          <label className="label">
            To
          </label>
          <div className="field">
            <MapPin className="field__icon" />
            <input
              ref={toInputRef}
              type="text"
              value={formData.to}
              onChange={(e) => handleInputChange('to', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'to')}
              placeholder="Enter destination location"
              className="input"
              required
              autoComplete="off"
            />
            {isLoadingSuggestions.to && (
              <div className="loading-spinner">
                <div className="spinner"></div>
              </div>
            )}
          </div>
          
          {/* Suggestions Dropdown */}
          {showSuggestions.to && suggestions.to.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.to.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  className={`suggestion-item ${selectedIndex.to === index ? 'selected' : ''}`}
                  onClick={() => selectSuggestion(suggestion, 'to')}
                  onMouseEnter={() => setSelectedIndex(prev => ({ ...prev, to: index }))}
                >
                  <div className="suggestion-icon">
                    {suggestion.type === 'stop' ? (
                      <Navigation className="w-4 h-4" />
                    ) : suggestion.type === 'city' ? (
                      <MapPin className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <div className="suggestion-content">
                    <div className="suggestion-name">{suggestion.name}</div>
                    <div className="suggestion-details">
                      {suggestion.city !== suggestion.name && suggestion.city}
                      {suggestion.state && `, ${suggestion.state}`}
                      {suggestion.routeCount && ` • ${suggestion.routeCount} routes`}
                    </div>
                  </div>
                  <div className="suggestion-type">
                    {suggestion.type === 'stop' ? 'Stop' : 
                     suggestion.type === 'city' ? 'City' : 'Route'}
                  </div>
                </div>
              ))}
            </div>
          )}
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
    </div>
  );
};

export default SearchCard;
