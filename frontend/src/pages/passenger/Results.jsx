import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin, Clock, Bus, Users, Star,
  Filter, ArrowRight, Wifi,
  Snowflake, Tv, RefreshCw, AlertCircle,
  Zap, Eye
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
    // Save trip context for booking flow
    const tripContext = {
      tripId: trip._id || trip.id,
      trip: trip,
      searchCriteria: searchCriteria,
      from: searchCriteria.from,
      to: searchCriteria.to,
      date: searchCriteria.date
    };
    
    localStorage.setItem('currentTripBooking', JSON.stringify(tripContext));
    
    // Navigate to board/drop selection (Step 1 of RedBus flow)
    navigate(`/passenger/boarddrop/${trip._id}`, {
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
        {/* Header - RedBus Style */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowRight className="w-5 h-5 rotate-180 text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Available Buses</h1>
              </div>
              <div className="flex items-center gap-4 text-sm ml-14">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-50 rounded-lg">
                  <MapPin className="w-4 h-4 text-pink-600" />
                  <span className="font-semibold text-gray-900">{searchCriteria.from}</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold text-gray-900">{searchCriteria.to}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{new Date(searchCriteria.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
            <button
              onClick={fetchAvailableTrips}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
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
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {filteredTrips.length} {filteredTrips.length === 1 ? 'Bus' : 'Buses'} Found
              </h2>
              <div className="text-sm text-gray-600">
                Sorted by: <span className="font-medium">Departure Time</span>
              </div>
            </div>

            {filteredTrips.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
                <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-10 h-10 text-pink-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No Buses Available</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Sorry, no buses are available for <strong>{searchCriteria.from}</strong> to <strong>{searchCriteria.to}</strong> on {new Date(searchCriteria.date).toLocaleDateString()}
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => navigate('/passenger/search')}
                    className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium"
                  >
                    Modify Search
                  </button>
                  <button
                    onClick={() => navigate('/passenger/dashboard')}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTrips.map((trip, index) => (
                  <motion.div
                    key={trip._id || trip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl border-2 border-gray-100 shadow-sm p-6 hover:shadow-lg hover:border-pink-200 transition-all"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
                          <Bus className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {trip.route?.routeName || trip.routeName || 'Kerala State Transport'}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                              {trip.route?.routeNumber || trip.routeNumber || 'KL-Express'}
                            </span>
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-medium text-gray-700 ml-1">4.3</span>
                              <span className="text-xs text-gray-500 ml-1">(856 ratings)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500 mb-1">Starts from</div>
                        <div className="text-3xl font-bold text-pink-600">₹{trip.fare}</div>
                      </div>
                    </div>

                    {/* Journey Timeline - RedBus Style */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div>
                            <div className="text-2xl font-bold text-gray-900">{formatTime(trip.startTime || trip.departureTime)}</div>
                            <div className="text-sm text-gray-600">{searchCriteria.from}</div>
                          </div>
                          <div className="flex-1 flex flex-col items-center">
                            <div className="text-xs text-gray-500 mb-1">{formatDuration(trip.startTime || trip.departureTime, trip.endTime || trip.arrivalTime)}</div>
                            <div className="w-full h-0.5 bg-gray-300 relative">
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full"></div>
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full"></div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Non-stop</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-gray-900">{formatTime(trip.endTime || trip.arrivalTime)}</div>
                            <div className="text-sm text-gray-600">{searchCriteria.to}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Trip Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          {getBusTypeIcon(trip.bus?.busType || trip.busType)}
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Bus Type</div>
                          <div className="text-sm font-semibold text-gray-900">{getBusTypeName(trip.bus?.busType || trip.busType)}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                          <Users className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Available</div>
                          <div className="text-sm font-semibold text-green-600">{trip.availableSeats || trip.capacity || 0} Seats</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                          <Star className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Rating</div>
                          <div className="text-sm font-semibold text-gray-900">4.3 ⭐</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                          <Bus className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Bus Number</div>
                          <div className="text-sm font-semibold text-gray-900">{trip.bus?.busNumber || 'KL-01-AB-1234'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Amenities - RedBus Style */}
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Amenities:</span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-md">
                          <Wifi className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-medium text-blue-700">WiFi</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-50 rounded-md">
                          <Snowflake className="w-4 h-4 text-cyan-600" />
                          <span className="text-xs font-medium text-cyan-700">AC</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 rounded-md">
                          <Zap className="w-4 h-4 text-purple-600" />
                          <span className="text-xs font-medium text-purple-700">Charging</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-md">
                          <Tv className="w-4 h-4 text-green-600" />
                          <span className="text-xs font-medium text-green-700">Screen</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons - RedBus Style */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button className="text-sm text-gray-600 hover:text-pink-600 font-medium transition-colors flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          View Seat Layout
                        </button>
                        <button className="text-sm text-gray-600 hover:text-pink-600 font-medium transition-colors flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          Boarding Points
                        </button>
                        <div className="px-3 py-1 bg-green-50 border border-green-200 rounded-md">
                          <span className="text-sm font-semibold text-green-700">{trip.availableSeats || trip.capacity || 0} seats left</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleBookTrip(trip)}
                        className="px-8 py-3.5 bg-gradient-to-r from-pink-600 via-pink-600 to-pink-700 text-white rounded-xl hover:from-pink-700 hover:via-pink-700 hover:to-pink-800 transition-all shadow-lg hover:shadow-2xl transform hover:-translate-y-1 font-bold text-base flex items-center gap-2"
                      >
                        Select Seats
                        <ArrowRight className="w-5 h-5" />
                      </button>
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