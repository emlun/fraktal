export const COMPUTATION_COMPLETED = 'COMPUTATION_COMPLETED';
export const SET_COMPUTING = 'SET_COMPUTING';

export const computationCompleted = matrix => ({ type: COMPUTATION_COMPLETED, matrix });
export const setComputing = computing => ({ type: SET_COMPUTING, computing });
