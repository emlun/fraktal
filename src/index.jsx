import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';

import App from 'components/App';

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

ReactDOM.render(
  <AppContainer>
    <App/>
  </AppContainer>,
  root
);

if (module.hot) {
  module.hot.accept();
}
