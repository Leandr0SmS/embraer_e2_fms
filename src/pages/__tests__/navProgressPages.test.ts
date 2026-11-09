import { describe, it, expect, beforeEach } from 'vitest';
import { useFmsStore } from '../../store/useFmsStore';
import { getActiveScreenLayout } from '../pageRegistry';

describe('Navigation Index, Progress & Operational Sub-Pages (Step 9)', () => {
  beforeEach(() => {
    useFmsStore.getState().resetToInitializedPreflight();
  });

  it('builds NAV INDEX 1/2 and 2/2 with navigation sub-page links', () => {
    const store = useFmsStore.getState();
    store.navigateToPage('NAV_INDEX', 1);
    const nav1 = getActiveScreenLayout(useFmsStore.getState());
    expect(nav1.title).toBe('NAV INDEX');
    expect(nav1.pageNumber).toBe('1/2');
    expect(nav1.rows[0].left).toBe('<DATALINK');
    expect(nav1.rows[3].left).toBe('<CROSS PTS');
    expect(nav1.rows[3].right).toBe('FLT SUM>');
    expect(nav1.rows[4].left).toBe('<PATTERNS');
    expect(nav1.rows[4].right).toBe('HOLD>');
    expect(nav1.rows[5].left).toBe('<DEPARTURE');
    expect(nav1.rows[5].right).toBe('ARRIVAL>');

    store.pressFunctionKey('NEXT');
    const nav2 = getActiveScreenLayout(useFmsStore.getState());
    expect(nav2.pageNumber).toBe('2/2');
    expect(nav2.rows[0].left).toBe('<POS SENSORS');
    expect(nav2.rows[0].right).toBe('POS INIT>');
    expect(nav2.rows[1].left).toBe('<NAV IDENT');
    expect(nav2.rows[1].right).toBe('CONVERSION>');
    expect(nav2.rows[2].left).toBe('<DATA LOAD');
    expect(nav2.rows[2].right).toBe('MAINTENANCE>');
    expect(nav2.rows[3].left).toBe('<CLOSEST APT');
  });

  it('builds PROGRESS 1/3 with FROM (Yellow), TO (Magenta), DEST (Green), WIND, and GPS-D sensor', () => {
    const store = useFmsStore.getState();
    store.navigateToPage('PROGRESS', 1);
    const prog = getActiveScreenLayout(useFmsStore.getState());
    expect(prog.title).toBe('PROGRESS');
    expect(prog.rows[0].left).toBe('SBGR');
    expect(prog.rows[0].leftColor).toBe('YELLOW');
    expect(prog.rows[1].left).toBe('VEXIM');
    expect(prog.rows[1].leftColor).toBe('MAGENTA');
    expect(prog.rows[2].left).toBe('SBRJ');
    expect(prog.rows[2].leftColor).toBe('GREEN');
    expect(prog.rows[4].center).toBe('GPS-D 0.04');
  });

  it('updates ACT HOLD inbound course/turn and leg time via scratchpad', () => {
    const store = useFmsStore.getState();
    store.navigateToPage('HOLD', 1);
    store.setScratchpadInput('240/L');
    store.pressLsk('2L');
    store.setScratchpadInput('2.0');
    store.pressLsk('3L');

    const holdLayout = getActiveScreenLayout(useFmsStore.getState());
    expect(holdLayout.title).toBe('ACT HOLD');
    expect(holdLayout.rows[1].left).toBe('240° / LEFT');
    expect(holdLayout.rows[2].left).toBe('2.0 MIN');
  });

  it('adapts ACTIVE FLT PLAN bottom prompts by Flight Phase and walks through ARRIVAL and LANDING INIT / ROAAS / LANDING', () => {
    const store = useFmsStore.getState();
    store.navigateToPage('ACTIVE_FLT_PLAN', 1);

    // Switch to CRUISE phase -> 6L <DES NOW, 6R ARRIVAL>
    store.setFlightPhase('CRUISE');
    const crzFpl = getActiveScreenLayout(useFmsStore.getState());
    expect(crzFpl.rows[5].left).toBe('<DES NOW');
    expect(crzFpl.rows[5].right).toBe('ARRIVAL>');

    // Press 6R (ARRIVAL>) -> opens SBRJ ARRIVAL 1/1
    useFmsStore.getState().pressLsk('6R');
    expect(useFmsStore.getState().activePage).toBe('ARRIVAL');
    const arrPage = getActiveScreenLayout(useFmsStore.getState());
    expect(arrPage.title).toBe('SBRJ ARRIVAL');
    expect(arrPage.rows[1].right).toBe('STAR>');

    // Select STAR> (2R) -> SBRJ STARs 1/1 -> select BUSPA1A (1L) -> APPLY> (6R)
    useFmsStore.getState().pressLsk('2R');
    expect(useFmsStore.getState().activePage).toBe('ARRIVAL_STARS');
    useFmsStore.getState().pressLsk('1L');
    expect(useFmsStore.getState().activePage).toBe('ARRIVAL');
    const arrSelected = getActiveScreenLayout(useFmsStore.getState());
    expect(arrSelected.rows[1].right).toBe('BUSPA1A>');
    expect(arrSelected.rows[5].right).toBe('APPLY>');
    useFmsStore.getState().pressLsk('6R'); // APPLY>
    expect(useFmsStore.getState().activePage).toBe('ACTIVE_FLT_PLAN');
    useFmsStore.getState().pressLsk('6L'); // <ACTIVATE MOD

    // Switch to APPROACH phase -> 6L <ARRIVAL, 6R LANDING>
    useFmsStore.getState().setFlightPhase('APPROACH');
    const apprFpl = getActiveScreenLayout(useFmsStore.getState());
    expect(apprFpl.rows[5].left).toBe('<ARRIVAL');
    expect(apprFpl.rows[5].right).toBe('LANDING>');

    // Press 6R (LANDING>) -> opens LANDING INIT 1/1
    useFmsStore.getState().pressLsk('6R');
    expect(useFmsStore.getState().activePage).toBe('LANDING_INIT');
    useFmsStore.getState().pressLsk('5L'); // <ROAAS
    expect(useFmsStore.getState().activePage).toBe('ROAAS');
    useFmsStore.getState().pressLsk('6L'); // <LANDING INIT
    useFmsStore.getState().pressLsk('6L'); // <CONF INIT -> sets isCompPending
    useFmsStore.getState().pressLsk('6R'); // LANDING>
    expect(useFmsStore.getState().activePage).toBe('LANDING');

    const ldgComp = getActiveScreenLayout(useFmsStore.getState());
    expect(ldgComp.rows[0].leftReverse).toBe(true);
    expect(ldgComp.rows[4].left).toBe('■ACCEPT COMP');
    useFmsStore.getState().pressLsk('5L'); // Accept COMP speeds
    const ldgAccepted = getActiveScreenLayout(useFmsStore.getState());
    expect(ldgAccepted.rows[0].leftReverse).toBe(false);
    expect(ldgAccepted.rows[4].left).toBe('*COMP ACCEPTED');
  });
});
