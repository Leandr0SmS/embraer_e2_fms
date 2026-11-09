/**
 * Unified Zustand State Machine & FMS Computation Engine (Step 4)
 * Manages Scratchpad Stack, Priority Alert Queue, Page Navigation,
 * Active/Mod Flight Plan Predictions, Weight/Balance, and V-Speeds.
 */

import { create } from 'zustand';
import {
  FmsAltitudeData,
  FmsAtmosphericData,
  FmsFlightPlan,
  FmsFunctionKey,
  FmsSpeedData,
  FmsWaypoint,
  FmsWeightData,
  LskId,
  McduPageId,
  ScratchpadMessage,
  ScratchpadPriority,
} from '../types/fms';
import {
  NAV_AIRPORTS,
  NAV_COMPANY_ROUTES,
  NAV_FIXES,
  lookupNavPoint,
} from '../data/navdb';
import { calculateDistanceNm, formatLatLonMcdu } from '../utils/geo';
import {
  parseAirwayEntry,
  parseAltimeterInput,
  parseCasSpeed,
  parseCombinedLatLon,
  parseCustomWaypoint,
  parseFuelWeightInput,
  parseHoldCourseTurn,
  parseHoldLeg,
  parseLateralOffset,
  parseMCDUAltitudeInput,
  parseMachSpeed,
  parseRunwaySlope,
  parseTakeoffCg,
  parseTemperatureInput,
  parseWaypointConstraintInput,
  parseWindInput,
  parseZfwInput,
  validateVSpeedsHierarchy,
} from '../engine/scratchpadParser';
import { soundEngine } from '../audio/soundEngine';

const PRIORITY_RANK: Record<ScratchpadPriority, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

/**
 * Recompute DTG, Cumulative DTG, ETA, EFOB, and VNAV projected altitude across waypoints
 */
export function computeFlightPlanPredictions(
  plan: FmsFlightPlan,
  fuelOnBoard: number,
  cruiseAltFt: number | null,
  cruiseMach: number
): FmsFlightPlan {
  const crzAlt = cruiseAltFt ?? 35000;
  const groundSpeedKts = Math.max(280, Math.round(cruiseMach * 575));
  const fuelBurnPerNm = 0.0165; // ~16.5 kg per NM in thousands

  let cumulativeNm = 0;
  let remainingFuel = fuelOnBoard;
  // Base departure time 12:14 UTC (734 minutes from 00:00z)
  let elapsedMinutes = 12 * 60 + 14;

  const updatedWaypoints: FmsWaypoint[] = plan.waypoints.map((wpt, idx) => {
    if (wpt.type === 'DISCONTINUITY') {
      return {
        ...wpt,
        predictions: {
          etaUtc: '----z',
          dtgNm: 0,
          cumulativeDtgNm: Math.round(cumulativeNm),
          efobKg: Number(remainingFuel.toFixed(1)),
          predictedAltitudeFt: crzAlt,
        },
      };
    }

    let legDist = 0;
    if (idx > 0) {
      // Find previous non-discontinuity waypoint
      for (let p = idx - 1; p >= 0; p--) {
        if (plan.waypoints[p].type !== 'DISCONTINUITY') {
          legDist = calculateDistanceNm(plan.waypoints[p].coordinates, wpt.coordinates);
          break;
        }
      }
    }

    cumulativeNm += legDist;
    const legTimeMin = legDist > 0 ? Math.max(1, Math.round((legDist / groundSpeedKts) * 60)) : 0;
    elapsedMinutes += legTimeMin;
    remainingFuel = Math.max(0, remainingFuel - legDist * fuelBurnPerNm);

    const hh = String(Math.floor((elapsedMinutes / 60) % 24)).padStart(2, '0');
    const mm = String(elapsedMinutes % 60).padStart(2, '0');

    // Projected altitude profile
    let projAlt = crzAlt;
    if (idx === 0) {
      const originApt = NAV_AIRPORTS[plan.origin];
      projAlt = originApt ? Math.round(originApt.elevationFt / 100) * 100 || 3000 : 3000;
    } else if (idx === 1) {
      projAlt = Math.min(crzAlt, 10000);
    } else if (idx === plan.waypoints.length - 1) {
      const destApt = NAV_AIRPORTS[plan.destination];
      projAlt = destApt ? Math.max(300, Math.round(destApt.elevationFt / 100) * 100) : 300;
    }

    if (wpt.constraint?.altitudeValue1) {
      projAlt = wpt.constraint.altitudeValue1;
    }

    // Detect irrational descent constraint (> 6.0 deg descent angle ~ 635 ft/NM)
    let isIrrational = wpt.constraint?.isIrrational ?? false;
    if (idx > 0 && wpt.constraint?.altitudeValue1 && legDist > 0) {
      const prevAlt =
        plan.waypoints[idx - 1].constraint?.altitudeValue1 ??
        plan.waypoints[idx - 1].predictions.predictedAltitudeFt;
      const altDrop = prevAlt - wpt.constraint.altitudeValue1;
      const degAngle = Math.atan2(altDrop / 6076.12, legDist) * (180 / Math.PI);
      isIrrational = degAngle > 6.0;
    }

    return {
      ...wpt,
      constraint: wpt.constraint
        ? { ...wpt.constraint, isIrrational }
        : undefined,
      predictions: {
        etaUtc: `${hh}${mm}z`,
        dtgNm: Math.round(legDist * 10) / 10,
        cumulativeDtgNm: Math.round(cumulativeNm),
        efobKg: Number(remainingFuel.toFixed(1)),
        predictedAltitudeFt: projAlt,
      },
    };
  });

  return {
    ...plan,
    waypoints: updatedWaypoints,
  };
}

export function createDefaultFlightPlan(): FmsFlightPlan {
  const sbgr = NAV_AIRPORTS.SBGR;
  const sbrj = NAV_AIRPORTS.SBRJ;
  const vexim = NAV_FIXES.VEXIM;
  const buspa = NAV_FIXES.BUSPA;

  const basePlan: FmsFlightPlan = {
    id: 'ACTIVE-FPL-1',
    planType: 'ACTIVE',
    origin: 'SBGR',
    destination: 'SBRJ',
    runway: '09L',
    sid: 'VEXIM1A',
    star: 'BUSPA1A',
    approach: 'RNP 02R',
    companyRoute: 'GRUJSD01',
    alternate: 'SBGL',
    flightId: 'AZU1420',
    lateralOffset: null,
    activeWaypointIndex: 1,
    waypoints: [
      {
        id: 'wpt-0',
        ident: 'SBGR09L',
        type: 'AIRPORT',
        coordinates: { lat: sbgr.lat, lon: sbgr.lon },
        viaAirway: 'ORIGIN',
        predictions: { etaUtc: '1214z', dtgNm: 0, cumulativeDtgNm: 0, efobKg: 14.2, predictedAltitudeFt: 3000 },
      },
      {
        id: 'wpt-1',
        ident: 'VEXIM',
        type: 'FIX',
        coordinates: { lat: vexim.lat, lon: vexim.lon },
        viaAirway: 'VEXIM1A',
        constraint: { altitudeType: 'AT_OR_ABOVE', altitudeValue1: 10000, speedConstraint: 250 },
        predictions: { etaUtc: '1218z', dtgNm: 18, cumulativeDtgNm: 18, efobKg: 13.8, predictedAltitudeFt: 10000 },
      },
      {
        id: 'wpt-2',
        ident: 'BUSPA',
        type: 'FIX',
        coordinates: { lat: buspa.lat, lon: buspa.lon },
        viaAirway: 'UZ1',
        predictions: { etaUtc: '1229z', dtgNm: 74, cumulativeDtgNm: 92, efobKg: 12.9, predictedAltitudeFt: 28000 },
      },
      {
        id: 'wpt-3',
        ident: 'SBRJ',
        type: 'AIRPORT',
        coordinates: { lat: sbrj.lat, lon: sbrj.lon },
        viaAirway: 'BUSPA1A',
        predictions: { etaUtc: '1305z', dtgNm: 118, cumulativeDtgNm: 210, efobKg: 10.5, predictedAltitudeFt: 300 },
      },
    ],
  };

  return computeFlightPlanPredictions(basePlan, 14.2, 28000, 0.78);
}

export type FaultScenarioType =
  | 'UNINITIALIZED_POS'
  | 'INVALID_CG'
  | 'OVERWEIGHT_GW'
  | 'ROUTE_DISCONTINUITY'
  | 'VSPEED_MISMATCH'
  | 'ENGINE_OUT';

export interface FmsStoreState {
  // Navigation & Page State
  activePage: McduPageId;
  subPageIndex: number;
  hasVerifiedNavIdent: boolean;
  directToMode: boolean;

  // Scratchpad & Message Stack
  scratchpadInput: string;
  deleteMode: boolean;
  messages: ScratchpadMessage[];

