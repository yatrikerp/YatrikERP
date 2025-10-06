import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode.react';
import { apiFetch } from '../../utils/api';
import { Download, ArrowLeft, CheckCircle, Clock, MapPin, Bus, Navigation, Wifi, WifiOff, Share2, Mail } from 'lucide-react';

const PassengerTicket = () => {
  const { pnr: pnrParam } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const pnr = pnrParam || params.get('pnr');
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Live tracking state
  const [liveTracking, setLiveTracking] = useState({
    isActive: false,
    busLocation: null,
    eta: null,
    lastUpdate: null,
    connectionStatus: 'disconnected'
  });

  // Email sharing state
  const [emailShare, setEmailShare] = useState({
    isOpen: false,
    recipientEmail: '',
    message: '',
    isLoading: false
  });

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
          console.log('🎫 Customer data:', bookingData.customer);
          console.log('🎫 Customer name:', bookingData.customer?.name);
          
          const ticket = {
            pnr: pnr,
            bookingId: bookingData.bookingId,
            status: bookingData.status || 'confirmed',
            passengerName: bookingData.customer?.name || 'Guest Passenger',
            passengerEmail: bookingData.customer?.email || '',
            passengerPhone: bookingData.customer?.phone || '',
            passengerAge: bookingData.customer?.age || '',
            passengerGender: bookingData.customer?.gender || '',
            from: bookingData.journey?.from || bookingData.trip?.routeId?.startingPoint?.city || 'Kochi',
            to: bookingData.journey?.to || bookingData.trip?.routeId?.endingPoint?.city || 'Thiruvananthapuram',
            routeName: bookingData.trip?.routeId?.routeName || `${bookingData.journey?.from || 'Kochi'} to ${bookingData.journey?.to || 'Thiruvananthapuram'}`,
            departureDate: bookingData.journey?.departureDate || new Date().toISOString().split('T')[0],
            departureTime: bookingData.journey?.departureTime || '08:00',
            arrivalTime: bookingData.journey?.arrivalTime || '14:00',
            seatNumbers: bookingData.seats?.map(s => s.seatNumber).join(', ') || 'U1',
            amount: bookingData.pricing?.totalAmount || bookingData.pricing?.total || 450,
            boardingPoint: bookingData.journey?.boardingPoint || bookingData.trip?.routeId?.startingPoint?.location || 'Central Bus Stand',
            droppingPoint: bookingData.journey?.droppingPoint || bookingData.trip?.routeId?.endingPoint?.location || 'Central Bus Stand',
            busNumber: bookingData.bus?.busNumber || bookingData.trip?.busId?.busNumber || 'KL-07-AB-1234',
            busType: bookingData.bus?.busType || bookingData.trip?.busId?.busType || 'AC Sleeper',
            qrData: JSON.stringify({
              pnr: pnr,
              bookingId: bookingData.bookingId,
              passengerName: bookingData.customer?.name || 'Guest Passenger',
              from: bookingData.journey?.from || bookingData.trip?.routeId?.startingPoint?.city || 'Kochi',
              to: bookingData.journey?.to || bookingData.trip?.routeId?.endingPoint?.city || 'Thiruvananthapuram',
              routeName: bookingData.trip?.routeId?.routeName || `${bookingData.journey?.from || 'Kochi'} to ${bookingData.journey?.to || 'Thiruvananthapuram'}`,
              departureDate: bookingData.journey?.departureDate || new Date().toISOString().split('T')[0],
              departureTime: bookingData.journey?.departureTime || '08:00',
              seatNumbers: bookingData.seats?.map(s => s.seatNumber).join(', ') || 'U1',
              amount: bookingData.pricing?.totalAmount || bookingData.pricing?.total || 450
            })
          };
          setTicket(ticket);
        } else {
          // Fallback to mock data if API fails
          const mockTicket = {
            pnr: pnr,
            bookingId: `BK${Date.now().toString().slice(-8)}`,
            status: 'confirmed',
            passengerName: 'Rito Tensy',
            from: 'Kochi',
            to: 'Thiruvananthapuram',
            routeName: 'Kochi to Thiruvananthapuram',
            departureDate: new Date().toISOString().split('T')[0],
            departureTime: '08:00',
            arrivalTime: '14:00',
            seatNumbers: 'U1',
            amount: 450,
            boardingPoint: 'KSRTC Bus Station',
            droppingPoint: 'Central Bus Station',
            busNumber: 'KL-07-AB-1234',
            busType: 'AC Sleeper',
            qrData: JSON.stringify({
              pnr: pnr,
              bookingId: `BK${Date.now().toString().slice(-8)}`,
              passengerName: 'Rito Tensy',
              from: 'Kochi',
              to: 'Thiruvananthapuram',
              routeName: 'Kochi to Thiruvananthapuram',
              departureDate: new Date().toISOString().split('T')[0],
              departureTime: '08:00',
              seatNumbers: 'U1',
              amount: 450
            })
          };
          setTicket(mockTicket);
        }
      } catch (err) {
        console.error('Error loading ticket:', err);
        setError('Failed to load ticket details');
      } finally {
        setLoading(false);
      }
    }

    loadTicket();
  }, [pnr]);

  // Live tracking functions
  const startLiveTracking = async () => {
    if (!ticket?.busNumber) return;
    
    setLiveTracking(prev => ({ ...prev, isActive: true, connectionStatus: 'connecting' }));
    
    try {
      // Fetch initial bus location
      const response = await apiFetch(`/api/tracking/bus/${ticket.busNumber}`);
      if (response.ok) {
        setLiveTracking(prev => ({
          ...prev,
          busLocation: response.data.location,
          eta: response.data.eta,
          lastUpdate: new Date(),
          connectionStatus: 'connected'
        }));
      }
    } catch (error) {
      console.error('Failed to fetch bus location:', error);
      setLiveTracking(prev => ({ ...prev, connectionStatus: 'error' }));
    }
  };

  const stopLiveTracking = () => {
    setLiveTracking(prev => ({ ...prev, isActive: false, connectionStatus: 'disconnected' }));
  };

  // Auto-refresh tracking data every 30 seconds
  useEffect(() => {
    if (!liveTracking.isActive) return;

    const interval = setInterval(async () => {
      if (!ticket?.busNumber) return;
      
      try {
        const response = await apiFetch(`/api/tracking/bus/${ticket.busNumber}`);
        if (response.ok) {
          setLiveTracking(prev => ({
            ...prev,
            busLocation: response.data.location,
            eta: response.data.eta,
            lastUpdate: new Date(),
            connectionStatus: 'connected'
          }));
        }
      } catch (error) {
        console.error('Failed to update bus location:', error);
        setLiveTracking(prev => ({ ...prev, connectionStatus: 'error' }));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [liveTracking.isActive, ticket?.busNumber]);

  // Email sharing functions
  const openEmailShare = () => {
    setEmailShare(prev => ({
      ...prev,
      isOpen: true,
      message: `Hi! I'm currently on bus ${ticket?.busNumber} and wanted to share my live location with you. You can track my journey in real-time.`
    }));
  };

  const closeEmailShare = () => {
    setEmailShare(prev => ({
      ...prev,
      isOpen: false,
      recipientEmail: '',
      message: '',
      isLoading: false
    }));
  };

  const sendTrackingEmail = async () => {
    if (!emailShare.recipientEmail || !liveTracking.busLocation) return;

    setEmailShare(prev => ({ ...prev, isLoading: true }));

    try {
      const trackingData = {
        recipientEmail: emailShare.recipientEmail,
        passengerName: ticket?.passengerName || 'Passenger',
        busNumber: ticket?.busNumber,
        busType: ticket?.busType,
        route: `${ticket?.from} → ${ticket?.to}`,
        currentLocation: liveTracking.busLocation.address || liveTracking.busLocation.landmark,
        coordinates: liveTracking.busLocation.coordinates,
        eta: liveTracking.eta,
        tripProgress: liveTracking.trip?.progress || 0,
        message: emailShare.message,
        trackingUrl: `${window.location.origin}/passenger/ticket/${ticket?.pnr}`,
        mapUrl: `https://www.google.com/maps?q=${liveTracking.busLocation.coordinates?.lat},${liveTracking.busLocation.coordinates?.lng}`
      };

      const response = await apiFetch('/api/tracking/share-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(trackingData)
      });

      if (response.ok) {
        alert('Live tracking location shared successfully!');
        closeEmailShare();
      } else {
        alert('Failed to send tracking email. Please try again.');
      }
    } catch (error) {
      console.error('Error sending tracking email:', error);
      alert('Failed to send tracking email. Please check your connection.');
    } finally {
      setEmailShare(prev => ({ ...prev, isLoading: false }));
    }
  };

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
Age: ${ticket?.passengerAge || 'N/A'}
Gender: ${ticket?.passengerGender || 'N/A'}
Email: ${ticket?.passengerEmail || 'N/A'}
Phone: ${ticket?.passengerPhone || 'N/A'}

JOURNEY DETAILS:
From: ${ticket?.from}
To: ${ticket?.to}
Date: ${ticket?.departureDate}
Departure: ${ticket?.departureTime}
Arrival: ${ticket?.arrivalTime}
Seats: ${ticket?.seatNumbers}

BOARDING/DROPPING:
Boarding: ${ticket?.boardingPoint}
Dropping: ${ticket?.droppingPoint}

BUS DETAILS:
Bus Number: ${ticket?.busNumber}
Bus Type: ${ticket?.busType}

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
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading ticket...</p>
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
            onClick={() => navigate('/passenger/dashboard')}
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
              onClick={() => navigate('/passenger/dashboard')}
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Compact Ticket Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Journey Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Compact Header */}
              <div className="bg-gradient-to-r from-pink-600 to-pink-700 text-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold">YATRIK ERP</h1>
                    <p className="text-pink-100 text-sm">Bus Ticket</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-pink-100">PNR</p>
                    <p className="text-lg font-bold">{ticket.pnr}</p>
                  </div>
                </div>
              </div>

              {/* Journey Route */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">From</div>
                    <div className="font-semibold text-gray-900">{ticket.from}</div>
                    <div className="text-xs text-gray-500">{ticket.departureTime}</div>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="flex items-center justify-center">
                      <div className="w-full h-px bg-gray-300"></div>
                      <Bus className="w-4 h-4 text-gray-400 mx-2" />
                      <div className="w-full h-px bg-gray-300"></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">To</div>
                    <div className="font-semibold text-gray-900">{ticket.to}</div>
                    <div className="text-xs text-gray-500">{ticket.arrivalTime}</div>
                  </div>
                </div>
                <div className="text-center mt-3">
                  <div className="text-sm text-gray-600">{new Date(ticket.departureDate).toLocaleDateString('en-IN', { 
                    weekday: 'short', 
                    day: 'numeric', 
                    month: 'short',
                    year: 'numeric'
                  })}</div>
                  {ticket.routeName && (
                    <div className="text-xs text-gray-500 mt-1">{ticket.routeName}</div>
                  )}
                </div>
              </div>

              {/* Compact Details Grid */}
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-500">Passenger</div>
                      <div className="font-medium text-gray-900">{ticket.passengerName}</div>
                      {ticket.passengerAge && (
                        <div className="text-xs text-gray-500">Age: {ticket.passengerAge}</div>
                      )}
                      {ticket.passengerGender && (
                        <div className="text-xs text-gray-500 capitalize">Gender: {ticket.passengerGender}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Seats</div>
                      <div className="font-medium text-gray-900">{ticket.seatNumbers}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Booking ID</div>
                      <div className="font-medium text-gray-900 text-sm">{ticket.bookingId}</div>
                    </div>
                    {ticket.passengerEmail && (
                      <div>
                        <div className="text-xs text-gray-500">Email</div>
                        <div className="font-medium text-gray-900 text-sm">{ticket.passengerEmail}</div>
                      </div>
                    )}
                    {ticket.passengerPhone && (
                      <div>
                        <div className="text-xs text-gray-500">Phone</div>
                        <div className="font-medium text-gray-900 text-sm">{ticket.passengerPhone}</div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-500">Bus</div>
                      <div className="font-medium text-gray-900">{ticket.busNumber}</div>
                      <div className="text-xs text-gray-500">{ticket.busType}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Amount</div>
                      <div className="font-semibold text-pink-600 text-lg">₹{ticket.amount}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Status</div>
                      <div className="font-medium text-green-600">Confirmed</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center mb-4">
                <h3 className="font-semibold text-gray-900 mb-1">QR Code</h3>
                <p className="text-sm text-gray-600">Present at boarding</p>
              </div>
              
              <div className="flex justify-center mb-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-gray-200">
                  <QRCode 
                    value={ticket.qrData} 
                    size={160} 
                    includeMargin={true}
                    level="M"
                  />
                </div>
              </div>

              <div className="text-center mb-4">
                <p className="text-xs text-gray-500 mb-2">Valid for this journey only</p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Boarding 30 min before</span>
                </div>
              </div>

              <button
                onClick={downloadTicket}
                className="w-full flex items-center justify-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Download Ticket
              </button>
            </div>

            {/* Live Bus Tracking Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-blue-600" />
                  Live Bus Tracking
                </h3>
                <div className="flex items-center gap-2">
                  {liveTracking.connectionStatus === 'connected' && <Wifi className="w-4 h-4 text-green-600" />}
                  {liveTracking.connectionStatus === 'error' && <WifiOff className="w-4 h-4 text-red-600" />}
                  {liveTracking.connectionStatus === 'connecting' && (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
              </div>

              {liveTracking.isActive ? (
                <div className="space-y-4">
                  {liveTracking.busLocation ? (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-900">Current Location</span>
                        <span className="text-xs text-blue-600">
                          {liveTracking.lastUpdate ? 
                            `Updated ${Math.floor((new Date() - liveTracking.lastUpdate) / 1000)}s ago` : 
                            'Just now'
                          }
                        </span>
                      </div>
                      <div className="text-sm text-blue-800 mb-3">
                        {liveTracking.busLocation.address || 'Near ' + liveTracking.busLocation.landmark || 'On Route'}
                      </div>
                      
                      {/* Google Maps Integration */}
                      <div className="mb-3">
                        <iframe
                          src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dgsWcQ&q=${liveTracking.busLocation.coordinates?.lat},${liveTracking.busLocation.coordinates?.lng}&zoom=15`}
                          width="100%"
                          height="150"
                          style={{ border: 0, borderRadius: '8px' }}
                          allowFullScreen=""
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title="Bus Location Map"
                        ></iframe>
                      </div>
                      
                      {liveTracking.eta && (
                        <div className="mt-2 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-700">
                            ETA: {liveTracking.eta.minutes} minutes ({liveTracking.eta.arrivalTime})
                          </span>
                        </div>
                      )}
                      
                      {liveTracking.trip && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <div className="text-xs text-blue-600 mb-1">Trip Progress</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-blue-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${liveTracking.trip.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-blue-700 font-medium">{liveTracking.trip.progress}%</span>
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            {liveTracking.trip.from} → {liveTracking.trip.to}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Fetching bus location...</p>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={openEmailShare}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Share Location
                    </button>
                    <button 
                      onClick={stopLiveTracking}
                      className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Stop Tracking
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Bus className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Track your bus in real-time</p>
                    <p className="text-xs text-gray-500">Get live location updates and ETA</p>
                  </div>
                  
                  <button 
                    onClick={startLiveTracking}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    Start Live Tracking
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Boarding Points Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Boarding & Drop Points
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Boarding Point</div>
                  <div className="font-medium text-gray-900">{ticket.boardingPoint}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Drop Point</div>
                  <div className="font-medium text-gray-900">{ticket.droppingPoint}</div>
                </div>
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
            onClick={() => navigate('/passenger/dashboard')}
            className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate('/passenger/search')}
            className="flex-1 bg-pink-600 text-white py-3 px-6 rounded-lg hover:bg-pink-700 transition-colors"
          >
            Book Another Trip
          </button>
        </div>
      </div>

      {/* Email Sharing Modal */}
      {emailShare.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-600" />
                Share Live Location
              </h3>
              <button 
                onClick={closeEmailShare}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={emailShare.recipientEmail}
                  onChange={(e) => setEmailShare(prev => ({ ...prev, recipientEmail: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  value={emailShare.message}
                  onChange={(e) => setEmailShare(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Add a personal message..."
                />
              </div>

              {liveTracking.busLocation && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-blue-800">
                    <strong>Current Location:</strong> {liveTracking.busLocation.address || liveTracking.busLocation.landmark}
                  </div>
                  {liveTracking.eta && (
                    <div className="text-sm text-blue-700 mt-1">
                      <strong>ETA:</strong> {liveTracking.eta.minutes} minutes
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={closeEmailShare}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={sendTrackingEmail}
                  disabled={!emailShare.recipientEmail || emailShare.isLoading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                >
                  {emailShare.isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Send Location
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PassengerTicket;