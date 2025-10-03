import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Clock, 
  Bus, 
  Users, 
  Star,
  Filter,
  ArrowRight,
  Heart,
  Share2,
  Info
} from 'lucide-react';

const MobilePassengerSearch = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchForm, setSearchForm] = useState({
    from: '',
    to: '',
    date: '',
    passengers: 1
  });
  const [isSearching, setIsSearching] = useState(false);
  const [popularRoutes, setPopularRoutes] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  // Set default date to tomorrow and fetch popular routes
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSearchForm(prev => ({
      ...prev,
      date: tomorrow.toISOString().split('T')[0]
    }));

    // Fetch popular routes
    fetchPopularRoutes();
  }, []);

  const fetchPopularRoutes = async () => {
    try {
      setLoadingRoutes(true);
      const response = await apiFetch('/api/routes/popular?limit=8');
      
      if (response && response.ok && response.data && response.data.success && Array.isArray(response.data.data)) {
        setPopularRoutes(response.data.data);
      } else {
        console.error('Failed to fetch popular routes');
        // Fallback to default routes
        setPopularRoutes([
          { 
            routeId: 'default-1',
            routeName: 'Kochi to Bangalore',
            from: 'Kochi', 
            to: 'Bangalore', 
            minFare: 850,
            frequency: 'Multiple trips available'
          },
          { 
            routeId: 'default-2',
            routeName: 'Kochi to Chennai',
            from: 'Kochi', 
            to: 'Chennai', 
            minFare: 750,
            frequency: 'Multiple trips available'
          },
          { 
            routeId: 'default-3',
            routeName: 'Kochi to Thiruvananthapuram',
            from: 'Kochi', 
            to: 'Thiruvananthapuram', 
            minFare: 450,
            frequency: 'Multiple trips available'
          },
          { 
            routeId: 'default-4',
            routeName: 'Kochi to Kozhikode',
            from: 'Kochi', 
            to: 'Kozhikode', 
            minFare: 350,
            frequency: 'Multiple trips available'
          },
          { 
            routeId: 'default-5',
            routeName: 'Kochi to Kannur',
            from: 'Kochi', 
            to: 'Kannur', 
            minFare: 400,
            frequency: 'Multiple trips available'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching popular routes:', error);
      // Fallback to default routes
      setPopularRoutes([
        { 
          routeId: 'default-1',
          routeName: 'Kochi to Bangalore',
          from: 'Kochi', 
          to: 'Bangalore', 
          minFare: 850,
          frequency: 'Multiple trips available'
        },
        { 
          routeId: 'default-2',
          routeName: 'Kochi to Chennai',
          from: 'Kochi', 
          to: 'Chennai', 
          minFare: 750,
          frequency: 'Multiple trips available'
        }
      ]);
    } finally {
      setLoadingRoutes(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSearchForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchForm.from || !searchForm.to || !searchForm.date) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        from: searchForm.from,
        to: searchForm.to,
        date: searchForm.date,
        passengers: searchForm.passengers
      });
      
      // Navigate to results page with search parameters
      navigate(`/passenger/results?${params.toString()}`);
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const swapLocations = () => {
    setSearchForm(prev => ({
      ...prev,
      from: prev.to,
      to: prev.from
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ width: '100vw', maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900 text-center">Search Buses</h1>
          <p className="text-sm text-gray-600 text-center mt-1">Find your perfect journey</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* From Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchForm.from}
                  onChange={(e) => handleInputChange('from', e.target.value)}
                  placeholder="Enter departure city"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
                  required
                />
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={swapLocations}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ArrowRight className="w-4 h-4 text-gray-600 rotate-90" />
              </button>
            </div>

            {/* To Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchForm.to}
                  onChange={(e) => handleInputChange('to', e.target.value)}
                  placeholder="Enter destination city"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
                  required
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Travel Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={searchForm.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
                  required
                />
              </div>
            </div>

            {/* Passengers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Passengers</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={searchForm.passengers}
                  onChange={(e) => handleInputChange('passengers', parseInt(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num} Passenger{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              disabled={isSearching}
              className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
            >
              {isSearching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Search Buses</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Popular Routes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Star className="w-4 h-4 mr-2 text-yellow-500" />
            Popular Routes
          </h2>
          {loadingRoutes ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading popular routes...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {popularRoutes.map((route, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSearchForm(prev => ({
                      ...prev,
                      from: route.from || route.fromCity,
                      to: route.to || route.toCity
                    }));
                  }}
                  className="w-full p-3 border border-gray-200 rounded-lg hover:border-pink-500 hover:shadow-sm transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bus className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">
                        {route.from || route.fromCity} → {route.to || route.toCity}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-pink-600">
                      ₹{route.price || route.fare || route.averageFare || 'N/A'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/passenger/dashboard')}
              className="p-3 border border-gray-200 rounded-lg hover:border-pink-500 transition-all text-center"
            >
              <Bus className="w-6 h-6 text-pink-500 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-900">Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/passenger/wallet')}
              className="p-3 border border-gray-200 rounded-lg hover:border-pink-500 transition-all text-center"
            >
              <Users className="w-6 h-6 text-pink-500 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-900">Wallet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobilePassengerSearch;
