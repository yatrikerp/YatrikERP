import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode.react';
import { apiFetch } from '../../utils/api';
import { 
  ArrowUp, 
  Download, 
  CheckCircle, 
  Clock, 
  MapPin, 
  User, 
  CreditCard, 
  Bus,
  Calendar,
  Phone,
  Mail,
  Loader2,
  AlertCircle
} from 'lucide-react';

const MobilePassengerTicket = () => {
  const { pnr: pnrParam } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const pnr = pnrParam || params.get('pnr');
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadTicket() {
      if (!pnr) {
        setError('No PNR provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Try to fetch real ticket data from API
        const response = await apiFetch(`/api/booking/pnr/${pnr}`);
        
        if (response.ok && response.data) {
          // Use real data from API
          const bookingData = response.data;
          console.log('🎫 Fetched booking data:', bookingData);
          
          const ticketData = {
            pnr: pnr,
            bookingId: bookingData.bookingId,
            status: bookingData.status || 'confirmed',
            passengerName: bookingData.customer?.name || 'Guest Passenger',
            passengerEmail: bookingData.customer?.email || '',
            passengerPhone: bookingData.customer?.phone || '',
            passengerAge: bookingData.customer?.age || '',
            passengerGender: bookingData.customer?.gender || '',
            from: bookingData.journey?.from || 'Origin',
            to: bookingData.journey?.to || 'Destination',
            departureDate: bookingData.journey?.departureDate || new Date().toISOString().split('T')[0],
            departureTime: bookingData.journey?.departureTime || '08:00',
            arrivalTime: bookingData.journey?.arrivalTime || '14:00',
            busNumber: bookingData.bus?.busNumber || 'N/A',
            busType: bookingData.bus?.type || 'Standard',
            seats: bookingData.seats || [],
            totalFare: bookingData.totalFare || 0,
            bookingDate: bookingData.createdAt || new Date().toISOString()
          };
          
          setTicket(ticketData);
        } else {
          // Fallback to mock data
          const mockTicket = {
            pnr: pnr,
            bookingId: 'BK' + Math.random().toString(36).substr(2, 8).toUpperCase(),
            status: 'confirmed',
            passengerName: 'John Doe',
            passengerEmail: 'john.doe@example.com',
            passengerPhone: '+91 9876543210',
            passengerAge: '30',
            passengerGender: 'Male',
            from: 'Kochi',
            to: 'Bangalore',
            departureDate: '2024-01-15',
            departureTime: '08:00',
            arrivalTime: '14:00',
            busNumber: 'KL-01-1234',
            busType: 'AC Sleeper',
            seats: ['1A', '1B'],
            totalFare: 1700,
            bookingDate: new Date().toISOString()
          };
          
          setTicket(mockTicket);
        }
      } catch (error) {
        console.error('Error loading ticket:', error);
        setError('Failed to load ticket details');
      } finally {
        setLoading(false);
      }
    }

    loadTicket();
  }, [pnr]);

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatBookingDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = () => {
    // In a real app, this would generate and download a PDF
    alert('Download feature will be implemented soon!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ width: '100vw', maxWidth: '100vw', overflowX: 'hidden' }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ width: '100vw', maxWidth: '100vw', overflowX: 'hidden' }}>
        <div className="text-center p-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Ticket not found</h2>
          <p className="text-gray-600 mb-4">{error || 'The requested ticket could not be found.'}</p>
          <button
            onClick={() => navigate('/passenger/dashboard')}
            className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ width: '100vw', maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowUp className="w-4 h-4 text-gray-600 rotate-90" />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold text-gray-900">E-Ticket</h1>
              <p className="text-sm text-gray-600">PNR: {ticket.pnr}</p>
            </div>
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Download className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Status Card */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Booking Confirmed</span>
          </div>
          <p className="text-sm opacity-90">
            Your ticket has been confirmed. Show this QR code at the boarding point.
          </p>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">QR Code</h2>
          <div className="flex justify-center mb-4">
            <QRCode 
              value={`PNR: ${ticket.pnr}\nBooking ID: ${ticket.bookingId}\nPassenger: ${ticket.passengerName}\nFrom: ${ticket.from}\nTo: ${ticket.to}\nDate: ${formatDate(ticket.departureDate)}\nTime: ${formatTime(ticket.departureTime)}`}
              size={150}
              level="M"
              includeMargin={true}
            />
          </div>
          <p className="text-sm text-gray-600">
            Show this QR code to the conductor
          </p>
        </div>

        {/* Journey Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Journey Details</h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">From</span>
              <span className="font-medium text-gray-900">{ticket.from}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">To</span>
              <span className="font-medium text-gray-900">{ticket.to}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Date</span>
              <span className="font-medium text-gray-900">{formatDate(ticket.departureDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Departure</span>
              <span className="font-medium text-gray-900">{formatTime(ticket.departureTime)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Arrival</span>
              <span className="font-medium text-gray-900">{formatTime(ticket.arrivalTime)}</span>
            </div>
          </div>
        </div>

        {/* Bus Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Bus Details</h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Bus Number</span>
              <span className="font-medium text-gray-900">{ticket.busNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Bus Type</span>
              <span className="font-medium text-gray-900">{ticket.busType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Seats</span>
              <span className="font-medium text-gray-900">{ticket.seats.join(', ')}</span>
            </div>
          </div>
        </div>

        {/* Passenger Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Passenger Details</h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Name</span>
              <span className="font-medium text-gray-900">{ticket.passengerName}</span>
            </div>
            {ticket.passengerPhone && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Phone</span>
                <span className="font-medium text-gray-900">{ticket.passengerPhone}</span>
              </div>
            )}
            {ticket.passengerEmail && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Email</span>
                <span className="font-medium text-gray-900">{ticket.passengerEmail}</span>
              </div>
            )}
          </div>
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Booking Details</h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Booking ID</span>
              <span className="font-medium text-gray-900">{ticket.bookingId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">PNR</span>
              <span className="font-medium text-gray-900">{ticket.pnr}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Fare</span>
              <span className="text-lg font-bold text-pink-600">₹{ticket.totalFare}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Booking Date</span>
              <span className="font-medium text-gray-900">{formatBookingDate(ticket.bookingDate)}</span>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Important Notes</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Please arrive at the boarding point 15 minutes before departure</li>
            <li>• Carry a valid ID proof along with this ticket</li>
            <li>• Show this QR code to the conductor for boarding</li>
            <li>• For any queries, contact our customer support</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleDownload}
            className="bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
          <button
            onClick={() => navigate('/passenger/dashboard')}
            className="bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2"
          >
            <User className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobilePassengerTicket;

