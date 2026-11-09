import React from 'react';
import {
  McduCell,
  McduColor,
  McduFontSize,
  McduScreenLayout,
} from '../../types/fms';

const COLS = 24;
const ROWS = 14;

function createEmptyRow(): McduCell[] {
  return Array.from({ length: COLS }, () => ({
    char: ' ',
    color: 'WHITE',
    size: 'LARGE',
    reverse: false,
  }));
}

function writeTextToRow(
  row: McduCell[],
  text: string | undefined,
  align: 'LEFT' | 'CENTER' | 'RIGHT',
  color: McduColor,
  size: McduFontSize,
  reverse = false
): void {
  if (!text) return;
  const clean = text.slice(0, COLS);
  let startCol = 0;
  if (align === 'CENTER') {
    startCol = Math.max(0, Math.floor((COLS - clean.length) / 2));
  } else if (align === 'RIGHT') {
    startCol = Math.max(0, COLS - clean.length);
  }

  for (let i = 0; i < clean.length; i++) {
    const col = startCol + i;
    if (col >= 0 && col < COLS) {
      const ch = clean[i];
      // Box prompts '□' always render in small cyan unless reverse video is active
      const isBox = ch === '□';
      row[col] = {
        char: ch,
        color: isBox && !reverse ? 'CYAN' : color,
        size: isBox ? 'SMALL' : size,
        reverse,
      };
    }
  }
}

/**
 * Pure function that compiles a McduScreenLayout + Scratchpad state into a strict 14x24 cell matrix
 */
export function buildScreenGrid(
  layout: McduScreenLayout,
  scratchpadInput: string,
  topAlertMessage?: string
): McduCell[][] {
  const grid: McduCell[][] = Array.from({ length: ROWS }, () => createEmptyRow());

  // Line 1 (index 0): Page Title Centered + Page Number Right-Aligned
  const titleText = layout.title ?? '';
  writeTextToRow(
    grid[0],
    titleText,
    'CENTER',
    layout.titleColor ?? 'WHITE',
    'LARGE',
    false
  );

  // Per Honeywell & LATAM manuals:
  // - If title starts with "MOD " (e.g. "MOD RTE", "MOD ALTN RTE"), "MOD" is CYAN and the rest is WHITE.
  // - If title starts with 4-char ICAO + procedure keyword (e.g. "SBGR DEPARTURE", "SBGR RUNWAYS", "SBGR SIDs"),
  //   the 4-char ICAO is GREEN and the rest is WHITE.
  const titleStartCol = Math.max(0, Math.floor((COLS - titleText.length) / 2));
  if (titleText.startsWith('MOD ')) {
    for (let i = 0; i < titleText.length; i++) {
      const col = titleStartCol + i;
      if (col >= 0 && col < COLS) {
        grid[0][col].color = i < 3 ? 'CYAN' : 'WHITE';
      }
    }
  } else if (
    /^[A-Z0-9]{4}\s+(DEPARTURE|ARRIVAL|RUNWAYS|SID|STAR|APPROACH)/i.test(titleText)
  ) {
    for (let i = 0; i < titleText.length; i++) {
      const col = titleStartCol + i;
      if (col >= 0 && col < COLS) {
        grid[0][col].color = i < 4 ? 'GREEN' : 'WHITE';
      }
    }
  }

  if (layout.pageNumber) {
    writeTextToRow(grid[0], layout.pageNumber, 'RIGHT', 'WHITE', 'SMALL', false);
  }

  // Lines 2..13 (indices 1..12): 6 LSK blocks
  for (let i = 0; i < 6; i++) {
    const lskRow = layout.rows[i] ?? {};
    const labelLineIdx = 1 + i * 2; // 1, 3, 5, 7, 9, 11 (Display Lines 2, 4, 6, 8, 10, 12)
    const dataLineIdx = 2 + i * 2;  // 2, 4, 6, 8, 10, 12 (Display Lines 3, 5, 7, 9, 11, 13)

    // Even Line: Small Labels (Default WHITE per Honeywell NG FMS manual)
    writeTextToRow(
      grid[labelLineIdx],
      lskRow.labelLeft,
      'LEFT',
      lskRow.labelLeftColor ?? 'WHITE',
      'SMALL',
      false
    );
    writeTextToRow(
      grid[labelLineIdx],
      lskRow.labelCenter,
      'CENTER',
      lskRow.labelCenterColor ?? 'WHITE',
      'SMALL',
      false
    );
    writeTextToRow(
      grid[labelLineIdx],
      lskRow.labelRight,
      'RIGHT',
      lskRow.labelRightColor ?? 'WHITE',
      'SMALL',
      false
    );

    // Odd Line: LSK Data / Prompts
    const defaultLeftColor: McduColor = lskRow.left?.startsWith('<') ? 'WHITE' : 'GREEN';
    const defaultRightColor: McduColor = lskRow.right?.endsWith('>') ? 'WHITE' : 'GREEN';

    writeTextToRow(
      grid[dataLineIdx],
      lskRow.left,
      'LEFT',
      lskRow.leftColor ?? defaultLeftColor,
      lskRow.leftSize ?? 'LARGE',
      Boolean(lskRow.leftReverse)
    );
    writeTextToRow(
      grid[dataLineIdx],
      lskRow.center,
      'CENTER',
      lskRow.centerColor ?? 'WHITE',
      lskRow.centerSize ?? 'SMALL',
      Boolean(lskRow.centerReverse)
    );
    writeTextToRow(
      grid[dataLineIdx],
      lskRow.right,
      'RIGHT',
      lskRow.rightColor ?? defaultRightColor,
      lskRow.rightSize ?? 'LARGE',
      Boolean(lskRow.rightReverse)
    );
  }

  // Line 14 (index 13): Scratchpad or Priority Alert Message
  if (topAlertMessage) {
    writeTextToRow(grid[13], topAlertMessage, 'LEFT', 'WHITE', 'LARGE', true);
  } else if (scratchpadInput.length > 0) {
    writeTextToRow(grid[13], scratchpadInput, 'LEFT', 'CYAN', 'LARGE', false);
  }

  return grid;
}

