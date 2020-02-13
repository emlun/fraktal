/* eslint global-require: off */
import { createStore } from 'redux';

import rootReducer from './reducers/index';

import DevTools from 'components/DevTools';


export default function configureStore() {
  const store = createStore(
    rootReducer,
    DevTools.instrument()
  );

  if (module.hot) {
    module.hot.accept('./reducers/index', () => {
      const nextRootReducer = require('./reducers/index').default;
      store.replaceReducer(nextRootReducer);
    });
  }

  return store;
}
