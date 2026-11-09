import React, { useEffect, useState } from 'react';
import {
  FmsFunctionKey,
  LskId,
  McduScreenLayout,
} from '../../types/fms';
import { McduScreen } from './McduScreen';
import { McduKeypad } from './McduKeypad';
import { Volume2, VolumeX, Sun } from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine';

const LEFT_LSKS: LskId[] = ['1L', '2L', '3L', '4L', '5L', '6L'];
const RIGHT_LSKS: LskId[] = ['1R', '2R', '3R', '4R', '5R', '6R'];

interface McduBezelProps {
  layout: McduScreenLayout;
  scratchpadInput: string;
  topAlertMessage?: string;
  hasActiveMessage: boolean;
  hasLateralOffset: boolean;
  onLskPress: (lsk: LskId) => void;
  onFunctionKey: (key: FmsFunctionKey) => void;
  onCharKey: (char: string) => void;
  onDelKey: () => void;
  onClrKey: () => void;
  highlightedLsk?: LskId | null;
  highlightedFunctionKey?: FmsFunctionKey | null;
}

export const McduBezel: React.FC<McduBezelProps> = ({
  layout,
  scratchpadInput,
  topAlertMessage,
  hasActiveMessage,
  hasLateralOffset,
  onLskPress,
  onFunctionKey,
  onCharKey,
  onDelKey,
  onClrKey,
  highlightedLsk,
  highlightedFunctionKey,
}) => {
  const [brightness, setBrightness] = useState(1.0);
  const [audioMuted, setAudioMuted] = useState(false);

  const toggleMute = () => {
    const nextMuted = !audioMuted;
    setAudioMuted(nextMuted);
    soundEngine.setEnabled(!nextMuted);
  };

  // Physical Keyboard Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        onClrKey();
        return;
      }
      if (e.key === 'Delete') {
        e.preventDefault();
        onDelKey();
        return;
      }
      if (e.key === 'PageUp') {
        e.preventDefault();
        onFunctionKey('PREV');
        return;
      }
      if (e.key === 'PageDown') {
        e.preventDefault();
        onFunctionKey('NEXT');
        return;
      }

      const upper = e.key.toUpperCase();
      if (/^[A-Z0-9./+\- ]$/.test(upper) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onCharKey(upper);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCharKey, onClrKey, onDelKey, onFunctionKey]);

  return (
    <div className="w-full max-w-[540px] rounded-2xl bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 p-4 border-2 border-slate-700/80 shadow-[0_20px_60px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.15)]">
      {/* Top Bezel Header Plate & Annunciators */}
      <div className="flex items-center justify-between mb-2.5 px-2">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-slate-700 border border-slate-500 shadow-inner inline-block" />
          <span className="text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase">
            HONEYWELL MC-860 • E2 NG FMS
          </span>
        </div>

        {/* Annunciator Lights (MSG / OFST) + Audio / Brightness Controls */}
        <div className="flex items-center gap-2.5">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border transition-colors ${
              hasActiveMessage
                ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse'
                : 'bg-slate-900 text-slate-600 border-slate-800'
            }`}
          >
            MSG
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border transition-colors ${
              hasLateralOffset
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                : 'bg-slate-900 text-slate-600 border-slate-800'
            }`}
          >
            OFST
          </span>

          <button
            type="button"
            onClick={() =>
              setBrightness((b) => (b >= 1.15 ? 0.75 : Number((b + 0.2).toFixed(2))))
            }
            title="Cycle Display Brightness (BRT/DIM)"
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 cursor-pointer"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={toggleMute}
            title={audioMuted ? 'Unmute Avionics Audio' : 'Mute Avionics Audio'}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 cursor-pointer"
          >
            {audioMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>
        </div>
      </div>

      {/* Upper Display Frame with Left LSK 1L..6L and Right LSK 1R..6R */}
      <div className="grid grid-cols-[44px_1fr_44px] gap-2 items-stretch bg-slate-950/90 p-2.5 rounded-xl border border-slate-800 shadow-inner">
        {/* Left LSK Column (1L - 6L) */}
        <div className="flex flex-col justify-between py-[24px]">
          {LEFT_LSKS.map((lsk) => {
            const isTarget = highlightedLsk === lsk;
            return (
              <button
                key={lsk}
                type="button"
                onClick={() => onLskPress(lsk)}
                data-testid={`lsk-${lsk}`}
                className={`mcdu-key h-7 w-full rounded flex items-center justify-between px-1.5 text-[10px] font-bold text-slate-200 cursor-pointer ${
                  isTarget
                    ? 'ring-2 ring-amber-400 animate-pulse text-amber-300'
                    : ''
                }`}
              >
                <span>{lsk}</span>
                <span className="w-1.5 h-0.5 bg-slate-400 rounded-full" />
              </button>
            );
          })}
        </div>

        {/* Center 14x24 Character LCD Display */}
        <McduScreen
          layout={layout}
          scratchpadInput={scratchpadInput}
          topAlertMessage={topAlertMessage}
          brightness={brightness}
        />

        {/* Right LSK Column (1R - 6R) */}
        <div className="flex flex-col justify-between py-[24px]">
          {RIGHT_LSKS.map((lsk) => {
            const isTarget = highlightedLsk === lsk;
            return (
              <button
                key={lsk}
                type="button"
                onClick={() => onLskPress(lsk)}
                data-testid={`lsk-${lsk}`}
                className={`mcdu-key h-7 w-full rounded flex items-center justify-between px-1.5 text-[10px] font-bold text-slate-200 cursor-pointer ${
                  isTarget
                    ? 'ring-2 ring-amber-400 animate-pulse text-amber-300'
                    : ''
                }`}
              >
                <span className="w-1.5 h-0.5 bg-slate-400 rounded-full" />
                <span>{lsk}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Physical Alphanumeric & Function Keypad */}
      <McduKeypad
        onFunctionKey={onFunctionKey}
        onCharKey={onCharKey}
        onDelKey={onDelKey}
        onClrKey={onClrKey}
        highlightedFunctionKey={highlightedFunctionKey}
      />
    </div>
  );
};
