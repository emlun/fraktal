import { debug } from 'logging';

onmessage = function(e) {
  switch (e.data.type) {
    case 'add':
      add(e.data.data);
      break;

    default:
      debug('Ignoring message:', e);
  }
};

function add([a, b]) {
  postMessage(a + b);
}
