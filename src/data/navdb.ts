/**
 * Static AIRAC Navigation Database (AIRAC 2405)
 * Includes Brazilian E2 trunk routes (SBGR, SBRJ, SBGL, SBKP, SBSP) and
 * Honeywell NG FMS Scratchpad Specification reference fixes/airways (GUP, ALS, J102, TCS, J65, J4, PKE, PXR, DRK, BXK).
 */

export interface NavRunway {
  ident: string;        // e.g. '09L'
  headingDeg: number;   // Magnetic heading e.g. 93
  elevationFt: number;  // Threshold elevation e.g. 2459
  slopePercent: number; // e.g. +0.2
  lengthMeters: number; // e.g. 3700
  lat: number;
  lon: number;
}

export interface NavAirport {
  icao: string;
  name: string;
  lat: number;
  lon: number;
  elevationFt: number;
  transitionAltFt: number;
  runways: NavRunway[];
  sids: Record<string, string[]>;                          // SID ident -> waypoint sequence
  sidTransitions?: Record<string, Record<string, string[]>>; // SID ident -> (Trans ident -> waypoints)
  stars: Record<string, string[]>;                         // STAR ident -> waypoint sequence
  starTransitions?: Record<string, Record<string, string[]>>; // STAR ident -> (Trans ident -> waypoints)
  approaches?: string[];                                   // e.g. ['ILS 30L', 'RNAV 30L']
  approachTransitions?: Record<string, Record<string, string[]>>; // Appr ident -> (Trans ident -> waypoints)
}

export interface NavFix {
  ident: string;
  type: 'VOR' | 'NDB' | 'FIX';
  lat: number;
  lon: number;
  frequencyMhz?: string;
  name?: string;
}

export interface NavAirway {
  ident: string;
  waypoints: string[]; // Ordered waypoint identifiers
}

export interface NavCompanyRoute {
  ident: string;
  origin: string;
  destination: string;
  defaultRunway: string;
  alternate: string;
  waypoints: string[];
}

export const AIRAC_METADATA = {
  cycle: 'AIRAC 2405',
  date: '19MAY26',
  utc: '0041z',
  activeDates: '20APR 18MAY/23',
  inactiveDates: '26JAN 23FEB/23>',
  ndbVersion: 'NDB V2.08 23M',
  partNumber: 'H3652304001',
  subPartNumber: 'DS31908001',
  softwareLoad: 'NG 1.0',
  aircraftModel: 'E195-E2',
  engines: 'PW1900G',
};

