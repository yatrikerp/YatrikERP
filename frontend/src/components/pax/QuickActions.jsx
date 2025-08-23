import React from 'react';
import { Search, Calendar, Navigation, MessageSquare, Bus, CreditCard, Headphones } from 'lucide-react';
import AnimatedCard from './AnimatedCard';

const QuickActions = ({ onActionClick }) => {
  const actions = [
    {
      id: 'search',
      label: 'Search Trips',
      icon: <Search className="w-8 h-8 text-blue-600" />,
      color: 'blue',
      description: 'Find available bus routes',
      gradient: true
    },
    {
      id: 'bookings',
      label: 'My Bookings',
      icon: <Calendar className="w-8 h-8 text-green-600" />,
      color: 'green',
      description: 'View all your reservations',
      gradient: true
    },
    {
      id: 'tracking',
      label: 'Live Tracking',
      icon: <Navigation className="w-8 h-8 text-purple-600" />,
      color: 'purple',
      description: 'Track your current journey',
      gradient: true
    },
    {
      id: 'support',
      label: 'Get Support',
      icon: <MessageSquare className="w-8 h-8 text-orange-600" />,
      color: 'orange',
      description: 'Contact customer service',
      gradient: true
    },
    {
      id: 'trips',
      label: 'My Trips',
      icon: <Bus className="w-8 h-8 text-indigo-600" />,
      color: 'indigo',
      description: 'View trip history',
      gradient: true
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: <CreditCard className="w-8 h-8 text-emerald-600" />,
      color: 'emerald',
      description: 'Payment history & methods',
      gradient: true
    },
    {
      id: 'help',
      label: 'Help Center',
      icon: <Headphones className="w-8 h-8 text-rose-600" />,
      color: 'rose',
      description: 'FAQs & guides',
      gradient: true
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
        <p className="text-gray-600 mt-1">What would you like to do?</p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <AnimatedCard
              key={action.id}
              hoverEffect={true}
              gradient={action.gradient}
              glow={true}
              delay={index}
              onClick={() => onActionClick(action.id)}
              className="p-4 text-center group cursor-pointer"
            >
              <div className="mb-3 group-hover:scale-110 transition-transform duration-200">
                {action.icon}
              </div>
              <span className="text-sm font-medium text-gray-700 block mb-1">
                {action.label}
              </span>
              <span className="text-xs text-gray-500">
                {action.description}
              </span>
            </AnimatedCard>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
