/* eslint no-console: 'off', no-process-env: 'off' */

export function debug(...args) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
}
