import React from 'react';
import { motion } from 'framer-motion';

const ProgressRing = ({ 
  progress, 
  size = 120, 
  strokeWidth = 8, 
  color = "blue",
  showPercentage = true,
  animated = true 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getColorClasses = (color) => {
    const colorMap = {
      blue: "from-blue-500 to-blue-600",
      green: "from-green-500 to-green-600",
      purple: "from-purple-500 to-purple-600",
      orange: "from-orange-500 to-orange-600",
      red: "from-red-500 to-red-600",
      pink: "from-pink-500 to-pink-600"
    };
    return colorMap[color] || "from-blue-500 to-blue-600";
  };

  const getStrokeColor = (color) => {
    const colorMap = {
      blue: "#3B82F6",
      green: "#10B981",
      purple: "#8B5CF6",
      orange: "#F59E0B",
      red: "#EF4444",
      pink: "#EC4899"
    };
    return colorMap[color] || "#3B82F6";
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="opacity-30"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getStrokeColor(color)}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={animated ? { strokeDashoffset: circumference } : {}}
          animate={animated ? { strokeDashoffset } : {}}
          transition={{
            duration: 1.5,
            ease: "easeOut",
            delay: 0.2
          }}
          className="drop-shadow-sm"
        />

        {/* Gradient overlay */}
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={getStrokeColor(color)} stopOpacity="0.8" />
            <stop offset="100%" stopColor={getStrokeColor(color)} stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <motion.div
            initial={animated ? { scale: 0, opacity: 0 } : {}}
            animate={animated ? { scale: 1, opacity: 1 } : {}}
            transition={{
              duration: 0.5,
              delay: 0.8,
              type: "spring",
              stiffness: 200
            }}
            className="text-center"
          >
            <div className="text-2xl font-bold text-gray-800">
              {Math.round(progress)}%
            </div>
            <div className="text-xs text-gray-500 font-medium">
              Complete
            </div>
          </motion.div>
        )}
      </div>

      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-xl opacity-0 hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
};

export default ProgressRing;
