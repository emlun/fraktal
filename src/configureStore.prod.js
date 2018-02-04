import { createStore } from 'redux';


export default function configureStore(rootReducer) {
  return createStore(rootReducer);
}
