/**
 * Preemptive Priority Scheduling
 * ================================
 * At every discrete time unit:
 *  1. Build the ready queue: all arrived processes with remaining burst > 0.
 *  2. Select the process with the LOWEST priority number (highest urgency).
 *  3. Tie-break: lowest Arrival Time (FCFS).
 *  4. Execute for exactly 1 unit; decrement remaining burst.
 *  5. On context switch, close the current timeline segment and open a new one.
 *
 * Convention: priority 1 is the most urgent; larger numbers are less urgent.
 * This is the standard used throughout this project.
 *
 * Returns
 * -------
 *  timeline        — [{pid, start, end}, …]  (merged contiguous runs)
 *  completionTimes — {pid: completionTime, …}
 *  firstRun        — {pid: firstCpuTime, …}  (used for Response Time)
 */
export function runPriority(processes) {
  if (!processes || processes.length === 0) {
    return { timeline: [], completionTimes: {}, firstRun: {} };
  }

  /* ── Initialise ── */
  const remaining       = {};
  const firstRun        = {};
  const completionTimes = {};

  for (const p of processes) {
    remaining[p.id] = p.burst;
  }

  let time      = 0;
  let completed = 0;
  const n       = processes.length;
  const timeline = [];

  let currentPid = null;
  let segStart   = 0;

  const maxTime =
    processes.reduce((s, p) => s + p.burst, 0) +
    Math.max(...processes.map(p => p.arrival)) + 1;

  /* ── Main simulation loop ── */
  while (completed < n && time <= maxTime) {
    const ready = processes.filter(
      p => p.arrival <= time && remaining[p.id] > 0
    );

    if (ready.length === 0) {
      if (currentPid !== null) {
        timeline.push({ pid: currentPid, start: segStart, end: time, idle: false });
        currentPid = null;
      }
      const idleStart = time;
      const nextArrival = processes
        .filter(p => p.arrival > time && remaining[p.id] > 0)
        .reduce((mn, p) => Math.min(mn, p.arrival), Infinity);
      if (nextArrival === Infinity) break;
      timeline.push({ pid: 'IDLE', start: idleStart, end: nextArrival, idle: true });
      time = nextArrival;
      continue;
    }

    // Sort: lowest priority number first (highest urgency); FCFS on tie
    ready.sort((a, b) => {
      const d = a.priority - b.priority;
      return d !== 0 ? d : a.arrival - b.arrival;
    });

    const sel = ready[0];

    if (firstRun[sel.id] === undefined) {
      firstRun[sel.id] = time;
    }

    if (currentPid !== sel.id) {
      if (currentPid !== null) {
        timeline.push({ pid: currentPid, start: segStart, end: time, idle: false });
      }
      currentPid = sel.id;
      segStart   = time;
    }

    remaining[sel.id]--;
    time++;

    if (remaining[sel.id] === 0) {
      completionTimes[sel.id] = time;
      completed++;
      timeline.push({ pid: sel.id, start: segStart, end: time, idle: false });
      currentPid = null;
      segStart   = time;
    }
  }

  return { timeline, completionTimes, firstRun };
}
