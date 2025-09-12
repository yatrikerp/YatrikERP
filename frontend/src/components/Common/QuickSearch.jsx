import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Search, Clock, Navigation } from 'lucide-react';
import { toast } from 'react-hot-toast';

const QuickSearch = ({ className = '', compact = false }) => {
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    journeyDate: ''
  });
  
  // Autocomplete states
  const [suggestions, setSuggestions] = useState({ from: [], to: [] });
  const [showSuggestions, setShowSuggestions] = useState({ from: false, to: false });
  const [selectedIndex, setSelectedIndex] = useState({ from: -1, to: -1 });
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState({ from: false, to: false });
  const [loading, setLoading] = useState(false);
  
  // Refs
  const fromInputRef = useRef(null);
  const toInputRef = useRef(null);
  const suggestionTimeoutRef = useRef(null);
  const navigate = useNavigate();

  // Set default date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormData(prev => ({
      ...prev,
      journeyDate: tomorrow.toISOString().split('T')[0]
    }));
  }, []);

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
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(prev => ({ ...prev, [field]: false }));
        setSelectedIndex(prev => ({ ...prev, [field]: -1 }));
        break;
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (!formData.from || !formData.to || !formData.journeyDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // First, search for available trips using the passenger API
      const token = localStorage.getItem('token');
      const searchResponse = await fetch(`/api/passenger/trips/search?from=${encodeURIComponent(formData.from)}&to=${encodeURIComponent(formData.to)}&date=${formData.journeyDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.success && searchData.data.trips.length > 0) {
          // Navigate to booking results page with search parameters
          const queryParams = new URLSearchParams({
            from: formData.from,
            to: formData.to,
            date: formData.journeyDate
          });
          
          navigate(`/passenger/results?${queryParams.toString()}`);
        } else {
          toast.error('No trips found for your search criteria');
        }
      } else {
        // Fallback to direct navigation if API fails
        const queryParams = new URLSearchParams({
          from: formData.from,
          to: formData.to,
          date: formData.journeyDate
        });
        
        navigate(`/passenger/results?${queryParams.toString()}`);
      }
      
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
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

  return (
    <div className={`quick-search ${className}`}>
      <div className={`search-form ${compact ? 'compact' : ''}`}>
        {/* From Location */}
        <div className="search-field">
          <label className="search-label">From</label>
          <div className="input-container">
            <MapPin className="input-icon" />
            <input
              ref={fromInputRef}
              type="text"
              value={formData.from}
              onChange={(e) => handleInputChange('from', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'from')}
              placeholder="Enter departure location"
              className="search-input"
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
        <div className="search-field">
          <label className="search-label">To</label>
          <div className="input-container">
            <MapPin className="input-icon" />
            <input
              ref={toInputRef}
              type="text"
              value={formData.to}
              onChange={(e) => handleInputChange('to', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'to')}
              placeholder="Enter destination location"
              className="search-input"
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

        {/* Date Field */}
        <div className="search-field">
          <label className="search-label">Date</label>
          <div className="input-container">
            <Calendar className="input-icon" />
            <input
              type="date"
              value={formData.journeyDate}
              onChange={(e) => setFormData(prev => ({ ...prev, journeyDate: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              className="search-input"
            />
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={loading}
          className="search-button"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {compact ? '' : 'Searching...'}
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              {compact ? '' : 'Search'}
            </>
          )}
        </button>
      </div>

      <style jsx="true">{`
        .quick-search {
          width: 100%;
        }

        .search-form {
          display: grid;
          gap: 16px;
          grid-template-columns: 1fr 1fr auto auto;
          align-items: end;
          background: white;
          padding: 20px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
        }

        .search-form.compact {
          grid-template-columns: 1fr 1fr auto auto;
          padding: 16px;
          gap: 12px;
        }

        .search-field {
          position: relative;
        }

        .search-label {
          display: block;
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
          font-size: 14px;
        }

        .input-container {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          color: #00BCD4;
          z-index: 2;
        }

        .search-input {
          width: 100%;
          padding: 12px 12px 12px 38px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          color: #1f2937;
          background: #ffffff;
          font-size: 14px;
          transition: box-shadow 0.15s ease, border-color 0.15s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #00BCD4;
          box-shadow: 0 0 0 3px rgba(0, 188, 212, 0.15);
        }

        .search-input::placeholder {
          color: #9ca3af;
        }

        .loading-spinner {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #e2e8f0;
          border-top: 2px solid #00BCD4;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .suggestions-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05);
          z-index: 1000;
          max-height: 300px;
          overflow-y: auto;
          margin-top: 4px;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .suggestion-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          cursor: pointer;
          transition: background-color 0.15s ease;
          border-bottom: 1px solid #f1f5f9;
        }

        .suggestion-item:last-child {
          border-bottom: none;
        }

        .suggestion-item:hover,
        .suggestion-item.selected {
          background-color: #f8fafc;
        }

        .suggestion-item.selected {
          background-color: #e0f2fe;
        }

        .suggestion-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background-color: #f1f5f9;
          border-radius: 8px;
          margin-right: 12px;
          color: #00BCD4;
          flex-shrink: 0;
        }

        .suggestion-item.selected .suggestion-icon {
          background-color: #bae6fd;
          color: #0369a1;
        }

        .suggestion-content {
          flex: 1;
          min-width: 0;
        }

        .suggestion-name {
          font-weight: 600;
          color: #1f2937;
          font-size: 14px;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .suggestion-details {
          font-size: 12px;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .suggestion-type {
          font-size: 11px;
          color: #9ca3af;
          background-color: #f3f4f6;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 500;
          margin-left: 8px;
          flex-shrink: 0;
        }

        .suggestion-item.selected .suggestion-type {
          background-color: #dbeafe;
          color: #1e40af;
        }

        .search-button {
          background: linear-gradient(135deg, #E91E63 0%, #FF4081 90%);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(233, 30, 99, 0.3);
          min-height: 44px;
        }

        .search-button:hover {
          background: linear-gradient(135deg, #C2185B 0%, #E91E63 90%);
          box-shadow: 0 6px 16px rgba(233, 30, 99, 0.4);
          transform: translateY(-1px);
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .search-form {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .search-form.compact {
            grid-template-columns: 1fr;
          }

          .search-button {
            width: 100%;
            padding: 14px 20px;
          }
        }

        @media (max-width: 480px) {
          .search-form {
            padding: 16px;
            border-radius: 12px;
          }

          .suggestions-dropdown {
            border-radius: 16px;
            margin-top: 6px;
          }
          
          .suggestion-item {
            padding: 14px 16px;
          }
          
          .suggestion-icon {
            width: 36px;
            height: 36px;
            margin-right: 14px;
          }
          
          .suggestion-name {
            font-size: 15px;
          }
          
          .suggestion-details {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
};

export default QuickSearch;
