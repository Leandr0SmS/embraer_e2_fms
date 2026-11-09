/**
 * Honeywell NG FMS (MC-860) Scratchpad Syntax Parser & Validation Engine
 * Implements the complete 22-parameter specification matrix from the
 * "Honeywell NG FMS MCDU Scratchpad Syntax & Data Entry Specification Guide"
 */

import {
  NAV_AIRWAYS,
  lookupNavPoint,
} from '../data/navdb';
import {
  calculateRadialIntersection,
  projectPointByBearingDistance,
} from '../utils/geo';
import { FmsWaypointConstraint } from '../types/fms';

export interface ParseResult<T = string> {
  valid: boolean;
  formatted?: string;
  value?: T;
  error?: string;
  reverseVideo?: boolean;
}

/**
 * 1. Latitude Parser: Nddmm.mm or Sddmm.mm (with shorthand N0, N50, N1234.5)
 */
export function parseLatitude(input: string): ParseResult<number> {
  const clean = input.trim().toUpperCase();
  if (!/^[NS]\d+(\.\d{1,2})?$/.test(clean)) {
    return { valid: false, error: 'INVALID ENTRY' };
  }

  const hem = clean[0];
  const body = clean.slice(1);
  const [intPart, decPart = ''] = body.split('.');

  let deg = 0;
  let minInt = 0;

  if (intPart.length <= 2) {
    deg = parseInt(intPart, 10);
    minInt = 0;
  } else if (intPart.length === 4) {
    deg = parseInt(intPart.slice(0, 2), 10);
    minInt = parseInt(intPart.slice(2, 4), 10);
  } else {
    return { valid: false, error: 'INVALID ENTRY' };
  }

  const hundredths = decPart.padEnd(2, '0').slice(0, 2);
  const minVal = minInt + parseInt(hundredths || '0', 10) / 100;

  if (deg < 0 || deg > 90 || minVal < 0 || minVal >= 60 || (deg === 90 && minVal > 0)) {
    return { valid: false, error: 'INVALID ENTRY' };
  }

  const decimalDeg = (deg + minVal / 60) * (hem === 'S' ? -1 : 1);
  const formatted = `${hem}${String(deg).padStart(2, '0')}°${String(minInt).padStart(2, '0')}.${hundredths}`;

  return {
    valid: true,
    formatted,
    value: Number(decimalDeg.toFixed(6)),
  };
}

/**
 * 2. Longitude Parser: Edddmm.mm or Wdddmm.mm (with shorthand W0, W050, W12345.6)
 */
export function parseLongitude(input: string): ParseResult<number> {
  const clean = input.trim().toUpperCase();
  if (!/^[EW]\d+(\.\d{1,2})?$/.test(clean)) {
    return { valid: false, error: 'INVALID ENTRY' };
  }

  const hem = clean[0];
  const body = clean.slice(1);
  const [intPart, decPart = ''] = body.split('.');

  let deg = 0;
  let minInt = 0;

  if (intPart.length <= 3) {
    deg = parseInt(intPart, 10);
    minInt = 0;
  } else if (intPart.length === 5) {
    deg = parseInt(intPart.slice(0, 3), 10);
    minInt = parseInt(intPart.slice(3, 5), 10);
  } else {
    return { valid: false, error: 'INVALID ENTRY' };
  }

  const hundredths = decPart.padEnd(2, '0').slice(0, 2);
  const minVal = minInt + parseInt(hundredths || '0', 10) / 100;

  if (deg < 0 || deg > 180 || minVal < 0 || minVal >= 60 || (deg === 180 && minVal > 0)) {
    return { valid: false, error: 'INVALID ENTRY' };
  }

  const decimalDeg = (deg + minVal / 60) * (hem === 'W' ? -1 : 1);
  const formatted = `${hem}${String(deg).padStart(3, '0')}°${String(minInt).padStart(2, '0')}.${hundredths}`;

  return {
    valid: true,
    formatted,
    value: Number(decimalDeg.toFixed(6)),
  };
}

/**
 * 3. Combined Lat/Long Parser: Nddmm.mmWdddmm.mm (no space allowed in raw input)
 */
