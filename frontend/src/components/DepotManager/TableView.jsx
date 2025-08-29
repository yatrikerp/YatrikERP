import React from 'react';

const TableView = ({ columns, rows, renderCell, rightHeader, title, dense }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className={`${dense ? 'px-4 py-3' : 'px-6 py-4'} border-b border-slate-200 bg-slate-50 flex items-center justify-between`}>
        <h3 className={`text-[#E91E63] font-semibold ${dense ? 'text-sm' : ''}`}>{title}</h3>
        <div className="flex items-center gap-2">{rightHeader}</div>
      </div>
      <div className="p-0 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className={`text-left ${dense ? 'text-[11px]' : 'text-xs'} uppercase tracking-wider text-slate-500 bg-slate-50`}>
              {columns.map(col => (
                <th key={col.key} className={`${dense ? 'px-4 py-2' : 'px-6 py-3'} whitespace-nowrap font-semibold`}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id || row._id || idx} className="border-t border-slate-100 hover:bg-slate-50/60">
                {columns.map(col => (
                  <td key={col.key} className={`${dense ? 'px-4 py-2 text-[13px]' : 'px-6 py-3'} whitespace-nowrap text-slate-800`}>
                    {renderCell ? renderCell(col, row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableView;


