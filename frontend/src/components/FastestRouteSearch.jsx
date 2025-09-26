import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Clock, Route, ArrowRight, 
  Star, Filter, ChevronDown, Loader2, 
  Navigation, DollarSign, Users, AlertCircle,
  Map, Timer, TrendingUp
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import { toast } from 'react-hot-toast';

const FastestRouteSearch = () => {
  const [searchForm, setSearchForm] = useState({
    from: '',
    to: '',
    timeOfDay: '',
    preference: 'duration',
    maxOptions: 5
  });

  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState({
    from: [],
    to: [],
    showFrom: false,
    showTo: false
  });

  // Mock suggestions for demonstration
  const mockStops = [
    { id: '1', name: 'Thiruvananthapuram Central', code: 'TVM01', city: 'Thiruvananthapuram' },
    { id: '2', name: 'Kochi Vyttila Hub', code: 'KOC01', city: 'Kochi' },
    { id: '3', name: 'Kozhikode Calicut', code: 'CLT01', city: 'Kozhikode' },
    { id: '4', name: 'Thrissur Bus Station', code: 'TSR01', city: 'Thrissur' },
    { id: '5', name: 'Ernakulam Junction', code: 'KOC02', city: 'Kochi' },
    { id: '6', name: 'Fort Kochi', code: 'KOC03', city: 'Kochi' },
    { id: '7', name: 'Kazhakuttom', code: 'TVM02', city: 'Thiruvananthapuram' },
    { id: '8', name: 'Guruvayur', code: 'TSR02', city: 'Thrissur' }
  ];

  const handleInputChange = (field, value) => {
    setSearchForm(prev => ({ ...prev, [field]: value }));
    
    // Show suggestions
    if (value.length > 1) {
      const filtered = mockStops.filter(stop => 
        stop.name.toLowerCase().includes(value.toLowerCase()) ||
        stop.city.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(prev => ({ 
        ...prev, 
        [field]: filtered.slice(0, 5),
        [`show${field.charAt(0).toUpperCase() + field.slice(1)}`]: true
      }));
    } else {
      setSuggestions(prev => ({ 
        ...prev, 
        [field]: [],
        [`show${field.charAt(0).toUpperCase() + field.slice(1)}`]: false
      }));
    }
  };

  const handleSuggestionClick = (field, suggestion) => {
    setSearchForm(prev => ({ ...prev, [field]: suggestion.name }));
    setSuggestions(prev => ({ 
      ...prev, 
      [field]: [],
      [`show${field.charAt(0).toUpperCase() + field.slice(1)}`]: false
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchForm.from || !searchForm.to) {
      toast.error('Please select origin and destination');
      return;
    }

    setLoading(true);
    try {
      const fromStop = mockStops.find(s => s.name === searchForm.from);
      const toStop = mockStops.find(s => s.name === searchForm.to);

      if (!fromStop || !toStop) {
        toast.error('Please select valid stops from suggestions');
        return;
      }

      const queryParams = new URLSearchParams({
        originStopId: fromStop.id,
        destinationStopId: toStop.id,
        preference: searchForm.preference,
        maxOptions: searchForm.maxOptions
      });

      if (searchForm.timeOfDay) {
        queryParams.append('timeOfDay', searchForm.timeOfDay);
      }

      const response = await apiFetch(`/api/fastest-route/options?${queryParams}`);
      
      if (response.ok) {
        setSearchResults(response.data.routes);
        if (response.data.routes.length === 0) {
          toast.info('No routes found for your search criteria');
        }
      } else {
        toast.error('Failed to search routes');
      }
    } catch (error) {
      console.error('Route search error:', error);
      toast.error('Failed to search routes');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatFare = (fare) => {
    return `₹${fare}`;
  };

  const getPreferenceIcon = (preference) => {
    switch (preference) {
      case 'duration': return <Timer className="w-4 h-4" />;
      case 'fare': return <DollarSign className="w-4 h-4" />;
      case 'transfers': return <Users className="w-4 h-4" />;
      case 'distance': return <Map className="w-4 h-4" />;
      default: return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getPreferenceLabel = (preference) => {
    switch (preference) {
      case 'duration': return 'Fastest';
      case 'fare': return 'Cheapest';
      case 'transfers': return 'Least Transfers';
      case 'distance': return 'Shortest Distance';
      default: return 'Recommended';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Route className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Fastest Route Finder</h1>
              <p className="mt-1 text-gray-600">Find the best routes using official KSRTC data</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <form onSubmit={handleSearch} className="space-y-6">
            {/* Origin and Destination */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Origin */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchForm.from}
                    onChange={(e) => handleInputChange('from', e.target.value)}
                    placeholder="Enter origin stop"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <AnimatePresence>
                    {suggestions.showFrom && suggestions.from.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto"
                      >
                        {suggestions.from.map((suggestion) => (
                          <button
                            key={suggestion.id}
                            type="button"
                            onClick={() => handleSuggestionClick('from', suggestion)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">{suggestion.name}</div>
                            <div className="text-sm text-gray-500">{suggestion.city}</div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Destination */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchForm.to}
                    onChange={(e) => handleInputChange('to', e.target.value)}
                    placeholder="Enter destination stop"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <AnimatePresence>
                    {suggestions.showTo && suggestions.to.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto"
                      >
                        {suggestions.to.map((suggestion) => (
                          <button
                            key={suggestion.id}
                            type="button"
                            onClick={() => handleSuggestionClick('to', suggestion)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">{suggestion.name}</div>
                            <div className="text-sm text-gray-500">{suggestion.city}</div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
              >
                <Filter className="w-4 h-4" />
                <span>Advanced Filters</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                <span>{loading ? 'Searching...' : 'Find Routes'}</span>
              </button>
            </div>

            {/* Advanced Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t pt-6 space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Time of Day */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Time
                      </label>
                      <input
                        type="time"
                        value={searchForm.timeOfDay}
                        onChange={(e) => setSearchForm(prev => ({ ...prev, timeOfDay: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Preference */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Route Preference
                      </label>
                      <select
                        value={searchForm.preference}
                        onChange={(e) => setSearchForm(prev => ({ ...prev, preference: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="duration">Fastest Route</option>
                        <option value="fare">Cheapest Route</option>
                        <option value="transfers">Least Transfers</option>
                        <option value="distance">Shortest Distance</option>
                      </select>
                    </div>

                    {/* Max Options */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Options
                      </label>
                      <select
                        value={searchForm.maxOptions}
                        onChange={(e) => setSearchForm(prev => ({ ...prev, maxOptions: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={3}>3 Options</option>
                        <option value={5}>5 Options</option>
                        <option value={10}>10 Options</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>

        {/* Search Results */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Route Options ({searchResults.length})
                </h2>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  {getPreferenceIcon(searchForm.preference)}
                  <span>Sorted by {getPreferenceLabel(searchForm.preference)}</span>
                </div>
              </div>

              {searchResults.map((route, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  {/* Route Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${index === 0 ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                        {index === 0 ? <Star className="w-5 h-5" /> : <Route className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Option {index + 1} {index === 0 && '(Recommended)'}
                        </h3>
                        <p className="text-sm text-gray-600">{route.routeSummary}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatFare(route.totalFare)}
                      </div>
                      <div className="text-sm text-gray-500">Total Fare</div>
                    </div>
                  </div>

                  {/* Route Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                      <div className="text-lg font-semibold text-gray-900">
                        {formatDuration(route.totalDuration)}
                      </div>
                      <div className="text-xs text-gray-500">Duration</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Users className="w-5 h-5 text-green-600 mx-auto mb-1" />
                      <div className="text-lg font-semibold text-gray-900">
                        {route.transferCount}
                      </div>
                      <div className="text-xs text-gray-500">Transfers</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Navigation className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                      <div className="text-lg font-semibold text-gray-900">
                        {route.totalDistance?.toFixed(1) || 'N/A'}km
                      </div>
                      <div className="text-xs text-gray-500">Distance</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Star className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                      <div className="text-lg font-semibold text-gray-900">
                        {route.confidence || 95}%
                      </div>
                      <div className="text-xs text-gray-500">Confidence</div>
                    </div>
                  </div>

                  {/* Route Directions */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Route Directions</h4>
                    <div className="space-y-2">
                      {route.directions?.map((step, stepIndex) => (
                        <div key={stepIndex} className="flex items-start space-x-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                            step.type === 'board' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {stepIndex + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{step.message}</p>
                            {step.duration && (
                              <p className="text-xs text-gray-500">
                                Duration: {formatDuration(step.duration)} • Fare: {formatFare(step.fare)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                    <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                      View on Map
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Book This Route
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {searchResults.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Route className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No routes found</h3>
            <p className="text-gray-500">Try searching with different stops or preferences</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FastestRouteSearch;


