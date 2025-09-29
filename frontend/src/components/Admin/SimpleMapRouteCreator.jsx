import React, { useState } from 'react';
// Icons temporarily replaced with emojis to avoid import issues

const SimpleMapRouteCreator = ({ 
  mapState, 
  onMapClick, 
  onRouteGenerated,
  className = "w-full h-full"
}) => {
  const [isClicking, setIsClicking] = useState(false);

  const handleMockClick = (lat, lng) => {
    if (isClicking) return;
    setIsClicking(true);
    
    // Simulate async operation
    setTimeout(() => {
      onMapClick(lat, lng);
      setIsClicking(false);
    }, 500);
  };

  return (
    <div className={className}>
      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-green-50 border border-gray-300 rounded-lg relative overflow-hidden">
        {/* Interactive Map Interface */}
        <div className="absolute inset-0 p-6">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-xl">🗺️</div>
            <h3 className="text-xl font-semibold text-gray-900">Interactive Route Creator</h3>
            <p className="text-sm text-gray-600 mt-1">Select your route start and end points</p>
          </div>

          {/* Interactive Map Area */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 h-80 mb-6">
            {[
              { name: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366, color: 'bg-green-100' },
              { name: 'Kochi', lat: 9.9312, lng: 76.2673, color: 'bg-blue-100' },
              { name: 'Kozhikode', lat: 11.2588, lng: 75.7804, color: 'bg-purple-100' },
              { name: 'Thrissur', lat: 10.5276, lng: 76.2144, color: 'bg-yellow-100' },
              { name: 'Kollam', lat: 8.8932, lng: 76.6141, color: 'bg-pink-100' },
              { name: 'Kannur', lat: 11.8745, lng: 75.3704, color: 'bg-indigo-100' }
            ].map((city, index) => {
              const isStart = mapState.startLocation && 
                Math.abs(mapState.startLocation.lat - city.lat) < 0.01 && 
                Math.abs(mapState.startLocation.lng - city.lng) < 0.01;
              const isEnd = mapState.endLocation && 
                Math.abs(mapState.endLocation.lat - city.lat) < 0.01 && 
                Math.abs(mapState.endLocation.lng - city.lng) < 0.01;
              
              return (
                <button
                  key={index}
                  onClick={() => handleMockClick(city.lat, city.lng)}
                  disabled={isClicking}
                  className={`
                    ${city.color} border-2 rounded-xl p-4 hover:shadow-lg transition-all text-center disabled:opacity-50
                    ${isStart ? 'border-green-500 bg-green-200 shadow-lg' : ''}
                    ${isEnd ? 'border-red-500 bg-red-200 shadow-lg' : ''}
                    ${!isStart && !isEnd ? 'border-gray-300 hover:border-blue-400' : ''}
                  `}
                >
                  <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                    {isStart && <span className="text-2xl">🟢</span>}
                    {isEnd && <span className="text-2xl">🔴</span>}
                    {!isStart && !isEnd && <span className="text-xl">📍</span>}
                  </div>
                  <div className="text-sm font-medium text-gray-800">{city.name}</div>
                  {isStart && <div className="text-xs text-green-700 mt-1">START</div>}
                  {isEnd && <div className="text-xs text-red-700 mt-1">END</div>}
                </button>
              );
            })}
          </div>

          {/* Current Selection Status */}
          <div className="space-y-2">
            {mapState.startLocation && (
              <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg border border-green-200">
                <span className="w-4 h-4 text-green-600">🎯</span>
                <span className="text-sm text-green-800">
                  Start: {mapState.startLocation.name}
                </span>
              </div>
            )}
            
            {mapState.endLocation && (
              <div className="flex items-center space-x-2 p-2 bg-red-50 rounded-lg border border-red-200">
                <span className="w-4 h-4 text-red-600">🎯</span>
                <span className="text-sm text-red-800">
                  End: {mapState.endLocation.name}
                </span>
              </div>
            )}
          </div>

          {/* Route Summary */}
          {mapState.startLocation && mapState.endLocation && (
            <div className="mt-6 p-4 bg-white rounded-xl border-2 border-blue-200 shadow-lg">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center text-lg">
                <span className="w-6 h-6 mr-2">🚌</span>
                Route Summary
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2 bg-blue-50 p-2 rounded-lg">
                  <span className="w-5 h-5 text-blue-600">🧭</span>
                  <div>
                    <div className="font-semibold text-blue-800">{mapState.totalDistance.toFixed(1)} km</div>
                    <div className="text-xs text-blue-600">Distance</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 bg-green-50 p-2 rounded-lg">
                  <span className="w-5 h-5 text-green-600">⏱️</span>
                  <div>
                    <div className="font-semibold text-green-800">{mapState.estimatedDuration.toFixed(0)} min</div>
                    <div className="text-xs text-green-600">Duration</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 bg-purple-50 p-2 rounded-lg">
                  <span className="w-5 h-5 text-purple-600">📍</span>
                  <div>
                    <div className="font-semibold text-purple-800">{mapState.intermediateStops.length + 2}</div>
                    <div className="text-xs text-purple-600">Total Stops</div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                ✅ Auto-generated route with optimal stops • Ready to save
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-600">
              {mapState.isSelectingStart ? (
                <span className="text-green-600 font-medium">📍 Click a location to select START point</span>
              ) : (
                <span className="text-red-600 font-medium">📍 Click a location to select END point</span>
              )}
            </div>
          </div>
        </div>

        {/* Mock Route Line (if both points selected) */}
        {mapState.startLocation && mapState.endLocation && (
          <div className="absolute top-1/2 left-1/4 right-1/4 h-1 bg-blue-500 opacity-50 transform -translate-y-1/2 rounded-full" />
        )}
      </div>
    </div>
  );
};

export default SimpleMapRouteCreator;
