import React, { useState, useMemo, useCallback, useRef } from 'react';
import { runSJF }      from './scheduler/sjfLogic.js';
import { runPriority } from './scheduler/priorityLogic.js';
import { calculateMetrics } from './metrics/calculator.js';
import { validateProcessList } from './util/validators.js';
import { SCENARIOS } from './util/scenarios.js';

import ScenarioButtons from './gui/components/ScenarioButtons.jsx';
import InputPanel      from './gui/components/InputPanel.jsx';
import GanttChart      from './gui/components/GanttChart.jsx';
import ResultTable     from './gui/components/ResultTable.jsx';

/* ─── Process colour palette ─── */
const PALETTE = [
  '#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6',
  '#ec4899','#06b6d4','#f97316','#6366f1','#14b8a6',
  '#84cc16','#e879f9','#fb923c','#22d3ee','#a78bfa',
];

const buildColorMap = (processes) => {
  const map = {};
  processes.forEach((p, i) => {
    map[p.id] = PALETTE[i % PALETTE.length];
  });
  return map;
};

/* ─── Comparison text generator ─── */
function buildComparison(sjfResult, priResult, processes) {
  if (!sjfResult || !priResult) return null;

  const sjf = sjfResult.metrics;
  const pri = priResult.metrics;

  const betterWTAlgo  = sjfResult.avgWT <= priResult.avgWT ? 'SJF (SRTF)' : 'Priority';
  const betterRTAlgo  = sjfResult.avgRT <= priResult.avgRT ? 'SJF (SRTF)' : 'Priority';
  const wtDiff        = Math.abs(sjfResult.avgWT  - priResult.avgWT).toFixed(2);
  const rtDiff        = Math.abs(sjfResult.avgRT  - priResult.avgRT).toFixed(2);

  // Find starvation victim: largest WT under priority
  const maxPriWT  = Math.max(...pri.map(m => m.wt));
  const maxSjfWT  = Math.max(...sjf.map(m => m.wt));
  const starvPri  = pri.find(m => m.wt === maxPriWT);
  const starvSjf  = sjf.find(m => m.wt === maxSjfWT);

  // Process with widest WT divergence between algos
  const divergence = processes.map(p => {
    const s = sjf.find(m => m.id === p.id);
    const r = pri.find(m => m.id === p.id);
    return { id: p.id, diff: Math.abs((s?.wt ?? 0) - (r?.wt ?? 0)) };
  }).sort((a, b) => b.diff - a.diff);

  return {
    betterWTAlgo, betterRTAlgo, wtDiff, rtDiff,
    starvPri, starvSjf, divergence,
    sjfAvgWT:  sjfResult.avgWT,
    priAvgWT:  priResult.avgWT,
    sjfAvgRT:  sjfResult.avgRT,
    priAvgRT:  priResult.avgRT,
    sjfAvgTAT: sjfResult.avgTAT,
    priAvgTAT: priResult.avgTAT,
  };
}

