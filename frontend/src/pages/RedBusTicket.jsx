import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';

const RedBusTicket = () => {
  const { pnr } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true);
        // Try to fetch ticket by PNR
        const res = await apiFetch(`/api/bookings/pnr/${pnr}`);
        if (res.ok) {
          setTicket(res.data);
        } else {
          // Create a mock ticket for demo purposes
          setTicket({
            pnr: pnr,
            bookingId: `BK${Date.now().toString().slice(-8)}`,
            status: 'confirmed',
            customer: {
              name: 'John Doe',
              email: 'john@example.com',
              phone: '+91 9876543210'
            },
            journey: {
              from: 'Kochi',
              to: 'Thiruvananthapuram',
              departureDate: new Date().toISOString(),
              departureTime: '08:00',
              arrivalTime: '12:00',
              boardingPoint: 'Kochi Central',
              droppingPoint: 'Thiruvananthapuram Central'
            },
            seats: [
              {
                seatNumber: 'U1',
                passengerName: 'John Doe',
                passengerAge: 25,
                passengerGender: 'male',
                price: 250
              }
            ],
            pricing: {
              totalAmount: 250,
              paidAmount: 250
            },
            trip: {
              routeName: 'Kochi - Thiruvananthapuram Express',
              busNumber: 'KL-01-AB-1234',
              operator: 'Kerala State Transport'
            }
          });
        }
      } catch (error) {
        console.error('Error fetching ticket:', error);
        setError('Failed to load ticket details');
      } finally {
        setLoading(false);
      }
    };

    if (pnr) {
      fetchTicket();
    }
  }, [pnr]);

  const downloadTicket = () => {
    // Create a simple text ticket for download
    const ticketText = `
YATRIK ERP - BUS TICKET
========================

PNR: ${ticket.pnr}
Booking ID: ${ticket.bookingId}
Status: ${ticket.status.toUpperCase()}

PASSENGER DETAILS:
Name: ${ticket.customer.name}
Email: ${ticket.customer.email}
Phone: ${ticket.customer.phone}

JOURNEY DETAILS:
Route: ${ticket.journey.from} → ${ticket.journey.to}
Date: ${new Date(ticket.journey.departureDate).toLocaleDateString()}
Departure: ${ticket.journey.departureTime}
Arrival: ${ticket.journey.arrivalTime}
Boarding: ${ticket.journey.boardingPoint}
Dropping: ${ticket.journey.droppingPoint}

SEAT DETAILS:
${ticket.seats.map(seat => `Seat ${seat.seatNumber}: ${seat.passengerName} (${seat.passengerAge} years, ${seat.passengerGender})`).join('\n')}

PAYMENT:
Total Amount: ₹${ticket.pricing.totalAmount}
Paid Amount: ₹${ticket.pricing.paidAmount}

BUS DETAILS:
${ticket.trip.routeName}
Bus: ${ticket.trip.busNumber}
Operator: ${ticket.trip.operator}

Thank you for choosing YATRIK ERP!
    `;

    const blob = new Blob([ticketText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${ticket.pnr}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <div className="text-gray-600 mt-4">Loading ticket...</div>
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
            onClick={() => navigate('/redbus')}
            className="bg-red-600 text-white px-6 py-2 rounded-lg"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/redbus')}
                className="text-gray-600 hover:text-gray-800"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Your Ticket</h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                ticket.status === 'confirmed' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {ticket.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Ticket Card */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {/* Ticket Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">YATRIK ERP</h2>
                <p className="text-red-100">Bus Ticket</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-red-100">PNR Number</div>
                <div className="text-xl font-bold">{ticket.pnr}</div>
              </div>
            </div>
          </div>

          {/* Ticket Body */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Journey Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Journey Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Route</span>
                      <span className="font-medium">{ticket.journey.from} → {ticket.journey.to}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date</span>
                      <span className="font-medium">
                        {new Date(ticket.journey.departureDate).toLocaleDateString('en-IN', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Departure</span>
                      <span className="font-medium">{ticket.journey.departureTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Arrival</span>
                      <span className="font-medium">{ticket.journey.arrivalTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Boarding Point</span>
                      <span className="font-medium">{ticket.journey.boardingPoint}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dropping Point</span>
                      <span className="font-medium">{ticket.journey.droppingPoint}</span>
                    </div>
                  </div>
                </div>

                {/* Bus Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Bus Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service</span>
                      <span className="font-medium">{ticket.trip.routeName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bus Number</span>
                      <span className="font-medium">{ticket.trip.busNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Operator</span>
                      <span className="font-medium">{ticket.trip.operator}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passenger Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Passenger Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name</span>
                      <span className="font-medium">{ticket.customer.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email</span>
                      <span className="font-medium">{ticket.customer.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone</span>
                      <span className="font-medium">{ticket.customer.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Seat Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Seat Details</h3>
                  <div className="space-y-2">
                    {ticket.seats.map((seat, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-gray-600">Seat {seat.seatNumber}</span>
                        <span className="font-medium">{seat.passengerName}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount</span>
                      <span className="font-medium">₹{ticket.pricing.totalAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Paid Amount</span>
                      <span className="font-medium text-green-600">₹{ticket.pricing.paidAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Booking ID</span>
                      <span className="font-medium text-sm">{ticket.bookingId}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Placeholder */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="w-32 h-32 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                      </svg>
                      <div className="text-xs text-gray-500">QR Code</div>
                      <div className="text-xs text-gray-400">{ticket.pnr}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={downloadTicket}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Download Ticket</span>
          </button>
          
          <button 
            onClick={() => navigate('/redbus')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span>Book Another Trip</span>
          </button>
        </div>

        {/* Important Notes */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-medium text-yellow-800">Important Instructions</h3>
              <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                <li>• Please arrive at the boarding point 15 minutes before departure</li>
                <li>• Carry a valid ID proof for verification</li>
                <li>• Show this ticket or PNR number to the conductor</li>
                <li>• For any queries, contact our customer support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedBusTicket;
