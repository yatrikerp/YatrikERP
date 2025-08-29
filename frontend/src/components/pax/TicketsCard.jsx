import React from 'react';
import { Ticket, Clock, MapPin, Bus, Eye, Download, QrCode } from 'lucide-react';

const TicketsCard = ({ ticketsData, onViewTicket, onDownloadTicket, onShowQR }) => {
  const defaultTickets = [
    {
      id: 1,
      tripId: 'TRP001',
      route: 'Mumbai → Delhi',
      busNumber: 'KL-07-AB-1234',
      seatNo: '18',
      departureTime: '14:30',
      date: 'Dec 15, 2024',
      status: 'confirmed',
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    },
    {
      id: 2,
      tripId: 'TRP002',
      route: 'Delhi → Bangalore',
      busNumber: 'DL-01-CD-5678',
      seatNo: '22',
      departureTime: '09:15',
      date: 'Dec 20, 2024',
      status: 'upcoming',
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    },
    {
      id: 3,
      tripId: 'TRP003',
      route: 'Bangalore → Chennai',
      busNumber: 'BL-02-EF-9012',
      seatNo: '15',
      departureTime: '16:45',
      date: 'Dec 25, 2024',
      status: 'upcoming',
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    }
  ];

  const data = ticketsData || defaultTickets;
  const recentTickets = data.slice(0, 3);

  const getStatusConfig = (status) => {
    const configs = {
      confirmed: {
        color: 'bg-green-100 text-green-800',
        text: 'Confirmed'
      },
      upcoming: {
        color: 'bg-blue-100 text-blue-800',
        text: 'Upcoming'
      },
      completed: {
        color: 'bg-gray-100 text-gray-800',
        text: 'Completed'
      },
      cancelled: {
        color: 'bg-red-100 text-red-800',
        text: 'Cancelled'
      }
    };
    return configs[status] || configs.confirmed;
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100">
        <div className="p-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Ticket className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Tickets</h3>
          <p className="text-gray-500 text-sm mb-4">
            You haven't booked any trips yet
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-xl transition-all duration-200">
            Book Your First Trip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">My Tickets</h3>
              <p className="text-gray-500 text-sm">Recent bookings & tickets</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{data.length}</p>
            <p className="text-sm text-gray-500">Total</p>
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="space-y-4 mb-6">
          {recentTickets.map((ticket) => {
            const statusConfig = getStatusConfig(ticket.status);
            
            return (
              <div key={ticket.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:bg-gray-100 transition-colors duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-gray-500">#{ticket.tripId}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        {statusConfig.text}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{ticket.route}</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Bus className="w-4 h-4" />
                        <span>{ticket.busNumber}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{ticket.departureTime}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{ticket.date}</span>
                      <span className="text-gray-400">•</span>
                      <span>Seat {ticket.seatNo}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onViewTicket(ticket)}
                    className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-3 rounded-lg text-sm transition-colors duration-200 flex items-center justify-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => onShowQR(ticket)}
                    className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 font-medium py-2 px-3 rounded-lg text-sm transition-colors duration-200 flex items-center justify-center gap-1"
                  >
                    <QrCode className="w-4 h-4" />
                    QR
                  </button>
                  <button
                    onClick={() => onDownloadTicket(ticket)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-3 rounded-lg text-sm transition-colors duration-200 flex items-center justify-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Button */}
        {data.length > 3 && (
          <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all duration-200">
            View All {data.length} Tickets
          </button>
        )}
      </div>
    </div>
  );
};

export default TicketsCard;
