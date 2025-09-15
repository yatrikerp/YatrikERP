import React, { useState } from 'react';
import BusSeatLayout from '../../components/BusSeatLayout';

const PassengerSeats = () => {
  const [selectedSeats, setSelectedSeats] = useState([]);

  const handleSeatSelection = (seats) => {
    setSelectedSeats(seats);
    console.log('Selected seats:', seats);
  };

  // Dynamic seat pricing based on position
  const seatPricing = {
    // Front rows - Premium pricing
    "1A": 550, "1B": 550, "1C": 550, "1D": 550,
    "2A": 550, "2B": 550, "2C": 550, "2D": 550,
    
    // Middle rows - Standard pricing
    "3A": 499, "3B": 499, "3C": 499, "3D": 499,
    "4A": 499, "4B": 499, "4C": 499, "4D": 499,
    "5A": 499, "5B": 499, "5C": 499, "5D": 499,
    "6A": 499, "6B": 499, "6C": 499, "6D": 499,
    "7A": 499, "7B": 499, "7C": 499, "7D": 499,
    "8A": 499, "8B": 499, "8C": 499, "8D": 499,
    
    // Back rows - Economy pricing
    "9A": 450, "9B": 450, "9C": 450, "9D": 450,
    "10A": 450, "10B": 450, "10C": 450, "10D": 450,
    "11A": 450, "11B": 450, "11C": 450, "11D": 450,
  };

  // Example: Custom seats data with specific statuses
  const customSeats = [
    { id: '1A', seatNumber: '1A', status: 'available', price: 550 },
    { id: '1B', seatNumber: '1B', status: 'available', price: 550 },
    { id: '1C', seatNumber: '1C', status: 'available', price: 550 },
    { id: '1D', seatNumber: '1D', status: 'available', price: 550 },
    
    { id: '2A', seatNumber: '2A', status: 'available', price: 550 },
    { id: '2B', seatNumber: '2B', status: 'available', price: 550 },
    { id: '2C', seatNumber: '2C', status: 'available', price: 550 },
    { id: '2D', seatNumber: '2D', status: 'available', price: 550 },
    
    { id: '3A', seatNumber: '3A', status: 'sold', price: 499 },
    { id: '3B', seatNumber: '3B', status: 'available_male', price: 499 },
    { id: '3C', seatNumber: '3C', status: 'available', price: 499 },
    { id: '3D', seatNumber: '3D', status: 'available', price: 499 },
    
    { id: '4A', seatNumber: '4A', status: 'available', price: 499 },
    { id: '4B', seatNumber: '4B', status: 'available', price: 499 },
    { id: '4C', seatNumber: '4C', status: 'available', price: 499 },
    { id: '4D', seatNumber: '4D', status: 'available', price: 499 },
    
    { id: '5A', seatNumber: '5A', status: 'available', price: 499 },
    { id: '5B', seatNumber: '5B', status: 'available', price: 499 },
    { id: '5C', seatNumber: '5C', status: 'available_female', price: 499 },
    { id: '5D', seatNumber: '5D', status: 'sold', price: 499 },
    
    // Continue with remaining seats...
    { id: '6A', seatNumber: '6A', status: 'available', price: 499 },
    { id: '6B', seatNumber: '6B', status: 'available', price: 499 },
    { id: '6C', seatNumber: '6C', status: 'available', price: 499 },
    { id: '6D', seatNumber: '6D', status: 'available', price: 499 },
    
    { id: '7A', seatNumber: '7A', status: 'available', price: 499 },
    { id: '7B', seatNumber: '7B', status: 'available', price: 499 },
    { id: '7C', seatNumber: '7C', status: 'available', price: 499 },
    { id: '7D', seatNumber: '7D', status: 'available', price: 499 },
    
    { id: '8A', seatNumber: '8A', status: 'available', price: 499 },
    { id: '8B', seatNumber: '8B', status: 'available', price: 499 },
    { id: '8C', seatNumber: '8C', status: 'available', price: 499 },
    { id: '8D', seatNumber: '8D', status: 'available', price: 499 },
    
    { id: '9A', seatNumber: '9A', status: 'available', price: 450 },
    { id: '9B', seatNumber: '9B', status: 'available', price: 450 },
    { id: '9C', seatNumber: '9C', status: 'available', price: 450 },
    { id: '9D', seatNumber: '9D', status: 'available', price: 450 },
    
    { id: '10A', seatNumber: '10A', status: 'available', price: 450 },
    { id: '10B', seatNumber: '10B', status: 'available', price: 450 },
    { id: '10C', seatNumber: '10C', status: 'available', price: 450 },
    { id: '10D', seatNumber: '10D', status: 'available', price: 450 },
    
    { id: '11A', seatNumber: '11A', status: 'available', price: 450 },
    { id: '11B', seatNumber: '11B', status: 'available', price: 450 },
    { id: '11C', seatNumber: '11C', status: 'available', price: 450 },
    { id: '11D', seatNumber: '11D', status: 'available', price: 450 },
  ];

  const getTotalAmount = () => {
    return selectedSeats.reduce((total, seatNumber) => {
      const seat = customSeats.find(s => s.seatNumber === seatNumber);
      return total + (seat?.price || 0);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Select Your Seats</h1>
          <p className="text-gray-600">Choose your preferred seats for the journey</p>
        </div>

        {/* Pricing Information */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Seat Pricing</h3>
          <div className="flex items-center space-x-6 text-sm text-blue-700">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Front Rows (1-2): ₹550</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Middle Rows (3-8): ₹499</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Back Rows (9-11): ₹450</span>
            </div>
          </div>
        </div>

        {/* Bus Seat Layout */}
        <BusSeatLayout
          seats={customSeats}
          onSeatSelection={handleSeatSelection}
          selectedSeats={selectedSeats}
          seatPricing={seatPricing}
        />

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end space-x-4">
          <button 
            onClick={() => console.log('Continue with seats:', selectedSeats)}
            disabled={selectedSeats.length === 0}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Continue ({selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''}) - ₹{getTotalAmount()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PassengerSeats;