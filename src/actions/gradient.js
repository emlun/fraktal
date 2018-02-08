export const ADD_PIVOT = 'ADD_PIVOT';
export const DELETE_PIVOT = 'DELETE_PIVOT';

export const addPivot = index => ({ type: ADD_PIVOT, index });
export const deletePivot = index => ({ type: DELETE_PIVOT, index });
