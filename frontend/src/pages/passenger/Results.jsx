import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Bus, 
  Clock, 
  MapPin, 
  Users, 
  Star,
  ArrowRight,
  Wifi,
  Zap,
  Coffee,
  Accessibility,
  Music,
  Shield,
  Heart
} from 'lucide-react';

const PassengerResults = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadTrips() {
      try {
        setLoading(true);
        const raw = Object.fromEntries(params.entries());
        const mapped = new URLSearchParams({
          from: raw.from || raw.fromCity || '',
          to: raw.to || raw.toCity || '',
          date: raw.date || ''
        });
        
        const res = await apiFetch(`/api/trips/search?${mapped.toString()}`);
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
    }
    
    loadTrips();
  }, [params]);

  const handleBookNow = (trip) => {
    if (!user) {
      navigate(`/login?next=/passenger/boarddrop/${trip._id}`);
      return;
    }
    
    // Navigate to boarding/dropping point selection
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

  const formatDuration = (startTime, endTime) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Searching for trips...</p>
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
            onClick={() => navigate('/passenger/search')}
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => navigate('/passenger/search')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to Search
            </button>
            <button 
              onClick={() => navigate('/passenger/available-trips')}
              className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium"
            >
              <Bus className="w-4 h-4" />
              View All Scheduled Trips
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Available Trips</h1>
          <p className="text-gray-600 mt-2">
            {params.get('from')} → {params.get('to')} • {new Date(params.get('date')).toDateString()}
          </p>
        </div>

        {/* Results */}
        {trips.length > 0 ? (
          <div className="space-y-6">
            {trips.map(trip => (
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
                          <span>{trip.availableSeats} seats available</span>
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
            <p className="text-gray-600 mb-6">We couldn't find any trips for your search criteria.</p>
            <button 
              onClick={() => navigate('/passenger/search')}
              className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors"
            >
              Search Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PassengerResults;