export const SET_FRACTAL = 'SET_FRACTAL';
export const SET_FRACTAL_PARAMETERS = 'SET_FRACTAL_PARAMETERS';
export const SET_NUM_COLORS = 'SET_NUM_COLORS';
export const TOGGLE_SIDEBAR = 'TOGGLE_SIDEBAR';

export interface SetFractal {
  type: typeof SET_FRACTAL,
  fractal: string,
}

export interface SetFractalParameters {
  type: typeof SET_FRACTAL_PARAMETERS,
  parameters: {},
}

export interface SetNumColors {
  type: typeof SET_NUM_COLORS,
  numColors: number,
}

export interface ToggleSidebar {
  type: typeof TOGGLE_SIDEBAR,
}

export type Action = SetFractal | SetFractalParameters | SetNumColors | ToggleSidebar;

export const setFractal = (fractal: string): SetFractal => ({ type: SET_FRACTAL, fractal });
export const setFractalParameters = (parameters: {}): SetFractalParameters => ({ type: SET_FRACTAL_PARAMETERS, parameters });
export const setNumColors = (numColors: number): SetNumColors => ({ type: SET_NUM_COLORS, numColors });
export const toggleSidebar = (): ToggleSidebar => ({ type: TOGGLE_SIDEBAR });
