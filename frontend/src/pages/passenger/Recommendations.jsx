import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Star, 
  Users, 
  Clock, 
  MapPin, 
  TrendingUp,
  Heart,
  Share2,
  ArrowRight,
  Bus,
  Calendar
} from 'lucide-react';

const Recommendations = () => {
  const navigate = useNavigate();
  const [popularRoutes, setPopularRoutes] = useState([]);
  const [frequentTrips, setFrequentTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - in real app, fetch from API
    const mockPopularRoutes = [
      {
        id: 1,
        route: 'Kochi → Bangalore',
        bookings: 2500,
        rating: 4.8,
        avgFare: 450,
        duration: '6h 30m',
        departureTimes: ['08:00', '14:00', '22:00'],
        amenities: ['AC', 'WiFi', 'USB Charging'],
        operator: 'Kerala State Transport',
        image: '/api/placeholder/300/200'
      },
      {
        id: 2,
        route: 'Kochi → Chennai',
        bookings: 1800,
        rating: 4.7,
        avgFare: 600,
        duration: '8h 0m',
        departureTimes: ['20:00', '22:00'],
        amenities: ['AC', 'WiFi', 'Water Bottle'],
        operator: 'Kerala State Transport',
        image: '/api/placeholder/300/200'
      },
      {
        id: 3,
        route: 'Kochi → Mumbai',
        bookings: 1200,
        rating: 4.6,
        avgFare: 800,
        duration: '12h 0m',
        departureTimes: ['18:00', '20:00'],
        amenities: ['AC', 'WiFi', 'USB Charging', 'Water Bottle'],
        operator: 'Kerala State Transport',
        image: '/api/placeholder/300/200'
      },
      {
        id: 4,
        route: 'Kochi → Thiruvananthapuram',
        bookings: 3200,
        rating: 4.5,
        avgFare: 250,
        duration: '4h 30m',
        departureTimes: ['06:00', '08:00', '14:00', '18:00'],
        amenities: ['AC', 'WiFi'],
        operator: 'Kerala State Transport',
        image: '/api/placeholder/300/200'
      },
      {
        id: 5,
        route: 'Kochi → Hyderabad',
        bookings: 900,
        rating: 4.4,
        avgFare: 700,
        duration: '10h 0m',
        departureTimes: ['19:00'],
        amenities: ['AC', 'WiFi', 'USB Charging'],
        operator: 'Kerala State Transport',
        image: '/api/placeholder/300/200'
      },
      {
        id: 6,
        route: 'Kochi → Goa',
        bookings: 1500,
        rating: 4.9,
        avgFare: 550,
        duration: '7h 0m',
        departureTimes: ['21:00'],
        amenities: ['AC', 'WiFi', 'USB Charging', 'Water Bottle'],
        operator: 'Kerala State Transport',
        image: '/api/placeholder/300/200'
      }
    ];

    const mockFrequentTrips = [
      {
        id: 1,
        route: 'Kochi → Thiruvananthapuram',
        count: 5,
        lastTrip: 'Dec 10, 2024',
        avgFare: 250,
        favoriteTime: '14:00',
        totalSpent: 1250
      },
      {
        id: 2,
        route: 'Kochi → Bangalore',
        count: 3,
        lastTrip: 'Nov 28, 2024',
        avgFare: 450,
        favoriteTime: '08:00',
        totalSpent: 1350
      },
      {
        id: 3,
        route: 'Kochi → Chennai',
        count: 2,
        lastTrip: 'Nov 15, 2024',
        avgFare: 600,
        favoriteTime: '20:00',
        totalSpent: 1200
      }
    ];

    setTimeout(() => {
      setPopularRoutes(mockPopularRoutes);
      setFrequentTrips(mockFrequentTrips);
      setLoading(false);
    }, 1000);
  }, []);

  const handleBookRoute = (route) => {
    const [from, to] = route.split(' → ');
    navigate('/passenger/booking', {
      state: { 
        fromCity: from, 
        toCity: to,
        date: new Date().toISOString().split('T')[0]
      }
    });
  };

  const handleBookFrequentTrip = (trip) => {
    const [from, to] = trip.route.split(' → ');
    navigate('/passenger/booking', {
      state: { 
        fromCity: from, 
        toCity: to,
        date: new Date().toISOString().split('T')[0],
        preferredTime: trip.favoriteTime
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/passenger/dashboard')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Recommendations</h1>
                <p className="text-sm text-gray-500">Discover popular routes and your frequent trips</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Popular Routes Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Popular Routes</h2>
              <p className="text-gray-600">Most booked destinations from Kochi</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularRoutes.map((route) => (
              <div key={route.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{route.route}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{route.bookings.toLocaleString()} bookings</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span>{route.rating}</span>
                        </div>
                      </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                      <Heart className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Average Fare</span>
                      <span className="font-semibold text-gray-900">₹{route.avgFare}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-semibold text-gray-900">{route.duration}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Departure Times</span>
                      <span className="font-semibold text-gray-900">{route.departureTimes.join(', ')}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-600">Amenities:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {route.amenities.map((amenity, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBookRoute(route.route)}
                      className="flex-1 bg-gradient-to-r from-pink-600 to-pink-700 text-white py-2 px-4 rounded-lg hover:from-pink-700 hover:to-pink-800 transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      <span>Book Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button className="p-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Your Frequent Trips Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-teal-100 to-teal-200 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Your Frequent Trips</h2>
              <p className="text-gray-600">Based on your booking history</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {frequentTrips.map((trip) => (
              <div key={trip.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{trip.route}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Bus className="w-4 h-4" />
                          <span>{trip.count} trips</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Last: {trip.lastTrip}</span>
                        </div>
                      </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                      <Heart className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Average Fare</span>
                      <span className="font-semibold text-gray-900">₹{trip.avgFare}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Favorite Time</span>
                      <span className="font-semibold text-gray-900">{trip.favoriteTime}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Total Spent</span>
                      <span className="font-semibold text-gray-900">₹{trip.totalSpent}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBookFrequentTrip(trip)}
                    className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-2 px-4 rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <span>Book This Route</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Book Section */}
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg shadow-lg text-white p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Ready for your next trip?</h2>
              <p className="text-pink-100 mb-4">Search and book buses to any destination</p>
            </div>
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Bus className="w-8 h-8" />
            </div>
          </div>
          
          <button
            onClick={() => navigate('/passenger/booking')}
            className="mt-6 bg-white text-pink-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2"
          >
            <span>Search & Book</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Recommendations;


