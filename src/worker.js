import { computeMatrix } from 'fractals/common';
import { debug } from 'logging';

onmessage = function(e) {
  debug('Got message:', e, e.data);
  switch (e.data.type) {
    case 'compute-matrix':
      const result = computeMatrix(e.data.data);
      postMessage({
        type: 'compute-matrix',
        data: result,
      });
      break;

    default:
      debug('Ignoring message:', e);
  }
};
