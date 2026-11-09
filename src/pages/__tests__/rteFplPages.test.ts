import { describe, it, expect, beforeEach } from 'vitest';
import { useFmsStore } from '../../store/useFmsStore';
import { buildActRtePage, buildActiveFltPlanPage } from '../rteFplPages';

describe('Route & Flight Plan Pages (Step 7)', () => {
  beforeEach(() => {
    useFmsStore.getState().resetToInitializedPreflight();
  });

  it('builds ACT RTE 1/3 with SBGR, SBRJ, 09L, GRUJSD01, and AZU1420', () => {
    const layout = buildActRtePage(useFmsStore.getState());
    expect(layout.title).toBe('ACT RTE');
    expect(layout.pageNumber).toBe('1/3');
    expect(layout.rows[0].left).toBe('SBGR');
    expect(layout.rows[0].right).toBe('SBRJ');
    expect(layout.rows[1].left).toBe('09L');
    expect(layout.rows[2].left).toBe('GRUJSD01');
    expect(layout.rows[2].right).toBe('AZU1420');
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
