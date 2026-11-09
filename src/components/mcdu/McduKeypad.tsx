import React from 'react';
import { FmsFunctionKey } from '../../types/fms';

interface McduKeypadProps {
  onFunctionKey: (key: FmsFunctionKey) => void;
  onCharKey: (char: string) => void;
  onDelKey: () => void;
  onClrKey: () => void;
  onBrightnessDelta?: (delta: number) => void;
  onKnobRotate?: (delta: -1 | 1) => void;
  highlightedFunctionKey?: FmsFunctionKey | null;
  knobHighlighted?: boolean;
}

const FUNCTION_ROW_1: Array<{ key: FmsFunctionKey; label: string }> = [
  { key: 'PERF', label: 'PERF' },
  { key: 'NAV', label: 'NAV' },
  { key: 'PREV', label: 'PREV' },
  { key: 'FPL', label: 'FPL' },
  { key: 'PROG', label: 'PROG' },
  { key: 'RTE', label: 'RTE' },
  { key: 'CB', label: 'CB' },
];

const FUNCTION_ROW_2: Array<{ key: FmsFunctionKey; label: string; isBlank?: boolean }> = [
  { key: 'MENU', label: 'MENU' },
  { key: 'DLK', label: 'DLK' },
  { key: 'NEXT', label: 'NEXT' },
  { key: 'DIR', label: '', isBlank: true },
  { key: 'TRS', label: 'TRS' },
  { key: 'RADIO', label: 'RADIO' },
];

const ALPHA_ROWS: string[][] = [
  ['A', 'B', 'C', 'D', 'E', 'F'],
  ['G', 'H', 'I', 'J', 'K', 'L'],
  ['M', 'N', 'O', 'P', 'Q', 'R'],
  ['', 'S', 'T', 'U', 'V', 'W'],
  ['', 'X', 'Y', 'Z', 'DEL', 'CLR'],
];

const NUMERIC_ROWS: Array<Array<string | null>> = [
  ['1', '2', '3', '+/-'],
  ['4', '5', '6', '/'],
  ['7', '8', '9', null],
  ['SP', '0', '.', null],
];

