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

const TripSearchPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchForm, setSearchForm] = useState({
    from: '',
    to: '',
    date: '',
    passengers: 1
  });
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: 'all',
    busType: 'all',
    departureTime: 'all',
    amenities: []
  });
  const [showFilters, setShowFilters] = useState(false);

  // Mock data for demonstration
  const mockSearchResults = [
    {
      id: 1,
      route: 'Kochi → Trivandrum',
      busNumber: 'KL-07-AB-1234',
      busType: 'AC Sleeper',
      departure: '2025-08-20T08:00:00',
      arrival: '2025-08-20T14:00:00',
      duration: '6h 0m',
      fare: 450,
      availableSeats: 15,
      amenities: ['AC', 'WiFi', 'USB Charging', 'Water Bottle'],
      operator: 'Kerala State Transport',
      rating: 4.5,
      totalRatings: 128,
      departurePoint: 'Kochi Central Bus Stand',
      arrivalPoint: 'Trivandrum Central Bus Stand',
      stops: ['Alappuzha', 'Kollam'],
      cancellationPolicy: 'Free cancellation up to 2 hours before departure',
      refundPolicy: '100% refund for cancellations made 24 hours before departure'
    },
    {
      id: 2,
      route: 'Kochi → Bangalore',
      busNumber: 'KL-07-CD-5678',
      busType: 'AC Multi-Axle',
      departure: '2025-08-20T20:00:00',
      arrival: '2025-08-21T08:00:00',
      duration: '12h 0m',
      fare: 1200,
      availableSeats: 8,
      amenities: ['AC', 'WiFi', 'USB Charging', 'Water Bottle', 'Blanket', 'Pillow'],
      operator: 'Karnataka State Transport',
      rating: 4.3,
      totalRatings: 89,
      departurePoint: 'Kochi Central Bus Stand',
      arrivalPoint: 'Bangalore Central Bus Stand',
      stops: ['Salem', 'Hosur'],
      cancellationPolicy: 'Free cancellation up to 4 hours before departure',
      refundPolicy: '100% refund for cancellations made 6 hours before departure'
    },
    {
      id: 3,
      route: 'Kochi → Chennai',
      busNumber: 'KL-07-EF-9012',
      busType: 'AC Sleeper',
      departure: '2025-08-20T06:00:00',
      arrival: '2025-08-20T18:00:00',
      duration: '12h 0m',
      fare: 800,
      availableSeats: 22,
      amenities: ['AC', 'WiFi', 'USB Charging'],
      operator: 'Tamil Nadu State Transport',
      rating: 4.1,
      totalRatings: 156,
      departurePoint: 'Kochi Central Bus Stand',
      arrivalPoint: 'Chennai Central Bus Stand',
      stops: ['Salem', 'Vellore'],
      cancellationPolicy: 'Free cancellation up to 2 hours before departure',
      refundPolicy: '100% refund for cancellations made 4 hours before departure'
    }
  ];

  const popularRoutes = [
    { from: 'Kochi', to: 'Trivandrum', icon: '🏖️' },
    { from: 'Kochi', to: 'Bangalore', icon: '🌆' },
    { from: 'Kochi', to: 'Chennai', icon: '🏛️' },
    { from: 'Kochi', to: 'Munnar', icon: '🏔️' },
    { from: 'Kochi', to: 'Alleppey', icon: '🚣' },
    { from: 'Kochi', to: 'Thekkady', icon: '🐘' }
  ];

  const busTypes = [
    { value: 'all', label: 'All Bus Types' },
    { value: 'AC Sleeper', label: 'AC Sleeper' },
    { value: 'AC Multi-Axle', label: 'AC Multi-Axle' },
    { value: 'Non-AC', label: 'Non-AC' },
    { value: 'Volvo', label: 'Volvo' }
  ];

  const priceRanges = [
    { value: 'all', label: 'All Prices' },
    { value: '0-500', label: '₹0 - ₹500' },
    { value: '500-1000', label: '₹500 - ₹1000' },
    { value: '1000-1500', label: '₹1000 - ₹1500' },
    { value: '1500+', label: '₹1500+' }
  ];

  const departureTimes = [
    { value: 'all', label: 'All Times' },
    { value: 'early', label: 'Early Morning (6 AM - 9 AM)' },
    { value: 'morning', label: 'Morning (9 AM - 12 PM)' },
    { value: 'afternoon', label: 'Afternoon (12 PM - 6 PM)' },
    { value: 'evening', label: 'Evening (6 PM - 9 PM)' },
    { value: 'night', label: 'Night (9 PM - 6 AM)' }
  ];

  const amenities = [
    { value: 'AC', label: 'Air Conditioning' },
    { value: 'WiFi', label: 'WiFi' },
    { value: 'USB Charging', label: 'USB Charging' },
    { value: 'Water Bottle', label: 'Water Bottle' },
    { value: 'Blanket', label: 'Blanket' },
    { value: 'Pillow', label: 'Pillow' }
  ];

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

    // Use navigate to redirect to passenger results
    navigate(`/passenger/results?${queryParams.toString()}`);
  };

  const handleInputChange = (field, value) => {
    setSearchForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'amenities') {
      setFilters(prev => ({
        ...prev,
        amenities: prev.amenities.includes(value)
          ? prev.amenities.filter(item => item !== value)
          : [...prev.amenities, value]
      }));
    } else {
      setFilters(prev => ({ ...prev, [filterType]: value }));
    }
  };

  const getFilteredResults = () => {
    let filtered = searchResults;

    // Price filter
    if (filters.priceRange !== 'all') {
      const [min, max] = filters.priceRange.split('-').map(Number);
      if (max) {
        filtered = filtered.filter(bus => bus.fare >= min && bus.fare <= max);
      } else {
        filtered = filtered.filter(bus => bus.fare >= min);
      }
    }

    // Bus type filter
    if (filters.busType !== 'all') {
      filtered = filtered.filter(bus => bus.busType === filters.busType);
    }

    // Departure time filter
    if (filters.departureTime !== 'all') {
      const hour = new Date().getHours();
      filtered = filtered.filter(bus => {
        const departureHour = new Date(bus.departure).getHours();
        switch (filters.departureTime) {
          case 'early': return departureHour >= 6 && departureHour < 9;
          case 'morning': return departureHour >= 9 && departureHour < 12;
          case 'afternoon': return departureHour >= 12 && departureHour < 18;
          case 'evening': return departureHour >= 18 && departureHour < 21;
          case 'night': return departureHour >= 21 || departureHour < 6;
          default: return true;
        }
      });
    }

    // Amenities filter
    if (filters.amenities.length > 0) {
      filtered = filtered.filter(bus => 
        filters.amenities.every(amenity => bus.amenities.includes(amenity))
      );
    }

    return filtered;
  };

  const handleBookNow = (busId) => {
    if (!busId) return;
    if (!user) {
      navigate(`/login?next=/pax/booking/${busId}`);
      return;
    }
    navigate(`/pax/booking/${busId}`);
  };

  const handleQuickView = (bus) => {
    // TODO: Show bus details modal
    console.log('Quick view for bus:', bus);
  };

  const filteredResults = getFilteredResults();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Search & Book Trips</h2>
          <p className="text-gray-600 mt-1">Find the perfect bus for your journey</p>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Buses</h3>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="From"
                  value={searchForm.from}
                  onChange={(e) => handleInputChange('from', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="To"
                  value={searchForm.to}
                  onChange={(e) => handleInputChange('to', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={searchForm.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={searchForm.passengers}
                  onChange={(e) => handleInputChange('passengers', parseInt(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
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
                className="px-8 py-3 bg-[#E91E63] text-white rounded-lg hover:bg-[#C2185B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSearching ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Search Buses
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Popular Routes */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Routes</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {popularRoutes.map((route, index) => (
              <button
                key={index}
                onClick={() => {
                  setSearchForm(prev => ({
                    ...prev,
                    from: route.from,
                    to: route.to
                  }));
                }}
                className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-center"
              >
                <div className="text-2xl mb-2">{route.icon}</div>
                <div className="text-sm font-medium text-gray-900">{route.from}</div>
                <ArrowRight className="w-4 h-4 text-gray-400 mx-auto my-1" />
                <div className="text-sm font-medium text-gray-900">{route.to}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  {showFilters ? 'Hide' : 'Show'} Filters
                </button>
              </div>
              
              {showFilters && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                      <select
                        value={filters.priceRange}
                        onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {priceRanges.map((range) => (
                          <option key={range.value} value={range.value}>
                            {range.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bus Type</label>
                      <select
                        value={filters.busType}
                        onChange={(e) => handleFilterChange('busType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {busTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Departure Time</label>
                      <select
                        value={filters.departureTime}
                        onChange={(e) => handleFilterChange('departureTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {departureTimes.map((time) => (
                          <option key={time.value} value={time.value}>
                            {time.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Results</label>
                      <div className="text-lg font-semibold text-blue-600">
                        {filteredResults.length} bus{filteredResults.length !== 1 ? 'es' : ''} found
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                    <div className="flex flex-wrap gap-2">
                      {amenities.map((amenity) => (
                        <label key={amenity.value} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={filters.amenities.includes(amenity.value)}
                            onChange={() => handleFilterChange('amenities', amenity.value)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{amenity.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results List */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Available Buses</h3>
              <p className="text-gray-600 mt-1">
                {filteredResults.length} bus{filteredResults.length !== 1 ? 'es' : ''} found for your search
              </p>
            </div>
            
            <div className="p-6">
              {filteredResults.length > 0 ? (
                <div className="space-y-4">
                  {filteredResults.map((bus) => (
                    <div key={bus.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Bus Header */}
                          <div className="flex items-center gap-3 mb-4">
                            <h4 className="text-lg font-semibold text-gray-900">{bus.route}</h4>
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              {bus.busType}
                            </span>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-medium text-gray-700">{bus.rating}</span>
                              <span className="text-xs text-gray-500">({bus.totalRatings})</span>
                            </div>
                          </div>

                          {/* Bus Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-sm text-gray-500">Departure</p>
                                <p className="font-medium text-gray-900">
                                  {new Date(bus.departure).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-sm text-gray-500">Arrival</p>
                                <p className="font-medium text-gray-900">
                                  {new Date(bus.arrival).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Bus className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-sm text-gray-500">Duration</p>
                                <p className="font-medium text-gray-900">{bus.duration}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-sm text-gray-500">Available Seats</p>
                                <p className="font-medium text-gray-900">{bus.availableSeats}</p>
                              </div>
                            </div>
                          </div>

                          {/* Additional Info */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                            <div>
                              <span className="text-gray-500">Operator:</span>
                              <span className="ml-2 font-medium text-gray-900">{bus.operator}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Bus Number:</span>
                              <span className="ml-2 font-medium text-gray-900">{bus.busNumber}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Stops:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                {bus.stops.length > 0 ? bus.stops.join(', ') : 'Direct'}
                              </span>
                            </div>
                          </div>

                          {/* Amenities */}
                          <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-2">Amenities:</p>
                            <div className="flex flex-wrap gap-2">
                              {bus.amenities.map((amenity, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                                >
                                  {amenity}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Pickup/Drop Points */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Pickup:</span>
                              <span className="ml-2 font-medium text-gray-900">{bus.departurePoint}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Drop:</span>
                              <span className="ml-2 font-medium text-gray-900">{bus.arrivalPoint}</span>
                            </div>
                          </div>
                        </div>

                        {/* Price and Actions */}
                        <div className="ml-6 text-right">
                          <div className="mb-4">
                            <div className="text-3xl font-bold text-blue-600">₹{bus.fare}</div>
                            <div className="text-sm text-gray-500">per passenger</div>
                          </div>
                          
                          <div className="space-y-2">
                            <button
                              onClick={() => handleBookNow(bus.id)}
                              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                              Book Now
                            </button>
                            
                            <button
                              onClick={() => handleQuickView(bus)}
                              className="w-full px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                            >
                              Quick View
                            </button>
                            
                            <div className="flex gap-2">
                              <button className="flex-1 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <Heart className="w-4 h-4" />
                              </button>
                              <button className="flex-1 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <Share2 className="w-4 h-4" />
                              </button>
                              <button className="flex-1 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <Info className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No buses found</p>
                  <p className="text-sm text-gray-400">Try adjusting your filters or search criteria</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* No Results State */}
      {searchResults.length === 0 && !isSearching && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-8 text-center">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Search for buses to get started</p>
            <p className="text-sm text-gray-400">Enter your travel details above to find available buses</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripSearchPanel;
