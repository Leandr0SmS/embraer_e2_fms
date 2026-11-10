import { describe, it, expect, beforeEach } from 'vitest';
import { AIRAC_METADATA, NAV_DATABASES } from '../../data/navdb';
import { useFmsStore } from '../../store/useFmsStore';
import {
  buildNavIdentPage,
  buildPositionInitPage,
  buildRadioPage,
} from '../initPages';

describe('Power-Up & Initialization Pages (Step 6 & Step 18)', () => {
  beforeEach(() => {
    useFmsStore.getState().resetToColdPreflight();
  });

  it('builds RADIO 1/1 page with COM/NAV frequencies and NAV IDENT> prompt', () => {
    const layout = buildRadioPage(useFmsStore.getState());
    expect(layout.title).toBe('RADIO');
    expect(layout.rows[0].left).toBe('121.900');
    expect(layout.rows[5].right).toBe('NAV IDENT>');
  });

  it('builds NAV IDENT 1/1 with dynamic today date/UTC, selectable NAV_DATABASES from navdb.ts, and POS INIT> / RTE>', () => {
    const coldState = useFmsStore.getState();
    const layoutCold = buildNavIdentPage(coldState);
    expect(layoutCold.title).toBe('NAV IDENT');
    expect(layoutCold.rows[0].left).toBe(AIRAC_METADATA.date);
    expect(layoutCold.rows[0].leftColor).toBe('CYAN');
    expect(layoutCold.rows[0].right).toBe(NAV_DATABASES.NDB_2405_LATAM.activeDates);
    expect(layoutCold.rows[0].rightColor).toBe('YELLOW');
    expect(layoutCold.rows[1].left).toBe(AIRAC_METADATA.utc);
    expect(layoutCold.rows[1].leftColor).toBe('CYAN');
    expect(layoutCold.rows[1].right).toBe(NAV_DATABASES.NDB_2405_LATAM.inactiveDates);
    expect(layoutCold.rows[1].rightColor).toBe('YELLOW');
    expect(layoutCold.rows[2].left).toBe('NG 1.0');
    expect(layoutCold.rows[2].leftColor).toBe('GREEN');
    expect(layoutCold.rows[2].right).toBe('H3652304001');
    expect(layoutCold.rows[2].rightColor).toBe('GREEN');
    expect(layoutCold.rows[4].left).toBe('<LDG IDENT');
    expect(layoutCold.rows[5].right).toBe('POS INIT>');
    expect(layoutCold.rows[5].rightReverse).toBe(true);

    // Pressing 2R swaps active/non-active navigation database from navdb.ts
    useFmsStore.getState().navigateToPage('NAV_IDENT', 1);
    useFmsStore.getState().pressLsk('2R');
    expect(useFmsStore.getState().activeNavDbId).toBe('NDB_2406_NEXT');
    const swappedLayout = buildNavIdentPage(useFmsStore.getState());
    expect(swappedLayout.rows[0].right).toBe(NAV_DATABASES.NDB_2406_NEXT.activeDates);

    // Once position is initialized, 6R shows RTE> and reverse video clears
    useFmsStore.getState().resetToInitializedPreflight();
    const layoutInit = buildNavIdentPage(useFmsStore.getState());
    expect(layoutInit.rows[5].right).toBe('RTE>');
    expect(layoutInit.rows[5].rightReverse).toBe(false);
  });

  it('builds POSITION INIT 1/1 with box prompts when uninitialized and GPS 1 POS (LOADED) after LOAD>', () => {
    const coldLayout = buildPositionInitPage(useFmsStore.getState());
    expect(coldLayout.rows[3].left).toBe('□□°□□.□ □□□°□□.□');
    expect(coldLayout.rows[2].labelLeft).toBe('GPS 1 POS');

    // Navigate to POS_INIT and push 3R (LOAD> GPS 1 POS)
    useFmsStore.getState().navigateToPage('POS_INIT', 1);
    useFmsStore.getState().pressLsk('3R');

    const loadedLayout = buildPositionInitPage(useFmsStore.getState());
    expect(loadedLayout.rows[2].labelLeft).toBe('GPS 1 POS (LOADED)');
    expect(loadedLayout.rows[2].right).toBe('LOAD>');
    expect(loadedLayout.rows[3].left).toBe('S23°37.3 W046°39.5');
    expect(loadedLayout.rows[5].right).toBe('RTE>');
  });
});
