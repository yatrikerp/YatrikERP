import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Bus, Clock, MapPin, Star, Filter, SortAsc, SortDesc, Search, Calendar, Wifi, Snowflake, Users, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import './landing.css';

const TripResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('departure');
  const [filters, setFilters] = useState({
    busType: [],
    departureTime: [],
    amenities: [],
    rating: 0
  });

  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const date = searchParams.get('date');
  const tripType = searchParams.get('tripType') || 'oneWay';
  const returnDate = searchParams.get('returnDate');

  // Kerala-specific bus operators and routes
  const keralaOperators = [
    'Kerala State Road Transport Corporation (KSRTC)',
    'Kerala RTC',
    'Kerala Express',
    'Kerala Travels',
    'Kerala Bus Service',
    'Kerala Transport',
    'Kerala Expressways',
    'Kerala Highways',
    'Kerala Roadways',
    'Kerala Fast Track'
  ];

  const keralaRoutes = [
    { from: 'Thiruvananthapuram', to: 'Kochi', distance: 200, popular: true },
    { from: 'Kochi', to: 'Kozhikode', distance: 180, popular: true },
    { from: 'Thiruvananthapuram', to: 'Kozhikode', distance: 380, popular: true },
    { from: 'Kochi', to: 'Thrissur', distance: 60, popular: false },
    { from: 'Kozhikode', to: 'Kannur', distance: 90, popular: false },
    { from: 'Thrissur', to: 'Palakkad', distance: 80, popular: false },
    { from: 'Kollam', to: 'Thiruvananthapuram', distance: 70, popular: false },
    { from: 'Kottayam', to: 'Kochi', distance: 65, popular: false }
  ];

  useEffect(() => {
    searchTrips();
  }, [from, to, date, tripType, returnDate]);

  const searchTrips = async () => {
    try {
      setLoading(true);
      setError('');

      const queryParams = new URLSearchParams({
        from,
        to,
        date,
        tripType
      });

      if (tripType === 'roundTrip' && returnDate) {
        queryParams.append('returnDate', returnDate);
      }

      const response = await fetch(`/api/booking/search?${queryParams}`);
      const data = await response.json();

      if (data.ok) {
        // Enhance trips with Kerala-specific data
        const enhancedTrips = (data.data.trips || []).map((trip, index) => {
          const operator = keralaOperators[index % keralaOperators.length];
          const route = keralaRoutes.find(r => 
            (r.from.toLowerCase().includes(from?.toLowerCase()) || 
             r.to.toLowerCase().includes(to?.toLowerCase()))
          ) || keralaRoutes[0];

          return {
            ...trip,
            operator: operator,
            routeName: `${route.from} to ${route.to}`,
            distance: route.distance,
            rating: 4.2 + (Math.random() * 0.8), // 4.2 to 5.0
            reviews: Math.floor(Math.random() * 500) + 100,
            amenities: getRandomAmenities(),
            busType: getRandomBusType(),
            departure: trip.departure || trip.startTime || getRandomDepartureTime(),
            arrival: trip.arrival || getRandomArrivalTime(trip.departure || trip.startTime),
            fare: calculateKeralaFare(route.distance),
            availableSeats: Math.floor(Math.random() * 20) + 5,
            totalSeats: 35,
            features: getRandomFeatures(),
            cancellationPolicy: getRandomCancellationPolicy(),
            boardingPoints: getRandomBoardingPoints(from),
            droppingPoints: getRandomDroppingPoints(to)
          };
        });

        setTrips(enhancedTrips);
      } else {
        setError(data.message || 'Search failed');
        setTrips([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search trips. Please try again.');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for Kerala-specific data
  const getRandomAmenities = () => {
    const allAmenities = ['WiFi', 'USB Charging', 'AC', 'Water Bottle', 'Blanket', 'Pillow', 'Entertainment', 'Refreshments'];
    const count = Math.floor(Math.random() * 4) + 3;
    return allAmenities.sort(() => 0.5 - Math.random()).slice(0, count);
  };

  const getRandomBusType = () => {
    const types = ['AC Sleeper (2+1)', 'AC Seater', 'Non-AC Sleeper', 'AC Seater/Sleeper', 'Volvo AC', 'Bharat Benz AC'];
    return types[Math.floor(Math.random() * types.length)];
  };

  const getRandomDepartureTime = () => {
    const hours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
    const hour = hours[Math.floor(Math.random() * hours.length)];
    const minute = Math.floor(Math.random() * 4) * 15;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const getRandomArrivalTime = (departure) => {
    if (!departure) return '06:00';
    const [hour, minute] = departure.split(':').map(Number);
    const duration = Math.floor(Math.random() * 4) + 4; // 4-7 hours
    const arrivalHour = (hour + duration) % 24;
    return `${arrivalHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const calculateKeralaFare = (distance) => {
    const baseFare = 50;
    const perKmRate = 2.5;
    const total = baseFare + (distance * perKmRate);
    return Math.round(total / 10) * 10; // Round to nearest 10
  };

  const getRandomFeatures = () => {
    const features = ['Live Tracking', 'Free Cancellation', 'Premium Service', 'New Bus', 'High Rated', 'Single Seats'];
    const count = Math.floor(Math.random() * 3) + 2;
    return features.sort(() => 0.5 - Math.random()).slice(0, count);
  };

  const getRandomCancellationPolicy = () => {
    const policies = [
      'Free cancellation up to 2 hours before departure',
      '50% refund if cancelled 1 hour before departure',
      'No refund for cancellations within 1 hour',
      'Free date change up to 24 hours before departure'
    ];
    return policies[Math.floor(Math.random() * policies.length)];
  };

  const getRandomBoardingPoints = (city) => {
    const points = {
      'Thiruvananthapuram': ['Central Bus Station', 'Thampanoor', 'Pettah', 'Kovalam Junction'],
      'Kochi': ['Ernakulam Junction', 'Vyttila Hub', 'Aluva', 'Fort Kochi'],
      'Kozhikode': ['Mananchira', 'Beach Road', 'Railway Station', 'Medical College'],
      'Thrissur': ['Round South', 'Shakthan Thampuran', 'Railway Station', 'KSRTC Stand'],
      'Kollam': ['KSRTC Bus Stand', 'Railway Station', 'Beach Road', 'Chinnakada']
    };
    return points[city] || ['Central Bus Station', 'Main Junction'];
  };

  const getRandomDroppingPoints = (city) => {
    const points = {
      'Thiruvananthapuram': ['Central Bus Station', 'Thampanoor', 'Pettah', 'Kovalam Junction'],
      'Kochi': ['Ernakulam Junction', 'Vyttila Hub', 'Aluva', 'Fort Kochi'],
      'Kozhikode': ['Mananchira', 'Beach Road', 'Railway Station', 'Medical College'],
      'Thrissur': ['Round South', 'Shakthan Thampuran', 'Railway Station', 'KSRTC Stand'],
      'Kollam': ['KSRTC Bus Stand', 'Railway Station', 'Beach Road', 'Chinnakada']
    };
    return points[city] || ['Central Bus Station', 'Main Junction'];
  };

  const handleBookNow = (trip) => {
    if (!user) {
      navigate(`/login?next=/booking/${trip._id}&from=${from}&to=${to}&date=${date}`);
      return;
    }
    navigate(`/booking/${trip._id}`);
  };

  const handleLogin = () => {
    navigate(`/login?next=/search-results?${searchParams.toString()}`);
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time.length === 5 ? time : time.slice(0, 5);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateDuration = (departure, arrival) => {
    if (!departure || !arrival) return '';
    const dep = new Date(`2000-01-01T${departure}`);
    const arr = new Date(`2000-01-01T${arrival}`);
    if (arr < dep) arr.setDate(arr.getDate() + 1);
    const diff = arr - dep;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner text="Searching for Kerala trips..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="text-2xl font-bold text-red-600">YATRIK</div>
              <div className="flex space-x-6">
                <button className="px-4 py-2 text-red-600 border-b-2 border-red-600 font-medium">
                  Bus tickets
                </button>
                <button className="px-4 py-2 text-gray-600 hover:text-red-600">
                  Train tickets
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <button className="text-gray-600 hover:text-red-600">Bookings</button>
              <button className="text-gray-600 hover:text-red-600">Help</button>
              {!user ? (
                <button onClick={handleLogin} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                  Account
                </button>
              ) : (
                <button className="text-gray-600 hover:text-red-600">Account</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-gray-500" />
                <span className="font-medium">From {from}</span>
              </div>
              <div className="text-gray-400">→</div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-gray-500" />
                <span className="font-medium">To {to}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <span>Date of journey: {formatDate(date)}</span>
              </div>
              <button className="bg-gray-100 px-3 py-1 rounded text-sm">Today</button>
              <button className="bg-gray-100 px-3 py-1 rounded text-sm">Tomorrow</button>
              <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            Bus Ticket {'->'} {from} to {to} Bus
          </div>
        </div>
      </div>

      {/* Kerala Special Promotional Cards */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-6 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg border">
              <div className="text-sm font-medium text-blue-800 mb-2">Kerala Routes</div>
              <div className="text-xs text-blue-600">Premium connectivity</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border">
              <div className="text-sm font-medium text-green-800 mb-2">KSRTC</div>
              <div className="text-xs text-green-600">Government service</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg border">
              <div className="text-sm font-medium text-yellow-800 mb-2">Premium</div>
              <div className="text-xs text-yellow-600">Top rated buses</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg border">
              <div className="text-sm font-medium text-purple-800 mb-2">FlexiTicket</div>
              <div className="text-xs text-purple-600">Free date change</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg border">
              <div className="text-sm font-medium text-orange-800 mb-2">Last Min Deals</div>
              <div className="text-xs text-orange-600">Limited time offers</div>
            </div>
            <div className="bg-pink-50 p-3 rounded-lg border">
              <div className="text-sm font-medium text-pink-800 mb-2">Women Deal</div>
              <div className="text-xs text-pink-600">Exclusive offers</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-semibold text-lg mb-4">Filter buses</h3>
              
              {/* Bus Type Filters */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">Bus Type</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">AC (143)</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Sleeper (144)</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Seater (51)</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Non-AC (10)</span>
                  </label>
                </div>
              </div>

              {/* Departure Time Filters */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">Departure Time</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">06:00 - 12:00 (10)</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">18:00 - 24:00 (116)</span>
                  </label>
                </div>
              </div>

              {/* Features Filters */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">Features</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Live Tracking (118)</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">High Rated (144)</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Single Seats (142)</span>
                  </label>
                </div>
              </div>

              {/* Kerala Specific Filters */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">Kerala Routes</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">KSRTC (45)</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Private Operators (98)</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Premium Routes (67)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Search Results */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{trips.length} buses found</h2>
                  <p className="text-sm text-gray-600">50000+ searches on this Kerala route last month</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border rounded px-3 py-1 text-sm"
                  >
                    <option value="departure">Departure time</option>
                    <option value="price">Price</option>
                    <option value="rating">Rating</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Trip Results */}
            {error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-600 font-medium">{error}</p>
                <button
                  onClick={searchTrips}
                  className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : trips.length > 0 ? (
              <div className="space-y-4">
                {trips.map((trip, index) => (
                  <div key={trip._id || index} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex justify-between">
                      {/* Left side - Bus details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {trip.operator}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                              <div className="flex items-center space-x-1">
                                <Bus className="w-4 h-4" />
                                <span>{trip.busType}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-yellow-500" />
                                <span>{trip.rating.toFixed(1)} ({trip.reviews} reviews)</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{trip.distance} km</span>
                              </div>
                            </div>
                            
                            {/* Route and Features */}
                            <div className="flex items-center space-x-4 mb-3">
                              <span className="text-lg font-medium text-gray-800">
                                {trip.routeName}
                              </span>
                              <div className="flex space-x-2">
                                {trip.features.map((feature, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                  >
                                    {feature}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-red-600">
                              ₹{trip.fare}
                            </div>
                            <div className="text-sm text-gray-500">
                              {trip.availableSeats} seats available
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Total: {trip.totalSeats} seats
                            </div>
                          </div>
                        </div>

                        {/* Time and Duration */}
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-sm text-gray-500 mb-1">Departure</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {formatTime(trip.departure)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-500 mb-1">Duration</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {calculateDuration(trip.departure, trip.arrival)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-500 mb-1">Arrival</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {formatTime(trip.arrival)}
                            </div>
                          </div>
                        </div>

                        {/* Amenities */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {trip.amenities.map((amenity, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {amenity === 'WiFi' && <Wifi className="w-3 h-3 mr-1" />}
                              {amenity === 'AC' && <Snowflake className="w-3 h-3 mr-1" />}
                              {amenity === 'Water Bottle' && <Users className="w-3 h-3 mr-1" />}
                              {amenity === 'Entertainment' && <Shield className="w-3 h-3 mr-1" />}
                              {amenity}
                            </span>
                          ))}
                        </div>

                        {/* Boarding and Dropping Points */}
                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                          <div>
                            <div className="font-medium text-gray-700 mb-2">Boarding Points:</div>
                            <div className="space-y-1">
                              {trip.boardingPoints.slice(0, 3).map((point, idx) => (
                                <div key={idx} className="text-gray-600">• {point}</div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-700 mb-2">Dropping Points:</div>
                            <div className="space-y-1">
                              {trip.droppingPoints.slice(0, 3).map((point, idx) => (
                                <div key={idx} className="text-gray-600">• {point}</div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Cancellation Policy */}
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-700">
                            <span className="font-medium">Cancellation Policy:</span> {trip.cancellationPolicy}
                          </div>
                        </div>

                        {/* Additional options */}
                        <div className="flex space-x-6 text-sm text-gray-600">
                          <button className="hover:text-red-600">Why book this bus?</button>
                          <button className="hover:text-red-600">Boarding/Dropping Points</button>
                          <button className="hover:text-red-600">Ratings & Reviews</button>
                          <button className="hover:text-red-600">Bus Photos</button>
                          <button className="hover:text-red-600">Cancellation Policies</button>
                        </div>
                      </div>

                      {/* Right side - Action button */}
                      <div className="ml-6 flex flex-col justify-center">
                        <button
                          onClick={() => handleBookNow(trip)}
                          className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
                        >
                          View seats
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <div className="max-w-md mx-auto">
                  <Bus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No trips found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    We couldn't find any trips matching your search criteria. 
                    Try adjusting your dates or check back later for new schedules.
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Search Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripResults;
