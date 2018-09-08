import Immutable from 'immutable';

import * as fractals from 'fractals/common';


const Colors = Immutable.Record({
  inside: Immutable.List([0, 0, 0]),
  gradient: Immutable.fromJS([
    fractals.defaultGradientBottom,
    fractals.defaultGradientTop,
  ]),
});
export default Colors;