  // Aircraft & FMS Core State
  tailNumber: string;
  perfFactorPercent: number;
  passengers: number;
  positionInitialized: boolean;
  loadedPosCoords: string;
  posSource: 'LAST' | 'REF' | 'GPS' | 'MANUAL';
  cgInvalidFlag: boolean;
  perfInitConfirmed: boolean;
  engineOutMode: boolean;

  weights: FmsWeightData;
  speeds: FmsSpeedData;
  flightPlan: FmsFlightPlan;
  modFlightPlan: FmsFlightPlan | null;
  atmosphere: FmsAtmosphericData;
  altitude: FmsAltitudeData;

  takeoffConfig: {
    rwySlopePercent: number;
    rwyCondition: 'DRY' | 'WET' | 'CNTMNTD';
    flap: 1 | 2 | 3 | 4;
    pitchTrim: string;
    thrustMode: 'TO-1' | 'TO-2' | 'TO-3';
    pressAltFt: number;
  };

  radios: {
    nav1Freq: string;
    nav1Ident: string;
    nav2Freq: string;
    nav2Ident: string;
    com1Freq: string;
    com2Freq: string;
    xpdrCode: string;
  };

  holdConfig: {
    waypoint: string;
    course: number;
    turn: 'L' | 'R';
    legMode: 'TIME' | 'DIST';
    legValue: number;
  };

  customWaypointCounters: {
    ll: number;
    pbd: number;
    pd: number;
    pbpb: number;
  };

  // Training & Guided Mode
  trainingMode: 'FREE' | 'GUIDED';
  guidedStepIndex: number;

  // Scratchpad Actions
  typeScratchpadChar: (char: string) => void;
  setScratchpadInput: (text: string) => void;
  pressDelKey: () => void;
  pressClrKey: () => void;
  pushMessage: (text: string, priority?: ScratchpadPriority) => void;
  clearAllMessages: () => void;

  // Navigation Actions
  pressFunctionKey: (key: FmsFunctionKey) => void;
  navigateToPage: (page: McduPageId, subPage?: number) => void;
  pressLsk: (lsk: LskId) => void;

  // Direct Helper Actions & Training Controls
  computeToldVSpeeds: () => void;
  setTrainingMode: (mode: 'FREE' | 'GUIDED') => void;
  setGuidedStepIndex: (step: number) => void;
  injectFaultScenario: (fault: FaultScenarioType) => void;
  resetToColdPreflight: () => void;
  resetToInitializedPreflight: () => void;
}

