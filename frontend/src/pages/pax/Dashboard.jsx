import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bus, MapPin, Calendar, Search, Star, Heart, 
  TrendingUp, Clock, Users, Shield, Gift, 
  Navigation, Waves, Mountain, Leaf, Building,
  Camera, Coffee, Car, Train, Plane, Ticket, MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useHashSection } from '../../hooks/useHashSection';
import ContactUsPanel from '../../components/pax/ContactUsPanel';
import CancellationPolicyPanel from '../../components/pax/CancellationPolicyPanel';
import FeedbackPanel from '../../components/pax/FeedbackPanel';
import ManageBookingPanel from '../../components/pax/ManageBookingPanel';
import StatusCheckPanel from '../../components/pax/StatusCheckPanel';
import KeralaDestinationsShowcase from '../../components/pax/KeralaDestinationsShowcase';
import AnimatedStats from '../../components/pax/AnimatedStats';

const Dashboard = () => {
  const { user } = useAuth();
  const { section, setSection } = useHashSection();
  const [currentOffer, setCurrentOffer] = useState(0);

  // Auto-rotate offers
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentOffer((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const keralaDestinations = [
    {
      name: "Munnar",
      icon: <Mountain className="w-8 h-8" />,
      description: "Tea Gardens & Hills",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
      popular: true
    },
    {
      name: "Alleppey",
      icon: <Waves className="w-8 h-8" />,
      description: "Backwaters & Houseboats",
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
      popular: true
    },
    {
      name: "Kochi",
      icon: <Building className="w-8 h-8" />,
      description: "Historic Port City",
      rating: 4.7,
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop"
    },
    {
      name: "Thekkady",
      icon: <Leaf className="w-8 h-8" />,
      description: "Wildlife Sanctuary",
      rating: 4.6,
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop"
    },
    {
      name: "Varkala",
      icon: <Waves className="w-8 h-8" />,
      description: "Cliff Beach Resort",
      rating: 4.5,
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop"
    },
    {
      name: "Wayanad",
      icon: <Mountain className="w-8 h-8" />,
      description: "Adventure & Nature",
      rating: 4.7,
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop"
    }
  ];

  const popularRoutes = [
    {
      from: "Bangalore",
      to: "Munnar",
      duration: "8h 30m",
      price: "₹1,200",
      frequency: "Daily",
      icon: <Mountain className="w-6 h-6" />
    },
    {
      from: "Chennai",
      to: "Alleppey",
      duration: "12h 15m",
      price: "₹1,500",
      frequency: "Daily",
      icon: <Waves className="w-6 h-6" />
    },
    {
      from: "Hyderabad",
      to: "Kochi",
      duration: "16h 45m",
      price: "₹1,800",
      frequency: "Daily",
      icon: <Building className="w-6 h-6" />
    },
    {
      from: "Mumbai",
      to: "Thekkady",
      duration: "20h 30m",
      price: "₹2,200",
      frequency: "Daily",
      icon: <Leaf className="w-6 h-6" />
    }
  ];

  const offers = [
    {
      title: "Kerala Monsoon Special",
      description: "Get 15% OFF on all Kerala routes",
      code: "KERALA15",
      icon: <Gift className="w-8 h-8" />,
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Weekend Getaway",
      description: "Flat ₹200 OFF on weekend bookings",
      code: "WEEKEND200",
      icon: <Calendar className="w-8 h-8" />,
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Group Travel",
      description: "Book 4+ seats, get 20% OFF",
      code: "GROUP20",
      icon: <Users className="w-8 h-8" />,
      color: "from-green-500 to-emerald-500"
    }
  ];

  const renderPanel = () => {
    switch (section) {
      case 'contact':
        return <ContactUsPanel />;
      case 'cancellation':
        return <CancellationPolicyPanel />;
      case 'feedback':
        return <FeedbackPanel />;
      case 'manage':
        return <ManageBookingPanel />;
      case 'status':
        return <StatusCheckPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header with User Welcome */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-sm border-b border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center"
              >
                <Bus className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">YATRIK ERP</h1>
                <p className="text-gray-600">Smart Bus Travel</p>
              </div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="text-right"
            >
              <p className="text-gray-600">Welcome back,</p>
              <p className="text-xl font-semibold text-gray-900">{user?.name || 'Traveler'}</p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Hero Search Section */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
            >
              <div className="text-center mb-8">
                <motion.h2 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-3xl font-bold text-gray-900 mb-2"
                >
                  Discover Kerala's Beauty
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-gray-600 text-lg"
                >
                  Book your bus tickets to the most beautiful destinations in God's Own Country
                </motion.p>
              </div>

              {/* Search Form */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="From"
                    className="w-full pl-10 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="To"
                    className="w-full pl-10 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-all flex items-center justify-center gap-3"
              >
                <Search className="w-6 h-6" />
                Search Buses
              </motion.button>
            </motion.div>

            {/* Offers Section */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              <h3 className="text-2xl font-bold text-gray-900">Special Offers</h3>
              
              <div className="relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentOffer}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.5 }}
                    className={`bg-gradient-to-r ${offers[currentOffer].color} rounded-2xl p-6 text-white shadow-lg`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-xl font-bold mb-2">{offers[currentOffer].title}</h4>
                        <p className="text-white/90 mb-3">{offers[currentOffer].description}</p>
                        <div className="bg-white/20 rounded-lg px-3 py-2 inline-block">
                          <span className="text-sm font-medium">Code: {offers[currentOffer].code}</span>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center"
                      >
                        {offers[currentOffer].icon}
                      </motion.div>
                    </div>
                  </motion.div>
                </AnimatePresence>
                
                {/* Offer Indicators */}
                <div className="flex justify-center gap-2 mt-4">
                  {offers.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentOffer(index)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === currentOffer ? 'bg-blue-600 w-8' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Popular Routes */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              <h3 className="text-2xl font-bold text-gray-900">Popular Routes to Kerala</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {popularRoutes.map((route, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          {route.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{route.from} → {route.to}</h4>
                          <p className="text-sm text-gray-600">{route.duration}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">{route.price}</p>
                        <p className="text-xs text-gray-500">{route.frequency}</p>
                      </div>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
                    >
                      Book Now
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Actions */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white rounded-2xl shadow-md border border-gray-100 p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                {[
                  { icon: <Ticket className="w-5 h-5" />, label: 'My Tickets', action: () => setSection('manage') },
                  { icon: <Search className="w-5 h-5" />, label: 'Check Status', action: () => setSection('status') },
                  { icon: <Heart className="w-5 h-5" />, label: 'Saved Routes', action: () => {} },
                  { icon: <Clock className="w-5 h-5" />, label: 'Recent Searches', action: () => {} }
                ].map((item, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={item.action}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all text-left"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                      {item.icon}
                    </div>
                    <span className="font-medium text-gray-700">{item.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Kerala Destinations */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0 }}
              className="bg-white rounded-2xl shadow-md border border-gray-100 p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Top Kerala Destinations</h3>
              
              <div className="space-y-3">
                {keralaDestinations.slice(0, 4).map((dest, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2 + index * 0.1 }}
                    whileHover={{ x: 5 }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                      {dest.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{dest.name}</h4>
                      <p className="text-sm text-gray-600">{dest.description}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium text-gray-700">{dest.rating}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all"
              >
                View All Destinations
              </motion.button>
            </motion.div>

            {/* Support & Help */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.4 }}
              className="bg-white rounded-2xl shadow-md border border-gray-100 p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Support & Help</h3>
              
              <div className="space-y-3">
                {[
                  { icon: <MessageSquare className="w-5 h-5" />, label: 'Contact Us', action: () => setSection('contact') },
                  { icon: <Shield className="w-5 h-5" />, label: 'Cancellation Policy', action: () => setSection('cancellation') },
                  { icon: <Star className="w-5 h-5" />, label: 'Feedback', action: () => setSection('feedback') }
                ].map((item, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={item.action}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all text-left"
                  >
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                      {item.icon}
                    </div>
                    <span className="font-medium text-gray-700">{item.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Kerala Destinations Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-16"
        >
          <KeralaDestinationsShowcase />
        </motion.div>

        {/* Animated Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-16"
        >
          <AnimatedStats />
        </motion.div>

        {/* Dynamic Panel Display */}
        <AnimatePresence mode="wait">
          {section && (
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.3 }}
              className="mt-8"
            >
              {renderPanel()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard;


