import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { 
  Bus, 
  MapPin, 
  Clock, 
  Users, 
  Star,
  ArrowRight,
  Calendar,
  Wifi,
  Zap,
  Coffee,
  Accessibility,
  Music
} from 'lucide-react';
import toast from 'react-hot-toast';

const KeralaRoutes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    fetchRoutes();
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  const fetchRoutes = async () => {
    try {
      const response = await apiFetch('/api/booking/routes');
      console.log('Routes API response:', response);
      if (response.ok && response.data) {
        console.log('Setting routes:', response.data);
        setRoutes(response.data || []);
      } else {
        console.error('Failed to fetch routes:', response);
        toast.error('Failed to fetch routes');
        setRoutes([]);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      toast.error('Failed to fetch routes');
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRouteSelect = (route) => {
    if (!user) {
      toast.error('Please login to book tickets');
      navigate('/login', { state: { from: '/kerala-routes' } });
      return;
    }
    
    navigate('/booking', { 
      state: { 
        selectedRoute: route,
        selectedDate: selectedDate
      } 
    });
  };

  const getFeatureIcon = (feature) => {
    switch (feature) {
      case 'WiFi':
        return <Wifi className="w-4 h-4" />;
      case 'USB_Charging':
        return <Zap className="w-4 h-4" />;
      case 'Refreshments':
        return <Coffee className="w-4 h-4" />;
      case 'Entertainment':
        return <Music className="w-4 h-4" />;
      case 'Wheelchair_Accessible':
        return <Accessibility className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Kerala routes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-pink-700 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">Kerala Bus Routes</h1>
            <p className="text-xl opacity-90">Explore the beautiful state of Kerala with our premium bus services</p>
          </div>
        </div>
      </div>

      {/* Date Selector */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Travel Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>
      </div>

      {/* Routes Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.isArray(routes) && routes.map((route) => (
            <div
              key={route.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
            >
              {/* Route Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">{route.routeNumber}</h3>
                  <span className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded">
                    {route.buses.length} buses
                  </span>
                </div>
                <p className="text-sm opacity-90">{route.routeName}</p>
              </div>

              {/* Route Details */}
              <div className="p-4">
                {/* Route Info */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">From</p>
                      <p className="font-medium">{route.from}</p>
                      <p className="text-xs text-gray-500">{route.fromLocation}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">To</p>
                      <p className="font-medium">{route.to}</p>
                      <p className="text-xs text-gray-500">{route.toLocation}</p>
                    </div>
                  </div>
                </div>

                {/* Trip Details */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <Clock className="w-5 h-5 text-gray-500 mx-auto mb-1" />
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-medium">{formatDuration(route.duration)}</p>
                  </div>
                  <div className="text-center">
                    <Bus className="w-5 h-5 text-gray-500 mx-auto mb-1" />
                    <p className="text-sm text-gray-600">Distance</p>
                    <p className="font-medium">{route.distance} km</p>
                  </div>
                </div>

                {/* Features */}
                {route.features && route.features.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Features:</p>
                    <div className="flex flex-wrap gap-2">
                      {route.features.map((feature, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center space-x-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                        >
                          {getFeatureIcon(feature)}
                          <span>{feature.replace('_', ' ')}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price and Action */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm text-gray-600">Starting from</p>
                      <p className="text-2xl font-bold text-pink-600">₹{route.baseFare}</p>
                    </div>
                    <button
                      onClick={() => handleRouteSelect(route)}
                      className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center space-x-2"
                    >
                      <span>Book Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-500 text-center">
                    {route.depot} • Multiple departures daily
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {(!Array.isArray(routes) || routes.length === 0) && (
          <div className="text-center py-12">
            <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No routes available</h3>
            <p className="text-gray-500">Please check back later for available routes.</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Why Choose YATRIK ERP?</h3>
            <div className="grid md:grid-cols-3 gap-6 mt-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-pink-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">Premium Service</h4>
                <p className="text-sm text-gray-600">Luxury buses with modern amenities</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-pink-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">Punctual</h4>
                <p className="text-sm text-gray-600">On-time departures and arrivals</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-pink-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">Safe Travel</h4>
                <p className="text-sm text-gray-600">Experienced drivers and well-maintained buses</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeralaRoutes;