export function parseCombinedLatLon(
  input: string
): ParseResult<{ lat: number; lon: number }> {
  const clean = input.trim().toUpperCase();
  if (clean.includes(' ')) {
    return { valid: false, error: 'INVALID ENTRY' };
  }

  const match = clean.match(/^([NS]\d+(?:\.\d{1,2})?)([EW]\d+(?:\.\d{1,2})?)$/);
  if (!match) {
    return { valid: false, error: 'INVALID ENTRY' };
  }

  const latRes = parseLatitude(match[1]);
  const lonRes = parseLongitude(match[2]);

  if (!latRes.valid || !lonRes.valid || latRes.value === undefined || lonRes.value === undefined) {
    return { valid: false, error: 'INVALID ENTRY' };
  }

  return {
    valid: true,
    formatted: `${latRes.formatted} ${lonRes.formatted}`,
    value: { lat: latRes.value, lon: lonRes.value },
  };
}

/**
 * 4. Temporary Waypoint Creation Syntax (&LLxx, &PBDxx, &PDxx, &PBPBxx)
 */
export interface CustomWaypointResult {
  ident: string;
  type: 'LATLON' | 'PBD';
  coordinates: { lat: number; lon: number };
  formattedDisplay: string;
}

export function parseCustomWaypoint(
  input: string,
  counters: { ll?: number; pbd?: number; pd?: number; pbpb?: number } = {},
  currentTrackBearingDeg = 90
): ParseResult<CustomWaypointResult> {
  const clean = input.trim().toUpperCase();

  // Case A: Place // Distance (&PDxx) -> [WPT]//ddd.d
  if (clean.includes('//')) {
    const pdMatch = clean.match(/^([A-Z0-9]{2,5})\/\/(\d{1,4}(?:\.\d)?)$/);
    if (!pdMatch) return { valid: false, error: 'INVALID ENTRY' };

    const navPt = lookupNavPoint(pdMatch[1]);
    const dist = parseFloat(pdMatch[2]);
    if (!navPt || isNaN(dist) || dist < 0.1 || dist > 9999.9) {
      return { valid: false, error: 'INVALID ENTRY' };
    }

    const idx = String(counters.pd ?? 1).padStart(2, '0');
    const coords = projectPointByBearingDistance(navPt, currentTrackBearingDeg, dist);
    return {
      valid: true,
      formatted: `&PD${idx}`,
      value: {
        ident: `&PD${idx}`,
        type: 'PBD',
        coordinates: coords,
        formattedDisplay: `&PD${idx}`,
      },
    };
  }

  // Case B: Place / Bearing / Place / Bearing (&PBPBxx) -> [WPT1]/ddd/[WPT2]/ddd
  const slashParts = clean.split('/');
  if (slashParts.length === 4) {
    const [wpt1Str, brg1Str, wpt2Str, brg2Str] = slashParts;
    const wpt1 = lookupNavPoint(wpt1Str);
    const wpt2 = lookupNavPoint(wpt2Str);
    if (!wpt1 || !wpt2) return { valid: false, error: 'INVALID ENTRY' };

    if (!/^\d{1,3}T?$/.test(brg1Str) || !/^\d{1,3}T?$/.test(brg2Str)) {
      return { valid: false, error: 'INVALID ENTRY' };
    }
    const brg1 = parseInt(brg1Str.replace('T', ''), 10);
    const brg2 = parseInt(brg2Str.replace('T', ''), 10);
    if (brg1 < 0 || brg1 >= 360 || brg2 < 0 || brg2 >= 360) {
      return { valid: false, error: 'INVALID ENTRY' };
    }

    const intersection = calculateRadialIntersection(wpt1, brg1, wpt2, brg2);
    if (!intersection) {
      return { valid: false, error: 'RADIALS DO NOT INTERSECT' };
    }

    const idx = String(counters.pbpb ?? 1).padStart(2, '0');
    return {
      valid: true,
      formatted: `&PBPB${idx}`,
      value: {
        ident: `&PBPB${idx}`,
        type: 'PBD',
        coordinates: intersection,
        formattedDisplay: `&PBPB${idx}`,
      },
    };
  }

  // Case C: Place / Bearing / Distance (&PBDxx) -> [WPT]/ddd/ddd.d or [WPT]/dddT/ddd.d
  if (slashParts.length === 3) {
    const [wptStr, brgStr, distStr] = slashParts;
    const wpt = lookupNavPoint(wptStr);
    if (!wpt) return { valid: false, error: 'INVALID ENTRY' };

    if (!/^\d{1,3}T?$/.test(brgStr) || !/^\d{1,4}(?:\.\d)?$/.test(distStr)) {
      return { valid: false, error: 'INVALID ENTRY' };
    }
    const brg = parseInt(brgStr.replace('T', ''), 10);
    const dist = parseFloat(distStr);
    if (brg < 0 || brg >= 360 || dist < 0.1 || dist > 9999.9) {
      return { valid: false, error: 'INVALID ENTRY' };
    }

    const coords = projectPointByBearingDistance(wpt, brg, dist);
    const idx = String(counters.pbd ?? 1).padStart(2, '0');
    return {
      valid: true,
      formatted: `&PBD${idx}`,
      value: {
        ident: `&PBD${idx}`,
        type: 'PBD',
        coordinates: coords,
        formattedDisplay: `&PBD${idx}`,
      },
    };
  }

  // Case D: Combined Lat/Lon (&LLxx) -> N50W050 or N5000.00W05000.00
  if (/^[NS]/.test(clean) && /[EW]/.test(clean)) {
    const llRes = parseCombinedLatLon(clean);
    if (!llRes.valid || !llRes.value) {
      return { valid: false, error: 'INVALID ENTRY' };
    }
    const idx = String(counters.ll ?? 1).padStart(2, '0');
    return {
      valid: true,
      formatted: `&LL${idx}`,
      value: {
        ident: `&LL${idx}`,
        type: 'LATLON',
        coordinates: llRes.value,
        formattedDisplay: llRes.formatted!,
      },
    };
  }

  return { valid: false, error: 'INVALID ENTRY' };
}

