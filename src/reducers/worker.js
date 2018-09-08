import WorkerState from 'data/WorkerState';
import * as actions from 'actions/worker';


export default function workerReducer(state = new WorkerState(), action) {
  switch (action.type) {

    case actions.COMPUTATION_COMPLETED:
      return state
        .set('computing', false)
        .set('matrix', action.matrix)
      ;

    case actions.SET_COMPUTING:
      return state.set('computing', action.computing);

    default:
      return state;
  }
}
