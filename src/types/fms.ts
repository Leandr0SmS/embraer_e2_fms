/**
 * Core TypeScript Data Models for the Embraer E2 Honeywell NG FMS (MC-860)
 * Based on Project Plan v3 & Scratchpad Syntax Specification Guide
 */

export type McduColor = 'WHITE' | 'CYAN' | 'GREEN' | 'YELLOW' | 'MAGENTA' | 'AMBER';
export type McduFontSize = 'SMALL' | 'LARGE';

export type LskId =
  | '1L' | '2L' | '3L' | '4L' | '5L' | '6L'
  | '1R' | '2R' | '3R' | '4R' | '5R' | '6R';

export type FmsFunctionKey =
  | 'PERF'
  | 'NAV'
  | 'FPL'
  | 'PROG'
  | 'RTE'
  | 'RADIO'
  | 'DIR'
  | 'PREV'
  | 'NEXT';

export type McduPageId =
  | 'RADIO'
  | 'NAV_IDENT'
  | 'POS_INIT'
  | 'ACT_RTE'
  | 'ACTIVE_FLT_PLAN'
  | 'PERF_INDEX'
  | 'PERF_INIT'
  | 'TAKEOFF_INIT'
  | 'TAKEOFF_VSPEEDS'
  | 'NAV_INDEX'
  | 'PROGRESS'
  | 'CLIMB'
  | 'CRUISE'
  | 'DESCENT'
  | 'LANDING'
  | 'DEPARTURE'
  | 'ARRIVAL'
  | 'HOLD'
  | 'FUEL_MGT'
  | 'CONVERSION';

/**
 * 4.1 Weight & Balance Data Model (FmsWeightData)
 */
export interface FmsWeightData {
  /** Zero Fuel Weight in thousands of kg (e.g. 42.5 for 42,500 kg). Uninitialized: null (renders as '□□.□') */
  zeroFuelWeight: number | null;
  /** Fuel Source selection: 'GAUGE' (synced with fuel sensing) or 'COMPUTED' (decremented by fuel flow) */
  fuelSource: 'GAUGE' | 'COMPUTED';
  /** Total Fuel on Board in thousands of kg (e.g. 14.2 for 14,200 kg) */
  fuelOnBoard: number;
  /** Calculated Gross Weight = ZFW + FOB. Rendered in small cyan font */
  grossWeight: number | null;
  /** Takeoff Center of Gravity in % MAC (e.g. 24.5). Range: 10.0 to 40.0 % MAC. Uninitialized: null ('□□.□') */
  takeoffCg: number | null;
  /** Fuel Reserve Value. Can be in minutes (e.g. 45) or absolute weight in thousands (e.g. 2.1 = 2,100 kg) */
  fuelReserve: {
    mode: 'MINUTES' | 'WEIGHT';
    value: number;
  };
  /** Alternate Fuel allowance in thousands (e.g. 1.2). If null, FMS calculates trip fuel to alternate */
  alternateFuel: number | null;
  /** Takeoff / Landing Fuel Allowance in thousands (e.g. { takeoff: 0.4, landing: 0.2 }) */
  fuelAllowances: {
    takeoff: number;
    landing: number;
  };
  /** Maximum certified Takeoff Weight in thousands of kg (E195-E2 default: 61.5t, configurable) */
  maxGrossWeight: number;
}

/**
 * 4.2 Speed & Aerodynamic Target Model (FmsSpeedData)
 */
