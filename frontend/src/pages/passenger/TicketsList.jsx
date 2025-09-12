import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Ticket, 
  Calendar, 
  MapPin, 
  Clock, 
  Bus, 
  Download, 
  Eye,
  Search,
  Filter,
  ArrowRight
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

const TicketsList = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      // For now, we'll use mock data. In a real implementation, you would fetch from /api/passenger/tickets
      const mockTickets = [
        {
          id: '1',
          pnr: 'PNR12345678',
          bookingId: 'BK12345678',
          status: 'confirmed',
          trip: {
            from: 'Kochi',
            to: 'Thiruvananthapuram',
            date: '2024-01-15',
            departureTime: '08:00',
            arrivalTime: '12:00',
            duration: '4h 00m',
            busType: 'Semi-Deluxe',
            busNumber: 'KL-01-AB-1234'
          },
          seats: ['U1', 'U2'],
          passengers: [
            { name: 'John Doe', age: 25, gender: 'Male' },
            { name: 'Jane Doe', age: 23, gender: 'Female' }
          ],
          fare: {
            baseFare: 450,
            totalAmount: 900,
            paidAmount: 900
          },
          bookingDate: '2024-01-10',
          boardingPoint: 'Kochi Central Bus Stand',
          droppingPoint: 'Thiruvananthapuram Central Bus Stand'
        },
        {
          id: '2',
          pnr: 'PNR87654321',
          bookingId: 'BK87654321',
          status: 'completed',
          trip: {
            from: 'Kozhikode',
            to: 'Kochi',
            date: '2024-01-05',
            departureTime: '14:00',
            arrivalTime: '18:30',
            duration: '4h 30m',
            busType: 'Deluxe',
            busNumber: 'KL-02-CD-5678'
          },
          seats: ['L1'],
          passengers: [
            { name: 'Alice Smith', age: 30, gender: 'Female' }
          ],
          fare: {
            baseFare: 600,
            totalAmount: 600,
            paidAmount: 600
          },
          bookingDate: '2024-01-01',
          boardingPoint: 'Kozhikode Central Bus Stand',
          droppingPoint: 'Kochi Central Bus Stand'
        },
        {
          id: '3',
          pnr: 'PNR11223344',
          bookingId: 'BK11223344',
          status: 'cancelled',
          trip: {
            from: 'Kollam',
            to: 'Kochi',
            date: '2024-01-12',
            departureTime: '10:00',
            arrivalTime: '13:00',
            duration: '3h 00m',
            busType: 'Ordinary',
            busNumber: 'KL-03-EF-9012'
          },
          seats: ['U5'],
          passengers: [
            { name: 'Bob Johnson', age: 28, gender: 'Male' }
          ],
          fare: {
            baseFare: 200,
            totalAmount: 200,
            paidAmount: 200,
            refundAmount: 180
          },
          bookingDate: '2024-01-08',
          boardingPoint: 'Kollam Central Bus Stand',
          droppingPoint: 'Kochi Central Bus Stand'
        }
      ];
      
      setTickets(mockTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filterStatus === 'all') return true;
    return ticket.status === filterStatus;
  });

  const handleViewTicket = (ticket) => {
    navigate(`/passenger/ticket/${ticket.pnr}`);
  };

  const handleDownloadTicket = (ticket) => {
    // In a real implementation, this would download the ticket PDF
    console.log('Downloading ticket:', ticket.pnr);
    alert(`Downloading ticket ${ticket.pnr}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-600 text-lg mb-4">{error}</div>
            <button
              onClick={() => navigate('/passenger/dashboard')}
              className="bg-pink-600 text-white px-6 py-2 rounded-lg"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Tickets</h1>
          <p className="text-gray-600">View and manage your bus tickets</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filter by status:</span>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'pending', label: 'Pending' }
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setFilterStatus(filter.value)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filterStatus === filter.value
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tickets List */}
        {filteredTickets.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
            <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-600 mb-6">
              {filterStatus === 'all' 
                ? "You haven't booked any tickets yet." 
                : `No ${filterStatus} tickets found.`
              }
            </p>
            <button
              onClick={() => navigate('/passenger/search')}
              className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors"
            >
              Book Your First Ticket
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                      <Ticket className="w-6 h-6 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">PNR: {ticket.pnr}</h3>
                      <p className="text-sm text-gray-600">Booking ID: {ticket.bookingId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewTicket(ticket)}
                        className="p-2 text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                        title="View Ticket"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadTicket(ticket)}
                        className="p-2 text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                        title="Download Ticket"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {ticket.trip.from} → {ticket.trip.to}
                      </p>
                      <p className="text-xs text-gray-600">{ticket.trip.busType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(ticket.trip.date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-600">{ticket.trip.departureTime} - {ticket.trip.arrivalTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bus className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {ticket.trip.busNumber}
                      </p>
                      <p className="text-xs text-gray-600">Seats: {ticket.seats.join(', ')}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-600">
                    <p>Booked on: {new Date(ticket.bookingDate).toLocaleDateString()}</p>
                    <p>Passengers: {ticket.passengers.length}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">₹{ticket.fare.totalAmount}</p>
                    {ticket.fare.refundAmount > 0 && (
                      <p className="text-sm text-green-600">Refund: ₹{ticket.fare.refundAmount}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketsList;


