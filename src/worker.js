import { computeMatrix } from 'fractals/common';
import { debug } from 'logging';

onmessage = function(e) {
  switch (e.data.type) {
    case 'compute-matrix':
      const result = computeMatrix({
        ...e.data.data,
        notifyProgress: (completed, total) =>
          postMessage({
            type: 'compute-matrix-progress',
            data: { completed, total },
          })
        ,
      });
      postMessage({
        type: 'compute-matrix',
        data: result,
      });
      break;

    default:
      debug('Ignoring message:', e);
  }
};
