import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, Ticket, Bus, Wallet, Calendar, Clock, Plus } from 'lucide-react';

const PassengerDashboardSimple = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setUpcomingTrips([
      {
        id: 1,
        route: 'Kochi → Thiruvananthapuram',
        seatNo: '18A',
        date: 'Dec 15, 2024',
        departureTime: '14:30',
        status: 'confirmed',
        fare: 250
      },
      {
        id: 2,
        route: 'Kochi → Bangalore',
        seatNo: '12B',
        date: 'Dec 18, 2024',
        departureTime: '08:00',
        status: 'confirmed',
        fare: 450
      }
    ]);

    setRecentBookings([
      { id: 1, route: 'Kochi → Chennai', date: 'Dec 10, 2024', fare: 350, status: 'completed' },
      { id: 2, route: 'Kochi → Mumbai', date: 'Dec 5, 2024', fare: 800, status: 'completed' }
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Passenger Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back{user?.name ? `, ${user.name}` : ''}. What would you like to do?</p>
          </div>
          <button onClick={logout} className="px-3 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-100">Logout</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
          {[
            { id: 'search', title: 'Search Trips', icon: <Search className="w-5 h-5 text-gray-600" />, onClick: () => navigate('/pax/search') },
            { id: 'bookings', title: 'My Tickets', icon: <Ticket className="w-5 h-5 text-gray-600" />, onClick: () => navigate('/pax/ticket') },
            { id: 'wallet', title: 'Wallet', icon: <Wallet className="w-5 h-5 text-gray-600" />, onClick: () => navigate('/wallet') }
          ].map(action => (
            <button
              key={action.id}
              onClick={action.onClick}
              className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-3 hover:bg-gray-100"
            >
              <div className="flex items-center gap-2">
                {action.icon}
                <span className="text-sm font-medium text-gray-900">{action.title}</span>
              </div>
              <Plus className="w-4 h-4 text-gray-400" />
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="rounded-md border border-gray-200 bg-white">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Upcoming Trips</h2>
                <p className="text-sm text-gray-500">Your next journeys</p>
              </div>
              <button onClick={() => navigate('/pax/search')} className="text-sm text-blue-600 hover:underline">New booking</button>
            </div>
            <div className="p-4">
              {upcomingTrips.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No upcoming trips</div>
              ) : (
                <ul className="space-y-2">
                  {upcomingTrips.map(trip => (
                    <li key={trip.id} className="flex items-center justify-between rounded border border-gray-100 p-3">
                      <div className="flex items-center gap-3">
                        <Bus className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{trip.route}</p>
                          <div className="text-xs text-gray-500 flex gap-4">
                            <span className="inline-flex items-center gap-1"><Ticket className="w-3 h-3" /> Seat {trip.seatNo}</span>
                            <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> {trip.date}</span>
                            <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {trip.departureTime}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">₹{trip.fare}</div>
                        <div className="text-[11px] text-gray-500 capitalize">{trip.status}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-md border border-gray-200 bg-white">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
              <p className="text-sm text-gray-500">Latest bookings</p>
            </div>
            <div className="p-4">
              {recentBookings.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No recent activity</div>
              ) : (
                <ul className="space-y-2">
                  {recentBookings.map(booking => (
                    <li key={booking.id} className="flex items-center justify-between rounded border border-gray-100 p-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{booking.route}</p>
                        <p className="text-xs text-gray-500">{booking.date}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">₹{booking.fare}</div>
                        <div className="text-[11px] text-gray-500 capitalize">{booking.status}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-md border border-gray-200 bg-white">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">Quick Search</h2>
            <p className="text-sm text-gray-500">Find routes and destinations</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (searchQuery.trim()) navigate(`/pax/search?q=${encodeURIComponent(searchQuery)}`); }} className="p-4 flex gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search trips, routes, destinations..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button type="submit" className="px-4 py-2 border border-gray-300 text-gray-800 rounded-md hover:bg-gray-100">Search</button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default PassengerDashboardSimple;


