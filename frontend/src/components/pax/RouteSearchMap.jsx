import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Clock, 
  Bus, 
  Navigation, 
  Filter,
  ArrowRight,
  RefreshCw,
  X
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import './RouteSearchMap.css';

const RouteSearchMap = () => {
  const [searchData, setSearchData] = useState({
    from: '',
    to: '',
    journeyDate: new Date().toISOString().split('T')[0]
  });
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [cities, setCities] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    busType: [],
    departureTime: [],
    priceRange: [0, 2000]
  });
  const mapRef = useRef(null);

  // Load cities on component mount
  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const response = await apiFetch('/api/routes/cities');
      if (response.ok) {
        setCities(response.data.data?.cities || []);
      }
    } catch (error) {
      console.error('Failed to load cities:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchData.from || !searchData.to || !searchData.journeyDate) {
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: searchData.from,
        to: searchData.to,
        date: searchData.journeyDate
      });

      const response = await apiFetch(`/api/trips/search?${params.toString()}`);
      if (response.ok) {
        setSearchResults(response.data.data?.trips || response.data.trips || []);
        if (response.data.data?.trips?.length > 0) {
          setSelectedRoute(response.data.data.trips[0]);
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRouteSelect = (route) => {
    setSelectedRoute(route);
  };

  const getCityCoordinates = (cityName) => {
    // Kerala cities coordinates
    const cityCoords = {
      'Kochi': { lat: 9.9312, lng: 76.2673 },
      'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
      'Kozhikode': { lat: 11.2588, lng: 75.7804 },
      'Alappuzha': { lat: 9.4981, lng: 76.3388 },
      'Kollam': { lat: 8.8932, lng: 76.6141 },
      'Thrissur': { lat: 10.5276, lng: 76.2144 },
      'Kottayam': { lat: 9.5916, lng: 76.5222 },
      'Palakkad': { lat: 10.7867, lng: 76.6548 },
      'Ernakulam': { lat: 9.9312, lng: 76.2673 },
      'Bangalore': { lat: 12.9716, lng: 77.5946 },
      'Chennai': { lat: 13.0827, lng: 80.2707 },
      'Mumbai': { lat: 19.0760, lng: 72.8777 },
      'Delhi': { lat: 28.7041, lng: 77.1025 }
    };
    return cityCoords[cityName] || { lat: 10.8505, lng: 76.2711 }; // Default to Kerala center
  };

  const renderMap = () => {
    if (!selectedRoute) {
      return (
        <div className="map-placeholder">
          <div className="map-placeholder-content">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">Select a Route</p>
            <p className="text-sm text-gray-500">Choose a route from the search results to view it on the map</p>
          </div>
        </div>
      );
    }

    const fromCoords = getCityCoordinates(selectedRoute.fromCity);
    const toCoords = getCityCoordinates(selectedRoute.toCity);

    return (
      <div className="map-container" ref={mapRef}>
        <div className="map-overlay">
          {/* Kerala/India Map Outline */}
          <div className="india-outline">
            <svg viewBox="0 0 1000 1000" className="india-svg">
              <path 
                d="M 200 300 Q 250 250 300 300 Q 350 350 400 300 Q 450 250 500 300 Q 550 350 600 300 Q 650 250 700 300 Q 750 350 800 300 L 800 400 Q 750 450 700 400 Q 650 350 600 400 Q 550 450 500 400 Q 450 350 400 400 Q 350 450 300 400 Q 250 350 200 400 Z" 
                fill="rgba(233, 30, 99, 0.1)" 
                stroke="rgba(233, 30, 99, 0.3)" 
                strokeWidth="2"
              />
            </svg>
          </div>

          {/* Route Line */}
          <div className="route-line">
            <svg className="route-svg" viewBox="0 0 1000 1000">
              <path
                d={`M ${50 + (fromCoords.lng - 70) * 100} ${50 - (fromCoords.lat - 20) * 100} Q 500 500 ${50 + (toCoords.lng - 70) * 100} ${50 - (toCoords.lat - 20) * 100}`}
                stroke="#E91E63"
                strokeWidth="4"
                fill="none"
                strokeDasharray="10,5"
              />
            </svg>
          </div>

          {/* From Marker */}
          <div 
            className="route-marker from-marker"
            style={{
              left: `${50 + (fromCoords.lng - 70) * 100}%`,
              top: `${50 - (fromCoords.lat - 20) * 100}%`
            }}
          >
            <div className="marker-pulse"></div>
            <div className="marker-icon from-icon">
              <MapPin className="marker-pin" />
            </div>
            <div className="marker-info">
              <div className="marker-city">{selectedRoute.fromCity}</div>
              <div className="marker-label">Departure</div>
            </div>
          </div>

          {/* To Marker */}
          <div 
            className="route-marker to-marker"
            style={{
              left: `${50 + (toCoords.lng - 70) * 100}%`,
              top: `${50 - (toCoords.lat - 20) * 100}%`
            }}
          >
            <div className="marker-pulse"></div>
            <div className="marker-icon to-icon">
              <MapPin className="marker-pin" />
            </div>
            <div className="marker-info">
              <div className="marker-city">{selectedRoute.toCity}</div>
              <div className="marker-label">Arrival</div>
            </div>
          </div>

          {/* Route Info Overlay */}
          <div className="route-info-overlay">
            <div className="route-info-card">
              <h4 className="route-title">{selectedRoute.routeName}</h4>
              <div className="route-details">
                <div className="route-detail-item">
                  <Clock className="w-4 h-4" />
                  <span>{selectedRoute.startTime} - {selectedRoute.endTime}</span>
                </div>
                <div className="route-detail-item">
                  <Bus className="w-4 h-4" />
                  <span>{selectedRoute.busNumber}</span>
                </div>
                <div className="route-detail-item">
                  <Navigation className="w-4 h-4" />
                  <span>{selectedRoute.distanceKm} km</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="route-search-map">
      {/* Search Header */}
      <div className="search-header">
        <h2 className="search-title">Route Search & Map</h2>
        <p className="search-subtitle">Find and visualize your bus routes on the map</p>
      </div>

      {/* Search Form */}
      <div className="search-form-container">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-inputs">
            <div className="input-group">
              <label className="input-label">From</label>
              <div className="input-wrapper">
                <MapPin className="input-icon" />
                <select
                  value={searchData.from}
                  onChange={(e) => setSearchData({...searchData, from: e.target.value})}
                  className="search-input"
                  required
                >
                  <option value="">Select departure city</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">To</label>
              <div className="input-wrapper">
                <MapPin className="input-icon" />
                <select
                  value={searchData.to}
                  onChange={(e) => setSearchData({...searchData, to: e.target.value})}
                  className="search-input"
                  required
                >
                  <option value="">Select destination city</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Date</label>
              <div className="input-wrapper">
                <Calendar className="input-icon" />
                <input
                  type="date"
                  value={searchData.journeyDate}
                  onChange={(e) => setSearchData({...searchData, journeyDate: e.target.value})}
                  className="search-input"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="search-button"
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              {loading ? 'Searching...' : 'Search Routes'}
            </button>
          </div>
        </form>

        {/* Filters */}
        <div className="filters-section">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="filter-toggle"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Search Results */}
        <div className="search-results">
          <div className="results-header">
            <h3 className="results-title">
              Available Routes ({searchResults.length})
            </h3>
          </div>

          <div className="results-list">
            {searchResults.length > 0 ? (
              searchResults.map((route) => (
                <div 
                  key={route._id} 
                  className={`route-card ${selectedRoute?._id === route._id ? 'selected' : ''}`}
                  onClick={() => handleRouteSelect(route)}
                >
                  <div className="route-card-header">
                    <div className="route-info">
                      <h4 className="route-name">{route.routeName}</h4>
                      <p className="route-cities">{route.fromCity} → {route.toCity}</p>
                    </div>
                    <div className="route-price">
                      <span className="price">₹{route.fare}</span>
                      <span className="price-label">per seat</span>
                    </div>
                  </div>

                  <div className="route-card-details">
                    <div className="detail-item">
                      <Clock className="w-4 h-4" />
                      <span>{route.startTime} - {route.endTime}</span>
                    </div>
                    <div className="detail-item">
                      <Bus className="w-4 h-4" />
                      <span>{route.busNumber}</span>
                    </div>
                    <div className="detail-item">
                      <Navigation className="w-4 h-4" />
                      <span>{route.distanceKm} km</span>
                    </div>
                    <div className="detail-item">
                      <span className="seats-available">{route.availableSeats} seats left</span>
                    </div>
                  </div>

                  <div className="route-card-actions">
                    <button className="view-map-btn">
                      View on Map
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No routes found. Try different search criteria.</p>
              </div>
            )}
          </div>
        </div>

        {/* Map Section */}
        <div className="map-section">
          <div className="map-header">
            <h3 className="map-title">Route Map</h3>
            {selectedRoute && (
              <div className="map-route-info">
                <span className="route-route">{selectedRoute.fromCity} → {selectedRoute.toCity}</span>
              </div>
            )}
          </div>
          {renderMap()}
        </div>
      </div>
    </div>
  );
};

export default RouteSearchMap;