export const useFmsStore = create<FmsStoreState>((set, get) => ({
  activePage: 'NAV_IDENT',
  subPageIndex: 1,
  hasVerifiedNavIdent: true,
  directToMode: false,

  scratchpadInput: '',
  deleteMode: false,
  messages: [],

  tailNumber: 'PR-E2A',
  perfFactorPercent: 0.0,
  passengers: 114,
  positionInitialized: true,
  loadedPosCoords: 'S23°37.3 W046°39.5',
  posSource: 'GPS',
  cgInvalidFlag: false,
  perfInitConfirmed: false,
  engineOutMode: false,

  weights: {
    zeroFuelWeight: null, // Uninitialized '□□.□' per Page 7 spec
    fuelSource: 'GAUGE',
    fuelOnBoard: 14.2,
    grossWeight: 51.8,
    takeoffCg: null,      // Uninitialized '□□.□' per Page 7 spec
    fuelReserve: {
      mode: 'MINUTES',
      value: 45,
    },
    alternateFuel: 1.2,
    fuelAllowances: {
      takeoff: 0.4,
      landing: 0.2,
    },
    maxGrossWeight: 61.5,
  },

  speeds: {
    takeoffSpeeds: {
      v1: 134,
      vr: 138,
      v2: 142,
      vfs: 182,
    },
    landingSpeeds: {
      vref: 126,
      vapp: 131,
      vac: 138,
      gaSpeed: 145,
    },
    activeSchedule: {
      climbMode: 'ECON',
      climbCasMach: { cas: 270, mach: 0.74 },
      cruiseMode: 'ECON',
      cruiseMach: 0.78,
      descentMode: 'ECON',
      descentCasMach: { cas: 280, mach: 0.76 },
    },
    limits: {
      vmo: 320,
      mmo: 0.82,
      speedLimitAlt: { speed: 250, alt: 10000 },
    },
  },

  flightPlan: createDefaultFlightPlan(),
  modFlightPlan: null,

  atmosphere: {
    averageCruiseWind: { direction: 270, speed: 35 },
    surfaceWind: { direction: 80, speed: 12 },
    waypointWinds: {
      VEXIM: [{ altitudeFt: 10000, direction: 260, speed: 22, tempC: -5 }],
      BUSPA: [{ altitudeFt: 28000, direction: 275, speed: 38, tempC: -38 }],
    },
    isaDeviationC: 5,
    surfaceOatC: 22,
    flexTemperatureC: 48,
    altimeter: {
      unit: 'HPA',
      value: 1013,
    },
    tempCompensation: {
      status: 'OFF',
      landingOatC: 24,
      isActivated: false,
    },
  },

  altitude: {
    cruiseAltitudeFt: null, // Uninitialized '□□□□□' per Page 7 spec
    transitionAltitudeFt: 8000,
    afeLimitFt: 1500,
    vnavCaptureAfeFt: 1000,
    optimumAltitudeFt: 36000,
    certifiedCeilingFt: 41000,
  },

  takeoffConfig: {
    rwySlopePercent: 0.2,
    rwyCondition: 'DRY',
    flap: 2,
    pitchTrim: '4.2 UP',
    thrustMode: 'TO-1',
    pressAltFt: 2410,
  },

  radios: {
    nav1Freq: '115.30',
    nav1Ident: 'VOR BCO 115.3',
    nav2Freq: '116.20',
    nav2Ident: 'VOR CPN 116.2',
    com1Freq: '121.900',
    com2Freq: '118.100',
    xpdrCode: '4512',
  },

  holdConfig: {
    waypoint: 'BUSPA',
    course: 180,
    turn: 'R',
    legMode: 'TIME',
    legValue: 1.5,
  },

  customWaypointCounters: {
    ll: 1,
    pbd: 1,
    pd: 1,
    pbpb: 1,
  },

  trainingMode: 'GUIDED',
  guidedStepIndex: 0,

  typeScratchpadChar: (char: string) => {
    soundEngine.playKeyClick();
    const state = get();
    // If an alert message is visible, typing clears the top alert message or appends to underlying buffer
    if (state.deleteMode) {
      set({ deleteMode: false, scratchpadInput: char.slice(0, 24) });
      return;
    }
    if (state.scratchpadInput.length >= 24) {
      state.pushMessage('INVALID ENTRY', 'HIGH');
      return;
    }
    set({
      scratchpadInput: (state.scratchpadInput + char.toUpperCase()).slice(0, 24),
    });
  },

  setScratchpadInput: (text: string) => {
    set({
      scratchpadInput: text.toUpperCase().slice(0, 24),
      deleteMode: false,
    });
  },

  pressDelKey: () => {
    soundEngine.playKeyClick(980);
    const state = get();
    // Specification Section 5.2: If pilot types a partial scratchpad entry followed by '-' (e.g. 'N50W050-'),
    // pushing DEL immediately clears the entire scratchpad string!
    if (state.scratchpadInput.endsWith('-')) {
      set({ scratchpadInput: '', deleteMode: false });
      return;
    }
    set({
      deleteMode: true,
      scratchpadInput: 'DELETE',
    });
  },

  pressClrKey: () => {
    soundEngine.playKeyClick(1020);
    const state = get();
    // Specification Section 5.1: Dual-role CLR key
    // 1. If a scratchpad message is present, clear the top message first, restoring typed buffer
    if (state.messages.length > 0) {
      set({ messages: state.messages.slice(1) });
      return;
    }
    // 2. If in DELETE mode, clear DELETE mode
    if (state.deleteMode || state.scratchpadInput === 'DELETE') {
      set({ deleteMode: false, scratchpadInput: '' });
      return;
    }
    // 3. Otherwise delete last character of scratchpad input
    if (state.scratchpadInput.length > 0) {
      set({ scratchpadInput: state.scratchpadInput.slice(0, -1) });
    }
  },

  pushMessage: (text: string, priority: ScratchpadPriority = 'HIGH') => {
    if (priority === 'HIGH') {
      soundEngine.playErrorBeep();
    }
    const state = get();
    const filtered = state.messages.filter((m) => m.text !== text);
    const newMsg: ScratchpadMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text,
      priority,
      timestamp: Date.now(),
    };
    // Priority sort: HIGH > MEDIUM > LOW, and FILO (newest first) for equal priority
    const combined = [newMsg, ...filtered].sort(
      (a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]
    );
    set({ messages: combined });
  },

  clearAllMessages: () => {
    set({ messages: [] });
  },

  navigateToPage: (page: McduPageId, subPage = 1) => {
    set({
      activePage: page,
      subPageIndex: subPage,
      directToMode: false,
    });
  },

  pressFunctionKey: (key: FmsFunctionKey) => {
    soundEngine.playKeyClick(1220);
    const state = get();

    // Specification Section 5.1: Following avionics power-up on RADIO page,
    // selecting any FMS function key transitions directly to NAV IDENT (1/1)
    const fmsKeys: FmsFunctionKey[] = ['PERF', 'NAV', 'FPL', 'PROG', 'RTE', 'DIR'];
    if (
      state.activePage === 'RADIO' &&
      !state.hasVerifiedNavIdent &&
      fmsKeys.includes(key)
    ) {
      set({
        activePage: 'NAV_IDENT',
        subPageIndex: 1,
        hasVerifiedNavIdent: true,
      });
      return;
    }

    switch (key) {
      case 'RADIO':
        set({ activePage: 'RADIO', subPageIndex: 1, directToMode: false });
        break;
      case 'PERF':
        set({ activePage: 'PERF_INDEX', subPageIndex: 1, directToMode: false });
        break;
      case 'NAV':
        set({ activePage: 'NAV_INDEX', subPageIndex: 1, directToMode: false });
        break;
      case 'FPL':
        set({ activePage: 'ACTIVE_FLT_PLAN', subPageIndex: 1, directToMode: false });
        break;
      case 'PROG':
        set({ activePage: 'PROGRESS', subPageIndex: 1, directToMode: false });
        break;
      case 'RTE':
        set({ activePage: 'ACT_RTE', subPageIndex: 1, directToMode: false });
        break;
      case 'DIR':
        set({
          activePage: 'ACTIVE_FLT_PLAN',
          subPageIndex: 1,
          directToMode: !state.directToMode,
        });
        break;
      case 'NEXT':
      case 'PREV': {
        const delta = key === 'NEXT' ? 1 : -1;
        let maxPages = 1;
        if (state.activePage === 'PERF_INDEX' || state.activePage === 'NAV_INDEX') {
          maxPages = 2;
        } else if (
          state.activePage === 'PERF_INIT' ||
          state.activePage === 'ACT_RTE' ||
          state.activePage === 'PROGRESS'
        ) {
          maxPages = 3;
        } else if (
          state.activePage === 'TAKEOFF_INIT' ||
          state.activePage === 'TAKEOFF_VSPEEDS'
        ) {
          // Toggle between TAKEOFF INIT (1/2) and TAKEOFF VSPEEDS (2/2)
          set({
            activePage:
              state.activePage === 'TAKEOFF_INIT'
                ? 'TAKEOFF_VSPEEDS'
                : 'TAKEOFF_INIT',
            subPageIndex: 1,
          });
          return;
        } else if (state.activePage === 'ACTIVE_FLT_PLAN') {
          const plan = state.modFlightPlan ?? state.flightPlan;
          maxPages = Math.max(1, Math.ceil(plan.waypoints.length / 4));
        }

        if (maxPages > 1) {
          const nextIdx =
            ((state.subPageIndex - 1 + delta + maxPages) % maxPages) + 1;
          set({ subPageIndex: nextIdx });
        }
        break;
      }
    }
  },

  computeToldVSpeeds: () => {
    const state = get();
    const gw = state.weights.grossWeight ?? 51.8;
    const flap = state.takeoffConfig.flap;
    // Realistic E195-E2 TOLD formula based on Gross Weight & Flap setting
    const weightDelta = Math.round((gw - 50.0) * 1.4);
    const flapOffset = (flap - 2) * -4;
    const v1 = Math.max(112, Math.min(162, 132 + weightDelta + flapOffset));
    const vr = v1 + 4;
    const v2 = vr + 4;
    const vfs = Math.max(165, Math.round(v2 * 1.28));

    set({
      speeds: {
        ...state.speeds,
        takeoffSpeeds: { v1, vr, v2, vfs },
      },
    });
    soundEngine.playConfirmChime();
  },

  pressLsk: (lsk: LskId) => {
    soundEngine.playKeyClick(1100);
    const state = get();
    const sp = state.scratchpadInput.trim();
    const isDelete = state.deleteMode || sp === 'DELETE';

    const consumeScratchpad = () => {
      set({ scratchpadInput: '', deleteMode: false });
    };

    const downSelect = (val: string | null | undefined) => {
      if (!sp && val) {
        set({ scratchpadInput: val.toUpperCase().slice(0, 24), deleteMode: false });
      }
    };

    // =========================================================================
    // 1. RADIO PAGE (Power-Up Default)
    // =========================================================================
    if (state.activePage === 'RADIO') {
      if (lsk === '6R') {
        set({ activePage: 'NAV_IDENT', subPageIndex: 1, hasVerifiedNavIdent: true });
        return;
      }
      if (lsk === '1L' && sp) {
        set({ radios: { ...state.radios, com1Freq: sp } });
        consumeScratchpad();
      } else if (lsk === '1R' && sp) {
        set({ radios: { ...state.radios, com2Freq: sp } });
        consumeScratchpad();
      } else if (lsk === '2L' && sp) {
        set({ radios: { ...state.radios, nav1Freq: sp, nav1Ident: `VOR ${sp}` } });
        consumeScratchpad();
      } else if (lsk === '2R' && sp) {
        set({ radios: { ...state.radios, nav2Freq: sp, nav2Ident: `VOR ${sp}` } });
        consumeScratchpad();
      }
      return;
    }

    // =========================================================================
    // 2. NAV IDENT 1/1
    // =========================================================================
    if (state.activePage === 'NAV_IDENT') {
      if (lsk === '6R') {
        set({ activePage: 'POS_INIT', subPageIndex: 1 });
      } else if (lsk === '6L' || lsk === '5L') {
        set({ activePage: 'NAV_INDEX', subPageIndex: 2 });
      }
      return;
    }

    // =========================================================================
    // 3. POSITION INIT 1/1
    // =========================================================================
    if (state.activePage === 'POS_INIT') {
      if (lsk === '1R') {
        set({
          positionInitialized: true,
          loadedPosCoords: 'S23°37.4 W046°39.4',
          posSource: 'LAST',
        });
        soundEngine.playConfirmChime();
      } else if (lsk === '2R') {
        const originApt = NAV_AIRPORTS[state.flightPlan.origin] ?? NAV_AIRPORTS.SBGR;
        set({
          positionInitialized: true,
          loadedPosCoords: formatLatLonMcdu(originApt.lat, originApt.lon),
          posSource: 'REF',
        });
        soundEngine.playConfirmChime();
      } else if (lsk === '3R') {
        set({
          positionInitialized: true,
          loadedPosCoords: 'S23°37.3 W046°39.5',
          posSource: 'GPS',
        });
        soundEngine.playConfirmChime();
      } else if (lsk === '4L') {
        if (!sp) {
          downSelect(state.loadedPosCoords.replace(/[°\s]/g, ''));
          return;
        }
        const parsed = parseCombinedLatLon(sp);
        if (!parsed.valid || !parsed.formatted) {
          state.pushMessage(parsed.error || 'INVALID ENTRY', 'HIGH');
          return;
        }
        set({
          positionInitialized: true,
          loadedPosCoords: parsed.formatted,
          posSource: 'MANUAL',
        });
        consumeScratchpad();
        soundEngine.playConfirmChime();
      } else if (lsk === '6L') {
        set({ activePage: 'NAV_INDEX', subPageIndex: 2 });
      } else if (lsk === '6R') {
        set({ activePage: 'ACT_RTE', subPageIndex: 1 });
      }
      return;
    }

    // =========================================================================
    // 4. ACT RTE (1/3 - 3/3)
    // =========================================================================
    if (state.activePage === 'ACT_RTE') {
      const plan = state.modFlightPlan ?? state.flightPlan;

      if (state.subPageIndex === 1) {
        if (lsk === '1L') {
          if (isDelete) {
            state.pushMessage('INVALID DELETE', 'HIGH');
            return;
          }
          if (!sp) {
            downSelect(plan.origin);
            return;
          }
          const apt = NAV_AIRPORTS[sp];
          if (!apt) {
            state.pushMessage('INVALID ENTRY', 'HIGH');
            return;
          }
          const defaultRwy = apt.runways[0]?.ident ?? '09L';
          const updatedPlan = computeFlightPlanPredictions(
            {
              ...plan,
              origin: apt.icao,
              runway: defaultRwy,
              waypoints: [
                {
                  id: `wpt-orig-${Date.now()}`,
                  ident: `${apt.icao}${defaultRwy}`,
                  type: 'AIRPORT',
                  coordinates: { lat: apt.lat, lon: apt.lon },
                  viaAirway: 'ORIGIN',
                  predictions: plan.waypoints[0].predictions,
                },
                ...plan.waypoints.slice(1),
              ],
            },
            state.weights.fuelOnBoard,
            state.altitude.cruiseAltitudeFt,
            state.speeds.activeSchedule.cruiseMach
          );
          set({ flightPlan: updatedPlan });
          consumeScratchpad();
        } else if (lsk === '1R') {
          if (isDelete) {
            state.pushMessage('INVALID DELETE', 'HIGH');
            return;
          }
          if (!sp) {
            downSelect(plan.destination);
            return;
          }
          const apt = NAV_AIRPORTS[sp];
          if (!apt) {
            state.pushMessage('INVALID ENTRY', 'HIGH');
            return;
          }
          const newWpts = [...plan.waypoints];
          newWpts[newWpts.length - 1] = {
            id: `wpt-dest-${Date.now()}`,
            ident: apt.icao,
            type: 'AIRPORT',
            coordinates: { lat: apt.lat, lon: apt.lon },
            viaAirway: 'DIRECT',
            predictions: newWpts[newWpts.length - 1].predictions,
          };
          const updatedPlan = computeFlightPlanPredictions(
            { ...plan, destination: apt.icao, waypoints: newWpts },
            state.weights.fuelOnBoard,
            state.altitude.cruiseAltitudeFt,
            state.speeds.activeSchedule.cruiseMach
          );
          set({ flightPlan: updatedPlan });
          consumeScratchpad();
        } else if (lsk === '2L') {
          if (!sp) {
            downSelect(plan.runway ?? '');
            return;
          }
          const originApt = NAV_AIRPORTS[plan.origin];
          const rwyObj = originApt?.runways.find((r) => r.ident === sp);
          if (!rwyObj && !/^\d{2}[LRC]?$/.test(sp)) {
            state.pushMessage('INVALID ENTRY', 'HIGH');
            return;
          }
          const updatedWpts = [...plan.waypoints];
          if (updatedWpts.length > 0 && updatedWpts[0].type === 'AIRPORT') {
            updatedWpts[0] = {
              ...updatedWpts[0],
              ident: `${plan.origin}${sp}`,
            };
          }
          set({
            flightPlan: { ...plan, runway: sp, waypoints: updatedWpts },
            takeoffConfig: rwyObj
              ? {
                  ...state.takeoffConfig,
                  rwySlopePercent: rwyObj.slopePercent,
                }
              : state.takeoffConfig,
          });
          consumeScratchpad();
        } else if (lsk === '2R') {
          if (isDelete) {
            set({ flightPlan: { ...plan, alternate: null } });
            consumeScratchpad();
            return;
          }
          if (!sp) {
            downSelect(plan.alternate ?? '');
            return;
          }
          if (!/^[A-Z]{4}$/.test(sp)) {
            state.pushMessage('INVALID ENTRY', 'HIGH');
            return;
          }
          set({ flightPlan: { ...plan, alternate: sp } });
          consumeScratchpad();
        } else if (lsk === '3L') {
          if (!sp) {
            downSelect(plan.companyRoute ?? '');
            return;
          }
          const coRoute = NAV_COMPANY_ROUTES[sp];
          if (!coRoute) {
            state.pushMessage('INVALID ENTRY', 'HIGH');
            return;
          }
          const origApt = NAV_AIRPORTS[coRoute.origin];
          const destApt = NAV_AIRPORTS[coRoute.destination];
          const builtWpts: FmsWaypoint[] = [
            {
              id: 'wpt-0',
              ident: `${coRoute.origin}${coRoute.defaultRunway}`,
              type: 'AIRPORT',
              coordinates: { lat: origApt.lat, lon: origApt.lon },
              viaAirway: 'ORIGIN',
              predictions: { etaUtc: '1214z', dtgNm: 0, cumulativeDtgNm: 0, efobKg: 14.2, predictedAltitudeFt: 3000 },
            },
            ...coRoute.waypoints
              .map((id, i) => {
                const pt = lookupNavPoint(id);
                if (!pt) return null;
                return {
                  id: `wpt-co-${i}`,
                  ident: pt.ident,
                  type: pt.type,
                  coordinates: { lat: pt.lat, lon: pt.lon },
                  viaAirway: 'UZ1',
                  predictions: { etaUtc: '1220z', dtgNm: 25, cumulativeDtgNm: 50, efobKg: 13.5, predictedAltitudeFt: 28000 },
                } as FmsWaypoint;
              })
              .filter((x): x is FmsWaypoint => x !== null),
            {
              id: 'wpt-dest',
              ident: coRoute.destination,
              type: 'AIRPORT',
              coordinates: { lat: destApt.lat, lon: destApt.lon },
              viaAirway: 'DIRECT',
              predictions: { etaUtc: '1305z', dtgNm: 60, cumulativeDtgNm: 210, efobKg: 10.5, predictedAltitudeFt: 300 },
            },
          ];
          const newPlan = computeFlightPlanPredictions(
            {
              ...plan,
              origin: coRoute.origin,
              destination: coRoute.destination,
              runway: coRoute.defaultRunway,
              alternate: coRoute.alternate,
              companyRoute: coRoute.ident,
              waypoints: builtWpts,
            },
            state.weights.fuelOnBoard,
            state.altitude.cruiseAltitudeFt,
            state.speeds.activeSchedule.cruiseMach
          );
          set({ flightPlan: newPlan });
          consumeScratchpad();
          soundEngine.playConfirmChime();
        } else if (lsk === '3R') {
          if (!sp) {
            downSelect(plan.flightId);
            return;
          }
          if (!/^[A-Z0-9]{2,8}$/.test(sp)) {
            state.pushMessage('INVALID ENTRY', 'HIGH');
            return;
          }
          set({ flightPlan: { ...plan, flightId: sp } });
          consumeScratchpad();
        } else if (lsk === '4L' || lsk === '5L') {
          if (isDelete) {
            set({ flightPlan: { ...plan, lateralOffset: null } });
            consumeScratchpad();
            return;
          }
          if (sp) {
            const offRes = parseLateralOffset(sp);
            if (!offRes.valid || !offRes.value) {
              state.pushMessage('INVALID ENTRY', 'HIGH');
              return;
            }
            set({ flightPlan: { ...plan, lateralOffset: offRes.value } });
            consumeScratchpad();
          }
        } else if (lsk === '6L') {
          set({ activePage: 'PERF_INIT', subPageIndex: 1 });
        } else if (lsk === '6R') {
          set({ subPageIndex: 2 });
        }
      } else {
        // ACT RTE 2/3 (VIA / TO Airway String Entry)
        if (lsk === '6L') {
          set({ activePage: 'PERF_INIT', subPageIndex: 1 });
        } else if (lsk === '6R') {
          set({ subPageIndex: 1 });
        } else if (sp && sp.includes('.')) {
          const lastEnroute =
            plan.waypoints.length >= 2
              ? plan.waypoints[plan.waypoints.length - 2].ident
              : plan.waypoints[0]?.ident;
          const awyRes = parseAirwayEntry(sp, lastEnroute);
          if (!awyRes.valid || !awyRes.value) {
            state.pushMessage(awyRes.error || 'INVALID ENTRY', 'HIGH');
            return;
          }
          const newFixes: FmsWaypoint[] = [];
          // If startWpt is not yet in the plan, insert it first
          if (!plan.waypoints.some((w) => w.ident === awyRes.value!.startWpt)) {
            const startPt = lookupNavPoint(awyRes.value.startWpt);
            if (startPt) {
              newFixes.push({
                id: `wpt-awy-start-${Date.now()}`,
                ident: startPt.ident,
                type: startPt.type,
                coordinates: { lat: startPt.lat, lon: startPt.lon },
                viaAirway: 'DIRECT',
                predictions: { etaUtc: '1225z', dtgNm: 20, cumulativeDtgNm: 40, efobKg: 13.5, predictedAltitudeFt: 28000 },
              });
            }
          }
          for (const item of awyRes.value.expandedWaypoints) {
            const pt = lookupNavPoint(item.ident);
            if (pt) {
              newFixes.push({
                id: `wpt-awy-${item.ident}-${Date.now()}`,
                ident: pt.ident,
                type: pt.type,
                coordinates: { lat: pt.lat, lon: pt.lon },
                viaAirway: item.viaAirway,
                predictions: { etaUtc: '1235z', dtgNm: 30, cumulativeDtgNm: 70, efobKg: 13.0, predictedAltitudeFt: 28000 },
              });
            }
          }
          const destWpt = plan.waypoints[plan.waypoints.length - 1];
          const updatedWpts = [
            ...plan.waypoints.slice(0, -1),
            ...newFixes,
            destWpt,
          ];
          const updatedPlan = computeFlightPlanPredictions(
            { ...plan, waypoints: updatedWpts },
            state.weights.fuelOnBoard,
            state.altitude.cruiseAltitudeFt,
            state.speeds.activeSchedule.cruiseMach
          );
          set({ flightPlan: updatedPlan });
          consumeScratchpad();
          soundEngine.playConfirmChime();
        }
      }
      return;
    }

    // =========================================================================
    // 5. ACTIVE FLT PLAN (1/X)
    // =========================================================================
    if (state.activePage === 'ACTIVE_FLT_PLAN') {
      const currentPlan = state.modFlightPlan ?? state.flightPlan;
      const pageOffset = (state.subPageIndex - 1) * 4;

      // Bottom LSKs 6L / 6R: MOD confirmation or PERF DATA / PROGRESS
      if (lsk === '6L') {
        if (state.modFlightPlan) {
          // <ACTIVATE MOD
          set({
            flightPlan: { ...state.modFlightPlan, planType: 'ACTIVE' },
            modFlightPlan: null,
            directToMode: false,
          });
          soundEngine.playConfirmChime();
        } else {
          set({ activePage: 'PERF_INIT', subPageIndex: 1 });
        }
        return;
      }
      if (lsk === '6R') {
        if (state.modFlightPlan) {
          // CANCEL MOD>
          set({ modFlightPlan: null, directToMode: false });
        } else {
          set({ activePage: 'PROGRESS', subPageIndex: 1 });
        }
        return;
      }

      const rowNum = parseInt(lsk[0], 10); // 1..5
      const side = lsk[1] as 'L' | 'R';
      const wptIndex = pageOffset + (rowNum - 1);
      const targetWpt = currentPlan.waypoints[wptIndex];

      // LEFT LSKs (1L..5L): Waypoint Insertion, Deletion, Down-select, Airway, or Direct-To
      if (side === 'L') {
        if (state.directToMode && targetWpt && targetWpt.type !== 'DISCONTINUITY') {
          const modWpts = [
            currentPlan.waypoints[0],
            ...currentPlan.waypoints.slice(wptIndex),
          ];
          const updated = computeFlightPlanPredictions(
            {
              ...currentPlan,
              planType: 'MOD',
              waypoints: modWpts,
              activeWaypointIndex: 1,
            },
            state.weights.fuelOnBoard,
            state.altitude.cruiseAltitudeFt,
            state.speeds.activeSchedule.cruiseMach
          );
          set({ modFlightPlan: updated, directToMode: false });
          return;
        }

        // Delete Waypoint or Close Discontinuity
        if (isDelete) {
          if (!targetWpt || wptIndex === 0 || wptIndex === currentPlan.waypoints.length - 1) {
            state.pushMessage('INVALID DELETE', 'HIGH');
            return;
          }
          const filtered = currentPlan.waypoints.filter((_, idx) => idx !== wptIndex);
          const updated = computeFlightPlanPredictions(
            { ...currentPlan, planType: 'MOD', waypoints: filtered },
            state.weights.fuelOnBoard,
            state.altitude.cruiseAltitudeFt,
            state.speeds.activeSchedule.cruiseMach
          );
          set({ modFlightPlan: updated });
          consumeScratchpad();
          return;
        }

        // Empty scratchpad -> Down-select waypoint identifier
        if (!sp) {
          if (targetWpt && targetWpt.type !== 'DISCONTINUITY') {
            downSelect(targetWpt.ident);
          }
          return;
        }

        // Check if Airway String (contains '.')
        if (sp.includes('.') && !/^[NS]\d/.test(sp)) {
          const prevWptIdent =
            wptIndex > 0 ? currentPlan.waypoints[wptIndex - 1]?.ident : currentPlan.waypoints[0]?.ident;
          const awyRes = parseAirwayEntry(sp, prevWptIdent);
          if (!awyRes.valid || !awyRes.value) {
            state.pushMessage(awyRes.error || 'INVALID ENTRY', 'HIGH');
            return;
          }
          const inserted: FmsWaypoint[] = awyRes.value.expandedWaypoints
            .map((item) => {
              const pt = lookupNavPoint(item.ident);
              if (!pt) return null;
              return {
                id: `wpt-${item.ident}-${Date.now()}-${Math.random()}`,
                ident: pt.ident,
                type: pt.type,
                coordinates: { lat: pt.lat, lon: pt.lon },
                viaAirway: item.viaAirway,
                predictions: { etaUtc: '1230z', dtgNm: 20, cumulativeDtgNm: 60, efobKg: 13.0, predictedAltitudeFt: 28000 },
              } as FmsWaypoint;
            })
            .filter((x): x is FmsWaypoint => x !== null);

          const nextWpts = [...currentPlan.waypoints];
          nextWpts.splice(Math.min(wptIndex, nextWpts.length - 1), 0, ...inserted);
          const updated = computeFlightPlanPredictions(
            { ...currentPlan, planType: 'MOD', waypoints: nextWpts },
            state.weights.fuelOnBoard,
            state.altitude.cruiseAltitudeFt,
            state.speeds.activeSchedule.cruiseMach
          );
          set({ modFlightPlan: updated });
          consumeScratchpad();
          return;
        }

        // Check if Standard NavDB Fix/VOR/Airport
        const navPt = lookupNavPoint(sp);
        if (navPt) {
          const newWpt: FmsWaypoint = {
            id: `wpt-${navPt.ident}-${Date.now()}`,
            ident: navPt.ident,
            type: navPt.type,
            coordinates: { lat: navPt.lat, lon: navPt.lon },
            viaAirway: 'DIRECT',
            predictions: { etaUtc: '1225z', dtgNm: 25, cumulativeDtgNm: 50, efobKg: 13.4, predictedAltitudeFt: 28000 },
          };
          const nextWpts = [...currentPlan.waypoints];
          if (targetWpt?.type === 'DISCONTINUITY') {
            nextWpts.splice(wptIndex, 1, newWpt);
          } else {
            nextWpts.splice(Math.min(wptIndex, nextWpts.length - 1), 0, newWpt);
          }
          const updated = computeFlightPlanPredictions(
            { ...currentPlan, planType: 'MOD', waypoints: nextWpts },
            state.weights.fuelOnBoard,
            state.altitude.cruiseAltitudeFt,
            state.speeds.activeSchedule.cruiseMach
          );
          set({ modFlightPlan: updated });
          consumeScratchpad();
          return;
        }

        // Check if Custom Temporary Waypoint (&LLxx, &PBDxx, &PDxx, &PBPBxx)
        const customRes = parseCustomWaypoint(sp, state.customWaypointCounters);
        if (customRes.valid && customRes.value) {
          const cw = customRes.value;
          const nextCounters = { ...state.customWaypointCounters };
          if (cw.ident.startsWith('&LL')) nextCounters.ll += 1;
          else if (cw.ident.startsWith('&PBPB')) nextCounters.pbpb += 1;
          else if (cw.ident.startsWith('&PBD')) nextCounters.pbd += 1;
          else if (cw.ident.startsWith('&PD')) nextCounters.pd += 1;

          const newWpt: FmsWaypoint = {
            id: `wpt-${cw.ident}-${Date.now()}`,
            ident: cw.ident,
            type: cw.type,
            coordinates: cw.coordinates,
            viaAirway: 'DIRECT',
            predictions: { etaUtc: '1225z', dtgNm: 25, cumulativeDtgNm: 50, efobKg: 13.4, predictedAltitudeFt: 28000 },
          };
          const nextWpts = [...currentPlan.waypoints];
          nextWpts.splice(Math.min(wptIndex, nextWpts.length - 1), 0, newWpt);
          const updated = computeFlightPlanPredictions(
            { ...currentPlan, planType: 'MOD', waypoints: nextWpts },
            state.weights.fuelOnBoard,
            state.altitude.cruiseAltitudeFt,
            state.speeds.activeSchedule.cruiseMach
          );
          set({
            modFlightPlan: updated,
            customWaypointCounters: nextCounters,
          });
          consumeScratchpad();
          return;
        }

        state.pushMessage(customRes.error || 'INVALID ENTRY', 'HIGH');
        return;
      }

      // RIGHT LSKs (1R..5R): Speed / Altitude VNAV Constraint Entry
      if (side === 'R' && targetWpt && targetWpt.type !== 'DISCONTINUITY') {
        if (isDelete) {
          const nextWpts = currentPlan.waypoints.map((w, idx) =>
            idx === wptIndex ? { ...w, constraint: undefined } : w
          );
          const updated = computeFlightPlanPredictions(
            { ...currentPlan, planType: 'MOD', waypoints: nextWpts },
            state.weights.fuelOnBoard,
            state.altitude.cruiseAltitudeFt,
            state.speeds.activeSchedule.cruiseMach
          );
          set({ modFlightPlan: updated });
          consumeScratchpad();
          return;
        }

        if (!sp) {
          const altFt =
            targetWpt.constraint?.altitudeValue1 ??
            targetWpt.predictions.predictedAltitudeFt;
          downSelect(altFt >= 10000 ? `FL${Math.round(altFt / 100)}` : `${altFt}`);
          return;
        }

        const cRes = parseWaypointConstraintInput(sp, state.altitude.certifiedCeilingFt);
        if (!cRes.valid || !cRes.value) {
          state.pushMessage(cRes.error || 'INVALID ENTRY', 'HIGH');
          return;
        }

        const nextWpts = currentPlan.waypoints.map((w, idx) =>
          idx === wptIndex
            ? {
                ...w,
                constraint: {
                  ...w.constraint,
                  ...cRes.value,
                },
              }
            : w
        );
        const updated = computeFlightPlanPredictions(
          { ...currentPlan, planType: 'MOD', waypoints: nextWpts },
          state.weights.fuelOnBoard,
          state.altitude.cruiseAltitudeFt,
          state.speeds.activeSchedule.cruiseMach
        );

        // If irrational descent constraint was detected, push advisory message
        if (updated.waypoints[wptIndex]?.constraint?.isIrrational) {
          state.pushMessage('CHECK SPEED CONSTRAINT', 'LOW');
        }

        set({ modFlightPlan: updated });
        consumeScratchpad();
      }
      return;
    }

    // =========================================================================
    // 6. PERF INDEX (1/2 & 2/2)
    // =========================================================================
    if (state.activePage === 'PERF_INDEX') {
      if (state.subPageIndex === 1) {
        if (lsk === '1L') set({ activePage: 'PERF_INIT', subPageIndex: 1 });
        else if (lsk === '2L') set({ activePage: 'TAKEOFF_INIT', subPageIndex: 1 });
        else if (lsk === '3L') set({ activePage: 'CLIMB', subPageIndex: 1 });
        else if (lsk === '4L') set({ activePage: 'CLIMB', subPageIndex: 1 });
        else if (lsk === '5L') set({ activePage: 'LANDING', subPageIndex: 1 });
        else if (lsk === '1R') set({ activePage: 'CRUISE', subPageIndex: 1 });
        else if (lsk === '2R') set({ activePage: 'DESCENT', subPageIndex: 1 });
        else if (lsk === '3R') set({ activePage: 'DESCENT', subPageIndex: 1 });
        else if (lsk === '4R') set({ activePage: 'LANDING', subPageIndex: 1 });
        else if (lsk === '6R') set({ subPageIndex: 2 });
      } else {
        if (lsk === '1L') set({ activePage: 'FUEL_MGT', subPageIndex: 1 });
        else if (lsk === '2L') set({ engineOutMode: !state.engineOutMode, activePage: 'CRUISE' });
        else if (lsk === '6L' || lsk === '6R') set({ subPageIndex: 1 });
      }
      return;
    }

    // =========================================================================
    // 7. PERFORMANCE INIT (1/3 - 3/3)
    // =========================================================================
    if (state.activePage === 'PERF_INIT') {
      if (state.subPageIndex === 1) {
        if (lsk === '1L') {
          if (!sp) return downSelect(state.tailNumber);
          set({ tailNumber: sp.slice(0, 8) });
          consumeScratchpad();
        } else if (lsk === '1R') {
          if (!sp) return downSelect(`${state.perfFactorPercent.toFixed(1)}`);
          const num = parseFloat(sp);
          if (isNaN(num) || num < -15 || num > 15) {
            state.pushMessage('INVALID ENTRY', 'HIGH');
            return;
          }
          set({ perfFactorPercent: Number(num.toFixed(1)) });
          consumeScratchpad();
        } else if (lsk === '2L') {
          if (!sp) return downSelect(`${state.weights.fuelReserve.value}`);
          const num = parseFloat(sp);
          if (isNaN(num) || num < 0 || num > 180) {
            state.pushMessage('INVALID ENTRY', 'HIGH');
            return;
          }
          set({
            weights: {
              ...state.weights,
              fuelReserve: { ...state.weights.fuelReserve, value: num },
            },
          });
          consumeScratchpad();
        } else if (lsk === '2R') {
          // Toggle MINUTES / WEIGHT
          const nextMode =
            state.weights.fuelReserve.mode === 'MINUTES' ? 'WEIGHT' : 'MINUTES';
          const nextVal = nextMode === 'MINUTES' ? 45 : 2.1;
          set({
            weights: {
              ...state.weights,
              fuelReserve: { mode: nextMode, value: nextVal },
            },
          });
        } else if (lsk === '4L') {
          if (!sp) return downSelect(`${state.weights.alternateFuel ?? 1.2}`);
          const fRes = parseFuelWeightInput(sp, 15.0);
          if (!fRes.valid || fRes.value === undefined) {
            state.pushMessage('INVALID ENTRY', 'HIGH');
            return;
          }
          set({ weights: { ...state.weights, alternateFuel: fRes.value } });
          consumeScratchpad();
        } else if (lsk === '6R') {
          set({ subPageIndex: 2 });
        }
        return;
      }

      if (state.subPageIndex === 2) {
        // LSK 1L: CRZ ALT
        if (lsk === '1L') {
          if (isDelete) {
            state.pushMessage('INVALID DELETE', 'HIGH');
            return;
          }
          if (!sp) {
            if (state.altitude.cruiseAltitudeFt) {
              downSelect(`${Math.round(state.altitude.cruiseAltitudeFt / 100)}`);
            }
            return;
          }
          const altRes = parseMCDUAltitudeInput(sp, state.altitude.certifiedCeilingFt);
          if (!altRes.valid || altRes.feet === undefined) {
            state.pushMessage(altRes.error || 'INVALID ENTRY', altRes.error === 'EXCEEDS CERT CEILING' ? 'MEDIUM' : 'HIGH');
            return;
          }
          const updatedPlan = computeFlightPlanPredictions(
            state.flightPlan,
            state.weights.fuelOnBoard,
            altRes.feet,
            state.speeds.activeSchedule.cruiseMach
          );
          set({
            altitude: { ...state.altitude, cruiseAltitudeFt: altRes.feet },
            flightPlan: updatedPlan,
          });
          consumeScratchpad();
        } else if (lsk === '1R') {
          // PASS
          if (!sp) return downSelect(`${state.passengers}`);
          const pax = parseInt(sp, 10);
          if (isNaN(pax) || pax < 0 || pax > 146) {
            state.pushMessage('INVALID ENTRY', 'HIGH');
            return;
          }
          set({ passengers: pax });
          consumeScratchpad();
        } else if (lsk === '2L') {
          // CRZ WIND
          if (!sp) {
            const w = state.atmosphere.averageCruiseWind;
            if (w) downSelect(`${w.direction}/${w.speed}`);
            return;
          }
          const wRes = parseWindInput(sp);
          if (!wRes.valid || !wRes.value) {
            state.pushMessage('INVALID ENTRY', 'HIGH');
            return;
          }
          set({
            atmosphere: { ...state.atmosphere, averageCruiseWind: wRes.value },
          });
          consumeScratchpad();
        } else if (lsk === '2R') {
          // ZFW
          if (isDelete) {
            state.pushMessage('INVALID DELETE', 'HIGH');
            return;
          }
          if (!sp) {
            if (state.weights.zeroFuelWeight !== null) {
              downSelect(state.weights.zeroFuelWeight.toFixed(1));
            }
            return;
          }
          const zfwRes = parseZfwInput(sp);
          if (!zfwRes.valid || zfwRes.value === undefined) {
            state.pushMessage(zfwRes.error || 'INVALID ENTRY', 'HIGH');
            return;
          }
          const newGw = Number((zfwRes.value + state.weights.fuelOnBoard).toFixed(1));
          const optAlt = newGw > 56 ? 33000 : newGw > 50 ? 35000 : 37000;
          set({
            weights: {
              ...state.weights,
              zeroFuelWeight: zfwRes.value,
              grossWeight: newGw,
            },
            altitude: {
              ...state.altitude,
              optimumAltitudeFt: optAlt,
            },
          });
          if (newGw > state.weights.maxGrossWeight) {
            state.pushMessage('EXCEEDS MAX GROSS WEIGHT', 'HIGH');
          }
          consumeScratchpad();
        } else if (lsk === '3L') {
          // ISA DEV
          if (!sp) return downSelect(`${state.atmosphere.isaDeviationC}`);
          const tRes = parseTemperatureInput(sp, 'ISA_DEV');
          if (!tRes.valid || tRes.value === undefined) {
            state.pushMessage('INVALID ENTRY', 'HIGH');
            return;
          }
          set({
            atmosphere: { ...state.atmosphere, isaDeviationC: tRes.value },
          });
          consumeScratchpad();
        } else if (lsk === '3R') {
          // FOB (GAUGE)
          if (!sp) return downSelect(state.weights.fuelOnBoard.toFixed(1));
          const fRes = parseFuelWeightInput(sp, 25.0);
          if (!fRes.valid || fRes.value === undefined) {
            state.pushMessage('INVALID ENTRY', 'HIGH');
            return;
          }
          const zfw = state.weights.zeroFuelWeight ?? 37.6;
          const newGw = Number((zfw + fRes.value).toFixed(1));
          set({
            weights: {
              ...state.weights,
              fuelOnBoard: fRes.value,
              grossWeight: newGw,
            },
          });
          if (newGw > state.weights.maxGrossWeight) {
            state.pushMessage('EXCEEDS MAX GROSS WEIGHT', 'HIGH');
          }
          consumeScratchpad();
        } else if (lsk === '4L') {
          // TAKEOFF CG
          if (isDelete) {
            state.pushMessage('INVALID DELETE', 'HIGH');
            return;
          }
          if (!sp) {
            if (state.weights.takeoffCg !== null) {
              downSelect(state.weights.takeoffCg.toFixed(1));
            }
            return;
          }
          const cgRes = parseTakeoffCg(sp);
          if (!cgRes.valid || cgRes.value === undefined) {
            set({ cgInvalidFlag: true });
            state.pushMessage(cgRes.error || 'CHECK TAKEOFF CG', 'HIGH');
            return;
          }
          set({
            weights: { ...state.weights, takeoffCg: cgRes.value },
            cgInvalidFlag: false,
            messages: state.messages.filter((m) => m.text !== 'CHECK TAKEOFF CG'),
          });
          consumeScratchpad();
        } else if (lsk === '5L' || lsk === '6L') {
          // <CONFIRM INIT
          if (
            state.altitude.cruiseAltitudeFt === null ||
            state.weights.zeroFuelWeight === null ||
            state.weights.takeoffCg === null
          ) {
            state.pushMessage('INVALID ENTRY', 'HIGH');
            return;
          }
          set({ perfInitConfirmed: true });
          soundEngine.playConfirmChime();
        } else if (lsk === '6R') {
          set({ activePage: 'TAKEOFF_INIT', subPageIndex: 1 });
        }
        return;
      }

      // PERF INIT 3/3
      if (state.subPageIndex === 3) {
        if (lsk === '6L') set({ subPageIndex: 2 });
        else if (lsk === '6R') set({ activePage: 'TAKEOFF_INIT', subPageIndex: 1 });
        return;
      }
    }

    // =========================================================================
    // 8. TAKEOFF INIT (1/2)
    // =========================================================================
    if (state.activePage === 'TAKEOFF_INIT') {
      if (lsk === '2L') {
        // OAT entry
        if (!sp) return downSelect(`${state.atmosphere.surfaceOatC}`);
        const oatRes = parseTemperatureInput(sp, 'OAT');
        if (!oatRes.valid || oatRes.value === undefined) {
          state.pushMessage('INVALID ENTRY', 'HIGH');
          return;
        }
        set({ atmosphere: { ...state.atmosphere, surfaceOatC: oatRes.value } });
        consumeScratchpad();
      } else if (lsk === '2R') {
        // SURFACE WIND
        if (!sp) {
          const sw = state.atmosphere.surfaceWind;
          return downSelect(`${sw.direction}/${sw.speed}`);
        }
        const wRes = parseWindInput(sp);
        if (!wRes.valid || !wRes.value) {
          state.pushMessage('INVALID ENTRY', 'HIGH');
          return;
        }
        set({ atmosphere: { ...state.atmosphere, surfaceWind: wRes.value } });
        consumeScratchpad();
      } else if (lsk === '3L') {
        // RWY SLOPE
        if (!sp) return downSelect(`${state.takeoffConfig.rwySlopePercent}`);
        const slRes = parseRunwaySlope(sp);
        if (!slRes.valid || slRes.value === undefined) {
          state.pushMessage('INVALID ENTRY', 'HIGH');
          return;
        }
        set({
          takeoffConfig: { ...state.takeoffConfig, rwySlopePercent: slRes.value },
        });
        consumeScratchpad();
      } else if (lsk === '3R') {
        // Toggle RWY COND: DRY -> WET -> CNTMNTD
        const order: Array<'DRY' | 'WET' | 'CNTMNTD'> = ['DRY', 'WET', 'CNTMNTD'];
        const nextCond =
          order[(order.indexOf(state.takeoffConfig.rwyCondition) + 1) % order.length];
        set({
          takeoffConfig: { ...state.takeoffConfig, rwyCondition: nextCond },
        });
      } else if (lsk === '4L') {
        // AFE LIMIT
        if (!sp) return downSelect(`${state.altitude.afeLimitFt}`);
        const altRes = parseMCDUAltitudeInput(sp);
        if (!altRes.valid || !altRes.feet) {
          state.pushMessage('INVALID ENTRY', 'HIGH');
          return;
        }
        set({ altitude: { ...state.altitude, afeLimitFt: altRes.feet } });
        consumeScratchpad();
      } else if (lsk === '4R') {
        // VNAV CAP AFE
        if (!sp) return downSelect(`${state.altitude.vnavCaptureAfeFt}`);
        const altRes = parseMCDUAltitudeInput(sp);
        if (!altRes.valid || !altRes.feet) {
          state.pushMessage('INVALID ENTRY', 'HIGH');
          return;
        }
        set({ altitude: { ...state.altitude, vnavCaptureAfeFt: altRes.feet } });
        consumeScratchpad();
      } else if (lsk === '6L') {
        set({ activePage: 'PERF_INIT', subPageIndex: 2 });
      } else if (lsk === '6R') {
        set({ activePage: 'TAKEOFF_VSPEEDS', subPageIndex: 1 });
      }
      return;
    }

    // =========================================================================
    // 9. TAKEOFF VSPEEDS (2/2)
    // =========================================================================
    if (state.activePage === 'TAKEOFF_VSPEEDS') {
      const updateVSpeed = (field: 'v1' | 'vr' | 'v2' | 'vfs') => {
        if (!sp) {
          const cur = state.speeds.takeoffSpeeds[field];
          if (cur !== null) downSelect(`${cur}`);
          return;
        }
        const spdRes = parseCasSpeed(sp, 250);
        if (!spdRes.valid || spdRes.value === undefined) {
          state.pushMessage('INVALID ENTRY', 'HIGH');
          return;
        }
        const nextSpeeds = {
          ...state.speeds.takeoffSpeeds,
          [field]: spdRes.value,
        };
        set({
          speeds: {
            ...state.speeds,
            takeoffSpeeds: nextSpeeds,
          },
        });
        const check = validateVSpeedsHierarchy(nextSpeeds);
        if (!check.valid) {
          state.pushMessage('INVALID ENTRY', 'HIGH');
        }
        consumeScratchpad();
      };

      if (lsk === '1L') updateVSpeed('v1');
      else if (lsk === '2L') updateVSpeed('vr');
      else if (lsk === '3L') updateVSpeed('v2');
      else if (lsk === '4L') updateVSpeed('vfs');
      else if (lsk === '1R') {
        // Toggle FLAP 1 / 2 / 3 / 4 or enter via scratchpad
        if (sp) {
          const f = parseInt(sp, 10);
          if (f >= 1 && f <= 4) {
            set({
              takeoffConfig: { ...state.takeoffConfig, flap: f as 1 | 2 | 3 | 4 },
            });
            consumeScratchpad();
          } else {
            state.pushMessage('INVALID ENTRY', 'HIGH');
          }
        } else {
          const nextFlap = ((state.takeoffConfig.flap % 4) + 1) as 1 | 2 | 3 | 4;
          set({ takeoffConfig: { ...state.takeoffConfig, flap: nextFlap } });
        }
      } else if (lsk === '3R') {
        // TO FLEX temp
        if (!sp) return downSelect(`${state.atmosphere.flexTemperatureC ?? 48}`);
        const flex = parseInt(sp, 10);
        if (isNaN(flex) || flex < 30 || flex > 65) {
          state.pushMessage('INVALID ENTRY', 'HIGH');
          return;
        }
        set({ atmosphere: { ...state.atmosphere, flexTemperatureC: flex } });
        consumeScratchpad();
      } else if (lsk === '4R') {
        // Cycle TO-1 / TO-2 / TO-3
        const modes: Array<'TO-1' | 'TO-2' | 'TO-3'> = ['TO-1', 'TO-2', 'TO-3'];
        const nextM =
          modes[(modes.indexOf(state.takeoffConfig.thrustMode) + 1) % modes.length];
        set({ takeoffConfig: { ...state.takeoffConfig, thrustMode: nextM } });
      } else if (lsk === '6L') {
        set({ activePage: 'TAKEOFF_INIT', subPageIndex: 1 });
      } else if (lsk === '6R') {
        set({ activePage: 'ACTIVE_FLT_PLAN', subPageIndex: 1 });
      }
      return;
    }

    // =========================================================================
    // 10. NAV INDEX (1/2 & 2/2)
    // =========================================================================
    if (state.activePage === 'NAV_INDEX') {
      if (state.subPageIndex === 1) {
        if (lsk === '3L') set({ activePage: 'ACTIVE_FLT_PLAN', subPageIndex: 1 });
        else if (lsk === '4R') set({ activePage: 'HOLD', subPageIndex: 1 });
        else if (lsk === '5L' || lsk === '6L') set({ activePage: 'DEPARTURE', subPageIndex: 1 });
        else if (lsk === '5R' || lsk === '6R') set({ activePage: 'ARRIVAL', subPageIndex: 1 });
      } else {
        if (lsk === '1L' || lsk === '2L') set({ activePage: 'NAV_IDENT', subPageIndex: 1 });
        else if (lsk === '1R' || lsk === '4R' || lsk === '5R') set({ activePage: 'POS_INIT', subPageIndex: 1 });
        else if (lsk === '6L') set({ activePage: 'CONVERSION', subPageIndex: 1 });
      }
      return;
    }

    // =========================================================================
    // 11. PROGRESS (1/3) & OPERATIONAL SUB-PAGES
    // =========================================================================
    if (state.activePage === 'PROGRESS') {
      if (lsk === '6L') set({ activePage: 'ACTIVE_FLT_PLAN', subPageIndex: 1 });
      else if (lsk === '6R') set({ activePage: 'NAV_INDEX', subPageIndex: 1 });
      return;
    }

    if (state.activePage === 'HOLD') {
      if (lsk === '1L' && sp) {
        const pt = lookupNavPoint(sp);
        if (!pt) return state.pushMessage('INVALID ENTRY', 'HIGH');
        set({ holdConfig: { ...state.holdConfig, waypoint: pt.ident } });
        consumeScratchpad();
      } else if (lsk === '2L' && sp) {
        const hRes = parseHoldCourseTurn(sp, state.holdConfig.course);
        if (!hRes.valid || !hRes.value) return state.pushMessage('INVALID ENTRY', 'HIGH');
        set({
          holdConfig: {
            ...state.holdConfig,
            course: hRes.value.course,
            turn: hRes.value.turn,
          },
        });
        consumeScratchpad();
      } else if (lsk === '3L' && sp) {
        const lRes = parseHoldLeg(sp, state.holdConfig.legMode);
        if (!lRes.valid || lRes.value === undefined) return state.pushMessage('INVALID ENTRY', 'HIGH');
        set({ holdConfig: { ...state.holdConfig, legValue: lRes.value } });
        consumeScratchpad();
      } else if (lsk === '3R') {
        const nextMode = state.holdConfig.legMode === 'TIME' ? 'DIST' : 'TIME';
        set({
          holdConfig: {
            ...state.holdConfig,
            legMode: nextMode,
            legValue: nextMode === 'TIME' ? 1.5 : 5.0,
          },
        });
      } else if (lsk === '6L' || lsk === '6R') {
        set({ activePage: 'NAV_INDEX', subPageIndex: 1 });
      }
      return;
    }

    if (
      state.activePage === 'CLIMB' ||
      state.activePage === 'CRUISE' ||
      state.activePage === 'DESCENT' ||
      state.activePage === 'LANDING' ||
      state.activePage === 'DEPARTURE' ||
      state.activePage === 'ARRIVAL' ||
      state.activePage === 'FUEL_MGT' ||
      state.activePage === 'CONVERSION'
    ) {
      if (lsk === '1L' && sp && state.activePage === 'CRUISE') {
        const mRes = parseMachSpeed(sp);
        if (mRes.valid && mRes.value) {
          set({
            speeds: {
              ...state.speeds,
              activeSchedule: {
                ...state.speeds.activeSchedule,
                cruiseMach: mRes.value,
                cruiseMode: 'MANUAL',
              },
            },
          });
          consumeScratchpad();
          return;
        }
      }
      if (lsk === '2R' && sp && state.activePage === 'DESCENT') {
        const qRes = parseAltimeterInput(sp);
        if (qRes.valid && qRes.value) {
          set({ atmosphere: { ...state.atmosphere, altimeter: qRes.value } });
          consumeScratchpad();
          return;
        }
      }
      if (lsk === '6L') {
        set({ activePage: 'PERF_INDEX', subPageIndex: 1 });
      } else if (lsk === '6R') {
        set({ activePage: 'ACTIVE_FLT_PLAN', subPageIndex: 1 });
      }
    }
  },

  setTrainingMode: (mode) => set({ trainingMode: mode }),
  setGuidedStepIndex: (step) => set({ guidedStepIndex: step }),

  injectFaultScenario: (fault: FaultScenarioType) => {
    const state = get();
    switch (fault) {
      case 'UNINITIALIZED_POS':
        set({
          positionInitialized: false,
          activePage: 'NAV_IDENT',
          subPageIndex: 1,
        });
        state.pushMessage('POS INIT REQUIRED', 'HIGH');
        break;
      case 'INVALID_CG':
        set({
          cgInvalidFlag: true,
          weights: { ...state.weights, takeoffCg: null },
          activePage: 'PERF_INIT',
          subPageIndex: 2,
        });
        state.pushMessage('CHECK TAKEOFF CG', 'HIGH');
        break;
      case 'OVERWEIGHT_GW':
        set({
          weights: {
            ...state.weights,
            zeroFuelWeight: 49.5,
            fuelOnBoard: 14.5,
            grossWeight: 64.0,
          },
          activePage: 'PERF_INIT',
          subPageIndex: 2,
        });
        state.pushMessage('EXCEEDS MAX GROSS WEIGHT', 'HIGH');
        break;
      case 'ROUTE_DISCONTINUITY': {
        const curWpts = [...state.flightPlan.waypoints];
        const discWpt: FmsWaypoint = {
          id: `disc-${Date.now()}`,
          ident: '-----',
          type: 'DISCONTINUITY',
          coordinates: curWpts[1]?.coordinates ?? { lat: -23.3, lon: -46.1 },
          viaAirway: 'DISCONT',
          predictions: { etaUtc: '----z', dtgNm: 0, cumulativeDtgNm: 0, efobKg: 13.5, predictedAltitudeFt: 10000 },
        };
        curWpts.splice(2, 0, discWpt);
        set({
          flightPlan: { ...state.flightPlan, waypoints: curWpts },
          activePage: 'ACTIVE_FLT_PLAN',
          subPageIndex: 1,
        });
        state.pushMessage('ROUTE DISCONTINUITY', 'MEDIUM');
        break;
      }
      case 'VSPEED_MISMATCH':
        set({
          speeds: {
            ...state.speeds,
            takeoffSpeeds: { v1: 144, vr: 138, v2: 142, vfs: 182 },
          },
          activePage: 'TAKEOFF_VSPEEDS',
          subPageIndex: 1,
        });
        state.pushMessage('CHECK VSPEEDS', 'HIGH');
        break;
      case 'ENGINE_OUT':
        set({
          engineOutMode: true,
          activePage: 'PROGRESS',
          subPageIndex: 1,
        });
        state.pushMessage('EO MAX CONT THRUST', 'MEDIUM');
        break;
    }
  },

  resetToColdPreflight: () => {
    set({
      activePage: 'RADIO',
      subPageIndex: 1,
      hasVerifiedNavIdent: false,
      positionInitialized: false,
      perfInitConfirmed: false,
      cgInvalidFlag: false,
      engineOutMode: false,
      scratchpadInput: '',
      deleteMode: false,
      messages: [],
      weights: {
        zeroFuelWeight: null,
        fuelSource: 'GAUGE',
        fuelOnBoard: 14.2,
        grossWeight: null,
        takeoffCg: null,
        fuelReserve: { mode: 'MINUTES', value: 45 },
        alternateFuel: 1.2,
        fuelAllowances: { takeoff: 0.4, landing: 0.2 },
        maxGrossWeight: 61.5,
      },
      altitude: {
        cruiseAltitudeFt: null,
        transitionAltitudeFt: 8000,
        afeLimitFt: 1500,
        vnavCaptureAfeFt: 1000,
        optimumAltitudeFt: null,
        certifiedCeilingFt: 41000,
      },
      flightPlan: createDefaultFlightPlan(),
      modFlightPlan: null,
      guidedStepIndex: 0,
    });
  },

  resetToInitializedPreflight: () => {
    set({
      activePage: 'NAV_IDENT',
      subPageIndex: 1,
      hasVerifiedNavIdent: true,
      positionInitialized: true,
      perfInitConfirmed: true,
      cgInvalidFlag: false,
      engineOutMode: false,
      scratchpadInput: '',
      deleteMode: false,
      messages: [],
      weights: {
        zeroFuelWeight: 37.6,
        fuelSource: 'GAUGE',
        fuelOnBoard: 14.2,
        grossWeight: 51.8,
        takeoffCg: 24.5,
        fuelReserve: { mode: 'MINUTES', value: 45 },
        alternateFuel: 1.2,
        fuelAllowances: { takeoff: 0.4, landing: 0.2 },
        maxGrossWeight: 61.5,
      },
      altitude: {
        cruiseAltitudeFt: 28000,
        transitionAltitudeFt: 8000,
        afeLimitFt: 1500,
        vnavCaptureAfeFt: 1000,
        optimumAltitudeFt: 35000,
        certifiedCeilingFt: 41000,
      },
      flightPlan: createDefaultFlightPlan(),
      modFlightPlan: null,
    });
  },
}));
