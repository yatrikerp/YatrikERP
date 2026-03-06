import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  CreditCard,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import QRCode from 'qrcode.react';
import BlockchainTicketBadge from '../../components/BlockchainTicketBadge';

const TicketDetails = () => {
  const { pnr } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTicketDetails();
  }, [pnr]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/booking/pnr/${pnr}`);
      const data = await response.json();

      if (data.success) {
        setTicket(data.data);
      } else {
        setError(data.message || 'Failed to fetch ticket details');
      }
    } catch (err) {
      setError('Failed to fetch ticket details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bus Ticket',
          text: `My bus ticket - PNR: ${ticket.pnr}`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    } else {
      // Fallback: copy link
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Ticket Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/passenger/bookings')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View My Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Share2 size={18} />
              <span>Share</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download size={18} />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Ticket Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Status Banner */}
          <div className={`px-6 py-3 ${
            ticket.status === 'confirmed' ? 'bg-green-50 border-b border-green-200' :
            ticket.status === 'pending' ? 'bg-yellow-50 border-b border-yellow-200' :
            'bg-red-50 border-b border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className={
                  ticket.status === 'confirmed' ? 'text-green-600' :
                  ticket.status === 'pending' ? 'text-yellow-600' :
                  'text-red-600'
                } size={20} />
                <span className="font-semibold text-gray-800">
                  {ticket.status === 'confirmed' ? 'Booking Confirmed' :
                   ticket.status === 'pending' ? 'Payment Pending' :
                   'Booking Cancelled'}
                </span>
              </div>
              <span className="text-sm text-gray-600">PNR: {ticket.pnr}</span>
            </div>
          </div>

          <div className="p-6">
            {/* Blockchain Badge */}
            {ticket.blockchain && (
              <div className="mb-6">
                <BlockchainTicketBadge blockchain={ticket.blockchain} size="lg" />
              </div>
            )}

            {/* Journey Details */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Journey Details</h3>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="text-blue-600" size={20} />
                    <span className="text-2xl font-bold text-gray-800">{ticket.journey.from}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {ticket.journey.boardingPoint || 'Central Bus Stand'}
                  </div>
                </div>
                <div className="px-4">
                  <div className="w-24 h-0.5 bg-gray-300 relative">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                      <span className="text-xs text-gray-500">→</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 text-right">
                  <div className="flex items-center justify-end gap-2 mb-2">
                    <span className="text-2xl font-bold text-gray-800">{ticket.journey.to}</span>
                    <MapPin className="text-blue-600" size={20} />
                  </div>
                  <div className="text-sm text-gray-600">
                    {ticket.journey.droppingPoint || 'Central Bus Stand'}
                  </div>
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Calendar className="text-blue-600" size={24} />
                <div>
                  <div className="text-sm text-gray-600">Departure Date</div>
                  <div className="font-semibold text-gray-800">
                    {new Date(ticket.journey.departureDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Clock className="text-blue-600" size={24} />
                <div>
                  <div className="text-sm text-gray-600">Departure Time</div>
                  <div className="font-semibold text-gray-800">{ticket.journey.departureTime}</div>
                </div>
              </div>
            </div>

            {/* Passenger & Seat Details */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Passenger Details</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="text-gray-400" size={16} />
                    <span className="text-gray-800">{ticket.customer.name}</span>
                  </div>
                  <div className="text-sm text-gray-600">{ticket.customer.email}</div>
                  <div className="text-sm text-gray-600">{ticket.customer.phone}</div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Seat Details</h4>
                <div className="flex flex-wrap gap-2">
                  {ticket.seats.map((seat, index) => (
                    <div key={index} className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg font-semibold">
                      {seat.seatNumber}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bus Details */}
            {ticket.trip && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Bus Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Bus Number:</span>
                    <span className="ml-2 font-semibold text-gray-800">{ticket.trip.busNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Bus Type:</span>
                    <span className="ml-2 font-semibold text-gray-800">{ticket.trip.busType}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Route:</span>
                    <span className="ml-2 font-semibold text-gray-800">{ticket.trip.routeName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Route Number:</span>
                    <span className="ml-2 font-semibold text-gray-800">{ticket.trip.routeNumber}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Details */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Payment Details</h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="text-gray-400" size={20} />
                  <span className="text-gray-600">Total Amount</span>
                </div>
                <span className="text-2xl font-bold text-gray-800">
                  ₹{ticket.pricing.totalAmount || ticket.pricing.total}
                </span>
              </div>
              {ticket.payment && ticket.payment.paymentStatus === 'completed' && (
                <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle size={14} />
                  <span>Payment Completed</span>
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="border-t pt-6">
              <div className="text-center">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Ticket QR Code</h4>
                <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                  <QRCode
                    value={JSON.stringify({
                      pnr: ticket.pnr,
                      bookingId: ticket.bookingId,
                      tokenId: ticket.blockchain?.tokenId,
                      passengerName: ticket.customer.name,
                      from: ticket.journey.from,
                      to: ticket.journey.to,
                      date: ticket.journey.departureDate,
                      seats: ticket.seats.map(s => s.seatNumber).join(',')
                    })}
                    size={200}
                    level="H"
                  />
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  Show this QR code to the conductor for verification
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Important Notes:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Please arrive at the boarding point 15 minutes before departure</li>
            <li>• Carry a valid ID proof for verification</li>
            <li>• This ticket is non-transferable</li>
            {ticket.blockchain && (
              <li>• This ticket is secured on blockchain and cannot be duplicated</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;
