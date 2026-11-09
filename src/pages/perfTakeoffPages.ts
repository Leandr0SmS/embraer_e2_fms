/**
 * Performance & Takeoff Initialization Page Builders (Step 8)
 * - PERF INDEX 1/2 & 2/2 (Page 5 Spec)
 * - PERFORMANCE INIT 1/3 - 3/3 (Pages 6 & 7 Spec)
 * - TAKEOFF INIT 1/2 (Page 8 Spec)
 * - TAKEOFF VSPEEDS 2/2 (Page 9 Spec)
 */

import { NAV_AIRPORTS } from '../data/navdb';
import { validateVSpeedsHierarchy } from '../engine/scratchpadParser';
import { FmsStoreState } from '../store/useFmsStore';
import { McduScreenLayout } from '../types/fms';

export function buildPerfIndexPage(state: FmsStoreState): McduScreenLayout {
  if (state.subPageIndex === 1) {
    return {
      title: 'PERF INDEX',
      pageNumber: '1/2',
      rows: [
        {
          left: '<PERF INIT',
          leftColor: 'WHITE',
          right: 'CRUISE>',
          rightColor: 'WHITE',
        },
        {
          left: '<TAKEOFF',
          leftColor: 'WHITE',
          right: 'DES FORECAST>',
          rightColor: 'WHITE',
        },
        {
          left: '<DEP LIM',
          leftColor: 'WHITE',
          right: 'DESCENT>',
          rightColor: 'WHITE',
        },
        {
          left: '<CLIMB',
          leftColor: 'WHITE',
          right: 'APP SPD>',
          rightColor: 'WHITE',
        },
        {
          left: '<LANDING',
          leftColor: 'WHITE',
          right: 'GA LIM>',
          rightColor: 'WHITE',
        },
        {
          right: 'INDEX 2/2>',
          rightColor: 'WHITE',
        },
      ],
    };
  }

  return {
    title: 'PERF INDEX',
    pageNumber: '2/2',
    rows: [
      {
        left: '<FUEL MGT',
        leftColor: 'WHITE',
      },
      {
        left: '<EO RANGE',
        leftColor: 'WHITE',
      },
      {},
      {},
      {},
      {
        left: '<INDEX 1/2',
        leftColor: 'WHITE',
      },
    ],
  };
}

