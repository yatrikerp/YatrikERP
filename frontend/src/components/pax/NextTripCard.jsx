import React from 'react';
import { Bus, Clock, MapPin, QrCode, Navigation, Calendar } from 'lucide-react';

const NextTripCard = ({ nextTrip, onViewTicket, onTrackBus }) => {
  if (!nextTrip) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 text-center border border-blue-100">
        <div className="w-24 h-24 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
          <Bus className="w-12 h-12 text-blue-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          No Upcoming Trips
        </h3>
        <p className="text-gray-600 mb-6">
          Book your first trip to get started with your journey
        </p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg">
          Book Your First Trip
        </button>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      'on-time': { color: 'bg-green-100 text-green-800', icon: '🟢' },
      'delayed': { color: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
      'cancelled': { color: 'bg-red-100 text-red-800', icon: '🔴' },
      'boarding': { color: 'bg-blue-100 text-blue-800', icon: '🔵' }
    };

    const config = statusConfig[status] || statusConfig['on-time'];
    
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.icon} {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 text-white shadow-2xl transform hover:scale-105 transition-all duration-300">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold mb-2">Next Trip</h3>
          <p className="text-blue-100">Your upcoming journey</p>
        </div>
        {getStatusBadge(nextTrip.status)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-blue-100 text-sm">Bus Number</p>
              <p className="font-semibold text-lg">{nextTrip.busNumber || 'KL-07-AB-1234'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-blue-100 text-sm">Route</p>
              <p className="font-semibold text-lg">{nextTrip.route || 'Mumbai → Delhi'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-blue-100 text-sm">Departure</p>
              <p className="font-semibold text-lg">{nextTrip.departureTime || '14:30'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-blue-100 text-sm">Date</p>
              <p className="font-semibold text-lg">{nextTrip.date || 'Dec 15, 2024'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-center">
          <p className="text-blue-100 text-sm mb-1">Seat Number</p>
          <p className="text-3xl font-bold">{nextTrip.seatNo || '18'}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onViewTicket}
            className="bg-white/20 hover:bg-white/30 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-2 border border-white/30"
          >
            <QrCode className="w-5 h-5" />
            View Ticket
          </button>
          <button
            onClick={onTrackBus}
            className="bg-white text-blue-700 hover:bg-gray-100 font-semibold px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
          >
            <Navigation className="w-5 h-5" />
            Track Bus
          </button>
        </div>
      </div>
    </div>
  );
};

export default NextTripCard;


