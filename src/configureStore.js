/* eslint no-process-env: off, global-require: off */

function createStore() {
  if (process.env.NODE_ENV === 'production') {
    return require('./configureStore.prod');
  } else {
    return require('./configureStore.dev');
  }
}

module.exports = createStore();