/**
 * 5. Airway String Entry Logic:
 * - Full segment: start.airway.end (e.g. GUP.J102.ALS)
 * - Shorthand: airway.end (e.g. J102.ALS, requires activePrecedingWpt = 'GUP')
 * - Multi-airway chain: start.airway1.airway2.end (e.g. FMN.J65.J4.PKE or TCS.J65.J4.PKE)
 */
export interface AirwayExpansionResult {
  startWpt: string;
  endWpt: string;
  expandedWaypoints: Array<{ ident: string; viaAirway: string }>;
}

function extractSegmentOnAirway(
  airwayIdent: string,
  fromWpt: string,
  toWpt: string
): string[] | null {
  const awy = NAV_AIRWAYS[airwayIdent];
  if (!awy) return null;
  const iFrom = awy.waypoints.indexOf(fromWpt);
  const iTo = awy.waypoints.indexOf(toWpt);
  if (iFrom === -1 || iTo === -1) return null;

  if (iFrom <= iTo) {
    return awy.waypoints.slice(iFrom + 1, iTo + 1);
  } else {
    return awy.waypoints.slice(iTo, iFrom).reverse();
  }
}

export function parseAirwayEntry(
  input: string,
  activePrecedingWpt?: string
): ParseResult<AirwayExpansionResult> {
  const clean = input.trim().toUpperCase();
  const parts = clean.split('.');

  if (parts.length < 2 || parts.length > 4 || parts.some((p) => !p)) {
    return { valid: false, error: 'INVALID ENTRY' };
  }

  // Case 1: Shorthand airway.end (2 parts)
  if (parts.length === 2) {
    const [awyIdent, endWpt] = parts;
    const awy = NAV_AIRWAYS[awyIdent];
    if (!awy) return { valid: false, error: 'INVALID ENTRY' };

    if (!activePrecedingWpt || !awy.waypoints.includes(activePrecedingWpt.toUpperCase())) {
      return { valid: false, error: 'WAYPOINT NOT ON AIRWAY' };
    }
    const startWpt = activePrecedingWpt.toUpperCase();
    if (!awy.waypoints.includes(endWpt)) {
      return { valid: false, error: 'WAYPOINT NOT ON AIRWAY' };
    }

    const seq = extractSegmentOnAirway(awyIdent, startWpt, endWpt);
    if (!seq) return { valid: false, error: 'WAYPOINT NOT ON AIRWAY' };

    return {
      valid: true,
      formatted: `${startWpt}.${awyIdent}.${endWpt}`,
      value: {
        startWpt,
        endWpt,
        expandedWaypoints: seq.map((w) => ({ ident: w, viaAirway: awyIdent })),
      },
    };
  }

  // Case 2: Full Segment start.airway.end (3 parts)
  if (parts.length === 3) {
    const [startWpt, awyIdent, endWpt] = parts;
    const awy = NAV_AIRWAYS[awyIdent];
    if (!awy) return { valid: false, error: 'INVALID ENTRY' };

    if (!awy.waypoints.includes(startWpt) || !awy.waypoints.includes(endWpt)) {
      return { valid: false, error: 'WAYPOINT NOT ON AIRWAY' };
    }

    const seq = extractSegmentOnAirway(awyIdent, startWpt, endWpt);
    if (!seq) return { valid: false, error: 'WAYPOINT NOT ON AIRWAY' };

    return {
      valid: true,
      formatted: clean,
      value: {
        startWpt,
        endWpt,
        expandedWaypoints: seq.map((w) => ({ ident: w, viaAirway: awyIdent })),
      },
    };
  }

  // Case 3: Multi-Airway Chain start.airway1.airway2.end (4 parts)
  const [startWpt, awy1Ident, awy2Ident, endWpt] = parts;
  const awy1 = NAV_AIRWAYS[awy1Ident];
  const awy2 = NAV_AIRWAYS[awy2Ident];
  if (!awy1 || !awy2) return { valid: false, error: 'INVALID ENTRY' };

  if (!awy1.waypoints.includes(startWpt) || !awy2.waypoints.includes(endWpt)) {
    return { valid: false, error: 'WAYPOINT NOT ON AIRWAY' };
  }

  // Find shared intersection waypoint between awy1 and awy2
  const sharedFix = awy1.waypoints.find((w) => awy2.waypoints.includes(w));
  if (!sharedFix) {
    return { valid: false, error: 'INVALID ENTRY' };
  }

  const seg1 = extractSegmentOnAirway(awy1Ident, startWpt, sharedFix) ?? [];
  const seg2 = extractSegmentOnAirway(awy2Ident, sharedFix, endWpt) ?? [];

  const expanded: Array<{ ident: string; viaAirway: string }> = [
    ...seg1.map((w) => ({ ident: w, viaAirway: awy1Ident })),
    ...seg2.map((w) => ({ ident: w, viaAirway: awy2Ident })),
  ];

  return {
    valid: true,
    formatted: clean,
    value: {
      startWpt,
      endWpt,
      expandedWaypoints: expanded,
    },
  };
}

