/**
 * Central FMS Screen Layout Dispatcher
 * Maps any active McduPageId in Zustand state to its 14x24 McduScreenLayout
 */

import { FmsStoreState } from '../store/useFmsStore';
import { McduScreenLayout } from '../types/fms';
import {
  buildNavIdentPage,
  buildPositionInitPage,
  buildRadioPage,
} from './initPages';
import { buildActRtePage, buildActiveFltPlanPage } from './rteFplPages';
import {
  buildPerfIndexPage,
  buildPerfInitPage,
  buildTakeoffInitPage,
  buildTakeoffVspeedsPage,
} from './perfTakeoffPages';
import {
  buildNavIndexPage,
  buildOperationalSubPage,
  buildProgressPage,
} from './navProgressPages';

export function getActiveScreenLayout(state: FmsStoreState): McduScreenLayout {
  switch (state.activePage) {
    case 'RADIO':
      return buildRadioPage(state);
    case 'NAV_IDENT':
      return buildNavIdentPage(state);
    case 'POS_INIT':
      return buildPositionInitPage(state);
    case 'ACT_RTE':
      return buildActRtePage(state);
    case 'ACTIVE_FLT_PLAN':
      return buildActiveFltPlanPage(state);
    case 'PERF_INDEX':
      return buildPerfIndexPage(state);
    case 'PERF_INIT':
      return buildPerfInitPage(state);
    case 'TAKEOFF_INIT':
      return buildTakeoffInitPage(state);
    case 'TAKEOFF_VSPEEDS':
      return buildTakeoffVspeedsPage(state);
    case 'NAV_INDEX':
      return buildNavIndexPage(state);
    case 'PROGRESS':
      return buildProgressPage(state);
    default:
      return buildOperationalSubPage(state);
  }
}
