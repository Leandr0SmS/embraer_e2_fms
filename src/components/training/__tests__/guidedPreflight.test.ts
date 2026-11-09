import { describe, it, expect, beforeEach } from 'vitest';
import { useFmsStore } from '../../../store/useFmsStore';
import { evaluateGuidedSteps } from '../GuidedPreflightPanel';

describe('Guided Preflight Sequence & Instructor Fault Scenarios (Step 10)', () => {
  beforeEach(() => {
    useFmsStore.getState().resetToColdPreflight();
  });

  it('completes the full Cold-to-Ready Guided Preflight workflow step-by-step', () => {
    const store = useFmsStore.getState();

    // Initially at Step 1 (RADIO page, 0 steps complete)
    let steps = evaluateGuidedSteps(useFmsStore.getState());
    expect(steps.filter((s) => s.isComplete).length).toBe(0);

    // Step 1: Press NAV function key -> opens NAV IDENT 1/1
    store.pressFunctionKey('NAV');
    expect(useFmsStore.getState().activePage).toBe('NAV_IDENT');

    // Step 2: Press 6R (POS INIT>) then 3R (LOAD> GPS 1 POS)
    useFmsStore.getState().pressLsk('6R');
    expect(useFmsStore.getState().activePage).toBe('POS_INIT');
    useFmsStore.getState().pressLsk('3R');
    expect(useFmsStore.getState().positionInitialized).toBe(true);

    // Step 3: Press 6R (RTE>) -> opens ACT RTE 1/3, then 6L (<PERF INIT)
    useFmsStore.getState().pressLsk('6R');
    expect(useFmsStore.getState().activePage).toBe('ACT_RTE');
    useFmsStore.getState().pressLsk('6L');
    expect(useFmsStore.getState().activePage).toBe('PERF_INIT');

    // Step 4: Advance to PERF INIT 2/3, enter CRZ ALT (280), ZFW (37.6), CG (24.5), confirm (6L)
    useFmsStore.getState().pressLsk('6R');
    expect(useFmsStore.getState().subPageIndex).toBe(2);

    useFmsStore.getState().setScratchpadInput('280');
    useFmsStore.getState().pressLsk('1L');
    useFmsStore.getState().setScratchpadInput('37.6');
    useFmsStore.getState().pressLsk('2R');
    useFmsStore.getState().setScratchpadInput('24.5');
    useFmsStore.getState().pressLsk('4L');
    useFmsStore.getState().pressLsk('6L'); // <CONFIRM INIT
    expect(useFmsStore.getState().perfInitConfirmed).toBe(true);

    // Step 5: Push 6R (TAKEOFF INIT>) -> opens TAKEOFF INIT 1/2, push 6R (NEXT PAGE>) -> 2/2, push 6R (TAKEOFF>)
    useFmsStore.getState().pressLsk('6R');
    expect(useFmsStore.getState().activePage).toBe('TAKEOFF_INIT');
    useFmsStore.getState().pressLsk('6R');
    expect(useFmsStore.getState().subPageIndex).toBe(2);
    useFmsStore.getState().pressLsk('6R');
    expect(useFmsStore.getState().activePage).toBe('TAKEOFF_VSPEEDS');

    // Step 6: Push 6R (DEP LIM>) -> opens DEPARTURE LIMIT 1/1, then push 6R (FLT PLAN>) -> completes preflight
    useFmsStore.getState().pressLsk('6R');
    expect(useFmsStore.getState().activePage).toBe('DEPARTURE_LIMIT');
    useFmsStore.getState().pressLsk('6R');
    expect(useFmsStore.getState().activePage).toBe('ACTIVE_FLT_PLAN');

    steps = evaluateGuidedSteps(useFmsStore.getState());
    expect(steps.every((s) => s.isComplete)).toBe(true);
  });

  it('injects and recovers from Route Discontinuity fault using DEL key', () => {
    const store = useFmsStore.getState();
    store.resetToInitializedPreflight();
    store.injectFaultScenario('ROUTE_DISCONTINUITY');

    expect(useFmsStore.getState().flightPlan.waypoints[2].type).toBe('DISCONTINUITY');
    expect(useFmsStore.getState().messages[0]?.text).toBe('ROUTE DISCONTINUITY');

    // Clear alert message, press DEL, and up-select to 3L to remove discontinuity
    useFmsStore.getState().pressClrKey();
    useFmsStore.getState().pressDelKey();
    useFmsStore.getState().pressLsk('3L'); // Removes discontinuity in MOD plan
    useFmsStore.getState().pressLsk('6L'); // <ACTIVATE MOD plan

    expect(
      useFmsStore
        .getState()
        .flightPlan.waypoints.some((w) => w.type === 'DISCONTINUITY')
    ).toBe(false);
  });
});
