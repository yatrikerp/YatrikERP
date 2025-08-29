import React from 'react';
import { Bus, Clock, MapPinned, Ticket as TicketIcon, Navigation } from 'lucide-react';

const statusChip = (status) => {
  const map = {
    ontime: { bg: '#EAF7F2', color: '#16A085', label: 'On Time' },
    delayed: { bg: '#FFF7E6', color: '#F39C12', label: 'Delayed' },
    cancelled: { bg: '#FDECEC', color: '#E74C3C', label: 'Cancelled' },
  };
  const s = map[status] || map.ontime;
  return <span style={{background:s.bg,color:s.color}} className="px-2 py-1 rounded-full text-xs font-medium">{s.label}</span>;
};

const TripCard = ({ route, busNo, seat, departure, arrival, status='ontime', onViewTicket, onTrack }) => {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-gray-800 font-semibold">
          <Bus className="w-5 h-5 text-gray-600" /> {route}
        </div>
        {statusChip(status)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
        <div className="flex items-center gap-2"><MapPinned className="w-4 h-4" /> Bus No: <span className="font-medium text-gray-800">{busNo}</span></div>
        <div className="flex items-center gap-2"><TicketIcon className="w-4 h-4" /> Seat: <span className="font-medium text-gray-800">{seat}</span></div>
        <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> Depart: <span className="font-medium text-gray-800">{departure}</span></div>
        <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> Arrive: <span className="font-medium text-gray-800">{arrival}</span></div>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <button onClick={onViewTicket} className="px-3 py-2 rounded-lg text-white text-sm font-medium" style={{background:'#16A085'}}>View Ticket</button>
        <button onClick={onTrack} className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-800 flex items-center gap-2">
          <Navigation className="w-4 h-4" /> Track Bus
        </button>
      </div>
    </div>
  );
};

export default TripCard;


