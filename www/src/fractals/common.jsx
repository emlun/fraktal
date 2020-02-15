import React from 'react';
import Complex from 'complex.js';
import Immutable from 'immutable';
import _ from 'underscore';

import * as julia from 'fractals/julia';
import * as mandelbrot from 'fractals/mandelbrot';

import { FractalView } from 'fraktal-wasm';


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

let W = 1;
let H = 1;
// let center = false;
// let topLeft = false;
// let btmRight = false;
let check = false;
// let iterationLimit = false;
// export let matrix = Immutable.List([]);

export let fractalView = FractalView.new(1, 1);

export function setView({
  // center: rawCenter,
  dimensions: { width, height },
  fractal,
  fractalParameters,
  iterationLimit: il,
  scale,
}) {
  // center = new Complex(rawCenter);
  W = width;
  H = height;
  // ({ topLeft, btmRight } = getLimits({ center, scale, W, H }));
  check = getFractal(fractal).makeCheck(fractalParameters);
  // iterationLimit = il;
  // matrix = Array(W);
  fractalView = FractalView.new(W, H);
}

export function computeNextRow() {
  if (check) {
    fractalView.compute(W);
    return true;
  } else {
    return false;
  }
}
