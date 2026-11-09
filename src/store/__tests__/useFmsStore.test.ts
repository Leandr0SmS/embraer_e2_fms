import { describe, it, expect, beforeEach } from 'vitest';
import { useFmsStore } from '../useFmsStore';

describe('Unified Zustand FMS Store & Scratchpad Stack (Step 4)', () => {
  beforeEach(() => {
    useFmsStore.getState().resetToColdPreflight();
  });

  it('enforces 24-character limit and pushes INVALID ENTRY on overflow', () => {
    const store = useFmsStore.getState();
    for (let i = 0; i < 24; i++) {
      store.typeScratchpadChar('A');
    }
    expect(useFmsStore.getState().scratchpadInput.length).toBe(24);
    store.typeScratchpadChar('B');
    expect(useFmsStore.getState().messages[0]?.text).toBe('INVALID ENTRY');
  });

  it('implements dual-role CLR key (clears alert message first, then deletes characters)', () => {
    const store = useFmsStore.getState();
    store.setScratchpadInput('42.5');
    store.pushMessage('INVALID ENTRY', 'HIGH');

    // First CLR removes the alert message while preserving '42.5'
    store.pressClrKey();
    expect(useFmsStore.getState().messages.length).toBe(0);
    expect(useFmsStore.getState().scratchpadInput).toBe('42.5');

    // Second CLR deletes last char ('5')
    store.pressClrKey();
    expect(useFmsStore.getState().scratchpadInput).toBe('42.');
  });

  it('implements DEL key and dash-suffix scratchpad clear rule (N50W050- + DEL)', () => {
    const store = useFmsStore.getState();
    store.setScratchpadInput('N50W050-');
    store.pressDelKey();
    expect(useFmsStore.getState().scratchpadInput).toBe('');
    expect(useFmsStore.getState().deleteMode).toBe(false);

    // Normal DEL enters DELETE mode
    store.pressDelKey();
    expect(useFmsStore.getState().scratchpadInput).toBe('DELETE');
    expect(useFmsStore.getState().deleteMode).toBe(true);
  });

  it('orders scratchpad messages by priority (HIGH > MEDIUM > LOW)', () => {
    const store = useFmsStore.getState();
    store.pushMessage('CHECK SPEED CONSTRAINT', 'LOW');
    store.pushMessage('EXCEEDS CERT CEILING', 'MEDIUM');
    store.pushMessage('INVALID ENTRY', 'HIGH');

    const msgs = useFmsStore.getState().messages.map((m) => m.text);
    expect(msgs).toEqual([
      'INVALID ENTRY',
      'EXCEEDS CERT CEILING',
      'CHECK SPEED CONSTRAINT',
    ]);
  });

  it('transitions from power-up RADIO page to NAV IDENT on first FMS key press', () => {
    const store = useFmsStore.getState();
    expect(store.activePage).toBe('RADIO');
    store.pressFunctionKey('PERF');
    expect(useFmsStore.getState().activePage).toBe('NAV_IDENT');

    // Subsequent PERF key press opens PERF_INDEX
    useFmsStore.getState().pressFunctionKey('PERF');
    expect(useFmsStore.getState().activePage).toBe('PERF_INDEX');
  });

  it('computes Gross Weight = ZFW + FOB on PERF INIT 2/3 and triggers overweight warning', () => {
    const store = useFmsStore.getState();
    store.navigateToPage('PERF_INIT', 2);

    // Enter ZFW = 42.5 at LSK 2R
    store.setScratchpadInput('42.5');
    store.pressLsk('2R');

    const updated = useFmsStore.getState().weights;
    expect(updated.zeroFuelWeight).toBe(42.5);
    expect(updated.grossWeight).toBeCloseTo(42.5 + 14.2, 1);

    // Enter high ZFW = 50.0 -> GW = 64.2 > 61.5 maxGrossWeight
    store.setScratchpadInput('50.0');
    store.pressLsk('2R');
    expect(useFmsStore.getState().messages[0]?.text).toBe('EXCEEDS MAX GROSS WEIGHT');
  });
});
