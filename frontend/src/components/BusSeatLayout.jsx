import React, { useState } from 'react';
import { FaMale, FaFemale } from 'react-icons/fa';

const BusSeatLayout = ({ 
  seats = [], 
  onSeatSelection = () => {}, 
  selectedSeats = [], 
  seatPricing = {} 
}) => {
  const [localSelectedSeats, setLocalSelectedSeats] = useState(selectedSeats);

  // Generate default seats if none provided (45 seats: 11 rows × 4 seats per row)
  const defaultSeats = React.useMemo(() => {
    if (seats.length > 0) return seats;
    
    const generatedSeats = [];
    const seatLabels = ['A', 'B', 'C', 'D'];
    
    for (let row = 1; row <= 11; row++) {
      for (let col = 0; col < 4; col++) {
        const seatNumber = `${row}${seatLabels[col]}`;
        const price = seatPricing[seatNumber] || getDefaultPrice(row);
        
        generatedSeats.push({
          id: seatNumber,
          seatNumber: seatNumber,
          status: getRandomStatus(),
          price: price
        });
      }
    }
    return generatedSeats;
  }, [seats, seatPricing]);

  // Default pricing based on row position
  const getDefaultPrice = (row) => {
    if (row <= 2) return 550; // Front rows - premium
    if (row <= 8) return 499; // Middle rows - standard
    return 450; // Back rows - economy
  };

  // Generate random status for demo
  const getRandomStatus = () => {
    const rand = Math.random();
    if (rand < 0.7) return 'available';
    if (rand < 0.85) return 'sold';
    if (rand < 0.95) return 'available_male';
    return 'available_female';
  };

  // Group seats into rows (4 seats per row)
  const seatRows = React.useMemo(() => {
    const rows = [];
    for (let i = 0; i < defaultSeats.length; i += 4) {
      rows.push(defaultSeats.slice(i, i + 4));
    }
    return rows;
  }, [defaultSeats]);

  const handleSeatClick = (seat) => {
    if (seat.status === 'sold') return;

    const currentSelected = localSelectedSeats.includes(seat.seatNumber);
    let newSelectedSeats;

    if (currentSelected) {
      // Remove from selection
      newSelectedSeats = localSelectedSeats.filter(s => s !== seat.seatNumber);
    } else {
      // Add to selection
      newSelectedSeats = [...localSelectedSeats, seat.seatNumber];
    }

    setLocalSelectedSeats(newSelectedSeats);
    onSeatSelection(newSelectedSeats);
  };

  const getSeatClasses = (seat) => {
    const isSelected = localSelectedSeats.includes(seat.seatNumber);
    
    if (isSelected) {
      return "bg-green-500 border-green-500 text-white";
    }
    
    switch (seat.status) {
      case 'available':
        return "bg-white border-green-500 text-green-600 hover:bg-green-50";
      case 'sold':
        return "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed opacity-75";
      case 'available_male':
        return "bg-white border-blue-500 text-blue-600 hover:bg-blue-50";
      case 'available_female':
        return "bg-white border-pink-500 text-pink-600 hover:bg-pink-50";
      default:
        return "bg-white border-gray-300 text-gray-600";
    }
  };

  // Professional Seat Icon Component
  const SeatIcon = ({ status, seatStatus }) => {
    const iconColor = status === 'selected' ? 'text-white' : 
                     status === 'available' ? 'text-green-600' :
                     status === 'booked' ? 'text-gray-500' : 'text-gray-400';
    
    return (
      <svg 
        className={`w-6 h-6 ${iconColor}`} 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        {/* Professional bus seat outline (view from above) */}
        <path d="M4 6c0-1 1-2 2-2h12c1 0 2 1 2 2v10c0 1-1 2-2 2H6c-1 0-2-1-2-2V6z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4 6c0-1 1-2 2-2h12c1 0 2 1 2 2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 8h12M6 12h12M6 16h12" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  };

  const getSeatIcon = (seat) => {
    const isSelected = localSelectedSeats.includes(seat.seatNumber);
    
    if (isSelected) {
      return <span className="text-white text-xs font-bold">✓</span>;
    }
    
    switch (seat.status) {
      case 'available_male':
        return <FaMale className="w-3 h-3 text-blue-600" />;
      case 'available_female':
        return <FaFemale className="w-3 h-3 text-pink-600" />;
      case 'sold':
        return <span className="text-gray-400 text-xs">✗</span>;
      default:
        return <SeatIcon status="available" seatStatus={seat.status} />;
    }
  };

  const getSeatPrice = (seat) => {
    if (seat.status === 'sold') return 'Sold';
    return `₹${seat.price}`;
  };

  const getTotalAmount = () => {
    return localSelectedSeats.reduce((total, seatNumber) => {
      const seat = defaultSeats.find(s => s.seatNumber === seatNumber);
      return total + (seat?.price || 0);
    }, 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header with Steering Wheel */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-500">
          Total Seats: {defaultSeats.length} | Available: {defaultSeats.filter(s => s.status === 'available' || s.status === 'available_male' || s.status === 'available_female').length}
        </div>
        <div className="flex items-center space-x-2">
          <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </div>
      </div>

      {/* Bus Seat Layout */}
      <div className="space-y-2">
        {seatRows.map((rowSeats, rowIndex) => (
          <div key={rowIndex} className="flex items-center justify-center space-x-6">
            {/* Left side seats (2 seats) */}
            <div className="flex space-x-3">
              {rowSeats.slice(0, 2).map((seat) => (
                <div key={seat.seatNumber} className="text-center">
                  <button
                    onClick={() => handleSeatClick(seat)}
                    className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-colors text-xs font-medium ${getSeatClasses(seat)}`}
                    disabled={seat.status === 'sold'}
                    title={`Seat ${seat.seatNumber} - ${seat.status} - ₹${seat.price}`}
                  >
                    {getSeatIcon(seat) || seat.seatNumber}
                  </button>
                  <div className="text-xs text-gray-600 mt-1 font-medium">
                    {getSeatPrice(seat)}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Aisle - empty gap */}
            <div className="w-12"></div>
            
            {/* Right side seats (2 seats) */}
            <div className="flex space-x-3">
              {rowSeats.slice(2, 4).map((seat) => (
                <div key={seat.seatNumber} className="text-center">
                  <button
                    onClick={() => handleSeatClick(seat)}
                    className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-colors text-xs font-medium ${getSeatClasses(seat)}`}
                    disabled={seat.status === 'sold'}
                    title={`Seat ${seat.seatNumber} - ${seat.status} - ₹${seat.price}`}
                  >
                    {getSeatIcon(seat) || seat.seatNumber}
                  </button>
                  <div className="text-xs text-gray-600 mt-1 font-medium">
                    {getSeatPrice(seat)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Seats Summary */}
      {localSelectedSeats.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-700">
            <span className="font-medium">Selected Seats:</span> {localSelectedSeats.join(', ')}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Total Amount: ₹{getTotalAmount()}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-sm font-medium text-gray-700 mb-3">Seat Legend</div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white border-2 border-green-500 rounded-lg flex items-center justify-center">
              <SeatIcon status="available" />
            </div>
            <span className="text-sm text-gray-600">Available</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-xs">✗</span>
            </div>
            <span className="text-sm text-gray-600">Sold</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white border-2 border-blue-500 rounded-lg flex items-center justify-center">
              <FaMale className="w-3 h-3 text-blue-600" />
            </div>
            <span className="text-sm text-gray-600">Male Only</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white border-2 border-pink-500 rounded-lg flex items-center justify-center">
              <FaFemale className="w-3 h-3 text-pink-600" />
            </div>
            <span className="text-sm text-gray-600">Female Only</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusSeatLayout;