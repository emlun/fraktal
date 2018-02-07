import Complex from 'complex.js';

import * as actions from 'actions/viewpoint';
import ViewpointState from 'data/Viewpoint';


function computeNumberAt({ center, dimensions, scale, x, y }) {
  return center.add(
    new Complex(
      ((x / dimensions.get('width')) - 0.5) * scale,
      (0.5 - (x / dimensions.get('height'))) * scale * (dimensions.get('height') / dimensions.get('width'))
    )
  );
}

export default function reducer(state = new ViewpointState(), action) {
  switch (action.type) {
    case actions.CENTER_VIEW:
      return state.set('center', computeNumberAt({
        center: state.get('center'),
        dimensions: state.get('dimensions'),
        scale: state.get('scale'),
        x: action.x,
        y: action.y,
      }));

    case actions.SET_CENTER:
      return state.set('center', action.center);

    case actions.SET_HEIGHT:
      return state.setIn(['dimensions', 'height'], action.height);

    case actions.SET_SCALE:
      return state.set('scale', action.scale);

    case actions.SET_WIDTH:
      return state.setIn(['dimensions', 'width'], action.width);

    case actions.ZOOM_IN:
      return state.update('scale', scale => scale / 2);

    case actions.ZOOM_OUT:
      return state.update('scale', scale => scale * 2);

    default:
      return state;
  }
}