export function buildPerfInitPage(state: FmsStoreState): McduScreenLayout {
  if (state.subPageIndex === 1) {
    const pfVal = (1 + state.perfFactorPercent / 100).toFixed(2);
    const rsvUnit = state.weights.fuelReserve.mode === 'MINUTES' ? 'MIN' : 'KG';
    const rsvText =
      state.weights.fuelReserve.mode === 'MINUTES'
        ? `${state.weights.fuelReserve.value} ${rsvUnit}`
        : `${Math.round(state.weights.fuelReserve.value * 1000)}`;
    const toFuelKg = Math.round(state.weights.fuelAllowances.takeoff * 1000);
    const ldgFuelKg = Math.round(state.weights.fuelAllowances.landing * 1000);

    return {
      title: 'PERFORMANCE INIT-KG',
      pageNumber: '1/3',
      rows: [
        {
          labelLeft: 'TAIL #',
          labelRight: 'PERF FACTOR',
          left: state.tailNumber,
          leftColor: 'GREEN',
          right: pfVal,
          rightColor: 'GREEN',
        },
        {
          labelLeft: 'FUEL RESERVE',
          left: rsvText,
          leftColor: 'GREEN',
          right: 'OR>',
          rightColor: 'WHITE',
        },
        {
          labelLeft: 'TO/LDG FUEL',
          left: `${toFuelKg}/${ldgFuelKg}`,
          leftColor: 'GREEN',
        },
        {
          labelLeft: 'ALTN FUEL',
          left:
            state.weights.alternateFuel !== null
              ? `${Math.round(state.weights.alternateFuel * 1000)}`
              : '-----',
          leftColor: state.weights.alternateFuel !== null ? 'GREEN' : 'CYAN',
        },
        {
          right: 'SEND REQST>',
          rightColor: 'WHITE',
        },
        {
          right: 'NEXT PAGE>',
          rightColor: 'WHITE',
        },
      ],
    };
  }

  if (state.subPageIndex === 2) {
    const crzAlt = state.altitude.cruiseAltitudeFt;
    const crzAltDisplay =
      crzAlt === null
        ? '□□□□□'
        : crzAlt >= 10000
          ? `FL${String(Math.round(crzAlt / 100)).padStart(3, '0')}`
          : `${crzAlt}FT`;

    const wind = state.atmosphere.averageCruiseWind ?? {
      direction: 0,
      speed: 0,
    };
    const windDisplay = `${String(wind.direction).padStart(3, '0')}T/${wind.speed}`;

    const isaSign = state.atmosphere.isaDeviationC >= 0 ? '+' : '-';
    const isaDisplay = `${isaSign}${Math.abs(state.atmosphere.isaDeviationC)}°C`;

    const zfwDisplay =
      state.weights.zeroFuelWeight !== null
        ? `${Math.round(state.weights.zeroFuelWeight * 1000)}`
        : '□□□□□';

    const fobKg = Math.round(state.weights.fuelOnBoard * 1000);
    const fuelDisplay = `(${fobKg}) ${fobKg}`;

    const cgDisplay =
      state.weights.takeoffCg !== null
        ? `${state.weights.takeoffCg.toFixed(1)}%`
        : '□□.□%';

    const gw = state.weights.grossWeight;
    const gwKg = gw !== null ? Math.round(gw * 1000) : fobKg;
    const gwDisplay = `${gwKg}`;
    const isGwExceeded = gw !== null && gw > state.weights.maxGrossWeight;

    return {
      title: 'PERFORMANCE INIT-KG',
      pageNumber: '2/3',
      rows: [
        {
          labelLeft: 'CRZ ALT',
          labelRight: 'STEP INC',
          left: crzAltDisplay,
          leftColor: crzAlt !== null ? 'GREEN' : 'CYAN',
          right: `${state.altitude.stepIncrementFt ?? 0}`,
          rightColor: 'GREEN',
        },
        {
          labelLeft: 'CRZ WINDS',
          labelRight: 'ISA DEV',
          left: windDisplay,
          leftColor: 'GREEN',
          right: isaDisplay,
          rightColor: 'GREEN',
        },
        {
          labelLeft: 'PASS',
          labelRight: 'ZFW',
          left: `${state.passengers}`,
          leftColor: 'GREEN',
          right: zfwDisplay,
          rightColor: state.weights.zeroFuelWeight !== null ? 'GREEN' : 'CYAN',
        },
        {
          labelRight: `(${state.weights.fuelSource}) FUEL`,
          right: fuelDisplay,
          rightColor: 'GREEN',
        },
        {
          labelLeft: 'TO CG',
          labelRight: 'GROSS WT',
          left: cgDisplay,
          leftColor: state.cgInvalidFlag
            ? 'WHITE'
            : state.weights.takeoffCg !== null
              ? 'GREEN'
              : 'CYAN',
          leftReverse: state.cgInvalidFlag,
          right: gwDisplay,
          rightColor: isGwExceeded ? 'YELLOW' : 'GREEN',
          rightReverse: isGwExceeded,
        },
        {
          left: state.perfInitConfirmed ? '*INIT CONFIRMED' : '<CONFIRM INIT',
          leftColor: state.perfInitConfirmed ? 'CYAN' : 'WHITE',
          leftSize: state.perfInitConfirmed ? 'SMALL' : 'LARGE',
          leftReverse: !state.perfInitConfirmed,
          right: 'NEXT PAGE>',
          rightColor: 'WHITE',
        },
      ],
    };
  }

  // PERFORMANCE INIT-KG 3/3
  const sched = state.speeds.activeSchedule;
  const clbStr = `${sched.climbMode}(${sched.climbCasMach.cas}/.${Math.round(sched.climbCasMach.mach * 100)}M)`;
  const crzStr = `${sched.cruiseMode}(242/.${Math.round(sched.cruiseMach * 100)}M)`;
  const desStr = `${sched.descentMode}(${sched.descentCasMach.cas}/.${Math.round(sched.descentCasMach.mach * 100)}M)`;

  return {
    title: 'PERFORMANCE INIT-KG',
    pageNumber: '3/3',
    rows: [
      {
        labelLeft: 'CLIMB SPEED',
        left: clbStr,
        leftColor: 'GREEN',
        right: 'OR>',
        rightColor: 'WHITE',
      },
      {
        labelLeft: 'CRUISE SPEED',
        left: crzStr,
        leftColor: 'GREEN',
        right: 'OR>',
        rightColor: 'WHITE',
      },
      {
        labelLeft: 'DESCENT SPEED',
        left: desStr,
        leftColor: 'GREEN',
        right: 'OR>',
        rightColor: 'WHITE',
      },
      {
        labelLeft: 'COST INDEX',
        left: `${sched.costIndex ?? 30}`,
        leftColor: 'GREEN',
      },
      {},
      {
        left: '<PERF INIT 2/3',
        leftColor: 'WHITE',
        right: 'TO DATASET>',
        rightColor: 'WHITE',
      },
    ],
  };
}

