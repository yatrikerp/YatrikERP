import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, MapPin, Clock, Users, DollarSign, CheckCircle,
  AlertCircle, Navigation, Phone, User, Route, Bus,
  Star, Award, TrendingUp, Activity, Ticket, Scan, Snowflake
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

const ConductorDashboard = () => {
  const [conductorData, setConductorData] = useState(null);
  const [todayTrips, setTodayTrips] = useState([]);
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [completedTrips, setCompletedTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayTrips: 0,
    completedTrips: 0,
    ticketsSold: 0,
    totalRevenue: 0,
    rating: 4.7,
    passengersServed: 0
  });

  useEffect(() => {
    fetchConductorData();
    fetchTrips();
  }, []);

  const fetchConductorData = async () => {
    try {
      const response = await apiFetch('/api/conductor/profile');
      if (response.success) {
        setConductorData(response.data);
      }
    } catch (error) {
      console.error('Error fetching conductor data:', error);
    }
  };

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const token = localStorage.getItem('token');
      
      // Get current user ID from token or context
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const conductorId = user._id || user.id;

      if (!conductorId) {
        console.error('Conductor ID not found');
        return;
      }

      // Fetch today's trips
      const todayResponse = await fetch(`/api/trips/conductor/${conductorId}?date=${today}&status=scheduled,running`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (todayResponse.ok) {
        const todayData = await todayResponse.json();
        if (todayData.success) {
          setTodayTrips(todayData.data.trips || []);
        }
      }

      // Fetch upcoming trips
      const upcomingResponse = await fetch(`/api/trips/conductor/${conductorId}?status=scheduled`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (upcomingResponse.ok) {
        const upcomingData = await upcomingResponse.json();
        if (upcomingData.success) {
          setUpcomingTrips(upcomingData.data.trips || []);
        }
      }

      // Fetch completed trips for stats
      const completedResponse = await fetch(`/api/trips/conductor/${conductorId}?status=completed`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (completedResponse.ok) {
        const completedData = await completedResponse.json();
        if (completedData.success) {
          setCompletedTrips(completedData.data.trips || []);
          calculateStats(completedData.data.trips || []);
        }
      }

    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (trips) => {
    const totalRevenue = trips.reduce((sum, trip) => sum + (trip.fare * (trip.bookedSeats || 0)), 0);
    const totalTickets = trips.reduce((sum, trip) => sum + (trip.bookedSeats || 0), 0);
    const totalPassengers = trips.reduce((sum, trip) => sum + (trip.bookedSeats || 0), 0);

    setStats(prev => ({
      ...prev,
      completedTrips: trips.length,
      ticketsSold: totalTickets,
      totalRevenue,
      passengersServed: totalPassengers
    }));
  };

  const getTripStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'running': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <User className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {conductorData?.name || 'Conductor'}
                </h1>
                <p className="text-gray-600">Here's your schedule and performance overview</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="flex items-center space-x-1">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <span className="font-semibold">{stats.rating}</span>
                </div>
                <p className="text-sm text-gray-600">Conductor Rating</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Trips</p>
                <p className="text-2xl font-bold text-gray-900">{todayTrips.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tickets Sold</p>
                <p className="text-2xl font-bold text-green-600">{stats.ticketsSold}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Ticket className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-600">₹{stats.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Passengers Served</p>
                <p className="text-2xl font-bold text-orange-600">{stats.passengersServed}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Today's Schedule
            </h3>

            {todayTrips.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No trips scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayTrips.map((trip, index) => (
                  <motion.div
                    key={trip._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTripStatusColor(trip.status)}`}>
                        {trip.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        Trip #{trip._id?.slice(-6)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Route className="w-4 h-4 mr-2" />
                        <span className="font-medium">{trip.route?.routeNumber || 'N/A'}</span>
                        <span className="mx-2">•</span>
                        <span>{trip.route?.routeName || 'Unknown Route'}</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{formatTime(trip.startTime)} - {formatTime(trip.endTime)}</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <Bus className="w-4 h-4 mr-2" />
                        <span>{trip.bus?.busNumber || 'N/A'}</span>
                        <span className="mx-2">•</span>
                        <span>{trip.bus?.capacity?.total || 0} seats</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{trip.bookedSeats || 0}/{trip.capacity} booked</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>Fare: ₹{trip.fare}</span>
                      </div>
                    </div>

                    {trip.status === 'running' && (
                      <div className="mt-3 flex space-x-2">
                        <button className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center">
                          <Scan className="w-4 h-4 mr-1" />
                          Scan Ticket
                        </button>
                        <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                          View Passengers
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Trips */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-purple-600" />
              Upcoming Trips
            </h3>

            {upcomingTrips.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No upcoming trips scheduled</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingTrips.slice(0, 5).map((trip, index) => (
                  <div key={trip._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(trip.serviceDate)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTripStatusColor(trip.status)}`}>
                        {trip.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Route className="w-4 h-4 mr-2" />
                        <span>{trip.route?.routeNumber} - {trip.route?.routeName}</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{formatTime(trip.startTime)} - {formatTime(trip.endTime)}</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{trip.route?.startingPoint?.city} → {trip.route?.endingPoint?.city}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
            Performance Metrics
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Ticket className="w-6 h-6 text-blue-600 mr-2" />
                <span className="text-2xl font-bold text-gray-900">{stats.ticketsSold}</span>
              </div>
              <p className="text-sm text-gray-600">Tickets Sold</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="w-6 h-6 text-green-600 mr-2" />
                <span className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toFixed(0)}</span>
              </div>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-purple-600 mr-2" />
                <span className="text-2xl font-bold text-gray-900">{stats.passengersServed}</span>
              </div>
              <p className="text-sm text-gray-600">Passengers Served</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConductorDashboard;