import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Bus } from 'lucide-react';

const SearchBar = ({ onSearch }) => {
  const navigate = useNavigate();
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [date, setDate] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const popularCities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata',
    'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'
  ];

  const handleSearch = () => {
    if (fromCity && toCity && date) {
      // Navigate to search results page
      const queryParams = new URLSearchParams({
        from: fromCity,
        to: toCity,
        date: date,
        tripType: 'oneWay'
      });
      navigate(`/search-results?${queryParams.toString()}`);
      
      // Also call the onSearch callback if provided
      if (onSearch) {
        onSearch({ fromCity, toCity, date });
      }
    }
  };

  const handleCitySelect = (city, type) => {
    if (type === 'from') {
      setFromCity(city);
    } else {
      setToCity(city);
    }
    setShowSuggestions(false);
  };

  const getFilteredSuggestions = (input, type) => {
    if (!input) return popularCities;
    return popularCities.filter(city => 
      city.toLowerCase().includes(input.toLowerCase())
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Plan Your Trip
        </h1>
        <p className="text-lg text-gray-600">
          Search for the best routes and book your journey
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* From City */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={fromCity}
                onChange={(e) => {
                  setFromCity(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Departure city"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            {showSuggestions && fromCity && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {getFilteredSuggestions(fromCity, 'from').map((city, index) => (
                  <div
                    key={index}
                    onClick={() => handleCitySelect(city, 'from')}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    {city}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* To City */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={toCity}
                onChange={(e) => {
                  setToCity(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Destination city"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            {showSuggestions && toCity && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {getFilteredSuggestions(toCity, 'to').map((city, index) => (
                  <div
                    key={index}
                    onClick={() => handleCitySelect(city, 'to')}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    {city}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Search Button */}
          <div>
            <button
              onClick={handleSearch}
              disabled={!fromCity || !toCity || !date}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              Search
            </button>
          </div>
        </div>

        {/* Quick City Suggestions */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500 mb-3">Popular routes:</p>
          <div className="flex flex-wrap gap-2">
            {popularCities.slice(0, 6).map((city, index) => (
              <button
                key={index}
                onClick={() => {
                  setFromCity(city);
                  setToCity(popularCities[(index + 1) % popularCities.length]);
                }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 rounded-full transition-all duration-200 hover:scale-105"
              >
                {city} → {popularCities[(index + 1) % popularCities.length]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
