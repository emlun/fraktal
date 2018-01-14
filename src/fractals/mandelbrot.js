import Complex from 'complex.js';


export const name = 'Mandelbrot set';

function step(z, c) {
  return z.mul(z).add(c);
}

function iterate(c, z, iterationLimit = 255, i = 0, escapeAbs = 2) {
  if (z.abs() >= escapeAbs) {
    return i;
  } else if (i >= iterationLimit) {
    return -1;
  } else {
    return iterate(c, step(z, c), iterationLimit, i + 1, escapeAbs);
  }
}

function check(c, iterationLimit) {
  return iterate(c, new Complex(0, 0), iterationLimit);
}

export function makeCheck() {
  return check;
}
