import Complex from 'complex.js';
import Immutable from 'immutable';

import Dimensions from 'data/Dimensions';


const Viewpoint = Immutable.Record({
  center: new Complex(0, 0),
  dimensions: new Dimensions(),
  scale: 3,
});
export default Viewpoint;
