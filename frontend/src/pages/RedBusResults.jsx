import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Users, 
  Star, 
  Wifi, 
  Droplets, 
  Zap, 
  Coffee, 
  ArrowLeft,
  Filter,
  SortAsc,
  Bus,
  MapPin,
  Calendar
} from 'lucide-react';
import { apiFetch } from '../utils/api';

const RedBusResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    priceRange: [0, 2000],
    busType: 'all',
    departureTime: 'all',
    amenities: []
  });
  const [sortBy, setSortBy] = useState('price');
  const [showFilters, setShowFilters] = useState(false);

  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const date = searchParams.get('date') || '';
  const passengers = searchParams.get('passengers') || '1';
  const bookingForWomen = searchParams.get('bookingForWomen') === 'true';

  useEffect(() => {
    fetchTrips();
  }, [from, to, date]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        from,
        to,
        date
      });
      
      const response = await apiFetch(`/api/trips/search?${params.toString()}`);
      
      if (response.ok) {
        setTrips(response.data.data?.trips || response.data.trips || []);
      } else {
        console.error('Failed to fetch trips:', response.message);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAmenityIcon = (amenity) => {
    switch (amenity.toLowerCase()) {
      case 'wifi': return <Wifi className="w-4 h-4" />;
      case 'ac': return <Droplets className="w-4 h-4" />;
      case 'charging': return <Zap className="w-4 h-4" />;
      case 'refreshments': return <Coffee className="w-4 h-4" />;
      default: return <Bus className="w-4 h-4" />;
    }
  };

  const getBusTypeColor = (busType) => {
    switch (busType.toLowerCase()) {
      case 'ac_sleeper': return 'bg-blue-100 text-blue-800';
      case 'ac_seater': return 'bg-green-100 text-green-800';
      case 'non_ac_sleeper': return 'bg-orange-100 text-orange-800';
      case 'non_ac_seater': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleBookNow = (trip) => {
    navigate(`/redbus/board-drop/${trip._id}`, {
      state: { 
        trip, 
        searchData: { from, to, date, passengers, bookingForWomen } 
      }
    });
  };

  const filteredTrips = trips.filter(trip => {
    // Price filter
    if (trip.fare < filters.priceRange[0] || trip.fare > filters.priceRange[1]) {
      return false;
    }
    
    // Bus type filter
    if (filters.busType !== 'all' && trip.busType !== filters.busType) {
      return false;
    }
    
    return true;
  });

  const sortedTrips = [...filteredTrips].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.fare - b.fare;
      case 'departure':
        return new Date(a.startTime) - new Date(b.startTime);
      case 'duration':
        return a.duration - b.duration;
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Searching for buses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/redbus')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Search</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{from} → {to}</span>
                <Calendar className="w-4 h-4 ml-4" />
                <span>{formatDate(date)}</span>
                <Users className="w-4 h-4 ml-4" />
                <span>{passengers} {passengers === '1' ? 'Passenger' : 'Passengers'}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="price">Sort by Price</option>
                <option value="departure">Sort by Departure</option>
                <option value="duration">Sort by Duration</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-64 bg-white rounded-lg shadow-sm p-4 h-fit">
              <h3 className="font-semibold text-gray-900 mb-4">Filters</h3>
              
              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range: ₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  value={filters.priceRange[1]}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    priceRange: [prev.priceRange[0], parseInt(e.target.value)] 
                  }))}
                  className="w-full"
                />
              </div>

              {/* Bus Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Bus Type</label>
                <select
                  value={filters.busType}
                  onChange={(e) => setFilters(prev => ({ ...prev, busType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Types</option>
                  <option value="ac_sleeper">AC Sleeper</option>
                  <option value="ac_seater">AC Seater</option>
                  <option value="non_ac_sleeper">Non-AC Sleeper</option>
                  <option value="non_ac_seater">Non-AC Seater</option>
                </select>
              </div>
            </div>
          )}

          {/* Results */}
          <div className="flex-1">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {sortedTrips.length} buses found
              </h2>
              <p className="text-sm text-gray-600">
                {from} to {to} • {formatDate(date)}
              </p>
            </div>

            {sortedTrips.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <Bus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No buses found</h3>
                <p className="text-gray-600 mb-4">
                  We couldn't find any buses for your selected route and date.
                </p>
                <button
                  onClick={() => navigate('/redbus')}
                  className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700"
                >
                  Modify Search
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedTrips.map((trip) => (
                  <div key={trip._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        {/* Bus Info */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                              <Bus className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {trip.operator || 'YATRIK Transport'}
                              </h3>
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBusTypeColor(trip.busType)}`}>
                                  {trip.busType?.replace('_', ' ').toUpperCase() || 'BUS'}
                                </span>
                                <div className="flex items-center space-x-1">
                                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                  <span className="text-sm text-gray-600">4.5</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Route Info */}
                          <div className="flex items-center space-x-6 mb-4">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {formatTime(trip.startTime)} - {formatTime(trip.endTime)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {trip.availableSeats || trip.capacity} seats available
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              Duration: {Math.floor((trip.duration || 240) / 60)}h {(trip.duration || 240) % 60}m
                            </div>
                          </div>

                          {/* Amenities */}
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">Amenities:</span>
                            <div className="flex items-center space-x-2">
                              {['AC', 'WiFi', 'Charging', 'Refreshments'].map((amenity) => (
                                <div key={amenity} className="flex items-center space-x-1 text-gray-500">
                                  {getAmenityIcon(amenity)}
                                  <span className="text-xs">{amenity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Price & Book */}
                        <div className="text-right">
                          <div className="mb-4">
                            <div className="text-2xl font-bold text-gray-900">₹{trip.fare}</div>
                            <div className="text-sm text-gray-600">per seat</div>
                          </div>
                          <button
                            onClick={() => handleBookNow(trip)}
                            className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 font-medium"
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedBusResults;
