import React from 'react';
import { motion } from 'framer-motion';
import logo from '../../assets/logo.png';

const AnimatedYatrikLogo = ({ className = "w-60 h-60" }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div 
        className="flex items-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Animated Bus Icon */}
        <motion.div
          className="relative"
          animate={{
            x: [0, -10, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <img 
            src={logo} 
            alt="YATRIK Bus" 
            className="w-16 h-16 object-contain"
          />
        </motion.div>
        
        {/* YATRIK Text */}
        <motion.div
          className="flex flex-col"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          <motion.span 
            className="text-4xl font-bold text-gray-800"
            animate={{
              color: ["#ff3366", "#e11d48", "#ff3366"]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            YATRIK
          </motion.span>
          <motion.span 
            className="text-xl font-semibold text-gray-600 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          >
            ERP
          </motion.span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AnimatedYatrikLogo;
