import { Color } from 'data/Colors';

export const ADD_PIVOT = 'ADD_PIVOT';
export const DELETE_PIVOT = 'DELETE_PIVOT';
export const SET_INSIDE_COLOR = 'SET_INSIDE_COLOR';
export const SET_PIVOT_COLOR = 'SET_PIVOT_COLOR';
export const SET_PIVOT_VALUE = 'SET_PIVOT_VALUE';

export interface AddPivot {
  type: typeof ADD_PIVOT,
  index: number,
}

export interface DeletePivot {
  type: typeof DELETE_PIVOT,
  index: number,
}

export interface SetInsideColor {
  type: typeof SET_INSIDE_COLOR,
  color: string,
}

export interface SetPivotColor {
  type: typeof SET_PIVOT_COLOR,
  index: number,
  color: string,
}

export interface SetPivotValue {
  type: typeof SET_PIVOT_VALUE,
  index: number,
  value: number,
}

export type ColorsAction = AddPivot | DeletePivot | SetInsideColor | SetPivotColor | SetPivotValue;

export const addPivot = (index: number): AddPivot => ({ type: ADD_PIVOT, index });
export const deletePivot = (index: number): DeletePivot => ({ type: DELETE_PIVOT, index });
export const setInsideColor = (color: string): SetInsideColor => ({ type: SET_INSIDE_COLOR, color });
export const setPivotColor = (index: number, color: string): SetPivotColor => ({ type: SET_PIVOT_COLOR, index, color });
export const setPivotValue = (index: number, value: number): SetPivotValue => ({ type: SET_PIVOT_VALUE, index, value });
