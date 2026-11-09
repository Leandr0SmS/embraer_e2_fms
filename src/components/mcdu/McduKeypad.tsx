import React from 'react';
import { FmsFunctionKey } from '../../types/fms';

interface McduKeypadProps {
  onFunctionKey: (key: FmsFunctionKey) => void;
  onCharKey: (char: string) => void;
  onDelKey: () => void;
  onClrKey: () => void;
  activeFunction?: FmsFunctionKey | null;
  highlightedFunctionKey?: FmsFunctionKey | null;
}

const FUNCTION_KEYS: Array<{ key: FmsFunctionKey; label: string }> = [
  { key: 'RTE', label: 'RTE' },
  { key: 'FPL', label: 'FPL' },
  { key: 'PERF', label: 'PERF' },
  { key: 'NAV', label: 'NAV' },
  { key: 'PROG', label: 'PROG' },
  { key: 'DIR', label: 'DIR' },
  { key: 'RADIO', label: 'RADIO' },
  { key: 'PREV', label: 'PREV' },
  { key: 'NEXT', label: 'NEXT' },
];

const NUMERIC_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '+/-'];

const ALPHA_KEYS = [
  'A', 'B', 'C', 'D', 'E',
  'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O',
  'P', 'Q', 'R', 'S', 'T',
  'U', 'V', 'W', 'X', 'Y',
  'Z', 'SP', 'DEL', '/', 'CLR',
];

export const McduKeypad: React.FC<McduKeypadProps> = ({
  onFunctionKey,
  onCharKey,
  onDelKey,
  onClrKey,
  highlightedFunctionKey,
}) => {
  const handleNumericClick = (k: string) => {
    if (k === '+/-') {
      onCharKey('-');
    } else {
      onCharKey(k);
    }
  };

  const handleAlphaClick = (k: string) => {
    if (k === 'DEL') {
      onDelKey();
    } else if (k === 'CLR') {
      onClrKey();
    } else if (k === 'SP') {
      onCharKey(' ');
    } else {
      onCharKey(k);
    }
  };

  return (
    <div className="mt-3 space-y-2.5 select-none">
      {/* Top Function & Paging Key Matrix */}
      <div className="grid grid-cols-9 gap-1.5 bg-slate-900/90 p-2 rounded-md border border-slate-700/70">
        {FUNCTION_KEYS.map(({ key, label }) => {
          const isHighlighted = highlightedFunctionKey === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onFunctionKey(key)}
              data-testid={`fn-key-${key}`}
              className={`mcdu-key h-9 rounded text-[11px] font-bold tracking-wider text-slate-100 flex items-center justify-center cursor-pointer ${
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

      {/* Lower Split Keypad: Left Numeric 3x4 + Right Alpha 5x6 */}
      <div className="grid grid-cols-12 gap-2.5 bg-slate-900/90 p-2.5 rounded-md border border-slate-700/70">
        {/* Left Numeric Pad (5 cols) */}
        <div className="col-span-5 grid grid-cols-3 gap-1.5 content-between">
          {NUMERIC_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleNumericClick(k)}
              data-testid={`num-key-${k}`}
              className="mcdu-key h-9 rounded-full text-xs font-bold text-slate-100 flex items-center justify-center cursor-pointer"
            >
              {k}
            </button>
          ))}
        </div>

        {/* Right Alphanumeric Matrix (7 cols -> 5 buttons per row) */}
        <div className="col-span-7 grid grid-cols-5 gap-1.5">
          {ALPHA_KEYS.map((k) => {
            const isAction = k === 'CLR' || k === 'DEL' || k === 'SP';
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
      </div>
    </div>
  );
};
