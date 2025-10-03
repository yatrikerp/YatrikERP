import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { 
  Bus, MapPin, Calendar, Search, Clock, Users,
  Star, Zap, Wallet, Ticket, Menu, X, Bell, User, Settings,
  Shield, Wifi, Phone, ArrowRight, Sparkles, Heart, Award,
  Globe, TrendingUp, Shield as ShieldIcon, Zap as ZapIcon
} from 'lucide-react';
import RoleSwitcher from '../components/RoleSwitcher';
import MobileViewport from './MobileViewport';
import heroBusImage from '../assets/hero-bus.png';
import './MobileLanding.css';

const MobileLandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchData, setSearchData] = useState({
    from: '',
    to: '',
    date: '',
    busType: ''
  });
  const [recentSearches, setRecentSearches] = useState([]);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [popularRoutes, setPopularRoutes] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  // Load recent searches from localStorage and fetch popular routes
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading recent searches:', e);
      }
    }

    // Fetch popular routes
    fetchPopularRoutes();
  }, []);

  const fetchPopularRoutes = async () => {
    try {
      setLoadingRoutes(true);
      const response = await apiFetch('/api/routes/popular?limit=8', { suppressError: true });
      
      if (response && response.ok && response.data && response.data.success && Array.isArray(response.data.data)) {
        // Use the original API response data directly
        setPopularRoutes(response.data.data);
      } else {
        // Silently fallback to default routes without console error
        setPopularRoutes([
          { 
            routeId: 'default-1',
            routeName: 'Kochi to Bangalore',
            from: 'Kochi', 
            to: 'Bangalore', 
            minFare: 850, 
            label: 'Kochi → Bangalore',
            fare: 'From ₹850',
            frequency: 'Multiple trips available'
          },
          { 
            routeId: 'default-2',
            routeName: 'Kochi to Chennai',
            from: 'Kochi', 
            to: 'Chennai', 
            minFare: 750, 
            label: 'Kochi → Chennai',
            fare: 'From ₹750',
            frequency: 'Multiple trips available'
          },
          { 
            routeId: 'default-3',
            routeName: 'Kochi to Thiruvananthapuram',
            from: 'Kochi', 
            to: 'Thiruvananthapuram', 
            minFare: 450, 
            label: 'Kochi → Thiruvananthapuram',
            fare: 'From ₹450',
            frequency: 'Multiple trips available'
          }
        ]);
      }
    } catch (error) {
      // Silently fallback to default routes without console error
      setPopularRoutes([
        { 
          routeId: 'default-1',
          routeName: 'Kochi to Bangalore',
          from: 'Kochi', 
          to: 'Bangalore', 
          minFare: 850, 
          label: 'Kochi → Bangalore',
          fare: 'From ₹850',
          frequency: 'Multiple trips available'
        }
      ]);
    } finally {
      setLoadingRoutes(false);
    }
  };

  // Save search to recent searches
  const saveRecentSearch = (search) => {
    const newSearches = [search, ...recentSearches.filter(s => 
      !(s.from === search.from && s.to === search.to)
    )].slice(0, 3);
    
    setRecentSearches(newSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newSearches));
  };

  // Handle search form submission
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchData.from || !searchData.to || !searchData.date) {
      alert('Please fill in all required fields');
      return;
    }

    setSearchLoading(true);
    
    try {
      // Save to recent searches
      saveRecentSearch({
        from: searchData.from,
        to: searchData.to,
        date: searchData.date,
        busType: searchData.busType,
        timestamp: new Date().toISOString()
      });

      // Navigate to passenger results page with search parameters
      const params = new URLSearchParams({
        from: searchData.from,
        to: searchData.to,
        date: searchData.date,
        passengers: 1
      });
      
      navigate(`/passenger/results?${params.toString()}`);
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle popular route click
  const handlePopularRouteClick = (route) => {
    // Check if user is logged in
    if (!user) {
      // Store the route data for after login
      localStorage.setItem('pendingRoute', JSON.stringify({
        from: route.from,
        to: route.to,
        date: getYesterdayDate(), // Use yesterday's date for better trip availability
        passengers: 1,
        routeId: route.routeId,
        routeName: route.routeName,
        minFare: route.minFare
      }));
      
      // Redirect to login page
      navigate('/login');
      return;
    }

    // If user is logged in, proceed directly to search results
    const params = new URLSearchParams({
      from: route.from,
      to: route.to,
      date: getYesterdayDate(), // Use yesterday's date for better trip availability
      passengers: 1,
      routeId: route.routeId,
      routeName: route.routeName,
      minFare: route.minFare
    });
    
    navigate(`/passenger/results?${params.toString()}`);
  };

  // Handle recent search click
  const handleRecentSearch = (search) => {
    setSearchData({
      from: search.from,
      to: search.to,
      date: search.date,
      busType: search.busType || ''
    });
  };

  // Handle role selection
  const handleRoleSelect = (role) => {
    localStorage.setItem('selectedRole', role);
    setShowRoleSwitcher(false);
    
    switch (role) {
      case 'passenger':
        navigate('/mobile/passenger');
        break;
      case 'conductor':
        navigate('/mobile/conductor');
        break;
      case 'driver':
        navigate('/mobile/driver');
        break;
      default:
        break;
    }
  };

  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getYesterdayDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] max-w-full overflow-x-hidden mobile-landing-container">
      <MobileViewport />
      
      {/* Top Support Bar */}
      <div className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white px-4 py-3 text-center shadow-lg">
        <div className="flex items-center justify-center space-x-8 text-sm">
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4" />
            <span className="font-medium">1800-123-4567</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span className="font-medium">24/7 Support</span>
          </div>
        </div>
      </div>

      {/* Navigation Header */}
      <div className="bg-white shadow-lg border-b border-[#E5E7EB] px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] p-2 rounded-xl shadow-lg">
              <Bus className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-[#1A1A1A]">YATRIK ERP</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm text-[#4B5563] hover:text-[#FF416C] transition-all duration-200 font-medium"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] hover:from-[#FF4B2B] hover:to-[#FF6B35] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section with Background Image */}
      <div className="relative min-h-[350px] overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${heroBusImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60"></div>
        </div>
        
        {/* Floating Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-8 right-6 animate-bounce delay-1000">
            <Sparkles className="h-4 w-4 text-yellow-300 opacity-80" />
          </div>
          <div className="absolute top-20 left-4 animate-pulse delay-500">
            <Heart className="h-3 w-3 text-pink-400 opacity-70" />
          </div>
          <div className="absolute top-32 right-8 animate-bounce delay-700">
            <Award className="h-4 w-4 text-blue-300 opacity-80" />
          </div>
          <div className="absolute bottom-12 left-6 animate-pulse delay-300">
            <Globe className="h-4 w-4 text-green-300 opacity-75" />
          </div>
          <div className="absolute bottom-20 right-4 animate-bounce delay-900">
            <TrendingUp className="h-3 w-3 text-purple-300 opacity-70" />
          </div>
        </div>
        
        {/* Content Overlay */}
        <div className="relative z-10 px-4 py-8 text-white">
          {/* Trust Badges */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
              <ShieldIcon className="h-3 w-3 text-green-300" />
              <span className="text-xs font-medium">Safe Travel</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
              <ZapIcon className="h-3 w-3 text-yellow-300" />
              <span className="text-xs font-medium">Fast Booking</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Star className="h-3 w-3 text-blue-300" />
              <span className="text-xs font-medium">5★ Rated</span>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="text-center">
            <div className="mb-3">
              <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-[#FF416C]/20 to-[#FF4B2B]/20 backdrop-blur-sm rounded-full text-xs font-medium text-white border border-white/30">
                <Sparkles className="h-3 w-3 mr-1.5 text-yellow-300" />
                India's Most Trusted Bus Booking Platform
              </span>
            </div>
            
            <h1 className="text-3xl font-bold mb-4 leading-tight drop-shadow-2xl text-white">
              Travel Smart,<br />
              <span className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] bg-clip-text text-transparent animate-pulse">
                Travel Safe
              </span>
            </h1>
            
            <p className="text-base mb-6 text-gray-100 leading-relaxed drop-shadow-lg max-w-sm mx-auto">
              Book your bus tickets with YATRIK ERP. Experience comfortable, reliable, and affordable bus travel across India.
            </p>
            
            <div className="flex flex-col space-y-3 max-w-xs mx-auto">
              <button className="group bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] hover:from-[#FF4B2B] hover:to-[#FF6B35] text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 text-base">
                <span>Book Now</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
              
              <button 
                onClick={() => navigate('/mobile/track')}
                className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 text-base"
              >
                <Bus className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                <span>Track Bus</span>
              </button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 max-w-xs mx-auto">
              <div className="text-center">
                <div className="text-lg font-bold text-white">10M+</div>
                <div className="text-xs text-gray-300">Happy Travelers</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">50K+</div>
                <div className="text-xs text-gray-300">Routes</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">99%</div>
                <div className="text-xs text-gray-300">On Time</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form Section */}
      <div className="px-4 py-8 bg-[#F9FAFB] relative">
        <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-full mobile-search-form border border-gray-100">
          {/* Section Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Book Your Journey</h2>
            <p className="text-[#4B5563] leading-relaxed">Find and book the perfect bus for your trip</p>
          </div>
          
          {/* Form Tabs */}
          <div className="flex mb-8 bg-gray-50 rounded-xl p-1.5 border border-gray-200">
            <button className="flex-1 bg-white text-[#1A1A1A] px-6 py-4 rounded-lg font-semibold flex items-center justify-center space-x-2 shadow-md border border-gray-100 transition-all duration-200 hover:shadow-lg">
              <Bus className="h-4 w-4" />
              <span>Book Bus Ticket</span>
            </button>
            <button className="flex-1 bg-transparent text-[#4B5563] px-6 py-4 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:bg-white/70 transition-all duration-200">
              <Ticket className="h-4 w-4" />
              <span>Link Ticket</span>
            </button>
          </div>

          {/* Trip Type Selection */}
          <div className="flex mb-8 bg-gray-50 rounded-xl p-1.5 border border-gray-200">
            <button className="flex-1 bg-white text-[#1A1A1A] py-3 rounded-lg font-semibold shadow-md border border-gray-100 transition-all duration-200 hover:shadow-lg">
              One Way
            </button>
            <button className="flex-1 bg-transparent text-[#4B5563] py-3 rounded-lg font-semibold hover:bg-white/70 transition-all duration-200">
              Round Trip
            </button>
          </div>
          
          <form onSubmit={handleSearch} className="space-y-6">
            {/* From */}
            <div>
              <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">From</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <MapPin className="h-5 w-5 text-[#00BFA6] group-hover:scale-110 transition-transform duration-200" />
                </div>
                <input
                  type="text"
                  value={searchData.from}
                  onChange={(e) => setSearchData({...searchData, from: e.target.value})}
                  placeholder="Enter departure location"
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00BFA6] focus:border-[#00BFA6] transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg bg-white"
                  required
                />
              </div>
            </div>

            {/* To */}
            <div>
              <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">To</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <MapPin className="h-5 w-5 text-[#00BFA6] group-hover:scale-110 transition-transform duration-200" />
                </div>
                <input
                  type="text"
                  value={searchData.to}
                  onChange={(e) => setSearchData({...searchData, to: e.target.value})}
                  placeholder="Enter destination location"
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00BFA6] focus:border-[#00BFA6] transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg bg-white"
                  required
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Journey Date</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Calendar className="h-5 w-5 text-[#00BFA6] group-hover:scale-110 transition-transform duration-200" />
                </div>
                <input
                  type="date"
                  value={searchData.date}
                  onChange={(e) => setSearchData({...searchData, date: e.target.value})}
                  min={getCurrentDate()}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00BFA6] focus:border-[#00BFA6] transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg bg-white"
                  required
                />
              </div>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              disabled={searchLoading}
              className="w-full bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] hover:from-[#FF4B2B] hover:to-[#FF6B35] text-white py-4 rounded-xl font-semibold flex items-center justify-center space-x-3 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {searchLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  <span>Search Buses</span>
                </>
              )}
            </button>
          </form>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
              <h3 className="text-sm font-medium text-[#1A1A1A] mb-3">Recent Searches</h3>
              <div className="space-y-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearch(search)}
                    className="w-full text-left p-3 bg-[#F9FAFB] rounded-lg hover:bg-gray-100 transition-colors border border-[#E5E7EB]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#1A1A1A]">
                        {search.from} → {search.to}
                      </span>
                      <span className="text-xs text-[#4B5563]">
                        {new Date(search.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="px-4 py-6 bg-white">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/mobile/bookings')}
            className="flex items-center space-x-3 p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] hover:bg-gray-50 transition-colors"
          >
            <Ticket className="h-6 w-6 text-[#00BFA6]" />
            <span className="text-sm font-medium text-[#1A1A1A]">Manage Booking</span>
          </button>
          <button
            onClick={() => navigate('/mobile/track')}
            className="flex items-center space-x-3 p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] hover:bg-gray-50 transition-colors"
          >
            <Bus className="h-6 w-6 text-[#00BFA6]" />
            <span className="text-sm font-medium text-[#1A1A1A]">Status Check</span>
          </button>
          <button
            onClick={() => navigate('/mobile/offers')}
            className="flex items-center space-x-3 p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] hover:bg-gray-50 transition-colors"
          >
            <Star className="h-6 w-6 text-[#00BFA6]" />
            <span className="text-sm font-medium text-[#1A1A1A]">Gallery</span>
          </button>
          <button
            onClick={() => navigate('/mobile/wallet')}
            className="flex items-center space-x-3 p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] hover:bg-gray-50 transition-colors"
          >
            <Wallet className="h-6 w-6 text-[#00BFA6]" />
            <span className="text-sm font-medium text-[#1A1A1A]">Feedback</span>
          </button>
        </div>
        
        {/* Features Section */}
        <div className="mt-12 grid grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-[#E5E7EB]">
            <div className="bg-[#00BFA6] p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-bold text-[#1A1A1A] mb-2">Safe Travel</h3>
            <p className="text-sm text-[#4B5563]">Verified drivers and secure buses</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-[#E5E7EB]">
            <div className="bg-[#22C55E] p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-bold text-[#1A1A1A] mb-2">On Time</h3>
            <p className="text-sm text-[#4B5563]">99% on-time departure guarantee</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-[#E5E7EB]">
            <div className="bg-[#00BFA6] p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Wifi className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-bold text-[#1A1A1A] mb-2">Free WiFi</h3>
            <p className="text-sm text-[#4B5563]">Stay connected on your journey</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-[#E5E7EB]">
            <div className="bg-[#FF416C] p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-bold text-[#1A1A1A] mb-2">24/7 Support</h3>
            <p className="text-sm text-[#4B5563]">Round-the-clock customer service</p>
          </div>
        </div>
      </div>
      
      {/* Popular Routes Section */}
      <div className="px-4 py-12 bg-white">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">
            Popular <span className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] bg-clip-text text-transparent">Routes</span>
          </h2>
          <p className="text-[#4B5563]">Most booked routes across India</p>
        </div>
        
        {loadingRoutes ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF416C] mx-auto mb-4"></div>
            <p className="text-[#4B5563]">Loading popular routes...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {popularRoutes.map((route, index) => (
              <div 
                key={index} 
                onClick={() => handlePopularRouteClick(route)}
                className="bg-white rounded-2xl p-6 border border-[#E5E7EB] hover:border-[#FF416C] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] p-3 rounded-xl">
                      <Bus className="h-6 w-6 text-white" />
                    </div>
                    <div>
                    <h3 className="font-bold text-[#1A1A1A] text-lg">
                      {route.from} → {route.to}
                    </h3>
                    <p className="text-[#4B5563] text-sm">{route.frequency || 'Multiple operators available'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#1A1A1A]">
                    ₹{route.minFare}
                  </div>
                  <p className="text-[#4B5563] text-sm">{route.fare || 'Starting from'}</p>
                </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <footer className="bg-[#1A1A1A] text-white py-8 px-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] p-2 rounded-xl">
              <Bus className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">YATRIK ERP</span>
          </div>
          <p className="text-gray-400 mb-4">Your trusted travel companion across India</p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <span>© 2024 YATRIK ERP</span>
            <span>•</span>
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </footer>

      {/* Role Switcher Modal */}
      <RoleSwitcher 
        isOpen={showRoleSwitcher}
        onClose={() => setShowRoleSwitcher(false)}
        onRoleSelect={handleRoleSelect}
      />
    </div>
  );
};

export default MobileLandingPage;
