import React from 'react';
import { FmsStoreState } from '../../store/useFmsStore';
import { FmsFunctionKey, LskId } from '../../types/fms';
import { CheckCircle2, Circle, Play, RotateCcw, Sparkles } from 'lucide-react';

export interface GuidedStepStatus {
  id: number;
  title: string;
  pageLabel: string;
  instruction: string;
  scratchpadHint?: string;
  targetLsk?: LskId;
  targetFunctionKey?: FmsFunctionKey;
  isComplete: boolean;
}

export function evaluateGuidedSteps(state: FmsStoreState): GuidedStepStatus[] {
  const step1Done = state.hasVerifiedNavIdent && state.activePage !== 'RADIO';
  const step2Done = state.positionInitialized;
  const step3Done =
    step2Done &&
    Boolean(state.flightPlan.origin && state.flightPlan.destination && state.flightPlan.runway);
  const step4Done =
    step3Done &&
    (state.activePage === 'PERF_INIT' ||
      state.activePage === 'TAKEOFF_INIT' ||
      state.activePage === 'TAKEOFF_VSPEEDS' ||
      state.activePage === 'ACTIVE_FLT_PLAN' ||
      state.perfInitConfirmed);
  const step5Done =
    state.altitude.cruiseAltitudeFt !== null &&
    state.weights.zeroFuelWeight !== null &&
    state.weights.takeoffCg !== null &&
    state.perfInitConfirmed;
  const step6Done =
    step5Done &&
    (state.activePage === 'TAKEOFF_INIT' ||
      state.activePage === 'TAKEOFF_VSPEEDS' ||
      state.activePage === 'ACTIVE_FLT_PLAN');
  const step7Done =
    step5Done &&
    state.speeds.takeoffSpeeds.v1 !== null &&
    state.speeds.takeoffSpeeds.vr !== null &&
    state.speeds.takeoffSpeeds.v2 !== null &&
    state.activePage === 'ACTIVE_FLT_PLAN';

  // Determine fine-grained next action on PERF INIT 2/3
  let step5Instruction = 'Enter CRZ ALT (280 -> 1L), ZFW (37.6 -> 2R), TAKEOFF CG (24.5 -> 4L), then push 6L (<CONFIRM INIT).';
  let step5Lsk: LskId = '6L';
  let step5Hint: string | undefined;

  if (state.activePage === 'PERF_INIT' && state.subPageIndex === 1) {
    step5Instruction = 'Push LSK 6R (NEXT PAGE>) or NEXT key to open PERFORMANCE INIT 2/3.';
    step5Lsk = '6R';
  } else if (state.altitude.cruiseAltitudeFt === null) {
    step5Instruction = 'Type 280 into scratchpad and push LSK 1L to set Cruise Altitude FL280.';
    step5Lsk = '1L';
    step5Hint = '280';
  } else if (state.weights.zeroFuelWeight === null) {
    step5Instruction = 'Type 37.6 into scratchpad and push LSK 2R to initialize Zero Fuel Weight.';
    step5Lsk = '2R';
    step5Hint = '37.6';
  } else if (state.weights.takeoffCg === null) {
    step5Instruction = 'Type 24.5 into scratchpad and push LSK 4L to set Takeoff CG (24.5% MAC).';
    step5Lsk = '4L';
    step5Hint = '24.5';
  } else if (!state.perfInitConfirmed) {
    step5Instruction = 'Push LSK 6L (<CONFIRM INIT) to confirm performance initialization.';
    step5Lsk = '6L';
  }

  return [
    {
      id: 1,
      title: '1. Avionics Power & NAV IDENT',
      pageLabel: 'RADIO -> NAV IDENT 1/1',
      instruction:
        'From RADIO 1/1, press any FMS function key (e.g. NAV) or LSK 6R to open NAV IDENT 1/1 and verify AIRAC 2405 currency.',
      targetFunctionKey: 'NAV',
      targetLsk: '6R',
      isComplete: step1Done,
    },
    {
      id: 2,
      title: '2. Position Initialization',
      pageLabel: 'POSITION INIT 1/1',
      instruction:
        state.activePage === 'NAV_IDENT'
          ? 'Push LSK 6R (POS INIT>) to transition to POSITION INIT 1/1.'
          : 'Push LSK 3R (LOAD>) to load GPS 1 POS coordinates into the FMS.',
      targetLsk: state.activePage === 'NAV_IDENT' ? '6R' : '3R',
      isComplete: step2Done,
    },
    {
      id: 3,
      title: '3. Active Route Setup',
      pageLabel: 'ACT RTE 1/3',
      instruction:
        state.activePage === 'POS_INIT'
          ? 'Push LSK 6R (RTE>) to advance to ACT RTE 1/3.'
          : 'Verify ORIGIN (SBGR), DEST (SBRJ), RWY (09L), and CO ROUTE (GRUJSD01), then push LSK 6L (<PERF INIT).',
      targetLsk: state.activePage === 'POS_INIT' ? '6R' : '6L',
      isComplete: step4Done,
    },
    {
      id: 4,
      title: '4. Performance Init & Weights',
      pageLabel: 'PERFORMANCE INIT 1/3 & 2/3',
      instruction: step5Instruction,
      scratchpadHint: step5Hint,
      targetLsk: step5Lsk,
      isComplete: step5Done,
    },
    {
      id: 5,
      title: '5. Takeoff Initialization',
      pageLabel: 'TAKEOFF INIT 1/2',
      instruction:
        state.activePage !== 'TAKEOFF_INIT'
          ? 'Push LSK 6R (TAKEOFF INIT>) on PERF INIT 2/3 to open TAKEOFF INIT 1/2.'
          : 'Verify RWY 09L HDG/ELEV (093°/2459FT) and TAKEOFF GW, then push LSK 6R (TAKEOFF VSPEEDS>).',
      targetLsk: '6R',
      isComplete:
        step5Done &&
        (state.activePage === 'TAKEOFF_VSPEEDS' ||
          state.activePage === 'ACTIVE_FLT_PLAN'),
    },
    {
      id: 6,
      title: '6. Takeoff V-Speeds & Flap',
      pageLabel: 'TAKEOFF VSPEEDS 2/2',
      instruction:
        'Verify V1 (134 KT), VR (138 KT), V2 (142 KT), VFS (182 KT) and FLAP 2, then push LSK 6R (ACTIVE FLT PLAN>) to complete preflight.',
      targetLsk: '6R',
      isComplete: step7Done,
    },
  ];
}

interface GuidedPreflightPanelProps {
  state: FmsStoreState;
}

export const GuidedPreflightPanel: React.FC<GuidedPreflightPanelProps> = ({
  state,
}) => {
  const steps = evaluateGuidedSteps(state);
  const currentStep = steps.find((s) => !s.isComplete) ?? null;
  const completedCount = steps.filter((s) => s.isComplete).length;

  const handleAutoExecuteStep = () => {
    if (!currentStep) return;
    if (currentStep.scratchpadHint && state.scratchpadInput !== currentStep.scratchpadHint) {
      state.setScratchpadInput(currentStep.scratchpadHint);
      if (currentStep.targetLsk) {
        state.pressLsk(currentStep.targetLsk);
      }
      return;
    }
    if (currentStep.targetLsk) {
      state.pressLsk(currentStep.targetLsk);
    } else if (currentStep.targetFunctionKey) {
      state.pressFunctionKey(currentStep.targetFunctionKey);
    }
  };

  return (
    <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Guided Preflight Initialization Sequence
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Standard Honeywell NG FMS cockpit flow ({completedCount}/{steps.length} complete)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => state.resetToColdPreflight()}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            title="Reset FMS to Cold & Dark Power-Up on RADIO page"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            Start Cold Flow
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3.5">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>

      {/* Active Step Callout Box */}
      {currentStep ? (
        <div className="mb-3.5 p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/40 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                NEXT ACTION
              </span>
              <span className="text-xs font-bold text-cyan-300">
                {currentStep.title}
              </span>
            </div>
            <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">
              {currentStep.instruction}
            </p>
          </div>

          <button
            type="button"
            onClick={handleAutoExecuteStep}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 shadow cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Do Step
          </button>
        </div>
      ) : (
        <div className="mb-3.5 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            Preflight Initialization Complete — Ready for Departure (SBGR 09L)
          </div>
          <button
            type="button"
            onClick={() => state.resetToColdPreflight()}
            className="text-xs text-emerald-300 underline cursor-pointer"
          >
            Restart Flow
          </button>
        </div>
      )}

      {/* Checklist Steps */}
      <div className="space-y-1.5">
        {steps.map((step) => {
          const isCurrent = currentStep?.id === step.id;
          return (
            <div
              key={step.id}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs border transition-colors ${
                step.isComplete
                  ? 'bg-slate-900/50 border-slate-800/80 text-slate-400'
                  : isCurrent
                    ? 'bg-slate-800/90 border-amber-500/50 text-slate-100'
                    : 'bg-slate-900/30 border-slate-800/50 text-slate-500'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {step.isComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Circle
                    className={`w-4 h-4 shrink-0 ${
                      isCurrent ? 'text-amber-400' : 'text-slate-600'
                    }`}
                  />
                )}
                <span className="font-medium">{step.title}</span>
              </div>
              <span className="font-mcdu text-[10px] text-cyan-400/80">
                {step.pageLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
