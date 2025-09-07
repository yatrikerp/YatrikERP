import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, MapPin, Calendar, Users, Clock, 
  Bus, Star, Filter, ArrowRight, CheckCircle 
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { toast } from 'react-hot-toast';

const TripSearch = () => {
  const [searchForm, setSearchForm] = useState({
    from: '',
    to: '',
    date: '',
    passengers: 1
  });
  
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    sortBy: 'departure',
    sortOrder: 'asc',
    priceRange: [0, 5000],
    busType: 'all'
  });

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchForm.from || !searchForm.to || !searchForm.date) {
      toast.error('Please fill in all search fields');
      return;
    }

    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        from: searchForm.from,
        to: searchForm.to,
        date: searchForm.date,
        passengers: searchForm.passengers,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      const response = await apiFetch(`/api/booking/search?${queryParams}`);
      
      if (response.ok) {
        setTrips(response.data.trips);
        if (response.data.trips.length === 0) {
          toast.info('No trips found for your search criteria');
        }
      } else {
        toast.error('Failed to search trips');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search trips');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString) => {
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
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'boarding': return 'bg-yellow-100 text-yellow-800';
      case 'running': return 'bg-green-100 text-green-800';
      case 'delayed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Find Your Perfect Trip</h1>
          <p className="mt-2 text-gray-600">Search and book bus tickets with ease</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchForm.from}
                    onChange={(e) => setSearchForm({...searchForm, from: e.target.value})}
                    placeholder="Enter departure city"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchForm.to}
                    onChange={(e) => setSearchForm({...searchForm, to: e.target.value})}
                    placeholder="Enter destination city"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    value={searchForm.date}
                    onChange={(e) => setSearchForm({...searchForm, date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passengers
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={searchForm.passengers}
                    onChange={(e) => setSearchForm({...searchForm, passengers: parseInt(e.target.value)})}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {[1,2,3,4,5,6,7,8,9,10].map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'Passenger' : 'Passengers'}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                {loading ? 'Searching...' : 'Search Trips'}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Filters */}
        {trips.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow p-4 mb-6"
          >
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="departure">Departure Time</option>
                <option value="fare">Price</option>
                <option value="duration">Duration</option>
              </select>
              
              <select
                value={filters.sortOrder}
                onChange={(e) => setFilters({...filters, sortOrder: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>

              <span className="text-sm text-gray-500">
                {trips.length} trip{trips.length !== 1 ? 's' : ''} found
              </span>
            </div>
          </motion.div>
        )}

        {/* Results */}
        <div className="space-y-4">
          {trips.map((trip, index) => (
            <motion.div
              key={trip._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Trip Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {trip.routeId?.routeName || 'Route Name'}
                      </h3>
                      <p className="text-gray-600">
                        {trip.routeId?.startingPoint} → {trip.routeId?.endingPoint}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                      {trip.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {formatDate(trip.serviceDate)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {formatTime(trip.startTime)} - {formatTime(trip.endTime)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Bus className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {trip.busId?.busNumber} ({trip.busId?.busType})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Capacity: {trip.capacity}</span>
                    <span>Available: {trip.availableSeats}</span>
                    <span>Driver: {trip.driverId?.name || 'Not Assigned'}</span>
                  </div>
                </div>

                {/* Price and Action */}
                <div className="flex flex-col items-end gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      ₹{trip.fare}
                    </div>
                    <div className="text-sm text-gray-500">per person</div>
                  </div>

                  <button
                    onClick={() => {
                      // Navigate to booking page
                      window.location.href = `/booking/trip/${trip._id}`;
                    }}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
                  >
                    Book Now
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* No Results */}
        {trips.length === 0 && !loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No trips found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or date</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TripSearch;
