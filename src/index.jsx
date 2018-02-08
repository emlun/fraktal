import React from 'react';
import ReactDOM from 'react-dom';

import configureStore from 'configureStore';

import Root from 'components/Root';

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
const store = configureStore();

ReactDOM.render(
  <Root store={ store }/>,
  root
);

if (module.hot) {
  module.hot.accept();
}
