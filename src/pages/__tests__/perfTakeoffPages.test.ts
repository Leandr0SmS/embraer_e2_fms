import { describe, it, expect, beforeEach } from 'vitest';
import { useFmsStore } from '../../store/useFmsStore';
import {
  buildPerfIndexPage,
  buildPerfInitPage,
  buildTakeoffInitPage,
  buildTakeoffVspeedsPage,
} from '../perfTakeoffPages';

describe('Performance & Takeoff Initialization Pages (Step 8)', () => {
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

  it('renders box prompts on PERFORMANCE INIT 2/3 when uninitialized and updates when CRZ ALT, ZFW, and CG are entered', () => {
    const store = useFmsStore.getState();
    store.navigateToPage('PERF_INIT', 2);
    const uninit = buildPerfInitPage(useFmsStore.getState());
    expect(uninit.rows[0].left).toBe('□□□□□'); // CRZ ALT
    expect(uninit.rows[1].right).toBe('□□.□'); // ZFW
    expect(uninit.rows[3].left).toBe('□□.□');  // TAKEOFF CG
    expect(uninit.rows[5].left).toBe('<CONFIRM INIT');
    expect(uninit.rows[5].leftReverse).toBe(true);

    // Enter CRZ ALT = 280, ZFW = 37.6, TAKEOFF CG = 24.5
    store.setScratchpadInput('280');
    store.pressLsk('1L');
    store.setScratchpadInput('37.6');
    store.pressLsk('2R');
    store.setScratchpadInput('24.5');
    store.pressLsk('4L');

    const init = buildPerfInitPage(useFmsStore.getState());
    expect(init.rows[0].left).toBe('FL280');
    expect(init.rows[1].right).toBe('37.6');
    expect(init.rows[3].left).toBe('24.5');
    expect(init.rows[3].right).toBe('51.8'); // Gross Weight = 37.6 + 14.2
  });

  it('builds TAKEOFF INIT 1/2 and TAKEOFF VSPEEDS 2/2 with reverse video when V1 > VR', () => {
    useFmsStore.getState().resetToInitializedPreflight();
    const toInit = buildTakeoffInitPage(useFmsStore.getState());
    expect(toInit.title).toBe('TAKEOFF INIT');
    expect(toInit.rows[0].left).toBe('093° / 2459FT');
    expect(toInit.rows[0].right).toBe('51.8');

    const vsOk = buildTakeoffVspeedsPage(useFmsStore.getState());
    expect(vsOk.rows[0].left).toBe('134 KT');
    expect(vsOk.rows[0].leftReverse).toBe(false);

    // Inject V-Speed mismatch (V1 = 144 > VR = 138)
    useFmsStore.getState().injectFaultScenario('VSPEED_MISMATCH');
    const vsBad = buildTakeoffVspeedsPage(useFmsStore.getState());
    expect(vsBad.rows[0].leftReverse).toBe(true); // V1 reverse video
    expect(vsBad.rows[1].leftReverse).toBe(true); // VR reverse video
  });
});
