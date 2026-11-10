/**
 * Route & Flight Plan Page Builders (Step 7)
 * - ACT RTE 1/3 - 3/3 (Page 3 Spec)
 * - ACTIVE FLT PLAN 1/X & MOD FLT PLAN (Page 4 Spec)
 */

import { NAV_AIRPORTS } from '../data/navdb';
import { FmsStoreState } from '../store/useFmsStore';
import {
  FmsWaypoint,
  McduColor,
  McduLskRow,
  McduScreenLayout,
} from '../types/fms';

function formatWaypointAltFuel(wpt: FmsWaypoint): {
  text: string;
  color: McduColor;
  size: 'SMALL' | 'LARGE';
  reverse: boolean;
} {
  const efobStr = `${wpt.predictions.efobKg.toFixed(1)}G`;
  const c = wpt.constraint;

  if (c && (c.altitudeValue1 !== undefined || c.speedConstraint !== undefined)) {
    let altStr = '';
    if (c.altitudeType === 'WINDOW' && c.altitudeValue1 && c.altitudeValue2) {
      altStr = `${Math.round(c.altitudeValue1 / 100)}A/${Math.round(c.altitudeValue2 / 100)}B`;
    } else if (c.altitudeValue1 !== undefined) {
      const base =
        c.altitudeValue1 >= 10000
          ? `FL${Math.round(c.altitudeValue1 / 100)}`
          : `${c.altitudeValue1}`;
      const suffix =
        c.altitudeType === 'AT_OR_ABOVE'
          ? 'A'
          : c.altitudeType === 'AT_OR_BELOW'
            ? 'B'
            : '';
      altStr = `${base}${suffix}`;
    }

    if (c.speedConstraint !== undefined) {
      const spdStr =
        c.speedConstraint < 1
          ? `.${Math.round(c.speedConstraint * 100)}`
          : `${c.speedConstraint}`;
      return {
        text: altStr ? `${spdStr}/${altStr}` : `${spdStr}KT ${efobStr}`,
        color: 'GREEN',
        size: 'LARGE',
        reverse: Boolean(c.isIrrational),
      };
    }

    return {
      text: `${altStr} ${efobStr}`,
      color: 'GREEN',
      size: 'LARGE',
      reverse: Boolean(c.isIrrational),
    };
  }

  const predAlt = wpt.predictions.predictedAltitudeFt;
  const altDisplay =
    predAlt >= 10000 ? `FL${Math.round(predAlt / 100)}` : `${predAlt}FT`;
  return {
    text: `${altDisplay} ${efobStr}`,
    color: 'CYAN',
    size: 'SMALL',
    reverse: false,
  };
}

