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

const FUNCTION_ROW_1: Array<{ key: FmsFunctionKey; label: string; boxed?: boolean }> = [
  { key: 'PERF', label: 'PERF' },
  { key: 'NAV', label: 'NAV' },
  { key: 'PREV', label: 'PREV', boxed: true },
  { key: 'FPL', label: 'FPL' },
  { key: 'PROG', label: 'PROG' },
  { key: 'RTE', label: 'RTE' },
  { key: 'CB', label: 'CB' },
];

const FUNCTION_ROW_2: Array<{
  key: FmsFunctionKey;
  label: string;
  isBlank?: boolean;
  boxed?: boolean;
}> = [
  { key: 'MENU', label: 'MENU' },
  { key: 'DLK', label: 'DLK' },
  { key: 'NEXT', label: 'NEXT', boxed: true },
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
    <div className="mt-3 px-4 pb-1 space-y-3 select-none">
      {/* Authentic 2-Row Function Key Matrix + BRT/DIM Rocker */}
      <div className="grid grid-cols-8 gap-2 items-stretch">
        <div className="col-span-7 space-y-2">
          {/* Row 1: PERF NAV [PREV] FPL PROG RTE CB */}
          <div className="grid grid-cols-7 gap-2">
            {FUNCTION_ROW_1.map(({ key, label, boxed }) => {
              const isHighlighted = highlightedFunctionKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onFunctionKey(key)}
                  data-testid={`fn-key-${key}`}
                  className={`mcdu-key h-8 rounded-[4px] text-[11px] font-bold tracking-wider text-white flex items-center justify-center cursor-pointer ${
                    isHighlighted
                      ? 'ring-2 ring-amber-400 animate-pulse text-amber-300'
                      : ''
                  }`}
                >
                  {boxed ? (
                    <span className="border border-white/85 px-1.5 py-0.5 rounded-[2px] leading-none">
                      {label}
                    </span>
                  ) : (
                    label
                  )}
                </button>
              );
            })}
          </div>

          {/* Row 2: MENU DLK [NEXT] [Blank/DIR] TRS RADIO */}
          <div className="grid grid-cols-7 gap-2">
            {FUNCTION_ROW_2.map(({ key, label, isBlank, boxed }) => {
              const isHighlighted = highlightedFunctionKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onFunctionKey(key)}
                  title={isBlank ? 'Direct-To / Spare Function Key' : label}
                  data-testid={`fn-key-${key}`}
                  className={`mcdu-key h-8 rounded-[4px] text-[11px] font-bold tracking-wider text-white flex items-center justify-center cursor-pointer ${
                    isHighlighted
                      ? 'ring-2 ring-amber-400 animate-pulse text-amber-300'
                      : ''
                  }`}
                >
                  {boxed ? (
                    <span className="border border-white/85 px-1.5 py-0.5 rounded-[2px] leading-none">
                      {label}
                    </span>
                  ) : (
                    label
                  )}
                </button>
              );
            })}
            {/* 7th slot empty on row 2 */}
            <div className="h-8" />
          </div>
        </div>

        {/* Column 8: Vertical BRT / DIM Rocker Key */}
        <div className="col-span-1 flex flex-col justify-between mcdu-key rounded-[4px] overflow-hidden">
          <button
            type="button"
            onClick={() => onBrightnessDelta?.(0.15)}
            className="flex-1 text-[9px] font-bold text-white hover:bg-white/10 flex items-center justify-center cursor-pointer"
            title="Increase Display Brightness (BRT)"
          >
            BRT
          </button>
          <button
            type="button"
            onClick={() => onBrightnessDelta?.(-0.15)}
            className="flex-1 text-[9px] font-bold text-white hover:bg-white/10 flex items-center justify-center cursor-pointer"
            title="Decrease Display Brightness (DIM)"
          >
            DIM
          </button>
        </div>
      </div>

      {/* Lower Split Keypad: Left Square Alpha Matrix (A-Z, DEL, CLR) + Right Rotary Knob & Round Numeric Pad */}
      <div className="grid grid-cols-12 gap-3 items-end pt-0.5">
        {/* Left Alpha Matrix (7 columns wide, 6 keys per row) */}
        <div className="col-span-7 space-y-2">
          {ALPHA_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="grid grid-cols-6 gap-2">
              {row.map((k, cIdx) => {
                if (!k) {
                  return <div key={`empty-${rIdx}-${cIdx}`} className="h-9" />;
                }
                const isWordKey = k === 'CLR' || k === 'DEL';
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handleAlphaClick(k)}
                    data-testid={`alpha-key-${k}`}
                    className={`mcdu-key h-9 rounded-[4px] font-bold text-white flex items-center justify-center cursor-pointer ${
                      isWordKey ? 'text-[11px] tracking-tight' : 'text-[15px]'
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
        <div className="col-span-5 flex flex-col items-center justify-between space-y-2.5">
          {/* Concentric Rotary Data Entry Knob */}
          <div className="w-full flex items-center justify-end pr-3">
            <div
              onWheel={handleKnobWheel}
              title="Rotary Data Knob — Click ( / ) or scroll mouse wheel to adjust TO TEMP / FLEX TEMP"
              className={`relative w-16 h-16 rounded-full bg-gradient-to-b from-[#d4d8dd] to-[#7a7f85] p-1.5 border border-[#3a3e44] shadow-[0_4px_10px_rgba(0,0,0,0.65)] flex items-center justify-center ${
                knobHighlighted ? 'ring-2 ring-amber-400 animate-pulse' : ''
              }`}
            >
              <div className="w-full h-full rounded-full bg-gradient-to-b from-[#1f2226] to-[#0a0b0d] border-2 border-[#32363c] shadow-inner flex items-center justify-center">
                <div className="w-9 h-9 rounded-full bg-[#15171a] border border-[#3d424a] shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)] flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={() => onKnobRotate?.(-1)}
                    data-testid="mcdu-knob-dec"
                    className="text-[12px] font-bold text-neutral-400 hover:text-white px-0.5 cursor-pointer"
                    title="Decrement value (Rotate Counter-Clockwise)"
                  >
                    (
                  </button>
                  <button
                    type="button"
                    onClick={() => onKnobRotate?.(1)}
                    data-testid="mcdu-knob-inc"
                    className="text-[12px] font-bold text-neutral-400 hover:text-white px-0.5 cursor-pointer"
                    title="Increment value (Rotate Clockwise)"
                  >
                    )
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Round 4x4 Numeric & Symbol Pad */}
          <div className="w-full space-y-2">
            {NUMERIC_ROWS.map((row, rIdx) => (
              <div key={rIdx} className="grid grid-cols-4 gap-2">
                {row.map((k, cIdx) => {
                  if (!k) {
                    return <div key={`num-empty-${rIdx}-${cIdx}`} className="h-8" />;
                  }
                  const isSmallLabel = k === '+/-' || k === 'SP';
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handleNumericClick(k)}
                      data-testid={`num-key-${k}`}
                      className={`mcdu-key h-8 w-8 mx-auto rounded-full font-bold text-white flex items-center justify-center cursor-pointer ${
                        isSmallLabel ? 'text-[11px] tracking-tighter' : 'text-[14px]'
                      }`}
                    >
                      {displayNumericLabel(k)}
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

function displayNumericLabel(k: string): React.ReactNode {
  if (k === '.') {
    return <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />;
  }
  return k;
}
