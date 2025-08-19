import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bus, Users, Star, MapPin, Clock, TrendingUp,
  Heart, Shield, Award, Globe, Route, Ticket
} from 'lucide-react';

const AnimatedStats = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById('animated-stats');
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  const stats = [
    {
      icon: <Bus className="w-8 h-8" />,
      value: 5000,
      label: "Buses Daily",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      delay: 0.1
    },
    {
      icon: <Users className="w-8 h-8" />,
      value: 100000,
      label: "Happy Travelers",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      delay: 0.2
    },
    {
      icon: <Star className="w-8 h-8" />,
      value: 4.8,
      label: "Customer Rating",
      color: "from-yellow-500 to-orange-500",
      bgColor: "bg-yellow-50",
      delay: 0.3
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      value: 150,
      label: "Cities Connected",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50",
      delay: 0.4
    },
    {
      icon: <Clock className="w-8 h-8" />,
      value: 99.5,
      label: "On-Time Rate %",
      color: "from-indigo-500 to-blue-500",
      bgColor: "bg-indigo-50",
      delay: 0.5
    },
    {
      icon: <Shield className="w-8 h-8" />,
      value: 100,
      label: "Safety Score",
      color: "from-red-500 to-pink-500",
      bgColor: "bg-red-50",
      delay: 0.6
    }
  ];

  const AnimatedCounter = ({ value, delay }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
      if (isVisible) {
        const startTime = Date.now();
        const duration = 2000; // 2 seconds
        
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Easing function for smooth animation
          const easeOut = 1 - Math.pow(1 - progress, 3);
          const currentValue = Math.round(value * easeOut);
          
          setDisplayValue(currentValue);
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        // Start animation after delay
        const timeoutId = setTimeout(animate, delay * 1000);
        
        return () => clearTimeout(timeoutId);
      }
    }, [isVisible, value, delay]);

    return <span className="text-4xl font-bold">{displayValue}</span>;
  };

  return (
    <div id="animated-stats" className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
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
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              repeatDelay: 3 
            }}
            className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <TrendingUp className="w-10 h-10 text-white" />
          </motion.div>
          
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Why Choose YATRIK ERP?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're committed to providing the best bus travel experience with modern technology, 
            excellent service, and unmatched reliability
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: stat.delay }}
              whileHover={{ y: -10, scale: 1.05 }}
              className="relative group"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 group-hover:shadow-xl transition-all duration-300" />
              
              {/* Content */}
              <div className="relative p-8 text-center">
                {/* Icon */}
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    repeatDelay: 2,
                    delay: stat.delay 
                  }}
                  className={`w-16 h-16 ${stat.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <div className={`text-transparent bg-clip-text bg-gradient-to-r ${stat.color}`}>
                    {stat.icon}
                  </div>
                </motion.div>

                {/* Value */}
                <div className="mb-3">
                  {stat.label === "Customer Rating" || stat.label === "On-Time Rate %" || stat.label === "Safety Score" ? (
                    <div className="flex items-center justify-center gap-2">
                      <AnimatedCounter value={stat.value} delay={stat.delay} />
                      {stat.label === "Customer Rating" && <span className="text-2xl text-gray-400">/5</span>}
                      {stat.label === "On-Time Rate %" && <span className="text-2xl text-gray-400">%</span>}
                      {stat.label === "Safety Score" && <span className="text-2xl text-gray-400">%</span>}
                    </div>
                  ) : (
                    <AnimatedCounter value={stat.value} delay={stat.delay} />
                  )}
                </div>

                {/* Label */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{stat.label}</h3>

                {/* Decorative Elements */}
                <div className="absolute top-4 right-4 opacity-20">
                  <div className={`w-8 h-8 bg-gradient-to-r ${stat.color} rounded-full`} />
                </div>
                <div className="absolute bottom-4 left-4 opacity-20">
                  <div className={`w-6 h-6 bg-gradient-to-r ${stat.color} rounded-full`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-12"
        >
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-2xl mx-auto">
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 2, -2, 0]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                repeatDelay: 2 
              }}
              className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Award className="w-8 h-8 text-white" />
            </motion.div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Award-Winning Service
            </h3>
            <p className="text-gray-600 mb-6">
              Join thousands of satisfied customers who trust YATRIK ERP for their travel needs. 
              Experience the difference of premium bus travel.
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
            >
              <Globe className="w-5 h-5" />
              Start Your Journey
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnimatedStats;
