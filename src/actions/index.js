export const SET_FRACTAL = 'SET_FRACTAL';
export const SET_NUM_COLORS = 'SET_NUM_COLORS';

export const setFractal = fractal => ({ type: SET_FRACTAL, fractal });
export const setNumColors = numColors => ({ type: SET_NUM_COLORS, numColors });
