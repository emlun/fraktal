import React from 'react';
import ReactDOM from 'react-dom';

import { createStore } from 'redux';
import { AppContainer } from 'react-hot-loader';
import { Provider } from 'react-redux';

import App from 'components/App';
import rootReducer from 'reducers';

import './index.css';


function getRoot() {
  const root = document.getElementById('app');
  if (root) {
    return root;
  } else {
    const newRoot = document.createElement('div');
    newRoot.id = 'app';
    document.body.appendChild(newRoot);
    return newRoot;
  }
}

const root = getRoot();

const store = createStore(rootReducer);

ReactDOM.render(
  <AppContainer>
    <Provider store={ store }>
      <App/>
    </Provider>
  </AppContainer>,
  root
);

if (module.hot) {
  module.hot.accept();
}
