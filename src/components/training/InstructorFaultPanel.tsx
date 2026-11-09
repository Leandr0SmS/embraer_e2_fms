import React from 'react';
import { FaultScenarioType, FmsStoreState } from '../../store/useFmsStore';
import {
  AlertTriangle,
  Calculator,
  CheckCircle,
  Flame,
  Gauge,
  MapPinOff,
  Scale,
  Unplug,
} from 'lucide-react';

interface FaultCard {
  id: FaultScenarioType;
  title: string;
  subtitle: string;
  annunciation: string;
  icon: React.ReactNode;
}

const FAULT_SCENARIOS: FaultCard[] = [
  {
    id: 'UNINITIALIZED_POS',
    title: 'GPS Position Uninitialized',
    subtitle: 'Triggers reverse-video POS INIT> on NAV IDENT',
    annunciation: 'POS INIT REQUIRED',
    icon: <MapPinOff className="w-4 h-4 text-amber-400" />,
  },
  {
    id: 'INVALID_CG',
    title: 'Takeoff CG Out of Limits',
    subtitle: 'Highlights TAKEOFF CG in reverse video on PERF INIT 2/3',
    annunciation: 'CHECK TAKEOFF CG',
    icon: <Scale className="w-4 h-4 text-rose-400" />,
  },
  {
    id: 'OVERWEIGHT_GW',
    title: 'Max Gross Weight Exceedance',
    subtitle: 'Sets GW = 64.0t (> 61.5t MaxTOW) in reverse video',
    annunciation: 'EXCEEDS MAX GROSS WEIGHT',
    icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
  },
  {
    id: 'ROUTE_DISCONTINUITY',
    title: 'Route Discontinuity Injection',
    subtitle: 'Inserts discontinuity before BUSPA (use DEL + 3L to close)',
    annunciation: 'ROUTE DISCONTINUITY',
    icon: <Unplug className="w-4 h-4 text-cyan-400" />,
  },
  {
    id: 'VSPEED_MISMATCH',
    title: 'V-Speed Order Violation (V1 > VR)',
    subtitle: 'Sets V1=144 > VR=138 in white reverse video',
    annunciation: 'CHECK VSPEEDS',
    icon: <Gauge className="w-4 h-4 text-rose-400" />,
  },
  {
    id: 'ENGINE_OUT',
    title: 'Engine-Out (EO) Mode',
    subtitle: 'Activates EO driftdown & EO PROGRESS / CRUISE pages',
    annunciation: 'EO MAX CONT THRUST',
    icon: <Flame className="w-4 h-4 text-orange-400" />,
  },
];

interface InstructorFaultPanelProps {
  state: FmsStoreState;
}

export const InstructorFaultPanel: React.FC<InstructorFaultPanelProps> = ({
  state,
}) => {
  return (
    <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Instructor Scenario & Fault Injection
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Inject abnormal avionics states to practice pilot recovery procedures
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => state.computeToldVSpeeds()}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 cursor-pointer"
            title="Auto-calculate TOLD V1, VR, V2, VFS for current Gross Weight & Flap"
          >
            <Calculator className="w-3.5 h-3.5" />
            Compute TOLD V-Speeds
          </button>
          <button
            type="button"
            onClick={() => state.resetToInitializedPreflight()}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Load Ready State
          </button>
        </div>
      </div>

      {/* Fault Scenario Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {FAULT_SCENARIOS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => state.injectFaultScenario(f.id)}
            className="text-left p-2.5 rounded-lg bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-600 transition-colors flex items-start gap-2.5 cursor-pointer group"
          >
            <div className="mt-0.5 p-1.5 rounded-md bg-slate-900 border border-slate-800 group-hover:border-slate-700">
              {f.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-200 truncate">
                {f.title}
              </div>
              <div className="text-[11px] text-slate-400 leading-snug mt-0.5">
                {f.subtitle}
              </div>
              <div className="mt-1 inline-block font-mcdu text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-amber-300 border border-amber-500/30">
                {f.annunciation}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Live FMS Telemetry Summary */}
      <div className="pt-2 border-t border-slate-800/80 grid grid-cols-4 gap-2 text-center">
        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase">Gross Wt</div>
          <div className="font-mcdu text-xs font-bold text-cyan-300 mt-0.5">
            {state.weights.grossWeight !== null
              ? `${state.weights.grossWeight.toFixed(1)}t`
              : '□□.□'}
          </div>
        </div>
        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase">Cruise Alt</div>
          <div className="font-mcdu text-xs font-bold text-emerald-400 mt-0.5">
            {state.altitude.cruiseAltitudeFt !== null
              ? `FL${Math.round(state.altitude.cruiseAltitudeFt / 100)}`
              : '□□□□□'}
          </div>
        </div>
        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase">V1 / VR / V2</div>
          <div className="font-mcdu text-xs font-bold text-emerald-400 mt-0.5">
            {state.speeds.takeoffSpeeds.v1 ?? '--'}/
            {state.speeds.takeoffSpeeds.vr ?? '--'}/
            {state.speeds.takeoffSpeeds.v2 ?? '--'}
          </div>
        </div>
        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase">Msg Stack</div>
          <div className="font-mcdu text-xs font-bold text-amber-300 mt-0.5">
            {state.messages.length} Active
          </div>
        </div>
      </div>
    </div>
  );
};
