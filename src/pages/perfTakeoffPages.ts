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

  if (state.subPageIndex === 2) {
    const cgVal = state.weights.takeoffCg ?? 29.0;
    const oatSign = state.atmosphere.surfaceOatC >= 0 ? '+' : '-';
    const oatStr = `${oatSign}${Math.abs(state.atmosphere.surfaceOatC)}°C`;
    const td = state.toDataset;
    const flexTempStr = td.flexTakeoff ? `+${td.flexTempC}°C` : '---';

    return {
      title: 'TAKEOFF INIT',
      pageNumber: '2/2',
      rows: [
        {
          labelLeft: 'FLAPS',
          left: `FLAP ${state.takeoffConfig.flap}`,
          leftColor: 'GREEN',
          right: 'OR>',
          rightColor: 'WHITE',
        },
        {
          labelLeft: 'TO CG',
          labelRight: 'TO TEMP',
          left: `${cgVal.toFixed(1)}%`,
          leftColor: 'GREEN',
          right: oatStr,
          rightColor: 'GREEN',
        },
        {
          labelCenter: 'MODE<-FLEX TO-->TEMP',
          left: td.flexTakeoff ? 'ON' : 'OFF',
          leftColor: 'GREEN',
          right: flexTempStr,
          rightColor: 'GREEN',
        },
        {
          labelCenter: 'MODE<-DATASET->ATTCS',
          left: state.takeoffConfig.thrustMode,
          leftColor: 'GREEN',
          right: td.attcs ? 'ON' : 'OFF',
          rightColor: 'GREEN',
        },
        {},
        {
          left: '<TO DATASET',
          leftColor: 'WHITE',
          right: 'TAKEOFF>',
          rightColor: 'WHITE',
        },
      ],
    };
  }

  const hdgDeg = rwyObj?.headingDeg ?? 93;
  const hdgStr = String(hdgDeg).padStart(3, '0');
  const elevFt = rwyObj?.elevationFt ?? 2459;
  const gwKg =
    state.weights.grossWeight !== null
      ? Math.round(state.weights.grossWeight * 1000)
      : 51800;

  const baro = state.atmosphere.altimeter;
  const baroStr =
    baro.unit === 'INHG' ? baro.value.toFixed(2) : `${baro.value}`;

  const sw = state.atmosphere.surfaceWind;
  const swStr = `${String(sw.direction).padStart(3, '0')}°/${String(sw.speed).padStart(2, '0')}`;

  // Compute headwind/tailwind and crosswind components relative to runway heading
  const relAngleRad = ((sw.direction - hdgDeg) * Math.PI) / 180;
  const hwComp = Math.round(sw.speed * Math.cos(relAngleRad));
  const xwComp = Math.round(sw.speed * Math.sin(relAngleRad));
  const hwArrow = hwComp >= 0 ? '↓' : '↑';
  const xwArrow = xwComp >= 0 ? '←' : '→';
  const windCompStr = `${hwArrow}${Math.abs(hwComp)} ${xwArrow}${Math.abs(xwComp)}`;

  const slopeSign = state.takeoffConfig.rwySlopePercent >= 0 ? '+' : '-';
  const slopeStr = `${slopeSign}${Math.abs(state.takeoffConfig.rwySlopePercent).toFixed(1)}%`;

  const cond = state.takeoffConfig.rwyCondition;
  const condStr =
    cond === 'DRY'
      ? '<-DRY/WET/CNTMNTD'
      : cond === 'WET'
        ? 'DRY/<-WET/CNTMNTD'
        : 'DRY/WET/<-CNTMNTD';

  return {
    title: 'TAKEOFF INIT',
    pageNumber: '1/2',
    rows: [
      {
        labelLeft: 'RWY HDG',
        labelRight: 'GROSS WT',
        left: `${hdgStr}°`,
        leftColor: 'GREEN',
        right: `${gwKg}KG`,
        rightColor: 'GREEN',
      },
      {
        labelLeft: 'P ALT/B SET',
        labelRight: 'ELEV',
        left: `${state.takeoffConfig.pressAltFt}/${baroStr}`,
        leftColor: 'GREEN',
        right: `${elevFt}`,
        rightColor: 'GREEN',
      },
      {
        labelLeft: 'RWY SLOPE',
        labelRight: 'WIND',
        left: slopeStr,
        leftColor: 'GREEN',
        right: swStr,
        rightColor: 'GREEN',
      },
      {
        labelLeft: 'RWY CONDITION',
        labelRight: 'WIND',
        left: condStr,
        leftColor: 'GREEN',
        right: windCompStr,
        rightColor: 'GREEN',
      },
      {
        right: 'SEND REQST>',
        rightColor: 'WHITE',
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

export function buildTakeoffFlapsPage(): McduScreenLayout {
  return {
    title: 'TAKEOFF FLAPS',
    pageNumber: '1/1',
    rows: [
      {
        left: '<FLAP-1',
        leftColor: 'GREEN',
        right: 'RETURN>',
        rightColor: 'WHITE',
      },
      {
        left: '<FLAP-2',
        leftColor: 'GREEN',
      },
      {
        left: '<FLAP-3',
        leftColor: 'GREEN',
      },
      {
        left: '<FLAP-4',
        leftColor: 'GREEN',
      },
      {},
      {},
    ],
  };
}

export function buildTakeoffVspeedsPage(state: FmsStoreState): McduScreenLayout {
  const ts = state.speeds.takeoffSpeeds;
  const vCheck = validateVSpeedsHierarchy(ts);

  const fmtSpd = (val: number | null) => (val !== null ? `${val} KT` : '---');
  const toPitchStr =
    ts.v1 !== null ? `${(ts.toPitchDeg ?? 8.2).toFixed(1)}°` : '---';

  return {
    title: 'TAKEOFF',
    pageNumber: '1/1',
    rows: [
      {
        labelLeft: 'V1',
        left: fmtSpd(ts.v1),
        leftColor: vCheck.v1Reverse ? 'WHITE' : 'GREEN',
        leftReverse: vCheck.v1Reverse,
      },
      {
        labelLeft: 'VR',
        labelRight: 'FLAPS',
        left: fmtSpd(ts.vr),
        leftColor: vCheck.vrReverse ? 'WHITE' : 'GREEN',
        leftReverse: vCheck.vrReverse,
        right: `${state.takeoffConfig.flap}`,
        rightColor: 'GREEN',
      },
      {
        labelLeft: 'V2',
        labelRight: 'PITCH TRIM',
        left: fmtSpd(ts.v2),
        leftColor: vCheck.v2Reverse ? 'WHITE' : 'GREEN',
        leftReverse: vCheck.v2Reverse,
        right: state.takeoffConfig.pitchTrim,
        rightColor: 'GREEN',
      },
      {
        labelLeft: 'VFS',
        labelRight: 'TO PITCH',
        left: fmtSpd(ts.vfs),
        leftColor: vCheck.vfsReverse ? 'WHITE' : 'GREEN',
        leftReverse: vCheck.vfsReverse,
        right: toPitchStr,
        rightColor: 'GREEN',
      },
      {
        left: '<LANDING',
        leftColor: 'WHITE',
        right: 'CLIMB>',
        rightColor: 'WHITE',
      },
      {
        left: '<TO INIT',
        leftColor: 'WHITE',
        right: 'DEP LIM>',
        rightColor: 'WHITE',
      },
    ],
  };
}

export function buildDepartureLimitPage(state: FmsStoreState): McduScreenLayout {
  const v2 = state.speeds.takeoffSpeeds.v2;
  const spdLimStr =
    state.altitude.departureSpeedLimit ??
    (v2 !== null ? `${v2 + 10}` : 'V2+10');

  return {
    title: 'DEPARTURE LIMIT',
    pageNumber: '1/1',
    rows: [
      {
        labelLeft: 'SPEED LIMIT',
        left: spdLimStr,
        leftColor: 'GREEN',
      },
      {
        labelLeft: 'AFE LIMIT',
        left: `${state.altitude.afeLimitFt}`,
        leftColor: 'GREEN',
      },
      {
        labelLeft: 'VNAV CAP AFE',
        left: `${state.altitude.vnavCaptureAfeFt}`,
        leftColor: 'GREEN',
      },
      {
        labelCenter: 'VNAV CAP<-EO->BANK LIM',
        left: `${state.altitude.vnavCaptureEoAfeFt ?? 1000}`,
        leftColor: 'GREEN',
        right: `${state.altitude.eoBankLimitDeg ?? 15}°`,
        rightColor: 'GREEN',
      },
      {},
      {
        left: '<TAKEOFF',
        leftColor: 'WHITE',
        right: 'FLT PLAN>',
        rightColor: 'WHITE',
      },
    ],
  };
}
