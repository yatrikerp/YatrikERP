import React from 'react';

const Field = ({ label, value }) => (
  <div>
    <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
    <div className="text-slate-800 font-semibold mt-1">{value || '—'}</div>
  </div>
);

const StatusPill = ({ status }) => {
  const map = {
    active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    unknown: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
  };
  const cls = map[status] || map.unknown;
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cls}`}>{status || 'unknown'}</span>;
};

const DepotInfoCard = ({ depot, dense }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className={`${dense ? 'px-4 py-3' : 'px-6 py-4'} border-b border-slate-200 bg-slate-50 flex items-center justify-between` }>
        <div>
          <h3 className={`text-[#E91E63] font-semibold ${dense ? 'text-sm' : ''}`}>Depot Information</h3>
          <p className="text-slate-500 text-sm">Key details and status</p>
        </div>
        <StatusPill status={depot?.status || 'active'} />
      </div>
      <div className={`${dense ? 'p-4 gap-4' : 'p-6 gap-6'} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`}>
        <Field label="Depot Name" value={depot?.name} />
        <Field label="Depot Code" value={depot?.code} />
        <Field label="Manager" value={depot?.manager} />
        <Field label="Location" value={depot?.location || depot?.address} />
        <Field label="Contact" value={depot?.contact || depot?.phone} />
        <Field label="Operational Hours" value={depot?.operationalHours || '—'} />
      </div>
    </div>
  );
};

export default DepotInfoCard;


