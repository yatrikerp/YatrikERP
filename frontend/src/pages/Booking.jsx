import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../utils/api';

const SeatCell = ({ seat, selected, onSelect }) => {
  const isUnavailable = seat.status === 'booked' || seat.status === 'reserved';
  return (
    <button
      type="button"
      disabled={isUnavailable}
      onClick={() => onSelect(seat.seatNumber)}
      className={`px-2 py-1 rounded-md border text-sm m-1 ${
        isUnavailable
          ? 'opacity-50 cursor-not-allowed border-gray-300 text-gray-400'
          : selected
            ? 'border-blue-600 text-blue-700 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
      }`}
      title={`${seat.seatNumber} • ₹${seat.price}`}
    >
      {seat.seatNumber}
    </button>
  );
};

const Booking = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tripId = params.get('tripId') || '';
  const from = params.get('from') || '';
  const to = params.get('to') || '';
  const date = params.get('date') || '';
  const seats = params.get('seats') || '';
  const price = params.get('price') || '';

  const [loading, setLoading] = useState(false);
  const [seatsData, setSeatsData] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [reservation, setReservation] = useState(null);
  const [step, setStep] = useState(seats ? 2 : 1); // Skip seat selection if seats already selected
  const [passengers, setPassengers] = useState([{ name: '', age: '', gender: '' }]);

  const totalFare = useMemo(() => {
    // If price is passed from seat selection, use it
    if (price) return parseInt(price) || 0;
    
    // Otherwise calculate from seat data
    if (!seatsData) return 0;
    const priceBySeat = new Map(seatsData.seats.map(s => [s.seatNumber, s.price]));
    return selectedSeats.reduce((sum, s) => sum + (priceBySeat.get(s) || 0), 0);
  }, [seatsData, selectedSeats, price]);

  async function loadSeats() {
    setLoading(true);
    const res = await apiFetch(`/api/seats/trip/${tripId}?date=${encodeURIComponent(date)}`);
    if (res.ok) setSeatsData(res.data);
    setLoading(false);
  }

  useEffect(() => {
    if (tripId && date) loadSeats();
    
    // If seats are pre-selected from seat selection page
    if (seats) {
      const seatNumbers = seats.split(',').map(s => s.trim()).filter(s => s);
      setSelectedSeats(seatNumbers);
      setPassengers(Array.from({ length: seatNumbers.length }, () => ({ name: '', age: '', gender: '' })));
    }
  }, [tripId, date, seats]);

  const toggleSeat = (seatNo) => {
    setSelectedSeats(prev =>
      prev.includes(seatNo) ? prev.filter(s => s !== seatNo) : [...prev, seatNo]
    );
  };

  const reserveSeats = async () => {
    if (selectedSeats.length === 0) return;
    const res = await apiFetch('/api/seats/reserve', {
      method: 'POST',
      body: JSON.stringify({ tripId, seatNumbers: selectedSeats, date, passengerId: 'self' })
    });
    if (res.ok) {
      setReservation(res.data);
      // Ensure passengers array matches seat count
      setPassengers(Array.from({ length: selectedSeats.length }, () => ({ name: '', age: '', gender: '' })));
      setStep(2);
    }
  };

  const confirmBooking = async () => {
    if (!reservation?.reservationId) return;
    const res = await apiFetch('/api/seats/confirm', {
      method: 'POST',
      body: JSON.stringify({
        reservationId: reservation.reservationId,
        tripId,
        seatNumbers: selectedSeats,
        passengerDetails: passengers,
        paymentId: 'PAY_DEMO'
      })
    });
    if (res.ok) {
      const bookingId = res.data.bookingId || res.data.data?.bookingId;
      navigate(`/ticket?bookingId=${bookingId}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm text-gray-600">{from} → {to}</div>
          <h1 className="text-xl font-bold">Select seats</h1>
          <div className="text-sm text-gray-600">{date}</div>
        </div>
        <button onClick={() => navigate(-1)} className="border rounded-full px-4 py-2">Back</button>
      </div>

      {step === 1 && (
        <div className="bg-white rounded-2xl shadow-soft p-4">
          {loading && <div className="text-gray-600">Loading seat map…</div>}
          {!loading && seatsData && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-gray-700">Available: {seatsData.availableSeats} / {seatsData.totalSeats}</div>
                <div className="font-semibold">Fare: ₹{totalFare}</div>
              </div>
              <div className="grid grid-cols-9">
                {seatsData.seats.map(seat => (
                  <SeatCell
                    key={seat.seatNumber}
                    seat={seat}
                    selected={selectedSeats.includes(seat.seatNumber)}
                    onSelect={toggleSeat}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">Selected: {selectedSeats.join(', ') || '—'}</div>
                <button disabled={selectedSeats.length===0} onClick={reserveSeats} className="bg-blue-600 text-white rounded-full px-6 py-2 disabled:opacity-60">Proceed</button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-2xl shadow-soft p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Passenger details</h2>
            <div className="font-semibold">Fare: ₹{totalFare}</div>
          </div>
          {selectedSeats.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600 mb-2">Selected Seats:</div>
              <div className="flex flex-wrap gap-2">
                {selectedSeats.map((seat, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    Seat {seat}
                  </span>
                ))}
              </div>
            </div>
          )}
          {passengers.map((p, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input value={p.name} onChange={e=>{ const v=[...passengers]; v[i].name=e.target.value; setPassengers(v); }} placeholder={`Passenger ${i+1} name`} className="border rounded-lg px-3 py-2" />
              <input value={p.age} onChange={e=>{ const v=[...passengers]; v[i].age=e.target.value; setPassengers(v); }} placeholder="Age" className="border rounded-lg px-3 py-2" />
              <select value={p.gender} onChange={e=>{ const v=[...passengers]; v[i].gender=e.target.value; setPassengers(v); }} className="border rounded-lg px-3 py-2">
                <option value="">Gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Others</option>
              </select>
            </div>
          ))}
          <div className="flex justify-between">
            <button 
              onClick={() => seats ? navigate(`/seat-selection/${tripId}`) : setStep(1)} 
              className="border rounded-full px-4 py-2"
            >
              Back
            </button>
            <button onClick={()=>setStep(3)} className="bg-blue-600 text-white rounded-full px-6 py-2">Continue to payment</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white rounded-2xl shadow-soft p-4 space-y-4">
          <h2 className="text-lg font-semibold">Payment</h2>
          <div className="text-sm text-gray-700">Amount payable: ₹{totalFare}</div>
          <label className="flex items-center gap-2"><input type="radio" defaultChecked /> UPI</label>
          <input placeholder="Enter UPI ID (VPA)" className="border rounded-lg px-3 py-2 w-full" />
          <div className="flex justify-between">
            <button onClick={()=>setStep(2)} className="border rounded-full px-4 py-2">Back</button>
            <button onClick={confirmBooking} className="bg-green-600 text-white rounded-full px-6 py-2">Pay & Confirm</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Booking;


