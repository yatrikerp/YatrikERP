import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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

const PassengerSearch = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchForm, setSearchForm] = useState({
    from: '',
    to: '',
    date: '',
    passengers: 1
  });
  const [isSearching, setIsSearching] = useState(false);

  // Set default date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSearchForm(prev => ({
      ...prev,
      date: tomorrow.toISOString().split('T')[0]
    }));
  }, []);

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
    
    // Redirect to results page with search parameters
    const queryParams = new URLSearchParams({
      from: searchForm.from,
      to: searchForm.to,
      date: searchForm.date,
      passengers: searchForm.passengers
    });
    
    navigate(`/passenger/results?${queryParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Search & Book Your Trip</h1>
          <p className="text-base text-gray-600">Find the perfect bus for your journey across Kerala</p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="From City"
                  value={searchForm.from}
                  onChange={(e) => handleInputChange('from', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="To City"
                  value={searchForm.to}
                  onChange={(e) => handleInputChange('to', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={searchForm.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={searchForm.passengers}
                  onChange={(e) => handleInputChange('passengers', parseInt(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none text-sm"
                >
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>
                      {num} Passenger{num !== 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isSearching}
                className="px-8 py-3 bg-gradient-to-r from-pink-600 to-pink-700 text-white rounded-lg hover:from-pink-700 hover:to-pink-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-semibold shadow-md"
              >
                {isSearching ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-6 h-6" />
                    Search Buses
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Popular Routes */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">Popular Kerala Routes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { from: 'Kochi', to: 'Thiruvananthapuram', icon: '🏛️' },
              { from: 'Kochi', to: 'Kozhikode', icon: '🏖️' },
              { from: 'Kochi', to: 'Kollam', icon: '🌊' },
              { from: 'Kochi', to: 'Kottayam', icon: '⛪' },
              { from: 'Kochi', to: 'Thrissur', icon: '🐘' },
              { from: 'Kochi', to: 'Palakkad', icon: '🏔️' },
              { from: 'Thiruvananthapuram', to: 'Kochi', icon: '🚌' },
              { from: 'Kozhikode', to: 'Kochi', icon: '🌴' },
              { from: 'Kollam', to: 'Kochi', icon: '🌅' },
              { from: 'Kottayam', to: 'Kochi', icon: '⛰️' },
              { from: 'Thrissur', to: 'Kochi', icon: '🎭' },
              { from: 'Palakkad', to: 'Kochi', icon: '🌾' }
            ].map((route, index) => (
              <button
                key={index}
                onClick={() => {
                  setSearchForm(prev => ({
                    ...prev,
                    from: route.from,
                    to: route.to
                  }));
                }}
                className="p-3 border border-gray-200 rounded-lg hover:border-pink-300 hover:bg-pink-50 transition-all duration-200 text-center group"
              >
                <div className="text-lg mb-1">{route.icon}</div>
                <div className="text-xs font-medium text-gray-900 group-hover:text-pink-600">
                  {route.from} → {route.to}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassengerSearch;
