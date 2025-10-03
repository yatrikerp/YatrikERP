import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Bus, Navigation } from 'lucide-react';

const TrackPage = () => {
  const navigate = useNavigate();
  const [trackingCode, setTrackingCode] = useState('');
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Mock tracking data - in real app, fetch from API
  const mockTrackingData = {
    busNumber: 'KL-01-AB-1234',
    route: 'Kochi → Bangalore',
    driver: 'Rajesh Kumar',
    driverPhone: '+91 98765 43210',
    currentLocation: 'Edappally',
    nextStop: 'Aluva',
    estimatedArrival: '15 min',
    status: 'on-time',
    lastUpdate: new Date().toLocaleTimeString()
  };

  const handleTrack = () => {
    if (!trackingCode.trim()) {
      alert('Please enter a tracking code');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setTrackingData(mockTrackingData);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/mobile')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Track Bus</h1>
            <p className="text-sm text-gray-600">Real-time bus tracking</p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Enter Tracking Code</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bus Number or Booking ID
              </label>
              <input
                type="text"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="Enter bus number or booking ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleTrack}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Tracking...</span>
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4" />
                  <span>Track Bus</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tracking Results */}
        {trackingData && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Live Tracking</h3>
            
            {/* Bus Info */}
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-3 mb-2">
                <Bus className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900">{trackingData.busNumber}</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  {trackingData.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">{trackingData.route}</p>
            </div>

            {/* Location Info */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Current Location</p>
                  <p className="text-sm text-gray-600">{trackingData.currentLocation}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Next Stop</p>
                  <p className="text-sm text-gray-600">{trackingData.nextStop}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">ETA to Next Stop</p>
                  <p className="text-sm text-gray-600">{trackingData.estimatedArrival}</p>
                </div>
              </div>
            </div>

            {/* Driver Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Driver Information</h4>
              <p className="text-sm text-gray-600">Name: {trackingData.driver}</p>
              <p className="text-sm text-gray-600">Phone: {trackingData.driverPhone}</p>
              <p className="text-xs text-gray-500 mt-2">
                Last updated: {trackingData.lastUpdate}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackPage;

