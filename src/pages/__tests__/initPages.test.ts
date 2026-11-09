import { describe, it, expect, beforeEach } from 'vitest';
import { useFmsStore } from '../../store/useFmsStore';
import {
  buildNavIdentPage,
  buildPositionInitPage,
  buildRadioPage,
} from '../initPages';

describe('Power-Up & Initialization Pages (Step 6)', () => {
  beforeEach(() => {
    useFmsStore.getState().resetToColdPreflight();
  });

  it('builds RADIO 1/1 page with COM/NAV frequencies and NAV IDENT> prompt', () => {
    const layout = buildRadioPage(useFmsStore.getState());
    expect(layout.title).toBe('RADIO');
    expect(layout.rows[0].left).toBe('121.900');
    expect(layout.rows[5].right).toBe('NAV IDENT>');
  });

  it('builds NAV IDENT 1/1 with reverse video POS INIT> when position is uninitialized', () => {
    const coldState = useFmsStore.getState();
    const layoutCold = buildNavIdentPage(coldState);
    expect(layoutCold.title).toBe('NAV IDENT');
    expect(layoutCold.rows[0].left).toBe('E195-E2');
    expect(layoutCold.rows[0].right).toBe('AIRAC 2405');
    expect(layoutCold.rows[5].right).toBe('POS INIT>');
    expect(layoutCold.rows[5].rightReverse).toBe(true);

    // Once position is initialized, reverse video clears
    useFmsStore.getState().resetToInitializedPreflight();
    const layoutInit = buildNavIdentPage(useFmsStore.getState());
    expect(layoutInit.rows[5].rightReverse).toBe(false);
  });

  it('builds POSITION INIT 1/1 with box prompts when uninitialized and coordinates after LOAD>', () => {
    const coldLayout = buildPositionInitPage(useFmsStore.getState());
    expect(coldLayout.rows[3].left).toBe('□□°□□.□ □□□°□□.□');

    // Navigate to POS_INIT and push 3R (LOAD> GPS 1 POS)
    useFmsStore.getState().navigateToPage('POS_INIT', 1);
    useFmsStore.getState().pressLsk('3R');

    const loadedLayout = buildPositionInitPage(useFmsStore.getState());
    expect(loadedLayout.rows[3].left).toBe('S23°37.3 W046°39.5');
    expect(loadedLayout.rows[5].right).toBe('RTE>');
  });
});
