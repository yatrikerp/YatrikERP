import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../../utils/api';

const PaxBooking = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [fare, setFare] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [stopId, setStopId] = useState('board-1');
  const [dropId, setDropId] = useState('drop-1');
  const [seatNo, setSeatNo] = useState('U11');
  const [step, setStep] = useState(1); // 1 seat/pickup, 2 traveller, 3 payment
  const [travellers, setTravellers] = useState([{ name: '', age: '', gender: '' }]);

  async function createBooking(){
    // Create a booking in pending payment using simpler bookings API
    const res = await apiFetch('/api/bookings/create', { 
      method: 'POST', 
      body: JSON.stringify({ 
        tripId, 
        seatNo, 
        boardingStopId: stopId, 
        destinationStopId: dropId,
        passengerDetails: travellers?.[0] || {}
      }) 
    });
    if (res.ok) { 
      setFare(res.data.data?.amount || res.data.amount); 
      setBookingId(res.data.data?.bookingId || res.data.bookingId); 
    }
  }

  async function confirm(){
    if (!bookingId) return;
    const res = await apiFetch(`/api/booking/${bookingId}/confirm`, { method: 'PUT', body: JSON.stringify({ method: 'upi', status: 'paid' }) });
    if (res.ok) {
      navigate(`/ticket?bookingId=${bookingId}`);
    }
  }

  useEffect(() => { createBooking(); }, []);

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-soft p-6 space-y-4">
      <h1 className="text-xl font-bold">Booking</h1>
      <div className="text-gray-700">Trip: {tripId}</div>
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border rounded-2xl p-4">
            <div className="mb-2 font-semibold">Select Seat</div>
            <div className="grid grid-cols-5 gap-2 text-sm">
              {['L01','L02','L03','L04','L05','U11','U12','U13','U14','U15'].map(s => (
                <button key={s} onClick={()=>setSeatNo(s)} className={`px-2 py-1 rounded-md border ${seatNo===s?'border-primary-600 text-primary-700':'border-gray-300'}`}>{s}</button>
              ))}
            </div>
          </div>
          <div className="border rounded-2xl p-4">
            <div className="mb-2 font-semibold">Select Pickup and Dropoff point</div>
            <select value={stopId} onChange={e=>setStopId(e.target.value)} className="w-full border rounded-lg px-3 py-2">
              <option value="board-1">Boarding At Central Bus Station</option>
              <option value="board-2">Boarding At City Depot</option>
            </select>
            <select value={dropId} onChange={e=>setDropId(e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-3">
              <option value="drop-1">Drop At Silk Board</option>
              <option value="drop-2">Drop At City Center</option>
            </select>
            <div className="mt-4 text-sm text-gray-600">Selected: {seatNo}</div>
          </div>
          <div className="lg:col-span-2 flex items-center justify-between">
            <div className="text-primary-700 font-semibold">Fare: {fare ? `₹${fare}` : '...'} </div>
            <button disabled={!bookingId} onClick={()=>setStep(2)} className="bg-primary-600 text-white rounded-full px-6 py-2 disabled:opacity-60">Provide Passenger Details</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="font-semibold mb-3">Traveller Details</div>
          {travellers.map((t, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <input placeholder="Name" className="border rounded-lg px-3 py-2" value={t.name} onChange={e=>{
                const v=[...travellers]; v[i].name=e.target.value; setTravellers(v);
              }} />
              <input placeholder="Age" className="border rounded-lg px-3 py-2" value={t.age} onChange={e=>{ const v=[...travellers]; v[i].age=e.target.value; setTravellers(v); }} />
              <select className="border rounded-lg px-3 py-2" value={t.gender} onChange={e=>{ const v=[...travellers]; v[i].gender=e.target.value; setTravellers(v); }}>
                <option value="">Gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Others</option>
              </select>
            </div>
          ))}
          <div className="flex justify-end gap-3">
            <button onClick={()=>setStep(1)} className="rounded-full px-4 py-2 border">Back</button>
            <button onClick={()=>setStep(3)} className="rounded-full px-6 py-2 bg-primary-600 text-white">Proceed to Payee Details</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="font-semibold mb-3">Payment option</div>
          <div className="space-y-3">
            <label className="flex items-center gap-3"><input type="radio" name="pay" defaultChecked /> UPI Payments - Typing VPA</label>
            <input placeholder="Enter VPA/UPI ID" className="border rounded-lg px-3 py-2 w-full" />
            <button onClick={confirm} className="w-full bg-primary-600 text-white rounded-full py-2">Verify & Pay</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaxBooking;