export function buildActRtePage(state: FmsStoreState): McduScreenLayout {
  const plan = state.modFlightPlan ?? state.flightPlan;
  const isMod = Boolean(state.modFlightPlan);

  if (state.subPageIndex === 1) {
    const offsetLabel = plan.lateralOffset
      ? `${plan.lateralOffset.side} ${plan.lateralOffset.distanceNm.toFixed(1)} NM`
      : '<OFFSET';
    const hasDest = Boolean(plan.destination);
    const rwyDisplay = plan.runway
      ? plan.runway.startsWith('RW')
        ? plan.runway
        : plan.runway
      : '';

    return {
      title: isMod ? 'MOD RTE' : 'ACT RTE',
      titleColor: isMod ? 'YELLOW' : 'WHITE',
      pageNumber: hasDest ? '1/3' : '1/2',
      rows: [
        {
          labelLeft: 'ORIGIN',
          labelRight: 'DEST',
          left: plan.origin || '□□□□',
          leftColor: plan.origin ? 'GREEN' : 'CYAN',
          right: plan.destination || '□□□□□',
          rightColor: hasDest ? (isMod ? 'CYAN' : 'GREEN') : 'GREEN',
        },
        {
          labelLeft: 'RUNWAY',
          labelRight: hasDest ? 'ALTN DEST' : undefined,
          left: rwyDisplay,
          leftColor: 'GREEN',
          right: hasDest ? plan.alternate || '-----' : '',
          rightColor: plan.alternate ? (isMod ? 'CYAN' : 'GREEN') : 'GREEN',
        },
        {
          labelRight: 'CO ROUTE',
          left: '<DLK FPL',
          leftColor: 'WHITE',
          right:
            plan.companyRoute ||
            (hasDest ? `${plan.origin}-${plan.destination}` : '--------'),
          rightColor: plan.companyRoute ? 'GREEN' : hasDest ? 'WHITE' : 'GREEN',
        },
        {
          labelLeft: 'FPL REQST',
          labelRight: 'FPL REPORT',
          left: hasDest ? '<SEND' : '',
          leftColor: 'WHITE',
        },
        {
          labelLeft: plan.lateralOffset ? 'LAT OFFSET' : undefined,
          labelRight: 'FLIGHT ID',
          left: offsetLabel,
          leftColor: plan.lateralOffset ? 'GREEN' : 'WHITE',
          right: plan.flightId || '--------',
          rightColor: plan.flightId ? (isMod ? 'WHITE' : 'GREEN') : 'GREEN',
        },
        isMod
          ? {
              left: '<CANCEL',
              leftColor: 'WHITE',
              right: 'ACTIVATE>',
              rightColor: 'WHITE',
            }
          : {
              left: '<FPL LIST',
              leftColor: 'WHITE',
              right: 'DEPARTURE>',
              rightColor: 'WHITE',
            },
      ],
    };
  }

  // ACT/MOD ALTN RTE (3/3)
  if (state.subPageIndex === 3) {
    const altnVia = plan.alternateVia;
    return {
      title: isMod ? 'MOD ALTN RTE' : 'ACT ALTN RTE',
      titleColor: isMod ? 'YELLOW' : 'WHITE',
      pageNumber: '3/3',
      rows: [
        {
          labelLeft: 'VIA',
          labelRight: 'TO',
          left: 'DIRECT',
          leftColor: 'GREEN',
          right: altnVia || plan.alternate || '-----',
          rightColor: plan.alternate ? 'GREEN' : 'CYAN',
        },
        altnVia
          ? {
              left: 'DIRECT',
              leftColor: 'GREEN',
              right: plan.alternate || '-----',
              rightColor: 'GREEN',
            }
          : {},
        {},
        {},
        {},
        isMod
          ? {
              left: '<CANCEL',
              leftColor: 'WHITE',
              right: 'ACTIVATE>',
              rightColor: 'WHITE',
            }
          : {
              left: '<ARRIVAL',
              leftColor: 'WHITE',
              right: 'PERF INIT>',
              rightColor: 'WHITE',
            },
      ],
    };
  }

  // ACT/MOD RTE 2/3: VIA / TO Airway & Procedure Legs
  const enrouteWpts = plan.waypoints.slice(1);
  const legRows: McduLskRow[] = [];

  // Compress consecutive waypoints on the same airway/SID into VIA -> TO summary rows
  const compressedLegs: Array<{ via: string; to: string }> = [];
  for (const w of enrouteWpts) {
    if (w.type === 'DISCONTINUITY') continue;
    const via = w.viaAirway ?? 'DIRECT';
    if (
      compressedLegs.length > 0 &&
      via !== 'DIRECT' &&
      compressedLegs[compressedLegs.length - 1].via === via
    ) {
      compressedLegs[compressedLegs.length - 1].to = w.ident;
    } else {
      compressedLegs.push({ via, to: w.ident });
    }
  }

  for (let i = 0; i < 5; i++) {
    const leg = compressedLegs[i];
    if (state.pendingAirway && i === Math.max(0, compressedLegs.length - 1)) {
      legRows.push({
        labelLeft: i === 0 ? 'VIA' : undefined,
        labelRight: i === 0 ? 'TO' : undefined,
        left: state.pendingAirway,
        leftColor: 'GREEN',
        center: 'THEN',
        centerColor: 'CYAN',
        right: '□□□□□',
        rightColor: 'CYAN',
      });
      if (i + 1 < 5) {
        legRows.push({
          center: '>>DISCONTINUITY<<',
          centerColor: 'WHITE',
        });
        i++;
      }
    } else if (leg) {
      const isHeadingManual = leg.via.startsWith('H') || leg.to === 'MANUAL';
      legRows.push({
        labelLeft: i === 0 ? 'VIA' : undefined,
        labelRight: i === 0 ? 'TO' : undefined,
        left: leg.via,
        leftColor: isHeadingManual ? 'CYAN' : 'GREEN',
        right: leg.to,
        rightColor: isHeadingManual ? 'CYAN' : 'GREEN',
      });
    } else {
      legRows.push({});
    }
  }

  return {
    title: isMod ? 'MOD RTE' : 'ACT RTE',
    titleColor: isMod ? 'YELLOW' : 'WHITE',
    pageNumber: '2/3',
    rows: [
      legRows[0] ?? {},
      legRows[1] ?? {},
      legRows[2] ?? {},
      legRows[3] ?? {},
      legRows[4] ?? {},
      isMod
        ? {
            left: '<CANCEL',
            leftColor: 'WHITE',
            right: 'ACTIVATE>',
            rightColor: 'WHITE',
          }
        : {
            left: '<ARRIVAL',
            leftColor: 'WHITE',
            right: 'PERF INIT>',
            rightColor: 'WHITE',
          },
    ],
  };
}

