import { describe, it, expect } from 'vitest';
import { buildScreenGrid } from '../McduScreen';
import { McduScreenLayout } from '../../../types/fms';

describe('14x24 Character LCD Grid Builder (Step 5)', () => {
  const sampleLayout: McduScreenLayout = {
    title: 'PERFORMANCE INIT',
    pageNumber: '2/3',
    rows: [
      {
        labelLeft: 'CRZ ALT',
        labelRight: 'PASS',
        left: '□□□□□',
        right: '114',
      },
      {
        labelLeft: 'CRZ WIND',
        labelRight: 'ZFW',
        left: '270° / 035',
        right: '□□.□',
      },
      {},
      {},
      {},
      {
        left: '<CONFIRM INIT',
        leftReverse: true,
        right: 'TAKEOFF INIT>',
      },
    ],
  };

  it('produces an exact 14 rows x 24 columns matrix', () => {
    const grid = buildScreenGrid(sampleLayout, '');
    expect(grid.length).toBe(14);
    for (const row of grid) {
      expect(row.length).toBe(24);
    }
  });

  it('renders box prompts (□) in SMALL CYAN and page numbers right-aligned on Line 1', () => {
    const grid = buildScreenGrid(sampleLayout, '');
    // Line 1 right-aligned '2/3' at cols 21..23
    expect(grid[0][21].char).toBe('2');
    expect(grid[0][22].char).toBe('/');
    expect(grid[0][23].char).toBe('3');

    // LSK 1L data line is row index 2 (Line 3)
    expect(grid[2][0].char).toBe('□');
    expect(grid[2][0].color).toBe('CYAN');
    expect(grid[2][0].size).toBe('SMALL');
  });

  it('renders scratchpad alert messages in reverse video on Line 14 (row 13)', () => {
    const grid = buildScreenGrid(sampleLayout, '42.5', 'INVALID ENTRY');
    const line14Text = grid[13]
      .map((c) => c.char)
      .join('')
      .trim();
    expect(line14Text).toBe('INVALID ENTRY');
    expect(grid[13][0].reverse).toBe(true);
  });
});
