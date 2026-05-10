/**
 * Metrics Calculator
 * ==================
 * Given simulation output, computes per-process and average performance metrics.
 *
 * Formulas
 * --------
 *  CT  = Completion Time             (from scheduler output)
 *  TAT = CT  − Arrival Time          (total time in system)
 *  WT  = TAT − Burst Time            (time spent waiting)
 *  RT  = First CPU Time − Arrival    (latency to first response)
 *
 * All values are clamped to ≥ 0 to guard against floating-point edge cases.
 *
 * @param {Array}  processes        — original process list
 * @param {Object} completionTimes  — {pid: ct}
 * @param {Object} firstRun         — {pid: firstCpuTime}
 * @returns {{ metrics: Array, avgWT: number, avgTAT: number, avgRT: number }}
 */
export function calculateMetrics(processes, completionTimes, firstRun) {
  if (!processes || processes.length === 0) {
    return { metrics: [], avgWT: 0, avgTAT: 0, avgRT: 0 };
  }

  const metrics = processes.map(p => {
    const ct  = completionTimes[p.id] ?? 0;
    const tat = ct - p.arrival;
    const wt  = tat - p.burst;
    const rt  = (firstRun[p.id] ?? p.arrival) - p.arrival;

    return {
      id:       p.id,
      arrival:  p.arrival,
      burst:    p.burst,
      priority: p.priority,
      ct,
      tat: Math.max(0, tat),
      wt:  Math.max(0, wt),
      rt:  Math.max(0, rt),
    };
  });

  const len    = metrics.length;
  const avgWT  = metrics.reduce((s, m) => s + m.wt,  0) / len;
  const avgTAT = metrics.reduce((s, m) => s + m.tat, 0) / len;
  const avgRT  = metrics.reduce((s, m) => s + m.rt,  0) / len;

  return {
    metrics,
    avgWT:  parseFloat(avgWT.toFixed(2)),
    avgTAT: parseFloat(avgTAT.toFixed(2)),
    avgRT:  parseFloat(avgRT.toFixed(2)),
  };
}
