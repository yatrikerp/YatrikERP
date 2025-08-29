import React from 'react';
import { PlusCircle, Users, FileDown, FileUp, Settings, Fuel, Route as RouteIcon, CalendarPlus } from 'lucide-react';

const ActionCard = ({ icon: Icon, label, onClick, dense }) => (
  <button onClick={onClick} className="group w-full text-left">
    <div className={`bg-white border border-slate-200 rounded-2xl ${dense ? 'p-3' : 'p-4'} shadow-sm hover:shadow-md transition-transform group-hover:-translate-y-0.5`}>
              <div className={`${dense ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl bg-[#E91E63]/90 text-white flex items-center justify-center mb-3`}>
        <Icon className={`${dense ? 'w-4 h-4' : 'w-5 h-5'}`} />
      </div>
      <div className={`text-slate-800 font-semibold ${dense ? 'text-sm' : ''}`}>{label}</div>
      <div className={`text-slate-500 ${dense ? 'text-xs' : 'text-sm'} mt-1`}>Quick access</div>
    </div>
  </button>
);

const QuickActionsGrid = ({ onAddRoute, onScheduleTrip, onAssignCrew, onAddBus, onLogFuel, onExport, onImport, dense }) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${dense ? 'gap-3' : 'gap-4'}`}>
      <ActionCard dense={dense} icon={RouteIcon} label="Add Route" onClick={onAddRoute} />
      <ActionCard dense={dense} icon={CalendarPlus} label="Schedule Trip" onClick={onScheduleTrip} />
      <ActionCard dense={dense} icon={Users} label="Assign Crew" onClick={onAssignCrew} />
      <ActionCard dense={dense} icon={PlusCircle} label="Add Bus" onClick={onAddBus} />
      <ActionCard dense={dense} icon={Fuel} label="Log Fuel" onClick={onLogFuel} />
      <ActionCard dense={dense} icon={FileDown} label="Export Data" onClick={onExport} />
      <ActionCard dense={dense} icon={FileUp} label="Import Data" onClick={onImport} />
      <ActionCard dense={dense} icon={Settings} label="Configuration" onClick={() => {}} />
    </div>
  );
};

export default QuickActionsGrid;


