import { useState } from 'react';
import { useFmsStore } from './store/useFmsStore';
import { getActiveScreenLayout } from './pages/pageRegistry';
import { McduBezel } from './components/mcdu/McduBezel';
import {
  GuidedPreflightPanel,
  evaluateGuidedSteps,
} from './components/training/GuidedPreflightPanel';
import { InstructorFaultPanel } from './components/training/InstructorFaultPanel';
import { ScratchpadReferenceModal } from './components/training/ScratchpadReferenceModal';
import { BookOpen, Plane } from 'lucide-react';
import { McduPageId } from './types/fms';

const QUICK_PAGES: Array<{ id: McduPageId; sub: number; label: string }> = [
  { id: 'RADIO', sub: 1, label: 'RADIO' },
  { id: 'NAV_IDENT', sub: 1, label: 'NAV IDENT' },
  { id: 'POS_INIT', sub: 1, label: 'POS INIT' },
  { id: 'ACT_RTE', sub: 1, label: 'ACT RTE 1/3' },
  { id: 'ACT_RTE', sub: 2, label: 'ACT RTE 2/3' },
  { id: 'PERF_INIT', sub: 1, label: 'PERF INIT 1/3' },
  { id: 'PERF_INIT', sub: 2, label: 'PERF INIT 2/3' },
  { id: 'PERF_INIT', sub: 3, label: 'PERF INIT 3/3' },
  { id: 'TO_DATASET', sub: 1, label: 'T/O DATASET' },
  { id: 'TAKEOFF_INIT', sub: 1, label: 'TAKEOFF 1/2' },
  { id: 'TAKEOFF_VSPEEDS', sub: 1, label: 'VSPEEDS 2/2' },
  { id: 'ACTIVE_FLT_PLAN', sub: 1, label: 'FLT PLAN' },
  { id: 'PROGRESS', sub: 1, label: 'PROGRESS' },
  { id: 'HOLD', sub: 1, label: 'HOLD' },
];

export default function App() {
  const state = useFmsStore();
  const [syntaxModalOpen, setSyntaxModalOpen] = useState(false);

  const screenLayout = getActiveScreenLayout(state);
  const topAlertMessage = state.messages[0]?.text;

  const guidedSteps = evaluateGuidedSteps(state);
  const currentGuidedStep = guidedSteps.find((s) => !s.isComplete) ?? null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Cockpit Workstation Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center">
              <Plane className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wide text-slate-100">
                Embraer E195-E2 • Honeywell NG FMS MCDU Simulator (MC-860)
              </h1>
              <p className="text-[11px] text-slate-400">
                14×24 Character Avionics Display • Scratchpad Syntax Engine • Guided Preflight Trainer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSyntaxModalOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Scratchpad Syntax Guide
            </button>
          </div>
        </div>
      </header>

      {/* Quick Page Jump Strip */}
      <div className="border-b border-slate-900 bg-slate-950/90 px-4 py-1.5 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1 shrink-0">
            Quick Page:
          </span>
          {QUICK_PAGES.map((p) => {
            const isActive =
              state.activePage === p.id && state.subPageIndex === p.sub;
            return (
              <button
                key={`${p.id}-${p.sub}`}
                type="button"
                onClick={() => state.navigateToPage(p.id, p.sub)}
                className={`px-2 py-1 rounded text-[11px] font-mcdu shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split Workstation Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Physical Honeywell MC-860 MCDU Unit */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <McduBezel
            layout={screenLayout}
            scratchpadInput={state.scratchpadInput}
            topAlertMessage={topAlertMessage}
            hasActiveMessage={state.messages.length > 0}
            hasLateralOffset={Boolean(state.flightPlan.lateralOffset)}
            onLskPress={state.pressLsk}
            onFunctionKey={state.pressFunctionKey}
            onCharKey={state.typeScratchpadChar}
            onDelKey={state.pressDelKey}
            onClrKey={state.pressClrKey}
            onKnobRotate={state.rotateKnob}
            highlightedLsk={currentGuidedStep?.targetLsk ?? null}
            highlightedFunctionKey={currentGuidedStep?.targetFunctionKey ?? null}
          />
        </div>

        {/* Right Column: Guided Preflight & Instructor Fault Station */}
        <div className="lg:col-span-6 space-y-4">
          <GuidedPreflightPanel state={state} />
          <InstructorFaultPanel state={state} />
        </div>
      </main>

      {/* Scratchpad Syntax Reference Modal */}
      <ScratchpadReferenceModal
        isOpen={syntaxModalOpen}
        onClose={() => setSyntaxModalOpen(false)}
        onLoadExample={(example, page, subPage) => {
          state.navigateToPage(page, subPage);
          state.setScratchpadInput(example);
        }}
      />
    </div>
  );
}
