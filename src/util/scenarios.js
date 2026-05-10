/**
 * Predefined Test Scenarios
 * ==========================
 *
 * A — Basic Mixed Workload
 *     Varied arrival and burst times; no extreme cases.
 *     Good baseline to see both algorithms at work.
 *
 * B — Priority vs Burst Conflict
 *     P1 has very high priority (1) but long burst.
 *     P2 has short burst but low priority (5).
 *     SJF will favour P2 early; Priority will keep P1 running — clear divergence.
 *
 * C — Starvation-Sensitive
 *     P2 is a long, low-priority process. A stream of short, high-priority
 *     processes keeps arriving, starving P2 under Priority Scheduling.
 *     SJF also penalises P2 due to its long burst, demonstrating SJF starvation.
 *
 * D — Validation Test (invalid data state)
 *     Loads invalid field values into the input form to trigger all validation
 *     error messages and demonstrate the error-handling UI.
 */

export const SCENARIOS = {
  A: {
    key: 'A',
    label: 'Scenario A',
    sublabel: 'Basic Mixed Workload',
    color: 'blue',
    description:
      'A representative workload with varied arrival and burst times. ' +
      'Use this as a baseline to compare how both algorithms handle a typical queue.',
    processes: [
      { id: 'P1', arrival: 0, burst: 8,  priority: 3 },
      { id: 'P2', arrival: 1, burst: 4,  priority: 2 },
      { id: 'P3', arrival: 2, burst: 9,  priority: 4 },
      { id: 'P4', arrival: 3, burst: 5,  priority: 1 },
      { id: 'P5', arrival: 4, burst: 2,  priority: 5 },
    ],
  },

  B: {
    key: 'B',
    label: 'Scenario B',
    sublabel: 'Priority ↔ Burst Conflict',
    color: 'amber',
    description:
      'P1 carries the highest priority (1) but the longest burst (10). ' +
      'P2 & P3 have short bursts but low priorities (4–5). ' +
      'SJF heavily favours the short-burst processes; Priority keeps P1 running — ' +
      'a textbook demonstration of the trade-off between efficiency and urgency.',
    processes: [
      { id: 'P1', arrival: 0, burst: 10, priority: 1 },
      { id: 'P2', arrival: 1, burst: 2,  priority: 5 },
      { id: 'P3', arrival: 2, burst: 3,  priority: 4 },
      { id: 'P4', arrival: 3, burst: 6,  priority: 2 },
      { id: 'P5', arrival: 5, burst: 1,  priority: 5 },
    ],
  },

  C: {
    key: 'C',
    label: 'Scenario C',
    sublabel: 'Starvation Sensitive',
    color: 'red',
    description:
      'P2 is a long-burst (15 units), low-priority (5) process. A stream of ' +
      'short, high-priority processes (P1, P3–P6) continuously preempt it. ' +
      'Under Priority Scheduling P2 is severely starved. ' +
      'Under SJF, P2 is also penalised but for different reasons (long burst). ' +
      'Compare the WT and RT of P2 across both algorithms.',
    processes: [
      { id: 'P1', arrival: 0, burst: 2,  priority: 2 },
      { id: 'P2', arrival: 0, burst: 15, priority: 5 },
      { id: 'P3', arrival: 1, burst: 2,  priority: 1 },
      { id: 'P4', arrival: 3, burst: 2,  priority: 2 },
      { id: 'P5', arrival: 5, burst: 3,  priority: 1 },
      { id: 'P6', arrival: 7, burst: 2,  priority: 3 },
    ],
  },

  D: {
    key: 'D',
    label: 'Scenario D',
    sublabel: 'Validation Test',
    color: 'rose',
    description:
      'Loads deliberately invalid field values into the Add-Process form to ' +
      'trigger all validation error messages. No simulation is run.',
    isValidationScenario: true,
    // These values are loaded directly into the form (not the process list)
    invalidForm: {
      id:       '',       // empty ID
      arrival:  '-3',     // negative arrival
      burst:    '0',      // zero burst (invalid)
      priority: '0',      // below minimum priority
    },
    processes: [], // no valid processes loaded
  },
};
