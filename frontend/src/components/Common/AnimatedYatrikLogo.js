import React from 'react';
import { motion } from 'framer-motion';
import BrandLogo from './BrandLogo';

const AnimatedYatrikLogo = ({ className = "w-60 h-60" }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div 
        className="flex items-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Animated Logo */}
        <motion.div
          className="relative"
          animate={{ x: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <BrandLogo size={40} />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AnimatedYatrikLogo;