export function buildCruiseModesPage(): McduScreenLayout {
  return {
    title: 'CRUISE MODES',
    pageNumber: '1/1',
    rows: [
      {
        left: '<MAX END (197/.52M)',
        leftColor: 'GREEN',
        right: 'RETURN>',
        rightColor: 'WHITE',
      },
      {
        left: '<LRC (241/.65M)',
        leftColor: 'GREEN',
      },
      {
        left: '<ECON (242/.65M)',
        leftColor: 'GREEN',
      },
      {
        left: '<SEL SPD (280/.78M)',
        leftColor: 'GREEN',
      },
      {},
      {},
    ],
  };
}

export function buildToDatasetPage(state: FmsStoreState): McduScreenLayout {
  const td = state.toDataset;
  const isToTempActive = state.activeKnobField === 'TO_TEMP';
  const isFlexTempActive = state.activeKnobField === 'FLEX_TEMP';

  const aiStr =
    td.refAntiIce === 'ALL'
      ? 'OFF ENG ALL<-'
      : td.refAntiIce === 'ENG'
        ? 'OFF ->ENG ALL'
        : '->OFF ENG ALL';

  return {
    title: 'T/O DATASET MENU',
    pageNumber: '1/1',
    rows: [
      {
        labelRight: 'ATTCS',
        left: `${td.thrustRating === 'TO-1' ? '*' : ' '}TO-1 (19K8)`,
        leftColor: 'GREEN',
        right: td.attcs ? 'OFF ON<-' : '->OFF ON',
        rightColor: 'GREEN',
      },
      {
        labelRight: 'REF ECS',
        left: `${td.thrustRating === 'TO-2' ? '*' : ' '}TO-2 (17K9)`,
        leftColor: 'GREEN',
        right: td.refEcs === 'ON' ? 'OFF ON<-' : '->OFF ON',
        rightColor: 'GREEN',
      },
      {
        labelRight: 'REF A/I',
        left: `${td.thrustRating === 'TO-3' ? '*' : ' '}TO-3 (17K1)`,
        leftColor: 'GREEN',
        right: aiStr,
        rightColor: 'GREEN',
      },
      {
        labelLeft: 'TO TEMP',
        labelRight: 'FLEX T/O',
        left: `${td.toTempC} C`,
        leftColor: isToTempActive ? 'CYAN' : 'GREEN',
        right: td.flexTakeoff ? 'OFF ON<-' : '->OFF ON',
        rightColor: 'GREEN',
      },
      {
        labelRight: 'FLEX TEMP',
        left: '■ENTER',
        leftColor: 'WHITE',
        leftReverse: !td.entered,
        right: td.flexTakeoff ? `C ${td.flexTempC} C` : '-----',
        rightColor: isFlexTempActive ? 'CYAN' : 'GREEN',
      },
      {
        left: '<TRS',
        leftColor: 'WHITE',
        right: 'FMS TAKEOFF>',
        rightColor: 'WHITE',
      },
    ],
  };
}

