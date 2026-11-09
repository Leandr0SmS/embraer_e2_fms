/**
 * Navigation Index, Progress & Operational Sub-Page Builders (Step 9)
 * - NAV INDEX 1/2 & 2/2 (Page 10 Spec)
 * - PROGRESS 1/3 - 3/3 (Page 11 Spec)
 * - Operational Sub-Pages: CLIMB, CRUISE, DESCENT, LANDING, DEPARTURE, ARRIVAL, HOLD, FUEL_MGT, CONVERSION
 */

import { NAV_AIRPORTS } from '../data/navdb';
import { FmsStoreState } from '../store/useFmsStore';
import { McduScreenLayout } from '../types/fms';

export function buildNavIndexPage(state: FmsStoreState): McduScreenLayout {
  if (state.subPageIndex === 1) {
    return {
      title: 'NAV INDEX',
      pageNumber: '1/2',
      rows: [
        {
          left: '<DATALINK',
          leftColor: 'WHITE',
          right: 'ATC>',
          rightColor: 'WHITE',
        },
        {
          left: '<WPT LIST',
          leftColor: 'WHITE',
          right: 'FIX INFO>',
          rightColor: 'WHITE',
        },
        {
          left: '<FPL LIST',
          leftColor: 'WHITE',
          right: 'SEC FPL MENU>',
          rightColor: 'WHITE',
        },
        {
          left: '<PATTERNS',
          leftColor: 'WHITE',
          right: 'HOLD>',
          rightColor: 'WHITE',
        },
        {
          left: '<DEPARTURE',
          leftColor: 'WHITE',
          right: 'ARRIVAL>',
          rightColor: 'WHITE',
        },
        {
          left: '<FLT SUM',
          leftColor: 'WHITE',
          right: 'INDEX 2/2>',
          rightColor: 'WHITE',
        },
      ],
    };
  }

  return {
    title: 'NAV INDEX',
    pageNumber: '2/2',
    rows: [
      {
        left: '<POS SENSORS',
        leftColor: 'WHITE',
        right: 'POS INIT>',
        rightColor: 'WHITE',
      },
      {
        left: '<NAV IDENT',
        leftColor: 'WHITE',
        right: 'DATA LOAD>',
        rightColor: 'WHITE',
      },
      {
        left: '<CLOSEST APT',
        leftColor: 'WHITE',
        right: 'CROSS PTS>',
        rightColor: 'WHITE',
      },
      {
        left: '<CONVERSION',
        leftColor: 'WHITE',
        right: 'MAINTENANCE>',
        rightColor: 'WHITE',
      },
      {},
      {
        left: '<INDEX 1/2',
        leftColor: 'WHITE',
      },
    ],
  };
}

