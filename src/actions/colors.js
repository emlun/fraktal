export const ADD_PIVOT = 'ADD_PIVOT';
export const DELETE_PIVOT = 'DELETE_PIVOT';
export const SET_INSIDE_COLOR = 'SET_INSIDE_COLOR';
export const SET_PIVOT_COLOR = 'SET_PIVOT_COLOR';
export const SET_PIVOT_VALUE = 'SET_PIVOT_VALUE';

export const addPivot = index => ({ type: ADD_PIVOT, index });
export const deletePivot = index => ({ type: DELETE_PIVOT, index });
export const setInsideColor = color => ({ type: SET_INSIDE_COLOR, color });
export const setPivotColor = (index, color) => ({ type: SET_PIVOT_COLOR, index, color });
export const setPivotValue = (index, value) => ({ type: SET_PIVOT_VALUE, index, value });
