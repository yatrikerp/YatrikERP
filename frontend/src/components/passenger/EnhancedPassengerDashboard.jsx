import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Bus, 
  Wallet, 
  Ticket, 
  TrendingUp,
  Search,
  Calendar,
  Clock,
  MapPin,
  User,
  QrCode,
  Download,
  Eye
} from 'lucide-react';
import QuickSearch from '../../components/Common/QuickSearch';
import NotificationButton from '../../components/passenger/NotificationButton';
import useMobileDetection from '../../hooks/useMobileDetection';

const EnhancedPassengerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useMobileDetection();
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  
  // Default popular routes for instant display
  const defaultPopularRoutes = [
    { from: 'Kochi', to: 'Thiruvananthapuram', label: 'Kochi → Thiruvananthapuram', route: 'KL-01' },
    { from: 'Kozhikode', to: 'Kochi', label: 'Kozhikode → Kochi', route: 'KL-02' },
    { from: 'Thrissur', to: 'Kochi', label: 'Thrissur → Kochi', route: 'KL-03' },
    { from: 'Kochi', to: 'Kannur', label: 'Kochi → Kannur', route: 'KL-04' },
    { from: 'Palakkad', to: 'Kochi', label: 'Palakkad → Kochi', route: 'KL-05' },
    { from: 'Alappuzha', to: 'Thiruvananthapuram', label: 'Alappuzha → Thiruvananthapuram', route: 'KL-06' }
  ];
  
  const [popularRoutes, setPopularRoutes] = useState(defaultPopularRoutes);

  useEffect(() => {
    // Redirect mobile users to mobile dashboard
    if (isMobile && user) {
      console.log('🔄 Redirecting mobile user to mobile dashboard');
      navigate('/passenger/mobile', { replace: true });
      return;
    }
    
    fetchDashboardData();
    fetchPopularRoutes();
    // Live refresh every 60 seconds
    const interval = setInterval(() => {
      fetchPopularRoutes();
    }, 60000);
    return () => clearInterval(interval);
  }, [isMobile, user, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user's tickets/bookings
      const response = await fetch('/api/passenger/tickets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentTickets(data.tickets || []);
        
        // Filter upcoming trips (future dates)
        const upcoming = (data.tickets || []).filter(ticket => {
          const tripDate = new Date(ticket.tripDetails?.serviceDate);
          const now = new Date();
          return tripDate >= now && ticket.state === 'active';
        });
        setUpcomingTrips(upcoming);
      }
      
      // Fetch wallet balance
      const walletResponse = await fetch('/api/passenger/wallet', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (walletResponse.ok) {
        const walletData = await walletResponse.json();
        setWalletBalance(walletData.balance || 0);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularRoutes = async () => {
    try {
      const response = await fetch('/api/routes/popular');
      if (response.ok) {
        const data = await response.json();
        setPopularRoutes(data.routes || defaultPopularRoutes);
      }
    } catch (error) {
      console.error('Error fetching popular routes:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'validated': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setShowTicketModal(true);
  };

  const handleDownloadTicket = (ticket) => {
    // Create a printable ticket
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>YATRIK Ticket - ${ticket.pnr}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .ticket { border: 2px solid #E91E63; padding: 20px; border-radius: 10px; }
            .header { text-align: center; color: #E91E63; margin-bottom: 20px; }
            .qr-code { text-align: center; margin: 20px 0; }
            .details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .detail-item { margin: 5px 0; }
            .label { font-weight: bold; color: #666; }
            .value { color: #333; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <h1>🎫 YATRIK Bus Ticket</h1>
              <h2>PNR: ${ticket.pnr}</h2>
            </div>
            ${ticket.qrImage ? `
            <div class="qr-code">
              <img src="${ticket.qrImage}" alt="QR Code" style="width: 200px; height: 200px;">
              <p>Show this QR code to the conductor</p>
            </div>
            ` : ''}
            <div class="details">
              <div>
                <div class="detail-item">
                  <span class="label">Passenger:</span>
                  <span class="value">${ticket.passengerName}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Seat:</span>
                  <span class="value">${ticket.seatNumber}</span>
                </div>
                <div class="detail-item">
                  <span class="label">From:</span>
                  <span class="value">${ticket.boardingStop}</span>
                </div>
                <div class="detail-item">
                  <span class="label">To:</span>
                  <span class="value">${ticket.destinationStop}</span>
                </div>
              </div>
              <div>
                <div class="detail-item">
                  <span class="label">Date:</span>
                  <span class="value">${formatDate(ticket.tripDetails?.serviceDate)}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Departure:</span>
                  <span class="value">${formatTime(ticket.tripDetails?.startTime)}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Bus:</span>
                  <span class="value">${ticket.tripDetails?.busNumber || 'N/A'}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Fare:</span>
                  <span class="value">${formatCurrency(ticket.fareAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">YATRIK</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationButton />
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700">{user?.name || 'Passenger'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name || 'Passenger'}!
          </h2>
          <p className="text-gray-600">Manage your bookings and discover new routes</p>
        </div>

        {/* Quick Search */}
        <div className="mb-8">
          <QuickSearch />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Wallet Balance Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Wallet Balance</h3>
                <div className="text-3xl font-bold text-gray-900 mb-2">{formatCurrency(walletBalance)}</div>
                <button className="text-sm text-blue-600 hover:underline">Add Money →</button>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* My Tickets Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">My Tickets</h3>
                <div className="text-3xl font-bold text-gray-900 mb-2">{recentTickets.length}</div>
                <button 
                  onClick={() => navigate('/passenger/tickets')}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View All →
                </button>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                <Ticket className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Upcoming Trips Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Upcoming Trips</h3>
                <div className="text-3xl font-bold text-gray-900 mb-2">{upcomingTrips.length}</div>
                <button className="text-sm text-blue-600 hover:underline">Book New →</button>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Trips */}
        {upcomingTrips.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Upcoming Trips</h2>
                <p className="text-gray-600">Your confirmed bookings</p>
              </div>
              <button
                onClick={() => navigate('/passenger/tickets')}
                className="text-sm text-blue-600 hover:underline"
              >
                View All →
              </button>
            </div>
            
            <div className="space-y-4">
              {upcomingTrips.slice(0, 3).map((ticket) => (
                <div key={ticket._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Bus className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{ticket.boardingStop} → {ticket.destinationStop}</h3>
                      <p className="text-sm text-gray-600">Seat: {ticket.seatNumber}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(ticket.tripDetails?.serviceDate)} • {formatTime(ticket.tripDetails?.startTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{formatCurrency(ticket.fareAmount)}</div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(ticket.state)}`}>
                        {ticket.state}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleViewTicket(ticket)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="View Ticket"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadTicket(ticket)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Download Ticket"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Popular Routes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Popular Routes</h2>
              <p className="text-gray-600">Book your next journey</p>
            </div>
            <button
              onClick={() => navigate('/search')}
              className="text-sm text-blue-600 hover:underline"
            >
              Search All Routes →
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularRoutes.slice(0, 6).map((route, index) => (
              <button
                key={index}
                onClick={() => navigate(`/search?from=${route.from}&to=${route.to}`)}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{route.label}</h3>
                    <p className="text-sm text-gray-600">Route: {route.route}</p>
                  </div>
                  <Bus className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ticket Modal */}
      {showTicketModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  🎫
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Ticket Details</h3>
                  <p className="text-sm text-gray-500">PNR: {selectedTicket.pnr}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowTicketModal(false)}
                className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* QR Code */}
              {selectedTicket.qrImage && (
                <div className="text-center">
                  <img 
                    src={selectedTicket.qrImage} 
                    alt="QR Code" 
                    className="w-48 h-48 mx-auto border-2 border-pink-200 rounded-lg"
                  />
                  <p className="text-sm text-gray-600 mt-2">Show this QR code to the conductor</p>
                </div>
              )}
              
              {/* Ticket Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Journey Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">From:</span>
                      <span className="font-medium">{selectedTicket.boardingStop}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">To:</span>
                      <span className="font-medium">{selectedTicket.destinationStop}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date:</span>
                      <span className="font-medium">{formatDate(selectedTicket.tripDetails?.serviceDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Departure:</span>
                      <span className="font-medium">{formatTime(selectedTicket.tripDetails?.startTime)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Passenger Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Name:</span>
                      <span className="font-medium">{selectedTicket.passengerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Seat:</span>
                      <span className="font-medium">{selectedTicket.seatNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Bus:</span>
                      <span className="font-medium">{selectedTicket.tripDetails?.busNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fare:</span>
                      <span className="font-medium text-pink-600">{formatCurrency(selectedTicket.fareAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Status */}
              <div className="text-center">
                <span className={`px-4 py-2 text-sm rounded-full ${getStatusColor(selectedTicket.state)}`}>
                  Status: {selectedTicket.state}
                </span>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-2">
              <button 
                onClick={() => setShowTicketModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button 
                onClick={() => handleDownloadTicket(selectedTicket)}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
              >
                Download Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPassengerDashboard;