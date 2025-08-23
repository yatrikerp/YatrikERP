import React, { useState } from 'react';
import { motion } from 'framer-motion';

const AnimatedCard = ({ 
  children, 
  className = "", 
  hoverEffect = true, 
  gradient = false,
  glow = false,
  delay = 0,
  onClick = null 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const cardVariants = {
    initial: { 
      scale: 1, 
      y: 0,
      rotateX: 0,
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
    },
    hover: { 
      scale: 1.02, 
      y: -8,
      rotateX: 2,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
    },
    tap: { 
      scale: 0.98,
      y: -4
    }
  };

  const glowVariants = {
    initial: { 
      opacity: 0,
      scale: 0.8
    },
    hover: { 
      opacity: 1,
      scale: 1.2
    }
  };

  const baseClasses = `
    relative overflow-hidden rounded-2xl border border-gray-100 
    bg-white shadow-sm transition-all duration-300 ease-out
    ${gradient ? 'bg-gradient-to-br from-white to-gray-50' : ''}
    ${glow ? 'ring-1 ring-blue-100' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `;

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      whileHover={hoverEffect ? "hover" : "initial"}
      whileTap={onClick ? "tap" : "initial"}
      transition={{ 
        duration: 0.3, 
        ease: "easeOut",
        delay: delay * 0.1
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className={baseClasses}
    >
      {/* Animated background gradient */}
      {gradient && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Glow effect */}
      {glow && (
        <motion.div
          variants={glowVariants}
          className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur opacity-20"
          initial="initial"
          animate={isHovered ? "hover" : "initial"}
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Hover border effect */}
      {hoverEffect && (
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-transparent"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: isHovered ? 1 : 0,
            borderColor: isHovered ? "rgba(59, 130, 246, 0.3)" : "transparent"
          }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  );
};

export default AnimatedCard;
