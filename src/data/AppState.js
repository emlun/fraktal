import Immutable from 'immutable';

import * as mandelbrot from 'fractals/mandelbrot';
import Colors from 'data/Colors';
import Viewpoint from 'data/Viewpoint';

const AppState = Immutable.Record({
  colors: new Colors(),
  computing: false,
  computeProgress: 0,
  fractal: 'mandelbrot',
  fractalParameters: mandelbrot.defaultParameters,
  numColors: 50,
  matrix: [[]],
  viewpoint: new Viewpoint(),
});
export default AppState;