export const NAV_AIRPORTS: Record<string, NavAirport> = {
  SBGR: {
    icao: 'SBGR',
    name: 'SAO PAULO/GUARULHOS',
    lat: -23.4356,
    lon: -46.4731,
    elevationFt: 2459,
    transitionAltFt: 8000,
    runways: [
      { ident: '09L', headingDeg: 93, elevationFt: 2459, slopePercent: 0.2, lengthMeters: 3700, lat: -23.4319, lon: -46.4695 },
      { ident: '09R', headingDeg: 93, elevationFt: 2450, slopePercent: 0.1, lengthMeters: 3000, lat: -23.4392, lon: -46.4765 },
      { ident: '10R', headingDeg: 95, elevationFt: 2450, slopePercent: 0.0, lengthMeters: 3000, lat: -23.4392, lon: -46.4765 },
      { ident: '10L', headingDeg: 95, elevationFt: 2459, slopePercent: 0.1, lengthMeters: 3700, lat: -23.4319, lon: -46.4695 },
      { ident: '27L', headingDeg: 273, elevationFt: 2454, slopePercent: -0.1, lengthMeters: 3000, lat: -23.4375, lon: -46.4475 },
      { ident: '27R', headingDeg: 273, elevationFt: 2463, slopePercent: -0.2, lengthMeters: 3700, lat: -23.4301, lon: -46.4338 },
      { ident: '28L', headingDeg: 275, elevationFt: 2454, slopePercent: 0.0, lengthMeters: 3000, lat: -23.4375, lon: -46.4475 },
    ],
    sids: {
      OMNI: ['VEXIM'],
      VEXIM1A: ['VEXIM', 'BCO'],
      CPN2A: ['CPN', 'VEXIM'],
    },
    stars: {
      SAT1A: ['SAT', 'BCO'],
    },
    approaches: ['ILS 09R', 'ILS 10R', 'RNP 09L'],
  },
  SBCF: {
    icao: 'SBCF',
    name: 'BELO HORIZONTE/CONFINS',
    lat: -19.6244,
    lon: -43.9719,
    elevationFt: 2715,
    transitionAltFt: 7000,
    runways: [
      { ident: '16', headingDeg: 158, elevationFt: 2715, slopePercent: -0.1, lengthMeters: 3600, lat: -19.611, lon: -43.978 },
      { ident: '34', headingDeg: 338, elevationFt: 2690, slopePercent: 0.1, lengthMeters: 3600, lat: -19.638, lon: -43.965 },
    ],
    sids: {
      CONF1A: ['OPOR'],
    },
    stars: {
      OPOR1A: ['OPOR'],
    },
    approaches: ['ILS 16', 'RNP 16', 'RNP 34'],
  },
  SBGO: {
    icao: 'SBGO',
    name: 'GOIANIA/SANTA GENOVEVA',
    lat: -16.632,
    lon: -49.2206,
    elevationFt: 2450,
    transitionAltFt: 7000,
    runways: [
      { ident: '14', headingDeg: 138, elevationFt: 2450, slopePercent: 0.0, lengthMeters: 2500, lat: -16.625, lon: -49.228 },
      { ident: '32', headingDeg: 318, elevationFt: 2445, slopePercent: 0.0, lengthMeters: 2500, lat: -16.639, lon: -49.213 },
    ],
    sids: {},
    stars: {},
    approaches: ['ILS 14', 'RNP 32'],
  },
  KPHX: {
    icao: 'KPHX',
    name: 'PHOENIX SKY HARBOR INTL',
    lat: 33.4342,
    lon: -112.0116,
    elevationFt: 1135,
    transitionAltFt: 18000,
    runways: [
      { ident: '07L', headingDeg: 78, elevationFt: 1131, slopePercent: 0.1, lengthMeters: 3139, lat: 33.428, lon: -112.025 },
      { ident: '07R', headingDeg: 78, elevationFt: 1126, slopePercent: 0.1, lengthMeters: 2377, lat: 33.424, lon: -112.022 },
      { ident: '08',  headingDeg: 78, elevationFt: 1135, slopePercent: 0.0, lengthMeters: 3502, lat: 33.441, lon: -112.028 },
      { ident: '25L', headingDeg: 258, elevationFt: 1132, slopePercent: -0.1, lengthMeters: 2377, lat: 33.424, lon: -111.995 },
      { ident: '25R', headingDeg: 258, elevationFt: 1135, slopePercent: -0.1, lengthMeters: 3139, lat: 33.428, lon: -111.992 },
      { ident: '26',  headingDeg: 258, elevationFt: 1135, slopePercent: 0.0, lengthMeters: 3502, lat: 33.441, lon: -111.991 },
    ],
    sids: {
      SILOW4: ['SILOW', 'PAYSO'],
      CHILY4: ['PXR', 'PAYSO'],
      FORPE1: ['PXR', 'DRK'],
      GILLI4: ['PXR', 'BXK'],
      HUDAD2: ['PXR', 'GUP'],
    },
    sidTransitions: {
      SILOW4: {
        DRK: ['DRK'],
        FLG: ['DRK'],
        INW: ['PAYSO'],
        RSK: ['GUP', 'RSK'],
        SJN: ['PAYSO'],
      },
    },
    stars: {},
    approaches: ['ILS 08', 'ILS 26'],
  },
  KMSP: {
    icao: 'KMSP',
    name: 'MINNEAPOLIS-ST PAUL INTL',
    lat: 44.8848,
    lon: -93.2223,
    elevationFt: 841,
    transitionAltFt: 18000,
    runways: [
      { ident: '04',  headingDeg: 44,  elevationFt: 838, slopePercent: 0.0, lengthMeters: 3355, lat: 44.875, lon: -93.235 },
      { ident: '12L', headingDeg: 120, elevationFt: 841, slopePercent: -0.1, lengthMeters: 2499, lat: 44.892, lon: -93.228 },
      { ident: '12R', headingDeg: 120, elevationFt: 840, slopePercent: -0.1, lengthMeters: 3048, lat: 44.881, lon: -93.232 },
      { ident: '30L', headingDeg: 300, elevationFt: 822, slopePercent: 0.1, lengthMeters: 3048, lat: 44.872, lon: -93.205 },
      { ident: '30R', headingDeg: 300, elevationFt: 816, slopePercent: 0.1, lengthMeters: 2499, lat: 44.884, lon: -93.201 },
    ],
    sids: {},
    stars: {
      KASPR6: ['KASPR', 'KATOE'],
      GOPHER5: ['GEP'],
    },
    starTransitions: {
      KASPR6: {
        ABR: ['KASPR', 'KATOE'],
        MCW: ['MCW', 'KASPR', 'KATOE'],
        ONL: ['ONL', 'MCW', 'KASPR', 'KATOE'],
        RWF: ['KASPR', 'KATOE'],
      },
    },
    approaches: ['ILS 30L', 'ILS 30R', 'RNAV 30L', 'ILS 12L', 'ILS 12R'],
    approachTransitions: {
      'ILS 30L': {
        HASTI: ['HASTI', 'SLLAP', 'CEGAN', 'FIBBS', 'SNUPY'],
      },
    },
  },
  KDLH: {
    icao: 'KDLH',
    name: 'DULUTH INTL',
    lat: 46.8421,
    lon: -92.1936,
    elevationFt: 1428,
    transitionAltFt: 18000,
    runways: [
      { ident: '09', headingDeg: 92,  elevationFt: 1428, slopePercent: 0.0, lengthMeters: 3218, lat: 46.842, lon: -92.212 },
      { ident: '27', headingDeg: 272, elevationFt: 1418, slopePercent: 0.0, lengthMeters: 3218, lat: 46.842, lon: -92.175 },
    ],
    sids: {},
    stars: {},
    approaches: ['ILS 09', 'ILS 27'],
  },
  SBRJ: {
    icao: 'SBRJ',
    name: 'RIO DE JANEIRO/SANTOS DUMONT',
    lat: -22.9105,
    lon: -43.1631,
    elevationFt: 11,
    transitionAltFt: 7000,
    runways: [
      { ident: '02R', headingDeg: 21, elevationFt: 11, slopePercent: 0.0, lengthMeters: 1323, lat: -22.916, lon: -43.164 },
      { ident: '02L', headingDeg: 21, elevationFt: 11, slopePercent: 0.0, lengthMeters: 1260, lat: -22.915, lon: -43.165 },
      { ident: '20L', headingDeg: 201, elevationFt: 11, slopePercent: 0.0, lengthMeters: 1323, lat: -22.905, lon: -43.162 },
      { ident: '20R', headingDeg: 201, elevationFt: 11, slopePercent: 0.0, lengthMeters: 1260, lat: -22.905, lon: -43.163 },
    ],
    sids: {
      PCX1A: ['PCX', 'BUSPA'],
    },
    stars: {
      BUSPA1A: ['BUSPA', 'PCX', 'NILSA'],
    },
  },
  SBGL: {
    icao: 'SBGL',
    name: 'RIO DE JANEIRO/GALEAO',
    lat: -22.81,
    lon: -43.2506,
    elevationFt: 28,
    transitionAltFt: 7000,
    runways: [
      { ident: '10', headingDeg: 99, elevationFt: 28, slopePercent: 0.1, lengthMeters: 4000, lat: -22.805, lon: -43.268 },
      { ident: '28', headingDeg: 279, elevationFt: 22, slopePercent: -0.1, lengthMeters: 4000, lat: -22.801, lon: -43.229 },
      { ident: '15', headingDeg: 147, elevationFt: 18, slopePercent: 0.0, lengthMeters: 3180, lat: -22.809, lon: -43.256 },
      { ident: '33', headingDeg: 327, elevationFt: 19, slopePercent: 0.0, lengthMeters: 3180, lat: -22.829, lon: -43.235 },
    ],
    sids: {
      PCX2B: ['PCX'],
    },
    stars: {
      BUSPA2B: ['BUSPA', 'PCX'],
    },
  },
  SBKP: {
    icao: 'SBKP',
    name: 'CAMPINAS/VIRACOPOS',
    lat: -23.0069,
    lon: -47.1344,
    elevationFt: 2170,
    transitionAltFt: 8000,
    runways: [
      { ident: '15', headingDeg: 149, elevationFt: 2170, slopePercent: -0.3, lengthMeters: 3240, lat: -22.996, lon: -47.145 },
      { ident: '33', headingDeg: 329, elevationFt: 2129, slopePercent: 0.3, lengthMeters: 3240, lat: -23.017, lon: -47.124 },
    ],
    sids: {
      CPN1A: ['CPN', 'VEXIM'],
    },
    stars: {
      CPN1B: ['CPN'],
    },
  },
  SBSP: {
    icao: 'SBSP',
    name: 'SAO PAULO/CONGONHAS',
    lat: -23.6261,
    lon: -46.6564,
    elevationFt: 2631,
    transitionAltFt: 8000,
    runways: [
      { ident: '17R', headingDeg: 169, elevationFt: 2631, slopePercent: -0.2, lengthMeters: 1940, lat: -23.618, lon: -46.659 },
      { ident: '35L', headingDeg: 349, elevationFt: 2615, slopePercent: 0.2, lengthMeters: 1940, lat: -23.634, lon: -46.653 },
    ],
    sids: {},
    stars: {},
  },
};

