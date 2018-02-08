export const ADD_PIVOT = 'ADD_PIVOT';
export const DELETE_PIVOT = 'DELETE_PIVOT';
export const SET_PIVOT_VALUE = 'SET_PIVOT_VALUE';

export const addPivot = index => ({ type: ADD_PIVOT, index });
export const deletePivot = index => ({ type: DELETE_PIVOT, index });
export const setPivotValue = (index, value) => ({ type: SET_PIVOT_VALUE, index, value });
