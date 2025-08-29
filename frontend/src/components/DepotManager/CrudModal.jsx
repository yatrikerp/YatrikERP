import React, { useEffect, useState } from 'react';

const Field = ({ label, name, type = 'text', value, onChange, required, options }) => {
  if (type === 'select') {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-slate-600">{label}</label>
        <select
          name={name}
          value={value || ''}
          onChange={(e) => onChange(name, e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          required={required}
        >
          <option value="">Select...</option>
          {(options || []).map(opt => (
            <option key={String(opt.value)} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-slate-600">{label}</label>
      <input
        type={type}
        name={name}
        value={value || ''}
        onChange={(e) => onChange(name, e.target.value)}
        className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
        required={required}
      />
    </div>
  );
};

const CrudModal = ({ open, title, schema = [], initial = {}, onClose, onSubmit, submitLabel = 'Save' }) => {
  const [form, setForm] = useState(initial || {});
  const [busy, setBusy] = useState(false);

  useEffect(() => { setForm(initial || {}); }, [initial, open]);

  const setValue = (name, value) => setForm(prev => ({ ...prev, [name]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await onSubmit(form);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-[#E91E63] font-semibold">{title}</h3>
          <button onClick={onClose} className="text-slate-600 text-sm">Close</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 grid gap-3">
          {schema.map(field => (
            <Field key={field.name} {...field} value={form[field.name]} onChange={setValue} />
          ))}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white text-slate-700 px-3 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={busy} className="rounded-lg bg-[#E91E63] text-white px-3 py-2 text-sm">
              {busy ? 'Saving…' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrudModal;


