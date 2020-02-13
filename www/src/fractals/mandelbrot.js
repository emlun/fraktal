import Immutable from 'immutable';

import { contained } from './constants';

import { check } from 'fraktal-wasm';


export const name = 'Mandelbrot set';
const defaultEscapeAbs = 2.0;

function chck(c, iterationLimit) {
  return check(c.re, c.im, iterationLimit, defaultEscapeAbs) || contained;
}

export function makeCheck() {
  return chck;
}

export const Parameters = Immutable.Record({
});
export const defaultParameters = new Parameters();
