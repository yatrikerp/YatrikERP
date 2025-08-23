import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Bus, 
  Download, 
  Eye, 
  XCircle,
  AlertCircle,
  CheckCircle,
  Play
} from 'lucide-react';

const UpcomingTripsPanel = ({ trips = [] }) => {
  const [selectedTrip, setSelectedTrip] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Not Started': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'In Progress': return 'text-green-600 bg-green-50 border-green-200';
      case 'Completed': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'Cancelled': return 'text-red-600 bg-red-50 border-red-200';
      case 'Delayed': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Not Started': return <Clock className="w-4 h-4" />;
      case 'In Progress': return <Play className="w-4 h-4" />;
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
      case 'Cancelled': return <XCircle className="w-4 h-4" />;
      case 'Delayed': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleCancelTrip = (tripId) => {
    // TODO: Implement trip cancellation logic
    console.log('Cancelling trip:', tripId);
  };

  const handleDownloadTicket = (tripId) => {
    // TODO: Implement ticket download logic
    console.log('Downloading ticket for trip:', tripId);
  };

  const handleViewDetails = (trip) => {
    setSelectedTrip(trip);
  };

  if (trips.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">My Trips</h2>
          <p className="text-gray-600 mt-1">Manage your upcoming and past journeys</p>
        </div>
        <div className="p-8 text-center">
          <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No trips found</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Book Your First Trip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">My Trips</h2>
          <p className="text-gray-600 mt-1">Manage your upcoming and past journeys</p>
        </div>
      </div>

      {/* Trips List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Trips</h3>
          <p className="text-gray-600 mt-1">Your scheduled journeys</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {trips.map((trip) => (
              <div key={trip.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Trip Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">{trip.route}</h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(trip.status)}`}>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(trip.status)}
                          {trip.status}
                        </div>
                      </span>
                    </div>

                    {/* Trip Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Bus className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Bus Number</p>
                          <p className="font-medium text-gray-900">{trip.busNumber}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Date</p>
                          <p className="font-medium text-gray-900">
                            {new Date(trip.departure).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Departure</p>
                          <p className="font-medium text-gray-900">
                            {new Date(trip.departure).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Seat</p>
                          <p className="font-medium text-gray-900">{trip.seatNo}</p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Arrival:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {new Date(trip.arrival).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Bus Type:</span>
                        <span className="ml-2 font-medium text-gray-900">{trip.busType}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Fare:</span>
                        <span className="ml-2 font-medium text-gray-900">₹{trip.fare}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleViewDetails(trip)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => handleDownloadTicket(trip.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Download Ticket"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    
                    {trip.status === 'Not Started' && (
                      <button
                        onClick={() => handleCancelTrip(trip.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Cancel Trip"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trip Details Modal */}
      {selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Trip Details</h3>
              <button
                onClick={() => setSelectedTrip(null)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Route</p>
                  <p className="font-medium text-gray-900">{selectedTrip.route}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium text-gray-900">{selectedTrip.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bus Number</p>
                  <p className="font-medium text-gray-900">{selectedTrip.busNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Seat Number</p>
                  <p className="font-medium text-gray-900">{selectedTrip.seatNo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Departure</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedTrip.departure).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Arrival</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedTrip.arrival).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bus Type</p>
                  <p className="font-medium text-gray-900">{selectedTrip.busType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fare</p>
                  <p className="font-medium text-gray-900">₹{selectedTrip.fare}</p>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleDownloadTicket(selectedTrip.id)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Download Ticket
                </button>
                {selectedTrip.status === 'Not Started' && (
                  <button
                    onClick={() => handleCancelTrip(selectedTrip.id)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Cancel Trip
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingTripsPanel;
