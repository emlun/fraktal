// A dependency graph that contains any wasm must all be imported
// asynchronously. This `bootstrap.js` file does the single async import, so
// that no one else needs to worry about it again.

// First make sure wasm is initialized correctly
import('fraktal-wasm')
  // Then launch the app
  .then(() => import('./index'))
  .catch(e => console.error('Error importing `index`:', e));
