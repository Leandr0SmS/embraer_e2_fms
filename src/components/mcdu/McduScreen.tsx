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
  writeTextToRow(
    grid[0],
    layout.title,
    'CENTER',
    layout.titleColor ?? 'WHITE',
    'LARGE',
    false
  );
  if (layout.pageNumber) {
    writeTextToRow(grid[0], layout.pageNumber, 'RIGHT', 'WHITE', 'SMALL', false);
  }

  // Lines 2..13 (indices 1..12): 6 LSK blocks
  for (let i = 0; i < 6; i++) {
    const lskRow = layout.rows[i] ?? {};
    const labelLineIdx = 1 + i * 2; // 1, 3, 5, 7, 9, 11 (Display Lines 2, 4, 6, 8, 10, 12)
    const dataLineIdx = 2 + i * 2;  // 2, 4, 6, 8, 10, 12 (Display Lines 3, 5, 7, 9, 11, 13)

    // Even Line: Small Labels
    writeTextToRow(
      grid[labelLineIdx],
      lskRow.labelLeft,
      'LEFT',
      lskRow.labelLeftColor ?? 'CYAN',
      'SMALL',
      false
    );
    writeTextToRow(
      grid[labelLineIdx],
      lskRow.labelCenter,
      'CENTER',
      lskRow.labelCenterColor ?? 'CYAN',
      'SMALL',
      false
    );
    writeTextToRow(
      grid[labelLineIdx],
      lskRow.labelRight,
      'RIGHT',
      lskRow.labelRightColor ?? 'CYAN',
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
      lskRow.centerColor ?? 'CYAN',
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
    writeTextToRow(grid[13], scratchpadInput, 'LEFT', 'GREEN', 'LARGE', false);
  } else {
    // Subtle scratchpad brackets at col 0 and col 23
    grid[13][0] = { char: '[', color: 'CYAN', size: 'SMALL', reverse: false };
    grid[13][23] = { char: ']', color: 'CYAN', size: 'SMALL', reverse: false };
  }

  return grid;
}

const COLOR_CLASSES: Record<McduColor, string> = {
  WHITE: 'text-slate-50 drop-shadow-[0_0_3px_rgba(248,250,252,0.45)]',
  CYAN: 'text-cyan-300 drop-shadow-[0_0_4px_rgba(103,232,249,0.5)]',
  GREEN: 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.55)]',
  YELLOW: 'text-amber-300 drop-shadow-[0_0_5px_rgba(252,211,77,0.6)]',
  MAGENTA: 'text-fuchsia-400 drop-shadow-[0_0_5px_rgba(232,121,249,0.6)]',
  AMBER: 'text-orange-400 drop-shadow-[0_0_5px_rgba(251,146,60,0.6)]',
};

const REVERSE_CLASSES: Record<McduColor, string> = {
  WHITE: 'bg-slate-100 text-slate-950 font-bold',
  CYAN: 'bg-cyan-300 text-slate-950 font-bold',
  GREEN: 'bg-emerald-400 text-slate-950 font-bold',
  YELLOW: 'bg-amber-300 text-slate-950 font-bold',
  MAGENTA: 'bg-fuchsia-400 text-slate-950 font-bold',
  AMBER: 'bg-orange-400 text-slate-950 font-bold',
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
      className="mcdu-lcd-grid font-mcdu w-full aspect-[4/3.35] rounded-md border-2 border-slate-800/90 p-2 select-none relative overflow-hidden"
      style={{ filter: `brightness(${brightness})` }}
      data-testid="mcdu-lcd-screen"
    >
      {/* Subtle CRT / Avionics scanline overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.18)_50%)] bg-[length:100%_4px] z-10 opacity-50" />

      {grid.map((row, rIdx) => (
        <div
          key={rIdx}
          className={`mcdu-lcd-row ${
            rIdx === 0
              ? 'border-b border-slate-800/60 pb-0.5'
              : rIdx === 13
                ? 'border-t border-slate-800/80 pt-0.5'
                : ''
          }`}
          data-row={rIdx + 1}
        >
          {row.map((cell, cIdx) => {
            const colorClass = cell.reverse
              ? REVERSE_CLASSES[cell.color]
              : COLOR_CLASSES[cell.color];
            const sizeClass =
              cell.size === 'SMALL'
                ? 'text-[11px] sm:text-[12px] tracking-tight font-medium opacity-95'
                : 'text-[14px] sm:text-[15.5px] font-bold tracking-normal';

            return (
              <span
                key={cIdx}
                className={`mcdu-cell ${colorClass} ${sizeClass} ${
                  cell.reverse ? 'rounded-[1px] px-[1px]' : ''
                }`}
              >
                {cell.char === ' ' ? '\u00A0' : cell.char}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