export function buildDeparturePages(state: FmsStoreState): McduScreenLayout {
  const plan = state.modFlightPlan ?? state.flightPlan;
  const apt = NAV_AIRPORTS[plan.origin] ?? NAV_AIRPORTS.SBGR;
  const pending = state.pendingDeparture;
  const hasPending = Boolean(pending.runway || pending.sid || pending.transition);

  if (state.activePage === 'DEPARTURE_RUNWAYS') {
    const rwys = apt.runways;
    const isSbgr = apt.icao === 'SBGR';
    const rows: McduLskRow[] = [];
    for (let i = 0; i < 5; i++) {
      // On SBGR (Page 8 of LATAM PDF), show the 4 main runways 10L, 10R, 28L, 28R on 1L..4L
      const leftRwy = isSbgr ? (i < 4 ? rwys[i] : undefined) : rwys[i];
      const rightRwy = isSbgr ? undefined : rwys[i + 5];
      const rwyPrefix = isSbgr ? '' : 'RW';
      rows.push({
        left: leftRwy ? `<${rwyPrefix}${leftRwy.ident}` : undefined,
        leftColor: 'GREEN',
        right: rightRwy ? `${rwyPrefix}${rightRwy.ident}>` : undefined,
        rightColor: 'GREEN',
      });
    }
    rows.push({
      right: 'DEPARTURE>',
      rightColor: 'WHITE',
    });
    return {
      title: `${apt.icao} RUNWAYS`,
      pageNumber: '1/1',
      rows: [
        rows[0] ?? {},
        rows[1] ?? {},
        rows[2] ?? {},
        rows[3] ?? {},
        rows[4] ?? {},
        rows[5] ?? {},
      ],
    };
  }

  if (state.activePage === 'DEPARTURE_SIDS') {
    const sids = Object.keys(apt.sids);
    const selRwy = pending.runway ?? plan.runway ?? apt.runways[0]?.ident ?? '09L';
    const hasTwoColumns = sids.length > 5;
    const rows: McduLskRow[] = [];
    for (let i = 0; i < 5; i++) {
      const sidName = sids[i];
      const rightSid = hasTwoColumns && i < 2 ? sids[i + 5] : undefined;
      rows.push({
        labelRight: !hasTwoColumns && i === 0 ? 'RUNWAY' : undefined,
        left: sidName ? `<${sidName}` : undefined,
        leftColor: 'GREEN',
        right: rightSid
          ? `${rightSid}>`
          : !hasTwoColumns && i === 0
            ? `RW${selRwy.replace(/^RW/, '')}>`
            : undefined,
        rightColor: rightSid ? 'GREEN' : 'CYAN',
      });
    }
    rows.push({
      right: 'DEPARTURE>',
      rightColor: 'WHITE',
      rightReverse: true,
    });
    return {
      title: `${apt.icao} SIDs`,
      pageNumber: '1/1',
      rows: [
        rows[0] ?? {},
        rows[1] ?? {},
        rows[2] ?? {},
        rows[3] ?? {},
        rows[4] ?? {},
        rows[5] ?? {},
      ],
    };
  }

  if (state.activePage === 'DEPARTURE_TRANS') {
    const selSid = pending.sid ?? plan.sid ?? Object.keys(apt.sids)[0] ?? 'OMNI';
    const selRwy = pending.runway ?? plan.runway ?? apt.runways[0]?.ident ?? '09L';
    const transMap = apt.sidTransitions?.[selSid] ?? {};
    const transNames = Object.keys(transMap);
    const rows: McduLskRow[] = [];
    for (let i = 0; i < 5; i++) {
      const tName = transNames[i];
      rows.push({
        labelRight: i === 0 ? 'RUNWAY' : i === 1 ? 'SID' : undefined,
        left: tName ? `<${tName}` : undefined,
        leftColor: 'GREEN',
        right:
          i === 0
            ? `RW${selRwy.replace(/^RW/, '')}>`
            : i === 1
              ? `${selSid}>`
              : undefined,
        rightColor: 'CYAN',
      });
    }
    rows.push({
      right: 'DEPARTURE>',
      rightColor: 'WHITE',
      rightReverse: true,
    });
    return {
      title: `${apt.icao} SID TRANS`,
      pageNumber: '1/1',
      rows: [
        rows[0] ?? {},
        rows[1] ?? {},
        rows[2] ?? {},
        rows[3] ?? {},
        rows[4] ?? {},
        rows[5] ?? {},
      ],
    };
  }

  // Default: <ORIGIN> DEPARTURE 1/1
  const actRwy = plan.runway ? `RW${plan.runway.replace(/^RW/, '')}` : '----';
  const selRwy = pending.runway ? `RW${pending.runway.replace(/^RW/, '')}>` : 'RUNWAY>';
  const actSid = plan.sid || '------';
  const selSid = pending.sid ? `${pending.sid}>` : 'SID>';
  const actTrans = plan.sidTransition || '------';
  const selTrans = pending.transition ? `${pending.transition}>` : 'TRANS>';

  return {
    title: `${apt.icao} DEPARTURE`,
    pageNumber: '1/1',
    rows: [
      {
        labelLeft: 'RUNWAY',
        labelCenter: 'ACTIVE  SELECTED',
        labelRight: 'RUNWAY',
        left: actRwy,
        leftColor: 'GREEN',
        right: selRwy,
        rightColor: pending.runway ? 'CYAN' : 'WHITE',
      },
      {
        labelLeft: 'SID',
        labelRight: 'SID',
        left: actSid,
        leftColor: 'GREEN',
        right: selSid,
        rightColor: pending.sid ? 'CYAN' : 'WHITE',
      },
      {
        labelLeft: 'TRANSITION',
        labelRight: 'TRANSITION',
        left: actTrans,
        leftColor: 'GREEN',
        right: selTrans,
        rightColor: pending.transition ? 'CYAN' : 'WHITE',
      },
      {},
      {},
      hasPending
        ? {
            left: '<CLEAR SEL',
            leftColor: 'WHITE',
            right: 'APPLY>',
            rightColor: 'WHITE',
            rightReverse: true,
          }
        : {
            left: '<RTE',
            leftColor: 'WHITE',
            right: 'TAKEOFF>',
            rightColor: 'WHITE',
          },
    ],
  };
}

