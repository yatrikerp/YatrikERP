import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MapPin, Clock, Bus, Users, Star,
  Filter, ArrowRight, Wifi,
  Snowflake, Tv, RefreshCw, AlertCircle,
  Zap, Eye
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

const MobilePassengerResults = () => {
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

      const params = new URLSearchParams({
        from: searchCriteria.from || '',
        to: searchCriteria.to || '',
        date: searchCriteria.date || ''
      });

      // Use the correct passenger API endpoint
      const response = await apiFetch(`/api/passenger/trips/search?${params.toString()}`);
      
      if (response && response.ok) {
        setTrips(response.data?.trips || []);
      } else {
        console.error('Failed to fetch trips');
        setTrips([]);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookTrip = (tripId) => {
    navigate(`/passenger/booking/${tripId}`);
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ width: '100vw', maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowRight className="w-4 h-4 text-gray-600 rotate-180" />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold text-gray-900">Available Trips</h1>
              <p className="text-sm text-gray-600">
                {searchCriteria.from} → {searchCriteria.to}
              </p>
            </div>
            <button className="p-2 rounded-lg hover:bg-gray-100">
              <Filter className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
            <span className="ml-3 text-gray-600">Loading trips...</span>
          </div>
        ) : trips.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <Bus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No trips found</h3>
            <p className="text-gray-600 mb-4">
              Sorry, no buses are available for your selected route and date.
            </p>
            <button
              onClick={() => navigate('/passenger/search')}
              className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Search Again
            </button>
          </div>
        ) : (
          trips.map((trip) => (
            <div key={trip._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              {/* Trip Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Bus className="w-5 h-5 text-pink-500" />
                  <span className="font-semibold text-gray-900">{trip.busNumber || trip.bus?.busNumber || trip.routeNumber || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">{trip.rating || '4.5'}</span>
                </div>
              </div>

              {/* Trip Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(trip.startTime || trip.departureTime)} - {formatTime(trip.endTime || trip.arrivalTime)}</span>
                  <span className="text-gray-400">•</span>
                  <span>{formatDuration(trip.duration)}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{trip.fromCity || trip.route?.from || searchCriteria.from} → {trip.toCity || trip.route?.to || searchCriteria.to}</span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{trip.availableSeats || (trip.capacity - (trip.bookedSeats || 0))} seats available</span>
                </div>
              </div>

              {/* Bus Type and Amenities */}
              <div className="flex items-center space-x-4 mb-4">
                <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                  {trip.busType || trip.bus?.busType || 'Standard'}
                </span>
                <div className="flex items-center space-x-2">
                  {(trip.busType || '').toLowerCase().includes('ac') && (
                    <Snowflake className="w-4 h-4 text-blue-500" title="AC" />
                  )}
                  <Wifi className="w-4 h-4 text-green-500" title="WiFi" />
                  <Tv className="w-4 h-4 text-purple-500" title="TV" />
                </div>
              </div>

              {/* Price and Book Button */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-pink-600">₹{trip.fare || trip.price || 'N/A'}</span>
                  <span className="text-sm text-gray-500 ml-1">per seat</span>
                </div>
                <button
                  onClick={() => handleBookTrip(trip._id)}
                  className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
                >
                  <span>Book Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MobilePassengerResults;
