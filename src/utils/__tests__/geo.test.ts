import { describe, it, expect } from 'vitest';
import {
  calculateDistanceNm,
  calculateBearingDeg,
  projectPointByBearingDistance,
  calculateRadialIntersection,
  formatLatLonMcdu,
} from '../geo';
import { NAV_AIRPORTS, NAV_FIXES, lookupNavPoint } from '../../data/navdb';

describe('Geospatial & AIRAC Navigation Utilities (Step 2)', () => {
  it('computes accurate great-circle distance between SBGR and SBRJ (~182 NM)', () => {
    const sbgr = NAV_AIRPORTS.SBGR;
    const sbrj = NAV_AIRPORTS.SBRJ;
    const dist = calculateDistanceNm(sbgr, sbrj);
    expect(dist).toBeGreaterThan(175);
    expect(dist).toBeLessThan(190);
  });

  it('computes initial bearing from SBGR to SBRJ (~079 deg ENE)', () => {
    const brg = calculateBearingDeg(NAV_AIRPORTS.SBGR, NAV_AIRPORTS.SBRJ);
    expect(brg).toBeGreaterThanOrEqual(70);
    expect(brg).toBeLessThanOrEqual(88);
  });

  it('projects a Place/Bearing/Distance point accurately (PXR/090/30)', () => {
    const pxr = NAV_FIXES.PXR;
    const projected = projectPointByBearingDistance(pxr, 90, 30);
    const checkDist = calculateDistanceNm(pxr, projected);
    expect(checkDist).toBeCloseTo(30, 0);
    expect(projected.lon).toBeGreaterThan(pxr.lon); // Eastward
  });

  it('calculates radial intersection when radials converge (PXR/270 & BXK/005)', () => {
    const pxr = NAV_FIXES.PXR;
    const bxk = NAV_FIXES.BXK;
    // BXK is ~42 NM West of PXR. PXR radial 275 and BXK radial 005 intersect NW of BXK
    const intersection = calculateRadialIntersection(pxr, 275, bxk, 5);
    expect(intersection).not.toBeNull();
  });

  it('returns null when radials diverge or are parallel (RADIALS DO NOT INTERSECT)', () => {
    const pxr = NAV_FIXES.PXR;
    const bxk = NAV_FIXES.BXK;
    // Parallel radials
    expect(calculateRadialIntersection(pxr, 90, bxk, 90)).toBeNull();
    // Diverging radials (PXR East, BXK West)
    expect(calculateRadialIntersection(pxr, 90, bxk, 270)).toBeNull();
  });

  it('formats decimal coordinates into Honeywell MCDU string format', () => {
    const formatted = formatLatLonMcdu(-23.6233, -46.6567);
    expect(formatted).toBe('S23°37.4 W046°39.4');
  });

  it('resolves airports and fixes via lookupNavPoint', () => {
    expect(lookupNavPoint('sbgr')?.type).toBe('AIRPORT');
    expect(lookupNavPoint('VEXIM')?.type).toBe('FIX');
    expect(lookupNavPoint('BCO')?.type).toBe('VOR');
    expect(lookupNavPoint('NONEXISTENT')).toBeNull();
  });
});