export function buildActiveFltPlanPage(state: FmsStoreState): McduScreenLayout {
  const plan = state.modFlightPlan ?? state.flightPlan;
  const isMod = Boolean(state.modFlightPlan);
  const maxPages = Math.max(1, Math.ceil(plan.waypoints.length / 4));
  const pageIdx = Math.min(state.subPageIndex, maxPages);
  const startIdx = (pageIdx - 1) * 4;
  const pageWpts = plan.waypoints.slice(startIdx, startIdx + 4);

  const wptRows: McduLskRow[] = [];

  for (let i = 0; i < 4; i++) {
    const globalIdx = startIdx + i;
    const wpt = pageWpts[i];

    if (!wpt) {
      wptRows.push({});
      continue;
    }

    if (wpt.type === 'DISCONTINUITY') {
      wptRows.push({
        labelCenter: '--- ROUTE DISCONTINUITY ---',
        labelCenterColor: 'AMBER',
        left: '-----',
        leftColor: 'AMBER',
        center: 'THEN',
        centerColor: 'WHITE',
        right: '-----',
        rightColor: 'AMBER',
      });
      continue;
    }

    const isFrom = globalIdx === 0;
    const isTo = globalIdx === plan.activeWaypointIndex;
    const isDest = globalIdx === plan.waypoints.length - 1;

    const roleLabel = isFrom
      ? 'FROM'
      : isTo
        ? 'TO'
        : isDest
          ? 'DEST'
          : `NEXT (${wpt.viaAirway ?? 'DIR'})`;

    const wptColor: McduColor = isFrom
      ? 'YELLOW'
      : isTo
        ? 'MAGENTA'
        : 'GREEN';

    const altFuel = formatWaypointAltFuel(wpt);
    const brg = wpt.predictions.bearingDeg ?? 93;
    const dtgText = isFrom
      ? `${wpt.predictions.etaUtc}`
      : `${String(brg).padStart(3, '0')}° ${Math.round(wpt.predictions.dtgNm)}NM`;

    const phaseSpdLabel =
      state.flightPhase === 'CRUISE'
        ? 'CRZ SPD'
        : state.flightPhase === 'DESCENT'
          ? 'DES SPD'
          : state.flightPhase === 'APPROACH'
            ? 'APPR SPD'
            : 'CLB SPD';

    wptRows.push({
      labelLeft: roleLabel,
      labelLeftColor: isFrom ? 'YELLOW' : isTo ? 'MAGENTA' : 'CYAN',
      labelCenter: isFrom ? 'UTC' : 'BRG   DTG',
      labelRight: isFrom ? phaseSpdLabel : 'ALT / EFOB',
      left: state.directToMode && !isFrom ? `*${wpt.ident}` : wpt.ident,
      leftColor: wptColor,
      leftSize: 'LARGE',
      center: dtgText,
      centerColor: 'CYAN',
      centerSize: 'SMALL',
      right: altFuel.text,
      rightColor: altFuel.color,
      rightSize: altFuel.size,
      rightReverse: altFuel.reverse,
    });
  }

  const destWpt = plan.waypoints[plan.waypoints.length - 1];
  const summaryRow: McduLskRow =
    state.flightPhase === 'MISSED_APPROACH'
      ? {
          left: '<MISSED APPR',
          leftColor: 'WHITE',
          right: 'ALTN FPL>',
          rightColor: 'WHITE',
        }
      : destWpt
        ? {
            labelLeft: 'DEST SUMMARY',
            labelRight: 'TOTAL DTG / EFOB',
            left: plan.destination,
            leftColor: 'GREEN',
            center: destWpt.predictions.etaUtc,
            centerColor: 'CYAN',
            right: `${destWpt.predictions.cumulativeDtgNm}NM ${destWpt.predictions.efobKg.toFixed(1)}G`,
            rightColor: 'CYAN',
            rightSize: 'SMALL',
          }
        : {};

  let phaseBottomRow: McduLskRow = {
    left: '<PERF DATA',
    leftColor: 'WHITE',
    right: 'PROGRESS>',
    rightColor: 'WHITE',
  };

  if (state.flightPhase === 'CLIMB') {
    phaseBottomRow = {
      left: '<CLB DIR',
      leftColor: 'WHITE',
      right: 'PERF PLAN>',
      rightColor: 'WHITE',
    };
  } else if (state.flightPhase === 'CRUISE') {
    phaseBottomRow = {
      left: '<DES NOW',
      leftColor: 'WHITE',
      right: 'ARRIVAL>',
      rightColor: 'WHITE',
    };
  } else if (state.flightPhase === 'DESCENT') {
    phaseBottomRow = {
      left: '<DES DIR',
      leftColor: 'WHITE',
      right: 'ARRIVAL>',
      rightColor: 'WHITE',
    };
  } else if (
    state.flightPhase === 'APPROACH' ||
    state.flightPhase === 'MISSED_APPROACH'
  ) {
    phaseBottomRow = {
      left: '<ARRIVAL',
      leftColor: 'WHITE',
      right: 'LANDING>',
      rightColor: 'WHITE',
    };
  }

  const bottomRow: McduLskRow = isMod
    ? {
        left: '<ACTIVATE',
        leftColor: 'GREEN',
        leftReverse: true,
        right: 'CANCEL MOD>',
        rightColor: 'WHITE',
      }
    : phaseBottomRow;

  return {
    title: state.directToMode
      ? 'DIR TO FLT PLAN'
      : isMod
        ? 'MOD FLT PLAN'
        : 'ACTIVE FLT PLAN',
    titleColor: state.directToMode ? 'MAGENTA' : isMod ? 'YELLOW' : 'WHITE',
    pageNumber: `${pageIdx}/${maxPages}`,
    rows: [
      wptRows[0] ?? {},
      wptRows[1] ?? {},
      wptRows[2] ?? {},
      wptRows[3] ?? {},
      summaryRow,
      bottomRow,
    ],
  };
}
