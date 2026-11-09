/**
 * Power-Up & System Initialization Page Builders (Step 6)
 * - RADIO 1/1 (Power-Up Default)
 * - NAV IDENT 1/1 (Page 1 Spec)
 * - POSITION INIT 1/1 (Page 2 Spec)
 */

import { AIRAC_METADATA } from '../data/navdb';
import { FmsStoreState } from '../store/useFmsStore';
import { McduScreenLayout } from '../types/fms';

export function buildRadioPage(state: FmsStoreState): McduScreenLayout {
  return {
    title: 'RADIO',
    pageNumber: '1/1',
    rows: [
      {
        labelLeft: 'COM 1',
        labelRight: 'COM 2',
        left: state.radios.com1Freq,
        leftColor: 'GREEN',
        right: state.radios.com2Freq,
        rightColor: 'GREEN',
      },
      {
        labelLeft: 'NAV 1',
        labelRight: 'NAV 2',
        left: state.radios.nav1Freq,
        leftColor: 'CYAN',
        right: state.radios.nav2Freq,
        rightColor: 'CYAN',
      },
      {
        labelLeft: 'XPDR',
        labelRight: 'TCAS MODE',
        left: state.radios.xpdrCode,
        leftColor: 'GREEN',
        right: 'TA/RA>',
        rightColor: 'WHITE',
      },
      {
        labelLeft: 'ADF 1',
        labelRight: 'ADF 2',
        left: '380.0',
        leftColor: 'CYAN',
        leftSize: 'SMALL',
        right: '410.0',
        rightColor: 'CYAN',
        rightSize: 'SMALL',
      },
      {
        labelCenter: 'PUSH ANY FMS KEY FOR NAV IDENT',
        center: state.hasVerifiedNavIdent ? 'FMS INITIALIZED' : 'FMS POWER UP',
        centerColor: state.hasVerifiedNavIdent ? 'GREEN' : 'YELLOW',
      },
      {
        left: '<BACKUP',
        leftColor: 'WHITE',
        right: 'NAV IDENT>',
        rightColor: 'WHITE',
      },
    ],
  };
}

export function buildNavIdentPage(state: FmsStoreState): McduScreenLayout {
  return {
    title: 'NAV IDENT',
    pageNumber: '1/1',
    rows: [
      {
        labelLeft: 'MODEL',
        labelRight: 'NAV DB',
        left: AIRAC_METADATA.aircraftModel,
        leftColor: 'GREEN',
        right: AIRAC_METADATA.cycle,
        rightColor: 'GREEN',
      },
      {
        labelLeft: 'ENGINES',
        labelRight: 'ACTIVE DATES',
        left: AIRAC_METADATA.engines,
        leftColor: 'GREEN',
        right: AIRAC_METADATA.activeDates,
        rightColor: 'GREEN',
      },
      {
        labelLeft: 'SOFTWARE',
        labelRight: 'INACTIVE DB',
        left: AIRAC_METADATA.softwareLoad,
        leftColor: 'GREEN',
        right: AIRAC_METADATA.inactiveDates,
        rightColor: 'WHITE',
        rightSize: 'SMALL',
      },
      {
        labelRight: 'DB PART NUMBER',
        left: '<LDG IDENT',
        leftColor: 'WHITE',
        right: AIRAC_METADATA.partNumber,
        rightColor: 'CYAN',
        rightSize: 'SMALL',
      },
      {
        labelLeft: 'DATE',
        labelRight: 'UTC',
        left: '09NOV26',
        leftColor: 'CYAN',
        leftSize: 'SMALL',
        right: '1214z',
        rightColor: 'CYAN',
        rightSize: 'SMALL',
      },
      {
        left: '<MAINTENANCE',
        leftColor: 'WHITE',
        right: 'POS INIT>',
        rightColor: 'WHITE',
        rightReverse: !state.positionInitialized,
      },
    ],
  };
}

export function buildPositionInitPage(state: FmsStoreState): McduScreenLayout {
  return {
    title: 'POSITION INIT',
    pageNumber: '1/1',
    rows: [
      {
        labelLeft: 'LAST POS',
        left: 'S23°37.4 W046°39.4',
        leftColor: 'GREEN',
        right:
          state.positionInitialized && state.posSource === 'LAST'
            ? '*LOADED'
            : 'LOAD>',
        rightColor:
          state.positionInitialized && state.posSource === 'LAST'
            ? 'CYAN'
            : 'WHITE',
      },
      {
        labelLeft: 'REF WPT',
        left: `${state.flightPlan.origin} ARP`,
        leftColor: 'GREEN',
        right:
          state.positionInitialized && state.posSource === 'REF'
            ? '*LOADED'
            : 'LOAD>',
        rightColor:
          state.positionInitialized && state.posSource === 'REF'
            ? 'CYAN'
            : 'WHITE',
      },
      {
        labelLeft: 'GPS 1 POS',
        left: 'S23°37.3 W046°39.5',
        leftColor: 'GREEN',
        right:
          state.positionInitialized && state.posSource === 'GPS'
            ? '*LOADED'
            : 'LOAD>',
        rightColor:
          state.positionInitialized && state.posSource === 'GPS'
            ? 'CYAN'
            : 'WHITE',
      },
      {
        labelLeft: 'SET POS',
        left: state.positionInitialized
          ? state.loadedPosCoords
          : '□□°□□.□ □□□°□□.□',
        leftColor: state.positionInitialized ? 'GREEN' : 'CYAN',
        leftSize: state.positionInitialized ? 'LARGE' : 'SMALL',
      },
      {},
      {
        left: '<POS SENSORS',
        leftColor: 'WHITE',
        right: 'RTE>',
        rightColor: 'WHITE',
      },
    ],
  };
}
