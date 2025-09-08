import React from 'react';

const PassengerTable = ({ passengers, colors, onApprove }) => {
  const primary = colors?.primary || '#0088A9';
  const accent = colors?.accent || '#FF6B35';

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-4 py-3 rounded-t-2xl text-white" style={{ background: primary }}>
        <h3 className="font-semibold">Passengers</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-600">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Seat</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(passengers || []).map((p, i) => (
              <tr key={p.id || p.ticketId || i} className="hover:bg-white/50">
                <td className="px-4 py-2">{p.name || p.passengerName || 'Passenger'}</td>
                <td className="px-4 py-2">{p.seatNo || p.seat || '-'}</td>
                <td className="px-4 py-2">{(p.ticketStatus || p.status) === 'valid' || p.valid ? '✅ Valid' : '❌ Pending'}</td>
                <td className="px-4 py-2">
                  {((p.ticketStatus || p.status) !== 'valid' && !p.valid) && (
                    <button
                      onClick={() => onApprove?.(p.ticketId || p.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-white rounded-xl shadow transition-all"
                      style={{ background: `linear-gradient(90deg, ${primary}, ${accent})` }}
                    >
                      Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {(!passengers || passengers.length === 0) && (
              <tr>
                <td colSpan="4" className="px-4 py-6 text-center text-slate-500">No passengers</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PassengerTable;


