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
});
