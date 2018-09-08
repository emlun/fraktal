import Complex from 'complex.js';
import Immutable from 'immutable';


const Viewpoint = Immutable.Record({
  center: new Complex(0, 0),
  scale: 3,
});
export default Viewpoint;
