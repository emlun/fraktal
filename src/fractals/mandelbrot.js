import Immutable from 'immutable';

import { contained } from './constants';


export const name = 'Mandelbrot set';
const defaultEscapeAbs = 2;

function check(c, iterationLimit, escapeAbs = defaultEscapeAbs) {
  let z = c;
  let i = 0;
  while (i < iterationLimit) {
    if (z.abs() >= escapeAbs) {
      return i;
    }

    z = z.mul(z).add(c);
    i += 1;
  }

  return contained;
}

export function makeCheck() {
  return check;
}

export const Parameters = Immutable.Record({
});
export const defaultParameters = new Parameters();
