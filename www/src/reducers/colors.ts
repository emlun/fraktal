import { combineReducers } from 'redux';
import _ from 'underscore';

import { ColorsAction, ADD_PIVOT, DELETE_PIVOT, SET_INSIDE_COLOR, SET_PIVOT_COLOR, SET_PIVOT_VALUE } from 'actions/colors';
import { Color, ColorsState, GradientPivot } from 'data/Colors';


const defaultState: ColorsState = {
  inside: [0, 0, 0],
  gradient: [
    {
      color: [0, 0, 0],
      id: _.uniqueId('gradient-pivot-'),
      value: 0,
    },
    {
      color: [255, 0, 255],
      id: _.uniqueId('gradient-pivot-'),
      value: 50,
    }
  ]
};

function parseColor(hexString: string): Color {
  return [
    parseInt(hexString.substring(1, 3), 16),
    parseInt(hexString.substring(3, 5), 16),
    parseInt(hexString.substring(5, 7), 16),
  ];
}

function gradientReducer(state: GradientPivot[] = defaultState.gradient, action: ColorsAction): GradientPivot[] {
  switch (action.type) {

    case ADD_PIVOT: {
      const { index } = action;
      const pivot = state[index];
      const next = state[index + 1];
      if (next) {
        let color: Color = [
          Math.round((pivot.color[0] + next.color[0]) / 2.0),
          Math.round((pivot.color[1] + next.color[1]) / 2.0),
          Math.round((pivot.color[2] + next.color[2]) / 2.0),
        ];
        const middle = {
          id: _.uniqueId('gradient-pivot-'),
          value: Math.round((pivot.value + next.value) / 2.0),
          color,
        };

        return [
          ...state.slice(0, index + 1),
          middle,
          ...state.slice(index + 1),
        ];
      } else {
        return [
          ...state,
          {
            ...pivot,
            id: _.uniqueId('gradient-pivot-'),
          },
        ];
      }
    }

    case DELETE_PIVOT:
      return [
        ...state.slice(0, action.index),
        ...state.slice(action.index + 1)
      ];

    case SET_PIVOT_COLOR:
      return [
        ...state.slice(0, action.index),
        {
          ...state[action.index],
          color: parseColor(action.color),
        },
        ...state.slice(action.index + 1)
      ];

    case SET_PIVOT_VALUE: {
      const { index, value } = action;
      return [
        ...state.slice(0, action.index),
        {
          ...state[action.index],
          value: Math.max(
            Math.min(
              value,
              state[index + 1]?.value || Infinity
            ),
            index < 1 ? 0 : (state[index - 1]?.value || 0)
          ),
        },
        ...state.slice(action.index + 1)
      ];
    }

    default:
      return state;
  }
}

function insideColorReducer(state: Color = defaultState.inside, action: ColorsAction): Color {
  switch (action.type) {

    case SET_INSIDE_COLOR:
      console.log('SET_INSIDE_COLOR', state, action);
      return parseColor(action.color);

    default:
      return state;
  }
}

const colorsReducer: (state: ColorsState, action: ColorsAction) => ColorsState =
  combineReducers({
    inside: insideColorReducer,
    gradient: gradientReducer
  })
;

export default (state: any, action: any) => {
  return colorsReducer(state, action);
};
