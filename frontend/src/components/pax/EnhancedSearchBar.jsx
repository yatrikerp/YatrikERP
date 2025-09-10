import React, { useState, useEffect } from 'react';
import { Search, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { apiFetch } from '../../utils/api';

const EnhancedSearchBar = ({ onSearch }) => {
  const [searchData, setSearchData] = useState({
    fromCity: '',
    toCity: '',
    journeyDate: '',
    returnDate: ''
  });
  const [cities, setCities] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [loading] = useState(false);

  // Load cities for autocomplete
  useEffect(() => {
    const loadCities = async () => {
      try {
        const res = await apiFetch('/api/routes/cities');
        if (res.ok) {
          const cityData = res.data || [];
          setCities(Array.isArray(cityData) ? cityData : []);
        }
      } catch (error) {
        console.error('Error loading cities:', error);
      }
    };
    loadCities();
  }, []);

  // Generate available dates (next 7 days)
  useEffect(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        date: date.toISOString().split('T')[0],
        display: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        fullDisplay: date.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        })
      });
    }
    setAvailableDates(dates);
    
    // Set default journey date to tomorrow
    if (!searchData.journeyDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSearchData(prev => ({
        ...prev,
        journeyDate: tomorrow.toISOString().split('T')[0]
      }));
    }
  }, [searchData.journeyDate]);

  const handleInputChange = (field, value) => {
    setSearchData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = () => {
    console.log('🔍 Search form data:', searchData);
    if (searchData.fromCity && searchData.toCity && searchData.journeyDate) {
      onSearch(searchData);
    }
  };

  const handleDateSelect = (date) => {
    setSearchData(prev => ({
      ...prev,
      journeyDate: date
    }));
  };

  const swapCities = () => {
    setSearchData(prev => ({
      ...prev,
      fromCity: prev.toCity,
      toCity: prev.fromCity
    }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
      {/* Main Search Section */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        {/* From City */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchData.fromCity}
              onChange={(e) => handleInputChange('fromCity', e.target.value)}
              placeholder="Enter departure city"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all duration-200"
              list="fromCities"
            />
            <datalist id="fromCities">
              {cities.map((city, index) => (
                <option key={index} value={city} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex items-end pb-2">
          <button
            onClick={swapCities}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
          >
            <ArrowRight className="w-5 h-5 text-gray-600 rotate-90" />
          </button>
        </div>

        {/* To City */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchData.toCity}
              onChange={(e) => handleInputChange('toCity', e.target.value)}
              placeholder="Enter destination city"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all duration-200"
              list="toCities"
            />
            <datalist id="toCities">
              {cities.map((city, index) => (
                <option key={index} value={city} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Journey Date */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Journey Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              value={searchData.journeyDate}
              onChange={(e) => handleInputChange('journeyDate', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all duration-200"
            />
          </div>
        </div>

        {/* Return Date (Optional) */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Return Date (Optional)</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              value={searchData.returnDate}
              onChange={(e) => handleInputChange('returnDate', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all duration-200"
            />
          </div>
        </div>

        {/* Search Button */}
        <div className="flex items-end">
          <button
            onClick={handleSearch}
            disabled={loading || !searchData.fromCity || !searchData.toCity || !searchData.journeyDate}
            className="px-8 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl hover:from-pink-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl"
          >
            <Search className="w-5 h-5" />
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Date Tabs */}
      <div className="mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {availableDates.map((dateInfo, index) => (
            <button
              key={index}
              onClick={() => handleDateSelect(dateInfo.date)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                searchData.journeyDate === dateInfo.date
                  ? 'bg-pink-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {dateInfo.display}
            </button>
          ))}
        </div>
      </div>

      {/* Route Confirmation */}
      {searchData.fromCity && searchData.toCity && (
        <div className="text-center">
          <span className="text-lg font-semibold text-gray-800">
            {searchData.fromCity} → {searchData.toCity}
          </span>
        </div>
      )}
    </div>
  );
};

export default EnhancedSearchBar;
