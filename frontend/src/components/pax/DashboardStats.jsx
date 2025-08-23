import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import AnimatedCard from './AnimatedCard';

const DashboardStats = ({ trips, bookings, payments }) => {
  const [stats, setStats] = useState({
    totalTrips: 0,
    confirmedTrips: 0,
    liveTrips: 0,
    totalSpent: 0,
    averageFare: 0,
    tripTrend: 'stable'
  });

  useEffect(() => {
    if (trips && bookings && payments) {
      const totalTrips = trips.length + bookings.length;
      const confirmedTrips = trips.filter(t => t.status === 'Confirmed').length;
      const liveTrips = trips.filter(t => t.status === 'In Progress').length;
      const totalSpent = [...trips, ...bookings].reduce((sum, item) => sum + (item.fare || 0), 0);
      const averageFare = totalTrips > 0 ? totalSpent / totalTrips : 0;

      // Calculate trend (simple logic for demo)
      let tripTrend = 'stable';
      if (confirmedTrips > 2) tripTrend = 'up';
      else if (confirmedTrips < 1) tripTrend = 'down';

      setStats({
        totalTrips,
        confirmedTrips,
        liveTrips,
        totalSpent,
        averageFare,
        tripTrend
      });
    }
  }, [trips, bookings, payments]);

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

  const statCards = [
    {
      title: 'Total Trips',
      value: stats.totalTrips,
      icon: '🚌',
      color: 'blue',
      trend: stats.tripTrend,
      trendValue: stats.tripTrend === 'up' ? '+12%' : stats.tripTrend === 'down' ? '-5%' : '0%',
      delay: 0
    },
    {
      title: 'Confirmed',
      value: stats.confirmedTrips,
      icon: '✅',
      color: 'green',
      percentage: stats.totalTrips > 0 ? Math.round((stats.confirmedTrips / stats.totalTrips) * 100) : 0,
      delay: 1
    },
    {
      title: 'Live Trips',
      value: stats.liveTrips,
      icon: '🔄',
      color: 'orange',
      status: 'Active',
      delay: 2
    },
    {
      title: 'Total Spent',
      value: `₹${stats.totalSpent.toLocaleString()}`,
      icon: '💰',
      color: 'purple',
      average: `Avg: ₹${Math.round(stats.averageFare)}`,
      delay: 3
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat, index) => (
        <AnimatedCard
          key={stat.title}
          hoverEffect={true}
          gradient={true}
          glow={true}
          delay={stat.delay}
          className="p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg mr-3">
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
            
            <div className="text-right">
              {stat.trend && (
                <div className="flex items-center">
                  {getTrendIcon(stat.trend)}
                  <span className={`ml-1 text-xs ${getTrendColor(stat.trend)}`}>
                    {stat.trendValue}
                  </span>
                </div>
              )}
              {stat.percentage !== undefined && (
                <p className="text-xs text-gray-500">{stat.percentage}%</p>
              )}
              {stat.status && (
                <p className="text-xs text-gray-500">{stat.status}</p>
              )}
              {stat.average && (
                <p className="text-xs text-gray-500">{stat.average}</p>
              )}
            </div>
          </div>
        </AnimatedCard>
      ))}
    </div>
  );
};

export default DashboardStats;
