import AppState from 'data/AppState';

export default function rootReducer(state = new AppState(), action) {
  console.log('action:', action);

  switch (action.type) {
    case 'SET_STATE':
      return action.state;

    case 'UPDATE_STATE':
      if (action.path) {
        return state.updateIn(action.path, action.updater);
      } else {
        return state.update(action.updater);
      }

    default:
      console.log('Unknown action type:', action.type);
      return state;
  }
}
