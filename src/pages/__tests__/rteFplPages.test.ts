import { describe, it, expect, beforeEach } from 'vitest';
import { useFmsStore } from '../../store/useFmsStore';
import {
  buildActRtePage,
  buildActiveFltPlanPage,
  buildDeparturePages,
} from '../rteFplPages';

describe('Route, Departure & Flight Plan Pages (Step 7 & Step 13)', () => {
  beforeEach(() => {
    useFmsStore.getState().resetToInitializedPreflight();
  });

  it('builds ACT RTE 1/3 with ORIGIN, DEST, RUNWAY, ALTN DEST, CO ROUTE at 3R, FLIGHT ID at 5R, and DEPARTURE> at 6R', () => {
    const layout = buildActRtePage(useFmsStore.getState());
    expect(layout.title).toBe('ACT RTE');
    expect(layout.pageNumber).toBe('1/3');
    expect(layout.rows[0].left).toBe('SBGR');
    expect(layout.rows[0].right).toBe('SBRJ');
    expect(layout.rows[1].left).toBe('09L');
    expect(layout.rows[1].right).toBe('SBGL');
    expect(layout.rows[2].left).toBe('<DLK FPL');
    expect(layout.rows[2].right).toBe('GRUJSD01');
    expect(layout.rows[4].left).toBe('<OFFSET');
    expect(layout.rows[4].right).toBe('AZU1420');
    expect(layout.rows[5].left).toBe('<FPL LIST');
    expect(layout.rows[5].right).toBe('DEPARTURE>');
  });

  it('walks through the multi-screen DEPARTURE selection (RUNWAYS -> SIDs -> SID TRANS -> APPLY>) and 2-step VIA/TO airway entry', () => {
    const store = useFmsStore.getState();
    store.navigateToPage('ACT_RTE', 1);

    // Enter KPHX -> KMSP on RTE 1
    store.setScratchpadInput('KPHX');
    store.pressLsk('1L');
    store.setScratchpadInput('KMSP');
    store.pressLsk('1R');

    const modRte1 = buildActRtePage(useFmsStore.getState());
    expect(modRte1.title).toBe('MOD RTE');
    expect(modRte1.rows[5].left).toBe('<CANCEL');
    expect(modRte1.rows[5].right).toBe('ACTIVATE>');

    // Activate route (6R) then press 6R (DEPARTURE>)
    useFmsStore.getState().pressLsk('6R');
    expect(useFmsStore.getState().modFlightPlan).toBeNull();
    useFmsStore.getState().pressLsk('6R');
    expect(useFmsStore.getState().activePage).toBe('DEPARTURE');

    // Press 1R (RUNWAY>) -> opens KPHX RUNWAYS 1/1
    useFmsStore.getState().pressLsk('1R');
    expect(useFmsStore.getState().activePage).toBe('DEPARTURE_RUNWAYS');
    const rwyPage = buildDeparturePages(useFmsStore.getState());
    expect(rwyPage.title).toBe('KPHX RUNWAYS');
    expect(rwyPage.rows[2].left).toBe('<RW08');

    // Select RW08 (3L) -> auto-advances to KPHX SIDs 1/1
    useFmsStore.getState().pressLsk('3L');
    expect(useFmsStore.getState().activePage).toBe('DEPARTURE_SIDS');
    const sidsPage = buildDeparturePages(useFmsStore.getState());
    expect(sidsPage.title).toBe('KPHX SIDs');
    expect(sidsPage.rows[0].left).toBe('<SILOW4');

    // Select SILOW4 (1L) -> auto-advances to KPHX SID TRANS 1/1
    useFmsStore.getState().pressLsk('1L');
    expect(useFmsStore.getState().activePage).toBe('DEPARTURE_TRANS');
    const transPage = buildDeparturePages(useFmsStore.getState());
    expect(transPage.title).toBe('KPHX SID TRANS');
    expect(transPage.rows[3].left).toBe('<RSK');

    // Select RSK transition (4L) -> returns to KPHX DEPARTURE 1/1 with <CLEAR SEL and APPLY>
    useFmsStore.getState().pressLsk('4L');
    expect(useFmsStore.getState().activePage).toBe('DEPARTURE');
    const depSummary = buildDeparturePages(useFmsStore.getState());
    expect(depSummary.rows[0].right).toBe('RW08>');
    expect(depSummary.rows[1].right).toBe('SILOW4>');
    expect(depSummary.rows[2].right).toBe('RSK>');
    expect(depSummary.rows[5].left).toBe('<CLEAR SEL');
    expect(depSummary.rows[5].right).toBe('APPLY>');

    // Press 6R (APPLY>) -> transitions to MOD RTE 2/3 with SILOW4.RSK -> RSK
    useFmsStore.getState().pressLsk('6R');
    expect(useFmsStore.getState().activePage).toBe('ACT_RTE');
    expect(useFmsStore.getState().subPageIndex).toBe(2);

    // Enter VIA airway J44 on Left LSK (2L), verify THEN □□□□□ and >>DISCONTINUITY<<, then enter DVV on Right LSK (2R)
    useFmsStore.getState().setScratchpadInput('J44');
    useFmsStore.getState().pressLsk('2L');
    const pendingAwyPage = buildActRtePage(useFmsStore.getState());
    expect(pendingAwyPage.rows[1].left).toBe('J44');
    expect(pendingAwyPage.rows[1].center).toBe('THEN');
    expect(pendingAwyPage.rows[1].right).toBe('□□□□□');
    expect(pendingAwyPage.rows[2].center).toBe('>>DISCONTINUITY<<');

    useFmsStore.getState().setScratchpadInput('DVV');
    useFmsStore.getState().pressLsk('2R');
    const resolvedAwyPage = buildActRtePage(useFmsStore.getState());
    expect(resolvedAwyPage.rows[1].left).toBe('J44');
    expect(resolvedAwyPage.rows[1].right).toBe('DVV');
  });

  it('colors FROM waypoint Yellow, TO waypoint Magenta, and subsequent waypoints Green on ACTIVE FLT PLAN', () => {
    const layout = buildActiveFltPlanPage(useFmsStore.getState());
    expect(layout.title).toBe('ACTIVE FLT PLAN');
    expect(layout.rows[0].left).toBe('SBGR09L');
    expect(layout.rows[0].leftColor).toBe('YELLOW');
    expect(layout.rows[1].left).toBe('VEXIM');
    expect(layout.rows[1].leftColor).toBe('MAGENTA');
    expect(layout.rows[2].left).toBe('BUSPA');
    expect(layout.rows[2].leftColor).toBe('GREEN');
  });

  it('transitions to MOD FLT PLAN with <ACTIVATE and CANCEL MOD> when inserting a custom waypoint (&PBD01)', () => {
    const store = useFmsStore.getState();
    store.navigateToPage('ACTIVE_FLT_PLAN', 1);
    store.setScratchpadInput('PXR/090/30');
    store.pressLsk('3L'); // Insert before BUSPA

    const modLayout = buildActiveFltPlanPage(useFmsStore.getState());
    expect(modLayout.title).toBe('MOD FLT PLAN');
    expect(modLayout.rows[2].left).toBe('&PBD01');
    expect(modLayout.rows[5].left).toBe('<ACTIVATE');
    expect(modLayout.rows[5].right).toBe('CANCEL MOD>');

    // Press 6L to activate MOD flight plan
    useFmsStore.getState().pressLsk('6L');
    const activeLayout = buildActiveFltPlanPage(useFmsStore.getState());
    expect(activeLayout.title).toBe('ACTIVE FLT PLAN');
  });
});
