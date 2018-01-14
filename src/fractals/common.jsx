import Complex from 'complex.js';
import Immutable from 'immutable';

import * as mandelbrot from 'fractals/mandelbrot';
import { debug } from 'logging';


export const defaultGradientBottom = Immutable.fromJS({ value: 0, color: [0, 0, 0] });
export const defaultGradientTop = Immutable.fromJS({ value: 50, color: [255, 0, 255] });

export function computePalette(rawGradient) {
  const bottom = (rawGradient.first() || defaultGradientBottom).set('value', 0);
  const gradient = Immutable.List([bottom]).concat(rawGradient);

  return Immutable.Range(0, 3).map(c => {
    return Immutable.List([gradient.first().getIn(['color', c])]).concat(gradient.skip(1).flatMap((pivot, prevIndex) => {
      const prev = gradient.get(prevIndex);
      const start = prev.get('value');
      const end = pivot.get('value');
      const diff = end - start;

      return Immutable.Range(1, diff + 1).map(segmentIndex =>
        prev.getIn(['color', c]) + (segmentIndex * 1.0 / diff) * (pivot.getIn(['color', c]) - prev.getIn(['color', c]))
      );
    }));
  });
}

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
