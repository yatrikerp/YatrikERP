import React from 'react';
import http from '../../utils/http';

const QuickActions = ({ dutyId, onAfterAction, colors }) => {
  const primary = colors?.primary || '#0088A9';
  const accent = colors?.accent || '#FF6B35';

  const start = async () => {
    if (!dutyId) return;
    await http.post(`/api/driver/duties/${dutyId}/start`, {});
    onAfterAction?.();
  };

  const end = async () => {
    if (!dutyId) return;
    await http.post(`/api/driver/duties/${dutyId}/end`, {});
    onAfterAction?.();
  };

  const delay = async () => {
    if (!dutyId) return;
    await http.post(`/api/driver/duties/${dutyId}/delay`, {});
    onAfterAction?.();
  };

  const breakdown = async () => {
    if (!dutyId) return;
    await http.post(`/api/driver/duties/${dutyId}/incident`, { type: 'breakdown' });
    onAfterAction?.();
  };

  const refresh = async () => {
    onAfterAction?.();
  };

  const btn = (label, onClick, color) => (
    <button
      onClick={onClick}
      className="px-3 py-2 text-sm font-semibold text-white rounded-xl shadow-sm hover:shadow transition-colors"
      style={{ background: color }}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap gap-2">
      {btn('Start Trip', start, primary)}
      {btn('End Trip', end, accent)}
      {btn('Report Delay', delay, primary)}
      {btn('Report Breakdown', breakdown, accent)}
      {btn('Refresh', refresh, '#0f172a')}
    </div>
  );
};

export default QuickActions;