export const McduKeypad: React.FC<McduKeypadProps> = ({
  onFunctionKey,
  onCharKey,
  onDelKey,
  onClrKey,
  onBrightnessDelta,
  onKnobRotate,
  highlightedFunctionKey,
  knobHighlighted,
}) => {
  const handleAlphaClick = (k: string) => {
    if (k === 'DEL') {
      onDelKey();
    } else if (k === 'CLR') {
      onClrKey();
    } else {
      onCharKey(k);
    }
  };

  const handleNumericClick = (k: string) => {
    if (k === '+/-') {
      onCharKey('-');
    } else if (k === 'SP') {
      onCharKey(' ');
    } else {
      onCharKey(k);
    }
  };

  const handleKnobWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!onKnobRotate) return;
    onKnobRotate(e.deltaY < 0 ? 1 : -1);
  };

  return (
    <div className="mt-3 space-y-2.5 select-none">
      {/* Authentic 2-Row Function Key Matrix + BRT/DIM Rocker (Per LATAM Guia Rápido) */}
      <div className="grid grid-cols-8 gap-1.5 bg-slate-900/95 p-2 rounded-md border border-slate-700/80 items-stretch">
        <div className="col-span-7 space-y-1.5">
          {/* Row 1: PERF NAV PREV FPL PROG RTE CB */}
          <div className="grid grid-cols-7 gap-1.5">
            {FUNCTION_ROW_1.map(({ key, label }) => {
              const isHighlighted = highlightedFunctionKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onFunctionKey(key)}
                  data-testid={`fn-key-${key}`}
                  className={`mcdu-key h-8 rounded text-[11px] font-bold tracking-wider text-slate-100 flex items-center justify-center cursor-pointer ${
                    isHighlighted
                      ? 'ring-2 ring-amber-400 animate-pulse text-amber-300'
                      : ''
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Row 2: MENU DLK NEXT [Blank/DIR] TRS RADIO */}
          <div className="grid grid-cols-7 gap-1.5">
            {FUNCTION_ROW_2.map(({ key, label, isBlank }) => {
              const isHighlighted = highlightedFunctionKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onFunctionKey(key)}
                  title={isBlank ? 'Direct-To / Spare Function Key' : label}
                  data-testid={`fn-key-${key}`}
                  className={`mcdu-key h-8 rounded text-[11px] font-bold tracking-wider text-slate-100 flex items-center justify-center cursor-pointer ${
                    isHighlighted
                      ? 'ring-2 ring-amber-400 animate-pulse text-amber-300'
                      : ''
                  }`}
                >
                  {label}
                </button>
              );
            })}
            {/* 7th slot spacer on row 2 */}
            <div className="h-8" />
          </div>
        </div>

        {/* Column 8: Vertical BRT / DIM Rocker Key */}
        <div className="col-span-1 flex flex-col justify-between mcdu-key rounded overflow-hidden">
          <button
            type="button"
            onClick={() => onBrightnessDelta?.(0.15)}
            className="flex-1 text-[9px] font-bold text-slate-200 hover:bg-slate-700/60 flex items-center justify-center border-b border-slate-700/80 cursor-pointer"
            title="Increase Display Brightness (BRT)"
          >
            BRT
          </button>
          <button
            type="button"
            onClick={() => onBrightnessDelta?.(-0.15)}
            className="flex-1 text-[9px] font-bold text-slate-200 hover:bg-slate-700/60 flex items-center justify-center cursor-pointer"
            title="Decrease Display Brightness (DIM)"
          >
            DIM
          </button>
        </div>
      </div>

      {/* Lower Split Keypad: Left Alpha Matrix (A-Z, DEL, CLR) + Right Rotary Knob & Round Numeric Pad */}
      <div className="grid grid-cols-12 gap-2.5 bg-slate-900/95 p-2.5 rounded-md border border-slate-700/80 items-end">
        {/* Left Alpha Matrix (7 columns wide, 6 keys per row) */}
        <div className="col-span-7 space-y-1.5">
          {ALPHA_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="grid grid-cols-6 gap-1.5">
              {row.map((k, cIdx) => {
                if (!k) {
                  return <div key={`empty-${rIdx}-${cIdx}`} className="h-8" />;
                }
                const isAction = k === 'CLR' || k === 'DEL';
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handleAlphaClick(k)}
                    data-testid={`alpha-key-${k}`}
                    className={`mcdu-key h-8 rounded text-[11px] font-bold flex items-center justify-center cursor-pointer ${
                      k === 'CLR'
                        ? 'text-amber-300 border-amber-500/40'
                        : isAction
                          ? 'text-cyan-300'
                          : 'text-slate-100'
                    }`}
                  >
                    {k}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Right Side: Concentric Rotary Knob on Top + Round Numeric Pad Below (5 columns wide) */}
        <div className="col-span-5 flex flex-col items-center justify-between space-y-2">
          {/* Concentric Rotary Data Entry Knob */}
          <div className="w-full flex items-center justify-end pr-2">
            <div
              onWheel={handleKnobWheel}
              title="Rotary Data Knob — Click - / + or scroll mouse wheel to adjust TO TEMP / FLEX TEMP"
              className={`relative w-14 h-14 rounded-full bg-gradient-to-b from-slate-700 to-slate-950 border-2 border-slate-500 shadow-[0_4px_10px_rgba(0,0,0,0.85),inset_0_1px_2px_rgba(255,255,255,0.2)] flex items-center justify-center ${
                knobHighlighted ? 'ring-2 ring-amber-400 animate-pulse' : ''
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-600 shadow-inner flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() => onKnobRotate?.(-1)}
                  data-testid="mcdu-knob-dec"
                  className="text-[11px] font-bold text-slate-300 hover:text-cyan-300 px-0.5 cursor-pointer"
                  title="Decrement value (Rotate Counter-Clockwise)"
                >
                  (
                </button>
                <button
                  type="button"
                  onClick={() => onKnobRotate?.(1)}
                  data-testid="mcdu-knob-inc"
                  className="text-[11px] font-bold text-slate-300 hover:text-cyan-300 px-0.5 cursor-pointer"
                  title="Increment value (Rotate Clockwise)"
                >
                  )
                </button>
              </div>
            </div>
          </div>

          {/* Round 4x4 Numeric & Symbol Pad */}
          <div className="w-full space-y-1.5">
            {NUMERIC_ROWS.map((row, rIdx) => (
              <div key={rIdx} className="grid grid-cols-4 gap-1.5">
                {row.map((k, cIdx) => {
                  if (!k) {
                    return <div key={`num-empty-${rIdx}-${cIdx}`} className="h-8" />;
                  }
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handleNumericClick(k)}
                      data-testid={`num-key-${k}`}
                      className="mcdu-key h-8 w-8 mx-auto rounded-full text-[11px] font-bold text-slate-100 flex items-center justify-center cursor-pointer"
                    >
                      {k}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
