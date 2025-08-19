import React from 'react';

const AnimatedMapPanel = () => {
  const panelSize = 400;
  const centerRadius = panelSize * 0.25;
  const yEndRadius = panelSize * 0.15;

  return (
    <div className="animated-map-panel relative w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" viewBox="0 0 400 400">
          <defs>
            <pattern id="subtleDots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1" fill="#3b82f6" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#subtleDots)"/>
        </svg>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 text-center">
        {/* Central Circle with Y */}
        <div className="relative mb-8">
          {/* Outer Glow Ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-indigo-600 opacity-20 blur-xl animate-pulse"></div>
          
          {/* Main Circle */}
          <div className="relative w-48 h-48 mx-auto bg-gradient-to-br from-white to-blue-50 rounded-full shadow-2xl border-4 border-blue-200 flex items-center justify-center">
            {/* Y Letter */}
            <div className="text-8xl font-bold text-blue-600 animate-bounce">
              Y
            </div>
            
            {/* Inner Glow */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-100 to-transparent opacity-50"></div>
          </div>
        </div>

        {/* Y-Endpoint Maps */}
        <div className="relative">
          {/* Top Left Map */}
          <div className="absolute -top-16 -left-20 w-24 h-24 transform -rotate-12">
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg shadow-lg animate-pulse"></div>
              <div className="absolute inset-1 bg-white rounded-md flex items-center justify-center overflow-hidden">
                {/* Map 1 Content */}
                <svg className="w-full h-full" viewBox="0 0 96 96">
                  {/* Background Grid */}
                  <defs>
                    <pattern id="grid1" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                      <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#f97316" strokeWidth="0.5" opacity="0.3"/>
                    </pattern>
                  </defs>
                  <rect width="96" height="96" fill="url(#grid1)"/>
                  
                  {/* Route Lines */}
                  <path d="M20 20 Q48 40 76 20" stroke="#f97316" strokeWidth="2" fill="none" className="route-line-1"/>
                  <path d="M20 76 Q48 56 76 76" stroke="#f97316" strokeWidth="2" fill="none" className="route-line-2"/>
                  
                  {/* Map Markers */}
                  <circle cx="20" cy="20" r="3" fill="#f97316" className="map-marker"/>
                  <circle cx="76" cy="20" r="3" fill="#f97316" className="map-marker"/>
                  <circle cx="20" cy="76" r="3" fill="#f97316" className="map-marker"/>
                  <circle cx="76" cy="76" r="3" fill="#f97316" className="map-marker"/>
                  
                  {/* Center Hub */}
                  <circle cx="48" cy="48" r="4" fill="#f97316" className="map-hub"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Top Right Map */}
          <div className="absolute -top-16 -right-20 w-24 h-24 transform rotate-12">
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg shadow-lg animate-pulse"></div>
              <div className="absolute inset-1 bg-white rounded-md flex items-center justify-center overflow-hidden">
                {/* Map 2 Content */}
                <svg className="w-full h-full" viewBox="0 0 96 96">
                  {/* Background Grid */}
                  <defs>
                    <pattern id="grid2" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                      <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#22c55e" strokeWidth="0.5" opacity="0.3"/>
                    </pattern>
                  </defs>
                  <rect width="96" height="96" fill="url(#grid2)"/>
                  
                  {/* Route Lines */}
                  <path d="M20 20 Q48 40 76 20" stroke="#22c55e" strokeWidth="2" fill="none" className="route-line-3"/>
                  <path d="M20 76 Q48 56 76 76" stroke="#22c55e" strokeWidth="2" fill="none" className="route-line-4"/>
                  
                  {/* Map Markers */}
                  <circle cx="20" cy="20" r="3" fill="#22c55e" className="map-marker"/>
                  <circle cx="76" cy="20" r="3" fill="#22c55e" className="map-marker"/>
                  <circle cx="20" cy="76" r="3" fill="#22c55e" className="map-marker"/>
                  <circle cx="76" cy="76" r="3" fill="#22c55e" className="map-marker"/>
                  
                  {/* Center Hub */}
                  <circle cx="48" cy="48" r="4" fill="#22c55e" className="map-hub"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Bottom Map */}
          <div className="absolute top-32 left-1/2 transform -translate-x-1/2 w-24 h-24">
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-violet-500 rounded-lg shadow-lg animate-pulse"></div>
              <div className="absolute inset-1 bg-white rounded-md flex items-center justify-center overflow-hidden">
                {/* Map 3 Content */}
                <svg className="w-full h-full" viewBox="0 0 96 96">
                  {/* Background Grid */}
                  <defs>
                    <pattern id="grid3" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                      <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#a855f7" strokeWidth="0.5" opacity="0.3"/>
                    </pattern>
                  </defs>
                  <rect width="96" height="96" fill="url(#grid3)"/>
                  
                  {/* Route Lines */}
                  <path d="M20 20 Q48 40 76 20" stroke="#a855f7" strokeWidth="2" fill="none" className="route-line-5"/>
                  <path d="M20 76 Q48 56 76 76" stroke="#a855f7" strokeWidth="2" fill="none" className="route-line-6"/>
                  
                  {/* Map Markers */}
                  <circle cx="20" cy="20" r="3" fill="#a855f7" className="map-marker"/>
                  <circle cx="76" cy="20" r="3" fill="#a855f7" className="map-marker"/>
                  <circle cx="20" cy="76" r="3" fill="#a855f7" className="map-marker"/>
                  <circle cx="76" cy="76" r="3" fill="#a855f7" className="map-marker"/>
                  
                  {/* Center Hub */}
                  <circle cx="48" cy="48" r="4" fill="#a855f7" className="map-hub"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Title and Description */}
        <div className="mt-16 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Smart Bus Travel Management
          </h1>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Experience seamless transportation with real-time tracking, intelligent routing, and modern booking systems
          </p>
          
          {/* Feature Tags */}
          <div className="flex justify-center space-x-3">
            <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium animate-pulse">
              Live Tracking
            </span>
            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium animate-pulse">
              Smart Routes
            </span>
            <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium animate-pulse">
              Instant Booking
            </span>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating Buses */}
        <div className="absolute top-20 left-10 w-8 h-8 bg-blue-500 rounded-full animate-bounce"></div>
        <div className="absolute top-32 right-16 w-6 h-6 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-32 left-20 w-7 h-7 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
        
        {/* Additional Floating Elements */}
        <div className="absolute top-40 left-32 w-4 h-4 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute top-24 right-32 w-5 h-5 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-40 right-24 w-6 h-6 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '2.5s'}}></div>
        
        {/* Connection Lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
          <defs>
            <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3"/>
            </linearGradient>
            <linearGradient id="secondaryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2"/>
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.2"/>
            </linearGradient>
          </defs>
          <path d="M200 200 Q150 150 100 100" stroke="url(#connectionGradient)" strokeWidth="1" fill="none" className="connection-line"/>
          <path d="M200 200 Q250 150 300 100" stroke="url(#connectionGradient)" strokeWidth="1" fill="none" className="connection-line"/>
          <path d="M200 200 Q200 250 200 300" stroke="url(#connectionGradient)" strokeWidth="1" fill="none" className="connection-line"/>
          
          {/* Secondary Connection Lines */}
          <path d="M160 160 Q200 180 240 160" stroke="url(#secondaryGradient)" strokeWidth="0.5" fill="none" className="connection-line-secondary"/>
          <path d="M160 240 Q200 220 240 240" stroke="url(#secondaryGradient)" strokeWidth="0.5" fill="none" className="connection-line-secondary"/>
        </svg>
        
        {/* Animated Particles */}
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-300 rounded-full animate-ping"></div>
        <div className="absolute bottom-16 left-1/4 w-1.5 h-1.5 bg-green-300 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-16 right-1/4 w-1.5 h-1.5 bg-purple-300 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
      </div>
    </div>
  );
};

export default AnimatedMapPanel;
