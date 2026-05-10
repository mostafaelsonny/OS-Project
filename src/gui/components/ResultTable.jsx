import React from 'react';

/**
 * ResultTable
 * -----------
 * Displays the per-process metrics table and a summary row with averages.
 *
 * Props
 *  metrics       — [{id, arrival, burst, priority, ct, tat, wt, rt}, …]
 *  avgWT, avgTAT, avgRT — pre-computed averages
 *  processColors — {pid: hexColor}
 *  highlightBest — if true, colour-codes the best (lowest) WT cell
 */
export default function ResultTable({ metrics, avgWT, avgTAT, avgRT, processColors, highlightBest }) {
  if (!metrics || metrics.length === 0) {
    return (
      <div className="text-slate-500 text-sm text-center py-6">
        Run the simulation to see results.
      </div>
    );
  }

  const minWT  = Math.min(...metrics.map(m => m.wt));
  const minTAT = Math.min(...metrics.map(m => m.tat));
  const minRT  = Math.min(...metrics.map(m => m.rt));

  const cellCls = (val, minVal) =>
    highlightBest && val === minVal
      ? 'text-emerald-400 font-bold'
      : 'text-slate-300';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[520px]">
        <thead>
          <tr className="border-b border-slate-700">
            {['', 'PID', 'Arrival', 'Burst', 'Priority', 'CT', 'TAT', 'WT', 'RT'].map((h, i) => (
              <th
                key={i}
                className="pb-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 whitespace-nowrap"
              >
                {h === 'CT'  ? <abbr title="Completion Time">CT</abbr>   :
                 h === 'TAT' ? <abbr title="Turnaround Time">TAT</abbr>  :
                 h === 'WT'  ? <abbr title="Waiting Time">WT</abbr>      :
                 h === 'RT'  ? <abbr title="Response Time">RT</abbr>     : h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.map((m) => (
            <tr
              key={m.id}
              className="border-b border-slate-800/60 hover:bg-slate-700/20 transition-colors"
            >
              {/* Colour dot */}
              <td className="py-2 px-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: processColors?.[m.id] ?? '#64748b' }}
                />
              </td>
              <td className="py-2 px-2 font-mono font-bold text-white">{m.id}</td>
              <td className="py-2 px-2 font-mono text-slate-400">{m.arrival}</td>
              <td className="py-2 px-2 font-mono text-slate-400">{m.burst}</td>
              <td className="py-2 px-2">
                <span className={`
                  px-1.5 py-0.5 rounded text-[11px] font-mono font-bold
                  ${m.priority <= 2 ? 'bg-red-900/50 text-red-300' :
                    m.priority <= 3 ? 'bg-amber-900/50 text-amber-300' :
                    'bg-slate-700 text-slate-400'}
                `}>
                  {m.priority}
                </span>
              </td>
              <td className="py-2 px-2 font-mono text-slate-300">{m.ct}</td>
              <td className={`py-2 px-2 font-mono ${cellCls(m.tat, minTAT)}`}>{m.tat}</td>
              <td className={`py-2 px-2 font-mono ${cellCls(m.wt,  minWT)}`}>{m.wt}</td>
              <td className={`py-2 px-2 font-mono ${cellCls(m.rt,  minRT)}`}>{m.rt}</td>
            </tr>
          ))}
        </tbody>

        {/* Average row */}
        <tfoot>
          <tr className="border-t-2 border-slate-600 bg-slate-800/40">
            <td colSpan={6} className="py-2.5 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Averages
            </td>
            <td className="py-2.5 px-2 font-mono font-bold text-yellow-400">{avgTAT}</td>
            <td className="py-2.5 px-2 font-mono font-bold text-yellow-400">{avgWT}</td>
            <td className="py-2.5 px-2 font-mono font-bold text-yellow-400">{avgRT}</td>
          </tr>
        </tfoot>
      </table>

      {/* Mini legend below table */}
      {highlightBest && (
        <p className="text-[10px] text-slate-600 mt-2 pl-2">
          <span className="text-emerald-400 font-bold">Green</span> = best (lowest) value in column
        </p>
      )}
    </div>
  );
}
