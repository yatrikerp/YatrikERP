import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  MapPin, Calendar, Search, Bus, Users, ArrowRight
} from 'lucide-react';

const VerticalSearchCard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchData, setSearchData] = useState({
    from: '',
    to: '',
    date: '',
    passengers: 1
  });
  const [searchLoading, setSearchLoading] = useState(false);

  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchData.from || !searchData.to || !searchData.date) {
      alert('Please fill in all required fields');
      return;
    }

    setSearchLoading(true);
    
    try {
      // Navigate to passenger results page with search parameters
      const params = new URLSearchParams({
        from: searchData.from,
        to: searchData.to,
        date: searchData.date,
        passengers: searchData.passengers
      });
      
      navigate(`/passenger/results?${params.toString()}`);
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-lg">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Search Buses</h2>
        <p className="text-sm text-[#4B5563]">Find your perfect journey</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        {/* From */}
        <div>
          <label className="block text-sm font-semibold text-[#1A1A1A] mb-2">From</label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <MapPin className="h-4 w-4 text-[#00BFA6]" />
            </div>
            <input
              type="text"
              value={searchData.from}
              onChange={(e) => setSearchData({...searchData, from: e.target.value})}
              placeholder="Enter departure location"
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00BFA6] focus:border-[#00BFA6] transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg bg-white"
              required
            />
          </div>
        </div>

        {/* To */}
        <div>
          <label className="block text-sm font-semibold text-[#1A1A1A] mb-2">To</label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <MapPin className="h-4 w-4 text-[#00BFA6]" />
            </div>
            <input
              type="text"
              value={searchData.to}
              onChange={(e) => setSearchData({...searchData, to: e.target.value})}
              placeholder="Enter destination location"
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00BFA6] focus:border-[#00BFA6] transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg bg-white"
              required
            />
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-semibold text-[#1A1A1A] mb-2">Journey Date</label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Calendar className="h-4 w-4 text-[#00BFA6]" />
            </div>
            <input
              type="date"
              value={searchData.date}
              onChange={(e) => setSearchData({...searchData, date: e.target.value})}
              min={getCurrentDate()}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00BFA6] focus:border-[#00BFA6] transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg bg-white"
              required
            />
          </div>
        </div>

        {/* Passengers */}
        <div>
          <label className="block text-sm font-semibold text-[#1A1A1A] mb-2">Passengers</label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Users className="h-4 w-4 text-[#00BFA6]" />
            </div>
            <select
              value={searchData.passengers}
              onChange={(e) => setSearchData({...searchData, passengers: parseInt(e.target.value)})}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00BFA6] focus:border-[#00BFA6] transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg bg-white"
            >
              {[1,2,3,4,5,6,7,8,9,10].map(num => (
                <option key={num} value={num}>{num} {num === 1 ? 'Passenger' : 'Passengers'}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          disabled={searchLoading}
          className="w-full bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] hover:from-[#FF4B2B] hover:to-[#FF6B35] text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
        >
          {searchLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Searching...</span>
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              <span>Search Buses</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default VerticalSearchCard;

