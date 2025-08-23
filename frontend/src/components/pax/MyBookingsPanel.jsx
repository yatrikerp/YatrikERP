import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Bus, 
  Search, 
  Filter,
  Download,
  Eye,
  XCircle,
  CheckCircle,
  AlertCircle,
  Play,
  Star,
  MessageSquare
} from 'lucide-react';

const MyBookingsPanel = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  // Mock data for demonstration
  useEffect(() => {
    const mockBookings = [
      {
        id: 1,
        route: 'Kochi → Trivandrum',
        busNumber: 'KL-07-AB-1234',
        departure: '2025-08-20T08:00:00',
        arrival: '2025-08-20T14:00:00',
        seatNo: 'A12',
        status: 'Not Started',
        fare: 450,
        busType: 'AC Sleeper',
        driver: 'Ramesh Kumar',
        conductor: 'Suresh Menon',
        bookingDate: '2025-08-15T10:00:00',
        bookingId: 'BK001234',
        paymentStatus: 'Paid',
        refundStatus: null
      },
      {
        id: 2,
        route: 'Kochi → Bangalore',
        busNumber: 'KL-07-CD-5678',
        departure: '2025-08-22T20:00:00',
        arrival: '2025-08-23T08:00:00',
        seatNo: 'B15',
        status: 'Not Started',
        fare: 1200,
        busType: 'AC Multi-Axle',
        driver: 'Mohan Das',
        conductor: 'Krishna Iyer',
        bookingDate: '2025-08-16T14:00:00',
        bookingId: 'BK001235',
        paymentStatus: 'Paid',
        refundStatus: null
      },
      {
        id: 3,
        route: 'Kochi → Chennai',
        busNumber: 'KL-07-EF-9012',
        departure: '2025-08-19T06:00:00',
        arrival: '2025-08-19T18:00:00',
        seatNo: 'C08',
        status: 'Completed',
        fare: 800,
        busType: 'AC Sleeper',
        driver: 'Rajesh Kumar',
        conductor: 'Suresh Menon',
        bookingDate: '2025-08-10T09:00:00',
        bookingId: 'BK001230',
        paymentStatus: 'Paid',
        refundStatus: null
      },
      {
        id: 4,
        route: 'Bangalore → Kochi',
        busNumber: 'KA-01-GH-3456',
        departure: '2025-08-18T08:00:00',
        arrival: '2025-08-18T20:00:00',
        seatNo: 'A15',
        status: 'Cancelled',
        fare: 1200,
        busType: 'AC Multi-Axle',
        driver: 'Mohan Das',
        conductor: 'Krishna Iyer',
        bookingDate: '2025-08-12T11:00:00',
        bookingId: 'BK001231',
        paymentStatus: 'Refunded',
        refundStatus: 'Processed'
      }
    ];
    
    setBookings(mockBookings);
    setFilteredBookings(mockBookings);
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = bookings;
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.bookingId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredBookings(filtered);
  }, [bookings, statusFilter, searchTerm]);

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

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'text-green-600 bg-green-50';
      case 'Pending': return 'text-orange-600 bg-orange-50';
      case 'Failed': return 'text-red-600 bg-red-50';
      case 'Refunded': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleCancelBooking = (bookingId) => {
    // TODO: Implement booking cancellation logic
    console.log('Cancelling booking:', bookingId);
  };

  const handleDownloadTicket = (bookingId) => {
    // TODO: Implement ticket download logic
    console.log('Downloading ticket for booking:', bookingId);
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
  };

  const handleFeedback = (bookingId) => {
    // TODO: Implement feedback form
    console.log('Opening feedback form for booking:', bookingId);
  };

  const tabs = [
    { id: 'upcoming', label: 'Upcoming', count: bookings.filter(b => ['Not Started', 'In Progress'].includes(b.status)).length },
    { id: 'completed', label: 'Completed', count: bookings.filter(b => b.status === 'Completed').length },
    { id: 'cancelled', label: 'Cancelled', count: bookings.filter(b => b.status === 'Cancelled').length }
  ];

  const getFilteredBookingsByTab = () => {
    switch (activeTab) {
      case 'upcoming':
        return filteredBookings.filter(b => ['Not Started', 'In Progress'].includes(b.status));
      case 'completed':
        return filteredBookings.filter(b => b.status === 'Completed');
      case 'cancelled':
        return filteredBookings.filter(b => b.status === 'Cancelled');
      default:
        return filteredBookings;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">My Bookings</h2>
          <p className="text-gray-600 mt-1">Manage all your bus bookings</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Search & Filters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">All Status</option>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Delayed">Delayed</option>
              </select>
            </div>
            
            {/* Results Count */}
            <div className="flex items-center justify-end text-sm text-gray-600">
              {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex border-b border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span>{tab.label}</span>
                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">
                  {tab.count}
                </span>
              </div>
            </button>
          ))}
        </div>
        
        <div className="p-6">
          {getFilteredBookingsByTab().length > 0 ? (
            <div className="space-y-4">
              {getFilteredBookingsByTab().map((booking) => (
                <div key={booking.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Booking Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">{booking.route}</h4>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(booking.status)}
                            {booking.status}
                          </div>
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.paymentStatus)}`}>
                          {booking.paymentStatus}
                        </span>
                      </div>

                      {/* Booking Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Bus className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Bus Number</p>
                            <p className="font-medium text-gray-900">{booking.busNumber}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Date</p>
                            <p className="font-medium text-gray-900">
                              {new Date(booking.departure).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Departure</p>
                            <p className="font-medium text-gray-900">
                              {new Date(booking.departure).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Seat</p>
                            <p className="font-medium text-gray-900">{booking.seatNo}</p>
                          </div>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-gray-500">Booking ID:</span>
                          <span className="ml-2 font-medium text-gray-900">{booking.bookingId}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Fare:</span>
                          <span className="ml-2 font-medium text-gray-900">₹{booking.fare}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Bus Type:</span>
                          <span className="ml-2 font-medium text-gray-900">{booking.busType}</span>
                        </div>
                      </div>

                      {/* Staff Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Driver:</span>
                          <span className="ml-2 font-medium text-gray-900">{booking.driver}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Conductor:</span>
                          <span className="ml-2 font-medium text-gray-900">{booking.conductor}</span>
                        </div>
                      </div>

                      {/* Refund Status for Cancelled Bookings */}
                      {booking.status === 'Cancelled' && booking.refundStatus && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-blue-900">Refund Status:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              booking.refundStatus === 'Processed' ? 'bg-green-100 text-green-800' :
                              booking.refundStatus === 'Pending' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {booking.refundStatus}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleViewDetails(booking)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => handleDownloadTicket(booking.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Download Ticket"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      
                      {booking.status === 'Not Started' && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancel Booking"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      )}
                      
                      {booking.status === 'Completed' && (
                        <button
                          onClick={() => handleFeedback(booking.id)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Give Feedback"
                        >
                          <Star className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No {activeTab} bookings found</p>
              <p className="text-sm text-gray-400">
                {activeTab === 'upcoming' ? 'Book your next trip to see it here' :
                 activeTab === 'completed' ? 'Your completed trips will appear here' :
                 'Your cancelled trips will appear here'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Booking Details</h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Route</p>
                  <p className="font-medium text-gray-900">{selectedBooking.route}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium text-gray-900">{selectedBooking.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Booking ID</p>
                  <p className="font-medium text-gray-900">{selectedBooking.bookingId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Status</p>
                  <p className="font-medium text-gray-900">{selectedBooking.paymentStatus}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bus Number</p>
                  <p className="font-medium text-gray-900">{selectedBooking.busNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Seat Number</p>
                  <p className="font-medium text-gray-900">{selectedBooking.seatNo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Departure</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedBooking.departure).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Arrival</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedBooking.arrival).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bus Type</p>
                  <p className="font-medium text-gray-900">{selectedBooking.busType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fare</p>
                  <p className="font-medium text-gray-900">₹{selectedBooking.fare}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Driver</p>
                  <p className="font-medium text-gray-900">{selectedBooking.driver}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Conductor</p>
                  <p className="font-medium text-gray-900">{selectedBooking.conductor}</p>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleDownloadTicket(selectedBooking.id)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Download Ticket
                </button>
                {selectedBooking.status === 'Not Started' && (
                  <button
                    onClick={() => handleCancelBooking(selectedBooking.id)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Cancel Booking
                  </button>
                )}
                {selectedBooking.status === 'Completed' && (
                  <button
                    onClick={() => handleFeedback(selectedBooking.id)}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Give Feedback
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

export default MyBookingsPanel;
