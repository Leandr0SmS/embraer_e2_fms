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
    const pfSign = state.perfFactorPercent >= 0 ? '+' : '';
    const rsvUnit = state.weights.fuelReserve.mode === 'MINUTES' ? 'MIN' : '';
    const rsvText =
      state.weights.fuelReserve.mode === 'MINUTES'
        ? `${state.weights.fuelReserve.value} ${rsvUnit}`
        : `${state.weights.fuelReserve.value.toFixed(1)}`;

    return {
      title: 'PERFORMANCE INIT',
      pageNumber: '1/3',
      rows: [
        {
          labelLeft: 'TAIL #',
          labelRight: 'PERF FACTOR',
          left: state.tailNumber,
          leftColor: 'GREEN',
          right: `${pfSign}${state.perfFactorPercent.toFixed(1)}%`,
          rightColor: 'GREEN',
        },
        {
          labelLeft: 'FUEL RESERVE',
          labelRight: 'RESERVE MODE',
          left: rsvText,
          leftColor: 'GREEN',
          right: `${state.weights.fuelReserve.mode}>`,
          rightColor: 'WHITE',
        },
        {
          labelLeft: 'TO / LDG ALW',
          left: `${state.weights.fuelAllowances.takeoff.toFixed(1)} / ${state.weights.fuelAllowances.landing.toFixed(1)}`,
          leftColor: 'GREEN',
        },
        {
          labelLeft: 'ALTN FUEL',
          left:
            state.weights.alternateFuel !== null
              ? state.weights.alternateFuel.toFixed(1)
              : '---',
          leftColor: 'GREEN',
          right: 'DLK PERF>',
          rightColor: 'WHITE',
        },
        {},
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
      direction: 270,
      speed: 35,
    };
    const windDisplay = `${String(wind.direction).padStart(3, '0')}° / ${String(wind.speed).padStart(3, '0')}`;

    const isaSign = state.atmosphere.isaDeviationC >= 0 ? '+' : '-';
    const isaDisplay = `${isaSign}${String(Math.abs(state.atmosphere.isaDeviationC)).padStart(2, '0')}°C`;

    const zfwDisplay =
      state.weights.zeroFuelWeight !== null
        ? state.weights.zeroFuelWeight.toFixed(1)
        : '□□.□';

    const cgDisplay =
      state.weights.takeoffCg !== null
        ? state.weights.takeoffCg.toFixed(1)
        : '□□.□';

    const gw = state.weights.grossWeight;
    const gwDisplay = gw !== null ? gw.toFixed(1) : '----';
    const isGwExceeded = gw !== null && gw > state.weights.maxGrossWeight;

    const optAlt = state.altitude.optimumAltitudeFt;
    const optAltStr = optAlt ? `FL${Math.round(optAlt / 100)}` : '-----';

    return {
      title: 'PERFORMANCE INIT',
      pageNumber: '2/3',
      rows: [
        {
          labelLeft: 'CRZ ALT',
          labelRight: 'PASS',
          left: crzAltDisplay,
          leftColor: crzAlt !== null ? 'GREEN' : 'CYAN',
          right: `${state.passengers}`,
          rightColor: 'GREEN',
        },
        {
          labelLeft: 'CRZ WIND',
          labelRight: 'ZFW',
          left: windDisplay,
          leftColor: 'GREEN',
          right: zfwDisplay,
          rightColor: state.weights.zeroFuelWeight !== null ? 'GREEN' : 'CYAN',
        },
        {
          labelLeft: 'ISA DEV',
          labelRight: `FOB (${state.weights.fuelSource})`,
          left: isaDisplay,
          leftColor: 'GREEN',
          right: state.weights.fuelOnBoard.toFixed(1),
          rightColor: 'GREEN',
        },
        {
          labelLeft: 'TAKEOFF CG',
          labelRight: 'GROSS WT',
          left: cgDisplay,
          leftColor: state.cgInvalidFlag
            ? 'WHITE'
            : state.weights.takeoffCg !== null
              ? 'GREEN'
              : 'CYAN',
          leftReverse: state.cgInvalidFlag,
          right: gwDisplay,
          rightColor: isGwExceeded ? 'YELLOW' : 'CYAN',
          rightSize: 'SMALL',
          rightReverse: isGwExceeded,
        },
        {
          labelLeft: 'OPT ALT',
          labelRight: 'MAX ALT',
          left: optAltStr,
          leftColor: 'CYAN',
          leftSize: 'SMALL',
          right: `FL${Math.round(state.altitude.certifiedCeilingFt / 100)}`,
          rightColor: 'CYAN',
          rightSize: 'SMALL',
        },
        {
          left: state.perfInitConfirmed ? '*INIT CONFIRMED' : '<CONFIRM INIT',
          leftColor: state.perfInitConfirmed ? 'CYAN' : 'WHITE',
          leftSize: state.perfInitConfirmed ? 'SMALL' : 'LARGE',
          leftReverse: !state.perfInitConfirmed,
          right: 'TAKEOFF INIT>',
          rightColor: 'WHITE',
        },
      ],
    };
  }

  // PERFORMANCE INIT 3/3
  const sched = state.speeds.activeSchedule;
  return {
    title: 'PERFORMANCE INIT',
    pageNumber: '3/3',
    rows: [
      {
        labelLeft: 'CLIMB SPD',
        labelRight: 'MODE',
        left: `${sched.climbCasMach.cas}/.${Math.round(sched.climbCasMach.mach * 100)}`,
        leftColor: 'GREEN',
        right: sched.climbMode,
        rightColor: 'CYAN',
        rightSize: 'SMALL',
      },
      {
        labelLeft: 'CRUISE SPD',
        labelRight: 'MODE',
        left: `.${Math.round(sched.cruiseMach * 100)}M`,
        leftColor: 'GREEN',
        right: sched.cruiseMode,
        rightColor: 'CYAN',
        rightSize: 'SMALL',
      },
      {
        labelLeft: 'DESCENT SPD',
        labelRight: 'MODE',
        left: `${sched.descentCasMach.cas}/.${Math.round(sched.descentCasMach.mach * 100)}`,
        leftColor: 'GREEN',
        right: sched.descentMode,
        rightColor: 'CYAN',
        rightSize: 'SMALL',
      },
      {
        labelLeft: 'TRANS ALT',
        labelRight: 'SPD LIM',
        left: `${state.altitude.transitionAltitudeFt}FT`,
        leftColor: 'GREEN',
        right: `${state.speeds.limits.speedLimitAlt.speed}/${state.speeds.limits.speedLimitAlt.alt}`,
        rightColor: 'CYAN',
        rightSize: 'SMALL',
      },
      {},
      {
        left: '<PERF INIT 2/3',
        leftColor: 'WHITE',
        right: 'TAKEOFF INIT>',
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
