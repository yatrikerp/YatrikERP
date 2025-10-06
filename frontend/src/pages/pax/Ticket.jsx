import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode.react';
import { apiFetch } from '../../utils/api';
import { Download, ArrowLeft, CheckCircle, Clock, MapPin, User, CreditCard } from 'lucide-react';

const PaxTicket = () => {
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
        // Try backend ticket-by-PNR; fallback to booking PNR endpoint
        try {
          const resp = await apiFetch(`/api/booking/pnr/${encodeURIComponent(pnr)}`);
          if (resp?.success && resp?.data) {
            const b = resp.data;
            const qrPayload = {
              ver: 1,
              typ: 'YATRIK_TICKET',
              pnr: b.pnr || b.bookingId,
              bookingId: b.bookingId,
              seatNumbers: Array.isArray(b.seats) ? b.seats.map(s => s.seatNumber).join(', ') : (b.seatNumbers || ''),
              passengerName: b.customer?.name || 'Passenger',
              from: b.journey?.from,
              to: b.journey?.to,
              departureDate: b.journey?.departureDate,
              departureTime: b.journey?.departureTime
            };
            setTicket({
              pnr: b.pnr || b.bookingId,
              bookingId: b.bookingId,
              status: b.status,
              passengerName: b.customer?.name || 'Passenger',
              from: b.journey?.from,
              to: b.journey?.to,
              departureDate: b.journey?.departureDate,
              departureTime: b.journey?.departureTime,
              arrivalTime: b.journey?.arrivalTime,
              seatNumbers: Array.isArray(b.seats) ? b.seats.map(s => s.seatNumber).join(', ') : '',
              amount: b.pricing?.total || b.pricing?.totalAmount,
              // Note: this is unsigned QR shown to passenger; conductor app verifies signed QR from issued Ticket
              qrData: JSON.stringify(qrPayload)
            });
            return;
          }
        } catch (_) {}

        // Fallback mock
        setTicket({
          pnr,
          bookingId: `BK${Date.now().toString().slice(-8)}`,
          status: 'confirmed',
          passengerName: 'Guest Passenger',
          from: 'Mumbai',
          to: 'Pune',
          departureDate: new Date().toISOString().split('T')[0],
          departureTime: '08:00',
          arrivalTime: '12:00',
          seatNumbers: 'U1B, U2B',
          amount: 500,
          qrData: JSON.stringify({ pnr })
        });
      } catch (err) {
        console.error('Error loading ticket:', err);
        setError('Failed to load ticket details');
      } finally {
        setLoading(false);
      }
    }

    loadTicket();
  }, [pnr]);

  const downloadTicket = () => {
    // Create a simple text-based ticket for download
    const ticketText = `
YATRIK ERP - BUS TICKET
========================

PNR: ${ticket?.pnr}
Booking ID: ${ticket?.bookingId}
Status: ${ticket?.status?.toUpperCase()}

PASSENGER DETAILS:
Name: ${ticket?.passengerName}

JOURNEY DETAILS:
From: ${ticket?.from}
To: ${ticket?.to}
Date: ${ticket?.departureDate}
Departure: ${ticket?.departureTime}
Arrival: ${ticket?.arrivalTime}
Seats: ${ticket?.seatNumbers}

AMOUNT: ₹${ticket?.amount}

Please present this ticket at boarding.
    `.trim();

    const blob = new Blob([ticketText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${pnr}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">{error || 'Ticket not found'}</div>
          <button 
            onClick={() => navigate('/pax/dashboard')}
            className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate('/pax/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">Confirmed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Ticket Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Ticket Header */}
          <div className="bg-gradient-to-r from-pink-600 to-pink-700 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">YATRIK ERP</h1>
                <p className="text-pink-100">Bus Ticket</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-pink-100">PNR</p>
                <p className="text-xl font-bold">{ticket.pnr}</p>
              </div>
            </div>
          </div>

          {/* Ticket Body */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Journey Details */}
              <div className="space-y-6">
                {/* Route Information */}
                <div className="border rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Journey Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">From</span>
                      <span className="font-medium">{ticket.from}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">To</span>
                      <span className="font-medium">{ticket.to}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date</span>
                      <span className="font-medium">{new Date(ticket.departureDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Departure</span>
                      <span className="font-medium">{ticket.departureTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Arrival</span>
                      <span className="font-medium">{ticket.arrivalTime}</span>
                    </div>
                  </div>
                </div>

                {/* Passenger Information */}
                <div className="border rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Passenger Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name</span>
                      <span className="font-medium">{ticket.passengerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Seats</span>
                      <span className="font-medium">{ticket.seatNumbers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Booking ID</span>
                      <span className="font-medium text-sm">{ticket.bookingId}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="border rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount Paid</span>
                      <span className="font-medium text-lg">₹{ticket.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status</span>
                      <span className="font-medium text-green-600">Paid</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - QR Code */}
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">QR Code</h3>
                  <p className="text-sm text-gray-600 mb-4">Present this at boarding</p>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-gray-200">
                  <QRCode 
                    value={ticket.qrData} 
                    size={200} 
                    includeMargin={true}
                    level="M"
                  />
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-2">Valid for this journey only</p>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Boarding starts 30 minutes before departure</span>
                  </div>
                </div>

                <button
                  onClick={downloadTicket}
                  className="flex items-center gap-2 bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download Ticket
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3">Important Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Arrive at the boarding point at least 30 minutes before departure</li>
            <li>• Present this QR code to the conductor for validation</li>
            <li>• Keep your ticket safe throughout the journey</li>
            <li>• In case of any issues, contact our support team</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/pax/dashboard')}
            className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate('/pax/search')}
            className="flex-1 bg-pink-600 text-white py-3 px-6 rounded-lg hover:bg-pink-700 transition-colors"
          >
            Book Another Trip
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaxTicket;