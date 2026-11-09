import React from 'react';
import { FmsStoreState } from '../../store/useFmsStore';
import { FmsFunctionKey, LskId } from '../../types/fms';
import { BookOpen, CheckCircle2, Circle, Compass, Play, RotateCcw, Sparkles } from 'lucide-react';

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
  const isLatam = state.flightPlan.destination === 'SBCF';
  const isHoneywell = state.flightPlan.origin === 'KPHX';

  const defaultCrzHint = isLatam ? '400' : isHoneywell ? '330' : '280';
  const defaultZfwHint = isLatam ? '40000' : isHoneywell ? '38500' : '40000';
  const defaultCgHint = isLatam ? '29.0' : isHoneywell ? '23.5' : '29.0';

  const step1Done = state.hasVerifiedNavIdent && state.activePage !== 'RADIO';
  const step2Done = state.positionInitialized;

  const pastRoutePages =
    state.activePage === 'PERF_INIT' ||
    state.activePage === 'TO_DATASET' ||
    state.activePage === 'TAKEOFF_INIT' ||
    state.activePage === 'TAKEOFF_VSPEEDS' ||
    state.activePage === 'DEPARTURE_LIMIT' ||
    state.activePage === 'ACTIVE_FLT_PLAN' ||
    state.perfInitConfirmed;

  const step3Done =
    step2Done &&
    Boolean(state.flightPlan.origin && state.flightPlan.destination) &&
    ((state.activePage === 'ACT_RTE' && state.subPageIndex >= 1) ||
      state.activePage.startsWith('DEPARTURE') ||
      pastRoutePages);

  const step4Done =
    step3Done &&
    Boolean(state.flightPlan.runway && state.flightPlan.sid) &&
    !state.activePage.startsWith('DEPARTURE') &&
    ((state.activePage === 'ACT_RTE' && state.subPageIndex >= 2) || pastRoutePages);

  const step5Done = step4Done && pastRoutePages;

  const step6Done =
    state.altitude.cruiseAltitudeFt !== null &&
    state.weights.zeroFuelWeight !== null &&
    state.weights.takeoffCg !== null &&
    state.perfInitConfirmed;

  const step7Done =
    step6Done &&
    (state.activePage === 'TO_DATASET' ||
      state.activePage === 'TAKEOFF_INIT' ||
      state.activePage === 'TAKEOFF_VSPEEDS' ||
      state.activePage === 'DEPARTURE_LIMIT' ||
      state.activePage === 'ACTIVE_FLT_PLAN' ||
      state.toDataset.entered);

  const step8Done =
    step6Done &&
    (state.activePage === 'TAKEOFF_INIT' ||
      state.activePage === 'TAKEOFF_VSPEEDS' ||
      state.activePage === 'DEPARTURE_LIMIT' ||
      state.activePage === 'ACTIVE_FLT_PLAN');

  const step9Done =
    step6Done &&
    (state.activePage === 'TAKEOFF_VSPEEDS' ||
      state.activePage === 'DEPARTURE_LIMIT' ||
      state.activePage === 'ACTIVE_FLT_PLAN');

  const step10Done =
    step6Done &&
    state.speeds.takeoffSpeeds.v1 !== null &&
    state.speeds.takeoffSpeeds.vr !== null &&
    state.speeds.takeoffSpeeds.v2 !== null &&
    state.activePage === 'ACTIVE_FLT_PLAN';

  // Step 4 instruction (ACT RTE 1/3 -> RTE 2/3 or DEPARTURE)
  let step4Instruction =
    'Verify ORIGIN, DEST, ALTN DEST, and RWY/SID on ACT RTE 1/3, then press NEXT (or LSK 6R DEPARTURE>) to review RTE 2/3.';
  let step4Lsk: LskId | undefined = undefined;
  let step4FnKey: FmsFunctionKey | undefined = 'NEXT';
  if (state.activePage === 'POS_INIT') {
    step4Instruction = 'Push LSK 6R (RTE>) to advance to ACT RTE 1/3.';
    step4Lsk = '6R';
    step4FnKey = undefined;
  }

  // Step 5 instruction (RTE 2/3 & ALTN RTE 3/3 -> PERF INIT)
  let step5Instruction =
    'Review VIA/TO legs on ACT RTE 2/3 and ALTN RTE 3/3, then push LSK 6R (PERF INIT>) to open PERFORMANCE INIT-KG 1/3.';
  let step5Lsk: LskId | undefined = '6R';
  let step5FnKey: FmsFunctionKey | undefined = undefined;
  if (state.activePage === 'ACT_RTE' && state.subPageIndex === 2 && state.modFlightPlan) {
    step5Instruction = 'Push LSK 6R (ACTIVATE>) to activate the modified route.';
    step5Lsk = '6R';
  }

  // Step 6 instruction (PERF INIT 1/3 & 2/3)
  let step6Instruction = `Enter CRZ ALT (${defaultCrzHint} -> 1L), ZFW (${defaultZfwHint} -> 3R), TO CG (${defaultCgHint} -> 5L), then push 6L (<CONFIRM INIT).`;
  let step6Lsk: LskId = '6L';
  let step6Hint: string | undefined;

  if (state.activePage === 'PERF_INIT' && state.subPageIndex === 1) {
    step6Instruction = 'Verify tail/fuel on PERFORMANCE INIT-KG 1/3 and push LSK 6R (NEXT PAGE>) to open 2/3.';
    step6Lsk = '6R';
  } else if (state.altitude.cruiseAltitudeFt === null) {
    step6Instruction = `Type ${defaultCrzHint} into scratchpad and push LSK 1L to set Cruise Altitude FL${defaultCrzHint}.`;
    step6Lsk = '1L';
    step6Hint = defaultCrzHint;
  } else if (state.weights.zeroFuelWeight === null) {
    step6Instruction = `Type ${defaultZfwHint} into scratchpad and push LSK 3R to set Zero Fuel Weight (${defaultZfwHint} KG).`;
    step6Lsk = '3R';
    step6Hint = defaultZfwHint;
  } else if (state.weights.takeoffCg === null) {
    step6Instruction = `Type ${defaultCgHint} into scratchpad and push LSK 5L to set Takeoff CG (${defaultCgHint}% MAC).`;
    step6Lsk = '5L';
    step6Hint = defaultCgHint;
  } else if (!state.perfInitConfirmed) {
    step6Instruction = 'Push LSK 6L (<CONFIRM INIT) to confirm performance initialization.';
    step6Lsk = '6L';
  }

  // Step 7 instruction (PERF INIT 3/3 -> TO DATASET)
  let step7Instruction = 'Push NEXT to open PERFORMANCE INIT-KG 3/3, verify COST INDEX (4L), then push LSK 6R (TO DATASET>).';
  let step7Lsk: LskId | undefined = '6R';
  let step7FnKey: FmsFunctionKey | undefined = undefined;
  if (state.activePage === 'PERF_INIT' && state.subPageIndex < 3) {
    step7Instruction = 'Press NEXT key to advance from PERFORMANCE INIT-KG 2/3 to 3/3.';
    step7Lsk = undefined;
    step7FnKey = 'NEXT';
  }

  // Step 8 instruction (T/O DATASET MENU 1/1)
  let step8Instruction =
    'Verify Thrust Rating (*TO-1..3), TO TEMP, and FLEX T/O on T/O DATASET MENU 1/1, push LSK 5L (■ENTER), then push LSK 6R (FMS TAKEOFF>).';
  let step8Lsk: LskId = !state.toDataset.entered ? '5L' : '6R';

  // Step 9 instruction (TAKEOFF INIT 1/2 & 2/2)
  let step9Instruction =
    state.activePage === 'TAKEOFF_INIT' && state.subPageIndex === 1
      ? 'Verify RWY Wind Components (4R) and RWY Condition (4L) on TAKEOFF INIT 1/2, then push LSK 6R (NEXT PAGE>).'
      : 'Verify TAKEOFF FLAPS (1R) and Thrust Mode on TAKEOFF INIT 2/2, then push LSK 6R (TAKEOFF>).';
  let step9Lsk: LskId = '6R';

  // Step 10 instruction (TAKEOFF 1/1 -> DEPARTURE LIMIT -> ACTIVE FLT PLAN)
  let step10Instruction =
    state.activePage === 'TAKEOFF_VSPEEDS'
      ? 'Verify V1, VR, V2, VFS, and TO PITCH on TAKEOFF 1/1, then push LSK 6R (DEP LIM>) to review Departure Limits.'
      : 'Verify SPEED LIMIT (250/10000), AFE LIMIT (1500), and VNAV CAP AFE (1000) on DEPARTURE LIMIT 1/1, then push LSK 6R (FLT PLAN>).';
  let step10Lsk: LskId = '6R';

  return [
    {
      id: 1,
      title: '1. Avionics Power & NAV IDENT',
      pageLabel: 'RADIO -> NAV IDENT 1/1',
      instruction:
        'From RADIO 1/1, press NAV (or LSK 6R NAV IDENT>) to open NAV IDENT 1/1 and verify ACTIVE NDB & SW NG 1.0.',
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
      title: '3. Route Origin / Dest / Alternate',
      pageLabel: 'ACT RTE 1/3',
      instruction: 'Push LSK 6R (RTE>) from POSITION INIT 1/1 to open ACT RTE 1/3.',
      targetLsk: '6R',
      isComplete: step3Done,
    },
    {
      id: 4,
      title: '4. Departure Runway & SID',
      pageLabel: 'ACT RTE 1/3 -> DEPARTURE',
      instruction: step4Instruction,
      targetLsk: step4Lsk,
      targetFunctionKey: step4FnKey,
      isComplete: step4Done,
    },
    {
      id: 5,
      title: '5. Enroute Airways & Alternate',
      pageLabel: 'ACT RTE 2/3 & ALTN 3/3',
      instruction: step5Instruction,
      targetLsk: step5Lsk,
      targetFunctionKey: step5FnKey,
      isComplete: step5Done,
    },
    {
      id: 6,
      title: '6. Performance Init & Weights',
      pageLabel: 'PERF INIT-KG 1/3 & 2/3',
      instruction: step6Instruction,
      scratchpadHint: step6Hint,
      targetLsk: step6Lsk,
      isComplete: step6Done,
    },
    {
      id: 7,
      title: '7. Speeds & Cost Index',
      pageLabel: 'PERF INIT-KG 3/3',
      instruction: step7Instruction,
      targetLsk: step7Lsk,
      targetFunctionKey: step7FnKey,
      isComplete: step7Done,
    },
    {
      id: 8,
      title: '8. T/O Dataset Menu',
      pageLabel: 'T/O DATASET MENU 1/1',
      instruction: step8Instruction,
      targetLsk: step8Lsk,
      isComplete: step8Done,
    },
    {
      id: 9,
      title: '9. Takeoff Init & Flaps',
      pageLabel: 'TAKEOFF INIT 1/2 & 2/2',
      instruction: step9Instruction,
      targetLsk: step9Lsk,
      isComplete: step9Done,
    },
    {
      id: 10,
      title: '10. V-Speeds, Dep Limit & Flight Plan',
      pageLabel: 'TAKEOFF 1/1 -> DEP LIM -> FPL',
      instruction: step10Instruction,
      targetLsk: step10Lsk,
      isComplete: step10Done,
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
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Guided Preflight Initialization Sequence
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Authentic Honeywell NG FMS 10-step flow ({completedCount}/{steps.length} complete) —{' '}
            <span className="text-cyan-300 font-semibold">
              {state.flightPlan.origin} → {state.flightPlan.destination} (ALTN {state.flightPlan.alternate})
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => state.loadScenarioPreset('LATAM_SBGR_SBCF')}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/60 flex items-center gap-1 cursor-pointer"
            title="Load LATAM E195 Guia Rápido Scenario (SBGR -> SBCF, ALTN SBGO)"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            LATAM (SBGR→SBCF)
          </button>
          <button
            type="button"
            onClick={() => state.loadScenarioPreset('HONEYWELL_KPHX_KMSP')}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-sky-950/80 hover:bg-sky-900 text-sky-200 border border-sky-700/60 flex items-center gap-1 cursor-pointer"
            title="Load Honeywell E2 Pilot's Guide Scenario (KPHX -> KMSP, ALTN KDLH)"
          >
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            Honeywell (KPHX→KMSP)
          </button>
          <button
            type="button"
            onClick={() => state.resetToColdPreflight()}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 cursor-pointer"
            title="Reset FMS to Cold & Dark Power-Up on RADIO page"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            Cold Reset
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
            Preflight Initialization Complete — Ready for Departure ({state.flightPlan.origin} {state.flightPlan.runway})
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
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
              <div className="flex items-center gap-2 min-w-0">
                {step.isComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Circle
                    className={`w-4 h-4 shrink-0 ${
                      isCurrent ? 'text-amber-400' : 'text-slate-600'
                    }`}
                  />
                )}
                <span className="font-medium truncate">{step.title}</span>
              </div>
              <span className="font-mcdu text-[10px] text-cyan-400/80 shrink-0 ml-2">
                {step.pageLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
