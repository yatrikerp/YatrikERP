import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Bus, Clock, MapPin, Star, Filter, SortAsc, 
  Wifi, Zap, Coffee, Users, ArrowRight, 
  ChevronDown, ChevronUp, Calendar, Navigation,
  Trophy, Search, ArrowLeftRight, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import './SearchResults.css';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sortBy: 'departure',
    sortOrder: 'asc',
    priceRange: [0, 5000],
    busType: [],
    departureTime: [],
    amenities: [],
    operators: [],
    aiFilter: '',
    selectedFilters: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showTripDetails, setShowTripDetails] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});

  // Get search parameters
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const date = searchParams.get('date') || '';
  const tripType = searchParams.get('tripType') || 'oneWay';

  // Bus types for filtering (legacy)
  const legacyBusTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'AC Sleeper', label: 'AC Sleeper' },
    { value: 'AC Seater', label: 'AC Seater' },
    { value: 'Non-AC Sleeper', label: 'Non-AC Sleeper' },
    { value: 'Non-AC Seater', label: 'Non-AC Seater' }
  ];

  // Departure time filters
  const timeFilters = [
    { value: 'all', label: 'All Times' },
    { value: 'early', label: 'Early Morning (12AM - 6AM)' },
    { value: 'morning', label: 'Morning (6AM - 12PM)' },
    { value: 'afternoon', label: 'Afternoon (12PM - 6PM)' },
    { value: 'evening', label: 'Evening (6PM - 12AM)' }
  ];

  // Available amenities
  const availableAmenities = [
    { id: 'wifi', label: 'WiFi', icon: Wifi },
    { id: 'charging', label: 'Charging', icon: Zap },
    { id: 'refreshments', label: 'Refreshments', icon: Coffee },
    { id: 'ac', label: 'AC', icon: Users }
  ];

  // Dynamic filter options based on actual trip data
  const [filterOptions, setFilterOptions] = useState([]);
  const [busTypes, setBusTypes] = useState([]);
  const [departureTimeRanges, setDepartureTimeRanges] = useState([]);
  const [operators, setOperators] = useState([]);
  const [amenities, setAmenities] = useState([]);

  useEffect(() => {
    fetchTrips();
  }, [from, to, date]);

  useEffect(() => {
    applyFilters();
  }, [trips, filters]);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      // First try to get specific search results
      let response;
      if (from && to && date) {
        response = await fetch(`/api/trips/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}`);
      } else {
        // If no specific search, get all trips for the date
        response = await fetch(`/api/trips/all?date=${date}`);
      }

      if (response.ok) {
        const data = await response.json();
        if (data.success || data.ok) {
          const tripsData = data.data?.trips || data.trips || [];
          setTrips(tripsData);
          setFilteredTrips(tripsData);
          
          // Generate filter options from actual trip data
          generateFilterOptions(tripsData);
          
          if (tripsData.length === 0) {
            toast('No trips found for your search criteria', {
              icon: 'ℹ️',
              duration: 3000
            });
          } else {
            toast.success(`Found ${tripsData.length} trips available!`);
          }
        } else {
          toast.error('Failed to fetch trips');
        }
      } else {
        toast.error('Failed to fetch trips');
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast.error('Failed to fetch trips');
    } finally {
      setLoading(false);
    }
  };

  const generateFilterOptions = (tripsData) => {
    // Generate bus type filters
    const busTypeCounts = {};
    const timeRangeCounts = {};
    const operatorCounts = {};
    const amenityCounts = {};

    tripsData.forEach(trip => {
      // Count bus types
      const busType = trip.busType || 'Unknown';
      busTypeCounts[busType] = (busTypeCounts[busType] || 0) + 1;

      // Count time ranges
      const startTime = new Date(trip.startTime);
      const hour = startTime.getHours();
      let timeRange = '';
      if (hour >= 0 && hour < 6) timeRange = '00:00-06:00';
      else if (hour >= 6 && hour < 12) timeRange = '06:00-12:00';
      else if (hour >= 12 && hour < 18) timeRange = '12:00-18:00';
      else timeRange = '18:00-24:00';
      timeRangeCounts[timeRange] = (timeRangeCounts[timeRange] || 0) + 1;

      // Count operators
      const operator = trip.operator || 'KSRTC';
      operatorCounts[operator] = (operatorCounts[operator] || 0) + 1;

      // Count amenities
      if (trip.amenities) {
        trip.amenities.forEach(amenity => {
          amenityCounts[amenity] = (amenityCounts[amenity] || 0) + 1;
        });
      }
    });

    // Set bus types
    setBusTypes(Object.entries(busTypeCounts).map(([type, count]) => ({
      label: type,
      count,
      value: type.toLowerCase().replace(/\s+/g, '_')
    })));

    // Set time ranges
    setDepartureTimeRanges(Object.entries(timeRangeCounts).map(([range, count]) => ({
      label: range,
      count,
      value: range
    })));

    // Set operators
    setOperators(Object.entries(operatorCounts).map(([operator, count]) => ({
      label: operator,
      count,
      value: operator.toLowerCase().replace(/\s+/g, '_')
    })));

    // Set amenities
    setAmenities(Object.entries(amenityCounts).map(([amenity, count]) => ({
      label: amenity,
      count,
      value: amenity.toLowerCase()
    })));

    // Generate quick filter options
    const quickFilters = [
      ...Object.entries(busTypeCounts).map(([type, count]) => ({
        id: type.toLowerCase().replace(/\s+/g, '_'),
        label: type.toUpperCase(),
        count,
        type: 'busType'
      })),
      ...Object.entries(timeRangeCounts).map(([range, count]) => ({
        id: range.replace(':', '').replace('-', '_'),
        count,
        type: 'timeRange'
      }))
    ];

    setFilterOptions(quickFilters);
  };

  const applyFilters = () => {
    let filtered = [...trips];

    // Apply AI filter (search by operator, bus type, amenities)
    if (filters.aiFilter) {
      const searchTerm = filters.aiFilter.toLowerCase();
      filtered = filtered.filter(trip =>
        (trip.operator && trip.operator.toLowerCase().includes(searchTerm)) ||
        (trip.busType && trip.busType.toLowerCase().includes(searchTerm)) ||
        (trip.amenities && trip.amenities.some(amenity => amenity.toLowerCase().includes(searchTerm))) ||
        (trip.routeName && trip.routeName.toLowerCase().includes(searchTerm))
      );
    }

    // Apply quick filters
    if (filters.selectedFilters.length > 0) {
      filtered = filtered.filter(trip => {
        return filters.selectedFilters.every(filterId => {
          const filter = filterOptions.find(f => f.id === filterId);
          if (!filter) return true;

          switch (filter.type) {
            case 'busType':
              return trip.busType && trip.busType.toLowerCase().includes(filter.label.toLowerCase());
            case 'timeRange':
              const startTime = new Date(trip.startTime);
              const hour = startTime.getHours();
              const timeRange = filter.label;
              if (timeRange === '00:00-06:00') return hour >= 0 && hour < 6;
              if (timeRange === '06:00-12:00') return hour >= 6 && hour < 12;
              if (timeRange === '12:00-18:00') return hour >= 12 && hour < 18;
              if (timeRange === '18:00-24:00') return hour >= 18 && hour < 24;
              return true;
            case 'rating':
              return trip.rating && trip.rating >= 4.0;
            default:
              return true;
          }
        });
      });
    }

    // Apply bus type filters
    if (filters.busType.length > 0) {
      filtered = filtered.filter(trip => 
        filters.busType.includes(trip.busType?.toLowerCase().replace(/\s+/g, '_'))
      );
    }

    // Apply departure time filters
    if (filters.departureTime.length > 0) {
      filtered = filtered.filter(trip => {
        const startTime = new Date(trip.startTime);
        const hour = startTime.getHours();
        return filters.departureTime.some(timeRange => {
          if (timeRange === '00:00-06:00') return hour >= 0 && hour < 6;
          if (timeRange === '06:00-12:00') return hour >= 6 && hour < 12;
          if (timeRange === '12:00-18:00') return hour >= 12 && hour < 18;
          if (timeRange === '18:00-24:00') return hour >= 18 && hour < 24;
          return false;
        });
      });
    }

    // Apply operator filters
    if (filters.operators.length > 0) {
      filtered = filtered.filter(trip => 
        filters.operators.includes(trip.operator?.toLowerCase().replace(/\s+/g, '_'))
      );
    }

    // Apply amenities filters
    if (filters.amenities.length > 0) {
      filtered = filtered.filter(trip => 
        trip.amenities && filters.amenities.every(amenity => 
          trip.amenities.some(tripAmenity => 
            tripAmenity.toLowerCase() === amenity
          )
        )
      );
    }

    // Apply price range filter
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 5000) {
      filtered = filtered.filter(trip => {
        const fare = trip.fare || 0;
        return fare >= filters.priceRange[0] && fare <= filters.priceRange[1];
      });
    }

    // Sort trips
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'departure':
          aValue = new Date(a.startTime);
          bValue = new Date(b.startTime);
          break;
        case 'fare':
          aValue = a.fare || 0;
          bValue = b.fare || 0;
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'duration':
          aValue = a.distanceKm || 0;
          bValue = b.distanceKm || 0;
          break;
        default:
          return 0;
      }
      
      return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    setFilteredTrips(filtered);
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '';
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'status-scheduled';
      case 'boarding': return 'status-boarding';
      case 'running': return 'status-running';
      case 'delayed': return 'status-delayed';
      default: return 'status-scheduled';
    }
  };

  const handleBookNow = (trip) => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate(`/pax/board-drop/${trip._id}`, { state: { trip } });
    } else {
      navigate('/login?next=/pax', { state: { trip } });
    }
  };

  const handleViewSeats = (trip) => {
    setSelectedTrip(trip);
    setShowTripDetails(true);
  };

  const toggleFilter = (filterId) => {
    setFilters(prev => ({
      ...prev,
      selectedFilters: prev.selectedFilters.includes(filterId)
        ? prev.selectedFilters.filter(id => id !== filterId)
        : [...prev.selectedFilters, filterId]
    }));
  };

  const toggleSection = (sectionId) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const toggleBusTypeFilter = (busType) => {
    setFilters(prevFilters => {
      const newBusTypes = prevFilters.busType.includes(busType)
        ? prevFilters.busType.filter(type => type !== busType)
        : [...prevFilters.busType, busType];
      return { ...prevFilters, busType: newBusTypes };
    });
  };

  const toggleTimeRangeFilter = (timeRange) => {
    setFilters(prevFilters => {
      const newTimeRanges = prevFilters.departureTime.includes(timeRange)
        ? prevFilters.departureTime.filter(range => range !== timeRange)
        : [...prevFilters.departureTime, timeRange];
      return { ...prevFilters, departureTime: newTimeRanges };
    });
  };

  const toggleOperatorFilter = (operator) => {
    setFilters(prevFilters => {
      const newOperators = prevFilters.operators.includes(operator)
        ? prevFilters.operators.filter(op => op !== operator)
        : [...prevFilters.operators, operator];
      return { ...prevFilters, operators: newOperators };
    });
  };

  const toggleAmenityFilter = (amenity) => {
    setFilters(prevFilters => {
      const newAmenities = prevFilters.amenities.includes(amenity)
        ? prevFilters.amenities.filter(am => am !== amenity)
        : [...prevFilters.amenities, amenity];
      return { ...prevFilters, amenities: newAmenities };
    });
  };

  const clearAllFilters = () => {
    setFilters(prev => ({
      ...prev,
      selectedFilters: [],
      aiFilter: '',
      priceRange: [0, 5000],
      busType: [],
      departureTime: [],
      operators: [],
      amenities: []
    }));
  };

  if (loading) {
    return (
      <div className="search-results-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Searching for trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="redbus-results-container">
      {/* Left Sidebar - Fixed */}
      <div className="filters-sidebar">
        {/* Logo Section */}
        <div className="logo-section">
          <div className="logo-container">
            <div className="sidebar-logo">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="8" fill="#FF3366"/>
                {/* Bus Body */}
                <rect x="8" y="12" width="24" height="16" rx="2" fill="white"/>
                {/* Bus Windows */}
                <rect x="10" y="14" width="4" height="3" rx="1" fill="#FF3366"/>
                <rect x="15" y="14" width="4" height="3" rx="1" fill="#FF3366"/>
                <rect x="20" y="14" width="4" height="3" rx="1" fill="#FF3366"/>
                <rect x="25" y="14" width="4" height="3" rx="1" fill="#FF3366"/>
                {/* Bus Door */}
                <rect x="10" y="18" width="3" height="8" rx="1" fill="#FF3366"/>
                {/* Bus Wheels */}
                <circle cx="14" cy="30" r="3" fill="#000000"/>
                <circle cx="26" cy="30" r="3" fill="#000000"/>
                <circle cx="14" cy="30" r="1.5" fill="#666666"/>
                <circle cx="26" cy="30" r="1.5" fill="#666666"/>
                {/* Bus Headlights */}
                <circle cx="32" cy="16" r="1.5" fill="#fbbf24"/>
                <circle cx="32" cy="20" r="1.5" fill="#fbbf24"/>
                {/* Bus Bumper */}
                <rect x="32" y="14" width="2" height="8" fill="#000000"/>
              </svg>
            </div>
            <div className="logo-text">
              <h2>YATRIK ERP</h2>
              <p>Smart Bus Travel</p>
            </div>
          </div>
        </div>

        {/* Smart Filter */}
        <div className="filter-section">
          <h3>Smart Filter</h3>
          <p className="filter-subtitle">Find your perfect bus</p>
          <div className="ai-filter">
            <input
              type="text"
              placeholder="Search by operator, bus type, amenities..."
              value={filters.aiFilter}
              onChange={(e) => setFilters({...filters, aiFilter: e.target.value})}
              className="ai-filter-input"
            />
          </div>
        </div>

        {/* Quick Filters */}
        <div className="filter-section">
          <h3>Quick Filters</h3>
          <div className="filter-tags">
            {filterOptions.map(option => (
              <button
                key={option.id}
                className={`filter-tag ${filters.selectedFilters.includes(option.id) ? 'active' : ''}`}
                onClick={() => toggleFilter(option.id)}
              >
                {option.icon && <option.icon className="filter-icon" />}
                {option.label} ({option.count})
              </button>
            ))}
          </div>
        </div>

        {/* Bus Type Filter */}
        <div className="filter-section">
          <button 
            className="section-header"
            onClick={() => toggleSection('busType')}
          >
            <span>Bus Type</span>
            <ChevronDown className={`chevron ${collapsedSections.busType ? 'collapsed' : ''}`} />
          </button>
          {!collapsedSections.busType && (
            <div className="section-content">
              {busTypes.map((type, index) => (
                <label key={index} className="bus-type-option">
                  <input 
                    type="checkbox" 
                    checked={filters.busType.includes(type.value)}
                    onChange={() => toggleBusTypeFilter(type.value)}
                  />
                  <span>{type.label} ({type.count})</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Departure Time Filter */}
        <div className="filter-section">
          <button 
            className="section-header"
            onClick={() => toggleSection('departure')}
          >
            <span>Departure Time</span>
            <ChevronDown className={`chevron ${collapsedSections.departure ? 'collapsed' : ''}`} />
          </button>
          {!collapsedSections.departure && (
            <div className="section-content">
              {departureTimeRanges.map((range, index) => (
                <label key={index} className="time-range-option">
                  <input 
                    type="checkbox" 
                    checked={filters.departureTime.includes(range.value)}
                    onChange={() => toggleTimeRangeFilter(range.value)}
                  />
                  <span>{range.label} ({range.count})</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Operator Filter */}
        <div className="filter-section">
          <button 
            className="section-header"
            onClick={() => toggleSection('operator')}
          >
            <span>Bus Operator</span>
            <ChevronDown className={`chevron ${collapsedSections.operator ? 'collapsed' : ''}`} />
          </button>
          {!collapsedSections.operator && (
            <div className="section-content">
              {operators.map((operator, index) => (
                <label key={index} className="operator-option">
                  <input 
                    type="checkbox" 
                    checked={filters.operators.includes(operator.value)}
                    onChange={() => toggleOperatorFilter(operator.value)}
                  />
                  <span>{operator.label} ({operator.count})</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Amenities Filter */}
        <div className="filter-section">
          <button 
            className="section-header"
            onClick={() => toggleSection('amenities')}
          >
            <span>Amenities</span>
            <ChevronDown className={`chevron ${collapsedSections.amenities ? 'collapsed' : ''}`} />
          </button>
          {!collapsedSections.amenities && (
            <div className="section-content">
              {amenities.map((amenity, index) => (
                <label key={index} className="amenity-option">
                  <input 
                    type="checkbox" 
                    checked={filters.amenities.includes(amenity.value)}
                    onChange={() => toggleAmenityFilter(amenity.value)}
                  />
                  <span>{amenity.label} ({amenity.count})</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Clear All Filters */}
        {(filters.selectedFilters.length > 0 || 
          filters.busType.length > 0 || 
          filters.departureTime.length > 0 || 
          filters.operators.length > 0 || 
          filters.amenities.length > 0 || 
          filters.aiFilter) && (
          <button className="clear-filters-btn" onClick={clearAllFilters}>
            Clear All Filters
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="main-content-area">
        {/* Professional Header */}
        <div className="redbus-header">
          <div className="redbus-header-container">
            <div className="route-info">
              <h1>{from} → {to}</h1>
              <p>{filteredTrips.length} buses</p>
            </div>
            
            <div className="breadcrumb">
              <span>Bus Ticket</span>
              <span>›</span>
              <span>{from} to {to} Bus</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-bar">
          <div className="search-bar-container">
            <div className="search-inputs">
          <div className="search-field-group">
            <label className="field-label">From</label>
            <div className="search-field">
              <Bus className="field-icon" />
              <span>{from}</span>
            </div>
          </div>
          
          <div className="swap-button">
            <ArrowLeftRight className="swap-icon" />
          </div>
          
          <div className="search-field-group">
            <label className="field-label">To</label>
            <div className="search-field">
              <Bus className="field-icon" />
              <span>{to}</span>
            </div>
          </div>
          
          <div className="search-field-group">
            <label className="field-label">Date of journey</label>
            <div className="search-field">
              <Calendar className="field-icon" />
              <span>{new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
          
          <div className="date-buttons">
            <button className="date-btn">Today</button>
            <button className="date-btn">Tomorrow</button>
          </div>
          
          <div className="women-booking-section">
            <div className="women-booking-content">
              <div className="women-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9Z"/>
                </svg>
              </div>
              <span className="women-text">Booking for women</span>
              <a href="#" className="know-more-link">Know more</a>
            </div>
            <div className="toggle-switch">
              <input type="checkbox" id="women-toggle" className="toggle-input" defaultChecked />
              <label htmlFor="women-toggle" className="toggle-label"></label>
            </div>
          </div>
            </div>
          </div>
          
          {/* Search Buses Button */}
          <div className="search-buses-section">
            <button className="search-buses-btn">
              <Search className="search-buses-icon" />
              Search buses
            </button>
          </div>
        </div>

        {/* Trip Listings - Below Header */}
        {filteredTrips.length > 0 ? (
          <div className="trips-section">

          {/* Enhanced Results Summary */}
          <div className="results-summary">
            <div className="summary-left">
              <h3>{filteredTrips.length} buses found for {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
              <div className="quick-filters">
                <button className="quick-filter-btn active">All</button>
                <button className="quick-filter-btn">AC</button>
                <button className="quick-filter-btn">Non-AC</button>
                <button className="quick-filter-btn">Sleeper</button>
                <button className="quick-filter-btn">Seater</button>
              </div>
            </div>
            <div className="summary-right">
              <div className="view-toggle">
                <button className="view-btn active">List View</button>
                <button className="view-btn">Map View</button>
              </div>
            </div>
          </div>

          {/* Enhanced Sort Options */}
          <div className="sort-options">
            <span>Sort by:</span>
            <button 
              className={`sort-btn ${filters.sortBy === 'departure' ? 'active' : ''}`}
              onClick={() => setFilters({...filters, sortBy: 'departure'})}
            >
              Departure time
            </button>
            <button 
              className={`sort-btn ${filters.sortBy === 'fare' ? 'active' : ''}`}
              onClick={() => setFilters({...filters, sortBy: 'fare'})}
            >
              Price
            </button>
            <button 
              className={`sort-btn ${filters.sortBy === 'rating' ? 'active' : ''}`}
              onClick={() => setFilters({...filters, sortBy: 'rating'})}
            >
              Ratings
            </button>
            <button 
              className={`sort-btn ${filters.sortBy === 'duration' ? 'active' : ''}`}
              onClick={() => setFilters({...filters, sortBy: 'duration'})}
            >
              Duration
            </button>
          </div>

          {/* Trip Listings */}
          <div className="trips-content">
            <div className="redbus-trips-list">
              {filteredTrips.map((trip, index) => (
                <div key={trip._id || index} className="enhanced-trip-card">
                  {/* Trip Header */}
                  <div className="trip-header">
                    <div className="operator-info">
                      <h4>{trip.operator || 'KSRTC'} - {trip.busNumber || trip.routeNumber || '2582'}</h4>
                      <div className="bus-type-badge">
                        <span>{trip.busType || 'Non AC Seater (2+2)'}</span>
                      </div>
                      <div className="amenities">
                        {trip.amenities && trip.amenities.slice(0, 3).map((amenity, index) => (
                          <span key={index} className="amenity">{amenity}</span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="rating-info">
                      <div className="rating">
                        <Star className="star-icon" />
                        <span>{trip.rating || '4.0'}</span>
                      </div>
                      <p>{trip.totalRatings || '8'} reviews</p>
                      <div className="cancellation-policy">
                        <span>Free cancellation</span>
                      </div>
                    </div>
                  </div>

                  {/* Trip Route & Timing */}
                  <div className="trip-route">
                    <div className="route-timing">
                      <div className="departure">
                        <div className="time">{formatTime(trip.startTime)}</div>
                        <div className="location">{trip.fromCity || from}</div>
                      </div>
                      
                      <div className="route-arrow">
                        <div className="duration-text">{getDuration(trip.startTime, trip.endTime)}</div>
                        <div className="arrow">→</div>
                      </div>
                      
                      <div className="arrival">
                        <div className="time">{formatTime(trip.endTime)}</div>
                        <div className="location">{trip.toCity || to}</div>
                      </div>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="trip-details">
                    <div className="seats-availability">
                      <div className="seat-preview">
                        <div className="seat-grid">
                          <div className="seat-dot available"></div>
                          <div className="seat-dot available"></div>
                          <div className="seat-dot occupied"></div>
                          <div className="seat-dot available"></div>
                          <div className="seat-dot available"></div>
                          <div className="seat-dot occupied"></div>
                          <div className="seat-dot available"></div>
                          <div className="seat-dot available"></div>
                        </div>
                        <span className="seat-count">{trip.availableSeats || trip.capacity || 49} seats left</span>
                      </div>
                    </div>
                    
                    <div className="price-section">
                      <div className="price-info">
                        <div className="price">₹{trip.fare || 202}</div>
                        <div className="price-label">Starting from</div>
                      </div>
                      
                      <button 
                        className="book-now-btn"
                        onClick={() => handleViewSeats(trip)}
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        ) : (
          <div className="no-results">
            <Bus className="no-results-icon" />
            <h3>No trips found</h3>
            <p>Try adjusting your search criteria or filters</p>
            <button 
              className="modify-search-btn"
              onClick={() => navigate('/')}
            >
              Modify Search
            </button>
          </div>
        )}
      </div>


      {/* Trip Details Modal */}
      {showTripDetails && selectedTrip && (
        <div className="trip-details-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Trip Details</h3>
              <button 
                className="close-btn"
                onClick={() => setShowTripDetails(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="trip-info">
                <h4>{selectedTrip.routeName}</h4>
                <p>{selectedTrip.fromCity} → {selectedTrip.toCity}</p>
                <div className="trip-stats">
                  <div className="stat">
                    <Clock className="stat-icon" />
                    <span>{getDuration(selectedTrip.startTime, selectedTrip.endTime)}</span>
                  </div>
                  <div className="stat">
                    <Navigation className="stat-icon" />
                    <span>{selectedTrip.distanceKm} km</span>
                  </div>
                  <div className="stat">
                    <Calendar className="stat-icon" />
                    <span>{formatDate(selectedTrip.serviceDate)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="book-now-btn"
                onClick={() => {
                  setShowTripDetails(false);
                  handleBookNow(selectedTrip);
                }}
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
