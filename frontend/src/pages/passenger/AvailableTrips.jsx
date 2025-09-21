import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import { 
  Bus, 
  Clock, 
  MapPin, 
  Users, 
  Star,
  ArrowRight,
  Search,
  Filter,
  Calendar,
  ArrowLeft,
  Wifi,
  Zap,
  Coffee,
  Accessibility,
  Music,
  Shield,
  Heart,
  SortAsc,
  SortDesc
} from 'lucide-react';

const AvailableTrips = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [sortBy, setSortBy] = useState('departure'); // departure, price, duration
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
  const [priceRange, setPriceRange] = useState({ min: 0, max: 5000 });
  const [busTypeFilter, setBusTypeFilter] = useState('all');

  useEffect(() => {
    fetchAllTrips();
    // Set default date to today if not already set
    if (!selectedDate) {
      const today = new Date();
      setSelectedDate(today.toISOString().split('T')[0]);
    }
  }, []);

  useEffect(() => {
    filterAndSortTrips();
  }, [trips, searchTerm, selectedDate, sortBy, sortOrder, priceRange, busTypeFilter]);

  // Refetch trips when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchAllTrips();
    }
  }, [selectedDate]);

  const fetchAllTrips = async () => {
    try {
      setLoading(true);
      const url = selectedDate ? `/api/trips/all?date=${selectedDate}` : '/api/trips/all';
      const res = await apiFetch(url);
      if (res.ok) {
        setTrips(res.data.data?.trips || res.data.trips || []);
      } else {
        setError('Failed to fetch trips');
      }
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError('Error fetching trips');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortTrips = () => {
    let filtered = [...trips];

    // Filter by search term (route name, from city, to city)
    if (searchTerm) {
      filtered = filtered.filter(trip => {
        const fromCityStr = typeof trip.fromCity === 'object' ? 
          (trip.fromCity?.city || trip.fromCity?.location || '') : 
          (trip.fromCity || '');
        const toCityStr = typeof trip.toCity === 'object' ? 
          (trip.toCity?.city || trip.toCity?.location || '') : 
          (trip.toCity || '');
        
        return trip.routeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               fromCityStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
               toCityStr.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Date filtering is now handled by the backend API

    // Filter by price range
    filtered = filtered.filter(trip => 
      trip.fare >= priceRange.min && trip.fare <= priceRange.max
    );

    // Filter by bus type
    if (busTypeFilter !== 'all') {
      filtered = filtered.filter(trip => 
        trip.busType?.toLowerCase().includes(busTypeFilter.toLowerCase())
      );
    }

    // Sort trips
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'price':
          aValue = a.fare;
          bValue = b.fare;
          break;
        case 'duration':
          aValue = getDurationInMinutes(a.startTime, a.endTime);
          bValue = getDurationInMinutes(b.startTime, b.endTime);
          break;
        case 'departure':
        default:
          aValue = a.startTime;
          bValue = b.startTime;
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTrips(filtered);
  };

  const getDurationInMinutes = (startTime, endTime) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return (end - start) / (1000 * 60);
  };

  const formatDuration = (startTime, endTime) => {
    const minutes = getDurationInMinutes(startTime, endTime);
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const handleBookNow = (trip) => {
    if (!user) {
      navigate(`/login?next=/passenger/boarddrop/${trip._id}`);
      return;
    }
    
    navigate(`/passenger/boarddrop/${trip._id}`, {
      state: { trip }
    });
  };

  const getAmenityIcon = (amenity) => {
    switch (amenity.toLowerCase()) {
      case 'wifi': return <Wifi className="w-4 h-4" />;
      case 'charging': return <Zap className="w-4 h-4" />;
      case 'refreshments': return <Coffee className="w-4 h-4" />;
      case 'wheelchair': return <Accessibility className="w-4 h-4" />;
      case 'entertainment': return <Music className="w-4 h-4" />;
      case 'safety': return <Shield className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedDate('');
    setPriceRange({ min: 0, max: 5000 });
    setBusTypeFilter('all');
    setSortBy('departure');
    setSortOrder('asc');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading available trips...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <button 
            onClick={fetchAllTrips}
            className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/passenger/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Available Trips</h1>
          <p className="text-gray-600 mt-2">
            {selectedDate ? 
              `Scheduled trips for ${new Date(selectedDate).toDateString()}` : 
              'Discover all scheduled trips across Kerala'
            }
          </p>
        </div>

        {/* Quick Date Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Date Selection</h3>
          <div className="flex flex-wrap gap-2">
            {(() => {
              const dates = [];
              const today = new Date();
              for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                dates.push({
                  date: date.toISOString().split('T')[0],
                  label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toDateString()
                });
              }
              return dates;
            })().map(({ date, label }) => (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedDate === date 
                    ? 'bg-pink-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search routes or cities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Date Filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Bus Type Filter */}
            <select
              value={busTypeFilter}
              onChange={(e) => setBusTypeFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
            >
              <option value="all">All Bus Types</option>
              <option value="ac">AC Buses</option>
              <option value="sleeper">Sleeper</option>
              <option value="semi-sleeper">Semi Sleeper</option>
              <option value="seater">Seater</option>
            </select>

            {/* Sort */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
              >
                <option value="departure">Sort by Departure</option>
                <option value="price">Sort by Price</option>
                <option value="duration">Sort by Duration</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Price Range */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Price Range: ₹{priceRange.min} - ₹{priceRange.max}</label>
            <div className="flex gap-4">
              <input
                type="range"
                min="0"
                max="5000"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: parseInt(e.target.value) }))}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="5000"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) }))}
                className="flex-1"
              />
            </div>
          </div>

          {/* Reset Filters */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Showing {filteredTrips.length} of {trips.length} trips
            </span>
            <button
              onClick={resetFilters}
              className="text-sm text-pink-600 hover:text-pink-700 font-medium"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Results */}
        {filteredTrips.length > 0 ? (
          <div className="space-y-6">
            {filteredTrips.map(trip => (
              <div key={trip._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Left Side - Trip Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-pink-100 to-pink-200 rounded-lg flex items-center justify-center">
                          <Bus className="w-6 h-6 text-pink-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{trip.routeName}</h3>
                          <p className="text-gray-600">
                            {typeof trip.fromCity === 'object' ? trip.fromCity?.city || trip.fromCity?.location || 'Unknown' : trip.fromCity} → 
                            {typeof trip.toCity === 'object' ? trip.toCity?.city || trip.toCity?.location || 'Unknown' : trip.toCity}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{trip.startTime} - {trip.endTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{formatDuration(trip.startTime, trip.endTime)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{trip.availableSeats || 'N/A'} seats available</span>
                        </div>
                      </div>

                      {/* Amenities */}
                      {trip.amenities && trip.amenities.length > 0 && (
                        <div className="flex items-center gap-4 mb-4">
                          <span className="text-sm text-gray-600">Amenities:</span>
                          <div className="flex gap-2">
                            {trip.amenities.map((amenity, index) => (
                              <div key={index} className="flex items-center gap-1 text-xs text-gray-500">
                                {getAmenityIcon(amenity)}
                                <span>{amenity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bus Details */}
                      <div className="text-sm text-gray-500">
                        <p>Bus Type: {trip.busType || 'AC Sleeper'}</p>
                        <p>Operator: {trip.operator || 'Kerala State Transport'}</p>
                        <p>Date: {trip.date ? new Date(trip.date).toDateString() : 'N/A'}</p>
                      </div>
                    </div>

                    {/* Right Side - Price and Book Button */}
                    <div className="flex flex-col items-end gap-4">
                      <div className="text-right">
                        <div className="text-3xl font-bold text-pink-600">₹{trip.fare}</div>
                        <div className="text-sm text-gray-500">per seat</div>
                      </div>
                      
                      <button 
                        onClick={() => handleBookNow(trip)}
                        className="bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg"
                      >
                        <Heart className="w-5 h-5" />
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      <span>Distance: {trip.distanceKm || 'N/A'} km</span>
                      <span>Capacity: {trip.capacity || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span>{trip.rating || '4.5'} ({trip.totalRatings || '128'} reviews)</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bus className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No trips found</h3>
            <p className="text-gray-600 mb-6">No trips match your current search criteria.</p>
            <button 
              onClick={resetFilters}
              className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailableTrips;
