import Immutable from 'immutable';

import Colors from 'data/Colors';
import Viewpoint from 'data/Viewpoint';

const AppState = Immutable.Record({
  colors: new Colors(),
  computing: false,
  computeProgress: 0,
  fractal: 'mandelbrot',
  fractalParameters: Immutable.Map(),
  numColors: 50,
  matrix: [[]],
  viewpoint: new Viewpoint(),
});
export default AppState;
