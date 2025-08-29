import React from 'react';
import { Bus, Clock, MapPin, Calendar, Eye, X, Navigation, Ticket } from 'lucide-react';

const UpcomingTripsList = ({ tripsData, onViewTrip, onCancelTrip, onTrackTrip, onViewTicket }) => {
  const defaultTrips = [
    {
      id: 1,
      tripId: 'TRP001',
      route: 'Mumbai → Delhi',
      busNumber: 'KL-07-AB-1234',
      seatNo: '18',
      departureTime: '14:30',
      arrivalTime: '06:30',
      date: 'Dec 15, 2024',
      status: 'on-time',
      price: 1200,
      boardingPoint: 'Mumbai Central',
      destinationPoint: 'Delhi ISBT'
    },
    {
      id: 2,
      tripId: 'TRP002',
      route: 'Delhi → Bangalore',
      busNumber: 'DL-01-CD-5678',
      seatNo: '22',
      departureTime: '09:15',
      arrivalTime: '08:45',
      date: 'Dec 20, 2024',
      status: 'delayed',
      price: 1800,
      boardingPoint: 'Delhi ISBT',
      destinationPoint: 'Bangalore Majestic'
    },
    {
      id: 3,
      tripId: 'TRP003',
      route: 'Bangalore → Chennai',
      busNumber: 'BL-02-EF-9012',
      seatNo: '15',
      departureTime: '16:45',
      arrivalTime: '06:30',
      date: 'Dec 25, 2024',
      status: 'on-time',
      price: 950,
      boardingPoint: 'Bangalore Majestic',
      destinationPoint: 'Chennai Central'
    }
  ];

  const data = tripsData || defaultTrips;

  const getStatusConfig = (status) => {
    const configs = {
      'on-time': {
        color: 'bg-green-100 text-green-800',
        icon: '🟢',
        text: 'On Time'
      },
      'delayed': {
        color: 'bg-yellow-100 text-yellow-800',
        icon: '🟡',
        text: 'Delayed'
      },
      'cancelled': {
        color: 'bg-red-100 text-red-800',
        icon: '🔴',
        text: 'Cancelled'
      },
      'boarding': {
        color: 'bg-blue-100 text-blue-800',
        icon: '🔵',
        text: 'Boarding'
      }
    };
    return configs[status] || configs['on-time'];
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
        <div className="p-8 text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Bus className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            No Upcoming Trips
          </h3>
          <p className="text-gray-600 mb-6">
            You don't have any upcoming trips scheduled
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg">
            Search for Trips
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Upcoming Trips</h3>
              <p className="text-gray-500 text-sm">Your scheduled journeys</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{data.length}</p>
            <p className="text-sm text-gray-500">Trips</p>
          </div>
        </div>

        {/* Trips List */}
        <div className="space-y-4">
          {data.map((trip, index) => {
            const statusConfig = getStatusConfig(trip.status);
            
            return (
              <div key={trip.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:bg-gray-100 transition-all duration-200 hover:shadow-md">
                {/* Trip Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500">#{trip.tripId}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          {statusConfig.icon} {statusConfig.text}
                        </span>
                      </div>
                      <h4 className="font-bold text-lg text-gray-900">{trip.route}</h4>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">₹{trip.price}</p>
                    <p className="text-sm text-gray-500">Total Fare</p>
                  </div>
                </div>

                {/* Trip Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Bus className="w-4 h-4" />
                      <span className="font-medium">Bus:</span>
                      <span>{trip.busNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Ticket className="w-4 h-4" />
                      <span className="font-medium">Seat:</span>
                      <span className="font-semibold">{trip.seatNo}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">From:</span>
                      <span>{trip.boardingPoint}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">Departure:</span>
                      <span className="font-semibold">{trip.departureTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">Arrival:</span>
                      <span className="font-semibold">{trip.arrivalTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">To:</span>
                      <span>{trip.destinationPoint}</span>
                    </div>
                  </div>
                </div>

                {/* Date */}
                <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">Travel Date:</span>
                    <span className="font-semibold text-gray-900">{trip.date}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onViewTrip(trip)}
                    className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-3 rounded-lg text-sm transition-colors duration-200 flex items-center justify-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  <button
                    onClick={() => onViewTicket(trip)}
                    className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 font-medium py-2 px-3 rounded-lg text-sm transition-colors duration-200 flex items-center justify-center gap-1"
                  >
                    <Ticket className="w-4 h-4" />
                    View Ticket
                  </button>
                  <button
                    onClick={() => onTrackTrip(trip)}
                    className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium py-2 px-3 rounded-lg text-sm transition-colors duration-200 flex items-center justify-center gap-1"
                  >
                    <Navigation className="w-4 h-4" />
                    Track
                  </button>
                  <button
                    onClick={() => onCancelTrip(trip)}
                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-3 rounded-lg text-sm transition-colors duration-200 flex items-center justify-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UpcomingTripsList;
