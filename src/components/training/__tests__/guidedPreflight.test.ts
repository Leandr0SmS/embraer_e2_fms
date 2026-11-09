import { describe, it, expect, beforeEach } from 'vitest';
import { useFmsStore } from '../../../store/useFmsStore';
import { evaluateGuidedSteps } from '../GuidedPreflightPanel';

describe('Guided Preflight Sequence & Instructor Fault Scenarios (Steps 10 & 17)', () => {
  beforeEach(() => {
    useFmsStore.getState().resetToColdPreflight();
  });

  it('completes the full Cold-to-Ready Guided Preflight workflow step-by-step', () => {
    const store = useFmsStore.getState();

    // Initially at Step 1 (RADIO page, 0 steps complete)
    let steps = evaluateGuidedSteps(useFmsStore.getState());
    expect(steps).toHaveLength(10);
    expect(steps.filter((s) => s.isComplete).length).toBe(0);

    // Step 1: Press NAV function key -> opens NAV IDENT 1/1
    store.pressFunctionKey('NAV');
    expect(useFmsStore.getState().activePage).toBe('NAV_IDENT');

    // Step 2: Press 6R (POS INIT>) then 3R (LOAD> GPS 1 POS)
    useFmsStore.getState().pressLsk('6R');
    expect(useFmsStore.getState().activePage).toBe('POS_INIT');
    useFmsStore.getState().pressLsk('3R');
    expect(useFmsStore.getState().positionInitialized).toBe(true);

    // Step 3: Press 6R (RTE>) -> opens ACT RTE 1/3
    useFmsStore.getState().pressLsk('6R');
    expect(useFmsStore.getState().activePage).toBe('ACT_RTE');

    // Step 4 & 5: Advance to ACT RTE 2/3, then press 6R (PERF INIT>)
    useFmsStore.getState().pressFunctionKey('NEXT');
    expect(useFmsStore.getState().subPageIndex).toBe(2);
    useFmsStore.getState().pressLsk('6R');
    expect(useFmsStore.getState().activePage).toBe('PERF_INIT');

    // Step 6: Advance to PERF INIT 2/3, enter CRZ ALT (280), ZFW (40000), CG (29.0), confirm (6L)
    useFmsStore.getState().pressLsk('6R');
    expect(useFmsStore.getState().subPageIndex).toBe(2);

    useFmsStore.getState().setScratchpadInput('280');
    useFmsStore.getState().pressLsk('1L');
    useFmsStore.getState().setScratchpadInput('40000');
    useFmsStore.getState().pressLsk('3R');
    useFmsStore.getState().setScratchpadInput('29.0');
    useFmsStore.getState().pressLsk('5L');
    useFmsStore.getState().pressLsk('6L'); // <CONFIRM INIT
    expect(useFmsStore.getState().perfInitConfirmed).toBe(true);

    // Step 7: Advance to PERF INIT 3/3, then push 6R (TO DATASET>)
    useFmsStore.getState().pressFunctionKey('NEXT');
    expect(useFmsStore.getState().subPageIndex).toBe(3);
    useFmsStore.getState().pressLsk('6R');
    expect(useFmsStore.getState().activePage).toBe('TO_DATASET');

    // Step 8: Push 5L (■ENTER) on T/O DATASET MENU 1/1, then 6R (FMS TAKEOFF>)
    useFmsStore.getState().pressLsk('5L');
    expect(useFmsStore.getState().toDataset.entered).toBe(true);
    useFmsStore.getState().pressLsk('6R');
    expect(useFmsStore.getState().activePage).toBe('TAKEOFF_INIT');

    // Step 9: Push 6R (NEXT PAGE>) -> TAKEOFF INIT 2/2, push 6R (TAKEOFF>)
    useFmsStore.getState().pressLsk('6R');
    expect(useFmsStore.getState().subPageIndex).toBe(2);
    useFmsStore.getState().pressLsk('6R');
    expect(useFmsStore.getState().activePage).toBe('TAKEOFF_VSPEEDS');

    // Step 10: Push 6R (DEP LIM>) -> opens DEPARTURE LIMIT 1/1, then push 6R (FLT PLAN>) -> completes preflight
    useFmsStore.getState().pressLsk('6R');
    expect(useFmsStore.getState().activePage).toBe('DEPARTURE_LIMIT');
    useFmsStore.getState().pressLsk('6R');
    expect(useFmsStore.getState().activePage).toBe('ACTIVE_FLT_PLAN');

    steps = evaluateGuidedSteps(useFmsStore.getState());
    expect(steps.every((s) => s.isComplete)).toBe(true);
  });

  it('loads LATAM (SBGR -> SBCF) and Honeywell (KPHX -> KMSP) official guide scenario presets', () => {
    const store = useFmsStore.getState();

    store.loadScenarioPreset('LATAM_SBGR_SBCF');
    let st = useFmsStore.getState();
    expect(st.flightPlan.origin).toBe('SBGR');
    expect(st.flightPlan.destination).toBe('SBCF');
    expect(st.flightPlan.alternate).toBe('SBGO');
    expect(st.flightPlan.runway).toBe('10R');
    expect(st.flightPlan.sid).toBe('OMNI');
    expect(st.toDataset.thrustRating).toBe('TO-3');

    store.loadScenarioPreset('HONEYWELL_KPHX_KMSP');
    st = useFmsStore.getState();
    expect(st.flightPlan.origin).toBe('KPHX');
    expect(st.flightPlan.destination).toBe('KMSP');
    expect(st.flightPlan.alternate).toBe('KDLH');
    expect(st.flightPlan.runway).toBe('08');
    expect(st.flightPlan.sid).toBe('SILOW4.RSK');
    expect(st.flightPlan.star).toBe('KASPR6.MCW');
    expect(st.flightPlan.approach).toBe('ILS 30L.HASTI');
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
