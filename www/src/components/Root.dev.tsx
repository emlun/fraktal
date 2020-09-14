import React from 'react';

import { hot } from 'react-hot-loader/root';
import { Provider } from 'react-redux';

import { Action } from 'actions';
import { AppState } from 'data/AppState';

import App from 'components/App';
import DevTools from 'components/DevTools';


interface Props {
  store: {
    dispatch: (action: Action) => {},
    getState: () => AppState,
  }
}

function Root({ store }: Props) {
  return <Provider store={ store }>
    <div>
      <App/>
      <DevTools/>
    </div>
  </Provider>;
}

export default hot(Root);
