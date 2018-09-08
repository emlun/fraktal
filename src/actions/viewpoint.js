export const SET_CENTER = 'SET_CENTER';
export const SET_HEIGHT = 'SET_HEIGHT';
export const SET_SCALE = 'SET_SCALE';
export const SET_WIDTH = 'SET_WIDTH';
export const ZOOM_IN = 'ZOOM_IN';
export const ZOOM_OUT = 'ZOOM_OUT';

export const setCenter = center => ({ type: SET_CENTER, center });
export const setHeight = height => ({ type: SET_HEIGHT, height });
export const setScale = scale => ({ type: SET_SCALE, scale });
export const setWidth = width => ({ type: SET_WIDTH, width });
export const zoomIn = () => ({ type: ZOOM_IN });
export const zoomOut = () => ({ type: ZOOM_OUT });
