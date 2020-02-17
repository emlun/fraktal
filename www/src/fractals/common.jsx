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
