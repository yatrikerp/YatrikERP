import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { Bus, MapPin, Calendar, Search, Clock, Navigation, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

const MobileSearchCard = ({ onSearchResults, showResults = false }) => {
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
      const res = await apiFetch('/api/routes/cities');
      if (res.ok) {
        const data = res.data || {};
        const citiesList = data.data?.cities || data.cities || [];
        setCities(Array.isArray(citiesList) ? citiesList : []);
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

    if (query.length < 2) {
      setSuggestions(prev => ({ ...prev, [field]: [] }));
      setShowSuggestions(prev => ({ ...prev, [field]: false }));
      return;
    }

    setIsLoadingSuggestions(prev => ({ ...prev, [field]: true }));

    suggestionTimeoutRef.current = setTimeout(() => {
      const filteredCities = cities.filter(city =>
        city.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);

      setSuggestions(prev => ({ ...prev, [field]: filteredCities }));
      setShowSuggestions(prev => ({ ...prev, [field]: true }));
      setIsLoadingSuggestions(prev => ({ ...prev, [field]: false }));
    }, 300);
  }, [cities]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSelectedIndex(prev => ({ ...prev, [field]: -1 }));
    
    if (field === 'from' || field === 'to') {
      debouncedSearch(value, field);
    }
  };

  const handleSuggestionClick = (field, suggestion) => {
    setFormData(prev => ({ ...prev, [field]: suggestion }));
    setShowSuggestions(prev => ({ ...prev, [field]: false }));
    setSuggestions(prev => ({ ...prev, [field]: [] }));
    
    // Focus next input
    if (field === 'from') {
      toInputRef.current?.focus();
    }
  };

  const handleKeyDown = (e, field) => {
    const currentSuggestions = suggestions[field];
    const currentIndex = selectedIndex[field];

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
          handleSuggestionClick(field, currentSuggestions[currentIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(prev => ({ ...prev, [field]: false }));
        break;
    }
  };

  const swapLocations = () => {
    setFormData(prev => ({
      ...prev,
      from: prev.to,
      to: prev.from
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!formData.from || !formData.to) {
      toast.error('Please select both departure and destination');
      return;
    }
    
    if (!formData.journeyDate) {
      toast.error('Please select journey date');
      return;
    }

    if (formData.from === formData.to) {
      toast.error('Departure and destination cannot be the same');
      return;
    }

    setLoading(true);
    
    try {
      const searchParams = new URLSearchParams({
        from: formData.from,
        to: formData.to,
        journeyDate: formData.journeyDate,
        tripType: tripType
      });

      if (tripType === 'roundTrip' && formData.returnDate) {
        searchParams.append('returnDate', formData.returnDate);
      }

      const res = await apiFetch(`/api/routes/search?${searchParams}`);
      if (!res.ok) {
        throw new Error(res.message || 'Search failed');
      }
      const data = res.data;
      
      if (onSearchResults) {
        onSearchResults(data);
      } else {
        // Navigate to search results page
        const searchUrl = `/passenger/search-results?${searchParams}`;
        navigate(searchUrl);
      }
      
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search buses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMinReturnDate = () => {
    if (!formData.journeyDate) return getCurrentDate();
    const journeyDate = new Date(formData.journeyDate);
    journeyDate.setDate(journeyDate.getDate() + 1);
    return journeyDate.toISOString().split('T')[0];
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      margin: '0 16px',
      width: 'calc(100% - 32px)',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#111827',
          margin: '0 0 8px 0'
        }}>
          Search Buses
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          margin: 0
        }}>
          Find the best bus for your journey
        </p>
      </div>

      {/* Trip Type Toggle */}
      <div style={{
        display: 'flex',
        background: '#f3f4f6',
        borderRadius: '12px',
        padding: '4px',
        marginBottom: '20px'
      }}>
        <button
          type="button"
          onClick={() => setTripType('oneWay')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            background: tripType === 'oneWay' ? 'white' : 'transparent',
            color: tripType === 'oneWay' ? '#111827' : '#6b7280',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            boxShadow: tripType === 'oneWay' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          One Way
        </button>
        <button
          type="button"
          onClick={() => setTripType('roundTrip')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            background: tripType === 'roundTrip' ? 'white' : 'transparent',
            color: tripType === 'roundTrip' ? '#111827' : '#6b7280',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            boxShadow: tripType === 'roundTrip' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          Round Trip
        </button>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* From Location */}
        <div style={{ position: 'relative' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px'
          }}>
            From
          </label>
          <div style={{ position: 'relative' }}>
            <MapPin
              size={20}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280'
              }}
            />
            <input
              ref={fromInputRef}
              type="text"
              placeholder="Enter departure city"
              value={formData.from}
              onChange={(e) => handleInputChange('from', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'from')}
              onFocus={() => setShowSuggestions(prev => ({ ...prev, from: true }))}
              style={{
                width: '100%',
                padding: '12px 12px 12px 44px',
                borderRadius: '12px',
                border: '2px solid #e5e7eb',
                fontSize: '16px',
                background: 'white',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>
          
          {/* From Suggestions */}
          {showSuggestions.from && (suggestions.from.length > 0 || isLoadingSuggestions.from) && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 1000,
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {isLoadingSuggestions.from ? (
                <div style={{
                  padding: '12px',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  Loading...
                </div>
              ) : (
                suggestions.from.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => handleSuggestionClick('from', suggestion)}
                    style={{
                      padding: '12px',
                      cursor: 'pointer',
                      background: index === selectedIndex.from ? '#f3f4f6' : 'white',
                      borderBottom: index < suggestions.from.length - 1 ? '1px solid #f3f4f6' : 'none'
                    }}
                  >
                    <MapPin size={16} style={{ marginRight: '8px', color: '#6b7280' }} />
                    {suggestion}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Swap Button */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={swapLocations}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '2px solid #e5e7eb',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              margin: '8px 0'
            }}
          >
            <ArrowRight size={20} color="#6b7280" />
          </button>
        </div>

        {/* To Location */}
        <div style={{ position: 'relative' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px'
          }}>
            To
          </label>
          <div style={{ position: 'relative' }}>
            <MapPin
              size={20}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280'
              }}
            />
            <input
              ref={toInputRef}
              type="text"
              placeholder="Enter destination city"
              value={formData.to}
              onChange={(e) => handleInputChange('to', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'to')}
              onFocus={() => setShowSuggestions(prev => ({ ...prev, to: true }))}
              style={{
                width: '100%',
                padding: '12px 12px 12px 44px',
                borderRadius: '12px',
                border: '2px solid #e5e7eb',
                fontSize: '16px',
                background: 'white',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>
          
          {/* To Suggestions */}
          {showSuggestions.to && (suggestions.to.length > 0 || isLoadingSuggestions.to) && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 1000,
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {isLoadingSuggestions.to ? (
                <div style={{
                  padding: '12px',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  Loading...
                </div>
              ) : (
                suggestions.to.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => handleSuggestionClick('to', suggestion)}
                    style={{
                      padding: '12px',
                      cursor: 'pointer',
                      background: index === selectedIndex.to ? '#f3f4f6' : 'white',
                      borderBottom: index < suggestions.to.length - 1 ? '1px solid #f3f4f6' : 'none'
                    }}
                  >
                    <MapPin size={16} style={{ marginRight: '8px', color: '#6b7280' }} />
                    {suggestion}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Journey Date */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Journey Date
          </label>
          <div style={{ position: 'relative' }}>
            <Calendar
              size={20}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280'
              }}
            />
            <input
              type="date"
              min={getCurrentDate()}
              value={formData.journeyDate}
              onChange={(e) => handleInputChange('journeyDate', e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 44px',
                borderRadius: '12px',
                border: '2px solid #e5e7eb',
                fontSize: '16px',
                background: 'white',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Return Date (for round trip) */}
        {tripType === 'roundTrip' && (
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Return Date
            </label>
            <div style={{ position: 'relative' }}>
              <Calendar
                size={20}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b7280'
                }}
              />
              <input
                type="date"
                min={getMinReturnDate()}
                value={formData.returnDate}
                onChange={(e) => handleInputChange('returnDate', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 44px',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb',
                  fontSize: '16px',
                  background: 'white',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        )}

        {/* Search Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '12px',
            border: 'none',
            background: loading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '8px'
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Searching...
            </>
          ) : (
            <>
              <Search size={20} />
              Search Buses
            </>
          )}
        </button>
      </form>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MobileSearchCard;