export const NAV_FIXES: Record<string, NavFix> = {
  // Brazilian Fixes & VORs
  VEXIM: { ident: 'VEXIM', type: 'FIX', lat: -23.3512, lon: -46.1524 },
  BCO:   { ident: 'BCO',   type: 'VOR', lat: -23.2461, lon: -45.8542, frequencyMhz: '115.3', name: 'SAO JOSE' },
  CPN:   { ident: 'CPN',   type: 'VOR', lat: -23.0081, lon: -47.1292, frequencyMhz: '116.2', name: 'CAMPINAS' },
  BUSPA: { ident: 'BUSPA', type: 'FIX', lat: -23.1125, lon: -44.7185 },
  PCX:   { ident: 'PCX',   type: 'VOR', lat: -22.9522, lon: -43.7114, frequencyMhz: '113.6', name: 'SANTA CRUZ' },
  NILSA: { ident: 'NILSA', type: 'FIX', lat: -22.9288, lon: -43.3210 },
  SAT:   { ident: 'SAT',   type: 'VOR', lat: -23.8822, lon: -46.4281, frequencyMhz: '114.7', name: 'SANTOS' },
  UGRA:  { ident: 'UGRA',  type: 'FIX', lat: -23.1920, lon: -45.2110 },
  POXIM: { ident: 'POXIM', type: 'FIX', lat: -22.9810, lon: -44.1150 },
  OPOR:  { ident: 'OPOR',  type: 'FIX', lat: -20.4120, lon: -44.5210 },

  // US Fixes & VORs from Honeywell NG FMS E2 Pilot's Guide & Scratchpad Guide
  SILOW: { ident: 'SILOW', type: 'FIX', lat: 33.6120, lon: -111.5840 },
  PAYSO: { ident: 'PAYSO', type: 'FIX', lat: 34.2310, lon: -111.3250 },
  RSK:   { ident: 'RSK',   type: 'VOR', lat: 36.7480, lon: -108.0990, frequencyMhz: '115.3', name: 'RATTLESNAKE' },
  DVV:   { ident: 'DVV',   type: 'VOR', lat: 39.8947, lon: -104.6244, frequencyMhz: '117.9', name: 'MILE HIGH' },
  ONL:   { ident: 'ONL',   type: 'VOR', lat: 42.4692, lon: -98.6869,  frequencyMhz: '113.9', name: 'ONEILL' },
  MCW:   { ident: 'MCW',   type: 'VOR', lat: 43.0947, lon: -93.3297,  frequencyMhz: '114.9', name: 'MASON CITY' },
  KASPR: { ident: 'KASPR', type: 'FIX', lat: 44.1250, lon: -93.2810 },
  KATOE: { ident: 'KATOE', type: 'FIX', lat: 44.4510, lon: -93.2520 },
  GEP:   { ident: 'GEP',   type: 'VOR', lat: 45.1458, lon: -93.3731,  frequencyMhz: '117.3', name: 'GOPHER' },
  HASTI: { ident: 'HASTI', type: 'FIX', lat: 44.6820, lon: -92.9540 },
  SLLAP: { ident: 'SLLAP', type: 'FIX', lat: 44.7350, lon: -93.0210 },
  CEGAN: { ident: 'CEGAN', type: 'FIX', lat: 44.7820, lon: -93.0890 },
  FIBBS: { ident: 'FIBBS', type: 'FIX', lat: 44.8210, lon: -93.1450 },
  SNUPY: { ident: 'SNUPY', type: 'FIX', lat: 44.8550, lon: -93.1880 },
  GUP:   { ident: 'GUP',   type: 'VOR', lat: 35.4761, lon: -108.8726, frequencyMhz: '115.1', name: 'GALLUP' },
  ABQ:   { ident: 'ABQ',   type: 'VOR', lat: 35.0438, lon: -106.8163, frequencyMhz: '113.2', name: 'ALBUQUERQUE' },
  FMN:   { ident: 'FMN',   type: 'VOR', lat: 36.7484, lon: -108.0989, frequencyMhz: '115.3', name: 'FARMINGTON' },
  ALS:   { ident: 'ALS',   type: 'VOR', lat: 37.3492, lon: -105.8155, frequencyMhz: '113.9', name: 'ALAMOSA' },
  PUB:   { ident: 'PUB',   type: 'VOR', lat: 38.2942, lon: -104.4294, frequencyMhz: '116.7', name: 'PUEBLO' },
  TCS:   { ident: 'TCS',   type: 'VOR', lat: 33.2825, lon: -107.2805, frequencyMhz: '112.7', name: 'TRUTH OR CONSEQUENCES' },
  ELP:   { ident: 'ELP',   type: 'VOR', lat: 31.8159, lon: -106.2819, frequencyMhz: '115.2', name: 'EL PASO' },
  PKE:   { ident: 'PKE',   type: 'VOR', lat: 34.1020, lon: -114.6820, frequencyMhz: '117.9', name: 'PARKER' },
  PXR:   { ident: 'PXR',   type: 'VOR', lat: 33.4330, lon: -111.9900, frequencyMhz: '115.6', name: 'PHOENIX' },
  DRK:   { ident: 'DRK',   type: 'VOR', lat: 34.7025, lon: -112.4803, frequencyMhz: '114.1', name: 'DRAKE' },
  BXK:   { ident: 'BXK',   type: 'VOR', lat: 33.4534, lon: -112.8246, frequencyMhz: '110.6', name: 'BUCKEYE' },
};

