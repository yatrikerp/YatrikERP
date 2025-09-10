import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import BusListing from '../../components/pax/BusListing';
import { ArrowLeft, Filter, SortAsc } from 'lucide-react';

const EnhancedResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTrip, setExpandedTrip] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState({});
  const [sortBy, setSortBy] = useState('departure');
  const [filterBy, setFilterBy] = useState('all');
  const fromCity = searchParams.get('fromCity') || '';
  const toCity = searchParams.get('toCity') || '';
  const date = searchParams.get('date') || '';
  
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(date);

  const loadTrips = useCallback(async (searchDate = date) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        from: fromCity,
        to: toCity,
        date: searchDate
      });

      console.log('🔍 Searching trips with params:', params.toString());
      console.log('🔍 Search details:', { fromCity, toCity, searchDate });
      
      let res = await apiFetch(`/api/trips/search?${params.toString()}`);
      console.log('🔍 API Response (relative):', res);

      let tripList = [];
      if (res?.ok) {
        tripList = res.data?.data?.trips || res.data?.trips || res.data?.items || res.data || [];
      }

      // Fallback: if no trips or failed, try absolute URL to bypass proxy issues
      if (!res?.ok || !Array.isArray(tripList) || tripList.length === 0) {
        try {
          const abs = await apiFetch(`http://localhost:5000/api/trips/search?${params.toString()}`);
          console.log('🔁 Fallback API Response (absolute):', abs);
          if (abs?.ok) {
            tripList = abs.data?.data?.trips || abs.data?.trips || abs.data?.items || abs.data || [];
          }
          res = abs;
        } catch (e) {
          console.error('❌ Fallback fetch error:', e);
        }
      }

      if (Array.isArray(tripList)) {
        console.log('✅ Found trips (final):', tripList.length);
        setTrips(tripList);
      } else {
        console.error('❌ Unexpected trips payload shape.');
        setTrips([]);
      }
    } catch (err) {
      console.error('❌ Search error:', err);
      setError('Failed to search trips. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fromCity, toCity, date]);

  // Generate available dates (next 7 days)
  useEffect(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        date: date.toISOString().split('T')[0],
        display: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        fullDisplay: date.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        })
      });
    }
    setAvailableDates(dates);
  }, []);

  useEffect(() => {
    loadTrips(selectedDate);
  }, [fromCity, toCity, selectedDate, loadTrips]);

  const handleViewSeats = (trip) => {
    setExpandedTrip(trip._id);
    setSelectedSeats(prev => ({
      ...prev,
      [trip._id]: prev[trip._id] || []
    }));
  };

  const handleCloseSeats = () => {
    setExpandedTrip(null);
  };

  const handleSeatSelect = (tripId, seatId) => {
    setSelectedSeats(prev => ({
      ...prev,
      [tripId]: [...(prev[tripId] || []), seatId]
    }));
  };

  const handleSeatDeselect = (tripId, seatId) => {
    setSelectedSeats(prev => ({
      ...prev,
      [tripId]: (prev[tripId] || []).filter(id => id !== seatId)
    }));
  };

  const handleBookNow = (trip, seats) => {
    console.log('🎫 Continue to board/drop for trip:', trip._id, 'seats:', seats);
    navigate(`/pax/board-drop/${trip._id}`, {
      state: { trip, selectedSeats: seats, fromCity, toCity, date: selectedDate }
    });
  };

  const handleDateSelect = (selectedDateValue) => {
    setSelectedDate(selectedDateValue);
  };

  const sortedAndFilteredTrips = trips
    .filter(trip => {
      if (filterBy === 'ac') {
        return trip.busType?.toLowerCase().includes('ac');
      } else if (filterBy === 'non_ac') {
        return !trip.busType?.toLowerCase().includes('ac');
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'departure':
          return new Date(`2000-01-01 ${a.startTime}`) - new Date(`2000-01-01 ${b.startTime}`);
        case 'arrival':
          return new Date(`2000-01-01 ${a.endTime}`) - new Date(`2000-01-01 ${b.endTime}`);
        case 'fare':
          return (a.fare || 0) - (b.fare || 0);
        case 'seats':
          return (b.availableSeats || 0) - (a.availableSeats || 0);
        default:
          return 0;
      }
    });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Searching for buses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Search Failed</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadTrips}
            className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
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
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/pax/dashboard')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">BUY TICKET</h1>
                <p className="text-sm text-gray-500">
                  {fromCity} → {toCity} • {formatDate(date)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {fromCity} → {toCity}
              </h2>
              <p className="text-gray-600">{formatDate(selectedDate)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Found</p>
              <p className="text-2xl font-bold text-pink-500">{trips.length}</p>
              <p className="text-sm text-gray-500">buses available</p>
            </div>
          </div>
        </div>

        {/* Date Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {availableDates.map((dateInfo, index) => (
              <button
                key={index}
                onClick={() => handleDateSelect(dateInfo.date)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  selectedDate === dateInfo.date
                    ? 'bg-pink-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {dateInfo.display}
              </button>
            ))}
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
            >
              <option value="all">All Buses</option>
              <option value="ac">AC Buses</option>
              <option value="non_ac">Non-AC Buses</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <SortAsc className="w-5 h-5 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
            >
              <option value="departure">Sort by Departure</option>
              <option value="arrival">Sort by Arrival</option>
              <option value="fare">Sort by Fare</option>
              <option value="seats">Sort by Available Seats</option>
            </select>
          </div>
        </div>

        {/* Results */}
        {trips.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🚌</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No buses found</h3>
            <p className="text-gray-600 mb-4">
              We couldn't find any buses for your selected route and date.
            </p>
            <button
              onClick={() => navigate('/pax/dashboard')}
              className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
            >
              Search Again
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedAndFilteredTrips.map((trip) => (
              <BusListing
                key={trip._id}
                trip={trip}
                isExpanded={expandedTrip === trip._id}
                selectedSeats={selectedSeats[trip._id] || []}
                onViewSeats={() => handleViewSeats(trip)}
                onCloseSeats={handleCloseSeats}
                onSeatSelect={(seatId) => handleSeatSelect(trip._id, seatId)}
                onSeatDeselect={(seatId) => handleSeatDeselect(trip._id, seatId)}
                onBookNow={(trip, seats) => handleBookNow(trip, seats)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedResults;
