import Complex from 'complex.js';

function step(z, c) {
  return z.mul(z).add(c);
}

function iterate(c, z, i = 0, escapeAbs = 2, iterationLimit = 255) {
  if (z.abs() >= escapeAbs) {
    return i;
  } else if (i >= iterationLimit) {
    return -1;
  } else {
    return iterate(c, step(z, c), i + 1, escapeAbs, iterationLimit);
  }
}

export function check(c) {
  return iterate(c, new Complex(0, 0));
}
