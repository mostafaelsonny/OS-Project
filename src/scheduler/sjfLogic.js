/**
 * Preemptive SJF — Shortest Remaining Time First (SRTF)
 * ========================================================
 * At every discrete time unit:
 *  1. Build the ready queue: all arrived processes with remaining burst > 0.
 *  2. Select the process with the MINIMUM remaining burst time.
 *  3. Tie-break: lowest Arrival Time (FCFS).
 *  4. Execute for exactly 1 unit; decrement remaining burst.
 *  5. On context switch, close the current timeline segment and open a new one.
 *
 * Returns
 * -------
 *  timeline        — [{pid, start, end}, …]  (merged contiguous runs)
 *  completionTimes — {pid: completionTime, …}
 *  firstRun        — {pid: firstCpuTime, …}  (used for Response Time)
 */
export function runSJF(processes) {
  if (!processes || processes.length === 0) {
    return { timeline: [], completionTimes: {}, firstRun: {} };
  }

  /* ── Initialise ── */
  const remaining      = {};   // remaining burst per process
  const firstRun       = {};   // first time each process touched the CPU
  const completionTimes = {};  // when each process finished

  for (const p of processes) {
    remaining[p.id] = p.burst;
  }

  let time      = 0;
  let completed = 0;
  const n       = processes.length;
  const timeline = [];

  // Running segment tracking
  let currentPid = null;
  let segStart   = 0;

  // Safety upper-bound: sum of all bursts + max arrival (avoids infinite loop on bugs)
  const maxTime =
    processes.reduce((s, p) => s + p.burst, 0) +
    Math.max(...processes.map(p => p.arrival)) + 1;

  /* ── Main simulation loop ── */
  while (completed < n && time <= maxTime) {
    // Processes that have arrived and still need CPU time
    const ready = processes.filter(
      p => p.arrival <= time && remaining[p.id] > 0
    );

    if (ready.length === 0) {
      // CPU idle — close any open segment, advance clock
      if (currentPid !== null) {
        timeline.push({ pid: currentPid, start: segStart, end: time, idle: false });
        currentPid = null;
      }
      // Record an idle block so Gantt chart can show gaps
      const idleStart = time;
      // fast-forward to the next arrival
      const nextArrival = processes
        .filter(p => p.arrival > time && remaining[p.id] > 0)
        .reduce((mn, p) => Math.min(mn, p.arrival), Infinity);
      if (nextArrival === Infinity) break;
      timeline.push({ pid: 'IDLE', start: idleStart, end: nextArrival, idle: true });
      time = nextArrival;
      continue;
    }

    // Sort: shortest remaining first; FCFS (arrival) on tie
    ready.sort((a, b) => {
      const d = remaining[a.id] - remaining[b.id];
      return d !== 0 ? d : a.arrival - b.arrival;
    });

    const sel = ready[0];

    // First time this process gets the CPU → record for RT
    if (firstRun[sel.id] === undefined) {
      firstRun[sel.id] = time;
    }

    // Context switch?
    if (currentPid !== sel.id) {
      if (currentPid !== null) {
        timeline.push({ pid: currentPid, start: segStart, end: time, idle: false });
      }
      currentPid = sel.id;
      segStart   = time;
    }

    // Execute for 1 unit
    remaining[sel.id]--;
    time++;

    // Process finished?
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
