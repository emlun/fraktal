export const SET_FRACTAL = 'SET_FRACTAL';
export const SET_FRACTAL_PARAMETERS = 'SET_FRACTAL_PARAMETERS';
export const SET_NUM_COLORS = 'SET_NUM_COLORS';
export const TOGGLE_SIDEBAR = 'TOGGLE_SIDEBAR';

export const setFractal = fractal => ({ type: SET_FRACTAL, fractal });
export const setFractalParameters = parameters => ({ type: SET_FRACTAL_PARAMETERS, parameters });
export const setNumColors = numColors => ({ type: SET_NUM_COLORS, numColors });
export const toggleSidebar = () => ({ type: TOGGLE_SIDEBAR });
