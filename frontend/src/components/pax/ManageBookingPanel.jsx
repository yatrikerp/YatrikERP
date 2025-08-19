import React, { useState, useEffect } from 'react';
import { Search, Ticket, Calendar, MapPin, Clock, XCircle, CheckCircle } from 'lucide-react';

const ManageBookingPanel = () => {
  const [searchType, setSearchType] = useState('pnr'); // 'pnr' or 'active'
  const [pnr, setPnr] = useState('');
  const [activeTickets, setActiveTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchType === 'active') {
      fetchActiveTickets();
    }
  }, [searchType]);

  const fetchActiveTickets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tickets/active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setActiveTickets(data.tickets || []);
      }
    } catch (error) {
      console.error('Error fetching active tickets:', error);
      setError('Failed to fetch active tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePNRSearch = async () => {
    if (!pnr.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/booking/status?pnr=${pnr.trim()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedTicket(data);
      } else {
        setError('PNR not found or access denied');
        setSelectedTicket(null);
      }
    } catch (error) {
      console.error('Error searching PNR:', error);
      setError('Failed to search PNR');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelTicket = async (pnr) => {
    if (!window.confirm('Are you sure you want to cancel this ticket?')) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/booking/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ pnr })
      });
      
      if (response.ok) {
        // Refresh active tickets and clear selection
        await fetchActiveTickets();
        setSelectedTicket(null);
        setPnr('');
        alert('Ticket cancelled successfully');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to cancel ticket');
      }
    } catch (error) {
      console.error('Error cancelling ticket:', error);
      setError('Failed to cancel ticket');
    } finally {
      setIsLoading(false);
    }
  };

  const isCancellable = (ticket) => {
    if (!ticket || ticket.status !== 'issued') return false;
    
    const tripStart = new Date(ticket.trip.startTime);
    const now = new Date();
    const hoursUntilTrip = (tripStart - now) / (1000 * 60 * 60);
    
    return hoursUntilTrip > 2; // Can cancel if more than 2 hours before trip
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Ticket className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Manage Booking</h2>
          <p className="text-gray-600">Search and manage your tickets</p>
        </div>
      </div>

      {/* Search Type Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => setSearchType('pnr')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            searchType === 'pnr'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Search by PNR
        </button>
        <button
          onClick={() => setSearchType('active')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            searchType === 'active'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Active Tickets
        </button>
      </div>

      {/* PNR Search */}
      {searchType === 'pnr' && (
        <div className="mb-6">
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={pnr}
                onChange={(e) => setPnr(e.target.value.toUpperCase())}
                placeholder="Enter PNR (e.g., YTK123456)"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              onClick={handlePNRSearch}
              disabled={isLoading || !pnr.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Search className="w-5 h-5" />
              )}
              Search
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <XCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Active Tickets List */}
      {searchType === 'active' && (
        <div className="mb-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading active tickets...</p>
            </div>
          ) : activeTickets.length > 0 ? (
            <div className="space-y-3">
              {activeTickets.map((ticket) => (
                <div
                  key={ticket.pnr}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-all cursor-pointer"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Ticket className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{ticket.pnr}</p>
                        <p className="text-sm text-gray-600">{ticket.trip.from} → {ticket.trip.to}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{ticket.status}</p>
                      <p className="text-xs text-gray-500">{new Date(ticket.trip.startTime).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Ticket className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No active tickets found</p>
            </div>
          )}
        </div>
      )}

      {/* Ticket Details */}
      {selectedTicket && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Ticket Details</h3>
            <button
              onClick={() => setSelectedTicket(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Ticket className="w-5 h-5 text-blue-600" />
              <span className="font-mono font-semibold">{selectedTicket.pnr}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-green-600" />
              <span>{selectedTicket.trip.from} → {selectedTicket.trip.to}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span>{new Date(selectedTicket.trip.startTime).toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-orange-600" />
              <span>{new Date(selectedTicket.trip.startTime).toLocaleTimeString()}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
            <span className="text-sm text-gray-600">Status:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              selectedTicket.status === 'issued' ? 'bg-green-100 text-green-800' :
              selectedTicket.status === 'validated' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {selectedTicket.status}
            </span>
          </div>
          
          {isCancellable(selectedTicket) ? (
            <button
              onClick={() => handleCancelTicket(selectedTicket.pnr)}
              disabled={isLoading}
              className="w-full bg-red-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              Cancel Ticket
            </button>
          ) : (
            <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                This ticket cannot be cancelled (less than 2 hours before departure)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageBookingPanel;
