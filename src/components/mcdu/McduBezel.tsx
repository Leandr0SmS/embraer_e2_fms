import React, { useEffect, useState } from 'react';
import {
  FmsFunctionKey,
  LskId,
  McduScreenLayout,
} from '../../types/fms';
import { McduScreen } from './McduScreen';
import { McduKeypad } from './McduKeypad';
import { Volume2, VolumeX } from 'lucide-react';
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
  onKnobRotate?: (delta: -1 | 1) => void;
  highlightedLsk?: LskId | null;
  highlightedFunctionKey?: FmsFunctionKey | null;
  knobHighlighted?: boolean;
}

const CornerFastener: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`w-7 h-7 rounded-full bg-gradient-to-b from-[#b8bdc2] to-[#7e8389] border-2 border-[#1b1d20] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_1px_2px_rgba(0,0,0,0.5)] flex items-center justify-center ${className}`}
  >
    <div className="w-5 h-5 rounded-full border border-[#4b4f54] flex items-center justify-center">
      <div className="w-full h-[2.5px] bg-[#1b1d20]" />
    </div>
  </div>
);

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
  onKnobRotate,
  highlightedLsk,
  highlightedFunctionKey,
  knobHighlighted,
}) => {
  const [brightness, setBrightness] = useState(1.0);
  const [audioMuted, setAudioMuted] = useState(false);

  const toggleMute = () => {
    const nextMuted = !audioMuted;
    setAudioMuted(nextMuted);
    soundEngine.setEnabled(!nextMuted);
  };

  const handleBrightnessDelta = (delta: number) => {
    setBrightness((b) => Math.max(0.55, Math.min(1.25, Number((b + delta).toFixed(2)))));
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
    <div className="mcdu-bezel-shell relative w-full max-w-[540px] rounded-[6px] pt-2 pb-3 px-2 select-none">
      {/* Four Corner Slotted DZUS Fasteners */}
      <CornerFastener className="absolute top-1.5 left-1.5 z-20" />
      <CornerFastener className="absolute top-1.5 right-1.5 z-20" />
      <CornerFastener className="absolute bottom-1.5 left-1.5 z-20" />
      <CornerFastener className="absolute bottom-1.5 right-1.5 z-20" />

      {/* Upper Display Frame with Left LSK 1L..6L, Center Black LCD, and Right LSK 1R..6R */}
      <div className="mx-3 mt-1">
        {/* Top Sensor & Brand Bar */}
        <div className="flex items-center justify-between px-3 mb-1.5">
          <div className="flex items-center gap-2.5 pl-4">
            {/* Left Green Light Sensor */}
            <span className="w-4 h-4 rounded-full bg-[#22c55e] border border-[#14532d] shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_0_6px_rgba(34,197,94,0.6)] flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-[1px] border border-[#14532d]/70" />
            </span>
            <span className="text-[11px] font-semibold tracking-wide text-white/90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
              Honeywell
            </span>
          </div>

          {/* Right Status Annunciators (MSG / OFST), Audio Mute & Right Green Light Sensor */}
          <div className="flex items-center gap-1.5 pr-4">
            {hasActiveMessage && (
              <span className="px-1.5 py-0.5 rounded-[2px] text-[9px] font-bold tracking-wider bg-amber-400 text-black border border-black/40 animate-pulse">
                MSG
              </span>
            )}
            {hasLateralOffset && (
              <span className="px-1.5 py-0.5 rounded-[2px] text-[9px] font-bold tracking-wider bg-cyan-300 text-black border border-black/40">
                OFST
              </span>
            )}
            <button
              type="button"
              onClick={toggleMute}
              title={audioMuted ? 'Unmute Avionics Audio' : 'Mute Avionics Audio'}
              className="p-0.5 rounded bg-black/25 hover:bg-black/40 text-white/90 border border-black/30 cursor-pointer"
            >
              {audioMuted ? (
                <VolumeX className="w-3 h-3 text-rose-300" />
              ) : (
                <Volume2 className="w-3 h-3 text-emerald-300" />
              )}
            </button>
            <span className="w-4 h-4 rounded-full bg-[#22c55e] border border-[#14532d] shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_0_6px_rgba(34,197,94,0.6)] flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-[1px] border border-[#14532d]/70" />
            </span>
          </div>
        </div>

        {/* Display Grid & LSK Columns */}
        <div className="grid grid-cols-[42px_1fr_42px] items-stretch">
          {/* Left LSK Column (1L - 6L) */}
          <div className="flex flex-col justify-between pt-[26px] pb-[24px] pr-1 items-end">
            {LEFT_LSKS.map((lsk) => {
              const isTarget = highlightedLsk === lsk;
              return (
                <div key={lsk} className="w-full flex flex-col items-end">
                  {/* Horizontal Guide Bar aligned with Label Line */}
                  <div className="w-full h-[3px] bg-gradient-to-b from-[#d4d8dd] to-[#52565c] border-y border-[#2b2e33] rounded-l-full mb-1 -mr-1 z-10" />
                  <button
                    type="button"
                    onClick={() => onLskPress(lsk)}
                    title={`LSK ${lsk}`}
                    data-testid={`lsk-${lsk}`}
                    className={`mcdu-lsk-btn h-5 w-8 rounded-[3px] flex items-center justify-center cursor-pointer ${
                      isTarget ? 'ring-2 ring-amber-400 animate-pulse' : ''
                    }`}
                  >
                    <span className="w-4 h-[2.5px] bg-white rounded-full" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Recessed Display Frame & Center 14x24 Character LCD Display */}
          <div className="mcdu-display-recess p-2 rounded-[22px]">
            <McduScreen
              layout={layout}
              scratchpadInput={scratchpadInput}
              topAlertMessage={topAlertMessage}
              brightness={brightness}
            />
          </div>

          {/* Right LSK Column (1R - 6R) */}
          <div className="flex flex-col justify-between pt-[26px] pb-[24px] pl-1 items-start">
            {RIGHT_LSKS.map((lsk) => {
              const isTarget = highlightedLsk === lsk;
              return (
                <div key={lsk} className="w-full flex flex-col items-start">
                  {/* Horizontal Guide Bar aligned with Label Line */}
                  <div className="w-full h-[3px] bg-gradient-to-b from-[#d4d8dd] to-[#52565c] border-y border-[#2b2e33] rounded-r-full mb-1 -ml-1 z-10" />
                  <button
                    type="button"
                    onClick={() => onLskPress(lsk)}
                    title={`LSK ${lsk}`}
                    data-testid={`lsk-${lsk}`}
                    className={`mcdu-lsk-btn h-5 w-8 rounded-[3px] flex items-center justify-center cursor-pointer ${
                      isTarget ? 'ring-2 ring-amber-400 animate-pulse' : ''
                    }`}
                  >
                    <span className="w-4 h-[2.5px] bg-white rounded-full" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Physical Alphanumeric, Numeric, Rotary Knob & 2-Row Function Keypad */}
      <McduKeypad
        onFunctionKey={onFunctionKey}
        onCharKey={onCharKey}
        onDelKey={onDelKey}
        onClrKey={onClrKey}
        onBrightnessDelta={handleBrightnessDelta}
        onKnobRotate={onKnobRotate}
        highlightedFunctionKey={highlightedFunctionKey}
        knobHighlighted={knobHighlighted}
      />
    </div>
  );
};
