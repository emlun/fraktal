import * as actions from 'actions/viewpoint';
import { computeNumberAt } from 'util/view';
import ViewpointState from 'data/Viewpoint';

export default function reducer(state = new ViewpointState(), action) {
  switch (action.type) {
    case actions.SET_CENTER: {
      const { x, y, aspectRatio } = action;
      return state.update('center', center => computeNumberAt({
        center,
        aspectRatio,
        scale: state.get('scale'),
        x,
        y,
      }));
    }

    case actions.SET_SCALE:
      return state.set('scale', action.scale);

    case actions.ZOOM_IN:
      return state.update('scale', scale => scale / 2);

    case actions.ZOOM_OUT:
      return state.update('scale', scale => scale * 2);

    default:
      return state;
  }
}
