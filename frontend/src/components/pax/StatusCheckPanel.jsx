import React, { useState } from 'react';
import { Search, Ticket, Calendar, MapPin, Clock, ExternalLink, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StatusCheckPanel = () => {
  const [pnr, setPnr] = useState('');
  const [ticketStatus, setTicketStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleStatusCheck = async () => {
    if (!pnr.trim()) return;
    
    setIsLoading(true);
    setError('');
    setTicketStatus(null);
    
    try {
      const response = await fetch(`/api/booking/status?pnr=${pnr.trim()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTicketStatus(data);
      } else {
        setError('PNR not found or access denied');
      }
    } catch (error) {
      console.error('Error checking status:', error);
      setError('Failed to check ticket status');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'initiated':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'issued':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'validated':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'expired':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'initiated':
        return 'bg-yellow-100 text-yellow-800';
      case 'issued':
        return 'bg-green-100 text-green-800';
      case 'validated':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case 'initiated':
        return 'Payment initiated, waiting for confirmation';
      case 'issued':
        return 'Ticket issued and ready for travel';
      case 'validated':
        return 'Ticket validated at boarding point';
      case 'expired':
        return 'Trip completed or ticket expired';
      default:
        return 'Unknown status';
    }
  };

  const handleOpenTicket = (pnr) => {
    navigate(`/pax/ticket/${pnr}`);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <Ticket className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Status Check</h2>
          <p className="text-gray-600">Check your ticket status and details</p>
        </div>
      </div>

      {/* PNR Search */}
      <div className="mb-6">
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={pnr}
              onChange={(e) => setPnr(e.target.value.toUpperCase())}
              placeholder="Enter PNR (e.g., YTK123456)"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            onClick={handleStatusCheck}
            disabled={isLoading || !pnr.trim()}
            className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Search className="w-5 h-5" />
            )}
            Check
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <XCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Ticket Status Display */}
      {ticketStatus && (
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Ticket Status</h3>
            <div className="flex items-center gap-2">
              {getStatusIcon(ticketStatus.status)}
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticketStatus.status)}`}>
                {ticketStatus.status.toUpperCase()}
              </span>
            </div>
          </div>
          
          <p className="text-gray-600 mb-6">{getStatusDescription(ticketStatus.status)}</p>
          
          <div className="grid gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Ticket className="w-5 h-5 text-blue-600" />
              <span className="font-mono font-semibold">{ticketStatus.pnr}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-green-600" />
              <span>{ticketStatus.trip?.from} → {ticketStatus.trip?.to}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span>{new Date(ticketStatus.trip?.startTime).toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-orange-600" />
              <span>{new Date(ticketStatus.trip?.startTime).toLocaleTimeString()}</span>
            </div>
          </div>
          
          {/* Trip Details */}
          {ticketStatus.trip && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Trip Details</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bus Type:</span>
                  <span className="font-medium">{ticketStatus.trip.busType || 'Standard'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{ticketStatus.trip.duration || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Boarding Point:</span>
                  <span className="font-medium">{ticketStatus.trip.boardingStop || 'Main Terminal'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fare:</span>
                  <span className="font-medium">₹{ticketStatus.fare || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            {ticketStatus.status === 'issued' && (
              <button
                onClick={() => handleOpenTicket(ticketStatus.pnr)}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-5 h-5" />
                Open Ticket
              </button>
            )}
            
            {ticketStatus.status === 'validated' && (
              <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 font-medium">Ticket Validated</p>
                <p className="text-green-600 text-sm">You can board the bus</p>
              </div>
            )}
            
            {ticketStatus.status === 'expired' && (
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <XCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-800 font-medium">Trip Completed</p>
                <p className="text-gray-600 text-sm">Thank you for traveling with us</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Need Help?</h4>
        <p className="text-sm text-blue-700 mb-3">
          If you have any issues with your ticket or need assistance, please contact our support team.
        </p>
        <button
          onClick={() => navigate('/pax#contact')}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium underline"
        >
          Contact Support
        </button>
      </div>
    </div>
  );
};

export default StatusCheckPanel;
