import React, { useState, useEffect } from 'react';
import { validateProcessForm, isFormValid } from '../../util/validators.js';

const EMPTY_FORM = { id: '', arrival: '', burst: '', priority: '' };

const FIELD_META = [
  { key: 'id',       label: 'Process ID',   placeholder: 'P1',  type: 'text',   hint: 'Unique identifier'          },
  { key: 'arrival',  label: 'Arrival (t)',  placeholder: '0',   type: 'number', hint: '≥ 0, integer'               },
  { key: 'burst',    label: 'Burst (t)',    placeholder: '5',   type: 'number', hint: '> 0, integer'               },
  { key: 'priority', label: 'Priority',     placeholder: '1',   type: 'number', hint: 'Low # = high urgency (≥ 1)' },
];

/**
 * InputPanel
 * ----------
 * - Add / remove processes from the simulation queue.
 * - Real-time field validation (covers Scenario D).
 * - Shows a colour-coded process table.
 *
 * Props
 *  processes        — current list
 *  onAddProcess     — (processObj) => void
 *  onRemoveProcess  — (id) => void
 *  externalFormData — optional {id,arrival,burst,priority} injected by parent (Scenario D)
 *  onFormDataConsumed — called after external form data is applied
 *  processColors    — {id: hexColor} map from App
 */
export default function InputPanel({
  processes,
  onAddProcess,
  onRemoveProcess,
  externalFormData,
  onFormDataConsumed,
  processColors,
}) {
  const [form,   setForm]   = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  /* Apply external form data (Scenario D) */
  useEffect(() => {
    if (externalFormData) {
      setForm(externalFormData);
      setTouched({ id: true, arrival: true, burst: true, priority: true });
      setErrors(validateProcessForm(externalFormData, processes));
      onFormDataConsumed && onFormDataConsumed();
    }
  }, [externalFormData]); // eslint-disable-line

  /* Re-validate on form change */
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      const activeErrors = {};
      const allErrors = validateProcessForm(form, processes);
      Object.keys(touched).forEach(k => {
        if (allErrors[k]) activeErrors[k] = allErrors[k];
      });
      setErrors(activeErrors);
    }
  }, [form, processes]); // eslint-disable-line

  const handleChange = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    setTouched(t => ({ ...t, [key]: true }));
  };

  const handleBlur = (key) => {
    setTouched(t => ({ ...t, [key]: true }));
    const allErrors = validateProcessForm(form, processes);
    if (allErrors[key]) setErrors(e => ({ ...e, [key]: allErrors[key] }));
    else                setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  };

  const handleAdd = () => {
    const allTouched = { id: true, arrival: true, burst: true, priority: true };
    setTouched(allTouched);
    const allErrors = validateProcessForm(form, processes);
    setErrors(allErrors);
    if (!isFormValid(allErrors)) return;

    onAddProcess({
      id:       form.id.trim(),
      arrival:  parseInt(form.arrival,  10),
      burst:    parseInt(form.burst,    10),
      priority: parseInt(form.priority, 10),
    });
    setForm(EMPTY_FORM);
    setErrors({});
    setTouched({});
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Process Queue
        </span>
        <div className="flex-1 h-px bg-slate-700" />
        <span className="text-xs text-slate-500 font-mono">
          {processes.length} process{processes.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* ─── Input form ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        {FIELD_META.map(field => (
          <div key={field.key} className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {field.label}
            </label>
            <input
              type={field.type}
              value={form[field.key]}
              placeholder={field.placeholder}
              onChange={e => handleChange(field.key, e.target.value)}
              onBlur={() => handleBlur(field.key)}
              onKeyDown={handleKeyDown}
              min={field.type === 'number' ? '0' : undefined}
              className={`
                w-full bg-slate-900 border rounded-lg px-3 py-2
                text-sm text-white placeholder-slate-600 font-mono
                focus:outline-none focus:ring-2 transition-all
                ${errors[field.key]
                  ? 'border-red-500 focus:ring-red-500/40'
                  : 'border-slate-600 focus:ring-blue-500/40 hover:border-slate-500'}
              `}
            />
            {/* Error message */}
            {errors[field.key] ? (
              <p className="text-[10px] text-red-400 leading-tight flex items-start gap-1">
                <span className="mt-0.5">⚠</span>
                <span>{errors[field.key]}</span>
              </p>
            ) : (
              <p className="text-[10px] text-slate-600">{field.hint}</p>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleAdd}
        className="
          w-full py-2.5 rounded-xl font-semibold text-sm
          bg-blue-600 hover:bg-blue-500 active:bg-blue-700
          text-white transition-colors duration-150
          flex items-center justify-center gap-2
        "
      >
        <span className="text-lg leading-none">＋</span>
        Add Process
      </button>

      {/* ─── Process Table ─── */}
      {processes.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr className="border-b border-slate-700">
                {['', 'ID', 'Arrival', 'Burst', 'Priority', ''].map((h, i) => (
                  <th
                    key={i}
                    className="pb-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processes.map((p, idx) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-800 hover:bg-slate-700/30 transition-colors"
                >
                  {/* Colour dot */}
                  <td className="py-2 px-2 w-6">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: processColors?.[p.id] || '#64748b' }}
                    />
                  </td>
                  <td className="py-2 px-2 font-mono font-bold text-white">{p.id}</td>
                  <td className="py-2 px-2 font-mono text-slate-300">{p.arrival}</td>
                  <td className="py-2 px-2 font-mono text-slate-300">{p.burst}</td>
                  <td className="py-2 px-2">
                    <span
                      className={`
                        inline-block px-2 py-0.5 rounded text-xs font-bold font-mono
                        ${p.priority <= 2 ? 'bg-red-900/60 text-red-300' :
                          p.priority <= 3 ? 'bg-amber-900/60 text-amber-300' :
                          'bg-slate-700 text-slate-300'}
                      `}
                    >
                      {p.priority}
                      {p.priority === Math.min(...processes.map(x => x.priority)) && (
                        <span className="ml-1 text-[9px]">★</span>
                      )}
                    </span>
                  </td>
                  {/* Remove button */}
                  <td className="py-2 px-2 w-8">
                    <button
                      onClick={() => onRemoveProcess(p.id)}
                      className="
                        w-6 h-6 rounded-full flex items-center justify-center
                        bg-slate-700 hover:bg-red-600/70 text-slate-400 hover:text-white
                        transition-colors text-xs font-bold
                      "
                      title={`Remove ${p.id}`}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {processes.length === 0 && (
        <div className="mt-5 flex flex-col items-center py-6 text-slate-600">
          <span className="text-3xl mb-2">📋</span>
          <p className="text-sm">No processes yet — add one above.</p>
        </div>
      )}
    </div>
  );
}
