import * as actions from 'actions/viewpoint';
import ViewpointState from 'data/Viewpoint';


export default function reducer(state = new ViewpointState(), action) {
  switch (action.type) {
    case actions.SET_CENTER:
      return state.set('center', action.center);

    case actions.SET_DIMENSIONS:
      return state
        .setIn(['dimensions', 'height'], action.height)
        .setIn(['dimensions', 'width'], action.width)
      ;

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
