import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const AnimatedChart = ({ data, title, subtitle, type = "line" }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const calculateTrend = (current, previous) => {
    if (!previous) return 'stable';
    const change = ((current - previous) / previous) * 100;
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  };

  const renderLineChart = () => (
    <div className="relative h-48">
      {/* Grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between">
        {[0, 25, 50, 75, 100].map((percent) => (
          <div
            key={percent}
            className="border-t border-gray-100"
            style={{ top: `${percent}%` }}
          />
        ))}
      </div>

      {/* Chart line */}
      <svg className="absolute inset-0 w-full h-full">
        <motion.path
          d={data.map((point, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - ((point.value - minValue) / (maxValue - minValue)) * 100;
            return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
          }).join(' ')}
          stroke="url(#lineGradient)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="1" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Data points */}
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - ((point.value - minValue) / (maxValue - minValue)) * 100;
          const trend = calculateTrend(point.value, index > 0 ? data[index - 1].value : null);

          return (
            <motion.g key={index}>
              {/* Hover area */}
              <rect
                x={`${x - 2}%`}
                y="0%"
                width="4%"
                height="100%"
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              />

              {/* Data point */}
              <motion.circle
                cx={`${x}%`}
                cy={`${y}%`}
                r={hoveredIndex === index ? 6 : 4}
                fill="white"
                stroke="#3B82F6"
                strokeWidth={hoveredIndex === index ? 3 : 2}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1, type: "spring" }}
                className="drop-shadow-sm"
              />

              {/* Hover tooltip */}
              {hoveredIndex === index && (
                <motion.foreignObject
                  x={`${x + 5}%`}
                  y={`${y - 10}%`}
                  width="120"
                  height="80"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-sm">
                    <div className="font-semibold text-gray-800">{point.label}</div>
                    <div className="text-gray-600">{point.value.toLocaleString()}</div>
                    <div className="flex items-center mt-1">
                      {getTrendIcon(trend)}
                      <span className={`ml-1 text-xs ${getTrendColor(trend)}`}>
                        {trend === 'up' ? '+12%' : trend === 'down' ? '-5%' : '0%'}
                      </span>
                    </div>
                  </div>
                </motion.foreignObject>
              )}
            </motion.g>
          );
        })}
      </svg>

      {/* Area fill */}
      <svg className="absolute inset-0 w-full h-full">
        <motion.path
          d={`M 0% 100% ${data.map((point, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - ((point.value - minValue) / (maxValue - minValue)) * 100;
            return `L ${x}% ${y}%`;
          }).join(' ')} L 100% 100% Z`}
          fill="url(#areaGradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 1, delay: 1 }}
        />

        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );

  const renderBarChart = () => (
    <div className="relative h-48">
      <div className="absolute inset-0 flex items-end justify-between space-x-2">
        {data.map((point, index) => {
          const height = ((point.value - minValue) / (maxValue - minValue)) * 100;
          const trend = calculateTrend(point.value, index > 0 ? data[index - 1].value : null);

          return (
            <motion.div
              key={index}
              className="relative flex-1 bg-gradient-to-t from-blue-500 to-blue-600 rounded-t-lg cursor-pointer group"
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: index * 0.1, duration: 0.8, type: "spring" }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Hover effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-blue-400 to-blue-500 rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                initial={{ opacity: 0 }}
                animate={{ opacity: hoveredIndex === index ? 1 : 0 }}
              />

              {/* Value label */}
              {hoveredIndex === index && (
                <motion.div
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  {point.value.toLocaleString()}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="absolute -bottom-8 inset-x-0 flex justify-between text-xs text-gray-500">
        {data.map((point, index) => (
          <div key={index} className="text-center">
            {point.label}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <p className="text-gray-600 text-sm">{subtitle}</p>
        </div>
        <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
          Export
        </button>
      </div>

      <div className="mb-4">
        {type === "line" ? renderLineChart() : renderBarChart()}
      </div>

      {/* Summary stats */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2" />
            <span className="text-gray-600">Current</span>
            <span className="ml-2 font-semibold">{data[data.length - 1]?.value.toLocaleString()}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-300 rounded-full mr-2" />
            <span className="text-gray-600">Average</span>
            <span className="ml-2 font-semibold">
              {Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedChart;
