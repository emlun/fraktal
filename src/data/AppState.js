import Immutable from 'immutable';

import * as mandelbrot from 'fractals/mandelbrot';
import Colors from 'data/Colors';
import Viewpoint from 'data/Viewpoint';
import SidebarState from 'data/Sidebar';
import WorkerState from 'data/WorkerState';

const AppState = Immutable.Record({
  colors: new Colors(),
  fractal: 'mandelbrot',
  fractalParameters: mandelbrot.defaultParameters,
  numColors: 50,
  sidebar: new SidebarState(),
  viewpoint: new Viewpoint(),
  worker: new WorkerState(),
});
export default AppState;