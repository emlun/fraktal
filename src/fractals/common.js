import Complex from 'complex.js';
import Immutable from 'immutable';

import * as mandelbrot from 'fractals/mandelbrot';
import { debug } from 'logging';

function getFractal(fractal) {
  switch (fractal) {
    case 'mandelbrot':
      return mandelbrot.check;
  }
}

export function getLimits({ center, scale, W, H }) {
  const aspectRatio = H / W;
  const w = scale;
  const h = scale * aspectRatio;
  const topLeft = center.add(new Complex(-w/2, h/2));
  const btmRight = center.add(new Complex(w/2, -h/2));
  return { topLeft, btmRight };
}

export function computeMatrix({
  dimensions: { width: W, height: H },
  center: rawCenter,
  fractal,
  scale,
  iterationLimit,
}) {
  const center = new Complex(rawCenter);
  debug('computeMatrix', W, H, center, scale, iterationLimit);

  const { topLeft, btmRight } = getLimits({ center, scale, W, H });
  const check = getFractal(fractal);

  return Immutable.Range(0, W).toJS().map(x =>
    Immutable.Range(0, H).toJS().map(y => {
      const c = new Complex(
        (btmRight.re - topLeft.re) * (x / W) + topLeft.re,
        (btmRight.im - topLeft.im) * (y / H) + topLeft.im
      );

      return check(c, iterationLimit);
    })
  );
}