export function buildProgressPage(state: FmsStoreState): McduScreenLayout {
  const plan = state.flightPlan;
  const fromWpt = plan.waypoints[0];
  const toWpt = plan.waypoints[plan.activeWaypointIndex] ?? plan.waypoints[1];
  const destWpt = plan.waypoints[plan.waypoints.length - 1];

  if (state.subPageIndex === 1) {
    return {
      title: state.engineOutMode ? 'EO PROGRESS' : 'PROGRESS',
      titleColor: state.engineOutMode ? 'YELLOW' : 'WHITE',
      pageNumber: '1/3',
      rows: [
        {
          labelLeft: 'FROM',
          labelCenter: 'ATA / ALT',
          labelRight: 'FUEL',
          left: plan.origin,
          leftColor: 'YELLOW',
          center: '1214z  2459',
          centerColor: 'CYAN',
          right: `${state.weights.fuelOnBoard.toFixed(1)}G`,
          rightColor: 'CYAN',
          rightSize: 'SMALL',
        },
        {
          labelLeft: 'TO',
          labelCenter: 'DTG',
          labelRight: 'ETA',
          left: toWpt?.ident ?? 'VEXIM',
          leftColor: 'MAGENTA',
          center: `${Math.round(toWpt?.predictions.dtgNm ?? 18)}NM`,
          centerColor: 'CYAN',
          right: toWpt?.predictions.etaUtc ?? '1218z',
          rightColor: 'CYAN',
          rightSize: 'SMALL',
        },
        {
          labelLeft: 'DEST',
          labelCenter: 'DTG',
          labelRight: 'EFOB',
          left: plan.destination,
          leftColor: 'GREEN',
          center: `${destWpt?.predictions.cumulativeDtgNm ?? 210}NM`,
          centerColor: 'CYAN',
          right: `${(destWpt?.predictions.efobKg ?? 10.5).toFixed(1)}G`,
          rightColor: 'CYAN',
          rightSize: 'SMALL',
        },
        {
          labelLeft: 'WIND',
          labelRight: 'SAT / TAT',
          left: '280° / 042',
          leftColor: 'CYAN',
          leftSize: 'SMALL',
          right: '-42°C / -18°C',
          rightColor: 'CYAN',
          rightSize: 'SMALL',
        },
        {
          labelLeft: 'NAV 1',
          labelCenter: 'SENSOR / EPU',
          labelRight: 'NAV 2',
          left: state.radios.nav1Ident,
          leftColor: 'CYAN',
          leftSize: 'SMALL',
          center: 'GPS-D 0.04',
          centerColor: 'GREEN',
          right: state.radios.nav2Ident,
          rightColor: 'CYAN',
          rightSize: 'SMALL',
        },
        {
          left: '<FLT PLAN',
          leftColor: 'WHITE',
          right: 'NAV INDEX>',
          rightColor: 'WHITE',
        },
      ],
    };
  }

  return {
    title: 'PROGRESS',
    pageNumber: `${state.subPageIndex}/3`,
    rows: [
      {
        labelLeft: 'TAS',
        labelRight: 'GS',
        left: '448 KT',
        leftColor: 'CYAN',
        right: '472 KT',
        rightColor: 'CYAN',
      },
      {
        labelLeft: 'HEADWIND',
        labelRight: 'XWIND',
        left: '-14 KT',
        leftColor: 'CYAN',
        right: 'L 22 KT',
        rightColor: 'CYAN',
      },
      {
        labelLeft: 'FUEL USED',
        labelRight: 'FOB (GAUGE)',
        left: '0.8',
        leftColor: 'GREEN',
        right: state.weights.fuelOnBoard.toFixed(1),
        rightColor: 'CYAN',
      },
      {
        labelLeft: 'RNP',
        labelRight: 'EPU',
        left: '1.00 NM',
        leftColor: 'GREEN',
        right: '0.04 NM',
        rightColor: 'CYAN',
      },
      {
        labelLeft: 'FROM WPT',
        left: fromWpt?.ident ?? 'SBGR09L',
        leftColor: 'YELLOW',
      },
      {
        left: '<FLT PLAN',
        leftColor: 'WHITE',
        right: 'NAV INDEX>',
        rightColor: 'WHITE',
      },
    ],
  };
}

