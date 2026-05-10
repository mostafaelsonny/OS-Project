import React, { useRef, useState } from 'react';

/**
 * GanttChart
 * ----------
 * Renders a colour-coded horizontal Gantt bar for a scheduling timeline.
 *
 * Props
 *  timeline      — [{pid, start, end, idle?}, …]  from scheduler
 *  title         — chart heading string
 *  processColors — {pid: hexColor}
 *  totalTime     — optional override; defaults to last segment's end
 */
export default function GanttChart({ timeline, title, processColors, totalTime: totalOverride }) {
  const [tooltip, setTooltip] = useState(null);
  const containerRef = useRef(null);

  if (!timeline || timeline.length === 0) {
    return (
      <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-5 text-slate-500 text-sm text-center">
        No timeline data yet.
      </div>
    );
  }

  const totalTime = totalOverride ?? timeline[timeline.length - 1].end;
  if (totalTime === 0) return null;

  /* ── Build enriched timeline (fill idle gaps) ── */
  const enriched = [];
  for (let i = 0; i < timeline.length; i++) {
    const seg = timeline[i];
    // Gap before this segment?
    const prevEnd = i === 0 ? 0 : timeline[i - 1].end;
    if (seg.start > prevEnd) {
      enriched.push({ pid: 'IDLE', start: prevEnd, end: seg.start, idle: true });
    }
    enriched.push(seg);
  }

  /* ── Time tick marks ── */
  // Aim for ~20 marks max; step up if too crowded
  const targetTicks = Math.min(totalTime + 1, 25);
  const step = Math.ceil(totalTime / (targetTicks - 1));
  const ticks = [];
  for (let t = 0; t <= totalTime; t += step) ticks.push(t);
  if (ticks[ticks.length - 1] !== totalTime) ticks.push(totalTime);

  const pct = (t) => `${((t / totalTime) * 100).toFixed(4)}%`;

  return (
    <div className="select-none">
      {/* Title bar */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-white tracking-wide">{title}</h4>
        <span className="text-[11px] text-slate-500 font-mono">
          Total: {totalTime} units · {timeline.filter(s => !s.idle).length} segment(s)
        </span>
      </div>

      {/* Scrollable Gantt area */}
      <div
        ref={containerRef}
        className="gantt-scroll overflow-x-auto pb-1"
      >
        <div style={{ minWidth: `${Math.max(totalTime * 32, 420)}px` }}>

          {/* Gantt bar */}
          <div className="relative flex h-11 rounded-lg overflow-hidden border border-slate-600/60 shadow-inner">
            {enriched.map((seg, idx) => {
              const w   = ((seg.end - seg.start) / totalTime) * 100;
              const bg  = seg.idle
                ? '#1e293b'
                : (processColors?.[seg.pid] ?? '#64748b');
              const dur = seg.end - seg.start;

              return (
                <div
                  key={idx}
                  onMouseEnter={(e) => setTooltip({ seg, x: e.clientX })}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    width: `${w}%`,
                    backgroundColor: bg,
                    borderRight: seg.idle ? 'none' : '1px solid rgba(0,0,0,0.25)',
                    transition: 'filter 0.1s',
                  }}
                  className="
                    relative flex items-center justify-center
                    text-white text-[10px] font-bold font-mono
                    cursor-default
                    hover:brightness-125
                  "
                >
                  {/* Label — only show when wide enough */}
                  {w > 4 && (
                    <span
                      className={`
                        truncate px-0.5 leading-none
                        ${seg.idle ? 'text-slate-600 italic' : 'drop-shadow-sm'}
                      `}
                      style={{ fontSize: w > 8 ? '10px' : '8px' }}
                    >
                      {seg.idle ? (w > 8 ? 'idle' : '') : seg.pid}
                    </span>
                  )}

                  {/* Context-switch marker (left border for non-first segments) */}
                  {!seg.idle && idx > 0 && !enriched[idx - 1].idle && (
                    <span
                      className="absolute left-0 top-0 h-full w-0.5 bg-white/20"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Time axis */}
          <div className="relative h-6 mt-0.5">
            {ticks.map(t => (
              <div
                key={t}
                style={{ left: pct(t) }}
                className="absolute flex flex-col items-center"
              >
                <div className="w-px h-1.5 bg-slate-600" />
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 -translate-x-1/2">
                  {t}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating tooltip */}
      {tooltip && (
        <div className="
          fixed z-50 px-3 py-2 rounded-lg
          bg-slate-900 border border-slate-600
          text-xs text-white font-mono shadow-xl
          pointer-events-none
        "
          style={{ top: '80px', right: '20px' }}
        >
          <p className="font-bold text-sm">{tooltip.seg.idle ? 'CPU Idle' : tooltip.seg.pid}</p>
          <p className="text-slate-400">
            [{tooltip.seg.start} → {tooltip.seg.end}]
            &nbsp;·&nbsp;{tooltip.seg.end - tooltip.seg.start} unit(s)
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-3">
        {Object.entries(processColors || {}).map(([pid, color]) => (
          <div key={pid} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-[11px] text-slate-400 font-mono">{pid}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-slate-800 border border-slate-700" />
          <span className="text-[11px] text-slate-500 italic">idle</span>
        </div>
      </div>
    </div>
  );
}
