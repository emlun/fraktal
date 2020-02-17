import Immutable from 'immutable';

import * as mandelbrot from 'fractals/mandelbrot';
import Colors from 'data/Colors';
import SidebarState from 'data/Sidebar';

const AppState = Immutable.Record({
  colors: new Colors(),
  fractal: 'mandelbrot',
  fractalParameters: mandelbrot.defaultParameters,
  numColors: 50,
  sidebar: new SidebarState(),
});
export default AppState;
