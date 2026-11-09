/**
 * Route & Flight Plan Page Builders (Step 7)
 * - ACT RTE 1/3 - 3/3 (Page 3 Spec)
 * - ACTIVE FLT PLAN 1/X & MOD FLT PLAN (Page 4 Spec)
 */

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

  if (state.subPageIndex === 1) {
    const offsetLabel = plan.lateralOffset
      ? `${plan.lateralOffset.side} ${plan.lateralOffset.distanceNm.toFixed(1)} NM`
      : '<OFFSET';

    return {
      title: state.modFlightPlan ? 'MOD RTE' : 'ACT RTE',
      pageNumber: '1/3',
      rows: [
        {
          labelLeft: 'ORIGIN',
          labelRight: 'DEST',
          left: plan.origin || '□□□□',
          leftColor: 'GREEN',
          right: plan.destination || '□□□□',
          rightColor: 'GREEN',
        },
        {
          labelLeft: 'RUNWAY',
          labelRight: 'ALTN',
          left: plan.runway || '---',
          leftColor: 'GREEN',
          right: plan.alternate || '----',
          rightColor: 'GREEN',
        },
        {
          labelLeft: 'CO ROUTE',
          labelRight: 'FLIGHT ID',
          left: plan.companyRoute || '--------',
          leftColor: 'GREEN',
          right: plan.flightId || '-------',
          rightColor: 'GREEN',
        },
        {
          labelLeft: plan.lateralOffset ? 'LAT OFFSET' : undefined,
          left: offsetLabel,
          leftColor: plan.lateralOffset ? 'GREEN' : 'WHITE',
          right: 'IVATE>',
          rightColor: 'CYAN',
          rightSize: 'SMALL',
        },
        {
          labelLeft: 'SID',
          labelRight: 'STAR',
          left: plan.sid ?? 'NONE',
          leftColor: 'CYAN',
          leftSize: 'SMALL',
          right: plan.star ?? 'NONE',
          rightColor: 'CYAN',
          rightSize: 'SMALL',
        },
        {
          left: '<PERF INIT',
          leftColor: 'WHITE',
          right: 'NEXT PAGE>',
          rightColor: 'WHITE',
        },
      ],
    };
  }

  // ACT RTE 2/3 & 3/3: VIA / TO Airway Legs
  const enrouteWpts = plan.waypoints.slice(1);
  const legRows: McduLskRow[] = [];

  for (let i = 0; i < 4; i++) {
    const w = enrouteWpts[i];
    if (w) {
      legRows.push({
        labelLeft: i === 0 ? 'VIA' : undefined,
        labelRight: i === 0 ? 'TO' : undefined,
        left: w.viaAirway ?? 'DIRECT',
        leftColor: 'GREEN',
        right: w.ident,
        rightColor: 'GREEN',
      });
    } else if (i === enrouteWpts.length) {
      legRows.push({
        labelLeft: 'AIRWAY / WPT',
        left: '-----.-----',
        leftColor: 'CYAN',
        leftSize: 'SMALL',
        right: '□□□□□',
      });
    } else {
      legRows.push({});
    }
  }

  return {
    title: state.modFlightPlan ? 'MOD RTE' : 'ACT RTE',
    pageNumber: `${state.subPageIndex}/3`,
    rows: [
      legRows[0] ?? {},
      legRows[1] ?? {},
      legRows[2] ?? {},
      legRows[3] ?? {},
      {
        labelCenter: 'AIRWAY STRING SYNTAX: START.AWY.END',
        center: 'EX: GUP.J102.ALS',
        centerColor: 'CYAN',
      },
      {
        left: '<PERF INIT',
        leftColor: 'WHITE',
        right: 'RTE 1/3>',
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
    const dtgText = `${wpt.predictions.etaUtc} ${Math.round(wpt.predictions.dtgNm)}NM`;

    wptRows.push({
      labelLeft: roleLabel,
      labelLeftColor: isFrom ? 'YELLOW' : isTo ? 'MAGENTA' : 'CYAN',
      labelCenter: 'ETA   DTG',
      labelRight: 'ALT / EFOB',
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
  const summaryRow: McduLskRow = destWpt
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

  const bottomRow: McduLskRow = isMod
    ? {
        left: '<ACTIVATE',
        leftColor: 'GREEN',
        leftReverse: true,
        right: 'CANCEL MOD>',
        rightColor: 'WHITE',
      }
    : {
        left: '<PERF DATA',
        leftColor: 'WHITE',
        right: 'PROGRESS>',
        rightColor: 'WHITE',
      };

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
