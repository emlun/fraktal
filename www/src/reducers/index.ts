import { combineReducers } from 'redux';

import { Action, SET_FRACTAL, SET_FRACTAL_PARAMETERS, SET_NUM_COLORS, TOGGLE_SIDEBAR } from 'actions';
import { AppState } from 'data/AppState';
import colorsReducer from './colors';

const indexReducer: (state: AppState, action: Action) => AppState =
  combineReducers({
    colors: colorsReducer,

    numColors(state: number = 50, action: Action) {
      if (action.type == SET_NUM_COLORS) {
        return action.numColors;
      } else {
        return state;
      }
    },

    sidebar(state: { expanded: boolean } = { expanded: true }, action: Action) {
      if (action.type == TOGGLE_SIDEBAR) {
        return {
          ...state,
          expanded: !state.expanded,
        };
      } else {
        return state;
      }
    },
  })
;
export default indexReducer;
