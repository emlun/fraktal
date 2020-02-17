import React from 'react';
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