/**
 * 6. Altitude / Flight Level Parser (Section 4.1 & 4.5)
 * - 3 digits = Flight Level (e.g. 280 -> FL280 = 28000 FT; 050 -> FL050 = 5000 FT)
 *   Note: Leading-zero 3-digit entries under 1,000 ft (e.g. 008) format as 800FT
 * - 1, 2, 4, 5 digits = Feet (e.g. 3000 -> 3000FT)
 * - Also accepts explicit 'FL280'
 */
export interface AltitudeParseOutput {
  valid: boolean;
  display?: string;
  feet?: number;
  type?: 'AT' | 'AT_OR_ABOVE' | 'AT_OR_BELOW';
  error?: string;
}

export function parseMCDUAltitudeInput(
  input: string,
  certifiedCeilingFt = 41000
): AltitudeParseOutput {
  const cleanInput = input.trim().toUpperCase();
  if (!cleanInput) return { valid: false, error: 'INVALID ENTRY' };

  const isAtOrAbove = cleanInput.endsWith('A');
  const isAtOrBelow = cleanInput.endsWith('B');
  const constraintType: 'AT' | 'AT_OR_ABOVE' | 'AT_OR_BELOW' = isAtOrAbove
    ? 'AT_OR_ABOVE'
    : isAtOrBelow
      ? 'AT_OR_BELOW'
      : 'AT';

  const strippedSuffix = cleanInput.replace(/[AB]$/, '');
  const hasFlPrefix = strippedSuffix.startsWith('FL');
  const numericStr = hasFlPrefix ? strippedSuffix.slice(2) : strippedSuffix;

  if (!/^-?\d{1,5}$/.test(numericStr)) {
    return { valid: false, error: 'INVALID ENTRY' };
  }

  const value = parseInt(numericStr, 10);
  if (isNaN(value)) return { valid: false, error: 'INVALID ENTRY' };

  const suffixChar = isAtOrAbove ? 'A' : isAtOrBelow ? 'B' : '';

  // Explicit FL prefix or 3-digit rule
  if (hasFlPrefix || (numericStr.length === 3 && !numericStr.startsWith('-'))) {
    const flightLevel = value;
    const altitudeFeet = flightLevel * 100;
    if (flightLevel < 0 || altitudeFeet > certifiedCeilingFt || flightLevel > 600) {
      return { valid: false, error: 'EXCEEDS CERT CEILING' };
    }
    // Under 1,000 FT with leading zero (e.g. '008' -> 800FT)
    if (!hasFlPrefix && flightLevel < 10) {
      return {
        valid: true,
        display: `${altitudeFeet}${suffixChar || 'FT'}`,
        feet: altitudeFeet,
        type: constraintType,
      };
    }
    const flPadded = String(flightLevel).padStart(3, '0');
    return {
      valid: true,
      display: suffixChar ? `${altitudeFeet}${suffixChar}` : `FL${flPadded}`,
      feet: altitudeFeet,
      type: constraintType,
    };
  }

  // 1, 2, 4, 5-Digit Rule: Interpreted as Feet
  if (value < -1300) {
    return { valid: false, error: 'INVALID ENTRY' };
  }
  if (value > certifiedCeilingFt || value > 60000) {
    return { valid: false, error: 'EXCEEDS CERT CEILING' };
  }

  return {
    valid: true,
    display: suffixChar ? `${value}${suffixChar}` : `${value}FT`,
    feet: value,
    type: constraintType,
  };
}

