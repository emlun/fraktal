export const COMPUTATION_COMPLETED = 'COMPUTATION_COMPLETED';
export const SET_COMPUTE_PROGRESS = 'SET_COMPUTE_PROGRESS';
export const SET_COMPUTING = 'SET_COMPUTING';

export const computationCompleted = matrix => ({ type: COMPUTATION_COMPLETED, matrix });
export const setComputeProgress = progress => ({ type: SET_COMPUTE_PROGRESS, progress });
export const setComputing = computing => ({ type: SET_COMPUTING, computing });
