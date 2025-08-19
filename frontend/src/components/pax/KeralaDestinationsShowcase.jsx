import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mountain, Waves, Building, Leaf, Camera, 
  Star, Heart, Navigation, MapPin, Clock,
  Users, TrendingUp, Shield, Gift
} from 'lucide-react';

const KeralaDestinationsShowcase = () => {
  const [selectedDestination, setSelectedDestination] = useState(0);

  const destinations = [
    {
      name: "Munnar",
      tagline: "Tea Gardens & Rolling Hills",
      description: "Experience the serene beauty of endless tea plantations, misty mountains, and cool climate. Perfect for nature lovers and adventure seekers.",
      highlights: ["Tea Gardens", "Eravikulam National Park", "Adventure Sports", "Spice Plantations"],
      rating: 4.8,
      reviews: 1247,
      price: "₹1,200",
      duration: "8h 30m",
      icon: <Mountain className="w-12 h-12" />,
      color: "from-green-500 to-emerald-600",
      bgColor: "bg-green-50",
      popular: true,
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop"
    },
    {
      name: "Alleppey",
      tagline: "Backwaters & Houseboats",
      description: "Cruise through the tranquil backwaters of Kerala in traditional houseboats. Experience the unique lifestyle of the water-bound villages.",
      highlights: ["Houseboat Cruises", "Backwater Tours", "Ayurveda", "Local Cuisine"],
      rating: 4.9,
      reviews: 2156,
      price: "₹1,500",
      duration: "12h 15m",
      icon: <Waves className="w-12 h-12" />,
      color: "from-blue-500 to-cyan-600",
      bgColor: "bg-blue-50",
      popular: true,
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop"
    },
    {
      name: "Kochi",
      tagline: "Historic Port City",
      description: "A blend of colonial heritage and modern culture. Explore the famous Chinese fishing nets, spice markets, and historic Fort Kochi.",
      highlights: ["Chinese Fishing Nets", "Fort Kochi", "Spice Markets", "Jewish Synagogue"],
      rating: 4.7,
      reviews: 1893,
      price: "₹1,800",
      duration: "16h 45m",
      icon: <Building className="w-12 h-12" />,
      color: "from-purple-500 to-pink-600",
      bgColor: "bg-purple-50",
      popular: false,
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop"
    },
    {
      name: "Thekkady",
      tagline: "Wildlife Sanctuary",
      description: "Home to the famous Periyar Wildlife Sanctuary. Experience thrilling boat rides, jungle treks, and wildlife spotting.",
      highlights: ["Periyar Wildlife", "Boat Rides", "Jungle Treks", "Spice Gardens"],
      rating: 4.6,
      reviews: 987,
      price: "₹1,600",
      duration: "14h 20m",
      icon: <Leaf className="w-12 h-12" />,
      color: "from-orange-500 to-red-600",
      bgColor: "bg-orange-50",
      popular: false,
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop"
    },
    {
      name: "Varkala",
      tagline: "Cliff Beach Resort",
      description: "A stunning cliff-top destination with pristine beaches. Perfect for yoga, meditation, and beach activities.",
      highlights: ["Cliff Views", "Beach Activities", "Yoga Retreats", "Water Sports"],
      rating: 4.5,
      reviews: 756,
      price: "₹1,300",
      duration: "10h 45m",
      icon: <Waves className="w-12 h-12" />,
      color: "from-teal-500 to-blue-600",
      bgColor: "bg-teal-50",
      popular: false,
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop"
    },
    {
      name: "Wayanad",
      tagline: "Adventure & Nature",
      description: "A paradise for adventure enthusiasts with waterfalls, caves, and trekking trails through dense forests.",
      highlights: ["Waterfalls", "Cave Exploration", "Trekking", "Wildlife"],
      rating: 4.7,
      reviews: 1123,
      price: "₹1,400",
      duration: "11h 30m",
      icon: <Mountain className="w-12 h-12" />,
      color: "from-indigo-500 to-purple-600",
      bgColor: "bg-indigo-50",
      popular: true,
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop"
    }
  ];

  return (
    <div className="py-12 bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <MapPin className="w-10 h-10 text-white" />
          </motion.div>
          
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Kerala's Magic
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From misty mountains to pristine beaches, from backwaters to wildlife sanctuaries - 
            experience the diverse beauty of God's Own Country
          </p>
        </motion.div>

        {/* Destination Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {destinations.map((dest, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className={`relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer ${
                selectedDestination === index ? 'ring-4 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedDestination(index)}
            >
              {/* Background Image */}
              <div className="relative h-48 overflow-hidden">
                <motion.img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Popular Badge */}
                {dest.popular && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.5 }}
                    className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1"
                  >
                    <Star className="w-4 h-4 fill-current" />
                    Popular
                  </motion.div>
                )}
              </div>

              {/* Content */}
              <div className="p-6 bg-white">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{dest.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{dest.tagline}</p>
                  </div>
                  <div className={`w-12 h-12 ${dest.bgColor} rounded-xl flex items-center justify-center text-gray-700`}>
                    {dest.icon}
                  </div>
                </div>

                {/* Rating & Reviews */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(dest.rating) ? 'text-yellow-500 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">{dest.rating}</span>
                  <span className="text-sm text-gray-500">({dest.reviews} reviews)</span>
                </div>

                {/* Highlights */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {dest.highlights.slice(0, 3).map((highlight, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>

                {/* Price & Duration */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{dest.price}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {dest.duration}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`bg-gradient-to-r ${dest.color} text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all`}
                  >
                    Book Now
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Featured Destination Details */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDestination}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Image Section */}
              <div className="relative h-80 lg:h-full overflow-hidden">
                <motion.img
                  src={destinations[selectedDestination].image}
                  alt={destinations[selectedDestination].name}
                  className="w-full h-full object-cover"
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.8 }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
                
                {/* Floating Info Card */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg"
                >
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {destinations[selectedDestination].name}
                  </h3>
                  <p className="text-gray-600 mb-3">
                    {destinations[selectedDestination].tagline}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600">
                        {destinations[selectedDestination].price}
                      </p>
                      <p className="text-sm text-gray-500">Starting from</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-900">
                        {destinations[selectedDestination].duration}
                      </p>
                      <p className="text-sm text-gray-500">Journey time</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Content Section */}
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Why Visit {destinations[selectedDestination].name}?
                  </h2>
                  <p className="text-lg text-gray-600 leading-relaxed mb-6">
                    {destinations[selectedDestination].description}
                  </p>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {destinations[selectedDestination].highlights.map((highlight, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + idx * 0.1 }}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Star className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-700">{highlight}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex-1 bg-gradient-to-r ${destinations[selectedDestination].color} text-white py-4 px-8 rounded-xl font-semibold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-3`}
                    >
                      <Navigation className="w-6 h-6" />
                      Book This Trip
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-blue-500 hover:text-blue-600 transition-all flex items-center gap-2"
                    >
                      <Heart className="w-5 h-5" />
                      Save
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default KeralaDestinationsShowcase;