/**
 * 7. VNAV Waypoint Constraint Parser (Speed, Altitude, Window: 16000A17000B, 210/10000A, .75/FL280)
 */
export function parseWaypointConstraintInput(
  input: string,
  certifiedCeilingFt = 41000
): ParseResult<FmsWaypointConstraint> {
  const clean = input.trim().toUpperCase();

  // Check if slash is present for Speed/Altitude or Speed-only (e.g. '210/' or '210/10000A')
  let speedPart = '';
  let altPart = clean;

  if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length !== 2) return { valid: false, error: 'INVALID ENTRY' };
    speedPart = parts[0];
    altPart = parts[1];
  }

  const constraint: FmsWaypointConstraint = {};
  let formattedSpeed = '';
  let formattedAlt = '';

  if (speedPart) {
    if (speedPart.startsWith('.')) {
      const machRes = parseMachSpeed(speedPart);
      if (!machRes.valid || machRes.value === undefined) {
        return { valid: false, error: 'INVALID ENTRY' };
      }
      constraint.speedConstraint = machRes.value;
      formattedSpeed = `.${String(Math.round(machRes.value * 100)).padStart(2, '0')}`;
    } else {
      const casRes = parseCasSpeed(speedPart);
      if (!casRes.valid || casRes.value === undefined) {
        return { valid: false, error: 'INVALID ENTRY' };
      }
      constraint.speedConstraint = casRes.value;
      formattedSpeed = `${casRes.value}`;
    }
  }

  if (altPart) {
    // Check for Window constraint: [LOWER]A[UPPER]B or [UPPER]B[LOWER]A
    const winMatchAB = altPart.match(/^(\d{3,5})A(\d{3,5})B$/);
    const winMatchBA = altPart.match(/^(\d{3,5})B(\d{3,5})A$/);

    if (winMatchAB || winMatchBA) {
      const lowerRaw = winMatchAB ? winMatchAB[1] : winMatchBA![2];
      const upperRaw = winMatchAB ? winMatchAB[2] : winMatchBA![1];
      const lowerRes = parseMCDUAltitudeInput(lowerRaw, certifiedCeilingFt);
      const upperRes = parseMCDUAltitudeInput(upperRaw, certifiedCeilingFt);

      if (
        !lowerRes.valid ||
        !upperRes.valid ||
        lowerRes.feet === undefined ||
        upperRes.feet === undefined ||
        lowerRes.feet >= upperRes.feet
      ) {
        return { valid: false, error: 'INVALID ENTRY' };
      }

      constraint.altitudeType = 'WINDOW';
      constraint.altitudeValue1 = lowerRes.feet;
      constraint.altitudeValue2 = upperRes.feet;
      formattedAlt = `${lowerRes.feet}A${upperRes.feet}B`;
    } else {
      const altRes = parseMCDUAltitudeInput(altPart, certifiedCeilingFt);
      if (!altRes.valid || altRes.feet === undefined) {
        return { valid: false, error: altRes.error || 'INVALID ENTRY' };
      }
      constraint.altitudeType = altRes.type ?? 'AT';
      constraint.altitudeValue1 = altRes.feet;
      formattedAlt = altRes.display!;
    }
  }

  if (!speedPart && !altPart) {
    return { valid: false, error: 'INVALID ENTRY' };
  }

  const formatted =
    formattedSpeed && formattedAlt
      ? `${formattedSpeed}/${formattedAlt}`
      : formattedSpeed
        ? `${formattedSpeed}/`
        : formattedAlt;

  return {
    valid: true,
    formatted,
    value: constraint,
  };
}