export interface FmsSpeedData {
  /** Takeoff V-Speeds in Knots Calibrated Airspeed (KCAS) */
  takeoffSpeeds: {
    v1: number | null;   // Decision speed
    vr: number | null;   // Rotate speed
    v2: number | null;   // Takeoff safety speed
    vfs: number | null;  // Final segment speed
  };
  /** Landing Reference and Approach Speeds in KCAS */
  landingSpeeds: {
    vref: number | null;
    vapp: number | null;
    vac: number | null;
    gaSpeed: number | null; // Go-Around target speed
  };
  /** Active Flight Phase Speed Schedule */
  activeSchedule: {
    climbMode: 'ECON' | 'MAX_RATE' | 'MAX_ANGLE' | 'MANUAL';
    climbCasMach: { cas: number; mach: number }; // e.g. { cas: 250, mach: 0.70 }
    cruiseMode: 'ECON' | 'LRC' | 'MANUAL';
    cruiseMach: number;                         // e.g. 0.78
    descentMode: 'ECON' | 'MANUAL';
    descentCasMach: { cas: number; mach: number };
  };
  /** Airframe Speed Limits */
  limits: {
    vmo: number; // Max Operating Velocity (e.g. 320 KCAS)
    mmo: number; // Max Operating Mach (e.g. 0.82)
    speedLimitAlt: { speed: number; alt: number }; // Default: 250 KCAS below 10,000 FT AFE
  };
}

/**
 * 4.3 Flight Plan & Waypoint Navigation Model (FmsWaypoint & FmsFlightPlan)
 */
export interface FmsWaypointConstraint {
  /** Altitude Constraint Type: AT, AT_OR_ABOVE ('A'), AT_OR_BELOW ('B'), or WINDOW */
  altitudeType?: 'AT' | 'AT_OR_ABOVE' | 'AT_OR_BELOW' | 'WINDOW';
  /** Primary altitude in feet (e.g. 10000 or 28000 for FL280). Lower limit when WINDOW */
  altitudeValue1?: number;
  /** Secondary altitude in feet for WINDOW constraints (Upper limit, e.g. 17000 in 16000A17000B) */
  altitudeValue2?: number;
  /** Speed Constraint in KCAS (> 1) or Mach (< 1, e.g. 0.75) */
  speedConstraint?: number;
  /** Constraint Phase Override: 'CLB' (Climb) or 'DES' (Descent) */
  phaseOverride?: 'CLB' | 'DES';
  /** Irrational Constraint Flag: true if VNAV recomputation violates max descent path angle (6.0 deg) */
  isIrrational?: boolean;
}

export interface FmsWaypoint {
  id: string;
  ident: string;                       // 5-7 char max (e.g. 'VEXIM', 'SBGR09L', '&LL01', '&PBD01')
  type: 'AIRPORT' | 'VOR' | 'NDB' | 'FIX' | 'LATLON' | 'PBD' | 'DISCONTINUITY';
  coordinates: { lat: number; lon: number };
  viaAirway?: string;                  // e.g. 'DIRECT', 'J102', 'UZ1'
  constraint?: FmsWaypointConstraint;
  /** Computed Flight Progress Predictions */
  predictions: {
    etaUtc: string;                    // Format: 'HHMMz' (e.g. '1218z')
    dtgNm: number;                     // Distance to go from previous fix in NM
    cumulativeDtgNm: number;           // Total distance to destination in NM
    efobKg: number;                    // Estimated Fuel on Board in thousands (e.g. 13.8)
    predictedAltitudeFt: number;       // VNAV projected altitude
  };
}

export interface FmsFlightPlan {
  id: string;
  planType: 'ACTIVE' | 'MOD' | 'SECONDARY';
  origin: string;                      // Airport ICAO (e.g. 'SBGR')
  destination: string;                 // Airport ICAO (e.g. 'SBRJ')
  runway: string | null;               // e.g. '09L'
  sid: string | null;                  // e.g. 'VEXIM1A'
  star: string | null;                 // e.g. 'BUSPA1A'
  approach: string | null;             // e.g. 'RNP 02R'
  companyRoute: string | null;         // e.g. 'GRUJSD01'
  alternate: string | null;            // Airport ICAO (e.g. 'SBGL')
  flightId: string;                    // e.g. 'AZU1420'
  lateralOffset: { side: 'L' | 'R'; distanceNm: number } | null;
  waypoints: FmsWaypoint[];
  activeWaypointIndex: number;         // Index of active TO waypoint
}

/**
 * 4.4 Atmospheric, Wind & Temperature Model (FmsAtmosphericData)
 * Uses serializable Record<string, ...> instead of Map for clean persistence and scenario snapshots
 */
