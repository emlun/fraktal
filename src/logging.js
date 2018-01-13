/* eslint no-console: 'off' */

export function debug(...args) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
}
