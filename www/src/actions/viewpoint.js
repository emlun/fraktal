export const SET_CENTER = 'SET_CENTER';
export const SET_SCALE = 'SET_SCALE';
export const ZOOM_IN = 'ZOOM_IN';
export const ZOOM_OUT = 'ZOOM_OUT';

export const setCenter = ({ x, y, aspectRatio }) => ({ type: SET_CENTER, x, y, aspectRatio });
export const setScale = scale => ({ type: SET_SCALE, scale });
export const zoomIn = () => ({ type: ZOOM_IN });
export const zoomOut = () => ({ type: ZOOM_OUT });
