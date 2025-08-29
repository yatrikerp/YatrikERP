import React from 'react';

const MapView = ({ children, title = 'Live Map', rightHeader, dense }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className={`${dense ? 'px-4 py-3' : 'px-6 py-4'} border-b border-slate-200 bg-slate-50 flex items-center justify-between`}>
        <h3 className={`text-[#E91E63] font-semibold ${dense ? 'text-sm' : ''}`}>{title}</h3>
        <div className="flex items-center gap-2">{rightHeader}</div>
      </div>
      <div className="p-0">
        {children}
      </div>
    </div>
  );
};

export default MapView;