/* ══════════════════════════════════════════════════
   ROOT COMPONENT
══════════════════════════════════════════════════ */
export default function App() {
  const [processes,        setProcesses]        = useState([]);
  const [sjfResult,        setSjfResult]        = useState(null);
  const [priResult,        setPriResult]        = useState(null);
  const [simError,         setSimError]         = useState('');
  const [activeScenario,   setActiveScenario]   = useState(null);
  const [externalFormData, setExternalFormData] = useState(null);
  const [hasSimulated,     setHasSimulated]     = useState(false);

  const resultsRef = useRef(null);

  /* Colour map — recalculated whenever process list changes */
  const colorMap = useMemo(() => buildColorMap(processes), [processes]);

  /* Comparison data — only when both results exist */
  const comparison = useMemo(
    () => buildComparison(sjfResult, priResult, processes),
    [sjfResult, priResult, processes]
  );

  /* ── Add / Remove ── */
  const handleAddProcess = useCallback((proc) => {
    setProcesses(prev => [...prev, proc]);
    setSimError('');
  }, []);

  const handleRemoveProcess = useCallback((id) => {
    setProcesses(prev => prev.filter(p => p.id !== id));
    setSjfResult(null);
    setPriResult(null);
    setHasSimulated(false);
  }, []);

  /* ── Simulate ── */
  const handleSimulate = useCallback(() => {
    const listError = validateProcessList(processes);
    if (listError) {
      setSimError(listError);
      return;
    }
    setSimError('');

    const { timeline: sjfTL, completionTimes: sjfCT, firstRun: sjfFR } = runSJF(processes);
    const { timeline: priTL, completionTimes: priCT, firstRun: priFR } = runPriority(processes);

    const sjfMetrics = calculateMetrics(processes, sjfCT, sjfFR);
    const priMetrics = calculateMetrics(processes, priCT, priFR);

    setSjfResult({ timeline: sjfTL, ...sjfMetrics });
    setPriResult({ timeline: priTL, ...priMetrics });
    setHasSimulated(true);

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [processes]);

  /* ── Reset ── */
  const handleReset = useCallback(() => {
    setProcesses([]);
    setSjfResult(null);
    setPriResult(null);
    setSimError('');
    setActiveScenario(null);
    setExternalFormData(null);
    setHasSimulated(false);
  }, []);

  /* ── Load Scenario ── */
  const handleLoadScenario = useCallback((key) => {
    const sc = SCENARIOS[key];
    if (!sc) return;

    // Always reset simulation output
    setSjfResult(null);
    setPriResult(null);
    setSimError('');
    setHasSimulated(false);
    setActiveScenario(key);

    if (sc.isValidationScenario) {
      // Scenario D: inject invalid values into the form, clear processes
      setProcesses([]);
      setExternalFormData(sc.invalidForm);
    } else {
      setProcesses([...sc.processes]);
      setExternalFormData(null);
    }
  }, []);

  /* ──────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">

      {/* ═══ HEADER ═══ */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚙️</span>
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
                  CPU Scheduling Simulator
                </h1>
                <p className="text-[11px] text-slate-400 tracking-widest uppercase">
                  Preemptive SJF (SRTF) &nbsp;·&nbsp; Preemptive Priority &nbsp;·&nbsp; OS Academic Project
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
            <span className="hidden sm:inline">Priority: lower # = higher urgency</span>
            <span className="inline-flex items-center px-2 py-1 bg-slate-800 rounded border border-slate-700">
              v1.0
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ═══ SCENARIO BUTTONS ═══ */}
        <section>
          <ScenarioButtons
            onLoad={handleLoadScenario}
            activeScenario={activeScenario}
          />
        </section>

        {/* ═══ INPUT PANEL ═══ */}
        <section>
          <InputPanel
            processes={processes}
            onAddProcess={handleAddProcess}
            onRemoveProcess={handleRemoveProcess}
            externalFormData={externalFormData}
            onFormDataConsumed={() => setExternalFormData(null)}
            processColors={colorMap}
          />
        </section>

        {/* ═══ SCENARIO D notice ═══ */}
        {activeScenario === 'D' && (
          <div className="animate-fade-in bg-rose-950/40 border border-rose-700/50 rounded-xl px-5 py-4">
            <p className="text-sm text-rose-300 font-semibold mb-1">
              🧪 Validation Test (Scenario D) — Active
            </p>
            <p className="text-xs text-rose-400/80">
              The form above has been pre-filled with intentionally invalid values
              (empty ID, negative arrival, zero burst, priority &lt; 1).
              Observe how each field shows a targeted error message. This
              demonstrates the validation layer that prevents corrupted data from
              reaching the scheduling engine.
            </p>
          </div>
        )}

        {/* ═══ ACTION BUTTONS ═══ */}
        <section className="flex flex-wrap gap-3">
          <button
            onClick={handleSimulate}
            disabled={processes.length < 2}
            className="
              flex-1 sm:flex-none px-8 py-3 rounded-xl font-bold text-sm
              bg-gradient-to-r from-blue-600 to-indigo-600
              hover:from-blue-500 hover:to-indigo-500
              disabled:opacity-40 disabled:cursor-not-allowed
              active:scale-95 transition-all duration-150 shadow-lg
              flex items-center justify-center gap-2
            "
          >
            <span>▶</span> Run Simulation
          </button>
          <button
            onClick={handleReset}
            className="
              flex-1 sm:flex-none px-8 py-3 rounded-xl font-bold text-sm
              bg-slate-700 hover:bg-slate-600 active:bg-slate-800
              transition-colors duration-150 border border-slate-600
              flex items-center justify-center gap-2
            "
          >
            <span>↺</span> Reset All
          </button>
        </section>

        {/* Simulation list-level error */}
        {simError && (
          <div className="animate-fade-in bg-red-950/50 border border-red-700/60 rounded-xl px-5 py-3 flex items-start gap-3">
            <span className="text-red-400 text-lg mt-0.5">⚠</span>
            <p className="text-sm text-red-300">{simError}</p>
          </div>
        )}

        {/* ═══ RESULTS ═══ */}
        {hasSimulated && sjfResult && priResult && (
          <div ref={resultsRef} className="animate-slide-up space-y-6">

            {/* Section heading */}
            <div className="flex items-center gap-3 pt-2">
              <h2 className="text-lg font-extrabold text-white tracking-tight">
                Simulation Results
              </h2>
              <div className="flex-1 h-px bg-slate-700" />
              <span className="text-xs text-slate-500 font-mono">
                {processes.length} process{processes.length !== 1 ? 'es' : ''}
              </span>
            </div>

            {/* ─ Two-column layout (stacks on mobile) ─ */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

              {/* ── SJF Column ── */}
              <div className="bg-slate-800/50 border border-blue-900/40 rounded-2xl p-5 space-y-5">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600/20 text-blue-400 border border-blue-600/30 tracking-wider uppercase">
                    SJF — SRTF
                  </span>
                  <div className="flex-1 h-px bg-slate-700/60" />
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500">Avg WT: </span>
                    <span className="text-sm font-bold font-mono text-blue-400">{sjfResult.avgWT}</span>
                  </div>
                </div>

                {/* SJF Gantt */}
                <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50">
                  <GanttChart
                    timeline={sjfResult.timeline}
                    title="Preemptive SJF — Gantt Chart"
                    processColors={colorMap}
                  />
                </div>

                {/* SJF Table */}
                <ResultTable
                  metrics={sjfResult.metrics}
                  avgWT={sjfResult.avgWT}
                  avgTAT={sjfResult.avgTAT}
                  avgRT={sjfResult.avgRT}
                  processColors={colorMap}
                  highlightBest={true}
                />
              </div>

              {/* ── Priority Column ── */}
              <div className="bg-slate-800/50 border border-purple-900/40 rounded-2xl p-5 space-y-5">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-600/20 text-purple-400 border border-purple-600/30 tracking-wider uppercase">
                    Priority — Preemptive
                  </span>
                  <div className="flex-1 h-px bg-slate-700/60" />
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500">Avg WT: </span>
                    <span className="text-sm font-bold font-mono text-purple-400">{priResult.avgWT}</span>
                  </div>
                </div>

                {/* Priority Gantt */}
                <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50">
                  <GanttChart
                    timeline={priResult.timeline}
                    title="Preemptive Priority — Gantt Chart"
                    processColors={colorMap}
                  />
                </div>

                {/* Priority Table */}
                <ResultTable
                  metrics={priResult.metrics}
                  avgWT={priResult.avgWT}
                  avgTAT={priResult.avgTAT}
                  avgRT={priResult.avgRT}
                  processColors={colorMap}
                  highlightBest={true}
                />
              </div>
            </div>

            {/* ═══ COMPARISON SUMMARY ═══ */}
            {comparison && (
              <ComparisonSummary
                c={comparison}
                sjfResult={sjfResult}
                priResult={priResult}
                activeScenario={activeScenario}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-16 py-6 text-center text-xs text-slate-600">
        SJF vs Priority Scheduling · Academic OS Project ·
        Preemptive algorithms with FCFS tie-breaking · Context switch = 0
      </footer>
    </div>
  );
}

/* ════════════════════════════════════════════════
   COMPARISON SUMMARY COMPONENT (inline, self-contained)
════════════════════════════════════════════════ */
function ComparisonSummary({ c, sjfResult, priResult, activeScenario }) {
  const sjfWins = c.sjfAvgWT < c.priAvgWT;
  const priWins = c.priAvgWT < c.sjfAvgWT;
  const tie     = c.sjfAvgWT === c.priAvgWT;

  const scenarioInsights = {
    A: 'Scenario A (Mixed Workload): Both algorithms handle the varied queue reasonably. SJF tends to process shorter jobs earlier, producing a lower average WT. Priority scheduling respects urgency at the cost of some efficiency.',
    B: 'Scenario B (Conflict): This is the canonical divergence scenario. SJF will continuously preempt the long P1 in favour of short P2/P3 bursts, yielding lower average WT. Priority scheduling locks P1 onto the CPU (highest urgency = lowest number), causing P2/P3 to wait significantly longer.',
    C: 'Scenario C (Starvation): P2 (burst=15, priority=5) is the starvation victim. Under Priority Scheduling, the stream of incoming high-priority processes starves P2 for a prolonged period — its Waiting Time will be dramatically high compared to SJF. Under SJF, P2 is penalised by its long burst but eventually runs once the shorter processes complete. This scenario clearly illustrates why aging/priority boosting is needed in real OSes.',
    D: null,
  };

  return (
    <div className="animate-fade-in bg-slate-800/60 border border-slate-600/50 rounded-2xl p-6 space-y-6">

      {/* Heading */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-extrabold text-white tracking-tight">
          📊 Comparison Summary & Conclusion
        </h2>
        <div className="flex-1 h-px bg-slate-700" />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Avg Waiting Time',
            sjf: c.sjfAvgWT,
            pri: c.priAvgWT,
            unit: 'units',
            winner: sjfWins ? 'SJF' : priWins ? 'Priority' : 'Tie',
          },
          {
            label: 'Avg Turnaround Time',
            sjf: c.sjfAvgTAT,
            pri: c.priAvgTAT,
            unit: 'units',
            winner: c.sjfAvgTAT < c.priAvgTAT ? 'SJF' : c.priAvgTAT < c.sjfAvgTAT ? 'Priority' : 'Tie',
          },
          {
            label: 'Avg Response Time',
            sjf: c.sjfAvgRT,
            pri: c.priAvgRT,
            unit: 'units',
            winner: c.sjfAvgRT < c.priAvgRT ? 'SJF' : c.priAvgRT < c.sjfAvgRT ? 'Priority' : 'Tie',
          },
        ].map((card, i) => (
          <div key={i} className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">{card.label}</p>
            <div className="flex gap-3 mb-2">
              <div>
                <p className="text-[10px] text-blue-400 mb-0.5">SJF</p>
                <p className="font-mono font-bold text-white">{card.sjf}</p>
              </div>
              <div className="w-px bg-slate-700" />
              <div>
                <p className="text-[10px] text-purple-400 mb-0.5">Priority</p>
                <p className="font-mono font-bold text-white">{card.pri}</p>
              </div>
            </div>
            <span className={`
              inline-block px-2 py-0.5 rounded-full text-[10px] font-bold
              ${card.winner === 'SJF'      ? 'bg-blue-600/30 text-blue-300' :
                card.winner === 'Priority' ? 'bg-purple-600/30 text-purple-300' :
                'bg-slate-600/30 text-slate-400'}
            `}>
              {card.winner === 'Tie' ? '= Tie' : `✓ ${card.winner} wins`}
            </span>
          </div>
        ))}
      </div>

      {/* Analysis text */}
      <div className="space-y-4 text-sm text-slate-300 leading-relaxed">

        {/* Overall verdict */}
        <div className={`
          rounded-xl p-4 border
          ${sjfWins ? 'bg-blue-950/40 border-blue-700/40' :
            priWins  ? 'bg-purple-950/40 border-purple-700/40' :
            'bg-slate-800 border-slate-700'}
        `}>
          {tie ? (
            <p>
              <strong className="text-white">Both algorithms performed equally</strong> on this
              workload (Avg WT = {c.sjfAvgWT}). This typically happens when priorities
              correlate with burst lengths — the two selection criteria converge on the same ordering.
            </p>
          ) : (
            <p>
              <strong className={sjfWins ? 'text-blue-300' : 'text-purple-300'}>
                {sjfWins ? 'Preemptive SJF (SRTF)' : 'Preemptive Priority'} achieved a lower
                average Waiting Time
              </strong>
              {' '}({sjfWins ? c.sjfAvgWT : c.priAvgWT} vs {sjfWins ? c.priAvgWT : c.sjfAvgWT} units —
              a difference of {c.wtDiff} units).{' '}
              {sjfWins
                ? 'SJF optimises throughput by always running the shortest available job, minimising the total time processes spend in the ready queue.'
                : 'Priority scheduling happened to align with shorter bursts in this workload, resulting in high-urgency tasks also being efficient to run.'}
            </p>
          )}
        </div>

        {/* Trade-off analysis */}
        <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-700/40 space-y-3">
          <p className="font-semibold text-white">Core Trade-off: Efficiency vs. Urgency</p>
          <p>
            <span className="text-blue-400 font-semibold">Preemptive SJF</span> is provably optimal
            for minimising average waiting time among all non-clairvoyant preemptive algorithms.
            It continuously favours shorter remaining bursts, ensuring fast turnaround for small jobs.
            However, it <em>ignores process urgency</em> — a critical real-time task with a
            long burst may be preempted by trivial background work.
          </p>
          <p>
            <span className="text-purple-400 font-semibold">Preemptive Priority</span> enforces
            urgency contracts — mission-critical processes (priority = 1) always preempt lower-priority
            work regardless of burst length. This guarantees responsiveness for high-priority tasks
            at the potential cost of global efficiency. It directly models real-OS constructs like
            interrupt handlers, kernel threads, and real-time scheduling classes.
          </p>
        </div>

        {/* Starvation analysis */}
        <div className="bg-amber-950/30 rounded-xl p-4 border border-amber-700/30 space-y-2">
          <p className="font-semibold text-amber-300">⚠ Starvation Risk</p>
          <p>
            <span className="text-amber-400 font-semibold">Under Priority Scheduling:</span>{' '}
            process <strong className="text-white">{c.starvPri?.id}</strong> experienced the
            highest waiting time ({c.starvPri?.wt} units).
            If high-priority processes keep arriving, low-priority processes may
            wait <em>indefinitely</em>. Real OSes mitigate this with{' '}
            <strong className="text-amber-200">aging</strong> — incrementally raising a
            process's priority the longer it waits.
          </p>
          <p>
            <span className="text-amber-400 font-semibold">Under SJF:</span>{' '}
            process <strong className="text-white">{c.starvSjf?.id}</strong> had the highest
            waiting time ({c.starvSjf?.wt} units).
            Long-burst processes can starve if a continuous stream of short jobs arrives —
            a known weakness addressed in practice by{' '}
            <strong className="text-amber-200">Round-Robin</strong> or burst-estimate aging.
          </p>
          {c.divergence[0]?.diff > 0 && (
            <p className="text-xs text-amber-600">
              Largest single-process WT divergence between algorithms:{' '}
              <span className="font-mono text-amber-400 font-bold">{c.divergence[0].id}</span>
              {' '}(Δ {c.divergence[0].diff} units)
            </p>
          )}
        </div>

        {/* Scenario-specific insight */}
        {activeScenario && scenarioInsights[activeScenario] && (
          <div className="bg-emerald-950/30 rounded-xl p-4 border border-emerald-700/30">
            <p className="font-semibold text-emerald-400 mb-1">Scenario-Specific Insight</p>
            <p>{scenarioInsights[activeScenario]}</p>
          </div>
        )}

        {/* Final conclusion */}
        <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-600/50">
          <p className="font-semibold text-white mb-1">Final Conclusion</p>
          <p>
            Neither algorithm dominates unconditionally. <strong className="text-blue-300">SJF/SRTF</strong>{' '}
            should be preferred when minimising average waiting time is the primary goal and no
            urgency ordering exists among processes (e.g. batch systems).{' '}
            <strong className="text-purple-300">Preemptive Priority</strong> is essential for
            real-time and interactive systems where certain tasks carry hard deadlines or urgency
            requirements that must not be violated.
            In practice, modern schedulers (Linux CFS, Windows priority classes) combine both
            concepts: a base priority for urgency, and within the same priority level, a
            fairness/quantum mechanism to prevent starvation of longer jobs.
          </p>
        </div>
      </div>
    </div>
  );
}