/**
 * 8. Calibrated Airspeed (CAS) & Mach Speed Parsers
 */
export function parseCasSpeed(input: string, vmo = 320): ParseResult<number> {
  const clean = input.trim();
  if (!/^\d{2,3}$/.test(clean)) return { valid: false, error: 'INVALID ENTRY' };
  const kts = parseInt(clean, 10);
  if (kts < 75 || kts > vmo) return { valid: false, error: 'INVALID ENTRY' };
  return {
    valid: true,
    formatted: `${kts} KTS`,
    value: kts,
  };
}

export function parseMachSpeed(input: string, mmo = 0.82): ParseResult<number> {
  const clean = input.trim();
  if (!/^(?:0)?\.\d{2}$/.test(clean)) return { valid: false, error: 'INVALID ENTRY' };
  const mach = parseFloat(clean);
  if (mach < 0.3 || mach > mmo + 1e-6) return { valid: false, error: 'INVALID ENTRY' };
  const digits = clean.split('.')[1];
  return {
    valid: true,
    formatted: `M .${digits}`,
    value: Number(mach.toFixed(2)),
  };
}

/**
 * 9. Weight, Fuel & Takeoff CG Parsers (Section 4.1 & 4.2)
 */
export function parseZfwInput(
  input: string,
  minTonnes = 30.0,
  maxTonnes = 55.0
): ParseResult<number> {
  const clean = input.trim();
  if (!/^\d{2,6}(?:\.\d)?$/.test(clean)) {
    return { valid: false, error: 'INVALID ENTRY' };
  }

  let val = parseFloat(clean);
  // Convert full kg (e.g. 42500) to thousands (42.5)
  if (val >= 1000) {
    val = val / 1000;
  }

  if (val < minTonnes || val > maxTonnes) {
    return { valid: false, error: 'INVALID ENTRY' };
  }

  const rounded = Math.round(val * 10) / 10;
  return {
    valid: true,
    formatted: rounded.toFixed(1),
    value: rounded,
  };
}

export function parseFuelWeightInput(
  input: string,
  maxTonnes = 25.0
): ParseResult<number> {
  const clean = input.trim();
  if (!/^\d{1,6}(?:\.\d)?$/.test(clean)) {
    return { valid: false, error: 'INVALID ENTRY' };
  }

  let val = parseFloat(clean);
  if (val >= 1000) {
    val = val / 1000;
  }
  if (val < 0 || val > maxTonnes) {
    return { valid: false, error: 'INVALID ENTRY' };
  }

  const rounded = Math.round(val * 10) / 10;
  return {
    valid: true,
    formatted: rounded.toFixed(1),
    value: rounded,
  };
}

export function parseTakeoffCg(input: string): ParseResult<number> {
  const clean = input.trim();
  if (!/^\d{1,2}(?:\.\d)?$/.test(clean)) {
    return { valid: false, error: 'INVALID ENTRY' };
  }
  const cg = parseFloat(clean);
  if (cg < 10.0 || cg > 40.0) {
    return {
      valid: false,
      error: 'CHECK TAKEOFF CG',
      reverseVideo: true,
    };
  }
  const rounded = Math.round(cg * 10) / 10;
  return {
    valid: true,
    formatted: rounded.toFixed(1),
    value: rounded,
  };
}

/**
 * 10. V-Speed Ordering Hierarchy Validator: V1 <= VR <= V2 <= VFS / 1.19
 */
export interface VSpeedHierarchyValidation {
  valid: boolean;
  v1Reverse: boolean;
  vrReverse: boolean;
  v2Reverse: boolean;
  vfsReverse: boolean;
  error?: string;
}

