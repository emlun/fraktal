import React from 'react';
import Complex from 'complex.js';
import Immutable from 'immutable';
import _ from 'underscore';

import * as julia from 'fractals/julia';
import * as mandelbrot from 'fractals/mandelbrot';


export const defaultGradientBottom = Immutable.fromJS({
  color: [0, 0, 0],
  id: _.uniqueId('gradient-pivot-'),
  value: 0,
});
export const defaultGradientTop = Immutable.fromJS({
  color: [255, 0, 255],
  id: _.uniqueId('gradient-pivot-'),
  value: 50,
});

const fractals = {
  julia,
  mandelbrot,
};

export function computePalette(rawGradient, numValues) {
  const sortedGradient = rawGradient.sortBy(item => item.get('value'));
  const bottom = (sortedGradient.first() || defaultGradientBottom).set('value', 0);
  const top = (sortedGradient.last() || defaultGradientTop).set('value', numValues - 1);
  const gradient = Immutable.List([bottom])
    .concat(sortedGradient)
    .push(top);

  return Immutable.Range(0, 3).map(c =>
    Immutable.List([gradient.first().getIn(['color', c])]).concat(gradient.skip(1).flatMap((pivot, prevIndex) => {
      const prev = gradient.get(prevIndex);
      const start = prev.get('value');
      const end = pivot.get('value');
      const diff = end - start;

      return Immutable.Range(1, diff + 1).map(segmentIndex =>
        prev.getIn(['color', c]) + (segmentIndex / diff * (pivot.getIn(['color', c]) - prev.getIn(['color', c])))
      );
    }))
  );
}

function NoParameterControls() {
  return <span/>;
}

export function getFractal(name) {
  return {
    ParameterControls: NoParameterControls,
    ...fractals[name],
  };
}

export function getLimits({ center, scale, W, H }) {
  const aspectRatio = H / W;
  const w = scale;
  const h = scale * aspectRatio;
  const topLeft = center.add(new Complex(-w / 2, h / 2));
  const btmRight = center.add(new Complex(w / 2, -h / 2));
  return { topLeft, btmRight };
}

let x = 0;
let W = 1;
let H = 1;
let center = false;
let topLeft = false;
let btmRight = false;
let check = false;
let iterationLimit = false;
export let matrix = Immutable.List([]);

export function setView({
  center: rawCenter,
  dimensions: { width, height },
  fractal,
  fractalParameters,
  iterationLimit: il,
  scale,
}) {
  center = new Complex(rawCenter);
  W = width;
  H = height;
  ({ topLeft, btmRight } = getLimits({ center, scale, W, H }));
  check = getFractal(fractal).makeCheck(fractalParameters);
  iterationLimit = il;
  matrix = Array(W);
}

export function computeNextColumn() {
  if (check) {
    matrix[x] = Immutable.Range(0, H)
      .toJS()
      .map(y => {
        const c = new Complex(
          ((btmRight.re - topLeft.re) * (x / W)) + topLeft.re,
          ((btmRight.im - topLeft.im) * (y / H)) + topLeft.im
        );
        return check(c, iterationLimit);
      });
    const prevx = x;
    x = (x + 1) % W;
    return prevx;
  } else {
    return false;
  }
}
