import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Ticket, Calendar, MapPin, Clock, Users } from 'lucide-react';

const BookingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/login?next=/mobile/bookings');
      return;
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  // Mock bookings data - in real app, fetch from API
  const bookings = [
    {
      id: 'B001',
      route: { from: 'Kochi', to: 'Bangalore' },
      date: '2024-01-15',
      time: '08:30',
      busType: 'AC Sleeper',
      seats: ['A1', 'A2'],
      status: 'confirmed',
      amount: 850
    },
    {
      id: 'B002', 
      route: { from: 'Thiruvananthapuram', to: 'Chennai' },
      date: '2024-01-20',
      time: '22:00',
      busType: 'AC Semi-Sleeper',
      seats: ['B3'],
      status: 'confirmed',
      amount: 1200
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/mobile')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">My Bookings</h1>
            <p className="text-sm text-gray-600">Manage your bus bookings</p>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="p-4 space-y-4">
        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Yet</h3>
            <p className="text-gray-600 mb-4">Start your journey by booking a bus ticket</p>
            <button
              onClick={() => navigate('/mobile')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Book Now
            </button>
          </div>
        ) : (
          bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {booking.route.from} → {booking.route.to}
                  </h3>
                  <p className="text-sm text-gray-600">{booking.busType}</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  {booking.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(booking.date).toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  {booking.time}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  Seats: {booking.seats.join(', ')}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="font-semibold text-gray-900">₹{booking.amount}</span>
                <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BookingsPage;

