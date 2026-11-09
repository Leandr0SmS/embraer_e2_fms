import { describe, it, expect } from 'vitest';
import {
  parseLatitude,
  parseLongitude,
  parseCombinedLatLon,
  parseCustomWaypoint,
  parseAirwayEntry,
  parseMCDUAltitudeInput,
  parseWaypointConstraintInput,
  parseCasSpeed,
  parseMachSpeed,
  parseZfwInput,
  parseTakeoffCg,
  validateVSpeedsHierarchy,
  parseWindInput,
  parseTemperatureInput,
  parseHoldCourseTurn,
  parseHoldLeg,
  parseLateralOffset,
  parseAltimeterInput,
  parseRunwaySlope,
  parseRunwayHeading,
} from '../scratchpadParser';

describe('Honeywell NG FMS Scratchpad Syntax Matrix (Step 3)', () => {
  describe('1-3. Latitude, Longitude & Combined Coordinates', () => {
    it('normalizes shorthand and full latitude strings', () => {
      expect(parseLatitude('N0')).toEqual({
        valid: true,
        formatted: 'N00°00.00',
        value: 0,
      });
      const r2 = parseLatitude('N1234.5');
      expect(r2.valid).toBe(true);
      expect(r2.formatted).toBe('N12°34.50');
    });

    it('rejects out-of-range latitude or minutes >= 60', () => {
      expect(parseLatitude('N9100.0').valid).toBe(false);
      expect(parseLatitude('S2360.0').valid).toBe(false);
      expect(parseLatitude('2330.0').valid).toBe(false);
    });

    it('normalizes shorthand and full longitude strings', () => {
      expect(parseLongitude('W0').formatted).toBe('W000°00.00');
      expect(parseLongitude('W12345.6').formatted).toBe('W123°45.60');
    });

    it('parses combined lat/lon without spaces (N50W050)', () => {
      const res = parseCombinedLatLon('N50W050');
      expect(res.valid).toBe(true);
      expect(res.formatted).toBe('N50°00.00 W050°00.00');
      expect(res.value).toEqual({ lat: 50, lon: -50 });
    });

    it('rejects combined lat/lon with spaces', () => {
      expect(parseCombinedLatLon('N50 W050').valid).toBe(false);
    });
  });

  describe('4. Temporary Waypoints (&LLxx, &PBDxx, &PDxx, &PBPBxx)', () => {
    it('creates &LL01 from combined Lat/Lon', () => {
      const res = parseCustomWaypoint('N50W050', { ll: 1 });
      expect(res.valid).toBe(true);
      expect(res.value?.ident).toBe('&LL01');
    });

    it('creates &PBD01 from Place/Bearing/Distance (PXR/090/30 and PXR/090T/30)', () => {
      const res1 = parseCustomWaypoint('PXR/090/30', { pbd: 1 });
      expect(res1.valid).toBe(true);
      expect(res1.value?.ident).toBe('&PBD01');

      const res2 = parseCustomWaypoint('PXR/090T/30', { pbd: 2 });
      expect(res2.valid).toBe(true);
      expect(res2.value?.ident).toBe('&PBD02');
    });

    it('creates &PD01 from Place//Distance (DRK//20)', () => {
      const res = parseCustomWaypoint('DRK//20', { pd: 1 });
      expect(res.valid).toBe(true);
      expect(res.value?.ident).toBe('&PD01');
    });

    it('creates &PBPB01 when radials intersect and returns RADIALS DO NOT INTERSECT when parallel/diverging', () => {
      const ok = parseCustomWaypoint('PXR/275/BXK/005', { pbpb: 1 });
      expect(ok.valid).toBe(true);
      expect(ok.value?.ident).toBe('&PBPB01');

      const bad = parseCustomWaypoint('PXR/090/BXK/270', { pbpb: 1 });
      expect(bad.valid).toBe(false);
      expect(bad.error).toBe('RADIALS DO NOT INTERSECT');
    });
  });

  describe('5. Airway String Entry Logic', () => {
    it('expands full airway segment (GUP.J102.ALS)', () => {
      const res = parseAirwayEntry('GUP.J102.ALS');
      expect(res.valid).toBe(true);
      expect(res.value?.expandedWaypoints.map((w) => w.ident)).toEqual([
        'ABQ',
        'FMN',
        'ALS',
      ]);
    });

    it('expands shorthand airway (J102.ALS) when active preceding waypoint is GUP', () => {
      const res = parseAirwayEntry('J102.ALS', 'GUP');
      expect(res.valid).toBe(true);
      expect(res.value?.expandedWaypoints.map((w) => w.ident)).toEqual([
        'ABQ',
        'FMN',
        'ALS',
      ]);
    });

    it('triggers WAYPOINT NOT ON AIRWAY if preceding waypoint is not on airway', () => {
      const res = parseAirwayEntry('J102.ALS', 'SBGR');
      expect(res.valid).toBe(false);
      expect(res.error).toBe('WAYPOINT NOT ON AIRWAY');
    });

    it('expands multi-airway chain (FMN.J65.J4.PKE)', () => {
      const res = parseAirwayEntry('FMN.J65.J4.PKE');
      expect(res.valid).toBe(true);
      const idents = res.value?.expandedWaypoints.map((w) => w.ident);
      expect(idents).toContain('TCS');
      expect(idents?.[idents.length - 1]).toBe('PKE');
    });
  });

  describe('6-7. Altitude & VNAV Constraints', () => {
    it('converts 3-digit inputs to Flight Levels and 4-digit inputs to Feet', () => {
      expect(parseMCDUAltitudeInput('280')).toEqual({
        valid: true,
        display: 'FL280',
        feet: 28000,
        type: 'AT',
      });
      expect(parseMCDUAltitudeInput('050').display).toBe('FL050');
      expect(parseMCDUAltitudeInput('008').display).toBe('800FT');
      expect(parseMCDUAltitudeInput('3000').display).toBe('3000FT');
    });

    it('triggers EXCEEDS CERT CEILING above 41,000 FT', () => {
      const res = parseMCDUAltitudeInput('450');
      expect(res.valid).toBe(false);
      expect(res.error).toBe('EXCEEDS CERT CEILING');
    });

    it('parses VNAV altitude and window constraints (10000A, FL180B, 16000A17000B)', () => {
      expect(parseWaypointConstraintInput('10000A').formatted).toBe('10000A');
      expect(parseWaypointConstraintInput('FL180B').formatted).toBe('18000B');

      const win = parseWaypointConstraintInput('16000A17000B');
      expect(win.valid).toBe(true);
      expect(win.value?.altitudeType).toBe('WINDOW');
      expect(win.value?.altitudeValue1).toBe(16000);
      expect(win.value?.altitudeValue2).toBe(17000);

      // Invalid window where lower > upper
      expect(parseWaypointConstraintInput('18000A16000B').valid).toBe(false);
    });
  });

  describe('8-10. Speeds, Weights, CG & V-Speed Hierarchy', () => {
    it('validates CAS (75..320 KTS) and Mach (.30...82)', () => {
      expect(parseCasSpeed('250').formatted).toBe('250 KTS');
      expect(parseCasSpeed('340').valid).toBe(false);
      expect(parseMachSpeed('.78').formatted).toBe('M .78');
      expect(parseMachSpeed('.85').valid).toBe(false);
    });

    it('validates ZFW in thousands or full kg (42500 -> 42.5)', () => {
      expect(parseZfwInput('42500').formatted).toBe('42.5');
      expect(parseZfwInput('45.0').formatted).toBe('45.0');
      expect(parseZfwInput('20.0').valid).toBe(false);
    });

    it('validates Takeoff CG and triggers CHECK TAKEOFF CG outside 10..40% MAC', () => {
      expect(parseTakeoffCg('24.5').valid).toBe(true);
      const badCg = parseTakeoffCg('45.0');
      expect(badCg.valid).toBe(false);
      expect(badCg.error).toBe('CHECK TAKEOFF CG');
      expect(badCg.reverseVideo).toBe(true);
    });

    it('flags V-Speed ordering violations in reverse video', () => {
      const ok = validateVSpeedsHierarchy({ v1: 134, vr: 138, v2: 142, vfs: 182 });
      expect(ok.valid).toBe(true);

      const v1GtVr = validateVSpeedsHierarchy({ v1: 140, vr: 138, v2: 142, vfs: 182 });
      expect(v1GtVr.valid).toBe(false);
      expect(v1GtVr.v1Reverse).toBe(true);
      expect(v1GtVr.vrReverse).toBe(true);
    });
  });

  describe('11-17. Wind, Temp, Hold, Offset, Altimeter, Runway', () => {
    it('formats wind, temperature, hold, offset, altimeter, and slope', () => {
      expect(parseWindInput('270/35').formatted).toBe('270° / 035');
      expect(parseWindInput('80/12').formatted).toBe('080° / 012');
      expect(parseTemperatureInput('+5').formatted).toBe('+05°C');
      expect(parseHoldCourseTurn('180/R').formatted).toBe('180° / RIGHT');
      expect(parseHoldLeg('1.5', 'TIME').formatted).toBe('1.5 MIN');
      expect(parseLateralOffset('L5').formatted).toBe('L 5.0 NM');
      expect(parseAltimeterInput('2992').formatted).toBe('29.92 INHG');
      expect(parseAltimeterInput('1013').formatted).toBe('1013 HPA');
      expect(parseRunwaySlope('+0.2').formatted).toBe('+0.2%');
      expect(parseRunwayHeading('09').formatted).toBe('090°');
    });
  });
});
