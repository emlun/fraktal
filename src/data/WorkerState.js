import Immutable from 'immutable';


const WorkerState = Immutable.Record({
  computing: false,
  computeProgress: 0,
  matrix: [[]],
});
export default WorkerState;
