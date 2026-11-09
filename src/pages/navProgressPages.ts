/**
 * Navigation Index, Progress & Operational Sub-Page Builders (Step 9)
 * - NAV INDEX 1/2 & 2/2 (Page 10 Spec)
 * - PROGRESS 1/3 - 3/3 (Page 11 Spec)
 * - Operational Sub-Pages: CLIMB, CRUISE, DESCENT, LANDING, DEPARTURE, ARRIVAL, HOLD, FUEL_MGT, CONVERSION
 */

import { NAV_AIRPORTS } from '../data/navdb';
import { FmsStoreState } from '../store/useFmsStore';
import { McduLskRow, McduScreenLayout } from '../types/fms';

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
          left: '<CROSS PTS',
          leftColor: 'WHITE',
          right: 'FLT SUM>',
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
        right: 'CONVERSION>',
        rightColor: 'WHITE',
      },
      {
        left: '<DATA LOAD',
        leftColor: 'WHITE',
        right: 'MAINTENANCE>',
        rightColor: 'WHITE',
      },
      {
        left: '<CLOSEST APT',
        leftColor: 'WHITE',
      },
      {},
      {},
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

    case 'LANDING_INIT': {
      const gwKg = Math.round((state.weights.grossWeight ?? 51.8) * 1000);
      const estLdgKg = Math.max(32000, gwKg - 3200);
      const baro = state.atmosphere.altimeter;
      const baroStr =
        baro.unit === 'INHG' ? baro.value.toFixed(2) : `${baro.value}`;
      const sw = state.atmosphere.surfaceWind;
      const swStr = `${String(sw.direction).padStart(3, '0')}°/${String(sw.speed).padStart(2, '0')}`;
      const oatC = state.atmosphere.tempCompensation.landingOatC ?? 24;
      const isCompPending = Boolean(state.speeds.landingSpeeds.isCompPending);

      return {
        title: 'LANDING INIT',
        pageNumber: '1/1',
        rows: [
          {
            labelLeft: 'LDG FLAP',
            labelRight: 'EST LDG WT',
            left: 'FULL>',
            leftColor: 'GREEN',
            right: `${estLdgKg}KG`,
            rightColor: 'GREEN',
          },
          {
            labelLeft: 'ICE PROT',
            labelRight: 'QNH',
            left: '<-OFF/ON',
            leftColor: 'GREEN',
            right: baroStr,
            rightColor: 'GREEN',
          },
          {
            labelLeft: 'WIND',
            labelRight: 'OAT',
            left: swStr,
            leftColor: 'GREEN',
            right: `+${oatC}°C`,
            rightColor: 'GREEN',
          },
          {},
          {
            left: `<ROAAS (${state.roaasEnabled ? 'ON' : 'OFF'})`,
            leftColor: 'WHITE',
            right: 'SEND REQST>',
            rightColor: 'WHITE',
          },
          {
            left: isCompPending ? '*INIT CONFIRMED' : '<CONF INIT',
            leftColor: isCompPending ? 'CYAN' : 'WHITE',
            leftReverse: !isCompPending,
            right: 'LANDING>',
            rightColor: 'WHITE',
          },
        ],
      };
    }

    case 'ROAAS':
      return {
        title: 'ROAAS',
        pageNumber: '1/1',
        rows: [
          {
            labelLeft: 'ROAAS MODE',
            left: state.roaasEnabled ? '<-ON/OFF' : 'ON/<-OFF',
            leftColor: 'GREEN',
          },
          {},
          {},
          {},
          {},
          {
            left: '<LANDING INIT',
            leftColor: 'WHITE',
          },
        ],
      };

    case 'LANDING': {
      const ls = state.speeds.landingSpeeds;
      const isComp = Boolean(ls.isCompPending);
      return {
        title: 'LANDING',
        pageNumber: '1/1',
        rows: [
          {
            labelLeft: 'VREF',
            labelRight: 'LDG FLAP',
            left: `${ls.vref ?? 126} KT`,
            leftColor: isComp ? 'WHITE' : 'GREEN',
            leftReverse: isComp,
            right: 'FULL>',
            rightColor: 'GREEN',
          },
          {
            labelLeft: 'VAPP',
            labelRight: 'DEST RWY',
            left: `${ls.vapp ?? 131} KT`,
            leftColor: isComp ? 'WHITE' : 'GREEN',
            leftReverse: isComp,
            right: `${state.flightPlan.destination} ${state.flightPlan.arrivalRunway ?? '02R'}`,
            rightColor: 'GREEN',
          },
          {
            labelLeft: 'VAC',
            labelRight: 'GA SPD',
            left: `${ls.vac ?? 138} KT`,
            leftColor: isComp ? 'WHITE' : 'GREEN',
            leftReverse: isComp,
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
          {
            left: isComp ? '■ACCEPT COMP' : '*COMP ACCEPTED',
            leftColor: isComp ? 'WHITE' : 'CYAN',
            leftReverse: isComp,
          },
          {
            left: '<LANDING INIT',
            leftColor: 'WHITE',
            right: 'FLT PLAN>',
            rightColor: 'WHITE',
          },
        ],
      };
    }

    case 'MISSED_APPROACH':
      return {
        title: 'MISSED APPROACH',
        pageNumber: '1/1',
        rows: [
          {
            labelLeft: 'DEST',
            labelRight: 'EO ACCEL ALT',
            left: state.flightPlan.destination,
            leftColor: 'GREEN',
            right: '1800FT',
            rightColor: 'GREEN',
          },
          {
            labelLeft: 'HOLD AT',
            left: state.flightPlan.alternateVia ?? 'GEP',
            leftColor: 'GREEN',
          },
          {},
          {},
          {},
          {
            left: '<FLT PLAN',
            leftColor: 'WHITE',
            right: 'ALTN FPL>',
            rightColor: 'WHITE',
          },
        ],
      };

    case 'ALTERNATE_FPL':
      return {
        title: 'ALTERNATE FPL',
        pageNumber: '1/1',
        rows: [
          {
            labelLeft: 'ALTN DEST',
            labelRight: 'VIA',
            left: state.flightPlan.alternate ?? 'SBGL',
            leftColor: 'GREEN',
            right: state.flightPlan.alternateVia ?? 'DIRECT',
            rightColor: 'GREEN',
          },
          {
            labelLeft: 'DTG',
            labelRight: 'ALTN FUEL',
            left: '135NM',
            leftColor: 'CYAN',
            right: `${Math.round((state.weights.alternateFuel ?? 1.2) * 1000)}KG`,
            rightColor: 'CYAN',
          },
          {},
          {},
          {},
          {
            left: '<FLT PLAN',
            leftColor: 'WHITE',
            right: 'ACTIVATE ALTN>',
            rightColor: 'WHITE',
            rightReverse: true,
          },
        ],
      };

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

    case 'ARRIVAL':
    case 'ARRIVAL_RUNWAYS':
    case 'ARRIVAL_STARS':
    case 'ARRIVAL_STAR_TRANS':
    case 'ARRIVAL_APPROACH':
    case 'ARRIVAL_APPR_TRANS': {
      const plan = state.modFlightPlan ?? state.flightPlan;
      const apt = NAV_AIRPORTS[plan.destination] ?? NAV_AIRPORTS.KMSP ?? NAV_AIRPORTS.SBRJ;
      const pa = state.pendingArrival;
      const hasPending = Boolean(
        pa.runway || pa.star || pa.starTransition || pa.approach || pa.approachTransition
      );

      if (state.activePage === 'ARRIVAL_RUNWAYS') {
        const rows: McduLskRow[] = [];
        for (let i = 0; i < 5; i++) {
          const rL = apt.runways[i];
          const rR = apt.runways[i + 5];
          rows.push({
            left: rL ? `<RW${rL.ident}` : undefined,
            leftColor: 'GREEN',
            right: rR ? `RW${rR.ident}>` : undefined,
            rightColor: 'GREEN',
          });
        }
        rows.push({ right: 'ARRIVAL>', rightColor: 'WHITE' });
        return {
          title: `${apt.icao} RUNWAYS`,
          pageNumber: '1/1',
          rows: [rows[0] ?? {}, rows[1] ?? {}, rows[2] ?? {}, rows[3] ?? {}, rows[4] ?? {}, rows[5] ?? {}],
        };
      }

      if (state.activePage === 'ARRIVAL_STARS') {
        const stars = Object.keys(apt.stars);
        const rows: McduLskRow[] = [];
        for (let i = 0; i < 5; i++) {
          rows.push({
            left: stars[i] ? `<${stars[i]}` : undefined,
            leftColor: 'GREEN',
          });
        }
        rows.push({ right: 'ARRIVAL>', rightColor: 'WHITE', rightReverse: true });
        return {
          title: `${apt.icao} STARs`,
          pageNumber: '1/1',
          rows: [rows[0] ?? {}, rows[1] ?? {}, rows[2] ?? {}, rows[3] ?? {}, rows[4] ?? {}, rows[5] ?? {}],
        };
      }

      if (state.activePage === 'ARRIVAL_STAR_TRANS') {
        const selStar = pa.star ?? plan.star ?? Object.keys(apt.stars)[0] ?? '';
        const transList = Object.keys(apt.starTransitions?.[selStar] ?? {});
        const rows: McduLskRow[] = [];
        for (let i = 0; i < 5; i++) {
          rows.push({
            left: transList[i] ? `<${transList[i]}` : undefined,
            leftColor: 'GREEN',
            right: i === 0 ? `${selStar}>` : undefined,
            rightColor: 'CYAN',
          });
        }
        rows.push({ right: 'ARRIVAL>', rightColor: 'WHITE', rightReverse: true });
        return {
          title: `${apt.icao} STAR TRANS`,
          pageNumber: '1/1',
          rows: [rows[0] ?? {}, rows[1] ?? {}, rows[2] ?? {}, rows[3] ?? {}, rows[4] ?? {}, rows[5] ?? {}],
        };
      }

      if (state.activePage === 'ARRIVAL_APPROACH') {
        const apprs = apt.approaches ?? ['ILS 30L', 'RNAV 30L'];
        const rows: McduLskRow[] = [];
        for (let i = 0; i < 5; i++) {
          rows.push({
            left: apprs[i] ? `<${apprs[i]}` : undefined,
            leftColor: 'GREEN',
          });
        }
        rows.push({ right: 'ARRIVAL>', rightColor: 'WHITE', rightReverse: true });
        return {
          title: `${apt.icao} APPROACHES`,
          pageNumber: '1/1',
          rows: [rows[0] ?? {}, rows[1] ?? {}, rows[2] ?? {}, rows[3] ?? {}, rows[4] ?? {}, rows[5] ?? {}],
        };
      }

      if (state.activePage === 'ARRIVAL_APPR_TRANS') {
        const selAppr = pa.approach ?? plan.approach ?? (apt.approaches?.[0] ?? 'ILS 30L');
        const transList = Object.keys(apt.approachTransitions?.[selAppr] ?? {});
        const rows: McduLskRow[] = [];
        for (let i = 0; i < 5; i++) {
          rows.push({
            left: transList[i] ? `<${transList[i]}` : undefined,
            leftColor: 'GREEN',
            right: i === 0 ? `${selAppr}>` : undefined,
            rightColor: 'CYAN',
          });
        }
        rows.push({ right: 'ARRIVAL>', rightColor: 'WHITE', rightReverse: true });
        return {
          title: `${apt.icao} APPR TRANS`,
          pageNumber: '1/1',
          rows: [rows[0] ?? {}, rows[1] ?? {}, rows[2] ?? {}, rows[3] ?? {}, rows[4] ?? {}, rows[5] ?? {}],
        };
      }

      return {
        title: `${apt.icao} ARRIVAL`,
        pageNumber: '1/1',
        rows: [
          {
            labelLeft: 'RUNWAY',
            labelCenter: 'ACTIVE  SELECTED',
            labelRight: 'RUNWAY',
            left: plan.arrivalRunway ? `RW${plan.arrivalRunway}` : '----',
            leftColor: 'GREEN',
            right: pa.runway ? `RW${pa.runway}>` : 'RUNWAY>',
            rightColor: pa.runway ? 'CYAN' : 'WHITE',
          },
          {
            labelLeft: 'STAR',
            labelRight: 'STAR',
            left: plan.star || '------',
            leftColor: 'GREEN',
            right: pa.star ? `${pa.star}>` : 'STAR>',
            rightColor: pa.star ? 'CYAN' : 'WHITE',
          },
          {
            labelLeft: 'TRANSITION',
            labelRight: 'TRANSITION',
            left: plan.starTransition || '------',
            leftColor: 'GREEN',
            right: pa.starTransition ? `${pa.starTransition}>` : 'TRANS>',
            rightColor: pa.starTransition ? 'CYAN' : 'WHITE',
          },
          {
            labelLeft: 'APPROACH',
            labelRight: 'APPROACH',
            left: plan.approach || '------',
            leftColor: 'GREEN',
            right: pa.approach ? `${pa.approach}>` : 'APPROACH>',
            rightColor: pa.approach ? 'CYAN' : 'WHITE',
          },
          {
            labelLeft: 'TRANSITION',
            labelRight: 'TRANSITION',
            left: plan.approachTransition || '------',
            leftColor: 'GREEN',
            right: pa.approachTransition ? `${pa.approachTransition}>` : 'TRANS>',
            rightColor: pa.approachTransition ? 'CYAN' : 'WHITE',
          },
          hasPending
            ? {
                left: '<CLEAR SEL',
                leftColor: 'WHITE',
                right: 'APPLY>',
                rightColor: 'WHITE',
                rightReverse: true,
              }
            : {
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
