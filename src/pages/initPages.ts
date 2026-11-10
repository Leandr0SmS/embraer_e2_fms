/**
 * Power-Up & System Initialization Page Builders (Step 6)
 * - RADIO 1/1 (Power-Up Default)
 * - NAV IDENT 1/1 (Page 1 Spec)
 * - POSITION INIT 1/1 (Page 2 Spec)
 */

import { AIRAC_METADATA, NAV_DATABASES } from '../data/navdb';
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
  const db =
    NAV_DATABASES[state.activeNavDbId ?? 'NDB_2405_LATAM'] ??
    NAV_DATABASES.NDB_2405_LATAM;

  return {
    title: 'NAV IDENT',
    pageNumber: '1/1',
    rows: [
      {
        labelLeft: 'DATE',
        labelRight: 'ACTIVE NDB',
        left: AIRAC_METADATA.date,
        leftColor: 'CYAN',
        right: db.activeDates,
        rightColor: 'YELLOW',
      },
      {
        labelLeft: 'UTC',
        labelRight: 'NON-ACTIVE NDB',
        left: AIRAC_METADATA.utc,
        leftColor: 'CYAN',
        right: db.inactiveDates,
        rightColor: 'YELLOW',
      },
      {
        labelLeft: 'SW',
        labelRight: db.ndbVersion,
        labelRightColor: 'GREEN',
        left: db.softwareLoad,
        leftColor: 'GREEN',
        right: db.partNumber,
        rightColor: 'GREEN',
      },
      {
        right: db.subPartNumber,
        rightColor: 'CYAN',
        rightSize: 'SMALL',
      },
      {
        left: '<LDG IDENT',
        leftColor: 'WHITE',
      },
      {
        left: '<MAINTENANCE',
        leftColor: 'WHITE',
        right: state.positionInitialized ? 'RTE>' : 'POS INIT>',
        rightColor: 'WHITE',
        rightReverse: !state.positionInitialized,
      },
    ],
  };
}

export function buildPositionInitPage(state: FmsStoreState): McduScreenLayout {
  const isLastLoaded = state.positionInitialized && state.posSource === 'LAST';
  const isRefLoaded = state.positionInitialized && state.posSource === 'REF';
  const isGpsLoaded = state.positionInitialized && state.posSource === 'GPS';

  return {
    title: 'POSITION INIT',
    pageNumber: '1/1',
    rows: [
      {
        labelLeft: isLastLoaded ? 'LAST POS (LOADED)' : 'LAST POS',
        left: 'S23°37.4 W046°39.4',
        leftColor: 'GREEN',
        right: 'LOAD>',
        rightColor: 'WHITE',
      },
      {
        labelLeft: isRefLoaded
          ? `${state.flightPlan.origin} REF WPT (LOADED)`
          : `${state.flightPlan.origin} REF WPT`,
        left: 'S23°37.6 W046°39.3',
        leftColor: 'GREEN',
        right: 'LOAD>',
        rightColor: 'WHITE',
      },
      {
        labelLeft: isGpsLoaded ? 'GPS 1 POS (LOADED)' : 'GPS 1 POS',
        left: 'S23°37.3 W046°39.5',
        leftColor: 'GREEN',
        right: 'LOAD>',
        rightColor: 'WHITE',
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
