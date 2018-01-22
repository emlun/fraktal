/* eslint-env worker */
import { computeMatrix } from 'fractals/common';
import { debug } from 'logging';

onmessage = function(e) {
  switch (e.data.type) {
    case 'compute-matrix': {
      const result = computeMatrix({
        ...e.data.data,
        notifyProgress: (completed, total) =>
          postMessage({
            data: { completed, total },
            type: 'compute-matrix-progress',
          })
        ,
      });
      postMessage({
        data: result,
        type: 'compute-matrix',
      });
      break;
    }

    default:
      debug('Ignoring message:', e);
  }
};