export const NAV_AIRWAYS: Record<string, NavAirway> = {
  // Brazilian High Altitude Airway
  UZ1: {
    ident: 'UZ1',
    waypoints: ['CPN', 'VEXIM', 'BCO', 'UGRA', 'BUSPA', 'POXIM', 'PCX', 'NILSA'],
  },
  UW2: {
    ident: 'UW2',
    waypoints: ['SAT', 'VEXIM', 'BCO', 'BUSPA'],
  },
  // Honeywell Spec Reference Airways
  J102: {
    ident: 'J102',
    waypoints: ['GUP', 'ABQ', 'FMN', 'ALS', 'PUB'],
  },
  J65: {
    ident: 'J65',
    waypoints: ['ELP', 'TCS', 'ABQ', 'FMN'],
  },
  J4: {
    ident: 'J4',
    waypoints: ['PKE', 'BXK', 'PXR', 'TCS', 'ELP'],
  },
  J44: {
    ident: 'J44',
    waypoints: ['RSK', 'ALS', 'PUB', 'DVV'],
  },
  J114: {
    ident: 'J114',
    waypoints: ['DVV', 'ONL'],
  },
};

export const NAV_COMPANY_ROUTES: Record<string, NavCompanyRoute> = {
  GRUJSD01: {
    ident: 'GRUJSD01',
    origin: 'SBGR',
    destination: 'SBRJ',
    defaultRunway: '09L',
    alternate: 'SBGL',
    waypoints: ['VEXIM', 'BCO', 'BUSPA', 'PCX', 'NILSA'],
  },
  GRUGIG01: {
    ident: 'GRUGIG01',
    origin: 'SBGR',
    destination: 'SBGL',
    defaultRunway: '09L',
    alternate: 'SBRJ',
    waypoints: ['VEXIM', 'BCO', 'BUSPA', 'PCX'],
  },
  'SBGR-SBCF': {
    ident: 'SBGR-SBCF',
    origin: 'SBGR',
    destination: 'SBCF',
    defaultRunway: '10R',
    alternate: 'SBGO',
    waypoints: ['VEXIM', 'BCO', 'OPOR'],
  },
  'KPHX-KMSP': {
    ident: 'KPHX-KMSP',
    origin: 'KPHX',
    destination: 'KMSP',
    defaultRunway: '08',
    alternate: 'KDLH',
    waypoints: ['SILOW', 'PAYSO', 'GUP', 'RSK', 'DVV', 'ONL', 'MCW', 'KASPR', 'KATOE'],
  },
};

/**
 * Resolve any waypoint or airport identifier in the Navigation Database
 */
export function lookupNavPoint(ident: string): {
  ident: string;
  type: 'AIRPORT' | 'VOR' | 'NDB' | 'FIX';
  lat: number;
  lon: number;
} | null {
  const clean = ident.trim().toUpperCase();
  if (NAV_AIRPORTS[clean]) {
    const apt = NAV_AIRPORTS[clean];
    return { ident: apt.icao, type: 'AIRPORT', lat: apt.lat, lon: apt.lon };
  }
  if (NAV_FIXES[clean]) {
    const fix = NAV_FIXES[clean];
    return { ident: fix.ident, type: fix.type, lat: fix.lat, lon: fix.lon };
  }
  return null;
}
