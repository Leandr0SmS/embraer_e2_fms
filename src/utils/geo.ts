/**
 * Geospatial & Aerodynamic Calculation Utilities for Honeywell NG FMS
 */

const EARTH_RADIUS_NM = 3440.065; // Nautical miles

export function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function toDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Great-circle distance between two coordinates in Nautical Miles (NM)
 */
export function calculateDistanceNm(
  p1: { lat: number; lon: number },
  p2: { lat: number; lon: number }
): number {
  const dLat = toRadians(p2.lat - p1.lat);
  const dLon = toRadians(p2.lon - p1.lon);
  const lat1 = toRadians(p1.lat);
  const lat2 = toRadians(p2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_NM * c * 10) / 10;
}

/**
 * Initial bearing (0..359 deg) from p1 to p2
 */
export function calculateBearingDeg(
  p1: { lat: number; lon: number },
  p2: { lat: number; lon: number }
): number {
  const lat1 = toRadians(p1.lat);
  const lat2 = toRadians(p2.lat);
  const dLon = toRadians(p2.lon - p1.lon);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const brng = toDegrees(Math.atan2(y, x));
  return Math.round((brng + 360) % 360);
}

/**
 * Project a new coordinate given origin, bearing (deg), and distance (NM)
 * Used for Place/Bearing/Distance (&PBD) and Place//Distance (&PD)
 */
export function projectPointByBearingDistance(
  origin: { lat: number; lon: number },
  bearingDeg: number,
  distanceNm: number
): { lat: number; lon: number } {
  const angDist = distanceNm / EARTH_RADIUS_NM;
  const brng = toRadians(bearingDeg);
  const lat1 = toRadians(origin.lat);
  const lon1 = toRadians(origin.lon);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angDist) +
      Math.cos(lat1) * Math.sin(angDist) * Math.cos(brng)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(angDist) * Math.cos(lat1),
      Math.cos(angDist) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    lat: Number(toDegrees(lat2).toFixed(4)),
    lon: Number(toDegrees(lon2).toFixed(4)),
  };
}

/**
 * Compute intersection of two radials from p1 (bearing1) and p2 (bearing2)
 * Returns null if radials are parallel, diverge, or intersect > 999 NM away.
 * Used for Place/Bearing/Place/Bearing (&PBPB) validation ("RADIALS DO NOT INTERSECT").
 */
export function calculateRadialIntersection(
  p1: { lat: number; lon: number },
  bearing1Deg: number,
  p2: { lat: number; lon: number },
  bearing2Deg: number
): { lat: number; lon: number } | null {
  // Local equirectangular tangent-plane approximation for tactical navigation distances
  const meanLatRad = toRadians((p1.lat + p2.lat) / 2);
  const cosLat = Math.cos(meanLatRad);
  if (Math.abs(cosLat) < 1e-6) return null;

  // Convert p2 relative to p1 in NM (x = East, y = North)
  const dx = (p2.lon - p1.lon) * 60 * cosLat;
  const dy = (p2.lat - p1.lat) * 60;

  // Direction unit vectors (bearing 0 = North (+y), 90 = East (+x))
  const rad1 = toRadians(bearing1Deg);
  const vx1 = Math.sin(rad1);
  const vy1 = Math.cos(rad1);

  const rad2 = toRadians(bearing2Deg);
  const vx2 = Math.sin(rad2);
  const vy2 = Math.cos(rad2);

  // Solve: t1 * v1 = d + t2 * v2
  const det = vx1 * -vy2 - vy1 * -vx2;
  if (Math.abs(det) < 1e-5) {
    // Parallel radials
    return null;
  }

  const t1 = (dx * -vy2 - dy * -vx2) / det;
  const t2 = (vx1 * dy - vy1 * dx) / det;

  // Both distances along the specified radials must be positive and <= 999 NM
  if (t1 <= 0 || t2 <= 0 || t1 > 999 || t2 > 999) {
    return null;
  }

  const ix = t1 * vx1;
  const iy = t1 * vy1;

  const lat = p1.lat + iy / 60;
  const lon = p1.lon + ix / (60 * cosLat);

  return {
    lat: Number(lat.toFixed(4)),
    lon: Number(lon.toFixed(4)),
  };
}

/**
 * Format decimal lat/lon into Honeywell MCDU standard string: e.g. 'S23°26.1 W046°28.4'
 */
export function formatLatLonMcdu(lat: number, lon: number): string {
  const latHem = lat >= 0 ? 'N' : 'S';
  const lonHem = lon >= 0 ? 'E' : 'W';
  const absLat = Math.abs(lat);
  const absLon = Math.abs(lon);

  const latDeg = Math.floor(absLat);
  const latMin = (absLat - latDeg) * 60;

  const lonDeg = Math.floor(absLon);
  const lonMin = (absLon - lonDeg) * 60;

  const latStr = `${latHem}${String(latDeg).padStart(2, '0')}°${latMin.toFixed(1).padStart(4, '0')}`;
  const lonStr = `${lonHem}${String(lonDeg).padStart(3, '0')}°${lonMin.toFixed(1).padStart(4, '0')}`;
  return `${latStr} ${lonStr}`;
}
