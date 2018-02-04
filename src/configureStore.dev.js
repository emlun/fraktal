import { createStore } from 'redux';

import DevTools from 'components/DevTools';


export default function configureStore(rootReducer) {
  return createStore(
    rootReducer,
    DevTools.instrument()
  );
}
