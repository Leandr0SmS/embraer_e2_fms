import React from 'react';
import { BookOpen, Copy, X } from 'lucide-react';
import { McduPageId } from '../../types/fms';

interface SyntaxExample {
  parameter: string;
  syntax: string;
  example: string;
  normalized: string;
  targetPage: McduPageId;
  targetSubPage: number;
  targetLskHint: string;
}

const SYNTAX_EXAMPLES: SyntaxExample[] = [
  {
    parameter: 'Combined Lat/Long (&LL01)',
    syntax: 'Nddmm.mmWdddmm.mm',
    example: 'N50W050',
    normalized: 'N50°00.00 W050°00.00 (&LL01)',
    targetPage: 'ACTIVE_FLT_PLAN',
    targetSubPage: 1,
    targetLskHint: 'Up-select to 3L on ACTIVE FLT PLAN or 4L on POS INIT',
  },
  {
    parameter: 'Place / Bearing / Distance (&PBD01)',
    syntax: '[WPT]/ddd/ddd.d',
    example: 'PXR/090/30',
    normalized: '&PBD01',
    targetPage: 'ACTIVE_FLT_PLAN',
    targetSubPage: 1,
    targetLskHint: 'Up-select to 3L on ACTIVE FLT PLAN',
  },
  {
    parameter: 'Place // Along-Track Distance (&PD01)',
    syntax: '[WPT]//ddd.d',
    example: 'DRK//20',
    normalized: '&PD01',
    targetPage: 'ACTIVE_FLT_PLAN',
    targetSubPage: 1,
    targetLskHint: 'Up-select to 3L on ACTIVE FLT PLAN',
  },
  {
    parameter: 'Place / Bearing Intersection (&PBPB01)',
    syntax: '[WPT1]/ddd/[WPT2]/ddd',
    example: 'PXR/275/BXK/005',
    normalized: '&PBPB01',
    targetPage: 'ACTIVE_FLT_PLAN',
    targetSubPage: 1,
    targetLskHint: 'Up-select to 3L on ACTIVE FLT PLAN',
  },
  {
    parameter: 'Full Airway Insertion',
    syntax: 'start.airway.end',
    example: 'GUP.J102.ALS',
    normalized: 'Expands ABQ -> FMN -> ALS via J102',
    targetPage: 'ACT_RTE',
    targetSubPage: 2,
    targetLskHint: 'Up-select to 2L on ACT RTE 2/3 or ACTIVE FLT PLAN',
  },
  {
    parameter: 'Multi-Airway Intersection Chain',
    syntax: 'start.awy1.awy2.end',
    example: 'FMN.J65.J4.PKE',
    normalized: 'Intersects at TCS -> PXR -> BXK -> PKE',
    targetPage: 'ACT_RTE',
    targetSubPage: 2,
    targetLskHint: 'Up-select to 2L on ACT RTE 2/3',
  },
  {
    parameter: 'Flight Level (3-Digit Rule)',
    syntax: 'ddd',
    example: '350',
    normalized: 'FL350 (35,000 FT)',
    targetPage: 'PERF_INIT',
    targetSubPage: 2,
    targetLskHint: 'Up-select to 1L (CRZ ALT) on PERF INIT 2/3',
  },
  {
    parameter: 'Window Altitude Constraint',
    syntax: 'dddddAdddddB',
    example: '16000A17000B',
    normalized: '160A/170B Window',
    targetPage: 'ACTIVE_FLT_PLAN',
    targetSubPage: 1,
    targetLskHint: 'Up-select to 2R or 3R on ACTIVE FLT PLAN',
  },
  {
    parameter: 'Speed + Altitude Constraint',
    syntax: 'cas/altA',
    example: '210/10000A',
    normalized: '210/FL100A',
    targetPage: 'ACTIVE_FLT_PLAN',
    targetSubPage: 1,
    targetLskHint: 'Up-select to 2R on ACTIVE FLT PLAN',
  },
  {
    parameter: 'Zero Fuel Weight (Thousands or Full KG)',
    syntax: 'dd.d or ddddd',
    example: '42500',
    normalized: '42.5 (Auto-updates GROSS WT)',
    targetPage: 'PERF_INIT',
    targetSubPage: 2,
    targetLskHint: 'Up-select to 2R (ZFW) on PERF INIT 2/3',
  },
  {
    parameter: 'Wind Direction / Speed',
    syntax: 'ddd/ss',
    example: '270/35',
    normalized: '270° / 035',
    targetPage: 'PERF_INIT',
    targetSubPage: 2,
    targetLskHint: 'Up-select to 2L (CRZ WIND) on PERF INIT 2/3',
  },
  {
    parameter: 'Hold Course & Turn Direction',
    syntax: 'ddd/L or ddd/R',
    example: '240/L',
    normalized: '240° / LEFT',
    targetPage: 'HOLD',
    targetSubPage: 1,
    targetLskHint: 'Up-select to 2L on ACT HOLD',
  },
  {
    parameter: 'Dash-Suffix Scratchpad Clear Rule',
    syntax: '[TEXT]- then DEL',
    example: 'N50W050-',
    normalized: 'Pushing DEL clears entire buffer',
    targetPage: 'ACT_RTE',
    targetSubPage: 1,
    targetLskHint: 'Press DEL key while string ends with "-"',
  },
];

interface ScratchpadReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadExample: (example: string, page: McduPageId, subPage: number) => void;
}

export const ScratchpadReferenceModal: React.FC<ScratchpadReferenceModalProps> = ({
  isOpen,
  onClose,
  onLoadExample,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl max-h-[85vh] rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Honeywell NG FMS Scratchpad Syntax & Data Entry Matrix
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-2">
          {SYNTAX_EXAMPLES.map((item) => (
            <div
              key={item.parameter}
              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-100">
                    {item.parameter}
                  </span>
                  <span className="font-mcdu text-[11px] px-1.5 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                    {item.syntax}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  <span className="text-emerald-400 font-mcdu">{item.example}</span>
                  {' → '}
                  <span className="text-slate-200 font-mcdu">{item.normalized}</span>
                  {' • '}
                  <span>{item.targetLskHint}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onLoadExample(item.example, item.targetPage, item.targetSubPage);
                  onClose();
                }}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                Load in Scratchpad
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