export function buildTakeoffInitPage(state: FmsStoreState): McduScreenLayout {
  const originApt = NAV_AIRPORTS[state.flightPlan.origin] ?? NAV_AIRPORTS.SBGR;
  const rwyObj =
    originApt.runways.find((r) => r.ident === state.flightPlan.runway) ??
    originApt.runways[0];

  const hdgStr = String(rwyObj?.headingDeg ?? 93).padStart(3, '0');
  const elevFt = rwyObj?.elevationFt ?? 2459;
  const gwStr =
    state.weights.grossWeight !== null
      ? state.weights.grossWeight.toFixed(1)
      : '51.8';

  const oatSign = state.atmosphere.surfaceOatC >= 0 ? '+' : '-';
  const oatStr = `${oatSign}${String(Math.abs(state.atmosphere.surfaceOatC)).padStart(2, '0')}°C`;

  const sw = state.atmosphere.surfaceWind;
  const swStr = `${String(sw.direction).padStart(3, '0')}° / ${String(sw.speed).padStart(2, '0')}`;

  const slopeSign = state.takeoffConfig.rwySlopePercent >= 0 ? '+' : '-';
  const slopeStr = `${slopeSign}${Math.abs(state.takeoffConfig.rwySlopePercent).toFixed(1)}%`;

  return {
    title: 'TAKEOFF INIT',
    pageNumber: '1/2',
    rows: [
      {
        labelLeft: 'RWY HDG / ELEV',
        labelRight: 'TAKEOFF GW',
        left: `${hdgStr}° / ${elevFt}FT`,
        leftColor: 'GREEN',
        right: gwStr,
        rightColor: 'GREEN',
      },
      {
        labelLeft: 'PRESS ALT / OAT',
        labelRight: 'SURFACE WIND',
        left: `${state.takeoffConfig.pressAltFt}FT / ${oatStr}`,
        leftColor: 'GREEN',
        right: swStr,
        rightColor: 'GREEN',
      },
      {
        labelLeft: 'RWY SLOPE',
        labelRight: 'RWY COND',
        left: slopeStr,
        leftColor: 'GREEN',
        right: `${state.takeoffConfig.rwyCondition}>`,
        rightColor: 'GREEN',
      },
      {
        labelLeft: 'AFE LIMIT',
        labelRight: 'VNAV CAP AFE',
        left: `${state.altitude.afeLimitFt}FT`,
        leftColor: 'GREEN',
        right: `${state.altitude.vnavCaptureAfeFt}FT`,
        rightColor: 'GREEN',
      },
      {},
      {
        left: '<PERF INIT',
        leftColor: 'WHITE',
        right: 'TAKEOFF VSPEEDS>',
        rightColor: 'WHITE',
      },
    ],
  };
}

export function buildTakeoffVspeedsPage(state: FmsStoreState): McduScreenLayout {
  const ts = state.speeds.takeoffSpeeds;
  const vCheck = validateVSpeedsHierarchy(ts);

  const fmtSpd = (val: number | null) => (val !== null ? `${val} KT` : '□□□ KT');

  return {
    title: 'TAKEOFF VSPEEDS',
    pageNumber: '2/2',
    rows: [
      {
        labelLeft: 'V1',
        labelRight: 'FLAP',
        left: fmtSpd(ts.v1),
        leftColor: vCheck.v1Reverse ? 'WHITE' : 'GREEN',
        leftReverse: vCheck.v1Reverse,
        right: `${state.takeoffConfig.flap}`,
        rightColor: 'GREEN',
      },
      {
        labelLeft: 'VR',
        labelRight: 'PITCH TRIM',
        left: fmtSpd(ts.vr),
        leftColor: vCheck.vrReverse ? 'WHITE' : 'GREEN',
        leftReverse: vCheck.vrReverse,
        right: state.takeoffConfig.pitchTrim,
        rightColor: 'GREEN',
      },
      {
        labelLeft: 'V2',
        labelRight: 'TO FLEX',
        left: fmtSpd(ts.v2),
        leftColor: vCheck.v2Reverse ? 'WHITE' : 'GREEN',
        leftReverse: vCheck.v2Reverse,
        right: `${state.atmosphere.flexTemperatureC ?? 48}°C`,
        rightColor: 'GREEN',
      },
      {
        labelLeft: 'VFS',
        labelRight: 'TAKEOFF RSVD',
        left: fmtSpd(ts.vfs),
        leftColor: vCheck.vfsReverse ? 'WHITE' : 'GREEN',
        leftReverse: vCheck.vfsReverse,
        right: state.takeoffConfig.thrustMode,
        rightColor: 'GREEN',
      },
      {},
      {
        left: '<TAKEOFF INIT',
        leftColor: 'WHITE',
        right: 'ACTIVE FLT PLAN>',
        rightColor: 'WHITE',
      },
    ],
  };
}
