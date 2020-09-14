import { createStore } from 'redux';

import rootReducer from './reducers/index';

import DevTools from 'components/DevTools';


export default function configureStore() {
  const store = createStore(
    rootReducer,
    DevTools.instrument()
  );

  return store;
}
