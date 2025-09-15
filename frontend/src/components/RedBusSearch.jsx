import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Users, ArrowRight, Clock } from 'lucide-react';

const RedBusSearch = () => {
  const navigate = useNavigate();
  const [searchData, setSearchData] = useState({
    from: '',
    to: '',
    date: '',
    passengers: 1,
    bookingForWomen: false
  });
  const [showSuggestions, setShowSuggestions] = useState({ from: false, to: false });
  const [suggestions, setSuggestions] = useState({ from: [], to: [] });

  // Popular cities (Kerala focus)
  const popularCities = [
    'Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Alappuzha', 
    'Kollam', 'Thrissur', 'Kottayam', 'Palakkad', 'Kannur', 'Malappuram'
  ];

  useEffect(() => {
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSearchData(prev => ({
      ...prev,
      date: tomorrow.toISOString().split('T')[0]
    }));
  }, []);

  const handleInputChange = (field, value) => {
    setSearchData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'from' || field === 'to') {
      const filtered = popularCities.filter(city => 
        city.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(prev => ({ ...prev, [field]: filtered }));
      setShowSuggestions(prev => ({ ...prev, [field]: value.length > 0 }));
    }
  };

  const selectCity = (field, city) => {
    setSearchData(prev => ({ ...prev, [field]: city }));
    setShowSuggestions(prev => ({ ...prev, [field]: false }));
  };

  const swapCities = () => {
    setSearchData(prev => ({
      ...prev,
      from: prev.to,
      to: prev.from
    }));
  };

  const handleSearch = () => {
    if (!searchData.from || !searchData.to || !searchData.date) {
      alert('Please fill in all required fields');
      return;
    }

    const params = new URLSearchParams({
      from: searchData.from,
      to: searchData.to,
      date: searchData.date,
      passengers: searchData.passengers,
      bookingForWomen: searchData.bookingForWomen
    });

    navigate(`/search-results?${params.toString()}`);
  };

  const setQuickDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setSearchData(prev => ({ ...prev, date: date.toISOString().split('T')[0] }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">Y</span>
              </div>
              <span className="text-xl font-bold text-gray-900">YATRIK ERP</span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-900">Bus tickets</button>
              <button className="text-gray-600 hover:text-gray-900">Bookings</button>
              <button className="text-gray-600 hover:text-gray-900">Help</button>
              <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            India's No. 1 online bus ticket booking site
          </h1>
          <p className="text-lg text-gray-600">
            Book bus tickets online with YATRIK ERP - Kerala's trusted bus booking platform
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* From */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchData.from}
                  onChange={(e) => handleInputChange('from', e.target.value)}
                  onFocus={() => setShowSuggestions(prev => ({ ...prev, from: true }))}
                  placeholder="Enter departure city"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                {showSuggestions.from && suggestions.from.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {suggestions.from.map((city, index) => (
                      <button
                        key={index}
                        onClick={() => selectCity('from', city)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{city}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex items-end">
              <button
                onClick={swapCities}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
              >
                <ArrowRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* To */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchData.to}
                  onChange={(e) => handleInputChange('to', e.target.value)}
                  onFocus={() => setShowSuggestions(prev => ({ ...prev, to: true }))}
                  placeholder="Enter destination city"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                {showSuggestions.to && suggestions.to.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {suggestions.to.map((city, index) => (
                      <button
                        key={index}
                        onClick={() => selectCity('to', city)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{city}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Journey
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={searchData.date}
                  onChange={(e) => setSearchData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-2 mt-2">
                <button
                  onClick={() => setQuickDate(0)}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Today
                </button>
                <button
                  onClick={() => setQuickDate(1)}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Tomorrow
                </button>
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <Users className="w-5 h-5 text-gray-400 mr-2" />
                <select
                  value={searchData.passengers}
                  onChange={(e) => setSearchData(prev => ({ ...prev, passengers: parseInt(e.target.value) }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'Passenger' : 'Passengers'}</option>
                  ))}
                </select>
              </div>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={searchData.bookingForWomen}
                  onChange={(e) => setSearchData(prev => ({ ...prev, bookingForWomen: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Booking for women</span>
              </label>
            </div>

            <button
              onClick={handleSearch}
              className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 flex items-center space-x-2 font-medium"
            >
              <Search className="w-5 h-5" />
              <span>Search buses</span>
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-green-600 font-bold">✓</span>
              </div>
              <h3 className="text-lg font-semibold">Free Cancellation</h3>
            </div>
            <p className="text-gray-600">Cancel bus tickets without paying cancellation charges</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">Live Bus Tracking</h3>
            </div>
            <p className="text-gray-600">Track your bus in real-time and plan your journey efficiently</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-purple-600 font-bold">24/7</span>
              </div>
              <h3 className="text-lg font-semibold">24/7 Customer Support</h3>
            </div>
            <p className="text-gray-600">Receive 24/7 customer service for any assistance</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedBusSearch;
