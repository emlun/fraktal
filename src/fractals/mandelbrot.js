import Complex from 'complex.js';

import { contained } from './constants';


export const name = 'Mandelbrot set';
const defaultEscapeAbs = 2;

function step(z, c) {
  return z.mul(z).add(c);
}

function iterate(c, iterationLimit, escapeAbs = defaultEscapeAbs) {
  return function recur(z, i = 0) {
    if (z.abs() >= escapeAbs) {
      return i;
    } else if (i >= iterationLimit) {
      return contained;
    } else {
      return recur(step(z, c), i + 1);
    }
  };
}

function check(c, iterationLimit) {
  return iterate(c, iterationLimit)(new Complex(0, 0));
}

export function makeCheck() {
  return check;
}
