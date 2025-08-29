import React from 'react';
import { BarChart3, Route as RouteIcon, Clock, Users, Bus, Fuel, MapPin, Satellite, LineChart, Bot, BellRing, Sparkles } from 'lucide-react';

const tabs = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'routes', label: 'Routes', icon: RouteIcon },
  { key: 'trips', label: 'Trips', icon: Clock },
  { key: 'crew', label: 'Crew', icon: Users },
  { key: 'bookings', label: 'Bookings', icon: Bus },
  { key: 'fleet', label: 'Fleet', icon: Bus },
  { key: 'fuel', label: 'Fuel', icon: Fuel },
  { key: 'live-map', label: 'Live Map', icon: MapPin },
  { key: 'gps', label: 'GPS', icon: Satellite },
  { key: 'analytics', label: 'Analytics', icon: LineChart },
  { key: 'ai', label: 'AI', icon: Bot },
  { key: 'alerts', label: 'Alerts', icon: BellRing },
  { key: 'smart', label: 'Smart', icon: Sparkles },
];

const NavTabs = ({ active, onChange, dense }) => {
  return (
    <div className="bg-white/95 border-b border-slate-200 shadow-sm">
      <div className={`max-w-[1600px] mx-auto ${dense ? 'px-4' : 'px-6'}`}>
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = active === t.key;
            return (
              <button
                key={t.key}
                onClick={() => onChange(t.key)}
                className={`relative inline-flex items-center gap-2 ${dense ? 'px-3 py-2 text-[13px]' : 'px-4 py-3 text-sm'} font-medium rounded-t-lg transition-colors ${isActive ? 'text-[#E91E63]' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                {isActive && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-[#E91E63]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NavTabs;


