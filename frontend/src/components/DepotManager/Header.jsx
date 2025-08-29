import React from 'react';
import { Bell, GaugeCircle, RefreshCw, User } from 'lucide-react';

const Header = ({ title, depotName, onRefresh, latencyMs = 0, autoRefresh, onToggleAuto, onLogout, dense, onToggleDense }) => {
  return (
    <div className="w-full bg-white/95 sticky top-0 z-40 border-b border-slate-200 shadow-sm">
      <div className={`max-w-[1600px] mx-auto ${dense ? 'px-4 py-2.5' : 'px-6 py-4'} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`${dense ? 'w-8 h-8 text-sm' : 'w-10 h-10'} rounded-xl bg-[#E91E63] text-white flex items-center justify-center font-bold`}>Y</div>
          <div>
            <h1 className={`text-[#E91E63] font-semibold ${dense ? 'text-base' : 'text-lg'}`}>{title}</h1>
            <p className="text-slate-500 text-sm">{depotName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className={`hidden md:flex items-center gap-2 rounded-full border border-slate-200 ${dense ? 'px-2 py-1' : 'px-3 py-1.5'} bg-white`}>
            <GaugeCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-slate-600">Latency: {latencyMs} ms</span>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={autoRefresh} onChange={onToggleAuto} className="accent-[#E91E63]" />
            Auto-refresh
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={!!dense} onChange={onToggleDense} className="accent-[#E91E63]" />
            Compact
          </label>
          <button onClick={onRefresh} className={`inline-flex items-center gap-2 rounded-lg bg-[#E91E63] text-white ${dense ? 'px-2.5 py-1.5' : 'px-3 py-2'} text-sm`}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button className={`rounded-lg border border-slate-200 ${dense ? 'px-2.5 py-1.5' : 'px-3 py-2'} bg-white text-slate-700`}><Bell className="w-4 h-4" /></button>
          <div className="relative">
            <button className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 ${dense ? 'px-2.5 py-1.5' : 'px-3 py-2'} bg-white text-slate-700`}>
              <User className="w-4 h-4" />
              Profile
            </button>
          </div>
          <button onClick={onLogout} className={`rounded-lg bg-red-500 text-white ${dense ? 'px-2.5 py-1.5' : 'px-3 py-2'} text-sm`}>Logout</button>
        </div>
      </div>
    </div>
  );
};

export default Header;


