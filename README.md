# SJF vs Priority Scheduling Comparison — Academic OS Project

> **Preemptive Shortest Job First (SRTF) vs Preemptive Priority Scheduling**  
> A fully interactive, browser-based CPU scheduling simulator built with React.js and Tailwind CSS.

---

## Table of Contents

1. [Quick Start / Run Instructions](#1-quick-start--run-instructions)
2. [Project Structure](#2-project-structure)
3. [Feature Overview](#3-feature-overview)
4. [Algorithm Specification](#4-algorithm-specification)
5. [Metrics Definitions](#5-metrics-definitions)
6. [Predefined Scenarios](#6-predefined-scenarios)
7. [Academic Analysis (Viva Preparation)](#7-academic-analysis-viva-preparation)
8. [Design Decisions & Trade-offs](#8-design-decisions--trade-offs)

---

## 1. Quick Start / Run Instructions

### Prerequisites

| Tool    | Version  |
|---------|----------|
| Node.js | ≥ 18.x   |
| npm     | ≥ 9.x    |

### Installation & Run

```bash
# 1. Clone or extract the project
git clone <repo-url>
cd sjf-priority-scheduler

# 2. Install dependencies
npm install

# 3. Start development server (hot-reload)
npm run dev
# → Open http://localhost:5173 in your browser

# 4. Build for production
npm run build

# 5. Preview production build
npm run preview
```

### One-liner (copy-paste)
```bash
npm install && npm run dev
```

---

## 2. Project Structure

```
sjf-priority-scheduler/
├── index.html                  # Vite HTML entry point
├── package.json                # Dependencies & scripts
├── vite.config.js              # Vite bundler configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS / Autoprefixer
│
└── src/
    ├── main.jsx                # React DOM entry
    ├── App.jsx                 # Root component & orchestration
    ├── index.css               # Tailwind directives + custom CSS
    │
    ├── model/
    │   └── Process.js          # Immutable Process data class
    │
    ├── scheduler/
    │   ├── sjfLogic.js         # Preemptive SJF (SRTF) engine
    │   └── priorityLogic.js    # Preemptive Priority engine
    │
    ├── metrics/
    │   └── calculator.js       # WT / TAT / RT calculation
    │
    ├── util/
    │   ├── scenarios.js        # Hardcoded scenarios A–D
    │   └── validators.js       # Form & list validation rules
    │
    └── gui/
        └── components/
            ├── ScenarioButtons.jsx   # Load-scenario UI
            ├── InputPanel.jsx        # Process add/remove form
            ├── GanttChart.jsx        # Animated timeline bar
            └── ResultTable.jsx       # WT/TAT/RT table
```

### Module Responsibilities

| Module | Responsibility |
|--------|---------------|
| `model/Process.js` | Single source of truth for the Process shape; immutable via `Object.freeze`. |
| `scheduler/sjfLogic.js` | Pure function: `processes[] → {timeline, completionTimes, firstRun}` |
| `scheduler/priorityLogic.js` | Same signature, different selection criterion (priority number). |
| `metrics/calculator.js` | Pure function: converts raw scheduler output into human-readable metrics. |
| `util/validators.js` | Stateless validators; returns error dictionaries keyed by field name. |
| `util/scenarios.js` | Declarative data file; zero logic, zero side-effects. |
| `gui/components/*` | Pure presentational components; all state lives in `App.jsx`. |
| `App.jsx` | Coordinates state, calls schedulers, aggregates results. |

---

## 3. Feature Overview

| Feature | Details |
|---------|---------|
| **Process Input** | Add processes with ID, Arrival, Burst, Priority; remove individually |
| **Real-time Validation** | Inline field errors on blur and on submit; covers all edge cases from Scenario D |
| **Scenario Loader** | 4 one-click scenarios (A–D); Scenario D injects invalid data for validation demo |
| **Simulation Engine** | Tick-by-tick simulation; O(n²) per run — negligible for ≤ 50 processes |
| **Gantt Charts** | Proportional-width bar with idle gap detection, time axis, hover tooltips, legend |
| **Results Tables** | Per-process CT/TAT/WT/RT; average row; best-value highlights in green |
| **Comparison Summary** | Dynamic text: efficiency vs. urgency trade-off, starvation victims, scenario insight |
| **Reset** | In-place state clear — no page reload required |
| **Responsive UI** | Mobile-first Tailwind layout; stacks to single column on small screens |

---

## 4. Algorithm Specification

### 4.1 Preemptive SJF — Shortest Remaining Time First (SRTF)

```
At each time unit t:
  ready_queue = { p | p.arrival ≤ t AND remaining[p] > 0 }

  if ready_queue is empty:
      mark CPU idle; fast-forward to next arrival

  selected = argmin_{p ∈ ready_queue} remaining[p]
             tie-break: argmin arrival_time  (FCFS)

  remaining[selected]--
  t++

  if remaining[selected] == 0:
      completionTime[selected] = t
```

**Key property:** SRTF is **provably optimal** for minimising average waiting time among all preemptive scheduling algorithms on a single CPU (Theorem: SRTF is optimal, Kleinrock 1964).

**Context switch cost:** Assumed 0 (as specified). In real systems, each preemption adds cache-flush overhead; frequent preemption degrades throughput.

### 4.2 Preemptive Priority Scheduling

```
At each time unit t:
  ready_queue = { p | p.arrival ≤ t AND remaining[p] > 0 }

  if ready_queue is empty:
      mark CPU idle; fast-forward to next arrival

  selected = argmin_{p ∈ ready_queue} p.priority    (lower # = higher urgency)
             tie-break: argmin arrival_time  (FCFS)

  remaining[selected]--
  t++

  if remaining[selected] == 0:
      completionTime[selected] = t
```

**Convention used throughout this project:** `priority = 1` is the most urgent; larger integers are less urgent.

### 4.3 Tie-Breaking Rule

Both algorithms use **FCFS** (First Come, First Served) as a tie-breaker: when two processes have equal remaining burst (SJF) or equal priority (Priority), the one with the **earlier arrival time** is selected first.

---

## 5. Metrics Definitions

| Metric | Formula | Meaning |
|--------|---------|---------|
| **CT** (Completion Time) | Recorded by scheduler | Wall-clock time when process exits CPU for the last time |
| **TAT** (Turnaround Time) | `CT − Arrival` | Total time from submission to completion |
| **WT** (Waiting Time) | `TAT − Burst` | Time spent in ready queue (not running) |
| **RT** (Response Time) | `FirstCPU − Arrival` | Time from arrival to first CPU assignment |
| **Avg WT** | `ΣWT / n` | Primary efficiency metric for comparison |
| **Avg TAT** | `ΣTAT / n` | End-to-end throughput metric |
| **Avg RT** | `ΣRT / n` | Interactivity / responsiveness metric |

> **Note:** For non-preemptive algorithms, RT = WT. For preemptive algorithms, RT ≤ WT.

---

## 6. Predefined Scenarios

### Scenario A — Basic Mixed Workload

| PID | Arrival | Burst | Priority |
|-----|---------|-------|----------|
| P1  | 0       | 8     | 3        |
| P2  | 1       | 4     | 2        |
| P3  | 2       | 9     | 4        |
| P4  | 3       | 5     | 1        |
| P5  | 4       | 2     | 5        |

**Purpose:** Baseline comparison. Both algorithms are exercised on a representative mixed workload. P5 (shortest burst, lowest priority) demonstrates the key divergence: SJF services P5 almost immediately; Priority delays P5 until all higher-priority processes finish.

---

### Scenario B — Priority vs Burst Conflict

| PID | Arrival | Burst | Priority |
|-----|---------|-------|----------|
| P1  | 0       | 10    | 1        |
| P2  | 1       | 2     | 5        |
| P3  | 2       | 3     | 4        |
| P4  | 3       | 6     | 2        |
| P5  | 5       | 1     | 5        |

**Purpose:** Maximum divergence scenario. P1 monopolises the CPU under Priority (never preempted — it always has the highest priority). Under SJF, P1 is preempted immediately as P2, P3, P5 arrive with shorter remaining bursts. Avg WT under SJF should be significantly lower than under Priority.

---

### Scenario C — Starvation Sensitive

| PID | Arrival | Burst | Priority |
|-----|---------|-------|----------|
| P1  | 0       | 2     | 2        |
| P2  | 0       | 15    | 5        |
| P3  | 1       | 2     | 1        |
| P4  | 3       | 2     | 2        |
| P5  | 5       | 3     | 1        |
| P6  | 7       | 2     | 3        |

**Purpose:** P2 (burst=15, priority=5) is the starvation victim. Under Priority Scheduling, the incoming stream of high-priority short processes continuously preempts P2, pushing its WT to a severe level. Under SJF, P2 is also penalised (long burst), but the penalty is less extreme because SJF doesn't completely ignore burst time. This scenario directly motivates the need for **aging** in real operating systems.

---

### Scenario D — Validation Test

**Purpose:** Loads the input form with deliberately invalid values:

| Field    | Invalid Value | Error Triggered                          |
|----------|---------------|------------------------------------------|
| ID       | *(empty)*     | "Process ID cannot be empty"             |
| Arrival  | `-3`          | "Arrival time cannot be negative"        |
| Burst    | `0`           | "Burst time must be greater than 0"      |
| Priority | `0`           | "Priority must be ≥ 1"                   |

No simulation is run for Scenario D. It solely demonstrates the validation layer.

---

## 7. Academic Analysis (Viva Preparation)

### Q1: Why is SRTF optimal for average waiting time?

**Answer:** SRTF is an instance of the **Preemptive Shortest Job First** policy. The optimality proof (by contradiction) proceeds as follows: assume a schedule S is optimal and does not follow SRTF at some point t. Then there exist two processes i and j in the ready queue where remaining[i] < remaining[j] but j is running. Swapping i and j at t reduces the waiting time of i by (remaining[i] served earlier) without increasing the total work done. By induction, any departure from "always run the shortest remaining" can be improved — therefore SRTF is optimal for Avg WT on a single CPU.

### Q2: What is the starvation problem in Priority Scheduling and how is it solved?

**Answer:** Starvation occurs when a process with low priority is perpetually preempted by arriving high-priority processes and never gets to run. The standard OS solution is **aging**: every T time units that a process waits without running, its effective priority is increased by 1 (making it more urgent). Eventually the process reaches the highest priority and gets scheduled. Linux implements this via the "nice" adjustment and the Completely Fair Scheduler's virtual runtime mechanism.

### Q3: Why does SJF require knowledge of burst times, and how does a real OS estimate them?

**Answer:** The classic SJF algorithm is theoretically non-clairvoyant — it requires knowing future CPU burst lengths in advance, which is impossible in practice. Real systems use **exponential averaging (τ̂ₙ₊₁ = α·tₙ + (1−α)·τ̂ₙ)** to predict the next burst based on historical burst durations. The parameter α ∈ [0,1] controls how much weight is given to recent history vs. the long-run average. In simulation (as in this project), exact burst times are given as inputs — a deliberate simplification.

### Q4: What is the difference between Waiting Time and Response Time?

**Answer:**
- **Response Time** measures the delay from a process's arrival to the first time it receives the CPU. This is the critical metric for interactive systems — a user should not wait long for any visible response.
- **Waiting Time** measures the total time a process spends in the ready queue across its entire lifetime (including re-queuing after preemptions). WT = TAT − Burst.

For non-preemptive algorithms, RT = WT (the first run is also the only run from the queue). For preemptive algorithms, RT ≤ WT because the process might get a brief initial response and then be preempted many times before completing.

### Q5: When should you choose Priority over SJF in a real system?

**Answer:** Priority scheduling is essential when:

1. **Hard real-time tasks** exist (interrupt service routines, sensor polling, safety-critical control loops) that must meet deadlines regardless of burst length.
2. **OS-level tasks** must preempt user tasks (kernel threads, I/O completion handlers, timer events).
3. **Service differentiation** is required (premium vs. standard user tasks in cloud systems).

SJF is preferred for:
1. **Batch processing** where all jobs have similar urgency and minimising total queue time is the goal.
2. **Throughput optimisation** — SJF provably maximises the number of processes completing per unit time.
3. **Homogeneous workloads** with predictable burst distributions.

### Q6: What is the time complexity of your simulation?

**Answer:** The tick-by-tick simulation runs in **O(T·n)** where T is the total CPU time (sum of all bursts) and n is the number of processes. At each tick, the ready queue is sorted in O(n log n). The overall complexity is **O(T·n log n)**. For the problem sizes in this project (≤ 50 processes, bursts ≤ 500), this is negligible — runs in microseconds in JavaScript.

### Q7: Explain the Gantt chart construction. How are context switches detected?

**Answer:** The scheduler runs tick by tick, maintaining a `currentPid` variable and a `segStart` timestamp. A context switch is detected whenever the selected process differs from `currentPid`. On switch: push `{pid: currentPid, start: segStart, end: t}` to the timeline, then reset `currentPid` and `segStart`. When a process completes, its segment is also pushed and `currentPid` is set to null. Idle gaps (no process in ready queue) are detected in the Gantt Chart component by comparing consecutive segments' `start` and `end` values and rendering a grey "idle" block for any gap.

### Q8: How does FCFS tie-breaking affect results?

**Answer:** FCFS tie-breaking ensures **deterministic, reproducible** results when two processes have identical selection criteria. Without tie-breaking, the simulation would be non-deterministic (dependent on array ordering), making academic comparison impossible. In Scenario A, P1 and P4 might tie on remaining burst at certain points — FCFS selects P1 (earlier arrival) consistently, ensuring the Gantt chart is reproducible across runs.

---

## 8. Design Decisions & Trade-offs

| Decision | Rationale |
|----------|-----------|
| Tick-by-tick simulation (not event-driven) | Simplest correctness guarantee; event-driven would be faster but harder to verify |
| Immutable `Process` objects | Prevents accidental mutation of input data from affecting the scheduler output |
| Pure scheduler functions | Testable without React; can be imported into any JS environment or test runner |
| Separated `metrics/calculator.js` | Decouples data collection (scheduler) from analysis (metrics); follows SRP |
| No external chart libraries | Academic requirement; Gantt chart built entirely from CSS flexbox proportional widths |
| Context switch cost = 0 | Stated assumption; code can be extended by adding `contextSwitchCost` parameter to schedulers |
| Tailwind CSS | Utility-first; no custom CSS for layout; responsive breakpoints handled declaratively |

---

## Running Tests (Optional)

No test framework is included by default. To add Vitest:

```bash
npm install -D vitest
```

Example unit test for the SJF logic:

```js
// src/scheduler/__tests__/sjf.test.js
import { describe, it, expect } from 'vitest';
import { runSJF } from '../sjfLogic.js';

describe('runSJF', () => {
  it('handles single process', () => {
    const result = runSJF([{ id: 'P1', arrival: 0, burst: 5, priority: 1 }]);
    expect(result.completionTimes['P1']).toBe(5);
    expect(result.firstRun['P1']).toBe(0);
  });

  it('preempts longer job when shorter arrives', () => {
    const procs = [
      { id: 'P1', arrival: 0, burst: 5, priority: 1 },
      { id: 'P2', arrival: 1, burst: 1, priority: 2 },
    ];
    const result = runSJF(procs);
    // P2 should complete at t=3, P1 at t=6
    expect(result.completionTimes['P2']).toBe(3);
    expect(result.completionTimes['P1']).toBe(6);
  });
});
```

---

## License

Academic use only. Not licensed for commercial distribution.
