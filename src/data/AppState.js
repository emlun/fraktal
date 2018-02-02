import Immutable from 'immutable';
import Complex from 'complex.js';

import * as fractals from 'fractals/common';
import Dimensions from 'data/Dimensions';

const AppState = Immutable.Record({
  center: new Complex(-0.5, 0),
  computing: false,
  computeProgress: 0,
  dimensions: new Dimensions({
    height: 400,
    width: 400,
  }),
  fractal: 'mandelbrot',
  fractalParameters: Immutable.Map(),
  gradient: Immutable.fromJS([
    fractals.defaultGradientBottom,
    fractals.defaultGradientTop,
  ]),
  insideColor: Immutable.fromJS([0, 0, 0]),
  numColors: 50,
  matrix: [[]],
  scale: 3,
});
export default AppState;
