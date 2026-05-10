import React from 'react';
import { SCENARIOS } from '../../util/scenarios.js';

const COLOR_MAP = {
  blue:  { btn: 'bg-blue-600/20 hover:bg-blue-600/40 border-blue-500/50 text-blue-300',  badge: 'bg-blue-500'  },
  amber: { btn: 'bg-amber-600/20 hover:bg-amber-600/40 border-amber-500/50 text-amber-300', badge: 'bg-amber-500' },
  red:   { btn: 'bg-red-600/20 hover:bg-red-600/40 border-red-500/50 text-red-300',     badge: 'bg-red-500'   },
  rose:  { btn: 'bg-rose-600/20 hover:bg-rose-600/40 border-rose-500/50 text-rose-300', badge: 'bg-rose-500'  },
};

/**
 * ScenarioButtons
 * ----------------
 * Renders four load-scenario buttons (A–D) with a description tooltip region.
 *
 * Props
 *  onLoad(scenarioKey)  — called when user clicks a scenario button
 *  activeScenario       — key of currently active scenario (or null)
 */
export default function ScenarioButtons({ onLoad, activeScenario }) {
  const [hovered, setHovered] = React.useState(null);
  const displayKey = hovered || activeScenario;
  const displayScenario = displayKey ? SCENARIOS[displayKey] : null;

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Predefined Scenarios
        </span>
        <div className="flex-1 h-px bg-slate-700" />
      </div>

      {/* Buttons row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {Object.values(SCENARIOS).map(sc => {
          const colors = COLOR_MAP[sc.color] || COLOR_MAP.blue;
          const isActive = activeScenario === sc.key;
          return (
            <button
              key={sc.key}
              onClick={() => onLoad(sc.key)}
              onMouseEnter={() => setHovered(sc.key)}
              onMouseLeave={() => setHovered(null)}
              className={`
                relative flex flex-col items-start gap-1 px-4 py-3
                border rounded-xl cursor-pointer transition-all duration-200
                ${colors.btn}
                ${isActive ? 'ring-2 ring-offset-2 ring-offset-slate-800 ring-current' : ''}
              `}
            >
              {/* Active badge */}
              {isActive && (
                <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${colors.badge}`} />
              )}
              <span className="text-sm font-bold tracking-wide">{sc.label}</span>
              <span className="text-[11px] opacity-70 leading-tight text-left">
                {sc.sublabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Description panel */}
      <div
        className={`
          overflow-hidden transition-all duration-300
          ${displayScenario ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        {displayScenario && (
          <div className="bg-slate-900/60 border border-slate-700 rounded-lg px-4 py-3">
            <p className="text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-white">{displayScenario.label} — </span>
              {displayScenario.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
