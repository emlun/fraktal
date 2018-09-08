import _ from 'underscore';
import Immutable from 'immutable';

import * as actions from 'actions/colors';
import Colors from 'data/Colors';


function parseColor(hexString) {
  return Immutable.List([
    parseInt(hexString.substring(1, 3), 16),
    parseInt(hexString.substring(3, 5), 16),
    parseInt(hexString.substring(5, 7), 16),
  ]);
}

function gradientReducer(state, action) {
  switch (action.type) {

    case actions.ADD_PIVOT: {
      const { index } = action;
      const pivot = state.get(index);
      const next = state.get(index + 1);
      if (next) {
        const middle = pivot
          .set('id', _.uniqueId('gradient-pivot-'))
          .set('value', Math.round((pivot.get('value') + next.get('value')) / 2.0))
          .set('color', pivot.get('color').zipWith((c1, c2) => Math.round((c1 + c2) / 2.0), next.get('color')));

        return state.insert(index + 1, middle);
      } else {
        return state.insert(
          index,
          state.get(index)
            .set('id', _.uniqueId('gradient-pivot-'))
        );
      }
    }

    case actions.DELETE_PIVOT:
      return state.delete(action.index);

    case actions.SET_PIVOT_COLOR:
      return state.setIn([action.index, 'color'], parseColor(action.color));

    case actions.SET_PIVOT_VALUE: {
      const { index, value } = action;
      return state.setIn(
        [index, 'value'],
        Math.max(
          Math.min(
            value,
            state.getIn([index + 1, 'value'], Infinity)
          ),
          index < 1 ? 0 : state.getIn([index - 1, 'value'], 0)
        )
      );
    }

    default:
      return state;
  }

}

function colorsRootReducer(state, action) {
  switch (action.type) {

    case actions.SET_INSIDE_COLOR:
      return state.set('inside', parseColor(action.color));

    default:
      return state;
  }
}

export default function colorsReducer(state = new Colors(), action) {
  return colorsRootReducer(state, action)
    .update('gradient', _(gradientReducer).partial(_, action))
  ;
}