const COLOR_CLASSES: Record<McduColor, string> = {
  WHITE: 'text-[#ffffff]',
  CYAN: 'text-[#00b4ff]',
  GREEN: 'text-[#00ff00]',
  YELLOW: 'text-[#ffbf00]',
  MAGENTA: 'text-[#ff00ff]',
  AMBER: 'text-[#ff9900]',
};

const REVERSE_CLASSES: Record<McduColor, string> = {
  WHITE: 'bg-[#ffffff] text-[#000000] font-bold',
  CYAN: 'bg-[#00b4ff] text-[#000000] font-bold',
  GREEN: 'bg-[#00ff00] text-[#000000] font-bold',
  YELLOW: 'bg-[#ffbf00] text-[#000000] font-bold',
  MAGENTA: 'bg-[#ff00ff] text-[#000000] font-bold',
  AMBER: 'bg-[#ff9900] text-[#000000] font-bold',
};

interface McduScreenProps {
  layout: McduScreenLayout;
  scratchpadInput: string;
  topAlertMessage?: string;
  brightness?: number;
}

export const McduScreen: React.FC<McduScreenProps> = ({
  layout,
  scratchpadInput,
  topAlertMessage,
  brightness = 1,
}) => {
  const grid = buildScreenGrid(layout, scratchpadInput, topAlertMessage);

  return (
    <div
      className="mcdu-lcd-grid font-mcdu w-full aspect-[4/3.35] rounded-[20px] px-3 py-2.5 select-none relative overflow-hidden"
      style={{ filter: `brightness(${brightness})` }}
      data-testid="mcdu-lcd-screen"
    >
      {grid.map((row, rIdx) => (
        <div
          key={rIdx}
          className="mcdu-lcd-row"
          data-row={rIdx + 1}
        >
          {row.map((cell, cIdx) => {
            const colorClass = cell.reverse
              ? REVERSE_CLASSES[cell.color]
              : COLOR_CLASSES[cell.color];
            const sizeClass =
              cell.size === 'SMALL'
                ? 'text-[11px] sm:text-[12px] tracking-tight font-medium'
                : 'text-[14px] sm:text-[15.5px] font-bold tracking-normal';

            // Visually render LSK edge prompt arrows '<' and '>' as solid triangles '◄' and '►'
            let displayChar = cell.char;
            if (rIdx >= 1 && rIdx <= 12) {
              if (cIdx === 0 && cell.char === '<') {
                displayChar = '◄';
              } else if (cIdx === COLS - 1 && cell.char === '>') {
                displayChar = '►';
              }
            }

            return (
              <span
                key={cIdx}
                className={`mcdu-cell ${colorClass} ${sizeClass} ${
                  cell.reverse ? 'rounded-[1px] px-[1px]' : ''
                }`}
              >
                {displayChar === ' ' ? '\u00A0' : displayChar}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
