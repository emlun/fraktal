import React from 'react';
import Complex from 'complex.js';
import Immutable from 'immutable';

import * as julia from 'fractals/julia';
import * as mandelbrot from 'fractals/mandelbrot';
import { debug } from 'logging';


export const defaultGradientBottom = Immutable.fromJS({ value: 0, color: [0, 0, 0] });
export const defaultGradientTop = Immutable.fromJS({ value: 50, color: [255, 0, 255] });

const fractals = {
  julia,
  mandelbrot,
};

export function computePalette(rawGradient, numValues) {
  const sortedGradient = rawGradient.sortBy(item => item.get('value'));
  const bottom = (sortedGradient.first() || defaultGradientBottom).set('value', 0);
  const top = (sortedGradient.last() || defaultGradientTop).set('value', numValues - 1);
  const gradient = Immutable.List([bottom]).concat(sortedGradient).push(top);

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

function NoParameterControls() { return <span/>; };

export function getFractal(name) {
  return {
    ParameterControls: NoParameterControls,
    ...(fractals[name]),
  };
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
  center: rawCenter,
  dimensions: { width: W, height: H },
  fractal,
  fractalParameters,
  iterationLimit,
  scale,
}) {
  const center = new Complex(rawCenter);
  debug('computeMatrix', W, H, center, scale, iterationLimit, fractal, fractalParameters);

  const { topLeft, btmRight } = getLimits({ center, scale, W, H });
  const check = getFractal(fractal).makeCheck(fractalParameters);

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
