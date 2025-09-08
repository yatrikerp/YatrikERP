import React from 'react';

const TripCard = ({ trip, colors }) => {
  const primary = colors?.primary || '#0088A9';

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-100">
      <div className="px-4 py-3 rounded-t-2xl text-white" style={{ background: primary }}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Current Trip</h3>
          <span className="text-xs opacity-90">{trip?.status || 'Active'}</span>
        </div>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-slate-500">Route</div>
          <div className="font-medium">{trip?.route || `${trip?.origin || '-'} → ${trip?.destination || '-'}`}</div>
        </div>
        <div>
          <div className="text-sm text-slate-500">Bus</div>
          <div className="font-medium">{trip?.bus || '-'}</div>
        </div>
        <div>
          <div className="text-sm text-slate-500">Start Time</div>
          <div className="font-medium">{trip?.startTime || '-'}</div>
        </div>
        <div>
          <div className="text-sm text-slate-500">Passengers</div>
          <div className="font-medium">{trip?.passengerCount ?? '-'}</div>
        </div>
      </div>
    </div>
  );
};

export default TripCard;


