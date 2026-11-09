import { describe, it, expect, beforeEach } from 'vitest';
import { useFmsStore } from '../../store/useFmsStore';
import {
  buildCruiseModesPage,
  buildPerfIndexPage,
  buildPerfInitPage,
  buildTakeoffInitPage,
  buildTakeoffVspeedsPage,
  buildToDatasetPage,
} from '../perfTakeoffPages';

describe('Performance, Cruise Modes, T/O Dataset & Takeoff Pages (Step 8 & Step 14)', () => {
  beforeEach(() => {
    useFmsStore.getState().resetToColdPreflight();
  });

  it('builds PERF INDEX 1/2 and 2/2 with all performance sub-module prompts', () => {
    const store = useFmsStore.getState();
    store.navigateToPage('PERF_INDEX', 1);
    const p1 = buildPerfIndexPage(useFmsStore.getState());
    expect(p1.title).toBe('PERF INDEX');
    expect(p1.pageNumber).toBe('1/2');
    expect(p1.rows[0].left).toBe('<PERF INIT');
    expect(p1.rows[1].left).toBe('<TAKEOFF');
    expect(p1.rows[5].right).toBe('INDEX 2/2>');

    store.navigateToPage('PERF_INDEX', 2);
    const p2 = buildPerfIndexPage(useFmsStore.getState());
    expect(p2.pageNumber).toBe('2/2');
    expect(p2.rows[0].left).toBe('<FUEL MGT');
    expect(p2.rows[1].left).toBe('<EO RANGE');
  });

  it('renders box prompts on PERFORMANCE INIT-KG 2/3 when uninitialized and updates when CRZ ALT, ZFW (3R), and TO CG (5L) are entered', () => {
    const store = useFmsStore.getState();
    store.navigateToPage('PERF_INIT', 2);
    const uninit = buildPerfInitPage(useFmsStore.getState());
    expect(uninit.title).toBe('PERFORMANCE INIT-KG');
    expect(uninit.rows[0].left).toBe('□□□□□');  // 1L CRZ ALT
    expect(uninit.rows[2].right).toBe('□□□□□'); // 3R ZFW
    expect(uninit.rows[4].left).toBe('□□.□%');  // 5L TO CG
    expect(uninit.rows[5].left).toBe('<CONFIRM INIT');
    expect(uninit.rows[5].leftReverse).toBe(true);

    // Enter CRZ ALT = 400 (1L), ZFW = 40000 (3R), TO CG = 29.0 (5L)
    store.setScratchpadInput('400');
    store.pressLsk('1L');
    store.setScratchpadInput('40000');
    store.pressLsk('3R');
    store.setScratchpadInput('29.0');
    store.pressLsk('5L');

    const init = buildPerfInitPage(useFmsStore.getState());
    expect(init.rows[0].left).toBe('FL400');
    expect(init.rows[2].right).toBe('40000');
    expect(init.rows[4].left).toBe('29.0%');
    expect(init.rows[4].right).toBe('54200'); // Gross Weight = 40000 + 14200
  });

  it('supports CRUISE MODES 1/1 and T/O DATASET MENU 1/1 with Rotary Knob adjustment and ■ENTER', () => {
    const store = useFmsStore.getState();
    store.navigateToPage('PERF_INIT', 3);
    const p3 = buildPerfInitPage(useFmsStore.getState());
    expect(p3.title).toBe('PERFORMANCE INIT-KG');
    expect(p3.rows[3].labelLeft).toBe('COST INDEX');
    expect(p3.rows[5].right).toBe('TO DATASET>');

    // Press 2R (OR>) -> opens CRUISE MODES 1/1
    store.pressLsk('2R');
    expect(useFmsStore.getState().activePage).toBe('CRUISE_MODES');
    const cm = buildCruiseModesPage();
    expect(cm.title).toBe('CRUISE MODES');
    expect(cm.rows[1].left).toBe('<LRC (241/.65M)');

    // Select LRC (2L) -> returns to PERF INIT 3/3
    useFmsStore.getState().pressLsk('2L');
    expect(useFmsStore.getState().activePage).toBe('PERF_INIT');
    expect(useFmsStore.getState().speeds.activeSchedule.cruiseMode).toBe('LRC');

    // Press 6R (TO DATASET>) -> opens T/O DATASET MENU 1/1
    useFmsStore.getState().pressLsk('6R');
    expect(useFmsStore.getState().activePage).toBe('TO_DATASET');
    const td1 = buildToDatasetPage(useFmsStore.getState());
    expect(td1.title).toBe('T/O DATASET MENU');
    expect(td1.rows[4].left).toBe('■ENTER');

    // Select TO-3 (3L), enable FLEX T/O (4R), select FLEX TEMP (5R), rotate knob +2, and press 5L (■ENTER)
    useFmsStore.getState().pressLsk('3L');
    useFmsStore.getState().pressLsk('4R');
    useFmsStore.getState().pressLsk('5R');
    useFmsStore.getState().rotateKnob(1);
    useFmsStore.getState().rotateKnob(1);
    useFmsStore.getState().pressLsk('5L'); // ■ENTER

    const td2 = buildToDatasetPage(useFmsStore.getState());
    expect(td2.rows[2].left).toBe('*TO-3 (17K1)');
    expect(td2.rows[4].right).toBe('C 27 C');
    expect(td2.rows[4].leftReverse).toBe(false);
  });

  it('builds TAKEOFF INIT 1/2, TAKEOFF INIT 2/2, TAKEOFF FLAPS 1/1, TAKEOFF 1/1, and DEPARTURE LIMIT 1/1', () => {
    useFmsStore.getState().resetToInitializedPreflight();
    const toInit1 = buildTakeoffInitPage(useFmsStore.getState());
    expect(toInit1.title).toBe('TAKEOFF INIT');
    expect(toInit1.pageNumber).toBe('1/2');
    expect(toInit1.rows[0].left).toBe('093°');
    expect(toInit1.rows[0].right).toBe('51800KG');
    expect(toInit1.rows[3].left).toBe('<-DRY/WET/CNTMNTD');

    // Navigate to TAKEOFF INIT 2/2, open TAKEOFF FLAPS (1R), select FLAP-3 (3L)
    useFmsStore.getState().navigateToPage('TAKEOFF_INIT', 2);
    useFmsStore.getState().pressLsk('1R');
    expect(useFmsStore.getState().activePage).toBe('TAKEOFF_FLAPS');
    useFmsStore.getState().pressLsk('3L');
    expect(useFmsStore.getState().activePage).toBe('TAKEOFF_INIT');
    expect(useFmsStore.getState().takeoffConfig.flap).toBe(3);

    const vsOk = buildTakeoffVspeedsPage(useFmsStore.getState());
    expect(vsOk.title).toBe('TAKEOFF');
    expect(vsOk.pageNumber).toBe('1/1');
    expect(vsOk.rows[0].left).toBe('134 KT');
    expect(vsOk.rows[0].leftReverse).toBe(false);
    expect(vsOk.rows[3].right).toBe('8.2°');
    expect(vsOk.rows[5].right).toBe('DEP LIM>');

    // Inject V-Speed mismatch (V1 = 144 > VR = 138)
    useFmsStore.getState().injectFaultScenario('VSPEED_MISMATCH');
    const vsBad = buildTakeoffVspeedsPage(useFmsStore.getState());
    expect(vsBad.rows[0].leftReverse).toBe(true); // V1 reverse video
    expect(vsBad.rows[1].leftReverse).toBe(true); // VR reverse video

    // Press 6R (DEP LIM>) -> opens DEPARTURE LIMIT 1/1
    useFmsStore.getState().pressLsk('6R');
    expect(useFmsStore.getState().activePage).toBe('DEPARTURE_LIMIT');
  });
});
