import Immutable from 'immutable';

import * as fractals from 'fractals/common';
import Viewpoint from 'data/Viewpoint';

const AppState = Immutable.Record({
  computing: false,
  computeProgress: 0,
  fractal: 'mandelbrot',
  fractalParameters: Immutable.Map(),
  gradient: Immutable.fromJS([
    fractals.defaultGradientBottom,
    fractals.defaultGradientTop,
  ]),
  insideColor: Immutable.fromJS([0, 0, 0]),
  numColors: 50,
  matrix: [[]],
  viewpoint: new Viewpoint(),
});
export default AppState;
