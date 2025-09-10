import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Users, Wifi, Snowflake, Droplets, Coffee, Utensils } from 'lucide-react';

const BusListing = ({ 
  trip, 
  onViewSeats, 
  onCloseSeats, 
  isExpanded = false, 
  selectedSeats = [], 
  onSeatSelect,
  onSeatDeselect,
  onBookNow 
}) => {
  const navigate = useNavigate();
  const [showSeatMap, setShowSeatMap] = useState(isExpanded);

  const handleToggleSeats = () => {
    if (showSeatMap) {
      setShowSeatMap(false);
      onCloseSeats?.();
    } else {
      setShowSeatMap(true);
      onViewSeats?.(trip);
    }
  };

  const formatTime = (time) => {
    if (!time) return '--:--';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getCoachTypeIcon = (busType) => {
    switch (busType?.toLowerCase()) {
      case 'ac':
      case 'ac_sleeper':
      case 'ac_seater':
        return <Snowflake className="w-4 h-4 text-blue-500" />;
      case 'non_ac':
      case 'non_ac_sleeper':
      case 'non_ac_seater':
        return <Droplets className="w-4 h-4 text-green-500" />;
      default:
        return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  const getCoachTypeText = (busType) => {
    switch (busType?.toLowerCase()) {
      case 'ac':
      case 'ac_sleeper':
      case 'ac_seater':
        return 'AC';
      case 'non_ac':
      case 'non_ac_sleeper':
      case 'non_ac_seater':
        return 'Non AC';
      default:
        return busType || 'Standard';
    }
  };

  // logical seat states (can be fed from API later)
  const bookedSet = new Set(trip?.bookedSeatNos || []);
  const femaleOnlySet = new Set(trip?.femaleOnlySeatNos || []);
  const maleOnlySet = new Set(trip?.maleOnlySeatNos || []);

  const renderSeat = (seatId, type) => {
    const isSelected = selectedSeats.includes(seatId);
    const isBooked = bookedSet.has(seatId);
    const isFemaleOnly = femaleOnlySet.has(seatId);
    const isMaleOnly = maleOnlySet.has(seatId);

    const base = 'w-9 h-14 rounded-md text-[10px] font-medium transition-all duration-200 flex items-center justify-center border';
    let className = base + ' ';
    // status coloring per provided legend
    if (isBooked) {
      className += ' bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed';
    } else if (isSelected) {
      className += type === 'sleeper' ? ' bg-green-700 text-white border-green-700' : ' bg-green-600 text-white border-green-600';
    } else if (isFemaleOnly) {
      className += ' bg-pink-50 text-pink-600 border-pink-400';
    } else if (isMaleOnly) {
      className += ' bg-blue-50 text-blue-600 border-blue-400';
    } else {
      className += type === 'sleeper' ? ' bg-white text-green-700 border-green-500' : ' bg-white text-green-700 border-green-500';
    }

    return (
      <button
        key={seatId}
        disabled={isBooked}
        onClick={() => (isSelected ? onSeatDeselect?.(seatId) : onSeatSelect?.(seatId))}
        className={className}
        title={seatId}
      >
        {seatId}
      </button>
    );
  };

  // two decks layout similar to reference
  const lowerDeckRows = ['L1','L2','L3','L4','L5','L6'];
  const upperDeckRows = ['U1','U2','U3','U4','U5','U6'];

  const buildDeck = (rows, type) => (
    <div className="bg-white rounded-2xl border border-gray-200 p-3">
      <div className="text-xs font-medium text-gray-600 mb-2 flex items-center justify-between">
        <span>{type === 'sleeper' ? 'Upper deck' : 'Lower deck'}</span>
        {type === 'seater' && <span className="text-gray-400">🛞</span>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {rows.map((r) => (
          <React.Fragment key={r}>
            {renderSeat(`${r}A`, type)}
            {renderSeat(`${r}B`, type)}
            {renderSeat(`${r}C`, type)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const calculateTotal = () => {
    return selectedSeats.length * (trip.fare || 0);
  };

  const formatINR = (value) => {
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));
    } catch {
      return `₹${Math.round(Number(value || 0))}`;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 mb-4">
      {/* Bus Service Header */}
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Bus Image Placeholder */}
          <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-gray-500 text-xs font-medium">IMAGE</span>
          </div>

          {/* Bus Details */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {trip.routeName || 'Bus Service'}
                </h3>
                <p className="text-sm text-gray-600">{trip.busNumber || 'Bus-001'}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  ₹{trip.fare || 0}
                </div>
                <div className="text-sm text-gray-500">per seat</div>
              </div>
            </div>

            {/* Journey Details */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {trip.fromCity || 'Departure'} ({formatTime(trip.startTime)})
                  </div>
                  <div className="text-xs text-gray-500">Departure</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {trip.toCity || 'Arrival'} ({formatTime(trip.endTime)})
                  </div>
                  <div className="text-xs text-gray-500">Arrival</div>
                </div>
              </div>
            </div>

            {/* Bus Features */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                {getCoachTypeIcon(trip.busType)}
                <span className="text-sm text-gray-700">
                  {getCoachTypeText(trip.busType)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {trip.availableSeats || 0}/{trip.capacity || 0} seats
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Wifi className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">WiFi</span>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-end">
              <button
                onClick={handleToggleSeats}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                  showSeatMap
                    ? 'bg-gray-500 hover:bg-gray-600 text-white'
                    : 'bg-pink-500 hover:bg-pink-600 text-white'
                }`}
              >
                {showSeatMap ? 'Close Seats' : 'View Seats'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Seat Selection Section */}
      {showSeatMap && (
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Seat Map */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-300 rounded flex items-center justify-center">
                  <span className="text-xs">🚌</span>
                </div>
                <span className="text-sm font-medium text-gray-700">Select your seats</span>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-md">
                {buildDeck(lowerDeckRows, 'seater')}
                {buildDeck(upperDeckRows, 'sleeper')}
              </div>

              {/* Legend */}
              <div className="mt-2 grid grid-cols-2 gap-3 text-xs text-gray-600">
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-white border border-green-500 inline-block rounded-sm"></span>Available</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-600 inline-block rounded-sm"></span>Selected (seater)</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-700 inline-block rounded-sm"></span>Selected (sleeper)</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-gray-300 inline-block rounded-sm"></span>Booked</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-100 inline-block rounded-sm"></span>Male only</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-pink-100 inline-block rounded-sm"></span>Female only</div>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h4>
              
              {/* Selected Seats Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <div className="grid grid-cols-4 gap-4 text-xs font-medium text-gray-600">
                    <div>Seat Type</div>
                    <div>Seat</div>
                    <div>Price</div>
                    <div>Action</div>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {selectedSeats.map((seatId) => (
                    <div key={seatId} className="px-4 py-2">
                      <div className="grid grid-cols-4 gap-4 items-center text-sm">
                        <div className="text-gray-700">Adult</div>
                        <div className="font-medium text-gray-900">{seatId}</div>
                        <div className="text-gray-700">₹{trip.fare || 0}</div>
                        <div>
                          <button
                            onClick={() => onSeatDeselect?.(seatId)}
                            className="text-red-500 hover:text-red-700"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subtotal */}
              <div className="mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ticket Sub total</span>
                  <span className="font-medium">₹{calculateTotal()}</span>
                </div>
              </div>

              {/* Extra Services */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Extra Services:</h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Welcome Drink</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50">-</button>
                      <span className="text-sm w-6 text-center">0</span>
                      <button className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50">+</button>
                      <span className="text-sm text-gray-700 ml-2">₹50</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Cap</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50">-</button>
                      <span className="text-sm w-6 text-center">0</span>
                      <button className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50">+</button>
                      <span className="text-sm text-gray-700 ml-2">₹70</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price + CTA (styled like reference) */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Left: seats count */}
                  <div className="text-sm text-gray-700">
                    {selectedSeats.length || 0} {selectedSeats.length === 1 ? 'seat' : 'seats'}
                  </div>

                  {/* Middle: price block */}
                  <div className="flex items-center gap-2">
                    {/* Optional strike-through MRP (10% higher) only when seats selected */}
                    {selectedSeats.length > 0 && (
                      <span className="text-gray-400 line-through text-sm">
                        {formatINR(calculateTotal() * 1.125)}
                      </span>
                    )}
                    <span className="text-2xl font-bold text-gray-900">{formatINR(calculateTotal())}</span>
                  </div>

                  {/* Right: CTA */}
                  <button
                    onClick={() => {
                      if (onBookNow) {
                        onBookNow(trip, selectedSeats);
                      } else {
                        navigate(`/pax/board-drop/${trip._id}`, {
                          state: { trip, selectedSeats }
                        });
                      }
                    }}
                    disabled={selectedSeats.length === 0}
                    className="px-5 sm:px-6 md:px-8 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold disabled:bg-red-300 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Select boarding & dropping points
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusListing;
