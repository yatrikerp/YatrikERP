import React from 'react';
import ModernSeatSelection from './ModernSeatSelection';

const SeatSelection = ({ 
  trip, 
  selectedSeats, 
  onSeatSelect, 
  onBack, 
  onContinue,
  passengerGender = 'male' 
}) => {
  return (
    <ModernSeatSelection
      trip={trip}
      selectedSeats={selectedSeats}
      onSeatSelect={onSeatSelect}
      onBack={onBack}
      onContinue={onContinue}
      passengerGender={passengerGender}
    />
  );
};

export default SeatSelection;
