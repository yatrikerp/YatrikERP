import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({ 
  children, 
  className = "", 
  hoverEffect = true,
  blur = "backdrop-blur-md",
  transparency = "bg-white/20",
  border = "border-white/30",
  shadow = "shadow-2xl"
}) => {
  const cardVariants = {
    initial: { 
      scale: 1, 
      y: 0,
      rotateX: 0
    },
    hover: { 
      scale: 1.02, 
      y: -5,
      rotateX: 1
    },
    tap: { 
      scale: 0.98,
      y: -2
    }
  };

  const baseClasses = `
    relative overflow-hidden rounded-2xl 
    ${transparency} ${border} ${shadow}
    transition-all duration-300 ease-out
    ${className}
  `;

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      whileHover={hoverEffect ? "hover" : "initial"}
      whileTap="tap"
      transition={{ 
        duration: 0.3, 
        ease: "easeOut"
      }}
      className={baseClasses}
    >
      {/* Glass effect overlay */}
      <div className={`absolute inset-0 ${blur} bg-white/10`} />
      
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Subtle border glow */}
      <div className="absolute inset-0 rounded-2xl border border-white/20" />
    </motion.div>
  );
};

export default GlassCard;
