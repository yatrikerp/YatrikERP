import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { apiFetch } from '../../utils/apiFetch';
import './conductor.css';

const ConductorDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('duties');
  const [duties, setDuties] = useState([]);
  const [currentDuty, setCurrentDuty] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrScanner, setQrScanner] = useState(false);
  const [scannedData, setScannedData] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'conductor') {
      navigate('/login');
      return;
    }
    fetchDuties();
  }, [user, navigate]);

  const fetchDuties = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/conductor/duties');
      if (response.success) {
        setDuties(response.data);
        // Set current duty if any is active
        const activeDuty = response.data.find(duty => 
          duty.status === 'started' || duty.status === 'in_progress'
        );
        setCurrentDuty(activeDuty);
        if (activeDuty) {
          fetchPassengers(activeDuty._id);
        }
      }
    } catch (err) {
      setError('Failed to fetch duties');
      console.error('Error fetching duties:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPassengers = async (crewId) => {
    try {
      const response = await apiFetch(`/api/conductor/passengers/${crewId}`);
      if (response.success) {
        setPassengers(response.data);
      }
    } catch (err) {
      console.error('Error fetching passengers:', err);
    }
  };

  const startDuty = async (crewId) => {
    try {
      const response = await apiFetch(`/api/conductor/duty/start/${crewId}`, {
        method: 'POST'
      });
      if (response.success) {
        setCurrentDuty(response.data);
        fetchDuties(); // Refresh duties list
        fetchPassengers(crewId);
      }
    } catch (err) {
      console.error('Error starting duty:', err);
    }
  };

  const closeDuty = async (crewId) => {
    try {
      const dutyStats = {
        actualEndTime: new Date(),
        passengerCount: passengers.length,
        revenueCollected: passengers.reduce((sum, p) => sum + p.fareAmount, 0),
        fuelConsumed: 0,
        issues: [],
        notes: 'Duty closed normally'
      };

      const response = await apiFetch(`/api/conductor/duty/close/${crewId}`, {
        method: 'POST',
        body: JSON.stringify(dutyStats)
      });
      if (response.success) {
        setCurrentDuty(null);
        setPassengers([]);
        fetchDuties(); // Refresh duties list
      }
    } catch (err) {
      console.error('Error closing duty:', err);
    }
  };

  const validateTicket = async (qrPayload) => {
    if (!currentDuty) return;

    try {
      const response = await apiFetch('/api/conductor/ticket/validate', {
        method: 'POST',
        body: JSON.stringify({
          qrPayload,
          latitude: 0, // Get from GPS
          longitude: 0, // Get from GPS
          stopName: 'Current Location'
        }),
        query: { crewId: currentDuty._id }
      });

      if (response.success) {
        // Refresh passenger list
        fetchPassengers(currentDuty._id);
        setScannedData('');
        setQrScanner(false);
        // Show success message
        alert(`Ticket validated successfully for ${response.data.passengerName}`);
      }
    } catch (err) {
      console.error('Error validating ticket:', err);
      alert('Failed to validate ticket');
    }
  };

  const markSeatVacant = async (bookingId, reason) => {
    if (!currentDuty) return;

    try {
      const response = await apiFetch('/api/conductor/seat/vacant', {
        method: 'POST',
        body: JSON.stringify({ bookingId, reason }),
        query: { crewId: currentDuty._id }
      });

      if (response.success) {
        fetchPassengers(currentDuty._id);
        alert('Seat marked as vacant successfully');
      }
    } catch (err) {
      console.error('Error marking seat vacant:', err);
      alert('Failed to mark seat vacant');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDutyStatusColor = (status) => {
    switch (status) {
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'started':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading conductor dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <p className="text-gray-800 mb-4">{error}</p>
          <button 
            onClick={fetchDuties}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">YATRIK ERP</h1>
              <span className="text-gray-500">|</span>
              <span className="text-lg text-gray-700">Conductor Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Current Duty Status */}
      {currentDuty && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-blue-900">
                  Active Duty: {currentDuty.tripId?.routeId?.name || 'Route'}
                </h2>
                <p className="text-blue-700">
                  Bus: {currentDuty.busId?.busNumber} | 
                  Driver: {currentDuty.driverId?.name} |
                  Started: {formatTime(currentDuty.actualStartTime)}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setQrScanner(!qrScanner)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  {qrScanner ? 'Hide Scanner' : 'Scan Ticket'}
                </button>
                <button
                  onClick={() => closeDuty(currentDuty._id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Close Duty
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner */}
      {qrScanner && currentDuty && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Enter QR code or scan..."
                value={scannedData}
                onChange={(e) => setScannedData(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => validateTicket(scannedData)}
                disabled={!scannedData}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                Validate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('duties')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'duties'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Duties ({duties.length})
              </button>
              {currentDuty && (
                <button
                  onClick={() => setActiveTab('passengers')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'passengers'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Passengers ({passengers.length})
                </button>
              )}
            </nav>
          </div>

          <div className="p-6">
            {/* Duties Tab */}
            {activeTab === 'duties' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Assigned Duties</h3>
                {duties.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-6xl mb-4">📅</div>
                    <p className="text-gray-500">No duties assigned</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {duties.map((duty) => (
                      <div key={duty._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-medium text-gray-900">
                                {duty.tripId?.routeId?.name || 'Route'}
                              </h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDutyStatusColor(duty.status)}`}>
                                {duty.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Bus:</span> {duty.busId?.busNumber}
                              </div>
                              <div>
                                <span className="font-medium">Driver:</span> {duty.driverId?.name}
                              </div>
                              <div>
                                <span className="font-medium">Start:</span> {formatTime(duty.dutyStartTime)}
                              </div>
                              <div>
                                <span className="font-medium">End:</span> {formatTime(duty.dutyEndTime)}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {duty.status === 'assigned' && (
                              <button
                                onClick={() => startDuty(duty._id)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                              >
                                Start Duty
                              </button>
                            )}
                            {duty.status === 'started' && (
                              <button
                                onClick={() => setCurrentDuty(duty)}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                              >
                                Continue Duty
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Passengers Tab */}
            {activeTab === 'passengers' && currentDuty && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Passenger List</h3>
                {passengers.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-6xl mb-4">👥</div>
                    <p className="text-gray-500">No passengers booked for this trip</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {passengers.map((passenger) => (
                      <div key={passenger.bookingId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-medium text-gray-900">
                                {passenger.passengerName}
                              </h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                passenger.status === 'boarded' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {passenger.status.toUpperCase()}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Phone:</span> {passenger.phone}
                              </div>
                              <div>
                                <span className="font-medium">Seat:</span> {passenger.seatNumber}
                              </div>
                              <div>
                                <span className="font-medium">Fare:</span> ₹{passenger.fareAmount}
                              </div>
                              <div>
                                <span className="font-medium">Boarding:</span> {passenger.boardingStop}
                              </div>
                            </div>
                            {passenger.validatedAt && (
                              <div className="mt-2 text-xs text-gray-500">
                                Validated at: {formatTime(passenger.validatedAt)}
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            {passenger.status === 'booked' && (
                              <button
                                onClick={() => markSeatVacant(passenger.bookingId, 'No show')}
                                className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200"
                              >
                                Mark Vacant
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConductorDashboard;

