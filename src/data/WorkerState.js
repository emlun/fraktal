import Immutable from 'immutable';


const WorkerState = Immutable.Record({
  computing: false,
  matrix: [[]],
});
export default WorkerState;