export function validateVSpeedsHierarchy(speeds: {
  v1: number | null;
  vr: number | null;
  v2: number | null;
  vfs: number | null;
}): VSpeedHierarchyValidation {
  let v1Reverse = false;
  let vrReverse = false;
  let v2Reverse = false;
  let vfsReverse = false;

  const { v1, vr, v2, vfs } = speeds;

  if (v1 !== null && vr !== null && v1 > vr) {
    v1Reverse = true;
    vrReverse = true;
  }
  if (vr !== null && v2 !== null && vr > v2) {
    vrReverse = true;
    v2Reverse = true;
  }
  if (v2 !== null && vfs !== null && v2 > Number((vfs / 1.19).toFixed(1))) {
    v2Reverse = true;
    vfsReverse = true;
  }

  const valid = !v1Reverse && !vrReverse && !v2Reverse && !vfsReverse;
  return {
    valid,
    v1Reverse,
    vrReverse,
    v2Reverse,
    vfsReverse,
    error: valid ? undefined : 'CHECK VSPEEDS',
  };
}

/**
 * 11. Wind Direction / Speed Parser: ddd/ss -> '270° / 035'
 */
export function parseWindInput(
  input: string
): ParseResult<{ direction: number; speed: number }> {
  const clean = input.trim();
  const match = clean.match(/^(\d{1,3})\/(\d{1,2})$/);
  if (!match) return { valid: false, error: 'INVALID ENTRY' };

  const dir = parseInt(match[1], 10);
  const spd = parseInt(match[2], 10);
  if (dir < 0 || dir > 360 || spd < 0 || spd > 99) {
    return { valid: false, error: 'INVALID ENTRY' };
  }

  const formatted = `${String(dir).padStart(3, '0')}° / ${String(spd).padStart(3, '0')}`;
  return {
    valid: true,
    formatted,
    value: { direction: dir, speed: spd },
  };
}

/**
 * 12. Temperature / OAT / ISA Deviation Parser: +dd / -dd or dd
 */
export function parseTemperatureInput(
  input: string,
  mode: 'OAT' | 'ISA_DEV' = 'OAT'
): ParseResult<number> {
  const clean = input.trim().toUpperCase().replace(/C$/, '');
  if (!/^[+-]?\d{1,2}$/.test(clean)) {
    return { valid: false, error: 'INVALID ENTRY' };
  }

  const val = parseInt(clean, 10);
  if (mode === 'OAT' && (val < -55 || val > 55)) {
    return { valid: false, error: 'INVALID ENTRY' };
  }
  if (mode === 'ISA_DEV' && (val < -80 || val > 50)) {
    return { valid: false, error: 'INVALID ENTRY' };
  }

  const sign = val >= 0 ? '+' : '-';
  const formatted = `${sign}${String(Math.abs(val)).padStart(2, '0')}°C`;
  return {
    valid: true,
    formatted,
    value: val,
  };
}

/**
 * 13. Hold Inbound Course & Turn Parser: ddd/L, ddd/R, /L, /R
 */
export function parseHoldCourseTurn(
  input: string,
  defaultCourse = 180
): ParseResult<{ course: number; turn: 'L' | 'R' }> {
  const clean = input.trim().toUpperCase();
  const match = clean.match(/^(\d{1,3})?\/([LR])$/);
  if (!match) return { valid: false, error: 'INVALID ENTRY' };

  const course = match[1] !== undefined ? parseInt(match[1], 10) : defaultCourse;
  const turn = match[2] as 'L' | 'R';

  if (course < 0 || course >= 360) {
    return { valid: false, error: 'INVALID ENTRY' };
  }

  const turnWord = turn === 'R' ? 'RIGHT' : 'LEFT';
  const formatted =
    match[1] !== undefined
      ? `${String(course).padStart(3, '0')}° / ${turnWord}`
      : `${turnWord}`;

  return {
    valid: true,
    formatted,
    value: { course, turn },
  };
}

/**
 * 14. Hold Leg Distance / Time Parser: d.d or dd.d
 */