export interface WaypointWindLayer {
  altitudeFt: number;
  direction: number;
  speed: number;
  tempC: number;
}

export interface FmsAtmosphericData {
  /** Average Cruise Wind Direction (001-360 deg) and Speed (knots) */
  averageCruiseWind: { direction: number; speed: number } | null;
  /** Surface Wind at Departure Airport */
  surfaceWind: { direction: number; speed: number };
  /** Waypoint-Specific Winds Aloft (serializable Record keyed by waypoint ident) */
  waypointWinds: Record<string, WaypointWindLayer[]>;
  /** Mean ISA Deviation in degrees Celsius (-80°C to +50°C). Default: 5 */
  isaDeviationC: number;
  /** Outside Air Temperature at Airport/Surface in °C */
  surfaceOatC: number;
  /** Flex Takeoff Assumed Temperature in °C (e.g. 48) */
  flexTemperatureC: number | null;
  /** Altimeter setting */
  altimeter: {
    unit: 'INHG' | 'HPA';
    value: number; // e.g. 29.92 or 1013
  };
  /** VNAV Approach Temperature Compensation Configuration */
  tempCompensation: {
    status: 'OFF' | 'COLD' | 'HOT_COLD';
    landingOatC: number | null;
    isActivated: boolean;
  };
}

/**
 * 4.5 Flight Level & Altitude Navigation Model (FmsAltitudeData)
 */
export interface FmsAltitudeData {
  /** Initial Cruise Altitude in Feet (e.g. 35000 for FL350). Uninitialized: null ('□□□□□') */
  cruiseAltitudeFt: number | null;
  /** Transition Altitude in Feet. Default: NAV DB value or 18,000 FT */
  transitionAltitudeFt: number;
  /** Above Field Elevation (AFE) Speed Transition Limit in Feet (e.g. 1500 FT) */
  afeLimitFt: number;
  /** VNAV Capture Altitude AFE in Feet (e.g. 1000 FT) */
  vnavCaptureAfeFt: number;
  /** Computed Optimum Cruise Altitude based on current Gross Weight */
  optimumAltitudeFt: number | null;
  /** Maximum Certified Ceiling Altitude (41,000 FT for Embraer E2) */
  certifiedCeilingFt: number;
}

/**
 * Scratchpad Priority Message Queue Item
 */
export type ScratchpadPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ScratchpadMessage {
  id: string;
  text: string;
  priority: ScratchpadPriority;
  timestamp: number;
}

/**
 * Strict 14x24 Character LCD Display Data Structures
 * - Line 1: Title Header & Page Index (e.g. "NAV IDENT 1/1")
 * - Lines 2..13: 6 LSK pairs (LSK 1..6), each consisting of a Small-Font Label Row + Data/Prompt Row
 * - Line 14: Scratchpad / Alert Message Buffer
 */
export interface McduCell {
  char: string;
  color: McduColor;
  size: McduFontSize;
  reverse?: boolean;
}

export interface McduLskRow {
  /** Even display line (Lines 2, 4, 6, 8, 10, 12) — Small font field headers */
  labelLeft?: string;
  labelLeftColor?: McduColor;
  labelCenter?: string;
  labelCenterColor?: McduColor;
  labelRight?: string;
  labelRightColor?: McduColor;

  /** Odd display line (Lines 3, 5, 7, 9, 11, 13) — LSK 1L..6L and 1R..6R data/prompts */
  left?: string;
  leftColor?: McduColor;
  leftSize?: McduFontSize;
  leftReverse?: boolean;

  center?: string;
  centerColor?: McduColor;
  centerSize?: McduFontSize;
  centerReverse?: boolean;

  right?: string;
  rightColor?: McduColor;
  rightSize?: McduFontSize;
  rightReverse?: boolean;
}

export interface McduScreenLayout {
  title: string;
  titleColor?: McduColor;
  pageNumber?: string; // e.g. '1/3'
  rows: [McduLskRow, McduLskRow, McduLskRow, McduLskRow, McduLskRow, McduLskRow];
}
