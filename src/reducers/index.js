import _ from 'underscore';

import * as actions from 'actions';
import AppState from 'data/AppState';
import gradientReducer from './gradient';
import viewpointReducer from './viewpoint';

function rootReducer(state = new AppState(), action) {
  switch (action.type) {
    case 'SET_STATE':
      return action.state;

    case 'UPDATE_STATE':
      if (action.path) {
        return state.updateIn(action.path, action.updater);
      } else {
        return state.update(action.updater);
      }

    case actions.SET_NUM_COLORS:
      return state.set('numColors', action.numColors);

    default:
      return state;
  }
}

export default function indexReducer(state = new AppState(), action) {
  return rootReducer(state, action)
    .update('gradient', _(gradientReducer).partial(_, action))
    .update('viewpoint', _(viewpointReducer).partial(_, action))
  ;
}
