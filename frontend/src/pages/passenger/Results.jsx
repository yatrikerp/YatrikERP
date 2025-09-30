import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin, Clock, Bus, Users, Star,
  Filter, ArrowRight, Wifi,
  Snowflake, Tv, RefreshCw, AlertCircle
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

const PassengerResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    busType: 'all',
    departureTime: 'all',
    maxPrice: 1000,
    amenities: []
  });

  // Get search parameters from URL
  const searchParams = new URLSearchParams(location.search);
  const searchCriteria = {
    from: searchParams.get('from'),
    to: searchParams.get('to'),
    date: searchParams.get('date'),
    passengers: searchParams.get('passengers')
  };

  useEffect(() => {
    if (searchCriteria.from && searchCriteria.to && searchCriteria.date) {
      fetchAvailableTrips();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchCriteria.from, searchCriteria.to, searchCriteria.date]);

  const fetchAvailableTrips = async () => {
    try {
      setLoading(true);

      // Align with existing backend GET endpoint
      const params = new URLSearchParams({
        from: searchCriteria.from || '',
        to: searchCriteria.to || '',
        date: searchCriteria.date || ''
      });

      const response = await apiFetch(`/api/passenger/trips/search?${params.toString()}`);

      if (response && response.ok) {
        const list = response.data?.data?.trips || response.data?.trips || [];
        setTrips(Array.isArray(list) ? list : []);
      } else {
        console.error('Failed to fetch trips:', response?.message);
        setTrips([]);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTrips = () => {
    return trips.filter(trip => {
      // Bus type filter
      if (filters.busType !== 'all' && trip.bus?.busType !== filters.busType) {
        return false;
      }

      // Price filter
      if (trip.fare > filters.maxPrice) {
        return false;
      }

      // Departure time filter
      if (filters.departureTime !== 'all') {
        const hour = parseInt(trip.startTime?.split(':')[0] || '0');
        switch (filters.departureTime) {
          case 'early': if (hour >= 12) return false; break;
          case 'afternoon': if (hour < 12 || hour >= 18) return false; break;
          case 'evening': if (hour < 18) return false; break;
          default: break;
        }
      }

      return true;
    });
  };

  const getBusTypeIcon = (busType) => {
    switch (busType) {
      case 'ac': return <Snowflake className="w-4 h-4" />;
      case 'deluxe': return <Star className="w-4 h-4" />;
      case 'sleeper': return <Users className="w-4 h-4" />;
      default: return <Bus className="w-4 h-4" />;
    }
  };

  const getBusTypeName = (busType) => {
    switch (busType) {
      case 'ac': return 'AC';
      case 'deluxe': return 'Deluxe';
      case 'sleeper': return 'Sleeper';
      default: return 'Standard';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';

    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);

    const diffMinutes = (end - start) / (1000 * 60);
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    return `${hours}h ${minutes}m`;
  };

  const handleBookTrip = (trip) => {
    // Navigate to booking page with trip details
    navigate(`/passenger/booking/${trip._id}`, {
      state: { trip, searchCriteria }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Searching for available trips...</p>
        </div>
      </div>
    );
  }

  const filteredTrips = getFilteredTrips();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Available Trips</h1>
              <p className="text-gray-600">
                {searchCriteria.from} → {searchCriteria.to} on {new Date(searchCriteria.date).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={fetchAvailableTrips}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filters
              </h3>

              <div className="space-y-4">
                {/* Bus Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bus Type</label>
                  <select
                    value={filters.busType}
                    onChange={(e) => setFilters(prev => ({ ...prev, busType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="standard">Standard</option>
                    <option value="deluxe">Deluxe</option>
                    <option value="ac">AC</option>
                    <option value="sleeper">Sleeper</option>
                  </select>
                </div>

                {/* Departure Time Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Departure Time</label>
                  <select
                    value={filters.departureTime}
                    onChange={(e) => setFilters(prev => ({ ...prev, departureTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="all">Any Time</option>
                    <option value="early">Early Morning (6 AM - 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM - 6 PM)</option>
                    <option value="evening">Evening (6 PM - 10 PM)</option>
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Price: ₹{filters.maxPrice}
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="50"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {filteredTrips.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No trips found</h3>
                <p className="text-gray-600 mb-4">
                  No buses are available for your selected route and date.
                </p>
                <button
                  onClick={() => navigate('/passenger/search')}
                  className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                >
                  Modify Search
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTrips.map((trip, index) => (
                  <motion.div
                    key={trip._id || trip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-pink-100 rounded-lg">
                          <Bus className="w-6 h-6 text-pink-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {trip.route?.routeNumber || trip.routeNumber || 'N/A'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {trip.route?.routeName || trip.routeName || 'Unknown Route'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-pink-600">₹{trip.fare}</div>
                        <div className="text-sm text-gray-600">per person</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{formatTime(trip.startTime || trip.departureTime)} - {formatTime(trip.endTime || trip.arrivalTime)}</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{formatDuration(trip.startTime || trip.departureTime, trip.endTime || trip.arrivalTime)}</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{trip.bookedSeats || 0}/{trip.capacity || trip.totalSeats || 0} seats</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        {getBusTypeIcon(trip.bus?.busType || trip.busType)}
                        <span className="ml-2">{getBusTypeName(trip.bus?.busType || trip.busType)}</span>
                      </div>
                    </div>

                    {/* Bus Amenities */}
                    {trip.bus?.amenities && trip.bus.amenities.length > 0 && (
                      <div className="flex items-center space-x-4 mb-4">
                        {trip.bus.amenities.includes('wifi') && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Wifi className="w-4 h-4 mr-1" />
                            <span>WiFi</span>
                          </div>
                        )}
                        {trip.bus.amenities.includes('ac') && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Snowflake className="w-4 h-4 mr-1" />
                            <span>AC</span>
                          </div>
                        )}
                        {trip.bus.amenities.includes('tv') && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Tv className="w-4 h-4 mr-1" />
                            <span>TV</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Route Stops Preview */}
                    {trip.route?.stops && trip.route.stops.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Route stops:</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{trip.route.startingPoint?.city}</span>
                          <ArrowRight className="w-3 h-3" />
                          <span className="truncate max-w-xs">
                            {trip.route.stops.slice(0, 2).map(stop => stop.stopName).join(' → ')}
                            {trip.route.stops.length > 2 && ' ...'}
                          </span>
                          <ArrowRight className="w-3 h-3" />
                          <span>{trip.route.endingPoint?.city}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Bus:</span> {trip.bus?.busNumber || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Available:</span> {trip.availableSeats || 0} seats
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button className="px-4 py-2 text-pink-600 border border-pink-600 rounded-lg hover:bg-pink-50 transition-colors">
                          View Details
                        </button>
                        <button
                          onClick={() => handleBookTrip(trip)}
                          className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassengerResults;