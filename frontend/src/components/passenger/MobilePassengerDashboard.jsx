import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar, Clock, MapPin, Users,
  Star, Zap, Bus, Wallet, Ticket,
  Menu, X, Bell, Search, User, Settings, LogOut,
  ChevronRight, Filter
} from 'lucide-react';

const MobilePassengerDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [myTrips, setMyTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [popularRoutes, setPopularRoutes] = useState([]);
  const [popularBuses, setPopularBuses] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [dashboardData] = useState({
    summary: {
      upcomingBookings: 2,
      completedTrips: 15,
      availableTripsToday: 8,
      walletBalance: 1250
    },
    scheduledTrips: [
      {
        tripId: 'T001',
        route: { from: 'Kochi', to: 'Thiruvananthapuram', name: 'Kochi Express', category: 'Express' },
        schedule: { date: '2024-01-15', departureTime: '08:30' },
        availability: { availableSeats: 12 },
        bus: { type: 'AC Sleeper' },
        pricing: { currentFare: 450 }
      },
      {
        tripId: 'T002',
        route: { from: 'Kochi', to: 'Bangalore', name: 'Kochi-Bangalore', category: 'Super Fast' },
        schedule: { date: '2024-01-16', departureTime: '22:00' },
        availability: { availableSeats: 8 },
        bus: { type: 'AC Semi-Sleeper' },
        pricing: { currentFare: 850 }
      }
    ],
    popularRoutes: [
      { route: { from: 'Kochi', to: 'Bangalore' }, popularity: { totalBookings: 1250 } },
      { route: { from: 'Kochi', to: 'Chennai' }, popularity: { totalBookings: 980 } },
      { route: { from: 'Kochi', to: 'Thiruvananthapuram' }, popularity: { totalBookings: 850 } },
      { route: { from: 'Kochi', to: 'Mysore' }, popularity: { totalBookings: 720 } }
    ],
    trendingRoutes: [
      { route: { from: 'Kochi', to: 'Coimbatore' }, trend: { growthRate: 25, trending: 'hot' } },
      { route: { from: 'Kochi', to: 'Madurai' }, trend: { growthRate: 18, trending: 'rising' } }
    ],
    quickSearchSuggestions: [
      { from: 'Kochi', to: 'Bangalore', averageFare: 850, availability: 'available', availableTrips: 12 },
      { from: 'Kochi', to: 'Chennai', averageFare: 750, availability: 'available', availableTrips: 8 },
      { from: 'Kochi', to: 'Thiruvananthapuram', averageFare: 450, availability: 'available', availableTrips: 15 }
    ]
  });

  const handleQuickBook = (trip) => {
    const from = trip?.route?.from || trip?.from || '';
    const to = trip?.route?.to || trip?.to || '';
    const date = (trip?.schedule?.date || trip?.departureDate || '').toString().slice(0, 10);
    const params = new URLSearchParams({
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...(date ? { date } : {})
    });
    if (trip?.tripId) {
      // If we have a trip id, take user directly to seat selection
      navigate(`/redbus/seats/${trip.tripId}`);
    } else {
      navigate(`/redbus-results?${params.toString()}`);
    }
  };

  const handleQuickSearch = (suggestion) => {
    navigate('/passenger/search', {
      state: {
        from: suggestion.from,
        to: suggestion.to
      }
    });
  };

  const handlePopularRouteBook = (routeData) => {
    const from = routeData?.route?.from || routeData?.from || '';
    const to = routeData?.route?.to || routeData?.to || '';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = tomorrow.toISOString().split('T')[0];
    const params = new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}), date });
    navigate(`/redbus-results?${params.toString()}`);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Calendar },
    { id: 'trips', label: 'My Trips', icon: Ticket },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  useEffect(() => {
    async function fetchMyTrips() {
      try {
        setTripsLoading(true);
        const token = localStorage.getItem('token');
        const resp = await fetch('/api/passenger/dashboard', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        });
        if (resp.ok) {
          const json = await resp.json();
          const upcoming = json?.data?.upcomingTrips || [];
          setMyTrips(Array.isArray(upcoming) ? upcoming : []);
        } else {
          setMyTrips([]);
        }
      } catch (e) {
        setMyTrips([]);
      } finally {
        setTripsLoading(false);
      }
    }

    if (activeTab === 'trips') {
      fetchMyTrips();
    }
  }, [activeTab]);

  useEffect(() => {
    async function loadPopular() {
      try {
        // Popular routes
        const r = await fetch('/api/routes/popular?limit=6');
        if (r.ok) {
          const j = await r.json();
          const list = (j?.data || []).map((it) => ({
            from: it.from || it.start || it.origin || it.startingPoint || 'Kochi',
            to: it.to || it.end || it.destination || it.endingPoint || 'Thiruvananthapuram',
            price: it.minFare || it.fare || 450,
            label: `${(it.from || it.startingPoint || 'Kochi')} → ${(it.to || it.endingPoint || 'Thiruvananthapuram')}`
          }));
          setPopularRoutes(Array.isArray(list) ? list : []);
        } else {
          setPopularRoutes([
            { from: 'Kochi', to: 'Bangalore', price: 850, label: 'Kochi → Bangalore' },
            { from: 'Kochi', to: 'Chennai', price: 750, label: 'Kochi → Chennai' },
            { from: 'Kochi', to: 'Thiruvananthapuram', price: 450, label: 'Kochi → Thiruvananthapuram' }
          ]);
        }
      } catch {
        setPopularRoutes([
          { from: 'Kochi', to: 'Bangalore', price: 850, label: 'Kochi → Bangalore' },
          { from: 'Kochi', to: 'Chennai', price: 750, label: 'Kochi → Chennai' },
          { from: 'Kochi', to: 'Thiruvananthapuram', price: 450, label: 'Kochi → Thiruvananthapuram' }
        ]);
      }

      try {
        // Popular buses (fall back to trips with bus info)
        const t = await fetch('/api/trips/popular?limit=6');
        if (t.ok) {
          const j = await t.json();
          const list = (j?.data || j?.trips || []).map((it) => ({
            route: it.routeName || `${it.fromCity || it.from} → ${it.toCity || it.to}`,
            busType: it.busType || 'AC',
            fare: it.fare || it.price || 500
          }));
          setPopularBuses(Array.isArray(list) ? list : []);
        } else {
          setPopularBuses([
            { route: 'Kochi → Bangalore', busType: 'AC Sleeper', fare: 850 },
            { route: 'Kochi → Chennai', busType: 'AC Semi-Sleeper', fare: 750 },
            { route: 'Kochi → Thiruvananthapuram', busType: 'Non-AC Seater', fare: 450 }
          ]);
        }
      } catch {
        setPopularBuses([
          { route: 'Kochi → Bangalore', busType: 'AC Sleeper', fare: 850 },
          { route: 'Kochi → Chennai', busType: 'AC Semi-Sleeper', fare: 750 },
          { route: 'Kochi → Thiruvananthapuram', busType: 'Non-AC Seater', fare: 450 }
        ]);
      }
    }
    if (activeTab === 'search') loadPopular();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 pt-2">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4 max-w-md mx-auto">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center">
                <Bus className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">YATRIK</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-lg hover:bg-gray-100 relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-[56px] z-40">
        <div className="flex overflow-x-auto scrollbar-hide max-w-md mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-pink-500 text-pink-600 bg-pink-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowMobileMenu(false)}>
          <div className="bg-white h-full w-80 max-w-[85vw] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button onClick={() => setShowMobileMenu(false)}>
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-100 flex items-center space-x-3">
                <Wallet className="w-5 h-5 text-gray-600" />
                <span>My Wallet</span>
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-100 flex items-center space-x-3">
                <Ticket className="w-5 h-5 text-gray-600" />
                <span>My Tickets</span>
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-100 flex items-center space-x-3">
                <Users className="w-5 h-5 text-gray-600" />
                <span>Support</span>
              </button>
              <button
                onClick={() => { setShowMobileMenu(false); logout(); navigate('/login'); }}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-100 flex items-center space-x-3 text-red-600"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
          {/* Popular Suggestions */}
          <div className="max-w-md mx-auto mt-4 space-y-4">
            {popularRoutes.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3">Popular Routes</h3>
                <div className="grid grid-cols-1 gap-2">
                  {popularRoutes.map((r, i) => (
                    <button
                      key={`${r.label}-${i}`}
                      onClick={() => { setSearchFrom(r.from); setSearchTo(r.to); }}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-pink-500 hover:shadow-sm text-left"
                    >
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{r.label}</div>
                        <div className="text-xs text-gray-500">From ₹{r.price}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {popularBuses.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3">Popular Buses</h3>
                <div className="space-y-2">
                  {popularBuses.map((b, i) => (
                    <div key={`${b.route}-${i}`} className="p-3 border border-gray-200 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{b.route}</div>
                        <div className="text-xs text-gray-500">{b.busType}</div>
                      </div>
                      <div className="text-pink-600 font-semibold text-sm">₹{b.fare}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      {activeTab === 'dashboard' && (
        <div className="p-4 space-y-4 max-w-md mx-auto min-h-[60vh]">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-pink-600 to-pink-700 rounded-xl p-4 text-white">
            <h1 className="text-xl font-bold mb-1">Welcome back!</h1>
            <p className="text-blue-100 text-sm">Find and book your next journey</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Ticket className="w-5 h-5 text-pink-600" />
                <span className="text-xs text-gray-500">Upcoming</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.summary.upcomingBookings}</p>
              <p className="text-xs text-gray-600">Trips</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Wallet className="w-5 h-5 text-green-600" />
                <span className="text-xs text-gray-500">Balance</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">₹{dashboardData.summary.walletBalance}</p>
              <p className="text-xs text-gray-600">Available</p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900 flex items-center">
                <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                Quick Search
              </h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <Filter className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="space-y-3">
              {dashboardData.quickSearchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickSearch(suggestion)}
                  className="w-full p-3 border border-gray-200 rounded-lg hover:border-pink-500 hover:shadow-sm transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-pink-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {suggestion.from} → {suggestion.to}
                        </p>
                        <p className="text-xs text-gray-600">From ₹{suggestion.averageFare}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Upcoming Trips */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-pink-500" />
              Upcoming Trips
            </h2>
            <div className="space-y-3">
              {dashboardData.scheduledTrips.map((trip) => (
                <div
                  key={trip.tripId}
                  onClick={() => handleQuickBook(trip)}
                  className="border border-gray-200 rounded-lg p-3 hover:border-pink-500 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">
                        {trip.route.from} → {trip.route.to}
                      </h3>
                      <p className="text-xs text-gray-600">{trip.route.name}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      trip.route.category === 'Express' ? 'bg-purple-100 text-purple-700' :
                      trip.route.category === 'Super Fast' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {trip.route.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(trip.schedule.date).toLocaleDateString('en-IN', { 
                          day: 'numeric', 
                          month: 'short' 
                        })} • {trip.schedule.departureTime}
                      </span>
                      <span className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {trip.availability.availableSeats} seats
                      </span>
                    </div>
                    <span className="font-bold text-gray-900">₹{trip.pricing.currentFare}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Routes */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Star className="w-4 h-4 mr-2 text-yellow-500" />
              Popular Routes
            </h2>
            <div className="space-y-2">
              {dashboardData.popularRoutes.slice(0, 3).map((routeData, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-yellow-500 text-white flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {routeData.route.from} → {routeData.route.to}
                      </p>
                      <p className="text-xs text-gray-600">
                        {routeData.popularity.totalBookings} bookings
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handlePopularRouteBook(routeData)}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                  >
                    Book
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* My Trips Tab */}
      {activeTab === 'trips' && (
        <div className="p-4">
          <div className="bg-white rounded-xl p-4 shadow-sm max-w-md mx-auto">
            <h2 className="font-semibold text-gray-900 mb-4">My Trips</h2>

            {tripsLoading && (
              <div className="py-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mx-auto mb-2"></div>
                Loading your trips...
              </div>
            )}

            {!tripsLoading && (myTrips.length === 0 && dashboardData.scheduledTrips.length === 0) && (
              <div className="py-10 text-center text-gray-500">
                No upcoming trips. Start by searching a route.
                <div className="mt-3">
                  <button
                    onClick={() => setActiveTab('search')}
                    className="px-4 py-2 bg-pink-600 text-white rounded-lg text-sm"
                  >
                    Search Trips
                  </button>
                </div>
              </div>
            )}

            {!tripsLoading && (
              <div className="space-y-3">
                {(myTrips.length ? myTrips : dashboardData.scheduledTrips).map((trip, idx) => {
                  const from = trip.from || trip.route?.from;
                  const to = trip.to || trip.route?.to;
                  const date = trip.departureDate || trip.schedule?.date;
                  const time = trip.departureTime || trip.schedule?.departureTime;
                  const busType = trip.busType || trip.bus?.type;
                  const key = trip.id || trip.tripId || idx;
                  return (
                    <div key={key} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900 text-sm">
                          {from} → {to}
                        </h3>
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">Confirmed</span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <p>Date: {date ? new Date(date).toLocaleDateString('en-IN') : '-'}</p>
                        <p>Time: {time || '-'}</p>
                        <p>Bus: {busType || '-'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="p-4">
          <div className="bg-white rounded-xl p-4 shadow-sm mb-4 max-w-md mx-auto">
            <h2 className="font-semibold text-gray-900 mb-4">Search Trips</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <input
                  type="text"
                  placeholder="Enter departure city"
                  value={searchFrom}
                  onChange={(e) => setSearchFrom(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input
                  type="text"
                  placeholder="Enter destination city"
                  value={searchTo}
                  onChange={(e) => setSearchTo(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={async () => {
                  if (!searchFrom || !searchTo || !searchDate) {
                    alert('Please fill From, To and Date');
                    return;
                  }
                  try {
                    const token = localStorage.getItem('token');
                    await fetch(`/api/passenger/trips/search?from=${encodeURIComponent(searchFrom)}&to=${encodeURIComponent(searchTo)}&date=${searchDate}`, {
                      headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                      }
                    });
                    // Navigate to results regardless; API precheck just helps UX
                    const params = new URLSearchParams({ from: searchFrom, to: searchTo, date: searchDate });
                    navigate(`/passenger/results?${params.toString()}`);
                  } catch {
                    const params = new URLSearchParams({ from: searchFrom, to: searchTo, date: searchDate });
                    navigate(`/passenger/results?${params.toString()}`);
                  }
                }}
                className="w-full py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>Search Buses</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="p-4">
          <div className="bg-white rounded-xl p-4 shadow-sm max-w-md mx-auto">
            <h2 className="font-semibold text-gray-900 mb-4">Profile</h2>
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-pink-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-medium text-gray-900">{user?.name || 'Passenger'}</h3>
                <p className="text-sm text-gray-600">{user?.email || '—'}</p>
              </div>
              <div className="space-y-2">
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-100 flex items-center justify-between">
                  <span>Edit Profile</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-100 flex items-center justify-between">
                  <span>Change Password</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-100 flex items-center justify-between">
                  <span>Notifications</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => navigate('/passenger/tickets')}
                    className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm"
                  >
                    My Tickets
                  </button>
                  <button
                    onClick={() => navigate('/passenger/wallet')}
                    className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm"
                  >
                    Wallet
                  </button>
                </div>
                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-100 flex items-center justify-between text-red-600"
                >
                  <span>Logout</span>
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around max-w-md mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'text-pink-600 bg-pink-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobilePassengerDashboard;
