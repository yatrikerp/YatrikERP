import React from 'react';
import { TrendingUp, Calendar, DollarSign, MapPin, Bus, Clock } from 'lucide-react';

const StatsRow = ({ statsData }) => {
  const defaultStats = {
    upcomingTrips: 3,
    totalSpent: 3450,
    totalDistance: 2847,
    averageRating: 4.8,
    completedTrips: 12,
    savedRoutes: 5
  };

  const data = statsData || defaultStats;

  const statCards = [
    {
      title: 'Upcoming Trips',
      value: data.upcomingTrips,
      change: '+2 from last month',
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      title: 'Total Spent',
      value: `₹${data.totalSpent.toLocaleString()}`,
      change: '+₹450 this month',
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      title: 'Total Distance',
      value: `${data.totalDistance} km`,
      change: '+156 km this month',
      icon: MapPin,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
    {
      title: 'Average Rating',
      value: data.averageRating,
      change: '+0.2 from last month',
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <div key={index} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100">
            <div className="p-6">
              {/* Icon */}
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              
              {/* Value */}
              <div className="mb-2">
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.title}</p>
              </div>
              
              {/* Change */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${stat.bgColor}`}></div>
                <span className={`text-sm font-medium ${stat.textColor}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsRow;