export function buildOperationalSubPage(state: FmsStoreState): McduScreenLayout {
  const sched = state.speeds.activeSchedule;

  switch (state.activePage) {
    case 'CLIMB':
      return {
        title: state.engineOutMode ? 'EO CLIMB' : 'ECON CLIMB',
        titleColor: state.engineOutMode ? 'YELLOW' : 'WHITE',
        pageNumber: '1/1',
        rows: [
          {
            labelLeft: 'CLB SPD',
            labelRight: 'CRZ ALT',
            left: `${sched.climbCasMach.cas}/.${Math.round(sched.climbCasMach.mach * 100)}`,
            leftColor: 'GREEN',
            right: state.altitude.cruiseAltitudeFt
              ? `FL${Math.round(state.altitude.cruiseAltitudeFt / 100)}`
              : 'FL280',
            rightColor: 'GREEN',
          },
          {
            labelLeft: 'SPD / ALT LIM',
            labelRight: 'TRANS ALT',
            left: `${state.speeds.limits.speedLimitAlt.speed}/${state.speeds.limits.speedLimitAlt.alt}`,
            leftColor: 'GREEN',
            right: `${state.altitude.transitionAltitudeFt}FT`,
            rightColor: 'CYAN',
          },
          {
            labelLeft: 'TOC ETA / DTG',
            labelRight: 'EFOB',
            left: '1226z / 58NM',
            leftColor: 'CYAN',
            leftSize: 'SMALL',
            right: '13.2G',
            rightColor: 'CYAN',
            rightSize: 'SMALL',
          },
          {},
          {},
          {
            left: '<PERF INDEX',
            leftColor: 'WHITE',
            right: 'FLT PLAN>',
            rightColor: 'WHITE',
          },
        ],
      };

    case 'CRUISE':
      return {
        title: state.engineOutMode ? 'EO CRUISE' : 'ECON CRUISE',
        titleColor: state.engineOutMode ? 'YELLOW' : 'WHITE',
        pageNumber: '1/1',
        rows: [
          {
            labelLeft: 'CRZ SPD',
            labelRight: 'CRZ ALT',
            left: `.${Math.round(sched.cruiseMach * 100)}M`,
            leftColor: 'GREEN',
            right: state.altitude.cruiseAltitudeFt
              ? `FL${Math.round(state.altitude.cruiseAltitudeFt / 100)}`
              : 'FL280',
            rightColor: 'GREEN',
          },
          {
            labelLeft: 'OPT ALT',
            labelRight: 'MAX ALT',
            left: `FL${Math.round((state.altitude.optimumAltitudeFt ?? 35000) / 100)}`,
            leftColor: 'CYAN',
            right: `FL${Math.round(state.altitude.certifiedCeilingFt / 100)}`,
            rightColor: 'CYAN',
          },
          {
            labelLeft: 'STEP TO',
            labelRight: 'SAVINGS',
            left: 'FL350',
            leftColor: 'GREEN',
            right: '+1.2%',
            rightColor: 'CYAN',
          },
          {
            labelLeft: 'TOD ETA / DTG',
            labelRight: 'DEST EFOB',
            left: '1248z / 142NM',
            leftColor: 'CYAN',
            leftSize: 'SMALL',
            right: '10.5G',
            rightColor: 'CYAN',
            rightSize: 'SMALL',
          },
          {},
          {
            left: '<PERF INDEX',
            leftColor: 'WHITE',
            right: 'FLT PLAN>',
            rightColor: 'WHITE',
          },
        ],
      };

    case 'DESCENT': {
      const altm = state.atmosphere.altimeter;
      const altmStr =
        altm.unit === 'INHG'
          ? `${altm.value.toFixed(2)} INHG`
          : `${altm.value} HPA`;
      return {
        title: 'ECON DESCENT',
        pageNumber: '1/1',
        rows: [
          {
            labelLeft: 'DES SPD',
            labelRight: 'FPA',
            left: `${sched.descentCasMach.cas}/.${Math.round(sched.descentCasMach.mach * 100)}`,
            leftColor: 'GREEN',
            right: '-3.0°',
            rightColor: 'CYAN',
          },
          {
            labelLeft: 'TRANS FL',
            labelRight: 'QNH / QFE',
            left: 'FL070',
            leftColor: 'GREEN',
            right: altmStr,
            rightColor: 'GREEN',
          },
          {
            labelLeft: 'TEMP COMP',
            labelRight: 'LDG OAT',
            left: state.atmosphere.tempCompensation.status,
            leftColor: 'CYAN',
            right: `${state.atmosphere.tempCompensation.landingOatC ?? 24}°C`,
            rightColor: 'GREEN',
          },
          {},
          {},
          {
            left: '<PERF INDEX',
            leftColor: 'WHITE',
            right: 'FLT PLAN>',
            rightColor: 'WHITE',
          },
        ],
      };
    }

    case 'LANDING': {
      const ls = state.speeds.landingSpeeds;
      return {
        title: 'LANDING INIT',
        pageNumber: '1/1',
        rows: [
          {
            labelLeft: 'VREF',
            labelRight: 'LDG FLAP',
            left: `${ls.vref ?? 126} KT`,
            leftColor: 'GREEN',
            right: 'FULL>',
            rightColor: 'GREEN',
          },
          {
            labelLeft: 'VAPP',
            labelRight: 'DEST RWY',
            left: `${ls.vapp ?? 131} KT`,
            leftColor: 'GREEN',
            right: `${state.flightPlan.destination} 02R`,
            rightColor: 'GREEN',
          },
          {
            labelLeft: 'VAC',
            labelRight: 'GA SPD',
            left: `${ls.vac ?? 138} KT`,
            leftColor: 'GREEN',
            right: `${ls.gaSpeed ?? 145} KT`,
            rightColor: 'GREEN',
          },
          {
            labelLeft: 'EST LDG WT',
            labelRight: 'ICE PROT',
            left: '48.1',
            leftColor: 'CYAN',
            right: 'OFF>',
            rightColor: 'WHITE',
          },
          {},
          {
            left: '<PERF INDEX',
            leftColor: 'WHITE',
            right: 'FLT PLAN>',
            rightColor: 'WHITE',
          },
        ],
      };
    }

    case 'HOLD': {
      const hc = state.holdConfig;
      const turnWord = hc.turn === 'R' ? 'RIGHT' : 'LEFT';
      const legUnit = hc.legMode === 'TIME' ? 'MIN' : 'NM';
      return {
        title: 'ACT HOLD',
        pageNumber: '1/1',
        rows: [
          {
            labelLeft: 'HOLD AT',
            labelRight: 'SPEED',
            left: hc.waypoint,
            leftColor: 'GREEN',
            right: '210 KTS',
            rightColor: 'CYAN',
          },
          {
            labelLeft: 'INBD CRS / DIR',
            labelRight: 'ENTRY',
            left: `${String(hc.course).padStart(3, '0')}° / ${turnWord}`,
            leftColor: 'GREEN',
            right: 'DIRECT',
            rightColor: 'CYAN',
          },
          {
            labelLeft: `LEG ${hc.legMode}`,
            labelRight: 'MODE',
            left: `${hc.legValue.toFixed(1)} ${legUnit}`,
            leftColor: 'GREEN',
            right: `${hc.legMode}>`,
            rightColor: 'WHITE',
          },
          {
            labelLeft: 'EFC TIME',
            labelRight: 'HOLD FUEL',
            left: '1245z',
            leftColor: 'CYAN',
            right: '1.1G',
            rightColor: 'CYAN',
          },
          {},
          {
            left: '<NAV INDEX',
            leftColor: 'WHITE',
            right: 'FLT PLAN>',
            rightColor: 'WHITE',
          },
        ],
      };
    }

    case 'DEPARTURE': {
      const apt = NAV_AIRPORTS[state.flightPlan.origin] ?? NAV_AIRPORTS.SBGR;
      const sids = Object.keys(apt.sids);
      return {
        title: `${apt.icao} DEPARTURE`,
        pageNumber: '1/1',
        rows: [
          {
            labelLeft: 'RUNWAYS',
            labelRight: 'SIDS',
            left: `*${state.flightPlan.runway ?? '09L'}`,
            leftColor: 'GREEN',
            right: `*${state.flightPlan.sid ?? sids[0] ?? 'VEXIM1A'}`,
            rightColor: 'GREEN',
          },
          {
            left: apt.runways[1]?.ident ?? '09R',
            leftColor: 'WHITE',
            right: sids[1] ?? 'CPN2A',
            rightColor: 'WHITE',
          },
          {
            left: apt.runways[2]?.ident ?? '27L',
            leftColor: 'WHITE',
            right: 'TRANSITION',
            rightColor: 'CYAN',
          },
          {},
          {},
          {
            left: '<NAV INDEX',
            leftColor: 'WHITE',
            right: 'FLT PLAN>',
            rightColor: 'WHITE',
          },
        ],
      };
    }

    case 'ARRIVAL': {
      const apt = NAV_AIRPORTS[state.flightPlan.destination] ?? NAV_AIRPORTS.SBRJ;
      const stars = Object.keys(apt.stars);
      return {
        title: `${apt.icao} ARRIVAL`,
        pageNumber: '1/1',
        rows: [
          {
            labelLeft: 'APPROACH',
            labelRight: 'STARS',
            left: `*${state.flightPlan.approach ?? 'RNP 02R'}`,
            leftColor: 'GREEN',
            right: `*${state.flightPlan.star ?? stars[0] ?? 'BUSPA1A'}`,
            rightColor: 'GREEN',
          },
          {
            left: 'RNP 20L',
            leftColor: 'WHITE',
            right: 'NONE',
            rightColor: 'WHITE',
          },
          {},
          {},
          {},
          {
            left: '<NAV INDEX',
            leftColor: 'WHITE',
            right: 'FLT PLAN>',
            rightColor: 'WHITE',
          },
        ],
      };
    }

    case 'FUEL_MGT':
    default:
      return {
        title: state.activePage === 'CONVERSION' ? 'CONVERSION' : 'FUEL MANAGEMENT',
        pageNumber: '1/1',
        rows: [
          {
            labelLeft: 'FUEL SOURCE',
            labelRight: 'FOB',
            left: state.weights.fuelSource,
            leftColor: 'GREEN',
            right: `${state.weights.fuelOnBoard.toFixed(1)}`,
            rightColor: 'GREEN',
          },
          {
            labelLeft: 'FUEL FLOW (TOTAL)',
            labelRight: 'RESERVE',
            left: '2.4 / HR',
            leftColor: 'CYAN',
            right: `${state.weights.fuelReserve.value} ${state.weights.fuelReserve.mode}`,
            rightColor: 'GREEN',
          },
          {},
          {},
          {},
          {
            left: '<PERF INDEX',
            leftColor: 'WHITE',
            right: 'FLT PLAN>',
            rightColor: 'WHITE',
          },
        ],
      };
  }
}