export function parseHoldLeg(
  input: string,
  mode: 'TIME' | 'DIST' = 'TIME'
): ParseResult<number> {
  const clean = input.trim();
  if (!/^\d{1,2}(?:\.\d)?$/.test(clean)) {
    return { valid: false, error: 'INVALID ENTRY' };
  }

  const val = parseFloat(clean);
  if (mode === 'TIME' && (val < 0.5 || val > 3.0)) {
    return { valid: false, error: 'INVALID ENTRY' };
  }
  if (mode === 'DIST' && (val < 1.0 || val > 20.0)) {
    return { valid: false, error: 'INVALID ENTRY' };
  }

  const unit = mode === 'TIME' ? 'MIN' : 'NM';
  return {
    valid: true,
    formatted: `${val.toFixed(1)} ${unit}`,
    value: Number(val.toFixed(1)),
  };
}

/**
 * 15. Lateral Offset Parser: Ld.d or Rd.d (0.1 to 30.0 NM)
 */
export function parseLateralOffset(
  input: string
): ParseResult<{ side: 'L' | 'R'; distanceNm: number }> {
  const clean = input.trim().toUpperCase();
  const match = clean.match(/^([LR])(\d{1,2}(?:\.\d)?)$/);
  if (!match) return { valid: false, error: 'INVALID ENTRY' };

  const side = match[1] as 'L' | 'R';
  const dist = parseFloat(match[2]);
  if (dist < 0.1 || dist > 30.0) {
    return { valid: false, error: 'INVALID ENTRY' };
  }

  return {
    valid: true,
    formatted: `${side} ${dist.toFixed(1)} NM`,
    value: { side, distanceNm: Number(dist.toFixed(1)) },
  };
}

/**
 * 16. QNH / QFE Altimeter Parser: dd.dd (inHg: 16.00..32.00) or dddd (hPa: 542..1083, or 2992 -> 29.92 INHG)
 */
export function parseAltimeterInput(
  input: string
): ParseResult<{ unit: 'INHG' | 'HPA'; value: number }> {
  const clean = input.trim();

  // Explicit decimal inHg (e.g. 29.92)
  if (/^\d{2}\.\d{2}$/.test(clean)) {
    const val = parseFloat(clean);
    if (val < 16.0 || val > 32.0) return { valid: false, error: 'INVALID ENTRY' };
    return {
      valid: true,
      formatted: `${val.toFixed(2)} INHG`,
      value: { unit: 'INHG', value: Number(val.toFixed(2)) },
    };
  }

  if (/^\d{3,4}$/.test(clean)) {
    const num = parseInt(clean, 10);
    // 4-digit inHg shorthand (e.g. 2992 -> 29.92 INHG)
    if (num >= 1600 && num <= 3200) {
      const inHg = num / 100;
      return {
        valid: true,
        formatted: `${inHg.toFixed(2)} INHG`,
        value: { unit: 'INHG', value: Number(inHg.toFixed(2)) },
      };
    }
    // hPa range: 542 to 1083
    if (num >= 542 && num <= 1083) {
      return {
        valid: true,
        formatted: `${num} HPA`,
        value: { unit: 'HPA', value: num },
      };
    }
  }

  return { valid: false, error: 'INVALID ENTRY' };
}

/**
 * 17. Runway Slope & Heading Parsers
 */
export function parseRunwaySlope(input: string): ParseResult<number> {
  const clean = input.trim().replace(/%$/, '');
  if (!/^[+-]?\d(?:\.\d)?$/.test(clean)) {
    return { valid: false, error: 'INVALID ENTRY' };
  }
  const slope = parseFloat(clean);
  if (slope < -2.0 || slope > 2.0) {
    return { valid: false, error: 'INVALID ENTRY' };
  }
  const sign = slope >= 0 ? '+' : '-';
  return {
    valid: true,
    formatted: `${sign}${Math.abs(slope).toFixed(1)}%`,
    value: Number(slope.toFixed(1)),
  };
}

export function parseRunwayHeading(input: string): ParseResult<number> {
  const clean = input.trim();
  if (!/^\d{2,3}$/.test(clean)) return { valid: false, error: 'INVALID ENTRY' };
  let hdg = parseInt(clean, 10);
  if (clean.length === 2) {
    if (hdg < 1 || hdg > 36) return { valid: false, error: 'INVALID ENTRY' };
    hdg = hdg * 10;
  } else {
    if (hdg < 0 || hdg > 360) return { valid: false, error: 'INVALID ENTRY' };
  }
  return {
    valid: true,
    formatted: `${String(hdg).padStart(3, '0')}°`,
    value: hdg,
  };
}
